import { IsEnum, IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator'
import { PontoTipoRegistroDto } from './criar-ponto-registro.dto'

export class AtualizarPontoRegistroDto {
  @IsOptional()
  @IsEnum(PontoTipoRegistroDto)
  tipo?: PontoTipoRegistroDto

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  data_hora?: string // "YYYY-MM-DD HH:mm:ss" (local)

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string
}
