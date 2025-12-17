import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from "class-validator";

export enum RideStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  EN_ROUTE = "EN_ROUTE",
  PICKED_UP = "PICKED_UP",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class UpdateRideDto {
  @IsOptional()
  @IsString()
  riderName?: string;

  @IsOptional()
  @IsString()
  riderPhone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  passengerCount?: number;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @IsOptional()
  @IsString()
  dropoffAddress?: string;

  @IsOptional()
  @IsNumber()
  dropoffLat?: number;

  @IsOptional()
  @IsNumber()
  dropoffLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  priority?: number;
}

export class AssignRideDto {
  @IsOptional()
  @IsString()
  vanId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  tcId?: string;
}

export class UpdateRideStatusDto {
  @IsEnum(RideStatus)
  status!: RideStatus;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class RideFilterDto {
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;
}
