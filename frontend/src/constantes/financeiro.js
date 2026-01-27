// src/constantes/financeiro.js

export const FINANCEIRO_CATEGORIAS = {
  FABRICA: {
    CUSTO_FIXO: [
      { key: 'AGUA', label: 'Água' },
      { key: 'ENERGIA', label: 'Energia' },
      { key: 'INTERNET', label: 'Internet' },
      { key: 'SEGURANCA', label: 'Segurança / Monitoramento' },
      { key: 'LIMPEZA', label: 'Limpeza' },
      { key: 'DEPRECIACAO_MAQUINAS', label: 'Depreciação de Máquinas' },
      { key: 'SEGURO_MAQUINAS', label: 'Seguro de Máquinas' },
    ],

    CUSTO_VARIAVEL: [
      { key: 'COMBUSTIVEL', label: 'Combustível' },
      { key: 'MANUTENCAO', label: 'Manutenção' },
      { key: 'MATERIA_PRIMA', label: 'Matéria-prima (MDF/Madeira/Chapas)' },
      { key: 'FERRAGENS', label: 'Ferragens' },
      { key: 'INSUMOS_PRODUCAO', label: 'Insumos de Produção (Cola/Lixa/Parafuso)' },
      { key: 'FERRAMENTAS_CONSUMO', label: 'Ferramentas de Consumo (Broca/Disco/Lâmina)' },
      { key: 'TERCEIRIZACAO', label: 'Terceirização (Vidro/Pintura/Usinagem)' },
      { key: 'EMBALAGEM', label: 'Embalagem / Proteção' },
      { key: 'FRETE_ENTREGA', label: 'Frete / Entrega' },
      { key: 'INSTALACAO_MONTAGEM', label: 'Instalação / Montagem (Custo)' },
      { key: 'PEDAGIO', label: 'Pedágio' },
      { key: 'ALIMENTACAO', label: 'Alimentação (Operacional)' },
    ],

    DESPESA_FIXA: [
      { key: 'SALARIO', label: 'Salário' },
      { key: 'PRO_LABORE', label: 'Pró-labore' },
      { key: 'CONTABILIDADE', label: 'Contabilidade' },
      { key: 'SISTEMAS', label: 'Sistemas / Assinaturas' },
      { key: 'SERVICOS_BANCARIOS', label: 'Serviços Bancários (Mensalidade)' },
      { key: 'SEGUROS', label: 'Seguros' },
    ],

    DESPESA_VARIAVEL: [
      { key: 'TAXAS', label: 'Taxas' },
      { key: 'NOTAS', label: 'Notas / Impostos' },
      { key: 'UNIFORME_EPI', label: 'Uniforme / EPI' },
      { key: 'TREINAMENTO', label: 'Treinamento / Cursos' },
      { key: 'MARKETING', label: 'Marketing / Anúncios' },
      { key: 'MATERIAL_ESCRITORIO', label: 'Material de Escritório' },
      { key: 'MANUTENCAO_PREDIAL', label: 'Manutenção Predial' },
      { key: 'MULTAS_JUROS', label: 'Multas / Juros' },
      { key: 'OUTROS', label: 'Outros' },
    ],
  },

  LOJA: {
    CUSTO_FIXO: [
      { key: 'AGUA', label: 'Água' },
      { key: 'ENERGIA', label: 'Energia' },
      { key: 'INTERNET', label: 'Internet' },
      { key: 'SEGURANCA', label: 'Segurança / Monitoramento' },
      { key: 'LIMPEZA', label: 'Limpeza' },
    ],

    CUSTO_VARIAVEL: [
      { key: 'COMBUSTIVEL', label: 'Combustível' },
      { key: 'COMISSOES', label: 'Comissões (Venda/Arquiteto/Projetista)' },
      { key: 'TAXAS_VENDA', label: 'Taxas de Venda (Cartão/Intermediação)' },
      { key: 'DESLOCAMENTO', label: 'Deslocamento' },
      { key: 'POS_VENDA', label: 'Pós-venda (Assistência / Garantia)' },
    ],

    DESPESA_FIXA: [
      { key: 'SALARIO', label: 'Salário' },
      { key: 'PRO_LABORE', label: 'Pró-labore' },
      { key: 'CONTABILIDADE', label: 'Contabilidade' },
      { key: 'SISTEMAS', label: 'Sistemas / Assinaturas' },
      { key: 'SERVICOS_BANCARIOS', label: 'Serviços Bancários (Mensalidade)' },
      { key: 'SEGUROS', label: 'Seguros' },
    ],

    DESPESA_VARIAVEL: [
      { key: 'TAXAS', label: 'Taxas' },
      { key: 'NOTAS', label: 'Notas / Impostos' },
      { key: 'MARKETING', label: 'Marketing / Anúncios' },
      { key: 'MATERIAL_ESCRITORIO', label: 'Material de Escritório' },
      { key: 'ALIMENTACAO', label: 'Alimentação (Operacional)' },
      { key: 'TREINAMENTO', label: 'Treinamento / Cursos' },
      { key: 'MULTAS_JUROS', label: 'Multas / Juros' },
      { key: 'OUTROS', label: 'Outros' },
    ],
  },
}
