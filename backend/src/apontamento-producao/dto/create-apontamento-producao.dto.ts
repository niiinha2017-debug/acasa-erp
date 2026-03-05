import {
  IsInt,
  IsOptional,
  IsDateString,
  IsString,
  IsNumber,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateApontamentoProducaoDto {
  @IsOptional()
  @IsInt()
  agenda_fabrica_id?: number;

  @IsOptional()
  @IsInt()
  agenda_loja_id?: number;

  @IsOptional()
  @IsInt()
  venda_id?: number;

  @IsInt()
  funcionario_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  categoria?: string;

  @IsDateString()
  data: string; // YYYY-MM-DD

  @IsDateString()
  inicio_em: string;

  @IsDateString()
  fim_em: string;

  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsDateString()
  pausa_inicio_em?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsDateString()
  pausa_fim_em?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas?: number; // decimal opcional (ex: 2.5)

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
