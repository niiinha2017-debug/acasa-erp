import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FinalizarMedicaoTotemDto {
  @Type(() => Number)
  @IsNumber()
  agenda_id: number;

  @IsString()
  @IsIn(['agenda_loja', 'agenda_fabrica'], {
    message: 'tipo deve ser agenda_loja ou agenda_fabrica.',
  })
  tipo: 'agenda_loja' | 'agenda_fabrica';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projeto_id?: number;

  @IsOptional()
  @IsString()
  nome_ambiente?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Largura (mm) é obrigatória e deve ser maior que zero.' })
  largura_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Pé-Direito (mm) é obrigatório e deve ser maior que zero.' })
  pe_direito_mm: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_agua?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_luz?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_gas?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conferencia_ar_condicionado?: boolean;
}
