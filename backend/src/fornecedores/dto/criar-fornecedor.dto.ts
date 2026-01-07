import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateFornecedorDto {
  @IsString()
  razao_social: string

  @IsString()
  nome_fantasia: string

  @IsString()
  cnpj: string

  @IsOptional()
  @IsString()
  ie?: string

  @IsOptional()
  @IsString()
  telefone?: string

  @IsOptional()
  @IsString()
  whatsapp?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  cep?: string

  @IsOptional()
  @IsString()
  endereco?: string

  @IsOptional()
  @IsString()
  numero?: string

  @IsOptional()
  @IsString()
  bairro?: string

  @IsOptional()
  @IsString()
  cidade?: string

  @IsOptional()
  @IsString()
  estado?: string

  @IsOptional()
  @IsString()
  forma_pagamento?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  data_vencimento?: number
}
