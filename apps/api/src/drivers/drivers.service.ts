import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RidesService } from "../rides/rides.service";
import {
  GoOnlineDto,
  LocationPingDto,
  CreateWalkOnDto,
  CreateTransferDto,
  TransferStatus,
} from "./dto/driver.dto";

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly ridesService: RidesService
  ) {}

  /**
   * Go online - claim a van
   */
  async goOnline(dto: GoOnlineDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Check if van exists and is available
    const van = await this.prisma.van.findFirst({
      where: { id: dto.vanId, organizationId: org.id },
    });

    if (!van) {
      throw new NotFoundException("Van not found");
    }

    if (van.status === "MAINTENANCE" || van.status === "OFFLINE") {
      throw new BadRequestException("Van is not available");
    }

    // Check if van is already claimed by someone else
    if (van.tcId && van.tcId !== membership.id) {
      throw new BadRequestException("Van is already claimed by another TC");
    }

    // Check driver/TC role
    const isTc = ["TC", "DISPATCHER", "EXECUTIVE", "ADMIN"].includes(membership.role);
    const isDriver = membership.role === "DRIVER" || isTc;

    if (!isDriver) {
      throw new ForbiddenException("Must be a driver or TC to claim a van");
    }

    // Update van with crew
    const updated = await this.prisma.van.update({
      where: { id: dto.vanId },
      data: {
        status: "IN_USE",
        driverId: isDriver ? membership.id : van.driverId,
        tcId: isTc ? membership.id : van.tcId,
        lastPing: new Date(),
      },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("van.updated", { van: updated, orgId: org.id });
    return updated;
  }

  /**
   * Go offline - release van
   */
  async goOffline() {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van claimed by this user
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ driverId: membership.id }, { tcId: membership.id }],
      },
    });

    if (!van) {
      throw new BadRequestException("You are not assigned to any van");
    }

    // Check if there are active rides
    const activeRides = await this.prisma.ride.count({
      where: {
        vanId: van.id,
        status: { in: ["ASSIGNED", "EN_ROUTE", "PICKED_UP"] },
      },
    });

    if (activeRides > 0) {
      throw new BadRequestException(
        "Cannot go offline with active rides. Complete or reassign rides first."
      );
    }

    // Release van
    const isTc = van.tcId === membership.id;
    const isDriver = van.driverId === membership.id;

    const updateData: any = {
      lastPing: new Date(),
    };

    if (isTc) {
      updateData.tcId = null;
    }
    if (isDriver) {
      updateData.driverId = null;
    }

    // If both are released, set van to available
    const remainingCrew = await this.prisma.van.findUnique({
      where: { id: van.id },
      select: { driverId: true, tcId: true },
    });

    if (
      (isTc && !remainingCrew?.driverId) ||
      (isDriver && !remainingCrew?.tcId) ||
      (isTc && isDriver)
    ) {
      updateData.status = "AVAILABLE";
      updateData.driverId = null;
      updateData.tcId = null;
    }

    const updated = await this.prisma.van.update({
      where: { id: van.id },
      data: updateData,
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("van.updated", { van: updated, orgId: org.id });
    return updated;
  }

  /**
   * Get current driver status
   */
  async getStatus() {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van claimed by this user
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ driverId: membership.id }, { tcId: membership.id }],
      },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
        tasks: {
          where: { completedAt: null },
          orderBy: { position: "asc" },
          include: { ride: true },
        },
      },
    });

    return {
      online: !!van,
      van,
      taskCount: van?.tasks.length ?? 0,
    };
  }

  /**
   * Update location
   */
  async ping(dto: LocationPingDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van claimed by this user
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ driverId: membership.id }, { tcId: membership.id }],
      },
    });

    if (!van) {
      throw new BadRequestException("You are not assigned to any van");
    }

    const updated = await this.prisma.van.update({
      where: { id: van.id },
      data: {
        currentLat: dto.lat,
        currentLng: dto.lng,
        heading: dto.heading,
        speed: dto.speed,
        passengerCount: dto.passengerCount ?? van.passengerCount,
        lastPing: new Date(),
      },
    });

    this.eventEmitter.emit("van.updated", { van: updated, orgId: org.id });
    return { success: true };
  }

  /**
   * Get driver's current tasks
   */
  async getTasks() {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van claimed by this user
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ driverId: membership.id }, { tcId: membership.id }],
      },
    });

    if (!van) {
      return [];
    }

    return this.prisma.vanTask.findMany({
      where: { vanId: van.id, completedAt: null },
      include: { ride: true },
      orderBy: { position: "asc" },
    });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van claimed by this user
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ driverId: membership.id }, { tcId: membership.id }],
      },
    });

    if (!van) {
      throw new BadRequestException("You are not assigned to any van");
    }

    const task = await this.prisma.vanTask.findFirst({
      where: { id: taskId, vanId: van.id },
      include: { ride: true },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Update task
    const updated = await this.prisma.vanTask.update({
      where: { id: taskId },
      data: { completedAt: new Date() },
      include: { ride: true },
    });

    // Update ride status based on task type
    if (task.ride) {
      if (task.type === "PICKUP") {
        await this.ridesService.updateStatus(task.ride.id, {
          status: "PICKED_UP" as any,
        });
      } else if (task.type === "DROPOFF") {
        await this.ridesService.updateStatus(task.ride.id, {
          status: "COMPLETED" as any,
        });
      }
    }

    this.eventEmitter.emit("van.updated", { van, orgId: org.id });
    return updated;
  }

  /**
   * Create a walk-on ride
   */
  async createWalkOn(dto: CreateWalkOnDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van claimed by this user
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ driverId: membership.id }, { tcId: membership.id }],
      },
    });

    if (!van) {
      throw new BadRequestException("You must be online with a van to create walk-on rides");
    }

    return this.ridesService.createWalkOn(
      {
        riderName: dto.riderName,
        riderPhone: dto.riderPhone,
        passengerCount: dto.passengerCount,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        notes: dto.notes,
      },
      van.id
    );
  }

  // === TC Transfer ===

  /**
   * Request a TC transfer
   */
  async requestTransfer(dto: CreateTransferDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Find van where user is TC
    const van = await this.prisma.van.findFirst({
      where: {
        organizationId: org.id,
        tcId: membership.id,
      },
    });

    if (!van) {
      throw new BadRequestException("You are not a TC of any van");
    }

    // Check target membership exists and is TC capable
    const targetMembership = await this.prisma.membership.findFirst({
      where: {
        id: dto.toMembershipId,
        organizationId: org.id,
        role: { in: ["TC", "DISPATCHER", "EXECUTIVE", "ADMIN"] },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException("Target TC not found");
    }

    // Check for existing pending transfer
    const existingTransfer = await this.prisma.vanTransfer.findFirst({
      where: {
        vanId: van.id,
        status: TransferStatus.PENDING,
      },
    });

    if (existingTransfer) {
      throw new BadRequestException("There is already a pending transfer for this van");
    }

    const transfer = await this.prisma.vanTransfer.create({
      data: {
        organizationId: org.id,
        vanId: van.id,
        requestedById: membership.id,
        toMembershipId: dto.toMembershipId,
        status: TransferStatus.PENDING,
      },
      include: {
        van: true,
        requestedBy: { include: { account: true } },
        toMembership: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("van.transfer.created", { transfer, orgId: org.id });
    return transfer;
  }

  /**
   * Accept a transfer
   */
  async acceptTransfer(transferId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const transfer = await this.prisma.vanTransfer.findFirst({
      where: {
        id: transferId,
        organizationId: org.id,
        toMembershipId: membership.id,
        status: TransferStatus.PENDING,
      },
      include: { van: true },
    });

    if (!transfer) {
      throw new NotFoundException("Transfer not found");
    }

    // Update transfer status
    const updatedTransfer = await this.prisma.vanTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    // Update van TC
    const updatedVan = await this.prisma.van.update({
      where: { id: transfer.vanId },
      data: { tcId: membership.id },
      include: {
        driver: { include: { account: true } },
        tc: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("van.transfer.updated", { transfer: updatedTransfer, orgId: org.id });
    this.eventEmitter.emit("van.updated", { van: updatedVan, orgId: org.id });

    return updatedVan;
  }

  /**
   * Decline a transfer
   */
  async declineTransfer(transferId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const transfer = await this.prisma.vanTransfer.findFirst({
      where: {
        id: transferId,
        organizationId: org.id,
        toMembershipId: membership.id,
        status: TransferStatus.PENDING,
      },
    });

    if (!transfer) {
      throw new NotFoundException("Transfer not found");
    }

    const updated = await this.prisma.vanTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.DECLINED,
        respondedAt: new Date(),
      },
      include: {
        van: true,
        requestedBy: { include: { account: true } },
        toMembership: { include: { account: true } },
      },
    });

    this.eventEmitter.emit("van.transfer.updated", { transfer: updated, orgId: org.id });
    return updated;
  }

  /**
   * Get pending transfers for current user
   */
  async getPendingTransfers() {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    return this.prisma.vanTransfer.findMany({
      where: {
        organizationId: org.id,
        toMembershipId: membership.id,
        status: TransferStatus.PENDING,
      },
      include: {
        van: true,
        requestedBy: { include: { account: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Cancel a transfer (by requester)
   */
  async cancelTransfer(transferId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const transfer = await this.prisma.vanTransfer.findFirst({
      where: {
        id: transferId,
        organizationId: org.id,
        requestedById: membership.id,
        status: TransferStatus.PENDING,
      },
    });

    if (!transfer) {
      throw new NotFoundException("Transfer not found");
    }

    const updated = await this.prisma.vanTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.CANCELLED,
        respondedAt: new Date(),
      },
    });

    this.eventEmitter.emit("van.transfer.updated", { transfer: updated, orgId: org.id });
    return updated;
  }
}
