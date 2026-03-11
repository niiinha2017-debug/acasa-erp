import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FinalizarMedicaoTotemDto {
  @IsNumber()
  agenda_id: number;

  @IsString()
  tipo: 'agenda_loja' | 'agenda_fabrica';

  @IsOptional()
  @IsNumber()
  projeto_id?: number;

  @IsOptional()
  @IsString()
  nome_ambiente?: string;

  @IsNumber()
  @Min(1, { message: 'Largura (mm) é obrigatória e deve ser maior que zero.' })
  largura_mm: number;

  @IsNumber()
  @Min(1, { message: 'Pé-Direito (mm) é obrigatório e deve ser maior que zero.' })
  pe_direito_mm: number;

  @IsOptional()
  @IsBoolean()
  conferencia_agua?: boolean;

  @IsOptional()
  @IsBoolean()
  conferencia_luz?: boolean;

  @IsOptional()
  @IsBoolean()
  conferencia_gas?: boolean;

  @IsOptional()
  @IsBoolean()
  conferencia_ar_condicionado?: boolean;
}
