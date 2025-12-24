import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsEnum,
} from "class-validator";

export enum RideSource {
  REQUEST = "REQUEST",
  MANUAL = "MANUAL",
  WALK_ON = "WALK_ON",
}

export class CreateRideDto {
  @IsString()
  riderName!: string;

  @IsString()
  riderPhone!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  passengerCount?: number = 1;

  @IsString()
  pickupAddress!: string;

  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @IsString()
  dropoffAddress!: string;

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
  priority?: number = 0;
}

export class CreateManualRideDto extends CreateRideDto {
  @IsOptional()
  @IsString()
  vanId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  tcId?: string;

  @IsOptional()
  @IsBoolean()
  skipAutoAssign?: boolean;
}
