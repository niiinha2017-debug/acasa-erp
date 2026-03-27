import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CalcularImpostosFuncionarioDto {
  /** Número de dependentes para dedução de IRRF */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dependentes?: number;

  /** Mês de referência (1=Jan … 12=Dez). Default: mês atual. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mes?: number;

  /** Ano de referência (ex.: 2025). Default: ano atual. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ano?: number;
}
