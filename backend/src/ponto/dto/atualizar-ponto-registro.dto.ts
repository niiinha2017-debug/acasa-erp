import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator'

export class AtualizarPontoRegistroDto {
  @IsOptional()
  @IsISO8601()
  data_hora?: string

  @IsOptional()
  @IsIn(['ENTRADA', 'SAIDA'])
  tipo?: 'ENTRADA' | 'SAIDA'

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string
}
