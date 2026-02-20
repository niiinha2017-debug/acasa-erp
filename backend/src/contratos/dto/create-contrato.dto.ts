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
  /** Obrigatório: contrato só pode ser criado a partir de uma venda. */
  @Type(() => Number)
  @IsInt()
  venda_id: number;

  /** Opcional: se não informado, o número é gerado automaticamente (CONT-YYYY-NNN). */
  @IsOptional()
  @IsString()
  numero?: string;

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
