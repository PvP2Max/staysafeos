import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { DriversService } from "./drivers.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";
import {
  GoOnlineDto,
  LocationPingDto,
  CreateWalkOnDto,
  CreateTransferDto,
} from "./dto/driver.dto";

@Controller("driver")
@UseGuards(LogtoAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  /**
   * Go online - claim a van
   */
  @Post("go-online")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async goOnline(@Body() dto: GoOnlineDto) {
    return this.driversService.goOnline(dto);
  }

  /**
   * Go offline - release van
   */
  @Post("go-offline")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async goOffline() {
    return this.driversService.goOffline();
  }

  /**
   * Get current driver status
   */
  @Get("status")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async getStatus() {
    return this.driversService.getStatus();
  }

  /**
   * Update location
   */
  @Post("ping")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async ping(@Body() dto: LocationPingDto) {
    return this.driversService.ping(dto);
  }

  /**
   * Get driver's current tasks
   */
  @Get("tasks")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async getTasks() {
    return this.driversService.getTasks();
  }

  /**
   * Complete a task
   */
  @Post("tasks/:id/complete")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async completeTask(@Param("id") id: string) {
    return this.driversService.completeTask(id);
  }

  /**
   * Create a walk-on ride
   */
  @Post("walk-on")
  @Roles("TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async createWalkOn(@Body() dto: CreateWalkOnDto) {
    return this.driversService.createWalkOn(dto);
  }

  // === TC Transfer ===

  /**
   * Request a TC transfer
   */
  @Post("transfer/request")
  @Roles("TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async requestTransfer(@Body() dto: CreateTransferDto) {
    return this.driversService.requestTransfer(dto);
  }

  /**
   * Accept a transfer
   */
  @Post("transfer/:id/accept")
  @Roles("TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async acceptTransfer(@Param("id") id: string) {
    return this.driversService.acceptTransfer(id);
  }

  /**
   * Decline a transfer
   */
  @Post("transfer/:id/decline")
  @Roles("TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async declineTransfer(@Param("id") id: string) {
    return this.driversService.declineTransfer(id);
  }

  /**
   * Cancel a transfer
   */
  @Post("transfer/:id/cancel")
  @Roles("TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async cancelTransfer(@Param("id") id: string) {
    return this.driversService.cancelTransfer(id);
  }

  /**
   * Get pending transfers for current user
   */
  @Get("transfer/pending")
  @Roles("TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async getPendingTransfers() {
    return this.driversService.getPendingTransfers();
  }
}
