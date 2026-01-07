import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator'

export class CriarConstanteDto {
  @IsString()
  categoria: string

  @IsString()
  chave: string

  @IsString()
  rotulo: string

  @IsString()
  tipo: string

  @IsOptional()
  @IsString()
  valor_texto?: string

  @IsOptional()
  valor_numero?: number

  @IsOptional()
  @IsBoolean()
  valor_booleano?: boolean

  @IsOptional()
  valor_json?: any

  @IsOptional()
  @IsInt()
  ordem?: number

  @IsOptional()
  @IsBoolean()
  ativo?: boolean
}
