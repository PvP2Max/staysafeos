import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RidesService } from "./rides.service";
import { LogtoAuthGuard, Roles, Public } from "../auth/logto-auth.guard";
import { CreateRideDto, CreateManualRideDto } from "./dto/create-ride.dto";
import {
  UpdateRideDto,
  AssignRideDto,
  UpdateRideStatusDto,
  CreateReviewDto,
  RideFilterDto,
} from "./dto/update-ride.dto";

@Controller("rides")
@UseGuards(LogtoAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  /**
   * Create a ride request (self-service by rider)
   */
  @Post()
  @Public()
  async create(@Body() dto: CreateRideDto) {
    return this.ridesService.create(dto);
  }

  /**
   * Create a manual ride (dispatcher)
   */
  @Post("manual")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async createManual(@Body() dto: CreateManualRideDto) {
    return this.ridesService.createManual(dto);
  }

  /**
   * List rides with filters
   */
  @Get()
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async findAll(@Query() filters: RideFilterDto) {
    return this.ridesService.findAll(filters);
  }

  /**
   * Get active rides (assigned, en route, picked up)
   */
  @Get("active")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async getActiveRides() {
    return this.ridesService.getActiveRides();
  }

  /**
   * Get pending rides count
   */
  @Get("pending/count")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async getPendingCount() {
    return { count: await this.ridesService.getPendingCount() };
  }

  /**
   * Get completed today count
   */
  @Get("completed-today/count")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async getCompletedTodayCount() {
    return { count: await this.ridesService.getCompletedTodayCount() };
  }

  /**
   * Get rider's ride history by phone
   */
  @Get("history")
  async getRiderHistory(@Query("phone") phone: string) {
    return this.ridesService.getRiderHistory(phone);
  }

  /**
   * Get a single ride
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.ridesService.findOne(id);
  }

  /**
   * Update a ride
   */
  @Patch(":id")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateRideDto) {
    return this.ridesService.update(id, dto);
  }

  /**
   * Assign van/driver/TC to a ride
   */
  @Post(":id/assign")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async assign(@Param("id") id: string, @Body() dto: AssignRideDto) {
    return this.ridesService.assign(id, dto);
  }

  /**
   * Update ride status
   */
  @Post(":id/status")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateRideStatusDto) {
    return this.ridesService.updateStatus(id, dto);
  }

  /**
   * Cancel a ride (DELETE method)
   */
  @Delete(":id")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async cancel(
    @Param("id") id: string,
    @Body() body: { reason?: string }
  ) {
    return this.ridesService.cancel(id, body.reason);
  }

  /**
   * Cancel a ride (POST method - alternative endpoint)
   */
  @Post(":id/cancel")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async cancelPost(
    @Param("id") id: string,
    @Body() body: { reason?: string }
  ) {
    return this.ridesService.cancel(id, body.reason);
  }

  /**
   * Submit a ride review
   */
  @Post(":id/review")
  @Public()
  async submitReview(@Param("id") id: string, @Body() dto: CreateReviewDto) {
    return this.ridesService.submitReview(id, dto);
  }
}
