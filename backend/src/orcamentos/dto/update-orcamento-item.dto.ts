import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateOrcamentoItemDto {
  @IsOptional() @IsString()
  nome_ambiente?: string

  @IsOptional() @IsString()
  descricao?: string

  @IsOptional() @IsString()
  observacao?: string

  @IsOptional() @IsNumber()
  valor_unitario?: number
}
