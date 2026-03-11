import { IsBoolean, IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator';

export class CreateMedicaoFinaDto {
  @IsNumber()
  projeto_id: number;

  @IsString()
  nome_ambiente: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largura_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  profundidade_cm?: number;

  /** Medidas do projeto Promob (cm) – para conferência vs medida real */
  @IsOptional()
  @IsNumber()
  @Min(0)
  altura_promob_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largura_promob_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  profundidade_promob_cm?: number;

  @IsOptional()
  @IsBoolean()
  prumo_ok?: boolean;

  @IsOptional()
  @IsBoolean()
  esquadro_ok?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interferencias?: string[];

  @IsOptional()
  @IsBoolean()
  conferencia_eletrica_ok?: boolean;

  @IsOptional()
  @IsBoolean()
  conferencia_hidraulica_ok?: boolean;

  @IsOptional()
  @IsBoolean()
  conferencia_gas_ok?: boolean;

  @IsOptional()
  @IsBoolean()
  conferencia_alvenaria_ok?: boolean;

  @IsOptional()
  @IsString()
  observacoes_montador?: string;

  @IsOptional()
  @IsBoolean()
  concluida?: boolean;
}
