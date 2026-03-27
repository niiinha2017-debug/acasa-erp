import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGarantiaDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  cliente_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  funcionario_responsavel_id?: number;

  @IsOptional()
  @IsString()
  tipo?: string; // GARANTIA | ASSISTENCIA

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  processo?: string;

  @IsOptional()
  @IsString()
  horas_previstas?: string;

  @IsOptional()
  @IsString()
  custo_produtos?: string;

  @IsOptional()
  @IsString()
  custo_mao_obra_previsto?: string;

  @IsOptional()
  @IsString()
  custo_fabrica_previsto?: string;

  @IsOptional()
  @IsString()
  custo?: string;

  @IsOptional()
  @IsString()
  valor_venda?: string;

  @IsOptional()
  @IsString()
  data_previsao?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
