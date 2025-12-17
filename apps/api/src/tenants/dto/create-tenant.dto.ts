import { IsString, IsNotEmpty, Matches, MinLength, MaxLength } from "class-validator";

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
    message: "Slug must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen",
  })
  slug!: string;
}
