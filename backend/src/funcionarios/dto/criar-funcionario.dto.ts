import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CriarFuncionarioDto {
  // Dados pessoais
  @IsString()
  nome: string

  @IsString()
  cpf: string

  @IsOptional()
  @IsString()
  rg?: string

  @IsOptional()
  @IsString()
  telefone?: string

  @IsOptional()
  @IsString()
  whatsapp?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  estado_civil?: string

  @IsOptional()
  @IsString()
  escolaridade?: string

    // Empresa
  @IsOptional()
  @IsString()
  setor?: string

  @IsOptional()
  @IsString()
  cargo?: string

  @IsOptional()
  @IsString()
  funcao?: string


  // Endereço
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

  // Registro / vínculo
  @IsOptional()
  @IsString()
  registro?: string

  // Datas como string ISO no body (Nest/Prisma convertem)
  @IsOptional()
  @IsString()
  admissao?: string

  @IsOptional()
  @IsString()
  demissao?: string

  // Financeiro (enviar como número no JSON)
  @IsOptional()
  salario_base?: number

  @IsOptional()
  salario_adicional?: number

  @IsOptional()
  custo_hora?: number

  @IsOptional()
  vale?: number

  // Horários
  @IsOptional()
  @IsString()
  horario_entrada?: string

  @IsOptional()
  @IsString()
  horario_almoco?: string

  @IsOptional()
  @IsString()
  horario_saida?: string

  // Pagamento
  @IsOptional()
  @IsString()
  conta_bancaria?: string

  @IsOptional()
  @IsString()
  forma_pagamento?: string

  @IsOptional()
  @IsString()
  data_pagamento?: string
}
