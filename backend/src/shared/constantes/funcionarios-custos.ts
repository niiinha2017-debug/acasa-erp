export const FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS = [
  'FUNCIONARIO',
  'FUNCIONARIOS',
  'COLABORADOR',
  'COLABORADORES',
  'MAO_DE_OBRA',
  'MAO DE OBRA',
  'SALARIO',
  'SALARIOS',
  'FOLHA',
  'FOLHA_PAGAMENTO',
  'FOLHA DE PAGAMENTO',
  'PRO_LABORE',
  'PRO LABORE',
  'COMISSAO',
  'COMISSOES',
  'HORA_EXTRA',
  'HORAS_EXTRAS',
  'HE',
  'BENEFICIO',
  'BENEFICIOS',
  'VALE',
  'VALE_TRANSPORTE',
  'VALE ALIMENTACAO',
  'VALE_ALIMENTACAO',
  'VALE_REFEICAO',
  'VALE REFEICAO',
  'VT',
  'VA',
  'VR',
  'PLANO_SAUDE',
  'PLANO SAUDE',
  'INSS',
  'FGTS',
  '13_SALARIO',
  'FERIAS',
  'RESCISAO',
  'CONSTANCIA',
] as const;

export const FUNCIONARIOS_BASE_CALCULO = {
  // Campos textuais avaliados para classificar despesas de funcionarios.
  campos_texto: ['categoria', 'classificacao', 'local'] as const,

  // Base para custo por m2 (Aba 3 - custos internos).
  custo_hora_empresarial_por_m2: {
    divisor: 'capacidade_m2_mes',
    divisor_padrao: 1,
  },

  // Base de horas uteis para custo por hora de estrutura/fabrica.
  custo_hora_empresarial_por_hora: {
    divisor: 'horas_uteis_mes_fabrica',
    divisor_padrao: 176,
  },
} as const;

export const CATEGORIAS_DESPESA_FIXA_SALARIOS = [
  'SALARIO',
  'SALARIOS',
  'FOLHA',
  'FOLHA_PAGAMENTO',
  'FOLHA DE PAGAMENTO',
  'PRO_LABORE',
  'PRO LABORE',
] as const;
