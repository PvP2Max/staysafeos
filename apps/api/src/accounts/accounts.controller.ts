import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { LogtoAuthGuard } from "../auth/logto-auth.guard";
import { IsString, IsOptional, IsNumber } from "class-validator";

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

  @IsOptional()
  @IsString()
  rank?: string | null;

  @IsOptional()
  @IsString()
  unit?: string | null;

  @IsOptional()
  @IsString()
  homeAddress?: string | null;

  @IsOptional()
  @IsNumber()
  homeLat?: number | null;

  @IsOptional()
  @IsNumber()
  homeLng?: number | null;
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

  /**
   * Check profile completion status against org requirements
   */
  @Get("profile-completion")
  async getProfileCompletion() {
    return this.accountsService.getProfileCompletion();
  }
}
