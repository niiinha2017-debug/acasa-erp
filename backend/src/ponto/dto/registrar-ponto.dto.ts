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

  // ✅ Novos campos para localização legível
  @IsOptional()
  @IsString()
  @MaxLength(10)
  cep?: string

  @IsOptional()
  @IsString()
  @MaxLength(150)
  localidade?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string
}