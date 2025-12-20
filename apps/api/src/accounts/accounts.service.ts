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
   * Update current user's profile
   */
  async updateProfile(data: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
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
