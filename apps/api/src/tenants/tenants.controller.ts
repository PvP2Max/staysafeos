import { Controller, Get, Post, Patch, Delete, Param, Query, Body, BadRequestException, Headers, UnauthorizedException, UseGuards } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { LogtoAuthGuard, Public } from "../auth/logto-auth.guard";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { RequestContextService } from "../common/context/request-context.service";

@Controller("tenants")
@UseGuards(LogtoAuthGuard)
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
    console.log(`[tenants] GET /:slug called with slug="${slug}"`);
    const tenant = await this.tenantsService.findBySlug(slug);
    console.log(`[tenants] GET /:slug result for "${slug}":`, tenant ? `found (id: ${tenant.id}, slug: ${tenant.slug})` : 'null');
    return tenant;
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

  /**
   * Get current user's tenant with branding/theme data
   * Uses the first owned tenant of the authenticated user
   */
  @Get("current")
  async getCurrentTenant() {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.getCurrentTenantWithBranding(accountId);
  }

  /**
   * Update current user's tenant branding/theme
   * Uses the first owned tenant of the authenticated user
   */
  @Patch("current")
  async updateCurrentTenant(
    @Body() body: {
      name?: string;
      logoUrl?: string;
      faviconUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      tertiaryColor?: string;
    }
  ) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.updateCurrentTenantBranding(accountId, body);
  }

  /**
   * Get members for current tenant
   */
  @Get("current/members")
  async getCurrentMembers(
    @Query("search") search?: string,
    @Query("role") role?: string
  ) {
    return this.tenantsService.getCurrentOrgMembers({ search, role });
  }

  /**
   * Update member role
   */
  @Patch("current/members/:membershipId/role")
  async updateMemberRole(
    @Param("membershipId") membershipId: string,
    @Body() body: { role: string }
  ) {
    return this.tenantsService.updateMemberRole(membershipId, body.role);
  }

  /**
   * Remove member from organization
   */
  @Delete("current/members/:membershipId")
  async removeMember(@Param("membershipId") membershipId: string) {
    return this.tenantsService.removeMember(membershipId);
  }

  /**
   * Update Stripe customer ID for an organization
   */
  @Patch(":id/stripe-customer")
  async updateStripeCustomer(
    @Param("id") id: string,
    @Body() body: { stripeCustomerId: string }
  ) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    // Verify the user owns this organization
    const org = await this.tenantsService.findById(id);
    if (!org || org.ownerAccountId !== accountId) {
      throw new UnauthorizedException("You don't have permission to update this organization");
    }

    return this.tenantsService.updateStripeCustomer(id, body.stripeCustomerId);
  }
}

/**
 * Organizations controller - provides ID-based access for billing and internal operations
 */
@Controller("organizations")
@UseGuards(LogtoAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Get organization by ID - requires authentication and ownership/membership
   */
  @Get(":id")
  async getOrganization(@Param("id") id: string) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    const org = await this.tenantsService.findById(id);
    if (!org) {
      throw new BadRequestException("Organization not found");
    }

    // Verify the user owns this organization or is a member
    if (org.ownerAccountId !== accountId) {
      // TODO: Add membership check when needed
      throw new UnauthorizedException("You don't have access to this organization");
    }

    return org;
  }

  /**
   * Update Stripe customer ID for an organization
   */
  @Patch(":id/stripe-customer")
  async updateStripeCustomer(
    @Param("id") id: string,
    @Body() body: { stripeCustomerId: string }
  ) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    const org = await this.tenantsService.findById(id);
    if (!org || org.ownerAccountId !== accountId) {
      throw new UnauthorizedException("You don't have permission to update this organization");
    }

    return this.tenantsService.updateStripeCustomer(id, body.stripeCustomerId);
  }

  /**
   * Get organization features (owner only)
   */
  @Get(":id/features")
  async getFeatures(@Param("id") id: string) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.getOrganizationFeatures(id, accountId);
  }

  /**
   * Update organization features (owner only)
   */
  @Patch(":id/features")
  async updateFeatures(
    @Param("id") id: string,
    @Body() body: Record<string, boolean>
  ) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.updateOrganizationFeatures(id, accountId, body);
  }

  /**
   * Delete organization (owner only)
   * Archives stats to GlobalStats before hard deletion
   */
  @Delete(":id")
  async deleteOrganization(@Param("id") id: string) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.deleteOrganization(id, accountId);
  }

  /**
   * Get organization settings including required fields (owner only)
   */
  @Get(":id/settings")
  async getSettings(@Param("id") id: string) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.getOrganizationSettings(id, accountId);
  }

  /**
   * Update organization settings including required fields (owner only)
   */
  @Patch(":id/settings")
  async updateSettings(
    @Param("id") id: string,
    @Body() body: {
      rankRequired?: boolean;
      orgRequired?: boolean;
      homeRequired?: boolean;
      autoAssignEnabled?: boolean;
    }
  ) {
    const accountId = this.requestContext.store?.accountId;
    if (!accountId) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.tenantsService.updateOrganizationSettings(id, accountId, body);
  }
}

/**
 * Internal controller for webhook updates (separate route prefix)
 */
@Controller("internal/organizations")
export class InternalOrganizationsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Update subscription data from Stripe webhook
   * Protected by internal API key
   */
  @Patch(":id/subscription")
  @Public()
  async updateSubscription(
    @Param("id") id: string,
    @Headers("x-internal-key") internalKey: string,
    @Body()
    body: {
      subscriptionTier?: string;
      subscriptionStatus?: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string | null;
    }
  ) {
    // Verify internal API key
    const expectedKey = process.env.INTERNAL_API_KEY;
    if (!expectedKey || internalKey !== expectedKey) {
      throw new UnauthorizedException("Invalid internal API key");
    }

    return this.tenantsService.updateSubscription(id, body);
  }
}
