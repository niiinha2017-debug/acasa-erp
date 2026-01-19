// src/producao/dto/encaminhar-producao.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class EncaminharProducaoDto {
  @IsString()
  origem_tipo: string // "VENDA_CLIENTE" | "PLANO_CORTE"

  @IsInt()
  @Min(1)
  origem_id: number

  @IsOptional()
  @IsString()
  status?: string // opcional (ex: "ENCAMINHADO_PRODUCAO")
}
