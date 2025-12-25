import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { LogtoJwtService, LogtoTokenPayload } from "./logto-jwt.service";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

// Decorator to mark routes as public (no auth required)
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Decorator to require specific roles
export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Extend request with user info
declare module "fastify" {
  interface FastifyRequest {
    user?: LogtoTokenPayload;
  }
}

@Injectable()
export class LogtoAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logtoJwt: LogtoJwtService,
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Extract and verify token from header first, then fallback to query params
    // (SSE connections can't set headers, so token is passed as query param)
    let token = this.logtoJwt.extractTokenFromHeader(
      request.headers.authorization
    );

    // Fallback to query param for SSE connections
    if (!token && request.query) {
      const queryToken = (request.query as Record<string, string>).token;
      if (queryToken) {
        token = queryToken;
      }
    }

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException("Missing authorization token");
    }

    const payload = await this.logtoJwt.verifyToken(token);
    if (!payload) {
      if (isPublic) return true;
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Attach user to request
    request.user = payload;

    // Load account and membership from database
    await this.loadAccountContext(payload);

    // Check required roles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const membership = this.requestContext.store?.membership;
      if (!membership || !requiredRoles.includes(membership.role)) {
        throw new UnauthorizedException(
          `Required role: ${requiredRoles.join(" or ")}`
        );
      }
    }

    return true;
  }

  /**
   * Load account and membership info into request context
   * Auto-creates account if it doesn't exist (JIT provisioning)
   */
  private async loadAccountContext(payload: LogtoTokenPayload): Promise<void> {
    // Find or create account by Logto user ID
    let account = await this.prisma.account.findUnique({
      where: { logtoUserId: payload.sub },
    });

    if (!account) {
      // Auto-provision account from Logto token claims (JIT provisioning)
      if (!payload.email) {
        console.warn(
          `[auth] Cannot auto-provision account for ${payload.sub} - no email in token`
        );
        return;
      }

      // Parse name from token if available
      const nameParts = payload.name?.split(" ") || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(" ") || null;

      try {
        account = await this.prisma.account.create({
          data: {
            logtoUserId: payload.sub,
            email: payload.email,
            firstName,
            lastName,
          },
        });
        console.log(
          `[auth] Auto-provisioned account for ${payload.email} (${payload.sub})`
        );
      } catch (error) {
        // Handle race condition - account may have been created by another request
        account = await this.prisma.account.findUnique({
          where: { logtoUserId: payload.sub },
        });
        if (!account) {
          console.error(
            `[auth] Failed to provision account for ${payload.sub}:`,
            error
          );
          return;
        }
      }
    }

    // Update context with account info
    this.requestContext.setAccount({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
    });

    // Get tenant slug from context or header
    const tenantSlug = this.requestContext.tenantSlug;
    if (!tenantSlug) {
      console.log(`[auth] No tenant slug in context for account ${account.id} (${account.email})`);
      return;
    }

    // Load membership for this tenant (support slug, database ID, or Logto org ID)
    // Use case-insensitive matching for slug since subdomains are lowercase
    const membership = await this.prisma.membership.findFirst({
      where: {
        accountId: account.id,
        OR: [
          { organization: { slug: { equals: tenantSlug, mode: "insensitive" } } },
          { organization: { logtoOrgId: tenantSlug } },
          { organizationId: tenantSlug },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
            subscriptionTier: true,
          },
        },
      },
    });

    if (!membership) {
      // Debug: Log why membership wasn't found
      console.log(`[auth] No membership found for account ${account.id} in tenant "${tenantSlug}"`);

      // Check if any membership exists for this account
      const anyMembership = await this.prisma.membership.findFirst({
        where: { accountId: account.id },
        include: { organization: { select: { slug: true, id: true } } },
      });
      if (anyMembership) {
        console.log(`[auth] Account has membership in org: ${anyMembership.organization.slug} (${anyMembership.organization.id}), role: ${anyMembership.role}`);
      } else {
        console.log(`[auth] Account has no memberships at all`);
      }

      // Auto-create RIDER membership for the tenant
      // Use case-insensitive matching for slug since subdomains are lowercase
      const organization = await this.prisma.organization.findFirst({
        where: {
          OR: [
            { slug: { equals: tenantSlug, mode: "insensitive" } },
            { logtoOrgId: tenantSlug },
            { id: tenantSlug },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          subscriptionTier: true,
        },
      });

      if (organization) {
        try {
          const newMembership = await this.prisma.membership.create({
            data: {
              accountId: account.id,
              organizationId: organization.id,
              role: "RIDER",
            },
          });
          console.log(`[auth] Auto-created RIDER membership for ${account.email} in org ${organization.slug}`);

          // Set membership in context
          this.requestContext.setMembership({
            id: newMembership.id,
            role: newMembership.role,
            tenantId: newMembership.organizationId,
            tenant: organization,
          });

          this.requestContext.setOrganization({
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            subscriptionTier: organization.subscriptionTier,
          });
          return;
        } catch (error) {
          console.error(`[auth] Failed to auto-create RIDER membership:`, error);
        }
      } else {
        console.log(`[auth] Organization not found for tenant slug "${tenantSlug}", cannot auto-create membership`);
      }
    }

    if (membership) {
      this.requestContext.setMembership({
        id: membership.id,
        role: membership.role,
        tenantId: membership.organizationId,
        tenant: membership.organization,
      });

      this.requestContext.setOrganization({
        id: membership.organization.id,
        slug: membership.organization.slug,
        name: membership.organization.name,
        subscriptionTier: membership.organization.subscriptionTier,
      });
    }
  }
}
