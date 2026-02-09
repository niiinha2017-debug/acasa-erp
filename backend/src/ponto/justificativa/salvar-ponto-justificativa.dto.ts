import {
  IsInt,
  IsOptional,
  IsString,
  IsISO8601,
  MaxLength,
} from 'class-validator';

export class SalvarPontoJustificativaDto {
  @IsInt()
  funcionario_id: number;

  // dia (você pode mandar "2026-01-10" ou ISO)
  @IsISO8601()
  data: string;

  @IsString()
  @MaxLength(40)
  tipo: string; // chave constante ex: ATESTADO

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;
}
