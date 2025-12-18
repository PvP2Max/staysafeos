import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jose from "jose";

export type LogtoTokenPayload = {
  sub: string; // Logto user ID
  iss: string; // Issuer (Logto endpoint)
  aud: string; // Audience (API identifier)
  iat: number; // Issued at
  exp: number; // Expiration
  scope?: string;
  client_id?: string;
  // Custom claims from Logto
  email?: string;
  email_verified?: boolean;
  name?: string;
  organizations?: string[]; // Organization IDs user belongs to
  organization_roles?: Record<string, string[]>; // Org ID -> roles
};

@Injectable()
export class LogtoJwtService implements OnModuleInit {
  private jwks: jose.JWTVerifyGetKey | null = null;
  private issuer: string = "";
  private audience: string = "";

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const logtoEndpoint = this.config.get<string>("LOGTO_ENDPOINT");
    this.audience = this.config.get<string>("LOGTO_AUDIENCE") || "";

    if (!logtoEndpoint) {
      console.warn(
        "[auth] LOGTO_ENDPOINT not configured - JWT validation disabled"
      );
      return;
    }

    // Logto's OIDC issuer includes /oidc path
    this.issuer = `${logtoEndpoint}/oidc`;

    // Fetch JWKS from Logto's well-known endpoint
    const jwksUri = `${logtoEndpoint}/oidc/jwks`;
    this.jwks = jose.createRemoteJWKSet(new URL(jwksUri));

    console.log(`[auth] Logto JWT validation configured for ${logtoEndpoint}`);
  }

  /**
   * Verify a JWT token from Logto
   */
  async verifyToken(token: string): Promise<LogtoTokenPayload | null> {
    if (!this.jwks) {
      console.warn("[auth] JWKS not initialized - skipping verification");
      return null;
    }

    try {
      const { payload } = await jose.jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience || undefined,
      });

      return payload as LogtoTokenPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[auth] JWT verification failed: ${message}`);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) return null;

    return token;
  }

  /**
   * Check if a user has a specific role in an organization
   */
  hasOrganizationRole(
    payload: LogtoTokenPayload,
    orgId: string,
    role: string
  ): boolean {
    const roles = payload.organization_roles?.[orgId];
    if (!roles) return false;
    return roles.includes(role);
  }

  /**
   * Check if user is member of an organization
   */
  isOrganizationMember(payload: LogtoTokenPayload, orgId: string): boolean {
    return payload.organizations?.includes(orgId) ?? false;
  }
}
