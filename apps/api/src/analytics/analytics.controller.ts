import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";

@Controller("analytics")
@UseGuards(LogtoAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get dashboard summary stats
   */
  @Get("summary")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async getSummary() {
    return this.analyticsService.getSummary();
  }

  /**
   * Get rides by day
   */
  @Get("rides/by-day")
  @Roles("EXECUTIVE", "ADMIN")
  async getRidesByDay(@Query("days") days?: string) {
    return this.analyticsService.getRidesByDay(days ? parseInt(days) : undefined);
  }

  /**
   * Get rides by status
   */
  @Get("rides/by-status")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async getRidesByStatus() {
    return this.analyticsService.getRidesByStatus();
  }

  /**
   * Get average wait time
   */
  @Get("wait-time")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async getAverageWaitTime(@Query("days") days?: string) {
    return this.analyticsService.getAverageWaitTime(days ? parseInt(days) : undefined);
  }

  /**
   * Get fleet utilization
   */
  @Get("fleet")
  @Roles("EXECUTIVE", "ADMIN")
  async getFleetUtilization(@Query("days") days?: string) {
    return this.analyticsService.getFleetUtilization(days ? parseInt(days) : undefined);
  }

  /**
   * Get volunteer stats
   */
  @Get("volunteers")
  @Roles("EXECUTIVE", "ADMIN")
  async getVolunteerStats() {
    return this.analyticsService.getVolunteerStats();
  }

  /**
   * Get training completion rates
   */
  @Get("training")
  @Roles("EXECUTIVE", "ADMIN")
  async getTrainingStats() {
    return this.analyticsService.getTrainingStats();
  }

  /**
   * Get ride ratings distribution
   */
  @Get("ratings")
  @Roles("EXECUTIVE", "ADMIN")
  async getRatingsDistribution() {
    return this.analyticsService.getRatingsDistribution();
  }

  /**
   * Get peak hours
   */
  @Get("peak-hours")
  @Roles("EXECUTIVE", "ADMIN")
  async getPeakHours(@Query("days") days?: string) {
    return this.analyticsService.getPeakHours(days ? parseInt(days) : undefined);
  }
}
