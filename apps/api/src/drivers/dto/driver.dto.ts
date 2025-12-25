import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  Max,
} from "class-validator";

export class GoOnlineDto {
  @IsString()
  vanId!: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class LocationPingDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  passengerCount?: number;
}

export class CreateWalkOnDto {
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
}

export class CreateTransferDto {
  @IsString()
  toMembershipId!: string;
}

export enum TransferStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
}
