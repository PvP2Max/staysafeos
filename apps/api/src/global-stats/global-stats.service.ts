import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GlobalStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the singleton GlobalStats record
   */
  async getStats() {
    let stats = await this.prisma.globalStats.findUnique({
      where: { id: "singleton" },
    });

    if (!stats) {
      stats = await this.prisma.globalStats.create({
        data: { id: "singleton" },
      });
    }

    return stats;
  }

  /**
   * Increment a specific stat field atomically
   */
  async incrementStat(
    field: "totalRidesCompleted" | "totalVolunteersTrained" | "totalOrganizationsServed" | "totalOrganizationsDeleted" | "totalVansRegistered",
    value: number = 1
  ) {
    return this.prisma.globalStats.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", [field]: value },
      update: { [field]: { increment: value } },
    });
  }

  /**
   * Archive an organization's stats before deletion
   * This adds the org's stats to the global totals
   */
  async archiveOrganizationStats(organizationId: string) {
    // Count completed rides for this org
    const completedRides = await this.prisma.ride.count({
      where: {
        organizationId,
        status: "COMPLETED",
      },
    });

    // Count unique trained volunteers (members with at least one training completion)
    const trainedVolunteers = await this.prisma.membership.count({
      where: {
        organizationId,
        OR: [
          { trainingOrientationAt: { not: null } },
          { trainingSafetyAt: { not: null } },
          { trainingDriverAt: { not: null } },
          { trainingTcAt: { not: null } },
          { trainingDispatcherAt: { not: null } },
        ],
      },
    });

    // Count vans registered
    const vansRegistered = await this.prisma.van.count({
      where: { organizationId },
    });

    // Update global stats atomically
    await this.prisma.globalStats.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        totalRidesCompleted: completedRides,
        totalVolunteersTrained: trainedVolunteers,
        totalVansRegistered: vansRegistered,
        totalOrganizationsDeleted: 1,
      },
      update: {
        totalRidesCompleted: { increment: completedRides },
        totalVolunteersTrained: { increment: trainedVolunteers },
        totalVansRegistered: { increment: vansRegistered },
        totalOrganizationsDeleted: { increment: 1 },
      },
    });

    return {
      archivedRides: completedRides,
      archivedVolunteers: trainedVolunteers,
      archivedVans: vansRegistered,
    };
  }

  /**
   * Increment organizations served count (called when org is created)
   */
  async incrementOrganizationsServed() {
    return this.incrementStat("totalOrganizationsServed", 1);
  }
}
