import { IsBoolean, IsInt, IsOptional, IsString, IsNumber, Min } from 'class-validator'

export class CriarConstanteDto {
  @IsString({ message: 'A categoria deve ser um texto' })
  categoria: string

  @IsString({ message: 'A chave deve ser um identificador em texto' })
  chave: string

  @IsString({ message: 'O rótulo é obrigatório para exibição' })
  rotulo: string

  @IsOptional()
  @IsString()
  valor_texto?: string

  // Agora validamos como número (importante para as taxas de cartão)
  @IsOptional()
  @IsNumber({}, { message: 'O valor numérico deve ser um número válido' })
  @Min(0, { message: 'O valor não pode ser negativo' })
  valor_numero?: number

  @IsOptional()
  @IsInt()
  ordem?: number

  @IsOptional()
  @IsBoolean()
  ativo?: boolean
}