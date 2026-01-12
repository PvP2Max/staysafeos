import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

// Row interfaces for typed export data
export interface RideExportRow {
  rideUuid: string;
  riderName: string;
  riderRank: string | null;
  riderEmail: string | null;
  riderPhone: string;
  riderUnit: string | null;
  truckCommander: string | null;
  truckCommanderEmail: string | null;
  vanName: string | null;
  requestDate: string;
  dropoffTime: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  rideStatus: string;
}

export interface TrainingExportRow {
  name: string;
  email: string;
  phone: string | null;
  unit: string | null;
  role: string;
  safetyTraining: string | null;
  driverTraining: string | null;
  tcTraining: string | null;
  dispatcherTraining: string | null;
}

export interface ShiftExportRow {
  shiftId: string;
  roleRequired: string;
  shiftTitle: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  slotsRequired: number;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  userRole: string;
  signupTime: string;
}

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Validate date range - throws if > 30 days or invalid
   */
  validateDateRange(startDate: Date, endDate: Date): void {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid date format");
    }

    if (startDate > endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      throw new BadRequestException("Date range cannot exceed 30 days");
    }
  }

  /**
   * Export rides data with TC, van, and rider membership joins
   */
  async exportRides(startDate: Date, endDate: Date): Promise<RideExportRow[]> {
    const org = this.requestContext.requireOrganization();

    const rides = await this.prisma.ride.findMany({
      where: {
        organizationId: org.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        tc: {
          include: {
            account: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        van: {
          select: {
            name: true,
          },
        },
        riderMembership: {
          include: {
            account: {
              select: {
                rank: true,
                email: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rides.map((ride) => {
      const tcName = ride.tc?.account
        ? `${ride.tc.account.firstName || ""} ${ride.tc.account.lastName || ""}`.trim()
        : null;

      return {
        rideUuid: ride.id,
        riderName: ride.riderName,
        riderRank: ride.riderMembership?.account?.rank || null,
        riderEmail: ride.riderMembership?.account?.email || null,
        riderPhone: ride.riderPhone,
        riderUnit: ride.riderMembership?.account?.unit || null,
        truckCommander: tcName || null,
        truckCommanderEmail: ride.tc?.account?.email || null,
        vanName: ride.van?.name || null,
        requestDate: ride.createdAt.toISOString(),
        dropoffTime: ride.completedAt?.toISOString() || null,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        rideStatus: ride.status,
      };
    });
  }

  /**
   * Export training data - all active memberships with training timestamps
   */
  async exportTraining(): Promise<TrainingExportRow[]> {
    const org = this.requestContext.requireOrganization();

    const memberships = await this.prisma.membership.findMany({
      where: {
        organizationId: org.id,
        status: "ACTIVE",
      },
      include: {
        account: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            unit: true,
          },
        },
      },
      orderBy: {
        account: {
          lastName: "asc",
        },
      },
    });

    return memberships.map((membership) => {
      const name = `${membership.account.firstName || ""} ${membership.account.lastName || ""}`.trim();

      return {
        name: name || "Unknown",
        email: membership.account.email,
        phone: membership.account.phone || null,
        unit: membership.account.unit || null,
        role: membership.role,
        safetyTraining: membership.trainingSafetyAt?.toISOString() || null,
        driverTraining: membership.trainingDriverAt?.toISOString() || null,
        tcTraining: membership.trainingTcAt?.toISOString() || null,
        dispatcherTraining: membership.trainingDispatcherAt?.toISOString() || null,
      };
    });
  }

  /**
   * Export shifts data - one row per signup
   */
  async exportShifts(startDate: Date, endDate: Date): Promise<ShiftExportRow[]> {
    const org = this.requestContext.requireOrganization();

    const shifts = await this.prisma.shift.findMany({
      where: {
        organizationId: org.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        signups: {
          include: {
            membership: {
              include: {
                account: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const rows: ShiftExportRow[] = [];

    for (const shift of shifts) {
      for (const signup of shift.signups) {
        const userName = `${signup.membership.account.firstName || ""} ${signup.membership.account.lastName || ""}`.trim();

        rows.push({
          shiftId: shift.id,
          roleRequired: shift.role,
          shiftTitle: shift.title,
          shiftDate: shift.startTime.toISOString().split("T")[0],
          startTime: shift.startTime.toISOString(),
          endTime: shift.endTime.toISOString(),
          slotsRequired: shift.slotsNeeded,
          userId: signup.membership.account.id,
          userName: userName || "Unknown",
          userEmail: signup.membership.account.email,
          userPhone: signup.membership.account.phone || null,
          userRole: signup.membership.role,
          signupTime: signup.createdAt.toISOString(),
        });
      }
    }

    return rows;
  }
}
