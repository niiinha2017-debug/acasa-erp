import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContratoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cliente_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_id?: number;

  @IsString()
  numero: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  status: string; // RASCUNHO | VIGENTE | ENCERRADO | CANCELADO

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;
}
