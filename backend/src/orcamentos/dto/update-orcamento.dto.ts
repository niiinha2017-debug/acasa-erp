import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrcamentoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cliente_id?: number;

  @IsOptional()
  @IsString()
  cliente_nome_snapshot?: string;

  @IsOptional()
  @IsString()
  cliente_cpf_snapshot?: string;
}
