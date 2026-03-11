import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ParcelaFechamentoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parcela: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsString()
  vencimento_em?: string;
}
