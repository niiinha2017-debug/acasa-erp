/**
 * Tabelas e constantes para cálculo de impostos e benefícios trabalhistas (CLT).
 * Vigência: 2025 — atualizar anualmente conforme portarias do MPS / Receita Federal.
 */

// ─────────────────────────────────────────────
// INSS — Contribuição do empregado (tabela progressiva)
// Portaria MPS nº 1.716/2024 — vigência 2025
// ─────────────────────────────────────────────
export interface FaixaINSS {
  /** Limite superior da faixa (ou null para a última faixa de teto) */
  limiteAte: number | null;
  /** Alíquota da faixa (ex.: 0.075 = 7,5%) */
  aliquota: number;
}

/** Teto máximo de contribuição mensal INSS */
export const INSS_TETO_CONTRIBUICAO = 908.85;

/** Tabela progressiva INSS 2025 */
export const INSS_FAIXAS_2025: FaixaINSS[] = [
  { limiteAte: 1518.0, aliquota: 0.075 },
  { limiteAte: 2793.88, aliquota: 0.09 },
  { limiteAte: 4190.83, aliquota: 0.12 },
  { limiteAte: 8157.41, aliquota: 0.14 },
  { limiteAte: null, aliquota: 0.14 }, // acima do teto → contribuição limitada ao teto
];

// ─────────────────────────────────────────────
// IRRF — Imposto de Renda Retido na Fonte (tabela mensal)
// Lei nº 14.848/2024 — vigência 2024/2025
// ─────────────────────────────────────────────
export interface FaixaIRRF {
  /** Base de cálculo (após INSS e deduções) — limite superior da faixa */
  limiteAte: number | null;
  /** Alíquota (ex.: 0.075 = 7,5%) */
  aliquota: number;
  /** Parcela a deduzir da base × alíquota para obter o imposto final */
  parcelaDeduzir: number;
}

/** Tabela mensal IRRF 2025 */
export const IRRF_FAIXAS_2025: FaixaIRRF[] = [
  { limiteAte: 2824.0, aliquota: 0, parcelaDeduzir: 0 },
  { limiteAte: 3751.05, aliquota: 0.075, parcelaDeduzir: 211.8 },
  { limiteAte: 4664.68, aliquota: 0.15, parcelaDeduzir: 492.77 },
  { limiteAte: 5877.72, aliquota: 0.225, parcelaDeduzir: 842.27 },
  { limiteAte: null, aliquota: 0.275, parcelaDeduzir: 1136.16 },
];

/** Dedução por dependente (por mês) */
export const IRRF_DEDUCAO_DEPENDENTE = 189.59;

/** Limite de isenção do IRRF (base de cálculo ≤ este valor = sem IR) */
export const IRRF_LIMITE_ISENCAO = 2824.0;

// ─────────────────────────────────────────────
// FGTS
// ─────────────────────────────────────────────
/** Alíquota padrão do FGTS (empregador deposita sobre salário bruto + 13º + férias) */
export const FGTS_ALIQUOTA = 0.08;

/**
 * Multa rescisória sobre o saldo FGTS (dispensa sem justa causa ou culpa recíproca).
 * 40% empregado + 10% fundo extinção → aqui usamos a parte do empregado.
 */
export const FGTS_MULTA_RESCISORIA = 0.4;

// ─────────────────────────────────────────────
// FÉRIAS — CLT Art. 129 a 153
// ─────────────────────────────────────────────
/** Período aquisitivo de férias (meses) */
export const FERIAS_PERIODO_AQUISITIVO_MESES = 12;

/** Dias de férias por período aquisitivo completo (sem faltas) */
export const FERIAS_DIAS_DIREITO = 30;

/** Adicional constitucional sobre o valor das férias (1/3) */
export const FERIAS_ADICIONAL_TERCIO = 1 / 3;

/**
 * Redução de dias de férias por faltas injustificadas no período aquisitivo (CLT art. 130):
 * 0 faltas → 30 dias; 6–14 faltas → 24 dias; 15–23 faltas → 18 dias; 24–32 faltas → 12 dias
 */
export const FERIAS_TABELA_FALTAS: Array<{ faltasAte: number | null; diasDireito: number }> = [
  { faltasAte: 5, diasDireito: 30 },
  { faltasAte: 14, diasDireito: 24 },
  { faltasAte: 23, diasDireito: 18 },
  { faltasAte: 32, diasDireito: 12 },
  { faltasAte: null, diasDireito: 0 }, // acima de 32 faltas → perde direito
];

// ─────────────────────────────────────────────
// 13º SALÁRIO
// ─────────────────────────────────────────────
/** Meses mínimos para directo ao 13º proporcional (pelo menos 15 dias no mês) */
export const DECIMO_TERCEIRO_MESES_MINIMOS = 1;

// ─────────────────────────────────────────────
// FLUXO DE STATUS DO FUNCIONÁRIO
// ─────────────────────────────────────────────
export const FUNCIONARIO_STATUS = {
  CADASTRADO: 'CADASTRADO',
  ATIVO: 'ATIVO',
  AFASTADO: 'AFASTADO',
  FERIAS: 'FERIAS',
  AVISO_PREVIO: 'AVISO_PREVIO',
  INATIVO: 'INATIVO',
} as const;

export type FuncionarioStatus = keyof typeof FUNCIONARIO_STATUS;

/**
 * Transições de status válidas.
 * Chave = status atual → Valor = lista de status para os quais pode migrar.
 */
export const FUNCIONARIO_STATUS_TRANSICOES: Record<string, string[]> = {
  CADASTRADO: ['ATIVO'],
  ATIVO: ['AFASTADO', 'FERIAS', 'AVISO_PREVIO', 'INATIVO'],
  AFASTADO: ['ATIVO', 'INATIVO'],
  FERIAS: ['ATIVO'],
  AVISO_PREVIO: ['INATIVO'],
  INATIVO: [],
};

/** Labels exibidas para cada status */
export const FUNCIONARIO_STATUS_LABELS: Record<string, string> = {
  CADASTRADO: 'Cadastrado',
  ATIVO: 'Ativo',
  AFASTADO: 'Afastado',
  FERIAS: 'Em Férias',
  AVISO_PREVIO: 'Aviso Prévio',
  INATIVO: 'Inativo',
};

/** Motivos obrigatórios por transição */
export const FUNCIONARIO_STATUS_MOTIVOS_OBRIGATORIOS: Record<string, boolean> = {
  AFASTADO: true,
  INATIVO: true,
  AVISO_PREVIO: true,
};
