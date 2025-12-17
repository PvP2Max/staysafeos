import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { LogtoAuthGuard, Public } from "../auth/logto-auth.guard";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(":slug")
  @Public()
  async getTenant(@Param("slug") slug: string) {
    return this.tenantsService.findBySlug(slug);
  }
}
