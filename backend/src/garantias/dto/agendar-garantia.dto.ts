import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
} from 'class-validator';

export class AgendarGarantiaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  inicio_em: string;

  @IsString()
  @IsNotEmpty()
  fim_em: string;

  @IsOptional()
  @IsArray()
  funcionario_ids?: number[];

  @IsOptional()
  @IsArray()
  automovel_ids?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  km_ida_prevista?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  km_volta_prevista?: number;

  @IsOptional()
  @IsString()
  subetapa?: string; // GARANTIA | ASSISTENCIA
}
