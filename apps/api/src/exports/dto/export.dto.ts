import { IsEnum, IsOptional, IsDateString } from "class-validator";

export enum ExportFormat {
  CSV = "csv",
  XLSX = "xlsx",
}

export class ExportQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
}

export class TrainingExportQueryDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
}
