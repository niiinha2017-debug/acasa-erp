export class CompensarFornecedorDto {
  // lista de abatimentos (você controla no front)
  itens: Array<{
    conta_pagar_id: number
    conta_receber_id: number
    valor: number
    observacao?: string
  }>

  // opcionais: se você quiser mudar status no ato
  status_conta_pagar?: string
  status_conta_receber?: string
}
