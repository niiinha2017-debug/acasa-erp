type PipelineProducaoItem = {
  key: string;
  fase: string;
  ordem: number;
};

export const PIPELINE_PRODUCAO: PipelineProducaoItem[] = [
  { key: 'PRODUCAO_RECEBIDA', fase: 'ABERTURA', ordem: 1 },
  { key: 'CORTE', fase: 'EXECUCAO', ordem: 2 },
  { key: 'PREPARACAO_TECNICA', fase: 'EXECUCAO', ordem: 3 },
  { key: 'MONTAGEM_INTERNA', fase: 'EXECUCAO', ordem: 4 },
  { key: 'ACABAMENTO', fase: 'EXECUCAO', ordem: 5 },
  { key: 'CONFERENCIA_QUALIDADE', fase: 'EXECUCAO', ordem: 6 },
  { key: 'MONTAGEM_CLIENTE_AGENDADA', fase: 'MONTAGEM_CLIENTE', ordem: 7 },
  { key: 'EM_MONTAGEM_CLIENTE', fase: 'MONTAGEM_CLIENTE', ordem: 8 },
  { key: 'MONTAGEM_CLIENTE_FINALIZADA', fase: 'MONTAGEM_CLIENTE', ordem: 9 },
  { key: 'PRODUCAO_FINALIZADA', fase: 'FINALIZACAO', ordem: 10 },
];

export const PIPELINE_PRODUCAO_KEYS = PIPELINE_PRODUCAO.map((item) => item.key);
