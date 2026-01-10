// backend/src/constantes/dto/criar-constante.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, IsNumber } from 'class-validator'

export class CriarConstanteDto {
  @IsString()
  categoria: string

  @IsString()
  chave: string

  @IsString()
  rotulo: string

  @IsOptional()
  @IsString()
  valor_texto?: string

  @IsOptional()
  @IsNumber()
  valor_numero?: number

  @IsOptional()
  @IsInt()
  ordem?: number

  @IsOptional()
  @IsBoolean()
  ativo?: boolean
}