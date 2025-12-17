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
import { VansService } from "./vans.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";
import {
  CreateVanDto,
  UpdateVanDto,
  CreateTaskDto,
  UpdateTaskDto,
  ReorderTasksDto,
} from "./dto/create-van.dto";

@Controller("vans")
@UseGuards(LogtoAuthGuard)
export class VansController {
  constructor(private readonly vansService: VansService) {}

  /**
   * Create a new van
   */
  @Post()
  @Roles("EXECUTIVE", "ADMIN")
  async create(@Body() dto: CreateVanDto) {
    return this.vansService.create(dto);
  }

  /**
   * Get all vans
   */
  @Get()
  @Roles("DISPATCHER", "TC", "DRIVER", "EXECUTIVE", "ADMIN")
  async findAll() {
    return this.vansService.findAll();
  }

  /**
   * Get available vans
   */
  @Get("available")
  @Roles("DISPATCHER", "TC", "DRIVER", "EXECUTIVE", "ADMIN")
  async findAvailable() {
    return this.vansService.findAvailable();
  }

  /**
   * Suggest vans for a pickup location
   */
  @Get("suggest")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async suggestVans(
    @Query("pickupLat") pickupLat: string,
    @Query("pickupLng") pickupLng: string
  ) {
    return this.vansService.suggestVans(
      parseFloat(pickupLat),
      parseFloat(pickupLng)
    );
  }

  /**
   * Get online van count
   */
  @Get("online/count")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async getOnlineCount() {
    return { count: await this.vansService.getOnlineCount() };
  }

  /**
   * Get total van count
   */
  @Get("count")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async getTotalCount() {
    return { count: await this.vansService.getTotalCount() };
  }

  /**
   * Get a single van
   */
  @Get(":id")
  @Roles("DISPATCHER", "TC", "DRIVER", "EXECUTIVE", "ADMIN")
  async findOne(@Param("id") id: string) {
    return this.vansService.findOne(id);
  }

  /**
   * Update a van
   */
  @Patch(":id")
  @Roles("EXECUTIVE", "ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateVanDto) {
    return this.vansService.update(id, dto);
  }

  /**
   * Delete a van
   */
  @Delete(":id")
  @Roles("EXECUTIVE", "ADMIN")
  async remove(@Param("id") id: string) {
    return this.vansService.remove(id);
  }

  // === Task Management ===

  /**
   * Get van tasks
   */
  @Get(":id/tasks")
  @Roles("DISPATCHER", "TC", "DRIVER", "EXECUTIVE", "ADMIN")
  async getTasks(
    @Param("id") id: string,
    @Query("includeCompleted") includeCompleted?: string
  ) {
    return this.vansService.getTasks(id, includeCompleted === "true");
  }

  /**
   * Add a task to a van
   */
  @Post(":id/tasks")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async addTask(@Param("id") id: string, @Body() dto: CreateTaskDto) {
    return this.vansService.addTask(id, dto);
  }

  /**
   * Update a task
   */
  @Patch(":vanId/tasks/:taskId")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async updateTask(
    @Param("vanId") vanId: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateTaskDto
  ) {
    return this.vansService.updateTask(vanId, taskId, dto);
  }

  /**
   * Complete a task
   */
  @Post(":vanId/tasks/:taskId/complete")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async completeTask(
    @Param("vanId") vanId: string,
    @Param("taskId") taskId: string
  ) {
    return this.vansService.completeTask(vanId, taskId);
  }

  /**
   * Delete a task
   */
  @Delete(":vanId/tasks/:taskId")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async removeTask(
    @Param("vanId") vanId: string,
    @Param("taskId") taskId: string
  ) {
    return this.vansService.removeTask(vanId, taskId);
  }

  /**
   * Reorder tasks
   */
  @Post(":id/tasks/reorder")
  @Roles("DISPATCHER", "TC", "EXECUTIVE", "ADMIN")
  async reorderTasks(@Param("id") id: string, @Body() dto: ReorderTasksDto) {
    return this.vansService.reorderTasks(id, dto);
  }
}
