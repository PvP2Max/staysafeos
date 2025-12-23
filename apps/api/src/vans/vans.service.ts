import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OsrmService } from "../osrm/osrm.service";
import {
  CreateVanDto,
  UpdateVanDto,
  CreateTaskDto,
  UpdateTaskDto,
  ReorderTasksDto,
  VanStatus,
} from "./dto/create-van.dto";

@Injectable()
export class VansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly osrmService: OsrmService
  ) {}

  /**
   * Create a new van
   */
  async create(dto: CreateVanDto) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.create({
      data: {
        organizationId: org.id,
        name: dto.name,
        capacity: dto.capacity ?? 6,
        licensePlate: dto.licensePlate,
        status: dto.status ?? VanStatus.AVAILABLE,
      },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    return van;
  }

  /**
   * Get all vans
   */
  async findAll() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.van.findMany({
      where: { organizationId: org.id },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        tasks: {
          where: { completedAt: null },
          orderBy: { position: "asc" },
        },
        _count: {
          select: {
            rides: {
              where: {
                status: { in: ["ASSIGNED", "EN_ROUTE", "PICKED_UP"] },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get available vans (not in use or maintenance)
   */
  async findAvailable() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.van.findMany({
      where: {
        organizationId: org.id,
        status: { in: [VanStatus.AVAILABLE, VanStatus.IN_USE] },
      },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get a single van by ID
   */
  async findOne(id: string) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.findFirst({
      where: { id, organizationId: org.id },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        tasks: {
          orderBy: { position: "asc" },
          include: { ride: true },
        },
        rides: {
          where: {
            status: { in: ["ASSIGNED", "EN_ROUTE", "PICKED_UP"] },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    return van;
  }

  /**
   * Update a van
   */
  async update(id: string, dto: UpdateVanDto) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    const updated = await this.prisma.van.update({
      where: { id },
      data: dto,
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("van.updated", { van: updated, orgId: org.id });
    return updated;
  }

  /**
   * Delete a van
   */
  async remove(id: string) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    if (van.status === VanStatus.IN_USE) {
      throw new BadRequestException("Cannot delete a van that is in use");
    }

    await this.prisma.van.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Get van tasks
   */
  async getTasks(vanId: string, includeCompleted = false) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.findFirst({
      where: { id: vanId, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    const where: any = { vanId };
    if (!includeCompleted) {
      where.completedAt = null;
    }

    return this.prisma.vanTask.findMany({
      where,
      include: { ride: true },
      orderBy: { position: "asc" },
    });
  }

  /**
   * Add a task to a van
   */
  async addTask(vanId: string, dto: CreateTaskDto) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.findFirst({
      where: { id: vanId, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    // Get max position
    const maxPosition = await this.prisma.vanTask.aggregate({
      where: { vanId },
      _max: { position: true },
    });

    const task = await this.prisma.vanTask.create({
      data: {
        vanId,
        rideId: dto.rideId,
        type: dto.type,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
        notes: dto.notes,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: { ride: true },
    });

    this.eventEmitter.emit("van.updated", { van, orgId: org.id });
    return task;
  }

  /**
   * Update a task
   */
  async updateTask(vanId: string, taskId: string, dto: UpdateTaskDto) {
    const org = this.requestContext.requireOrganization();

    const task = await this.prisma.vanTask.findFirst({
      where: { id: taskId, vanId },
      include: { van: true },
    });

    if (!task || task.van.organizationId !== org.id) {
      throw new NotFoundException("Task not found");
    }

    const updated = await this.prisma.vanTask.update({
      where: { id: taskId },
      data: dto,
      include: { ride: true },
    });

    this.eventEmitter.emit("van.updated", { van: task.van, orgId: org.id });
    return updated;
  }

  /**
   * Complete a task
   */
  async completeTask(vanId: string, taskId: string) {
    const org = this.requestContext.requireOrganization();

    const task = await this.prisma.vanTask.findFirst({
      where: { id: taskId, vanId },
      include: { van: true },
    });

    if (!task || task.van.organizationId !== org.id) {
      throw new NotFoundException("Task not found");
    }

    const updated = await this.prisma.vanTask.update({
      where: { id: taskId },
      data: { completedAt: new Date() },
      include: { ride: true },
    });

    this.eventEmitter.emit("van.updated", { van: task.van, orgId: org.id });
    return updated;
  }

  /**
   * Delete a task
   */
  async removeTask(vanId: string, taskId: string) {
    const org = this.requestContext.requireOrganization();

    const task = await this.prisma.vanTask.findFirst({
      where: { id: taskId, vanId },
      include: { van: true },
    });

    if (!task || task.van.organizationId !== org.id) {
      throw new NotFoundException("Task not found");
    }

    await this.prisma.vanTask.delete({ where: { id: taskId } });

    this.eventEmitter.emit("van.updated", { van: task.van, orgId: org.id });
    return { success: true };
  }

  /**
   * Reorder tasks
   */
  async reorderTasks(vanId: string, dto: ReorderTasksDto) {
    const org = this.requestContext.requireOrganization();

    const van = await this.prisma.van.findFirst({
      where: { id: vanId, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    // Update positions for each task
    await Promise.all(
      dto.taskIds.map((taskId, index) =>
        this.prisma.vanTask.update({
          where: { id: taskId },
          data: { position: index },
        })
      )
    );

    const tasks = await this.prisma.vanTask.findMany({
      where: { vanId, completedAt: null },
      orderBy: { position: "asc" },
      include: { ride: true },
    });

    this.eventEmitter.emit("van.updated", { van, orgId: org.id });
    return tasks;
  }

  /**
   * Suggest vans for a pickup location (sorted by drive time using OSRM)
   */
  async suggestVans(pickupLat: number, pickupLng: number) {
    const org = this.requestContext.requireOrganization();

    const vans = await this.prisma.van.findMany({
      where: {
        organizationId: org.id,
        status: VanStatus.IN_USE,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        _count: {
          select: {
            tasks: { where: { completedAt: null } },
          },
        },
      },
    });

    if (vans.length === 0) {
      return [];
    }

    // Build coordinates array for OSRM matrix
    const coords = [
      { lat: pickupLat, lng: pickupLng },
      ...vans.map((v) => ({ lat: v.currentLat!, lng: v.currentLng! })),
    ];

    // Get drive times from OSRM
    const matrix = await this.osrmService.getDriveMatrix(coords);

    // Calculate drive time and ETA for each van (first row of matrix is from pickup to each van)
    const withDriveTime = vans.map((van, index) => {
      const driveTimeSeconds = matrix.durations[0]?.[index + 1] || 0;
      const distanceMeters = matrix.distances?.[0]?.[index + 1] || 0;
      const eta = new Date(Date.now() + driveTimeSeconds * 1000);

      return {
        ...van,
        driveTimeSeconds,
        driveTimeMinutes: Math.round(driveTimeSeconds / 60),
        distanceMeters,
        distanceMiles: Math.round((distanceMeters / 1609.34) * 10) / 10,
        eta,
        // Keep legacy distance field for backwards compatibility
        distance: distanceMeters / 1609.34,
      };
    });

    // Sort by drive time (ascending)
    withDriveTime.sort((a, b) => a.driveTimeSeconds - b.driveTimeSeconds);
    return withDriveTime;
  }

  /**
   * Get online van count
   */
  async getOnlineCount() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.van.count({
      where: {
        organizationId: org.id,
        status: VanStatus.IN_USE,
      },
    });
  }

  /**
   * Get total van count
   */
  async getTotalCount() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.van.count({
      where: { organizationId: org.id },
    });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
