import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class UpsertCustosEstruturaDto {
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  ano: number;

  @IsNumber()
  @Min(0)
  custo_ocupacao: number;

  @IsNumber()
  @Min(0)
  custo_operacional: number;

  @IsNumber()
  @Min(0)
  custo_manutencao_depreciacao: number;

  @IsNumber()
  @Min(0.01)
  horas_uteis_mes: number;
}
