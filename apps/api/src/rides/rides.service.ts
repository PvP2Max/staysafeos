import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  CreateRideDto,
  CreateManualRideDto,
  RideSource,
} from "./dto/create-ride.dto";
import {
  UpdateRideDto,
  AssignRideDto,
  UpdateRideStatusDto,
  CreateReviewDto,
  RideFilterDto,
  RideStatus,
} from "./dto/update-ride.dto";

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Create a new ride request (self-service)
   */
  async create(dto: CreateRideDto) {
    const org = this.requestContext.requireOrganization();

    const ride = await this.prisma.ride.create({
      data: {
        organizationId: org.id,
        source: RideSource.REQUEST,
        riderName: dto.riderName,
        riderPhone: dto.riderPhone,
        passengerCount: dto.passengerCount ?? 1,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        notes: dto.notes,
        priority: dto.priority ?? 0,
        status: RideStatus.PENDING,
      },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("ride.created", { ride, orgId: org.id });
    return ride;
  }

  /**
   * Create a manual ride (dispatcher-created)
   */
  async createManual(dto: CreateManualRideDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const ride = await this.prisma.ride.create({
      data: {
        organizationId: org.id,
        source: RideSource.MANUAL,
        riderName: dto.riderName,
        riderPhone: dto.riderPhone,
        passengerCount: dto.passengerCount ?? 1,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        notes: dto.notes,
        priority: dto.priority ?? 0,
        status: dto.vanId ? RideStatus.ASSIGNED : RideStatus.PENDING,
        vanId: dto.vanId,
        driverId: dto.driverId,
        tcId: dto.tcId,
        dispatcherId: membership?.id,
        assignedAt: dto.vanId ? new Date() : undefined,
      },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        dispatcher: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("ride.created", { ride, orgId: org.id });
    return ride;
  }

  /**
   * Create a walk-on ride (driver/TC created on the fly)
   */
  async createWalkOn(dto: CreateRideDto, vanId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    // Get the van to get driver/TC info
    const van = await this.prisma.van.findFirst({
      where: { id: vanId, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    const ride = await this.prisma.ride.create({
      data: {
        organizationId: org.id,
        source: RideSource.WALK_ON,
        riderName: dto.riderName,
        riderPhone: dto.riderPhone,
        passengerCount: dto.passengerCount ?? 1,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        notes: dto.notes,
        priority: dto.priority ?? 0,
        status: RideStatus.PICKED_UP, // Walk-ons start as picked up
        vanId: van.id,
        driverId: van.driverId,
        tcId: van.tcId ?? membership?.id,
        assignedAt: new Date(),
        pickedUpAt: new Date(),
      },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("ride.created", { ride, orgId: org.id });
    return ride;
  }

  /**
   * Get all rides with filtering
   */
  async findAll(filters: RideFilterDto) {
    const org = this.requestContext.requireOrganization();

    const where: any = {
      organizationId: org.id,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { riderName: { contains: filters.search, mode: "insensitive" } },
        { riderPhone: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        include: {
          van: true,
          driver: { include: { account: true } },
          tc: { include: { account: true } },
          dispatcher: { include: { account: true } },
          review: true,
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: filters.take ?? 50,
        skip: filters.skip ?? 0,
      }),
      this.prisma.ride.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get a single ride by ID
   */
  async findOne(id: string) {
    const org = this.requestContext.requireOrganization();

    const ride = await this.prisma.ride.findFirst({
      where: { id, organizationId: org.id },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        dispatcher: { include: { account: true } },
        review: true,
        tasks: { orderBy: { position: "asc" } },
      },
    });

    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    return ride;
  }

  /**
   * Update a ride
   */
  async update(id: string, dto: UpdateRideDto) {
    const org = this.requestContext.requireOrganization();

    const ride = await this.prisma.ride.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    const updated = await this.prisma.ride.update({
      where: { id },
      data: dto,
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        dispatcher: { include: { account: true } },
        review: true,
      },
    });

    this.eventEmitter.emit("ride.updated", { ride: updated, orgId: org.id });
    return updated;
  }

  /**
   * Assign van/driver/TC to a ride
   */
  async assign(id: string, dto: AssignRideDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const ride = await this.prisma.ride.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    const isFirstAssignment = !ride.vanId && dto.vanId;

    const updated = await this.prisma.ride.update({
      where: { id },
      data: {
        vanId: dto.vanId ?? ride.vanId,
        driverId: dto.driverId ?? ride.driverId,
        tcId: dto.tcId ?? ride.tcId,
        dispatcherId: membership?.id ?? ride.dispatcherId,
        status: dto.vanId ? RideStatus.ASSIGNED : ride.status,
        assignedAt: isFirstAssignment ? new Date() : ride.assignedAt,
      },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        dispatcher: { include: { account: true } },
        review: true,
      },
    });

    // Create tasks for the van if this is a new assignment
    if (isFirstAssignment && dto.vanId) {
      await this.createTasksForRide(updated);
    }

    this.eventEmitter.emit("ride.updated", { ride: updated, orgId: org.id });
    return updated;
  }

  /**
   * Update ride status
   */
  async updateStatus(id: string, dto: UpdateRideStatusDto) {
    const org = this.requestContext.requireOrganization();

    const ride = await this.prisma.ride.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    // Validate status transitions
    this.validateStatusTransition(ride.status as RideStatus, dto.status);

    const timestamps: any = {};
    if (dto.status === RideStatus.EN_ROUTE) {
      timestamps.enRouteAt = new Date();
    } else if (dto.status === RideStatus.PICKED_UP) {
      timestamps.pickedUpAt = new Date();
    } else if (dto.status === RideStatus.COMPLETED) {
      timestamps.completedAt = new Date();
    } else if (dto.status === RideStatus.CANCELLED) {
      timestamps.cancelledAt = new Date();
      timestamps.cancelReason = dto.cancelReason;
    }

    const updated = await this.prisma.ride.update({
      where: { id },
      data: {
        status: dto.status,
        ...timestamps,
      },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        dispatcher: { include: { account: true } },
        review: true,
      },
    });

    this.eventEmitter.emit("ride.updated", { ride: updated, orgId: org.id });
    return updated;
  }

  /**
   * Cancel a ride
   */
  async cancel(id: string, reason?: string) {
    return this.updateStatus(id, {
      status: RideStatus.CANCELLED,
      cancelReason: reason,
    });
  }

  /**
   * Submit a ride review
   */
  async submitReview(id: string, dto: CreateReviewDto) {
    const org = this.requestContext.requireOrganization();

    const ride = await this.prisma.ride.findFirst({
      where: { id, organizationId: org.id },
      include: { review: true },
    });

    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    if (ride.review) {
      throw new BadRequestException("Ride already has a review");
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException("Can only review completed rides");
    }

    const review = await this.prisma.rideReview.create({
      data: {
        rideId: id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    this.eventEmitter.emit("ride.reviewed", { ride, review, orgId: org.id });
    return review;
  }

  /**
   * Get rider's ride history
   */
  async getRiderHistory(phone: string, take = 10) {
    const org = this.requestContext.requireOrganization();

    return this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        riderPhone: phone,
      },
      include: {
        van: true,
        review: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  /**
   * Get pending rides count
   */
  async getPendingCount() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.ride.count({
      where: {
        organizationId: org.id,
        status: RideStatus.PENDING,
      },
    });
  }

  /**
   * Get today's completed rides count
   */
  async getCompletedTodayCount() {
    const org = this.requestContext.requireOrganization();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.ride.count({
      where: {
        organizationId: org.id,
        status: RideStatus.COMPLETED,
        completedAt: { gte: startOfDay },
      },
    });
  }

  /**
   * Get active rides (assigned, en route, picked up)
   */
  async getActiveRides() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        status: {
          in: [RideStatus.ASSIGNED, RideStatus.EN_ROUTE, RideStatus.PICKED_UP],
        },
      },
      include: {
        van: true,
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(from: RideStatus, to: RideStatus) {
    const validTransitions: Record<RideStatus, RideStatus[]> = {
      [RideStatus.PENDING]: [RideStatus.ASSIGNED, RideStatus.CANCELLED],
      [RideStatus.ASSIGNED]: [
        RideStatus.EN_ROUTE,
        RideStatus.PICKED_UP,
        RideStatus.CANCELLED,
      ],
      [RideStatus.EN_ROUTE]: [RideStatus.PICKED_UP, RideStatus.CANCELLED],
      [RideStatus.PICKED_UP]: [RideStatus.COMPLETED, RideStatus.CANCELLED],
      [RideStatus.COMPLETED]: [],
      [RideStatus.CANCELLED]: [],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`
      );
    }
  }

  /**
   * Create pickup/dropoff tasks for a ride when assigned
   */
  private async createTasksForRide(ride: any) {
    if (!ride.vanId) return;

    // Get current max position for this van
    const maxPosition = await this.prisma.vanTask.aggregate({
      where: { vanId: ride.vanId },
      _max: { position: true },
    });

    const startPosition = (maxPosition._max.position ?? -1) + 1;

    await this.prisma.vanTask.createMany({
      data: [
        {
          vanId: ride.vanId,
          rideId: ride.id,
          type: "PICKUP",
          address: ride.pickupAddress,
          lat: ride.pickupLat,
          lng: ride.pickupLng,
          position: startPosition,
        },
        {
          vanId: ride.vanId,
          rideId: ride.id,
          type: "DROPOFF",
          address: ride.dropoffAddress,
          lat: ride.dropoffLat,
          lng: ride.dropoffLng,
          position: startPosition + 1,
        },
      ],
    });
  }
}
