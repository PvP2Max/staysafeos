import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { OptimizationService } from "./optimization.service";

@Injectable()
export class OptimizationListener {
  private readonly logger = new Logger(OptimizationListener.name);

  constructor(
    private readonly optimizationService: OptimizationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Trigger optimization when a new ride is created
   */
  @OnEvent("ride.created")
  async handleRideCreated(payload: { ride: any; orgId: string }) {
    this.logger.log(`Ride created event - checking auto-assign for org ${payload.orgId}`);

    // Check if ride has skipAutoAssign flag
    if (payload.ride.skipAutoAssign) {
      this.logger.log(`Ride ${payload.ride.id} has skipAutoAssign=true, skipping optimization`);
      return;
    }

    // Check if organization has auto-assign enabled
    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: payload.orgId },
      select: { autoAssignEnabled: true },
    });

    if (settings && !settings.autoAssignEnabled) {
      this.logger.log(`Org ${payload.orgId} has autoAssignEnabled=false, skipping optimization`);
      return;
    }

    // Only optimize if ride has coordinates
    if (payload.ride.pickupLat && payload.ride.dropoffLat) {
      this.logger.log(`Triggering optimization for org ${payload.orgId}`);
      await this.optimizationService.triggerOptimization(payload.orgId);
    }
  }

  /**
   * Trigger optimization when a task is completed (capacity freed)
   */
  @OnEvent("task.completed")
  async handleTaskCompleted(payload: { vanId: string; orgId: string }) {
    this.logger.log(`Task completed event - triggering optimization for org ${payload.orgId}`);
    await this.optimizationService.triggerOptimization(payload.orgId);
  }

  /**
   * Trigger optimization when a van status changes (online/offline)
   */
  @OnEvent("van.updated")
  async handleVanUpdated(payload: { van: any; orgId: string }) {
    // Only trigger if status changed to IN_USE (van went online)
    // or if it was previously IN_USE and is now not (van went offline)
    if (payload.van.status === "IN_USE" || payload.van.status === "AVAILABLE") {
      this.logger.log(`Van status changed - triggering optimization for org ${payload.orgId}`);
      await this.optimizationService.triggerOptimization(payload.orgId);
    }
  }
}
