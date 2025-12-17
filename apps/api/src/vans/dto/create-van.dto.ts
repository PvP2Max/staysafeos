import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsNumber,
  IsArray,
} from "class-validator";

export enum VanStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  OFFLINE = "OFFLINE",
}

export class CreateVanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacity?: number = 6;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsEnum(VanStatus)
  status?: VanStatus = VanStatus.AVAILABLE;
}

export class UpdateVanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacity?: number;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsEnum(VanStatus)
  status?: VanStatus;
}

export class CreateTaskDto {
  @IsString()
  type!: string; // PICKUP, DROPOFF, CUSTOM

  @IsString()
  address!: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  rideId?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReorderTasksDto {
  @IsArray()
  @IsString({ each: true })
  taskIds!: string[];
}
