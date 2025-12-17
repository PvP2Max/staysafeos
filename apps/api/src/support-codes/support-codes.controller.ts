import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { SupportCodesService } from "./support-codes.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";
import { CreateSupportCodeDto, RedeemCodeDto } from "./dto/support-code.dto";

@Controller("support-codes")
@UseGuards(LogtoAuthGuard)
export class SupportCodesController {
  constructor(private readonly supportCodesService: SupportCodesService) {}

  /**
   * Create a support code
   */
  @Post()
  @Roles("EXECUTIVE", "ADMIN")
  async create(@Body() dto: CreateSupportCodeDto) {
    return this.supportCodesService.create(dto);
  }

  /**
   * Get all support codes
   */
  @Get()
  @Roles("EXECUTIVE", "ADMIN")
  async findAll() {
    return this.supportCodesService.findAll();
  }

  /**
   * Get active support codes
   */
  @Get("active")
  @Roles("EXECUTIVE", "ADMIN")
  async findActive() {
    return this.supportCodesService.findActive();
  }

  /**
   * Redeem a code
   */
  @Post("redeem")
  async redeem(@Body() dto: RedeemCodeDto, @Req() req: FastifyRequest) {
    return this.supportCodesService.redeem(
      dto.code,
      req.ip,
      req.headers["user-agent"] as string
    );
  }

  /**
   * Get a single code
   */
  @Get(":id")
  @Roles("EXECUTIVE", "ADMIN")
  async findOne(@Param("id") id: string) {
    return this.supportCodesService.findOne(id);
  }

  /**
   * Revoke a code
   */
  @Delete(":id")
  @Roles("EXECUTIVE", "ADMIN")
  async revoke(@Param("id") id: string) {
    return this.supportCodesService.revoke(id);
  }

  /**
   * Get redemptions for a code
   */
  @Get(":id/redemptions")
  @Roles("EXECUTIVE", "ADMIN")
  async getRedemptions(@Param("id") id: string) {
    return this.supportCodesService.getRedemptions(id);
  }
}
