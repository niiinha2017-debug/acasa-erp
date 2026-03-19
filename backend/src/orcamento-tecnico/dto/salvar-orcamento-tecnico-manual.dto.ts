import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum MedidaOrigemEnum {
  VENDEDOR = 'VENDEDOR',
  TECNICA = 'TECNICA',
}

export enum CategoriaPrecoEnum {
  ESSENCIAL = 'ESSENCIAL',
  DESIGNER = 'DESIGNER',
  PREMIUM = 'PREMIUM',
}

export class MedidaParedeDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  largura_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  altura_mm: number;
}

export class AcessorioManualDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantidade: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number;
}

export class SalvarOrcamentoTecnicoManualDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  orcamento_tecnico_id: number;

  @IsEnum(MedidaOrigemEnum)
  medida_origem: MedidaOrigemEnum;

  @ValidateNested()
  @Type(() => MedidaParedeDto)
  medida_vendedor: MedidaParedeDto;

  @ValidateNested()
  @Type(() => MedidaParedeDto)
  medida_tecnica: MedidaParedeDto;

  @IsEnum(CategoriaPrecoEnum)
  estrutura_interna_categoria: CategoriaPrecoEnum;

  @IsEnum(CategoriaPrecoEnum)
  externo_categoria: CategoriaPrecoEnum;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo_m2_interno: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo_m2_externo: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual_externo_area: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  markup: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcessorioManualDto)
  acessorios: AcessorioManualDto[];

  // Snapshot calculado para auditoria (opcional no payload)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area_total_m2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo_interno_total?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo_externo_total?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_acessorios?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo_total?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preco_venda_total?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
