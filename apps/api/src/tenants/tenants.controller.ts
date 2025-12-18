import { Controller, Get, Post, Patch, Param, Query, Body, BadRequestException, Headers, UnauthorizedException } from "@nestjs/common";
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
