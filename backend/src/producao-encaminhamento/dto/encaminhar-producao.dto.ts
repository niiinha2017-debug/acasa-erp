import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class EncaminharProducaoDto {
  @IsString()
  @IsNotEmpty()
  origem_tipo: string // 'VENDA_CLIENTE' | 'PLANO_CORTE' | ...

  @IsInt()
  @Min(1)
  origem_id: number

  @IsOptional()
  @IsString()
  status?: string // opcional (se você quiser setar 'ABERTO' ou 'ENCAMINHADO')
}
