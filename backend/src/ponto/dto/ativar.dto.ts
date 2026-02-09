import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AtivarDto {
  @IsString()
  @MaxLength(40)
  code: string;

  @IsString()
  @MaxLength(80)
  device_uuid: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  device_nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  plataforma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_agent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  screen?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pixel_ratio?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  standalone?: boolean;
}
