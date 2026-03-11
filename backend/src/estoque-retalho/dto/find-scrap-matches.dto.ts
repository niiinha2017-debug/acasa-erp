/**
 * Uma peça do Promob (ou lista de corte) para comparar com retalhos.
 * produto_id = material; dimensões em mm; valor_total = custo da peça (será subtraído do custo de materiais se houver retalho).
 */
export class PecaPromobDto {
  /** ID do produto (material) no cadastro */
  produto_id: number;
  /** Largura da peça em mm */
  largura_mm: number;
  /** Comprimento da peça em mm */
  comprimento_mm: number;
  /** Valor/custo desta peça (será somado à economia se houver retalho compatível) */
  valor_total: number;
  /** Identificador opcional da peça (ex.: id do plano_corte_produto ou índice) para referência no retorno */
  id_ref?: string | number;
}

export class FindScrapMatchesDto {
  /** Lista de peças a comparar com a tabela de retalhos */
  pecas: PecaPromobDto[];
  /** Opcional: orçamento ao qual aplicar a economia (se o modelo tiver campo de economia) */
  orcamento_id?: number;
}
