/**
 * Tipagem do Fechamento de Fornecedor (Contas a Pagar agrupado por fornecedor/competência).
 * Cada item da lista representa um totalizador por fornecedor no mês, com itens originais (compras + serviço de corte) para expansão.
 */

/** Item original (compra ou serviço de corte) dentro de um fechamento */
export interface FechamentoFornecedorItemOrigem {
  id: number;
  origem: 'COMPRA' | 'SERVICO_CORTE';
  descricao: string;
  data_referencia: string | null;
  valor: number;
  status: string;
}

/** Um totalizador por fornecedor na competência (mês/ano) */
export interface FechamentoFornecedorItem {
  fornecedor_id: number;
  fornecedor_nome: string | null;
  mes: number;
  ano: number;
  /** Soma dos valores de Compras + Serviço de Corte (débito bruto) */
  subtotal: number;
  /** Total de abatimentos (créditos: Serviço de Corte + saldo_credito aplicado) */
  total_abatimentos: number;
  /** Valor líquido a pagar (subtotal - total_abatimentos) */
  valor_liquido: number;
  /** Itens originais (compras e planos de corte) para exibição expandida */
  itens: FechamentoFornecedorItemOrigem[];
}

export type FechamentoFornecedorResponse = FechamentoFornecedorItem[];
