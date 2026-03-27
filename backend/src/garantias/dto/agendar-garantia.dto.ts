import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
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
  @IsString()
  subetapa?: string; // GARANTIA | ASSISTENCIA
}
