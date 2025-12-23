import { Controller, Post, Get, Param, UseGuards } from "@nestjs/common";
import { LogtoAuthGuard } from "../auth/logto-auth.guard";
import { RequestContextService } from "../common/context/request-context.service";
import { OptimizationService } from "./optimization.service";

@Controller("v1/optimization")
@UseGuards(LogtoAuthGuard)
export class OptimizationController {
  constructor(
    private readonly optimizationService: OptimizationService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Manually trigger optimization for the organization
   */
  @Post("run")
  async runOptimization() {
    const org = this.requestContext.requireOrganization();
    const result = await this.optimizationService.runOptimization(org.id);

    if (!result) {
      return {
        success: true,
        message: "No pending rides to optimize or no available vans",
        assignments: [],
      };
    }

    return {
      success: true,
      assignments: result.assignments.length,
      totalDuration: result.totalDuration,
      optimizedAt: result.optimizedAt,
    };
  }

  /**
   * Get ETA for a specific ride
   */
  @Get("eta/:rideId")
  async getEta(@Param("rideId") rideId: string) {
    const result = await this.optimizationService.getEta(rideId);
    return result;
  }
}
