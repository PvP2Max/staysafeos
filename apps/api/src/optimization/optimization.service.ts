import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { OsrmService } from "../osrm/osrm.service";
import { Coordinate } from "../osrm/dto/osrm.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  VanInput,
  RideInput,
  OptimizationResult,
  RideAssignment,
  VanTaskOrder,
  TaskOrder,
  InsertionCandidate,
} from "./dto/optimization.dto";

const DEFAULT_DEBOUNCE_MS = 2000;

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);
  private readonly debounceMs: number;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly osrmService: OsrmService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService
  ) {
    this.debounceMs = this.configService.get<number>(
      "OPTIMIZATION_DEBOUNCE_MS",
      DEFAULT_DEBOUNCE_MS
    );
  }

  /**
   * Trigger optimization for an organization (with debouncing)
   */
  async triggerOptimization(orgId: string): Promise<void> {
    // Clear existing timer for this org
    const existing = this.debounceTimers.get(orgId);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new debounced timer
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(orgId);
      try {
        await this.runOptimization(orgId);
      } catch (error) {
        this.logger.error(`Optimization failed for org ${orgId}: ${error}`);
      }
    }, this.debounceMs);

    this.debounceTimers.set(orgId, timer);
  }

  /**
   * Run optimization for an organization
   */
  async runOptimization(orgId: string): Promise<OptimizationResult | null> {
    this.logger.log(`Running optimization for org ${orgId}`);

    // Get pending unassigned rides with coordinates
    const pendingRides = await this.prisma.ride.findMany({
      where: {
        organizationId: orgId,
        status: "PENDING",
        vanId: null,
        pickupLat: { not: null },
        dropoffLat: { not: null },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (pendingRides.length === 0) {
      this.logger.log("No pending rides to optimize");
      return null;
    }

    // Get online vans with location
    const vans = await this.prisma.van.findMany({
      where: {
        organizationId: orgId,
        status: "IN_USE",
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        tasks: {
          where: { completedAt: null },
          orderBy: { position: "asc" },
          include: { ride: true },
        },
      },
    });

    if (vans.length === 0) {
      this.logger.log("No online vans available for optimization");
      return null;
    }

    // Build input for optimization
    const vanInputs: VanInput[] = vans.map((van) => ({
      id: van.id,
      currentLat: van.currentLat,
      currentLng: van.currentLng,
      capacity: van.capacity,
      passengerCount: van.passengerCount,
      pendingTasks: van.tasks.map((task) => ({
        id: task.id,
        rideId: task.rideId,
        type: task.type as "PICKUP" | "DROPOFF",
        position: task.position,
        lat: task.lat,
        lng: task.lng,
        passengerDelta:
          task.type === "PICKUP"
            ? task.ride?.passengerCount ?? 1
            : -(task.ride?.passengerCount ?? 1),
      })),
    }));

    const rideInputs: RideInput[] = pendingRides.map((ride) => ({
      id: ride.id,
      priority: ride.priority,
      passengerCount: ride.passengerCount,
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
    }));

    // Run the greedy insertion algorithm
    const result = await this.greedyInsertion(vanInputs, rideInputs);

    // Apply assignments to database
    await this.applyAssignments(orgId, result);

    // Emit optimization complete event
    this.eventEmitter.emit("optimization.complete", {
      orgId,
      result,
    });

    return result;
  }

  /**
   * Greedy insertion algorithm with capacity constraints
   *
   * Algorithm:
   * 1. Sort pending rides by priority (descending)
   * 2. For each pending ride:
   *    a. For each van, try all valid (pickup_pos, dropoff_pos) insertions
   *    b. Calculate added drive time via OSRM matrix
   *    c. Check capacity constraints at each point in route
   *    d. Select the insertion with minimum added time
   * 3. Return assignments and task orders
   */
  private async greedyInsertion(
    vans: VanInput[],
    rides: RideInput[]
  ): Promise<OptimizationResult> {
    const assignments: RideAssignment[] = [];
    const vanTaskOrders: Map<string, TaskOrder[]> = new Map();

    // Initialize van task orders from existing tasks
    for (const van of vans) {
      vanTaskOrders.set(
        van.id,
        van.pendingTasks.map((t) => ({
          taskId: t.id,
          rideId: t.rideId || undefined,
          type: t.type,
          position: t.position,
          lat: t.lat || 0,
          lng: t.lng || 0,
          passengerDelta:
            t.type === "PICKUP"
              ? Math.abs(t.passengerDelta || 1)
              : -Math.abs(t.passengerDelta || 1),
        }))
      );
    }

    // Process rides in priority order
    for (const ride of rides) {
      // Skip rides without coordinates
      if (!ride.pickupLat || !ride.pickupLng || !ride.dropoffLat || !ride.dropoffLng) {
        continue;
      }

      const pickupCoord: Coordinate = { lat: ride.pickupLat, lng: ride.pickupLng };
      const dropoffCoord: Coordinate = { lat: ride.dropoffLat, lng: ride.dropoffLng };

      let bestCandidate: InsertionCandidate | null = null;

      // Try each van
      for (const van of vans) {
        if (!van.currentLat || !van.currentLng) continue;

        const currentTasks = vanTaskOrders.get(van.id) || [];
        const candidates = await this.findValidInsertions(
          van,
          currentTasks,
          ride,
          pickupCoord,
          dropoffCoord
        );

        for (const candidate of candidates) {
          if (!bestCandidate || candidate.addedDuration < bestCandidate.addedDuration) {
            bestCandidate = candidate;
          }
        }
      }

      // Apply best insertion if found
      if (bestCandidate) {
        const currentTasks = vanTaskOrders.get(bestCandidate.vanId) || [];

        // Insert pickup and dropoff tasks
        const newTasks = this.insertTasks(
          currentTasks,
          ride,
          pickupCoord,
          dropoffCoord,
          bestCandidate.pickupPos,
          bestCandidate.dropoffPos
        );

        vanTaskOrders.set(bestCandidate.vanId, newTasks);

        assignments.push({
          rideId: ride.id,
          vanId: bestCandidate.vanId,
          pickupPosition: bestCandidate.pickupPos,
          dropoffPosition: bestCandidate.dropoffPos,
          addedDuration: bestCandidate.addedDuration,
        });
      }
    }

    // Calculate total duration
    let totalDuration = 0;
    for (const assignment of assignments) {
      totalDuration += assignment.addedDuration;
    }

    return {
      assignments,
      vanTaskOrders: Array.from(vanTaskOrders.entries()).map(([vanId, taskOrder]) => ({
        vanId,
        taskOrder,
      })),
      totalDuration,
      optimizedAt: new Date(),
    };
  }

  /**
   * Find all valid insertion positions for a ride in a van's task list
   */
  private async findValidInsertions(
    van: VanInput,
    currentTasks: TaskOrder[],
    ride: RideInput,
    pickupCoord: Coordinate,
    dropoffCoord: Coordinate
  ): Promise<InsertionCandidate[]> {
    const candidates: InsertionCandidate[] = [];
    const taskCount = currentTasks.length;

    // Build list of all waypoints for OSRM matrix
    const allCoords: Coordinate[] = [
      { lat: van.currentLat!, lng: van.currentLng! },
      ...currentTasks.filter(t => t.lat && t.lng).map((t) => ({ lat: t.lat, lng: t.lng })),
      pickupCoord,
      dropoffCoord,
    ];

    // Get drive time matrix
    const matrix = await this.osrmService.getDriveMatrix(allCoords);

    // Try all valid (pickup_pos, dropoff_pos) combinations
    // pickup_pos can be 0 to taskCount
    // dropoff_pos must be > pickup_pos
    for (let pickupPos = 0; pickupPos <= taskCount; pickupPos++) {
      for (let dropoffPos = pickupPos + 1; dropoffPos <= taskCount + 1; dropoffPos++) {
        // Check capacity constraints
        const isValid = this.checkCapacityConstraints(
          van,
          currentTasks,
          ride.passengerCount,
          pickupPos,
          dropoffPos
        );

        if (!isValid) continue;

        // Calculate added duration
        const addedDuration = this.calculateAddedDuration(
          matrix.durations,
          currentTasks.length,
          pickupPos,
          dropoffPos
        );

        candidates.push({
          vanId: van.id,
          pickupPos,
          dropoffPos,
          addedDuration,
          valid: true,
        });
      }
    }

    return candidates;
  }

  /**
   * Check if capacity constraints are satisfied for an insertion
   */
  private checkCapacityConstraints(
    van: VanInput,
    currentTasks: TaskOrder[],
    ridePassengers: number,
    pickupPos: number,
    dropoffPos: number
  ): boolean {
    let passengers = van.passengerCount;

    for (let i = 0; i <= currentTasks.length; i++) {
      // Add passengers from pickup at pickupPos
      if (i === pickupPos) {
        passengers += ridePassengers;
        if (passengers > van.capacity) return false;
      }

      // Process existing task at position i
      if (i < currentTasks.length) {
        passengers += currentTasks[i].passengerDelta;
        if (passengers > van.capacity || passengers < 0) return false;
      }

      // Remove passengers from dropoff at dropoffPos (accounting for shifted position)
      if (i === dropoffPos - 1) {
        passengers -= ridePassengers;
      }
    }

    return true;
  }

  /**
   * Calculate added drive duration for an insertion
   */
  private calculateAddedDuration(
    durations: number[][],
    existingTaskCount: number,
    pickupPos: number,
    dropoffPos: number
  ): number {
    // Indices in the duration matrix:
    // 0 = van location
    // 1 to existingTaskCount = existing tasks
    // existingTaskCount + 1 = pickup
    // existingTaskCount + 2 = dropoff

    const pickupIdx = existingTaskCount + 1;
    const dropoffIdx = existingTaskCount + 2;

    let addedDuration = 0;

    // Cost of going to pickup
    const beforePickup = pickupPos === 0 ? 0 : pickupPos;
    addedDuration += durations[beforePickup]?.[pickupIdx] || 0;

    // Cost from pickup to dropoff (if consecutive)
    if (dropoffPos === pickupPos + 1) {
      addedDuration += durations[pickupIdx]?.[dropoffIdx] || 0;
    } else {
      // Cost from pickup to next task
      const afterPickup = pickupPos < existingTaskCount ? pickupPos + 1 : dropoffIdx;
      addedDuration += durations[pickupIdx]?.[afterPickup] || 0;

      // Cost of going to dropoff
      const beforeDropoff = dropoffPos - 1 > pickupPos ? dropoffPos - 1 : pickupIdx;
      addedDuration += durations[beforeDropoff]?.[dropoffIdx] || 0;
    }

    // Cost from dropoff to next task (if any)
    if (dropoffPos <= existingTaskCount) {
      addedDuration += durations[dropoffIdx]?.[dropoffPos] || 0;
    }

    // Subtract the original direct route cost that we're replacing
    if (existingTaskCount > 0) {
      // Removing direct link where we insert pickup
      if (pickupPos > 0 && pickupPos <= existingTaskCount) {
        addedDuration -= durations[pickupPos - 1]?.[pickupPos] || 0;
      }
      // Removing direct link where we insert dropoff (if not consecutive)
      if (dropoffPos > pickupPos + 1 && dropoffPos <= existingTaskCount) {
        addedDuration -= durations[dropoffPos - 1]?.[dropoffPos] || 0;
      }
    }

    return Math.max(0, addedDuration);
  }

  /**
   * Insert pickup and dropoff tasks into the task list
   */
  private insertTasks(
    currentTasks: TaskOrder[],
    ride: RideInput,
    pickupCoord: Coordinate,
    dropoffCoord: Coordinate,
    pickupPos: number,
    dropoffPos: number
  ): TaskOrder[] {
    const newTasks = [...currentTasks];

    const pickupTask: TaskOrder = {
      rideId: ride.id,
      type: "PICKUP",
      position: pickupPos,
      lat: pickupCoord.lat,
      lng: pickupCoord.lng,
      passengerDelta: ride.passengerCount,
    };

    const dropoffTask: TaskOrder = {
      rideId: ride.id,
      type: "DROPOFF",
      position: dropoffPos,
      lat: dropoffCoord.lat,
      lng: dropoffCoord.lng,
      passengerDelta: -ride.passengerCount,
    };

    // Insert tasks at correct positions
    newTasks.splice(pickupPos, 0, pickupTask);
    newTasks.splice(dropoffPos, 0, dropoffTask);

    // Renumber positions
    newTasks.forEach((t, i) => {
      t.position = i;
    });

    return newTasks;
  }

  /**
   * Apply optimization assignments to database
   */
  private async applyAssignments(
    orgId: string,
    result: OptimizationResult
  ): Promise<void> {
    for (const assignment of result.assignments) {
      // Update ride with van assignment
      const ride = await this.prisma.ride.update({
        where: { id: assignment.rideId },
        data: {
          vanId: assignment.vanId,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
        include: { van: true },
      });

      // Create tasks for the ride
      const maxPosition = await this.prisma.vanTask.aggregate({
        where: { vanId: assignment.vanId, completedAt: null },
        _max: { position: true },
      });

      const basePosition = (maxPosition._max.position ?? -1) + 1;

      await this.prisma.vanTask.createMany({
        data: [
          {
            vanId: assignment.vanId,
            rideId: assignment.rideId,
            type: "PICKUP",
            address: ride.pickupAddress,
            lat: ride.pickupLat,
            lng: ride.pickupLng,
            position: basePosition,
          },
          {
            vanId: assignment.vanId,
            rideId: assignment.rideId,
            type: "DROPOFF",
            address: ride.dropoffAddress,
            lat: ride.dropoffLat,
            lng: ride.dropoffLng,
            position: basePosition + 1,
          },
        ],
      });

      // Emit ride updated event
      this.eventEmitter.emit("ride.updated", { ride, orgId });
    }

    // Reorder tasks based on optimization result
    for (const vanOrder of result.vanTaskOrders) {
      // Update task positions
      for (const task of vanOrder.taskOrder) {
        if (task.taskId) {
          await this.prisma.vanTask.update({
            where: { id: task.taskId },
            data: { position: task.position },
          });
        }
      }

      // Emit tasks reordered event
      if (vanOrder.taskOrder.length > 0) {
        this.eventEmitter.emit("tasks.reordered", {
          vanId: vanOrder.vanId,
          orgId,
          taskOrder: vanOrder.taskOrder,
        });
      }
    }
  }

  /**
   * Get ETA for a specific ride
   */
  async getEta(rideId: string): Promise<{ eta: Date | null; durationSeconds: number | null }> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        van: true,
        tasks: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!ride || !ride.van || !ride.van.currentLat || !ride.van.currentLng) {
      return { eta: null, durationSeconds: null };
    }

    // Find pickup task position
    const pickupTask = ride.tasks.find((t) => t.type === "PICKUP" && !t.completedAt);
    if (!pickupTask || !pickupTask.lat || !pickupTask.lng) {
      return { eta: null, durationSeconds: null };
    }

    // Get all tasks before pickup
    const tasksBefore = ride.tasks.filter(
      (t) => t.position < pickupTask.position && !t.completedAt
    );

    // Build route: van -> tasks before pickup -> pickup
    const coords: Coordinate[] = [
      { lat: ride.van.currentLat, lng: ride.van.currentLng },
      ...tasksBefore
        .filter((t) => t.lat && t.lng)
        .map((t) => ({ lat: t.lat!, lng: t.lng! })),
      { lat: pickupTask.lat, lng: pickupTask.lng },
    ];

    let totalDuration = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const result = await this.osrmService.getDriveTime(coords[i], coords[i + 1]);
      totalDuration += result.duration;
    }

    const eta = new Date(Date.now() + totalDuration * 1000);
    return { eta, durationSeconds: totalDuration };
  }
}
