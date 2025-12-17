import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { CreateShiftDto, UpdateShiftDto, ShiftFilterDto } from "./dto/shifts.dto";

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Create a shift
   */
  async create(dto: CreateShiftDto) {
    const org = this.requestContext.requireOrganization();

    return this.prisma.shift.create({
      data: {
        organizationId: org.id,
        title: dto.title,
        description: dto.description,
        role: dto.role,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        slotsNeeded: dto.slotsNeeded,
        location: dto.location,
        notes: dto.notes,
      },
      include: {
        signups: {
          include: {
            membership: { include: { account: true } },
          },
        },
        _count: { select: { signups: true } },
      },
    });
  }

  /**
   * Get all shifts
   */
  async findAll(filters: ShiftFilterDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const where: any = {
      organizationId: org.id,
    };

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.from) {
      where.startTime = { gte: new Date(filters.from) };
    }

    if (filters.to) {
      where.endTime = { ...(where.endTime ?? {}), lte: new Date(filters.to) };
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      include: {
        signups: {
          include: {
            membership: { include: { account: true } },
          },
        },
        _count: { select: { signups: true } },
      },
      orderBy: { startTime: "asc" },
      take: filters.take ?? 50,
      skip: filters.skip ?? 0,
    });

    // Add user's signup status
    return shifts.map((shift) => ({
      ...shift,
      userSignup: membership
        ? shift.signups.find((s) => s.membershipId === membership.id) ?? null
        : null,
      slotsRemaining: shift.slotsNeeded - shift.signups.length,
    }));
  }

  /**
   * Get upcoming shifts
   */
  async findUpcoming(limit = 10) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const shifts = await this.prisma.shift.findMany({
      where: {
        organizationId: org.id,
        startTime: { gte: new Date() },
      },
      include: {
        signups: {
          include: {
            membership: { include: { account: true } },
          },
        },
        _count: { select: { signups: true } },
      },
      orderBy: { startTime: "asc" },
      take: limit,
    });

    return shifts.map((shift) => ({
      ...shift,
      userSignup: membership
        ? shift.signups.find((s) => s.membershipId === membership.id) ?? null
        : null,
      slotsRemaining: shift.slotsNeeded - shift.signups.length,
    }));
  }

  /**
   * Get a single shift
   */
  async findOne(id: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const shift = await this.prisma.shift.findFirst({
      where: { id, organizationId: org.id },
      include: {
        signups: {
          include: {
            membership: { include: { account: true } },
          },
        },
        _count: { select: { signups: true } },
      },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    return {
      ...shift,
      userSignup: membership
        ? shift.signups.find((s) => s.membershipId === membership.id) ?? null
        : null,
      slotsRemaining: shift.slotsNeeded - shift.signups.length,
    };
  }

  /**
   * Update a shift
   */
  async update(id: string, dto: UpdateShiftDto) {
    const org = this.requestContext.requireOrganization();

    const shift = await this.prisma.shift.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
      include: {
        signups: {
          include: {
            membership: { include: { account: true } },
          },
        },
        _count: { select: { signups: true } },
      },
    });
  }

  /**
   * Delete a shift
   */
  async remove(id: string) {
    const org = this.requestContext.requireOrganization();

    const shift = await this.prisma.shift.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    await this.prisma.shift.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Sign up for a shift
   */
  async signup(shiftId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organizationId: org.id },
      include: { _count: { select: { signups: true } } },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    // Check if shift is full
    if (shift._count.signups >= shift.slotsNeeded) {
      throw new BadRequestException("Shift is full");
    }

    // Check if shift has passed
    if (new Date(shift.startTime) < new Date()) {
      throw new BadRequestException("Cannot sign up for past shifts");
    }

    // Check if already signed up
    const existingSignup = await this.prisma.shiftSignup.findUnique({
      where: {
        shiftId_membershipId: {
          shiftId,
          membershipId: membership.id,
        },
      },
    });

    if (existingSignup) {
      throw new BadRequestException("Already signed up for this shift");
    }

    return this.prisma.shiftSignup.create({
      data: {
        shiftId,
        membershipId: membership.id,
        status: "CONFIRMED",
      },
      include: {
        shift: true,
        membership: { include: { account: true } },
      },
    });
  }

  /**
   * Cancel signup
   */
  async cancelSignup(shiftId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const signup = await this.prisma.shiftSignup.findUnique({
      where: {
        shiftId_membershipId: {
          shiftId,
          membershipId: membership.id,
        },
      },
      include: { shift: true },
    });

    if (!signup) {
      throw new NotFoundException("Signup not found");
    }

    // Check if shift has passed
    if (new Date(signup.shift.startTime) < new Date()) {
      throw new BadRequestException("Cannot cancel past shift signups");
    }

    await this.prisma.shiftSignup.delete({
      where: { id: signup.id },
    });

    return { success: true };
  }

  /**
   * Get shift signups
   */
  async getSignups(shiftId: string) {
    const org = this.requestContext.requireOrganization();

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organizationId: org.id },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    return this.prisma.shiftSignup.findMany({
      where: { shiftId },
      include: {
        membership: { include: { account: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Check in volunteer
   */
  async checkIn(shiftId: string, membershipId: string) {
    const org = this.requestContext.requireOrganization();

    const signup = await this.prisma.shiftSignup.findFirst({
      where: {
        shiftId,
        membershipId,
        shift: { organizationId: org.id },
      },
    });

    if (!signup) {
      throw new NotFoundException("Signup not found");
    }

    return this.prisma.shiftSignup.update({
      where: { id: signup.id },
      data: { checkedInAt: new Date() },
      include: {
        membership: { include: { account: true } },
      },
    });
  }

  /**
   * Check out volunteer
   */
  async checkOut(shiftId: string, membershipId: string) {
    const org = this.requestContext.requireOrganization();

    const signup = await this.prisma.shiftSignup.findFirst({
      where: {
        shiftId,
        membershipId,
        shift: { organizationId: org.id },
      },
    });

    if (!signup) {
      throw new NotFoundException("Signup not found");
    }

    return this.prisma.shiftSignup.update({
      where: { id: signup.id },
      data: { checkedOutAt: new Date() },
      include: {
        membership: { include: { account: true } },
      },
    });
  }

  /**
   * Get coverage analytics
   */
  async getCoverage(from?: string, to?: string) {
    const org = this.requestContext.requireOrganization();

    const where: any = {
      organizationId: org.id,
    };

    if (from) {
      where.startTime = { gte: new Date(from) };
    }
    if (to) {
      where.endTime = { ...(where.endTime ?? {}), lte: new Date(to) };
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      include: {
        _count: { select: { signups: true } },
      },
    });

    const byRole: Record<string, { total: number; filled: number; needed: number }> = {};

    for (const shift of shifts) {
      if (!byRole[shift.role]) {
        byRole[shift.role] = { total: 0, filled: 0, needed: 0 };
      }

      byRole[shift.role].total++;
      byRole[shift.role].needed += shift.slotsNeeded;
      byRole[shift.role].filled += Math.min(shift._count.signups, shift.slotsNeeded);
    }

    return {
      byRole,
      totalShifts: shifts.length,
      totalSlotsNeeded: shifts.reduce((sum, s) => sum + s.slotsNeeded, 0),
      totalSlotsFilled: shifts.reduce(
        (sum, s) => sum + Math.min(s._count.signups, s.slotsNeeded),
        0
      ),
    };
  }

  /**
   * Get user's shifts
   */
  async getMyShifts() {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    return this.prisma.shiftSignup.findMany({
      where: {
        membershipId: membership.id,
        shift: {
          organizationId: org.id,
          startTime: { gte: new Date() },
        },
      },
      include: {
        shift: true,
      },
      orderBy: { shift: { startTime: "asc" } },
    });
  }
}
