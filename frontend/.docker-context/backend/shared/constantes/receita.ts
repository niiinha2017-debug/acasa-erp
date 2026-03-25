export const RECEITA_OPERACIONAL = [
  { key: 'JUROS', label: 'Juros' },
  { key: 'OUTROS', label: 'Outras Receitas' },
]

/**
 * Juros e taxas de cartão estão nas vendas que são salvas (tabela vendas e vendas_formas_pagamento).
 * - vendas.valor_taxa_pagamento: valor em R$ da taxa do meio de pagamento (cartão, etc.)
 * - vendas.taxa_pagamento_percentual_aplicado: percentual aplicado
 * - vendas_formas_pagamento.com_juros: se a forma tem juros (ex.: parcelado com juros)
 * - vendas_formas_pagamento.valor_base: valor sem juros; valor_vendido na venda reflete o total a receber (com juros quando houver)
 * Não buscar juros/taxas de cartão em Despesas; a origem é sempre a venda salva.
 */
export const ORIGEM_JUROS_TAXAS_CARTAO = 'vendas' as const
