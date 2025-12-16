// src/constants/pagamentos.js

export const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'boleto', label: 'Boleto' }
]

export const TAXAS_CARTAO = {
  debito: 0.019,
  credito_avista: 0.029,
  credito_parcelado: 0.039
}
