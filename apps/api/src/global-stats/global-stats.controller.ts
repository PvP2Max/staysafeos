import { Controller, Get } from "@nestjs/common";
import { GlobalStatsService } from "./global-stats.service";

@Controller("global-stats")
export class GlobalStatsController {
  constructor(private readonly globalStatsService: GlobalStatsService) {}

  /**
   * Get global statistics for marketing page
   * This endpoint is public (no auth required)
   */
  @Get()
  async getStats() {
    const stats = await this.globalStatsService.getStats();

    return {
      totalRidesCompleted: stats.totalRidesCompleted,
      totalVolunteersTrained: stats.totalVolunteersTrained,
      totalOrganizationsServed: stats.totalOrganizationsServed,
      totalVansRegistered: stats.totalVansRegistered,
      updatedAt: stats.updatedAt,
    };
  }
}
