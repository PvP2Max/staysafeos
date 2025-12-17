import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Get dashboard summary stats
   */
  async getSummary() {
    const org = this.requestContext.requireOrganization();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      pendingRides,
      activeRides,
      completedToday,
      onlineVans,
      totalVans,
      volunteers,
    ] = await Promise.all([
      this.prisma.ride.count({
        where: { organizationId: org.id, status: "PENDING" },
      }),
      this.prisma.ride.count({
        where: {
          organizationId: org.id,
          status: { in: ["ASSIGNED", "EN_ROUTE", "PICKED_UP"] },
        },
      }),
      this.prisma.ride.count({
        where: {
          organizationId: org.id,
          status: "COMPLETED",
          completedAt: { gte: startOfDay },
        },
      }),
      this.prisma.van.count({
        where: { organizationId: org.id, status: "IN_USE" },
      }),
      this.prisma.van.count({
        where: { organizationId: org.id },
      }),
      this.prisma.membership.count({
        where: {
          organizationId: org.id,
          role: { in: ["DRIVER", "TC", "DISPATCHER", "SAFETY"] },
          status: "ACTIVE",
        },
      }),
    ]);

    return {
      pendingRides,
      activeRides,
      completedToday,
      onlineVans,
      totalVans,
      volunteers,
    };
  }

  /**
   * Get rides by day
   */
  async getRidesByDay(days = 30) {
    const org = this.requestContext.requireOrganization();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const rides = await this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by day
    const byDay: Record<string, { total: number; completed: number; cancelled: number }> = {};

    for (const ride of rides) {
      const day = ride.createdAt.toISOString().split("T")[0];
      if (!byDay[day]) {
        byDay[day] = { total: 0, completed: 0, cancelled: 0 };
      }
      byDay[day].total++;
      if (ride.status === "COMPLETED") {
        byDay[day].completed++;
      } else if (ride.status === "CANCELLED") {
        byDay[day].cancelled++;
      }
    }

    // Convert to array sorted by date
    return Object.entries(byDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get rides by status
   */
  async getRidesByStatus() {
    const org = this.requestContext.requireOrganization();

    const results = await this.prisma.ride.groupBy({
      by: ["status"],
      where: { organizationId: org.id },
      _count: { status: true },
    });

    return results.reduce((acc, r) => {
      acc[r.status] = r._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get average wait time (pending to assigned)
   */
  async getAverageWaitTime(days = 7) {
    const org = this.requestContext.requireOrganization();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rides = await this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        createdAt: { gte: startDate },
        assignedAt: { not: null },
      },
      select: {
        createdAt: true,
        assignedAt: true,
      },
    });

    if (rides.length === 0) {
      return { avgMinutes: 0, sampleSize: 0 };
    }

    const totalMs = rides.reduce((sum, r) => {
      const wait = r.assignedAt!.getTime() - r.createdAt.getTime();
      return sum + wait;
    }, 0);

    return {
      avgMinutes: Math.round(totalMs / rides.length / 1000 / 60),
      sampleSize: rides.length,
    };
  }

  /**
   * Get fleet utilization
   */
  async getFleetUtilization(days = 7) {
    const org = this.requestContext.requireOrganization();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rides = await this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        createdAt: { gte: startDate },
        vanId: { not: null },
      },
      select: { vanId: true },
    });

    const totalVans = await this.prisma.van.count({
      where: { organizationId: org.id },
    });

    // Count rides per van
    const vanCounts: Record<string, number> = {};
    for (const ride of rides) {
      if (ride.vanId) {
        vanCounts[ride.vanId] = (vanCounts[ride.vanId] ?? 0) + 1;
      }
    }

    const activeVans = Object.keys(vanCounts).length;

    return {
      totalVans,
      activeVans,
      utilizationPercent: totalVans > 0 ? Math.round((activeVans / totalVans) * 100) : 0,
      ridesByVan: vanCounts,
    };
  }

  /**
   * Get volunteer stats
   */
  async getVolunteerStats() {
    const org = this.requestContext.requireOrganization();

    const results = await this.prisma.membership.groupBy({
      by: ["role"],
      where: {
        organizationId: org.id,
        role: { in: ["DRIVER", "TC", "DISPATCHER", "SAFETY", "RIDER"] },
        status: "ACTIVE",
      },
      _count: { role: true },
    });

    return results.reduce((acc, r) => {
      acc[r.role] = r._count.role;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get training completion rates
   */
  async getTrainingStats() {
    const org = this.requestContext.requireOrganization();

    const modules = await this.prisma.trainingModule.findMany({
      where: { organizationId: org.id, active: true },
      include: {
        _count: {
          select: {
            completions: { where: { passed: true } },
          },
        },
      },
    });

    const totalMembers = await this.prisma.membership.count({
      where: { organizationId: org.id, status: "ACTIVE" },
    });

    return modules.map((module) => ({
      id: module.id,
      title: module.title,
      category: module.category,
      completions: module._count.completions,
      completionRate:
        totalMembers > 0
          ? Math.round((module._count.completions / totalMembers) * 100)
          : 0,
    }));
  }

  /**
   * Get ride ratings distribution
   */
  async getRatingsDistribution() {
    const org = this.requestContext.requireOrganization();

    const reviews = await this.prisma.rideReview.findMany({
      where: {
        ride: { organizationId: org.id },
      },
      select: { rating: true },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    for (const review of reviews) {
      distribution[review.rating]++;
      total += review.rating;
    }

    return {
      distribution,
      average: reviews.length > 0 ? (total / reviews.length).toFixed(2) : "0.00",
      total: reviews.length,
    };
  }

  /**
   * Get peak hours
   */
  async getPeakHours(days = 30) {
    const org = this.requestContext.requireOrganization();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rides = await this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const byHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      byHour[i] = 0;
    }

    for (const ride of rides) {
      const hour = ride.createdAt.getHours();
      byHour[hour]++;
    }

    return Object.entries(byHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
  }
}
