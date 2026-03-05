/**
 * Regras de prazos do pipeline (cliente, etc.).
 * Tudo que tem prazo usa aqui: dias úteis por fase.
 */

/** Cliente cadastrado: prazo em dias úteis para mudar de status (ex.: agendar medida ou orçamento). */
export const PRAZO_CLIENTE_CADASTRADO_DIAS_UTEIS = 10;

/** Validade do orçamento: 7 dias úteis para apresentar/aprovar. Conta a partir da conclusão da medida, do início do orçamento ou do agendamento da apresentação (o mais recente). */
export const PRAZO_ORCAMENTO_VALIDADE_DIAS_UTEIS = 7;

/** Agendar fechar venda: 7 dias úteis a partir da data em que o vendedor agenda para fechar a venda (agenda categoria CONTRATO). */
export const PRAZO_FECHAR_VENDA_DIAS_UTEIS = 7;

/** Após concluir a medida fina: 45 dias corridos para projeto técnico + produção + montagem. */
export const PRAZO_APOS_MEDIDA_FINA_DIAS_CORRIDOS = 45;

/** Dias corridos antes do fim da vigência para exibir alerta "CONTRATO PERTO DE EXPIRAR". */
export const PRAZO_ALERTA_VIGENCIA_DIAS = 30;

/** Prazo em dias úteis por fase. CADASTRO: 10; ORCAMENTO: 7; FECHAR_VENDA: 7 (agendar fechar venda). */
export const PRAZO_POR_FASE: Record<string, number> = {
  CADASTRO: PRAZO_CLIENTE_CADASTRADO_DIAS_UTEIS,
  ORCAMENTO: PRAZO_ORCAMENTO_VALIDADE_DIAS_UTEIS,
  FECHAR_VENDA: PRAZO_FECHAR_VENDA_DIAS_UTEIS,
};

/**
 * Soma N dias úteis à data (ignora sábado e domingo).
 * Feriados não são considerados; pode ser extendido depois.
 */
export function addDiasUteis(base: Date, dias: number): Date {
  const d = new Date(base);
  let restantes = dias;
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) restantes--;
  }
  return d;
}

/**
 * Soma N dias corridos (inclui sábado e domingo).
 */
export function addDiasCorridos(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

/**
 * Retorna a data limite (prazo) para a fase, a partir da data base.
 * Só retorna data quando a fase tem prazo definido em PRAZO_POR_FASE.
 */
export function getPrazoAte(dataBase: Date, fase: string): Date | null {
  const dias = PRAZO_POR_FASE[fase];
  if (dias == null || dias <= 0) return null;
  return addDiasUteis(dataBase, dias);
}

/**
 * Prazo após conclusão da medida fina: projeto técnico + produção + montagem em 45 dias corridos.
 */
export function getPrazoAposMedidaFina(dataConclusaoMedidaFina: Date): Date {
  return addDiasCorridos(dataConclusaoMedidaFina, PRAZO_APOS_MEDIDA_FINA_DIAS_CORRIDOS);
}

/**
 * Data de corte para verificação financeira: parcelas com vencimento anterior ou igual a esta data
 * devem estar pagas para liberar avanço para Produção. Usar início do dia atual.
 */
export function getDataCorteContasReceber(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
