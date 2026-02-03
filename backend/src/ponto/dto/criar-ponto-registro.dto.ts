import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export enum PontoTipoRegistroDto {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class CriarPontoRegistroDto {
  @IsInt()
  funcionario_id: number

  @IsEnum(PontoTipoRegistroDto)
  tipo: PontoTipoRegistroDto

  @IsString()
  @IsNotEmpty()
  data_hora: string // "YYYY-MM-DD HH:mm:ss" (local)

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string
}
