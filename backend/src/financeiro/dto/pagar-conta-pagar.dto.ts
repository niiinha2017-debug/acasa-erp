import { IsOptional, IsString } from 'class-validator';

/** DTO legado para POST /financeiro/contas-pagar/:id/pagar (cria despesa com dados opcionais). */
export class PagarContaPagarDto {
  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  classificacao?: string;

  @IsOptional()
  @IsString()
  local?: string;
}
