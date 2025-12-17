import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TrainingService } from "./training.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";
import {
  CreateModuleDto,
  UpdateModuleDto,
  SubmitQuizDto,
  TrainingFilterDto,
} from "./dto/training.dto";

@Controller("training")
@UseGuards(LogtoAuthGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /**
   * Create a training module
   */
  @Post("modules")
  @Roles("EXECUTIVE", "ADMIN")
  async createModule(@Body() dto: CreateModuleDto) {
    return this.trainingService.createModule(dto);
  }

  /**
   * Get all training modules
   */
  @Get("modules")
  async getModules(@Query() filters: TrainingFilterDto) {
    return this.trainingService.getModules(filters);
  }

  /**
   * Get night brief video
   */
  @Get("night-brief")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async getNightBrief() {
    return this.trainingService.getNightBrief();
  }

  /**
   * Get user's training progress
   */
  @Get("progress")
  async getProgress() {
    return this.trainingService.getProgress();
  }

  /**
   * Get specific user's training progress
   */
  @Get("progress/:membershipId")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async getMemberProgress(@Param("membershipId") membershipId: string) {
    return this.trainingService.getProgress(membershipId);
  }

  /**
   * Get a single module
   */
  @Get("modules/:id")
  async getModule(@Param("id") id: string) {
    return this.trainingService.getModule(id);
  }

  /**
   * Update a module
   */
  @Patch("modules/:id")
  @Roles("EXECUTIVE", "ADMIN")
  async updateModule(@Param("id") id: string, @Body() dto: UpdateModuleDto) {
    return this.trainingService.updateModule(id, dto);
  }

  /**
   * Delete a module
   */
  @Delete("modules/:id")
  @Roles("EXECUTIVE", "ADMIN")
  async deleteModule(@Param("id") id: string) {
    return this.trainingService.deleteModule(id);
  }

  /**
   * Mark video as watched
   */
  @Post("modules/:id/complete")
  async markVideoWatched(@Param("id") id: string) {
    return this.trainingService.markVideoWatched(id);
  }

  /**
   * Submit quiz answers
   */
  @Post("modules/:id/quiz")
  async submitQuiz(@Param("id") id: string, @Body() dto: SubmitQuizDto) {
    return this.trainingService.submitQuiz(id, dto);
  }
}
