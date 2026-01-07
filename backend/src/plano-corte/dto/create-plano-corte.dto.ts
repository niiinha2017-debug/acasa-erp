export class CreatePlanoCorteDto {
  fornecedor_id: number
  data_venda: string
  status: string

  produtos: {
    item_id: number
    quantidade: number
    valor_unitario: number
    valor_total: number
    status: string
  }[]
}
