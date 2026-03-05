export const PIPELINE_PLANO_CORTE = [
  { 
    ordem: 1, 
    fase: 'INICIO', 
    label: 'Aguardando / Conferência', 
    cor: '#94a3b8', // Slate (Cinza)
    statusInternos: ['RECEBIDO', 'CONFERIDO_TECNICO']
  },
  { 
    ordem: 2, 
    fase: 'PRODUZINDO', 
    label: 'Em Corte / Usinagem', 
    cor: '#f59e0b', // Amber (Laranja)
    statusInternos: ['NA_MAQUINA', 'BORDA_E_ACABAMENTO']
  },
  { 
    ordem: 3, 
    fase: 'FIM', 
    label: 'Pronto / Retirado', 
    cor: '#10b981', // Emerald (Verde)
    statusInternos: ['PRONTO_PARA_RETIRADA', 'ENTREGUE']
  }
];