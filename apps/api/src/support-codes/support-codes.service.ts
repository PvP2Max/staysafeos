import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { CreateSupportCodeDto, SupportCodeType } from "./dto/support-code.dto";
import { randomBytes } from "crypto";

@Injectable()
export class SupportCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Generate a random code
   */
  private generateCode(): string {
    return randomBytes(4).toString("hex").toUpperCase();
  }

  /**
   * Create a support code
   */
  async create(dto: CreateSupportCodeDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    // Generate unique code
    let code = this.generateCode();
    let attempts = 0;
    while (
      (await this.prisma.supportCode.findUnique({ where: { code } })) &&
      attempts < 10
    ) {
      code = this.generateCode();
      attempts++;
    }

    return this.prisma.supportCode.create({
      data: {
        organizationId: org.id,
        code,
        type: dto.type,
        grantedRole: dto.grantedRole,
        expiresAt: new Date(dto.expiresAt),
        maxUses: dto.maxUses,
        createdById: membership.id,
      },
      include: {
        createdBy: { include: { account: true } },
        _count: { select: { redemptions: true } },
      },
    });
  }

  /**
   * Get all support codes
   */
  async findAll() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.supportCode.findMany({
      where: { organizationId: org.id },
      include: {
        createdBy: { include: { account: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get active support codes
   */
  async findActive() {
    const org = this.requestContext.requireOrganization();

    return this.prisma.supportCode.findMany({
      where: {
        organizationId: org.id,
        active: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        createdBy: { include: { account: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a single code
   */
  async findOne(id: string) {
    const org = this.requestContext.requireOrganization();

    const code = await this.prisma.supportCode.findFirst({
      where: { id, organizationId: org.id },
      include: {
        createdBy: { include: { account: true } },
        redemptions: {
          include: { membership: { include: { account: true } } },
        },
        _count: { select: { redemptions: true } },
      },
    });

    if (!code) {
      throw new NotFoundException("Support code not found");
    }

    return code;
  }

  /**
   * Revoke a code
   */
  async revoke(id: string) {
    const org = this.requestContext.requireOrganization();

    const code = await this.prisma.supportCode.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!code) {
      throw new NotFoundException("Support code not found");
    }

    return this.prisma.supportCode.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Redeem a support code
   */
  async redeem(codeString: string, ipAddress?: string, userAgent?: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const code = await this.prisma.supportCode.findFirst({
      where: {
        code: codeString.toUpperCase(),
        organizationId: org.id,
        active: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!code) {
      throw new BadRequestException("Invalid or expired code");
    }

    // Check max uses
    if (code.maxUses && code.usedCount >= code.maxUses) {
      throw new BadRequestException("Code has reached maximum uses");
    }

    // Check if already redeemed by this user
    const existingRedemption = await this.prisma.supportCodeRedemption.findUnique({
      where: {
        supportCodeId_membershipId: {
          supportCodeId: code.id,
          membershipId: membership.id,
        },
      },
    });

    if (existingRedemption) {
      throw new BadRequestException("You have already redeemed this code");
    }

    // Create redemption
    await this.prisma.supportCodeRedemption.create({
      data: {
        supportCodeId: code.id,
        membershipId: membership.id,
        ipAddress,
        userAgent,
      },
    });

    // Increment used count
    await this.prisma.supportCode.update({
      where: { id: code.id },
      data: { usedCount: { increment: 1 } },
    });

    // Apply effect based on code type
    if (code.type === SupportCodeType.ROLE_ELEVATION && code.grantedRole) {
      // Temporarily elevate role
      const expiresIn5Minutes = new Date();
      expiresIn5Minutes.setMinutes(expiresIn5Minutes.getMinutes() + 5);

      await this.prisma.membership.update({
        where: { id: membership.id },
        data: {
          overrideRole: code.grantedRole,
          overrideExpiry: expiresIn5Minutes,
        },
      });

      return {
        success: true,
        message: `Role elevated to ${code.grantedRole} for 5 minutes`,
        expiresAt: expiresIn5Minutes,
      };
    }

    if (code.type === SupportCodeType.STAFF_ACCESS) {
      // Grant staff access (implementation depends on your needs)
      return {
        success: true,
        message: "Staff access granted",
      };
    }

    if (code.type === SupportCodeType.INVITE && code.grantedRole) {
      // Upgrade user role permanently
      await this.prisma.membership.update({
        where: { id: membership.id },
        data: { role: code.grantedRole },
      });

      return {
        success: true,
        message: `Role upgraded to ${code.grantedRole}`,
      };
    }

    return { success: true, message: "Code redeemed" };
  }

  /**
   * Get redemptions for a code
   */
  async getRedemptions(id: string) {
    const org = this.requestContext.requireOrganization();

    const code = await this.prisma.supportCode.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!code) {
      throw new NotFoundException("Support code not found");
    }

    return this.prisma.supportCodeRedemption.findMany({
      where: { supportCodeId: id },
      include: {
        membership: { include: { account: true } },
      },
      orderBy: { redeemedAt: "desc" },
    });
  }
}
