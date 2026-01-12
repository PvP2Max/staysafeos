import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";
import * as ExcelJS from "exceljs";
import { ExportsService, RideExportRow, TrainingExportRow, ShiftExportRow } from "./exports.service";
import { ExportQueryDto, TrainingExportQueryDto, ExportFormat } from "./dto/export.dto";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";

@Controller("exports")
@UseGuards(LogtoAuthGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  /**
   * Export rides data
   */
  @Get("rides")
  @Roles("EXECUTIVE", "ADMIN")
  async exportRides(@Query() query: ExportQueryDto, @Res() reply: FastifyReply) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    this.exportsService.validateDateRange(startDate, endDate);

    const rows = await this.exportsService.exportRides(startDate, endDate);
    const format = query.format || ExportFormat.CSV;
    const filename = `rides_${query.startDate}_${query.endDate}`;

    if (format === ExportFormat.XLSX) {
      const buffer = await this.generateRidesExcel(rows);
      reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="${filename}.xlsx"`)
        .send(buffer);
    } else {
      const csv = this.generateRidesCsv(rows);
      reply
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", `attachment; filename="${filename}.csv"`)
        .send(csv);
    }
  }

  /**
   * Export training data
   */
  @Get("training")
  @Roles("EXECUTIVE", "ADMIN")
  async exportTraining(@Query() query: TrainingExportQueryDto, @Res() reply: FastifyReply) {
    const rows = await this.exportsService.exportTraining();
    const format = query.format || ExportFormat.CSV;
    const filename = `training_${new Date().toISOString().split("T")[0]}`;

    if (format === ExportFormat.XLSX) {
      const buffer = await this.generateTrainingExcel(rows);
      reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="${filename}.xlsx"`)
        .send(buffer);
    } else {
      const csv = this.generateTrainingCsv(rows);
      reply
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", `attachment; filename="${filename}.csv"`)
        .send(csv);
    }
  }

  /**
   * Export shifts data
   */
  @Get("shifts")
  @Roles("EXECUTIVE", "ADMIN")
  async exportShifts(@Query() query: ExportQueryDto, @Res() reply: FastifyReply) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    this.exportsService.validateDateRange(startDate, endDate);

    const rows = await this.exportsService.exportShifts(startDate, endDate);
    const format = query.format || ExportFormat.CSV;
    const filename = `shifts_${query.startDate}_${query.endDate}`;

    if (format === ExportFormat.XLSX) {
      const buffer = await this.generateShiftsExcel(rows);
      reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="${filename}.xlsx"`)
        .send(buffer);
    } else {
      const csv = this.generateShiftsCsv(rows);
      reply
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", `attachment; filename="${filename}.csv"`)
        .send(csv);
    }
  }

  // ==========================================
  // CSV Generation Methods
  // ==========================================

  private generateRidesCsv(rows: RideExportRow[]): string {
    const headers = [
      "Ride UUID",
      "Rider Name",
      "Rider Rank",
      "Rider Email",
      "Rider Phone",
      "Rider Unit",
      "Truck Commander",
      "TC Email",
      "Van Name",
      "Request Date",
      "Dropoff Time",
      "Pickup Address",
      "Dropoff Address",
      "Status",
    ];

    const csvRows = rows.map((row) =>
      [
        this.escapeCsvField(row.rideUuid),
        this.escapeCsvField(row.riderName),
        this.escapeCsvField(row.riderRank),
        this.escapeCsvField(row.riderEmail),
        this.escapeCsvField(row.riderPhone),
        this.escapeCsvField(row.riderUnit),
        this.escapeCsvField(row.truckCommander),
        this.escapeCsvField(row.truckCommanderEmail),
        this.escapeCsvField(row.vanName),
        this.escapeCsvField(row.requestDate),
        this.escapeCsvField(row.dropoffTime),
        this.escapeCsvField(row.pickupAddress),
        this.escapeCsvField(row.dropoffAddress),
        this.escapeCsvField(row.rideStatus),
      ].join(",")
    );

    return [headers.join(","), ...csvRows].join("\n");
  }

  private generateTrainingCsv(rows: TrainingExportRow[]): string {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Unit",
      "Role",
      "Safety Training",
      "Driver Training",
      "TC Training",
      "Dispatcher Training",
    ];

    const csvRows = rows.map((row) =>
      [
        this.escapeCsvField(row.name),
        this.escapeCsvField(row.email),
        this.escapeCsvField(row.phone),
        this.escapeCsvField(row.unit),
        this.escapeCsvField(row.role),
        this.escapeCsvField(row.safetyTraining),
        this.escapeCsvField(row.driverTraining),
        this.escapeCsvField(row.tcTraining),
        this.escapeCsvField(row.dispatcherTraining),
      ].join(",")
    );

    return [headers.join(","), ...csvRows].join("\n");
  }

  private generateShiftsCsv(rows: ShiftExportRow[]): string {
    const headers = [
      "Shift ID",
      "Role Required",
      "Shift Title",
      "Shift Date",
      "Start Time",
      "End Time",
      "Slots Required",
      "User ID",
      "User Name",
      "User Email",
      "User Phone",
      "User Role",
      "Signup Time",
    ];

    const csvRows = rows.map((row) =>
      [
        this.escapeCsvField(row.shiftId),
        this.escapeCsvField(row.roleRequired),
        this.escapeCsvField(row.shiftTitle),
        this.escapeCsvField(row.shiftDate),
        this.escapeCsvField(row.startTime),
        this.escapeCsvField(row.endTime),
        String(row.slotsRequired),
        this.escapeCsvField(row.userId),
        this.escapeCsvField(row.userName),
        this.escapeCsvField(row.userEmail),
        this.escapeCsvField(row.userPhone),
        this.escapeCsvField(row.userRole),
        this.escapeCsvField(row.signupTime),
      ].join(",")
    );

    return [headers.join(","), ...csvRows].join("\n");
  }

  private escapeCsvField(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return "";
    }
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // ==========================================
  // Excel Generation Methods
  // ==========================================

  private async generateRidesExcel(rows: RideExportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rides");

    worksheet.columns = [
      { header: "Ride UUID", key: "rideUuid", width: 30 },
      { header: "Rider Name", key: "riderName", width: 20 },
      { header: "Rider Rank", key: "riderRank", width: 15 },
      { header: "Rider Email", key: "riderEmail", width: 25 },
      { header: "Rider Phone", key: "riderPhone", width: 15 },
      { header: "Rider Unit", key: "riderUnit", width: 20 },
      { header: "Truck Commander", key: "truckCommander", width: 20 },
      { header: "TC Email", key: "truckCommanderEmail", width: 25 },
      { header: "Van Name", key: "vanName", width: 15 },
      { header: "Request Date", key: "requestDate", width: 22 },
      { header: "Dropoff Time", key: "dropoffTime", width: 22 },
      { header: "Pickup Address", key: "pickupAddress", width: 35 },
      { header: "Dropoff Address", key: "dropoffAddress", width: 35 },
      { header: "Status", key: "rideStatus", width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateTrainingExcel(rows: TrainingExportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Training");

    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Unit", key: "unit", width: 20 },
      { header: "Role", key: "role", width: 12 },
      { header: "Safety Training", key: "safetyTraining", width: 22 },
      { header: "Driver Training", key: "driverTraining", width: 22 },
      { header: "TC Training", key: "tcTraining", width: 22 },
      { header: "Dispatcher Training", key: "dispatcherTraining", width: 22 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateShiftsExcel(rows: ShiftExportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Shifts");

    worksheet.columns = [
      { header: "Shift ID", key: "shiftId", width: 30 },
      { header: "Role Required", key: "roleRequired", width: 15 },
      { header: "Shift Title", key: "shiftTitle", width: 25 },
      { header: "Shift Date", key: "shiftDate", width: 12 },
      { header: "Start Time", key: "startTime", width: 22 },
      { header: "End Time", key: "endTime", width: 22 },
      { header: "Slots Required", key: "slotsRequired", width: 15 },
      { header: "User ID", key: "userId", width: 30 },
      { header: "User Name", key: "userName", width: 20 },
      { header: "User Email", key: "userEmail", width: 25 },
      { header: "User Phone", key: "userPhone", width: 15 },
      { header: "User Role", key: "userRole", width: 12 },
      { header: "Signup Time", key: "signupTime", width: 22 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
