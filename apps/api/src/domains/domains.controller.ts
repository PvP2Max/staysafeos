import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { DomainsService, CreateDomainInput } from "./domains.service";
import { LogtoAuthGuard, Public, Roles } from "../auth/logto-auth.guard";

@Controller("domains")
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  /**
   * Get all domains for current tenant
   */
  @Get()
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async getDomains() {
    return this.domainsService.findAllForCurrentTenant();
  }

  /**
   * Add a new domain
   */
  @Post()
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async addDomain(@Body() data: CreateDomainInput) {
    return this.domainsService.create(data);
  }

  /**
   * Get DNS records for a specific domain
   */
  @Get(":id")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async getDomain(@Param("id") id: string) {
    return this.domainsService.findById(id);
  }

  /**
   * Verify DNS configuration for a domain
   */
  @Post(":id/verify")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async verifyDomain(@Param("id") id: string) {
    return this.domainsService.verify(id);
  }

  /**
   * Set a domain as primary
   */
  @Post(":id/primary")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async setPrimaryDomain(@Param("id") id: string) {
    return this.domainsService.setPrimary(id);
  }

  /**
   * Remove a domain
   */
  @Delete(":id")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDomain(@Param("id") id: string) {
    await this.domainsService.delete(id);
  }

  /**
   * Public endpoint for domain lookup (used by App for tenant resolution)
   */
  @Get("lookup/:domain")
  @Public()
  async lookupDomain(@Param("domain") domain: string) {
    const result = await this.domainsService.findVerifiedByDomain(domain);
    if (!result) {
      return { found: false };
    }
    return {
      found: true,
      organizationSlug: result.organization.slug,
    };
  }
}
