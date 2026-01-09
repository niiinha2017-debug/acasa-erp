import { IsOptional, IsString } from 'class-validator'

export class UpdateOrcamentoDto {
  @IsOptional()
  @IsString()
  cliente_nome_snapshot?: string

  @IsOptional()
  @IsString()
  cliente_cpf_snapshot?: string
}
