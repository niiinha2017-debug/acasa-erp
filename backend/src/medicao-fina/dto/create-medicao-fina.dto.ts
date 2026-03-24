import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateMedicaoFinaDto {
  @Type(() => Number)
  @IsNumber()
  projeto_id: number;

  @IsString()
  nome_ambiente: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  altura_cm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  largura_cm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  profundidade_cm?: number;

  /** Medidas do projeto Promob (cm) – para conferência vs medida real */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  altura_promob_cm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  largura_promob_cm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  profundidade_promob_cm?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  prumo_ok?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  esquadro_ok?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interferencias?: string[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_eletrica_ok?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_hidraulica_ok?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_gas_ok?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_alvenaria_ok?: boolean;

  @IsOptional()
  @IsString()
  observacoes_montador?: string;

  /** Planta baixa interativa: { walls, technicalPoints, texts } para orçamento técnico */
  @IsOptional()
  @IsObject()
  planta_baixa_json?: Record<string, unknown>;

  /** PNG do 3D em data URL (captura do WebGL) */
  @IsOptional()
  @IsString()
  croqui_3d_thumbnail_data_url?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  concluida?: boolean;
}
