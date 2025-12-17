import { Controller, Get, Post, Param, Query, Body, BadRequestException } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { LogtoAuthGuard, Public } from "../auth/logto-auth.guard";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { RequestContextService } from "../common/context/request-context.service";

@Controller("tenants")
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * List all tenants (partners) - public endpoint
   */
  @Get()
  @Public()
  async listTenants(@Query("search") search?: string) {
    return this.tenantsService.findAll(search);
  }

  /**
   * Check if a slug is available - public endpoint
   */
  @Get("check-slug/:slug")
  @Public()
  async checkSlugAvailability(@Param("slug") slug: string) {
    const exists = await this.tenantsService.slugExists(slug);
    return { available: !exists, slug };
  }

  /**
   * Get tenant by slug - public endpoint
   */
  @Get(":slug")
  @Public()
  async getTenant(@Param("slug") slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  /**
   * Create a new tenant - requires authentication
   */
  @Post()
  async createTenant(@Body() dto: CreateTenantDto) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new BadRequestException("Authentication required to create a tenant");
    }
    return this.tenantsService.create(dto, accountId);
  }
}
