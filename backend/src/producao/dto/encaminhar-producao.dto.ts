export class EncaminharProducaoDto {
  origem_tipo: string // "VENDA_CLIENTE" | "PLANO_CORTE"
  origem_id: number
  status?: string // opcional (ex: "ENCAMINHADO_PRODUCAO")
}
