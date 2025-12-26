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
import { ShiftsService } from "./shifts.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";
import { CreateShiftDto, UpdateShiftDto, ShiftFilterDto } from "./dto/shifts.dto";

@Controller("shifts")
@UseGuards(LogtoAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  /**
   * Create a shift (executives and admins only)
   */
  @Post()
  @Roles("EXECUTIVE", "ADMIN")
  async create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  /**
   * Get all shifts
   */
  @Get()
  async findAll(@Query() filters: ShiftFilterDto) {
    return this.shiftsService.findAll(filters);
  }

  /**
   * Get upcoming shifts
   */
  @Get("upcoming")
  async findUpcoming(@Query("limit") limit?: string) {
    return this.shiftsService.findUpcoming(limit ? parseInt(limit) : undefined);
  }

  /**
   * Get user's shifts
   */
  @Get("my")
  async getMyShifts() {
    return this.shiftsService.getMyShifts();
  }

  /**
   * Get coverage analytics
   */
  @Get("coverage")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async getCoverage(@Query("from") from?: string, @Query("to") to?: string) {
    return this.shiftsService.getCoverage(from, to);
  }

  /**
   * Get a single shift
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.shiftsService.findOne(id);
  }

  /**
   * Update a shift (executives and admins only)
   */
  @Patch(":id")
  @Roles("EXECUTIVE", "ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  /**
   * Delete a shift (executives and admins only)
   */
  @Delete(":id")
  @Roles("EXECUTIVE", "ADMIN")
  async remove(@Param("id") id: string) {
    return this.shiftsService.remove(id);
  }

  /**
   * Sign up for a shift
   */
  @Post(":id/signup")
  async signup(@Param("id") id: string) {
    return this.shiftsService.signup(id);
  }

  /**
   * Cancel signup
   */
  @Delete(":id/signup")
  async cancelSignup(@Param("id") id: string) {
    return this.shiftsService.cancelSignup(id);
  }

  /**
   * Get shift signups
   */
  @Get(":id/signups")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async getSignups(@Param("id") id: string) {
    return this.shiftsService.getSignups(id);
  }

  /**
   * Check in volunteer
   */
  @Post(":shiftId/check-in/:membershipId")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async checkIn(
    @Param("shiftId") shiftId: string,
    @Param("membershipId") membershipId: string
  ) {
    return this.shiftsService.checkIn(shiftId, membershipId);
  }

  /**
   * Check out volunteer
   */
  @Post(":shiftId/check-out/:membershipId")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async checkOut(
    @Param("shiftId") shiftId: string,
    @Param("membershipId") membershipId: string
  ) {
    return this.shiftsService.checkOut(shiftId, membershipId);
  }
}
