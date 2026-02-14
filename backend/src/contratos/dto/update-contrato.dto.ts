import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateContratoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_id?: number | null;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor?: number;

  @IsOptional()
  @IsDateString()
  data_inicio?: string | null;

  @IsOptional()
  @IsDateString()
  data_fim?: string | null;
}
