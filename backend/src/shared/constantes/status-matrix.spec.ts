import {
  classificarVendaPorFluxoMatrixOuLegado,
  proximaSubetapaDoFluxo,
  reversaoStatusClientePorSubetapa,
  statusClienteAoAgendarPorSubetapa,
  statusClienteAoConcluirSubetapa,
  subetapaTerminal,
} from './status-matrix';

describe('status-matrix', () => {
  it('mantem a sequencia comercial corrigida ate o fechamento', () => {
    expect(proximaSubetapaDoFluxo('CADASTRO')).toBe('MEDIDA');
    expect(proximaSubetapaDoFluxo('MEDIDA')).toBe('ORCAMENTO');
    expect(proximaSubetapaDoFluxo('ORCAMENTO')).toBe('APRESENTACAO');
    expect(proximaSubetapaDoFluxo('APRESENTACAO')).toBe('FECHAMENTO');
    expect(proximaSubetapaDoFluxo('FECHAMENTO')).toBe('MEDIDA_FINA');
  });

  it('mantem servico de corte em fluxo terminal separado', () => {
    expect(subetapaTerminal('SERVICO_CORTE_FITA_BORDA')).toBe(true);
    expect(subetapaTerminal('GARANTIA')).toBe(true);
    expect(subetapaTerminal('APRESENTACAO')).toBe(false);
  });

  it('traduz a subetapa da matriz para status legado compativel no agendamento e na conclusao', () => {
    expect(statusClienteAoAgendarPorSubetapa({ subetapa: 'CADASTRO' })).toBe('CLIENTE_CADASTRADO');
    expect(statusClienteAoAgendarPorSubetapa({ subetapa: 'MEDIDA' })).toBe('MEDIDA_AGENDADA');
    expect(statusClienteAoAgendarPorSubetapa({ subetapa: 'APRESENTACAO' })).toBe('APRESENTACAO_AGENDADA');
    expect(statusClienteAoAgendarPorSubetapa({ subetapa: 'MEDIDA_FINA' })).toBe('MEDIDA_FINA_AGENDADA');

    expect(statusClienteAoConcluirSubetapa({ subetapa: 'MEDIDA' })).toBe('MEDIDA_REALIZADA');
    expect(statusClienteAoConcluirSubetapa({ subetapa: 'APRESENTACAO' })).toBe('ORCAMENTO_APRESENTADO');
    expect(statusClienteAoConcluirSubetapa({ subetapa: 'PROJETO_TECNICO' })).toBe('PROJETO_TECNICO_CONCLUIDO');
    expect(statusClienteAoConcluirSubetapa({ subetapa: 'PRODUCAO' })).toBe('AGENDAR_MONTAGEM');
  });

  it('resolve a reversao compativel por subetapa ao cancelar', () => {
    expect(reversaoStatusClientePorSubetapa({ subetapa: 'MEDIDA' })).toEqual({
      statusAplicado: 'MEDIDA_AGENDADA',
      statusAnterior: 'AGENDAR_MEDIDA',
    });
    expect(reversaoStatusClientePorSubetapa({ subetapa: 'FECHAMENTO' })).toEqual({
      statusAplicado: 'CONTRATO_ASSINADO',
      statusAnterior: 'VENDA_FECHADA',
    });
    expect(reversaoStatusClientePorSubetapa({ subetapa: 'PRODUCAO' })).toBeNull();
  });

  it('classifica fluxo da venda apenas pela matriz persistida', () => {
    expect(
      classificarVendaPorFluxoMatrixOuLegado({
        agendas: [
          {
            subetapa: 'PRODUCAO',
            execucao_etapa: 'EM_ANDAMENTO',
            status: 'EM_ANDAMENTO',
          },
        ],
      }),
    ).toEqual({
      emProducao: true,
      finalizada: false,
      obraVigente: true,
    });

    expect(
      classificarVendaPorFluxoMatrixOuLegado({
        agendas: [
          {
            subetapa: 'MONTAGEM',
            execucao_etapa: 'CONCLUIDO',
            status: 'CONCLUIDO',
          },
        ],
      }),
    ).toEqual({
      emProducao: false,
      finalizada: true,
      obraVigente: false,
    });

    expect(
      classificarVendaPorFluxoMatrixOuLegado({
        agendas: [],
      }),
    ).toEqual({
      emProducao: false,
      finalizada: false,
      obraVigente: false,
    });

    expect(
      classificarVendaPorFluxoMatrixOuLegado({
        agendas: [],
      }),
    ).toEqual({
      emProducao: false,
      finalizada: false,
      obraVigente: false,
    });
  });
});