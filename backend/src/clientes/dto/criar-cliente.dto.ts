import { IsBoolean, IsEmail, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator'

export class CriarClienteDto {
  @IsOptional()
  indicacao_id?: number

  @IsString()
  @MaxLength(255)
  nome_completo!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  razao_social?: string

  // Data ISO: "2026-01-05T00:00:00.000Z" ou "2026-01-05"
  @IsDateString()
  data_nascimento!: string

  @IsOptional() @IsString() cpf?: string
  @IsOptional() @IsString() rg?: string
  @IsOptional() @IsString() cnpj?: string
  @IsOptional() @IsString() ie?: string

  @IsOptional() @IsString() telefone?: string
  @IsOptional() @IsString() whatsapp?: string

  @IsEmail()
  email!: string

  @IsOptional() @IsString() cep?: string
  @IsOptional() @IsString() endereco?: string
  @IsOptional() @IsString() numero?: string
  @IsOptional() @IsString() complemento?: string
  @IsOptional() @IsString() bairro?: string
  @IsOptional() @IsString() cidade?: string
  @IsOptional() @IsString() estado?: string

  // checkboxes (preferências)
  @IsOptional()
  @IsBoolean()
  enviar_aniversario_email?: boolean

  @IsOptional()
  @IsBoolean()
  enviar_aniversario_whatsapp?: boolean
}
