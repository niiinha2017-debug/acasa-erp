import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class UpsertFuncionarioCustoConstanteDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salario_base?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  impostos_encargos_percentual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salario_adicional?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  beneficios?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  horas_mes_base?: number;
}
