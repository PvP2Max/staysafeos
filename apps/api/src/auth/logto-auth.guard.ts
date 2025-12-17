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

    // Extract and verify token
    const token = this.logtoJwt.extractTokenFromHeader(
      request.headers.authorization
    );

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
   */
  private async loadAccountContext(payload: LogtoTokenPayload): Promise<void> {
    // Find account by Logto user ID
    const account = await this.prisma.account.findUnique({
      where: { logtoUserId: payload.sub },
    });

    if (!account) {
      // Account not synced yet - this is handled by webhooks
      return;
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
    if (!tenantSlug) return;

    // Load membership for this tenant
    const membership = await this.prisma.membership.findFirst({
      where: {
        accountId: account.id,
        organization: { slug: tenantSlug },
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
