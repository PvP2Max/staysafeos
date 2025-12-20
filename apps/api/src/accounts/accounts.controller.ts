import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { LogtoAuthGuard } from "../auth/logto-auth.guard";
import { IsString, IsOptional } from "class-validator";

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;
}

@Controller("me")
@UseGuards(LogtoAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getMe() {
    return this.accountsService.getMe();
  }

  /**
   * Quick endpoint to check if user has membership for current tenant
   */
  @Get("membership-status")
  async getMembershipStatus() {
    return this.accountsService.getMembershipStatus();
  }

  @Put()
  async updateProfile(@Body() dto: UpdateProfileDto) {
    return this.accountsService.updateProfile(dto);
  }

  /**
   * Check if current user is on-shift
   */
  @Get("on-shift")
  async getOnShiftStatus() {
    return this.accountsService.getOnShiftStatus();
  }
}
