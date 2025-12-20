import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Get current user's account with membership and owned tenants
   */
  async getMe() {
    const accountId = this.requestContext.accountId;
    if (!accountId) {
      throw new Error("Not authenticated");
    }

    // Fetch owned tenants
    const ownedTenants = await this.prisma.organization.findMany({
      where: { ownerAccountId: accountId },
      select: {
        id: true,
        slug: true,
        name: true,
        subscriptionTier: true,
      },
    });

    return {
      account: this.requestContext.store?.account,
      membership: this.requestContext.store?.membership,
      ownedTenants,
    };
  }

  /**
   * Get membership status for current tenant
   * Used by frontend to redirect users without membership
   */
  async getMembershipStatus() {
    const store = this.requestContext.store;
    return {
      hasAccount: !!store?.accountId,
      hasMembership: !!store?.membership,
      tenantSlug: store?.tenantSlug || null,
      role: store?.membership?.role || null,
    };
  }

  /**
   * Debug endpoint - returns full context for troubleshooting auth issues
   */
  async getDebugInfo() {
    const store = this.requestContext.store;
    const accountId = store?.accountId;

    // Get all memberships for this account
    let allMemberships: Array<{ orgSlug: string; orgId: string; role: string }> = [];
    if (accountId) {
      const memberships = await this.prisma.membership.findMany({
        where: { accountId },
        include: {
          organization: {
            select: { slug: true, id: true, name: true },
          },
        },
      });
      allMemberships = memberships.map((m) => ({
        orgSlug: m.organization.slug,
        orgId: m.organization.id,
        orgName: m.organization.name,
        role: m.role,
        status: m.status,
      }));
    }

    // Get owned orgs
    let ownedOrgs: Array<{ slug: string; id: string; name: string }> = [];
    if (accountId) {
      const orgs = await this.prisma.organization.findMany({
        where: { ownerAccountId: accountId },
        select: { slug: true, id: true, name: true },
      });
      ownedOrgs = orgs;
    }

    return {
      context: {
        accountId: store?.accountId || null,
        account: store?.account || null,
        tenantSlug: store?.tenantSlug || null,
        organizationId: store?.organizationId || null,
        organization: store?.organization || null,
        membership: store?.membership || null,
      },
      allMemberships,
      ownedOrgs,
      diagnosis: {
        hasAccount: !!store?.accountId,
        hasTenantSlug: !!store?.tenantSlug,
        hasMembership: !!store?.membership,
        membershipCount: allMemberships.length,
        ownedOrgCount: ownedOrgs.length,
      },
    };
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    rank?: string | null;
    unit?: string | null;
    homeAddress?: string | null;
    homeLat?: number | null;
    homeLng?: number | null;
  }) {
    const accountId = this.requestContext.accountId;
    if (!accountId) {
      throw new Error("Not authenticated");
    }

    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        rank: data.rank,
        unit: data.unit,
        homeAddress: data.homeAddress,
        homeLat: data.homeLat,
        homeLng: data.homeLng,
      },
    });

    this.requestContext.setAccount({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
    });

    return this.getMe();
  }

  /**
   * Check profile completion against organization requirements
   */
  async getProfileCompletion() {
    const store = this.requestContext.store;
    const accountId = store?.accountId;
    const organizationId = store?.organizationId;

    if (!accountId) {
      throw new Error("Not authenticated");
    }

    // Get account with full profile data
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        rank: true,
        unit: true,
        homeAddress: true,
        homeLat: true,
        homeLng: true,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Get organization settings if in tenant context
    let requiredFields = { rank: false, org: false, home: false };
    if (organizationId) {
      const settings = await this.prisma.organizationSettings.findUnique({
        where: { organizationId },
        select: {
          rankRequired: true,
          orgRequired: true,
          homeRequired: true,
        },
      });

      if (settings) {
        requiredFields = {
          rank: settings.rankRequired,
          org: settings.orgRequired,
          home: settings.homeRequired,
        };
      }
    }

    // Check which required fields are missing
    const missingFields: string[] = [];

    // Name and phone are always required
    if (!account.firstName || !account.lastName) {
      missingFields.push("name");
    }
    if (!account.phone) {
      missingFields.push("phone");
    }

    // Check configurable requirements
    if (requiredFields.rank && !account.rank) {
      missingFields.push("rank");
    }
    if (requiredFields.org && !account.unit) {
      missingFields.push("unit");
    }
    if (requiredFields.home && !account.homeAddress) {
      missingFields.push("homeAddress");
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      requiredFields,
      account: {
        firstName: account.firstName,
        lastName: account.lastName,
        phone: account.phone,
        rank: account.rank,
        unit: account.unit,
        homeAddress: account.homeAddress,
        homeLat: account.homeLat,
        homeLng: account.homeLng,
      },
    };
  }

  /**
   * Check if current user is on-shift for any roles
   * Returns which roles they are currently on-shift for
   */
  async getOnShiftStatus() {
    const store = this.requestContext.store;
    const membershipId = store?.membership?.id;

    if (!membershipId) {
      return { onShift: false, roles: {} };
    }

    const now = new Date();

    // Find all active shift signups for this user
    const activeSignups = await this.prisma.shiftSignup.findMany({
      where: {
        membershipId,
        status: "CONFIRMED",
        shift: {
          startTime: { lte: now },
          endTime: { gte: now },
        },
      },
      include: {
        shift: {
          select: { role: true },
        },
      },
    });

    // Build roles map
    const roles: Record<string, boolean> = {};
    for (const signup of activeSignups) {
      roles[signup.shift.role] = true;
    }

    return {
      onShift: activeSignups.length > 0,
      roles,
      activeShiftCount: activeSignups.length,
    };
  }
}
