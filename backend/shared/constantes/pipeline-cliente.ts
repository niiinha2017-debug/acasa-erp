// src/constantes/pipeline-cliente.js

export const PIPELINE_CLIENTE = [
  {
    fase: 'CADASTRO',
    label: 'Cliente cadastrado',
    ordem: 1,
    statusInternos: ['CLIENTE_CADASTRADO'],
    cor: '#gray'
  },
  {
    fase: 'MEDICAO_INICIAL',
    label: 'Medição Inicial',
    ordem: 2,
    temAgendamento: true,
    dataCampo: 'data_medida',
    statusInternos: ['AGENDAR_MEDIDA', 'MEDIDA_AGENDADA', 'MEDIDA_REALIZADA'],
    cor: '#blue'
  },
  {
    fase: 'ORCAMENTO_PROJETO',
    label: 'Projeto & Orçamento',
    ordem: 3,
    statusInternos: [
      'CRIAR_ORCAMENTO',
      'ORCAMENTO_EM_ANDAMENTO',
      'ORCAMENTO_ENVIADO',
      'ORCAMENTO_EM_NEGOCIACAO',
      'ORCAMENTO_APROVADO',
      'ORCAMENTO_REPROVADO',
    ],
    cor: '#purple'
  },
  {
    fase: 'APRESENTACAO',
    label: 'Apresentação',
    ordem: 4,
    temAgendamento: true,
    dataCampo: 'data_apresentacao',
    statusInternos: ['AGENDAR_APRESENTACAO', 'APRESENTACAO_AGENDADA', 'ORCAMENTO_APRESENTADO'],
    cor: '#orange'
  },
  {
    fase: 'CONTRATO_FECHADO',
    label: 'Venda & Contrato',
    ordem: 5,
    statusInternos: ['VENDA_FECHADA', 'CONTRATO_GERADO', 'CONTRATO_ASSINADO'],
    cor: '#green'
  },
  {
    fase: 'MEDICAO_FINA',
    label: 'Engenharia / Medida Fina',
    ordem: 6,
    temAgendamento: true,
    dataCampo: 'data_medida_fina',
    statusInternos: ['AGENDAR_MEDIDA_FINA', 'MEDIDA_FINA_AGENDADA', 'MEDIDA_FINA_REALIZADA'],
    cor: '#cyan'
  },
  {
    fase: 'PRODUCAO_MONTAGEM',
    label: 'Fábrica & Montagem',
    ordem: 7,
    statusInternos: [
      'PROJETO_TECNICO_EM_ANDAMENTO',
      'PROJETO_TECNICO_APROVADO',
      'PRODUCAO_AGENDADA',
      'EM_PRODUCAO',
      'PRODUCAO_FINALIZADA',
      'AGENDAR_MONTAGEM',
      'MONTAGEM_AGENDADA',
      'EM_MONTAGEM',
      'MONTAGEM_FINALIZADA',
    ],
    cor: '#dark-blue'
  },
  {
    fase: 'POS_VENDA',
    label: 'Pós-Venda',
    ordem: 8,
    statusInternos: ['GARANTIA', 'ASSISTENCIA', 'MANUTENCAO', 'ENCERRADO'],
    cor: '#gold'
  }
]