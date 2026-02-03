import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'

export enum PontoTipoRegistroDto {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class RegistrarPontoDto {
  @IsEnum(PontoTipoRegistroDto)
  tipo: PontoTipoRegistroDto

  @IsOptional()
  @IsNumber()
  latitude?: number

  @IsOptional()
  @IsNumber()
  longitude?: number

  @IsOptional()
  @IsInt()
  precisao_metros?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string
}