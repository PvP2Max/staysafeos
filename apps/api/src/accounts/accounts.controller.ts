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

  @Put()
  async updateProfile(@Body() dto: UpdateProfileDto) {
    return this.accountsService.updateProfile(dto);
  }
}
