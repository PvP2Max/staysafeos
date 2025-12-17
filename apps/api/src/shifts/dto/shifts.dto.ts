import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
} from "class-validator";

export enum ShiftRole {
  DRIVER = "DRIVER",
  TC = "TC",
  DISPATCHER = "DISPATCHER",
  SAFETY = "SAFETY",
}

export class CreateShiftDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ShiftRole)
  role!: ShiftRole;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsInt()
  @Min(1)
  slotsNeeded!: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ShiftRole)
  role?: ShiftRole;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  slotsNeeded?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ShiftFilterDto {
  @IsOptional()
  @IsEnum(ShiftRole)
  role?: ShiftRole;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;
}
