import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';

export enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export enum TipoAplicacaoProduto {
  MDF = 'MDF',
  MATERIA_PRIMA = 'MATERIA_PRIMA',
  COMPLEMENTO = 'COMPLEMENTO',
  INSUMO = 'INSUMO',
}

export class CreateProdutoDto {
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
  @IsString()
  imagem_url?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estoque_minimo?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  categoria_base?: string;

  @IsOptional()
  @IsEnum(TipoAplicacaoProduto)
  tipo_aplicacao?: TipoAplicacaoProduto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_total?: number;

  @IsOptional()
  @IsEnum(StatusProduto)
  status?: StatusProduto;
}
