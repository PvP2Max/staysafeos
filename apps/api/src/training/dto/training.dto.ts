import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum TrainingCategory {
  ORIENTATION = "ORIENTATION",
  SAFETY = "SAFETY",
  DRIVER = "DRIVER",
  TC = "TC",
  DISPATCHER = "DISPATCHER",
}

export class QuizQuestion {
  @IsString()
  question!: string;

  @IsArray()
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  correctIndex!: number;
}

export class CreateModuleDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TrainingCategory)
  category!: TrainingCategory;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  videoId?: string;

  @IsOptional()
  @IsInt()
  videoDuration?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestion)
  quizQuestions?: QuizQuestion[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingPercent?: number = 80;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredRoles?: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TrainingCategory)
  category?: TrainingCategory;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  videoId?: string;

  @IsOptional()
  @IsInt()
  videoDuration?: number;

  @IsOptional()
  @IsArray()
  quizQuestions?: QuizQuestion[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingPercent?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredRoles?: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SubmitQuizDto {
  @IsArray()
  @IsInt({ each: true })
  answers!: number[];
}

export class TrainingFilterDto {
  @IsOptional()
  @IsEnum(TrainingCategory)
  category?: TrainingCategory;

  @IsOptional()
  @IsString()
  role?: string;
}
