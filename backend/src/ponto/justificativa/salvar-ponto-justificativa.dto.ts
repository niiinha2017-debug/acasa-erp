import {
  IsInt,
  IsOptional,
  IsString,
  IsISO8601,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class SalvarPontoJustificativaDto {
  @IsInt()
  funcionario_id: number;

  /** Data inicial (dia da justificativa ou início do período). */
  @IsISO8601()
  data: string;

  /** Data final (opcional). Se informada e maior que data, cria uma justificativa por dia no período. */
  @IsOptional()
  @IsISO8601()
  data_fim?: string;

  @IsString()
  @MaxLength(40)
  tipo: string; // chave constante ex: ATESTADO

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;

  @IsOptional()
  @IsInt()
  arquivo_id?: number;

  /** Minutos justificados (ex.: 60 = 1h). Reduz a meta do dia no cálculo do saldo. Null = justificativa de dia inteiro. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  minutos_justificados?: number;
}
