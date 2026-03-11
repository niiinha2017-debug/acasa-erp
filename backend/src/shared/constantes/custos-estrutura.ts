/**
 * Parâmetros para Custos de Estrutura (Taxa de Máquina).
 * - Horas úteis do mês: capacidade instalada da fábrica para rateio (ex.: 22 dias × 8h = 176).
 *   Pode ser sobrescrito por variável de ambiente HORAS_UTEIS_MES_PADRAO.
 * - O parâmetro constante (Custo Fábrica) vem das DESPESAS: tabela despesas, categorias
 *   Ocupação, Operacional e Manutenção. Compras (almoxarifado) não entram nesse total.
 */
const fromEnv =
  typeof process !== 'undefined' && process.env?.HORAS_UTEIS_MES_PADRAO != null
    ? Number(process.env.HORAS_UTEIS_MES_PADRAO)
    : NaN;
export const HORAS_UTEIS_MES_PADRAO = Number.isFinite(fromEnv) ? fromEnv : 176;

export const CUSTOS_ESTRUTURA_CONSTANTES = {
  horas_uteis_mes_padrao: HORAS_UTEIS_MES_PADRAO,
  /** Origem do Custo Fábrica: sempre a tabela Despesas (categorias Ocupação, Operacional, Manutenção). */
  origem_custo_fabrica: 'despesas' as const,
} as const;
