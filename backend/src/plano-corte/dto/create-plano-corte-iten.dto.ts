import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanoCorteItemDto {
  @Type(() => Number)
  @IsInt()
  fornecedor_id: number;

  @IsString()
  nome_produto: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  medida?: string;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  largura_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  comprimento_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  espessura_mm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preco_m2?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantidade: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_total: number;

  @IsString()
  status: string;
}
