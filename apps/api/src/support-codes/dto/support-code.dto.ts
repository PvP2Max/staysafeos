import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
} from "class-validator";

export enum SupportCodeType {
  ROLE_ELEVATION = "ROLE_ELEVATION",
  STAFF_ACCESS = "STAFF_ACCESS",
  INVITE = "INVITE",
}

export class CreateSupportCodeDto {
  @IsEnum(SupportCodeType)
  type!: SupportCodeType;

  @IsOptional()
  @IsString()
  grantedRole?: string;

  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class RedeemCodeDto {
  @IsString()
  code!: string;
}
