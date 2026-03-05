import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import {
  normalizarOrigemFluxo,
  normalizarSetorDestino,
  origemPermitidaNoSetor,
  OrigemFluxo,
  SetorDestino,
} from './agenda-rules';
import { validarTransicaoStatusCliente } from '../shared/constantes/pipeline-cliente';
import {
  AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS,
  AGENDA_FABRICA_STATUS_AGENDADO,
  AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL,
  PIPELINE_PRODUCAO_KEYS,
  validarTransicaoStatusProducao,
} from '../shared/constantes/pipeline-producao';
import { getDataCorteContasReceber } from '../../shared/constantes/pipeline-regras';

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);
  private readonly categoriasPosVenda = [
    'GARANTIA',
    'MANUTENCAO',
    'ASSISTENCIA',
  ];
  private readonly reversaoStatusPorCategoria: Record<
    string,
    { statusAplicado: string; statusAnterior: string }
  > = {
    MEDIDA: {
      statusAplicado: 'MEDIDA_AGENDADA',
      statusAnterior: 'AGENDAR_MEDIDA',
    },
    AGENDAR_MEDIDA: {
      statusAplicado: 'MEDIDA_AGENDADA',
      statusAnterior: 'AGENDAR_MEDIDA',
    },
    ORCAMENTO: {
      statusAplicado: 'ORCAMENTO_EM_ANDAMENTO',
      statusAnterior: 'CRIAR_ORCAMENTO',
    },
    CRIAR_ORCAMENTO: {
      statusAplicado: 'ORCAMENTO_EM_ANDAMENTO',
      statusAnterior: 'CRIAR_ORCAMENTO',
    },
    APRESENTACAO: {
      statusAplicado: 'APRESENTACAO_AGENDADA',
      statusAnterior: 'AGENDAR_APRESENTACAO',
    },
    AGENDAR_APRESENTACAO: {
      statusAplicado: 'APRESENTACAO_AGENDADA',
      statusAnterior: 'AGENDAR_APRESENTACAO',
    },
    CONTRATO: {
      statusAplicado: 'CONTRATO_ASSINADO',
      statusAnterior: 'VENDA_FECHADA',
    },
    CONTRATO_GERADO: {
      statusAplicado: 'CONTRATO_ASSINADO',
      statusAnterior: 'VENDA_FECHADA',
    },
    MEDIDA_FINA: {
      statusAplicado: 'MEDIDA_FINA_AGENDADA',
      statusAnterior: 'AGENDAR_MEDIDA_FINA',
    },
    AGENDAR_MEDIDA_FINA: {
      statusAplicado: 'MEDIDA_FINA_AGENDADA',
      statusAnterior: 'AGENDAR_MEDIDA_FINA',
    },
  };
  constructor(private prisma: PrismaService) {}

  /**
   * Sincroniza os apontamentos da agenda (loja ou fábrica) para apontamento_producao,
   * para que apareçam na tela de Apontamento e entrem no rateio de custo/hora por funcionário.
   */
  private async syncApontamentosToProducao(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    params: {
      agenda_loja_id?: number;
      agenda_fabrica_id?: number;
      apontamentos: Array<{ funcionario_id: number; inicio_em: Date; fim_em: Date }>;
      categoria: string | null;
      venda_id: number | null;
    },
  ): Promise<void> {
    if (!params.apontamentos?.length) return;
    const ids = [...new Set(params.apontamentos.map((a) => a.funcionario_id))];
    const funcionarios = await tx.funcionarios.findMany({
      where: { id: { in: ids } },
      select: { id: true, custo_hora: true },
    });
    const custoHoraPorId = new Map(
      funcionarios.map((f) => [f.id, Number(f.custo_hora ?? 0)]),
    );
    for (const ap of params.apontamentos) {
      const inicio = ap.inicio_em instanceof Date ? ap.inicio_em : new Date(ap.inicio_em);
      const fim = ap.fim_em instanceof Date ? ap.fim_em : new Date(ap.fim_em);
      const horas = Math.round(((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)) * 100) / 100;
      const custoHora = custoHoraPorId.get(ap.funcionario_id) ?? 0;
      const custo_calculado = horas * custoHora;
      const data = new Date(inicio);
      data.setHours(0, 0, 0, 0);
      await tx.apontamento_producao.create({
        data: {
          agenda_loja_id: params.agenda_loja_id ?? undefined,
          agenda_fabrica_id: params.agenda_fabrica_id ?? undefined,
          venda_id: params.venda_id ?? undefined,
          funcionario_id: ap.funcionario_id,
          categoria: params.categoria ?? undefined,
          data,
          inicio_em: inicio,
          fim_em: fim,
          horas: new Decimal(horas),
          custo_calculado: new Decimal(custo_calculado),
        },
      });
    }
  }

  private normalizarCategoriaKey(categoria?: string | null): string {
    return String(categoria || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
  }

  private categoriaToStatus(categoria?: string) {
    const categoriaKey = this.normalizarCategoriaKey(categoria);
    const map: Record<string, string> = {
      MEDIDA: 'MEDIDA_AGENDADA',
      AGENDAR_MEDIDA: 'MEDIDA_AGENDADA',
      ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      CRIAR_ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      AGENDAR_ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      APRESENTACAO: 'APRESENTACAO_AGENDADA',
      AGENDAR_APRESENTACAO: 'APRESENTACAO_AGENDADA',
      CONTRATO: 'CONTRATO_ASSINADO',
      CONTRATO_GERADO: 'CONTRATO_ASSINADO',
      MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      AGENDAR_MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      GARANTIA: 'GARANTIA',
      MANUTENCAO: 'MANUTENCAO',
      ASSISTENCIA: 'ASSISTENCIA',
    };
    return { categoriaKey, status: map[categoriaKey] || '' };
  }

  private registrarAuditoriaStatusPosVenda(params: {
    agendaId: number;
    vendaId?: number | null;
    clienteId?: number | null;
    statusAplicado: string;
    origemAplicada: 'venda' | 'cliente';
  }) {
    this.logger.log(
      `[POS_VENDA] agenda=${params.agendaId} venda=${params.vendaId || 'null'} cliente=${params.clienteId || 'null'} status=${params.statusAplicado} origem=${params.origemAplicada}`,
    );
  }

  private async atualizarStatusVendaComValidacao(
    tx: any,
    vendaId: number,
    proximoStatus: string,
    contexto: string,
  ) {
    const venda = await tx.vendas.findUnique({
      where: { id: vendaId },
      select: { id: true, status: true },
    });
    if (!venda) {
      throw new BadRequestException(
        'Venda vinculada ao agendamento não encontrada.',
      );
    }

    const validacao = validarTransicaoStatusCliente({
      atual: venda.status,
      proximo: proximoStatus,
    });

    if (!validacao.ok) {
      throw new BadRequestException(`${contexto}: ${validacao.motivo}`);
    }

    await tx.vendas.update({
      where: { id: vendaId },
      data: { status: proximoStatus },
    });
  }

  private async atualizarStatusClienteComValidacao(
    tx: any,
    clienteId: number,
    proximoStatus: string,
    contexto: string,
  ) {
    const cliente = await tx.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, status: true },
    });
    if (!cliente) {
      throw new BadRequestException(
        'Cliente vinculado ao agendamento não encontrado.',
      );
    }

    const validacao = validarTransicaoStatusCliente({
      atual: cliente.status,
      proximo: proximoStatus,
    });
    if (!validacao.ok) {
      throw new BadRequestException(`${contexto}: ${validacao.motivo}`);
    }

    await tx.cliente.update({
      where: { id: clienteId },
      data: { status: proximoStatus },
    });
  }

  private async persistirAuditoriaStatusPosVenda(
    tx: any,
    params: {
      agendaId: number;
      origemAplicada: 'venda' | 'cliente';
      setor: 'LOJA' | 'FABRICA';
    },
  ) {
    const table = params.setor === 'LOJA' ? tx.agenda_loja : tx.agenda_fabrica;
    await table.update({
      where: { id: params.agendaId },
      data: {
        status_source: params.origemAplicada,
        status_aplicado_em: new Date(),
      },
    });
  }

  private inferirOrigemFluxo(
    planoCorteId?: number | null,
    vendaId?: number | null,
  ): OrigemFluxo {
    if (planoCorteId) return vendaId ? 'VENDA_PLANO_CORTE' : 'PLANO_CORTE';
    if (vendaId) return 'LOJA_VENDA';
    return 'TAREFA';
  }

  private resolverSetorOrigem(params: {
    setorDestinoInput?: string | null;
    origemFluxoInput?: string | null;
    setorAtual?: string | null;
    origemAtual?: string | null;
    planoCorteId?: number | null;
    vendaId?: number | null;
  }): { setorDestino: SetorDestino; origemFluxo: OrigemFluxo } {
    const origemAtual = normalizarOrigemFluxo(params.origemAtual);
    const setorAtual = normalizarSetorDestino(params.setorAtual);
    const origemFluxo =
      normalizarOrigemFluxo(params.origemFluxoInput) ||
      origemAtual ||
      this.inferirOrigemFluxo(params.planoCorteId, params.vendaId);

    const setorInferidoPorOrigem: SetorDestino =
      origemFluxo === 'PLANO_CORTE' || origemFluxo === 'VENDA_PLANO_CORTE'
        ? 'FABRICA'
        : 'LOJA';

    const setorDestino =
      normalizarSetorDestino(params.setorDestinoInput) ||
      setorAtual ||
      (params.planoCorteId ? 'FABRICA' : setorInferidoPorOrigem);

    if (!origemPermitidaNoSetor(setorDestino, origemFluxo)) {
      throw new BadRequestException(
        `Combinação inválida: setor ${setorDestino} não permite origem ${origemFluxo}.`,
      );
    }

    return { setorDestino, origemFluxo };
  }

  private validarVinculosPorOrigem(params: {
    origemFluxo: OrigemFluxo;
    vendaId?: number | null;
    planoCorteId?: number | null;
    clienteId?: number | null;
    fornecedorId?: number | null;
  }) {
    const { origemFluxo, vendaId, planoCorteId, clienteId, fornecedorId } =
      params;
    if (origemFluxo === 'PLANO_CORTE' && !planoCorteId) {
      throw new BadRequestException('Origem PLANO_CORTE exige plano_corte_id.');
    }
    if (origemFluxo === 'VENDA_PLANO_CORTE' && (!planoCorteId || !vendaId)) {
      throw new BadRequestException(
        'Origem VENDA_PLANO_CORTE exige venda_id e plano_corte_id.',
      );
    }
    if (origemFluxo === 'LOJA_VENDA' && !vendaId && !clienteId) {
      throw new BadRequestException(
        'Agendamento da loja exige venda vinculada ou cliente selecionado.',
      );
    }
    if (origemFluxo === 'POS_VENDA' && !vendaId && !clienteId) {
      throw new BadRequestException(
        'Origem POS_VENDA exige venda_id ou cliente_id.',
      );
    }
    if (
      origemFluxo !== 'TAREFA' &&
      !clienteId &&
      !fornecedorId &&
      !planoCorteId
    ) {
      throw new BadRequestException(
        'Agendamento vinculado exige cliente_id ou plano_corte_id.',
      );
    }
  }

  /**
   * Agenda Produção só recebe cliente (venda) quando o contrato está vigente;
   * após contrato vigente o status do cliente pode ir para medida fina.
   */
  private async validarContratoVigenteParaFabrica(vendaId: number) {
    const contratoVigente = await this.prisma.contratos.findFirst({
      where: { venda_id: vendaId, status: 'VIGENTE' },
      select: { id: true },
    });
    if (!contratoVigente) {
      throw new BadRequestException(
        'A Agenda da Produção só recebe cliente quando o contrato está vigente. Gere e assine o contrato da venda antes de agendar na fábrica (medida fina, montagem, etc.).',
      );
    }
  }

  private validarPeriodo(inicio: Date, fim: Date) {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Período inválido para o agendamento');
    }
    if (fim <= inicio) {
      throw new BadRequestException(
        'Data de término deve ser maior que a de início',
      );
    }
  }

  private formatarPeriodo(inicio: Date | string, fim: Date | string): string {
    const i = typeof inicio === 'string' ? new Date(inicio) : inicio;
    const f = typeof fim === 'string' ? new Date(fim) : fim;
    const d = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const t = (d: Date) =>
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${d(i)} ${t(i)}–${t(f)}`;
  }

  private ehCategoriaPosVenda(categoria?: string | null): boolean {
    const key = String(categoria || '')
      .trim()
      .toUpperCase();
    return this.categoriasPosVenda.includes(key);
  }

  private async validarPosVendaAposMontagem(params: {
    tx: any;
    categoria?: string | null;
    vendaId?: number | null;
    setor?: 'LOJA' | 'FABRICA';
  }) {
    if (!this.ehCategoriaPosVenda(params.categoria)) return;

    const vendaId = Number(params.vendaId || 0);
    if (!vendaId) {
      throw new BadRequestException(
        'Para abrir garantia, manutenção ou assistência é obrigatório vincular a venda.',
      );
    }

    const categoriasMontagemConcluida = [
      'MONTAGEM_CLIENTE_AGENDADA',
      'EM_MONTAGEM_CLIENTE',
      'MONTAGEM_CLIENTE_FINALIZADA',
      'MONTAGEM_FINALIZADA',
    ];
    const montagemLoja = await params.tx.agenda_loja.findFirst({
      where: {
        venda_id: vendaId,
        categoria: { in: categoriasMontagemConcluida },
        status: 'CONCLUIDO',
      },
      select: { id: true },
    });
    const montagemFabrica = await params.tx.agenda_fabrica.findFirst({
      where: {
        venda_id: vendaId,
        categoria: { in: categoriasMontagemConcluida },
        status: 'CONCLUIDO',
      },
      select: { id: true },
    });

    if (!montagemLoja && !montagemFabrica) {
      throw new BadRequestException(
        'Só é possível abrir garantia, manutenção ou assistência após o término da montagem do cliente.',
      );
    }
  }

  private async validarConflitosHorario(
    tx: any,
    params: {
      agendaIdIgnorar?: number;
      inicio: Date;
      fim: Date;
      equipeIds: number[];
      setor?: 'LOJA' | 'FABRICA';
      apontamentos?: Array<{
        funcionario_id: number;
        inicio_em: Date | string;
        fim_em: Date | string;
      }>;
    },
  ) {
    const equipeIdsUnicos = Array.from(
      new Set((params.equipeIds || []).map(Number).filter(Boolean)),
    );
    if (!equipeIdsUnicos.length) return;

    const hasApontamentos =
      Array.isArray(params.apontamentos) && params.apontamentos.length > 0;
    const periodosPorFuncionario = new Map<
      number,
      Array<{ inicio: Date; fim: Date }>
    >();

    if (hasApontamentos) {
      for (const item of params.apontamentos || []) {
        const fid = Number(item.funcionario_id);
        if (!fid) continue;
        const inicio = new Date(item.inicio_em);
        const fim = new Date(item.fim_em);
        this.validarPeriodo(inicio, fim);
        const atual = periodosPorFuncionario.get(fid) || [];
        atual.push({ inicio, fim });
        periodosPorFuncionario.set(fid, atual);
      }
    } else {
      for (const fid of equipeIdsUnicos) {
        periodosPorFuncionario.set(fid, [
          { inicio: params.inicio, fim: params.fim },
        ]);
      }
    }

    const setor = params.setor ?? 'LOJA';
    const apontamentosTable =
      setor === 'LOJA'
        ? tx.agenda_loja_apontamentos
        : tx.agenda_fabrica_apontamentos;
    const agendaTable = setor === 'LOJA' ? tx.agenda_loja : tx.agenda_fabrica;
    const agendaRelation = setor === 'LOJA' ? 'agenda_loja' : 'agenda_fabrica';

    for (const [funcionarioId, periodos] of periodosPorFuncionario.entries()) {
      const orPeriodos = periodos.map((p) => ({
        inicio_em: { lt: p.fim },
        fim_em: { gt: p.inicio },
      }));

      const conflitoApontamento = await apontamentosTable.findFirst({
        where: {
          funcionario_id: funcionarioId,
          [agendaRelation]: {
            ...(params.agendaIdIgnorar
              ? { id: { not: params.agendaIdIgnorar } }
              : {}),
            status: { not: 'CANCELADO' },
          },
          OR: orPeriodos,
        },
        select: {
          id: true,
          inicio_em: true,
          fim_em: true,
          [agendaRelation]: { select: { titulo: true } },
        },
      });

      if (conflitoApontamento) {
        const ag = conflitoApontamento[agendaRelation];
        const titulo = ag?.titulo || 'Agendamento';
        const ini = conflitoApontamento.inicio_em;
        const fim = conflitoApontamento.fim_em;
        const periodo =
          ini && fim ? ` (${this.formatarPeriodo(ini, fim)})` : '';
        throw new BadRequestException(
          `Conflito de horário para o funcionário ${funcionarioId}: já existe "${titulo}"${periodo}. Escolha outro horário ou outro funcionário.`,
        );
      }

      const conflitoEvento = await agendaTable.findFirst({
        where: {
          id: params.agendaIdIgnorar
            ? { not: params.agendaIdIgnorar }
            : undefined,
          status: { not: 'CANCELADO' },
          equipe: { some: { funcionario_id: funcionarioId } },
          OR: orPeriodos,
        },
        select: { id: true, titulo: true, inicio_em: true, fim_em: true },
      });

      if (conflitoEvento) {
        const periodo =
          conflitoEvento.inicio_em && conflitoEvento.fim_em
            ? ` (${this.formatarPeriodo(conflitoEvento.inicio_em, conflitoEvento.fim_em)})`
            : '';
        throw new BadRequestException(
          `Conflito de horário para o funcionário ${funcionarioId}: já existe "${conflitoEvento.titulo || 'Evento'}"${periodo}. Escolha outro horário ou outro funcionário.`,
        );
      }
    }
  }

  async create(dto: CreateAgendaDto, opts?: { criadoPorUsuarioId?: number }) {
    const {
      equipe_ids,
      categoria,
      apontamentos,
      origem_fluxo,
      setor_destino,
      ambientes_selecionados: ambientesSelecionados,
      ...dadosAgenda
    } = dto;
    const { status: clienteStatus } = this.categoriaToStatus(categoria);

    // Regra: cliente_id OU (plano_corte_id com fornecedor)
    const clienteId = dto.cliente_id ?? null;
    let fornecedorId = dto.fornecedor_id ?? null;

    if (dto.plano_corte_id) {
      const plano = await this.prisma.plano_corte.findUnique({
        where: { id: dto.plano_corte_id },
        select: { fornecedor_id: true },
      });
      if (!plano)
        throw new BadRequestException('Plano de Corte não encontrado');
      fornecedorId = plano.fornecedor_id;
    }
    this.validarPeriodo(new Date(dto.inicio_em), new Date(dto.fim_em));

    const { setorDestino, origemFluxo } = this.resolverSetorOrigem({
      setorDestinoInput: setor_destino,
      origemFluxoInput: origem_fluxo,
      planoCorteId: dto.plano_corte_id,
      vendaId: dto.venda_id,
    });

    this.validarVinculosPorOrigem({
      origemFluxo,
      vendaId: dto.venda_id,
      planoCorteId: dto.plano_corte_id,
      clienteId,
      fornecedorId,
    });

    const isLoja = setorDestino === 'LOJA';
    if (!isLoja && dto.venda_id) {
      await this.validarContratoVigenteParaFabrica(dto.venda_id);
    }

    let categoriaFabrica = categoria ?? null;
    if (!isLoja) {
      const key = (categoriaFabrica || '').trim().toUpperCase();
      if (!categoriaFabrica) {
        categoriaFabrica = 'PRODUCAO_RECEBIDA';
      } else if (!PIPELINE_PRODUCAO_KEYS.includes(key)) {
        throw new BadRequestException(
          `Categoria de produção inválida. Use uma destas: ${PIPELINE_PRODUCAO_KEYS.join(', ')}`,
        );
      } else {
        categoriaFabrica = key;
      }
    }

    const dataAgenda = {
      ...dadosAgenda,
      cliente_id: clienteId,
      fornecedor_id: fornecedorId,
      categoria: isLoja ? (categoria || null) : categoriaFabrica,
      origem_fluxo: origemFluxo,
    };

    const idsEquipe = Array.isArray(equipe_ids)
      ? Array.from(new Set(equipe_ids.map(Number).filter(Boolean)))
      : [];

    return this.prisma.$transaction(async (tx) => {
      await this.validarConflitosHorario(tx, {
        inicio: new Date(dto.inicio_em),
        fim: new Date(dto.fim_em),
        equipeIds: idsEquipe,
        apontamentos,
        setor: setorDestino,
      });
      await this.validarPosVendaAposMontagem({
        tx,
        categoria: categoria || null,
        vendaId: dto.venda_id ?? null,
        setor: setorDestino,
      });

      const criadoPor = opts?.criadoPorUsuarioId ? { criado_por_usuario_id: opts.criadoPorUsuarioId } : {};
      const createPayload: any = {
        ...dataAgenda,
        ...criadoPor,
      };
      if (idsEquipe.length > 0) {
        createPayload.equipe = {
          create: idsEquipe.map((id) => ({ funcionario_id: id })),
        };
      }
      if (!isLoja && dto.plano_corte_id) {
        createPayload.plano_corte_id = dto.plano_corte_id;
      }
      if (!isLoja && Array.isArray(ambientesSelecionados)) {
        createPayload.ambientes_selecionados = ambientesSelecionados;
      }

      const agendamento = isLoja
        ? await tx.agenda_loja.create({
            data: createPayload,
            include: {
              equipe: { include: { funcionario: true } },
              apontamentos: true,
              cliente: true,
              fornecedor: true,
              venda: true,
            },
          })
        : await tx.agenda_fabrica.create({
            data: createPayload,
            include: {
              equipe: { include: { funcionario: true } },
              apontamentos: true,
              cliente: true,
              fornecedor: true,
              plano_corte: true,
              venda: true,
            },
          });

      if (Array.isArray(apontamentos) && apontamentos.length) {
        const apontamentosDados = apontamentos.map((item: any) => ({
          funcionario_id: item.funcionario_id,
          inicio_em: new Date(item.inicio_em),
          fim_em: new Date(item.fim_em),
        }));
        if (isLoja) {
          await tx.agenda_loja_apontamentos.createMany({
            data: apontamentosDados.map((a) => ({
              agenda_loja_id: agendamento.id,
              funcionario_id: a.funcionario_id,
              inicio_em: a.inicio_em,
              fim_em: a.fim_em,
            })),
          });
          await this.syncApontamentosToProducao(tx, {
            agenda_loja_id: agendamento.id,
            apontamentos: apontamentosDados,
            categoria: agendamento.categoria ?? null,
            venda_id: (agendamento as any).venda_id ?? null,
          });
        } else {
          await tx.agenda_fabrica_apontamentos.createMany({
            data: apontamentosDados.map((a) => ({
              agenda_fabrica_id: agendamento.id,
              funcionario_id: a.funcionario_id,
              inicio_em: a.inicio_em,
              fim_em: a.fim_em,
            })),
          });
          await this.syncApontamentosToProducao(tx, {
            agenda_fabrica_id: agendamento.id,
            apontamentos: apontamentosDados,
            categoria: agendamento.categoria ?? null,
            venda_id: (agendamento as any).venda_id ?? null,
          });
        }
      }

      // 2. Atualiza status do Plano de Corte se houver ID
      if (dto.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: dto.plano_corte_id },
          data: { status: 'EM_ANDAMENTO' }, // Key da ordem 2 do pipeline
        });
      }

      const novoStatus = clienteStatus;
      // Plano de corte é venda de fornecedor: não atualizar status da venda do cliente
      if (!dto.plano_corte_id) {
        if (origemFluxo === 'POS_VENDA' && novoStatus) {
          const origemAplicada: 'venda' | 'cliente' =
            dto.venda_id && dto.venda_id > 0 ? 'venda' : 'cliente';

          if (origemAplicada === 'venda' && dto.venda_id) {
            const venda = await tx.vendas.findUnique({
              where: { id: dto.venda_id },
              select: { status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({
                atual: venda.status,
                proximo: novoStatus,
              }).ok
            ) {
              await this.atualizarStatusVendaComValidacao(
                tx,
                dto.venda_id,
                novoStatus,
                'Agendamento (pós-venda)',
              );
            }
          } else if (clienteId) {
            const cliente = await tx.cliente.findUnique({
              where: { id: clienteId },
              select: { status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({
                atual: cliente.status,
                proximo: novoStatus,
              }).ok
            ) {
              await this.atualizarStatusClienteComValidacao(
                tx,
                clienteId,
                novoStatus,
                'Agendamento (pós-venda)',
              );
            }
          }

          this.registrarAuditoriaStatusPosVenda({
            agendaId: agendamento.id,
            vendaId: dto.venda_id,
            clienteId,
            statusAplicado: novoStatus,
            origemAplicada,
          });
          await this.persistirAuditoriaStatusPosVenda(tx, {
            agendaId: agendamento.id,
            origemAplicada,
            setor: setorDestino,
          });
        } else {
          if (dto.venda_id && novoStatus) {
            const venda = await tx.vendas.findUnique({
              where: { id: dto.venda_id },
              select: { status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({
                atual: venda.status,
                proximo: novoStatus,
              }).ok
            ) {
              await this.atualizarStatusVendaComValidacao(
                tx,
                dto.venda_id,
                novoStatus,
                'Agendamento',
              );
            }
          }

          if (clienteId && clienteStatus) {
            const cliente = await tx.cliente.findUnique({
              where: { id: clienteId },
              select: { status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({
                atual: cliente.status,
                proximo: clienteStatus,
              }).ok
            ) {
              await this.atualizarStatusClienteComValidacao(
                tx,
                clienteId,
                clienteStatus,
                'Agendamento',
              );
            }
          }
        }
      }

      // Retorna o agendamento criado para finalizar a transação
      return agendamento;
    }); // <--- Chave e parênteses da transação fechados aqui
  }
  async findAll(
    inicio?: string,
    fim?: string,
    opts?: {
      includePlanoCorte?: boolean;
      status?: string;
      funcionarioId?: number;
      setorDestino?: 'LOJA' | 'FABRICA';
      origemFluxo?: OrigemFluxo;
      incluirCancelados?: boolean;
    },
  ) {
    const setor = opts?.setorDestino ?? 'LOJA';
    const includePlanoCorte = opts?.includePlanoCorte !== false;
    const incluirCancelados = opts?.incluirCancelados === true;

    // Fim: se for só data (YYYY-MM-DD), considerar fim do dia (23:59:59.999) para incluir eventos no último dia do mês
    let fimDate: Date | undefined;
    if (fim) {
      fimDate = new Date(fim);
      if (String(fim).length <= 10 && !String(fim).includes('T')) {
        fimDate.setHours(23, 59, 59, 999);
      }
    }

    const where: any = {
      inicio_em: {
        gte: inicio ? new Date(inicio) : undefined,
        lte: fimDate,
      },
      status: opts?.status
        ? opts.status
        : incluirCancelados
          ? undefined
          : { not: 'CANCELADO' },
      equipe: opts?.funcionarioId
        ? { some: { funcionario_id: opts.funcionarioId } }
        : undefined,
      origem_fluxo: opts?.origemFluxo || undefined,
    };
    const include: any = {
      cliente: true,
      fornecedor: true,
      orcamento: { select: { id: true } },
      equipe: { include: { funcionario: true } },
      venda: { include: { cliente: true } },
      apontamentos: true,
      alterado_por_usuario: { select: { id: true, nome: true } },
      criado_por_usuario: { select: { id: true, nome: true } },
    };
    if (setor === 'FABRICA') {
      include.plano_corte = true;
    }
    if (setor === 'LOJA') {
      return this.prisma.agenda_loja.findMany({
        where: { ...where, ...(includePlanoCorte ? {} : {}) },
        include,
        orderBy: { inicio_em: 'asc' },
      });
    }
    // Regras de visibilidade da agenda: seguem constantes do pipeline (AGENDA_FABRICA_*) para não duplicar lógica
    const somentePainelCats = AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS;
    const statusSempreVisivel = AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL;
    const statusAgendado = AGENDA_FABRICA_STATUS_AGENDADO;
    const whereFabrica: any = {
      ...where,
      AND: [
        {
          OR: [
            { venda_id: null },
            { venda: { contratos: { some: { status: 'VIGENTE' } } } },
            { status: statusSempreVisivel },
          ],
        },
        {
          OR: [
            // Qualquer categoria que não seja "só painel" → aparece no calendário
            ...(somentePainelCats.length > 0
              ? [{ categoria: { notIn: [...somentePainelCats] } }]
              : []),
            { status: statusSempreVisivel },
            // "Só painel" mas já agendado → aparece no calendário
            ...somentePainelCats.map((c) => ({ categoria: c, status: statusAgendado })),
          ],
        },
      ],
    };
    const eventos = await this.prisma.agenda_fabrica.findMany({
      where: whereFabrica,
      include,
      orderBy: { inicio_em: 'asc' },
    });
    return eventos;
  }

  /** Lista eventos "só painel" (ex.: Agendar medida fina) ainda pendentes – regra alinhada ao pipeline. Inclui pendencia_financeira para bloquear botão Agendar. */
  async findPendentesMedidaFina() {
    const include: any = {
      cliente: true,
      venda: true,
      equipe: { include: { funcionario: true } },
    };
    const categoriasPainel = AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS as readonly string[];
    const lista = await this.prisma.agenda_fabrica.findMany({
      where: {
        categoria: { in: [...categoriasPainel] },
        status: 'PENDENTE',
        origem_fluxo: 'LOJA_VENDA',
      },
      include,
      orderBy: { criado_em: 'desc' },
    });

    const clienteIds = Array.from(
      new Set(
        lista
          .map((e: any) => Number(e?.cliente_id ?? e?.venda?.cliente_id ?? 0))
          .filter((id: number) => id > 0),
      ),
    );
    const dataCorte = getDataCorteContasReceber();
    const comPendencia = new Set<number>();
    if (clienteIds.length > 0) {
      const contas = await this.prisma.contas_receber.findMany({
        where: {
          cliente_id: { in: clienteIds },
          vencimento_em: { lte: dataCorte },
          status: { not: 'PAGO' },
        },
        select: { cliente_id: true },
      });
      contas.forEach((c: any) => {
        if (c.cliente_id) comPendencia.add(c.cliente_id);
      });
    }

    return lista.map((e: any) => {
      const clienteId = Number(e?.cliente_id ?? e?.venda?.cliente_id ?? 0);
      return { ...e, pendencia_financeira: clienteId > 0 && comPendencia.has(clienteId) };
    });
  }

  /** Lista clientes/vendas com montagem concluída (para criar pós-venda como tarefa avulsa). */
  async findMontagemConcluida() {
    const include: any = {
      cliente: true,
      venda: true,
    };
    const eventos = await this.prisma.agenda_fabrica.findMany({
      where: {
        categoria: { in: ['MONTAGEM_CLIENTE_AGENDADA', 'EM_MONTAGEM_CLIENTE', 'MONTAGEM_CLIENTE_FINALIZADA'] },
        status: 'CONCLUIDO',
        origem_fluxo: 'LOJA_VENDA',
        venda_id: { not: null },
      },
      include,
      orderBy: { alterado_em: 'desc' },
    });
    const porVenda = new Map<number, (typeof eventos)[0]>();
    for (const ev of eventos) {
      if (ev.venda_id && !porVenda.has(ev.venda_id)) {
        porVenda.set(ev.venda_id, ev);
      }
    }
    return Array.from(porVenda.values());
  }

  async findOneLoja(id: number) {
    return this.prisma.agenda_loja.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  /** Busca agenda loja com criado_por para verificação de permissão (usuário só altera o que criou). */
  async findOneLojaParaPermissao(id: number) {
    return this.prisma.agenda_loja.findUnique({
      where: { id },
      select: { id: true, criado_por_usuario_id: true },
    });
  }

  async findOneFabrica(id: number) {
    return this.prisma.agenda_fabrica.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  /** Busca agenda fábrica com criado_por para verificação de permissão (só criador ou admin altera). */
  async findOneFabricaParaPermissao(id: number) {
    return this.prisma.agenda_fabrica.findUnique({
      where: { id },
      select: { id: true, criado_por_usuario_id: true },
    });
  }

  /** @deprecated Use findOneLoja ou findOneFabrica */
  async findOne(_id: number) {
    return null;
  }

  async findByFuncionario(
    funcionarioId: number,
    setorDestino?: 'LOJA' | 'FABRICA',
  ) {
    const setor = setorDestino ?? 'LOJA';
    const where = {
      status: { not: 'CANCELADO' as const },
      equipe: { some: { funcionario_id: funcionarioId } },
    };
    if (setor === 'LOJA') {
      return this.prisma.agenda_loja.findMany({
        where,
        include: {
          cliente: true,
          fornecedor: true,
          apontamentos: true,
        },
        orderBy: { inicio_em: 'asc' },
      });
    }
    return this.prisma.agenda_fabrica.findMany({
      where,
      include: {
        cliente: true,
        fornecedor: true,
        plano_corte: true,
        apontamentos: true,
      },
      orderBy: { inicio_em: 'asc' },
    });
  }

  async update(
    id: number,
    dto: UpdateAgendaDto,
    opts?: { alteradoPorUsuarioId?: number; setorDestino?: 'LOJA' | 'FABRICA' },
  ) {
    const inLoja = await this.prisma.agenda_loja.findUnique({
      where: { id },
      include: { equipe: true, apontamentos: true },
    });
    const inFabrica = await this.prisma.agenda_fabrica.findUnique({
      where: { id },
      include: { equipe: true, apontamentos: true },
    });
    const setor: 'LOJA' | 'FABRICA' =
      opts?.setorDestino === 'FABRICA'
        ? (inFabrica ? 'FABRICA' : (null as any))
        : opts?.setorDestino === 'LOJA'
          ? (inLoja ? 'LOJA' : (null as any))
          : inLoja
            ? 'LOJA'
            : inFabrica
              ? 'FABRICA'
              : (null as any);
    const atual = setor === 'FABRICA' ? inFabrica : setor === 'LOJA' ? inLoja : inLoja ?? inFabrica;
    if (!atual) {
      throw new BadRequestException('Agendamento não encontrado');
    }

    const {
      equipe_ids,
      categoria,
      apontamentos,
      origem_fluxo,
      setor_destino,
      ambientes_selecionados: ambientesSelecionadosUpdate,
      ...dadosAgenda
    } = dto;
    const categoriaRef = categoria ?? (atual as any).categoria;
    const { status: clienteStatus } = this.categoriaToStatus(categoriaRef);

    const inicio = dto.inicio_em
      ? new Date(dto.inicio_em)
      : new Date(atual.inicio_em);
    const fim = dto.fim_em ? new Date(dto.fim_em) : new Date(atual.fim_em);
    this.validarPeriodo(inicio, fim);

    const clienteId = dto.cliente_id ?? atual.cliente_id ?? null;
    let fornecedorId = dto.fornecedor_id ?? atual.fornecedor_id ?? null;
    const planoCorteId =
      dto.plano_corte_id ?? (atual as any).plano_corte_id ?? null;

    if (planoCorteId && setor === 'FABRICA') {
      const plano = await this.prisma.plano_corte.findUnique({
        where: { id: planoCorteId },
        select: { fornecedor_id: true },
      });
      if (!plano) {
        throw new BadRequestException('Plano de Corte não encontrado');
      }
      fornecedorId = plano.fornecedor_id;
    }

    const vendaId = dto.venda_id ?? atual.venda_id ?? null;
    const { setorDestino: _sd, origemFluxo } = this.resolverSetorOrigem({
      setorDestinoInput: setor_destino ?? setor,
      origemFluxoInput: origem_fluxo,
      setorAtual: setor,
      origemAtual: (atual as any).origem_fluxo,
      planoCorteId,
      vendaId,
    });

    if (
      (atual as any).origem_fluxo &&
      String((atual as any).origem_fluxo).toUpperCase() !== 'TAREFA' &&
      origemFluxo === 'TAREFA'
    ) {
      throw new BadRequestException(
        'Edição inválida: não é permitido remover o vínculo de origem deste agendamento.',
      );
    }

    this.validarVinculosPorOrigem({
      origemFluxo,
      vendaId,
      planoCorteId: setor === 'FABRICA' ? planoCorteId : undefined,
      clienteId,
      fornecedorId,
    });

    if (setor === 'FABRICA' && vendaId) {
      await this.validarContratoVigenteParaFabrica(vendaId);
    }

    if (setor === 'FABRICA' && categoria !== undefined && categoria !== null) {
      const key = String(categoria).trim().toUpperCase();
      if (key && !PIPELINE_PRODUCAO_KEYS.includes(key)) {
        throw new BadRequestException(
          `Categoria de produção inválida. Use uma destas: ${PIPELINE_PRODUCAO_KEYS.join(', ')}`,
        );
      }
      if (key) {
        const validacao = validarTransicaoStatusProducao({
          atual: (atual as any).categoria ?? undefined,
          proximo: key,
        });
        if (!validacao.ok) {
          throw new BadRequestException(validacao.motivo);
        }
      }
    }

    const equipeIds = Array.isArray(equipe_ids)
      ? Array.from(new Set(equipe_ids.map(Number).filter(Boolean)))
      : (atual.equipe as any[]).map((e) => e.funcionario_id);

    const apontamentosParaConflito =
      Array.isArray(apontamentos) && apontamentos.length
        ? apontamentos
        : (atual.apontamentos as any[]).map((a) => ({
            funcionario_id: a.funcionario_id,
            inicio_em: a.inicio_em,
            fim_em: a.fim_em,
          }));

    return this.prisma.$transaction(async (tx) => {
      await this.validarConflitosHorario(tx, {
        agendaIdIgnorar: id,
        inicio,
        fim,
        equipeIds,
        apontamentos: apontamentosParaConflito,
        setor,
      });
      await this.validarPosVendaAposMontagem({
        tx,
        categoria: categoriaRef,
        vendaId,
        setor,
      });

      const alteradoPor = opts?.alteradoPorUsuarioId
        ? { alterado_por_usuario_id: opts.alteradoPorUsuarioId, alterado_em: new Date() }
        : {};
      const updateData: any = {
        ...dadosAgenda,
        cliente_id: clienteId,
        fornecedor_id: fornecedorId,
        categoria: categoria ?? (atual as any).categoria ?? null,
        origem_fluxo: origemFluxo,
        inicio_em: inicio,
        fim_em: fim,
        ...alteradoPor,
      };
      if (setor === 'FABRICA') {
        if (vendaId != null) updateData.venda_id = vendaId;
        if (clienteId != null) updateData.cliente_id = clienteId;
        // Ao editar evento "só painel" (ex.: AGENDAR_MEDIDA_FINA) com data/hora: usa constante do pipeline para aparecer no calendário
        const catAtual = String((atual as any).categoria || '').toUpperCase();
        const ehSomentePainel = (AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS as readonly string[]).includes(catAtual);
        if (ehSomentePainel && (dto.status === AGENDA_FABRICA_STATUS_AGENDADO || dto.inicio_em != null)) {
          updateData.status = AGENDA_FABRICA_STATUS_AGENDADO;
          updateData.categoria = 'MEDIDA_FINA';
          this.logger.log(`[Agenda Produção] update: evento ${id} ${catAtual} → MEDIDA_FINA (agendado), inicio_em=${dto.inicio_em}`);
        }
      }
      if (setor === 'FABRICA' && ambientesSelecionadosUpdate !== undefined) {
        updateData.ambientes_selecionados = Array.isArray(ambientesSelecionadosUpdate)
          ? ambientesSelecionadosUpdate
          : null;
      }

      let agendamento: any;
      if (setor === 'LOJA') {
        agendamento = await tx.agenda_loja.update({
          where: { id },
          data: updateData,
        });
      } else {
        agendamento = await tx.agenda_fabrica.update({
          where: { id },
          data: updateData,
        });
      }

      if (Array.isArray(equipe_ids)) {
        if (setor === 'LOJA') {
          await tx.agenda_loja_funcionarios.deleteMany({
            where: { agenda_loja_id: id },
          });
          if (equipeIds.length) {
            await tx.agenda_loja_funcionarios.createMany({
              data: equipeIds.map((funcionarioId) => ({
                agenda_loja_id: id,
                funcionario_id: funcionarioId,
              })),
            });
          }
        } else {
          await tx.agenda_fabrica_funcionarios.deleteMany({
            where: { agenda_fabrica_id: id },
          });
          if (equipeIds.length) {
            await tx.agenda_fabrica_funcionarios.createMany({
              data: equipeIds.map((funcionarioId) => ({
                agenda_fabrica_id: id,
                funcionario_id: funcionarioId,
              })),
            });
          }
        }
      }

      if (Array.isArray(apontamentos)) {
        const apontamentosDados = apontamentos.map((item) => ({
          funcionario_id: item.funcionario_id,
          inicio_em: new Date(item.inicio_em),
          fim_em: new Date(item.fim_em),
        }));
        if (setor === 'LOJA') {
          await tx.agenda_loja_apontamentos.deleteMany({
            where: { agenda_loja_id: id },
          });
          await tx.apontamento_producao.deleteMany({
            where: { agenda_loja_id: id },
          });
          if (apontamentosDados.length) {
            await tx.agenda_loja_apontamentos.createMany({
              data: apontamentosDados.map((a) => ({
                agenda_loja_id: id,
                funcionario_id: a.funcionario_id,
                inicio_em: a.inicio_em,
                fim_em: a.fim_em,
              })),
            });
            await this.syncApontamentosToProducao(tx, {
              agenda_loja_id: id,
              apontamentos: apontamentosDados,
              categoria: (agendamento as any)?.categoria ?? categoria ?? null,
              venda_id: vendaId ?? null,
            });
          }
        } else {
          await tx.agenda_fabrica_apontamentos.deleteMany({
            where: { agenda_fabrica_id: id },
          });
          await tx.apontamento_producao.deleteMany({
            where: { agenda_fabrica_id: id },
          });
          if (apontamentosDados.length) {
            await tx.agenda_fabrica_apontamentos.createMany({
              data: apontamentosDados.map((a) => ({
                agenda_fabrica_id: id,
                funcionario_id: a.funcionario_id,
                inicio_em: a.inicio_em,
                fim_em: a.fim_em,
              })),
            });
            await this.syncApontamentosToProducao(tx, {
              agenda_fabrica_id: id,
              apontamentos: apontamentosDados,
              categoria: (agendamento as any)?.categoria ?? categoria ?? null,
              venda_id: vendaId ?? null,
            });
          }
        }
      }

      const novoStatus = clienteStatus;
      // Agenda fábrica: ao editar evento "Aguardando medida fina" com data/hora, venda/cliente → Medida fina agendada
      const catKey = this.normalizarCategoriaKey(categoriaRef);
      const origemOk =
        !(atual as any).origem_fluxo ||
        String((atual as any).origem_fluxo).toUpperCase() === 'LOJA_VENDA' ||
        String(origemFluxo || '').toUpperCase() === 'LOJA_VENDA';
      const ehMedidaFinaAgendar =
        setor === 'FABRICA' &&
        !planoCorteId &&
        (catKey === 'AGENDAR_MEDIDA_FINA' || catKey === 'MEDIDA_FINA') &&
        origemOk;
      if (ehMedidaFinaAgendar && (vendaId || clienteId) && clienteStatus) {
        let atualizouVendaOuCliente = false;
        if (vendaId) {
          const venda = await tx.vendas.findUnique({
            where: { id: vendaId },
            select: { id: true, status: true },
          });
          if (
            venda &&
            validarTransicaoStatusCliente({
              atual: venda.status,
              proximo: clienteStatus,
            }).ok
          ) {
            await this.atualizarStatusVendaComValidacao(
              tx,
              vendaId,
              clienteStatus,
              'Agenda Produção: medida fina agendada',
            );
            atualizouVendaOuCliente = true;
          }
        }
        if (clienteId) {
          const cliente = await tx.cliente.findUnique({
            where: { id: clienteId },
            select: { id: true, status: true },
          });
          if (
            cliente &&
            validarTransicaoStatusCliente({
              atual: cliente.status,
              proximo: clienteStatus,
            }).ok
          ) {
            await this.atualizarStatusClienteComValidacao(
              tx,
              clienteId,
              clienteStatus,
              'Agenda Produção: medida fina agendada',
            );
            atualizouVendaOuCliente = true;
          }
        }
        if (atualizouVendaOuCliente && setor === 'FABRICA') {
          await tx.agenda_fabrica.update({
            where: { id },
            data: { categoria: 'MEDIDA_FINA' },
          });
        }
      }

      // Plano de corte é venda de fornecedor: não atualizar status da venda do cliente
      if (!planoCorteId) {
        if (origemFluxo === 'POS_VENDA' && novoStatus) {
          const origemAplicada: 'venda' | 'cliente' =
            vendaId && vendaId > 0 ? 'venda' : 'cliente';

          if (origemAplicada === 'venda' && vendaId) {
            const venda = await tx.vendas.findUnique({
              where: { id: vendaId },
              select: { status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({
                atual: venda.status,
                proximo: novoStatus,
              }).ok
            ) {
              await this.atualizarStatusVendaComValidacao(
                tx,
                vendaId,
                novoStatus,
                'Edição de agendamento (pós-venda)',
              );
            }
          } else if (clienteId) {
            const cliente = await tx.cliente.findUnique({
              where: { id: clienteId },
              select: { status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({
                atual: cliente.status,
                proximo: novoStatus,
              }).ok
            ) {
              await this.atualizarStatusClienteComValidacao(
                tx,
                clienteId,
                novoStatus,
                'Edição de agendamento (pós-venda)',
              );
            }
          }

          this.registrarAuditoriaStatusPosVenda({
            agendaId: id,
            vendaId,
            clienteId,
            statusAplicado: novoStatus,
            origemAplicada,
          });
          await this.persistirAuditoriaStatusPosVenda(tx, {
            agendaId: id,
            origemAplicada,
            setor,
          });
        } else {
          if (vendaId && novoStatus) {
            const venda = await tx.vendas.findUnique({
              where: { id: vendaId },
              select: { status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({
                atual: venda.status,
                proximo: novoStatus,
              }).ok
            ) {
              await this.atualizarStatusVendaComValidacao(
                tx,
                vendaId,
                novoStatus,
                'Edição de agendamento',
              );
            }
          }

          if (clienteId && clienteStatus) {
            const cliente = await tx.cliente.findUnique({
              where: { id: clienteId },
              select: { status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({
                atual: cliente.status,
                proximo: clienteStatus,
              }).ok
            ) {
              await this.atualizarStatusClienteComValidacao(
                tx,
                clienteId,
                clienteStatus,
                'Edição de agendamento',
              );
            }
          }

          if ((atual as any).status_source || (atual as any).status_aplicado_em) {
            if (setor === 'LOJA') {
              await tx.agenda_loja.update({
                where: { id },
                data: { status_source: null, status_aplicado_em: null },
              });
            } else {
              await tx.agenda_fabrica.update({
                where: { id },
                data: { status_source: null, status_aplicado_em: null },
              });
            }
          }
        }
      }

      if (planoCorteId) {
        await tx.plano_corte.update({
          where: { id: planoCorteId },
          data: { status: 'EM_ANDAMENTO' },
        });
      }

      return agendamento;
    });
  }

  async updateStatus(
    id: number,
    status: string,
    categoria?: string,
    opts?: { alteradoPorUsuarioId?: number; setorDestino?: 'LOJA' | 'FABRICA'; alteradoEm?: string; dataConclusao?: string },
  ) {
    const inLoja = await this.prisma.agenda_loja.findUnique({
      where: { id },
      select: { id: true },
    });
    const inFabrica = await this.prisma.agenda_fabrica.findUnique({
      where: { id },
      select: {
        id: true,
        plano_corte_id: true,
        categoria: true,
        venda_id: true,
        cliente_id: true,
        titulo: true,
        inicio_em: true,
        fim_em: true,
      },
    });
    const setor =
      opts?.setorDestino === 'FABRICA'
        ? (inFabrica ? 'FABRICA' : null)
        : opts?.setorDestino === 'LOJA'
          ? (inLoja ? 'LOJA' : null)
          : inLoja
            ? 'LOJA'
            : inFabrica
              ? 'FABRICA'
              : null;
    if (!setor) {
      throw new BadRequestException('Agendamento não encontrado');
    }
    if (setor === 'FABRICA' && categoria) {
      const validacao = validarTransicaoStatusProducao({
        atual: inFabrica?.categoria ?? undefined,
        proximo: categoria,
      });
      if (!validacao.ok) {
        throw new BadRequestException(validacao.motivo);
      }
    }
    const agora = new Date();
    // Ao concluir: usa alteradoEm do frontend (dia selecionado) ou agora. Evita evento "ficar" na data de início.
    const concluidoEm = opts?.alteradoEm ? new Date(opts.alteradoEm) : agora;
    const alteradoPor = opts?.alteradoPorUsuarioId
      ? { alterado_por_usuario_id: opts.alteradoPorUsuarioId, alterado_em: concluidoEm }
      : { alterado_em: concluidoEm };
    return this.prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = { status, ...alteradoPor };
      if (categoria) data.categoria = categoria;
      if (setor === 'LOJA') {
        const agendamento = await tx.agenda_loja.update({
          where: { id },
          data: data as any,
        });
        return agendamento;
      }
      // Ao concluir evento da fábrica não mexemos em inicio_em/fim_em – mantemos a janela agendada.
      // O frontend usa alterado_em (concluidoEm) para não estender visualmente o evento para dias seguintes.
      const agendamento = await tx.agenda_fabrica.update({
        where: { id },
        data: data as any,
      });
      if (status === 'CONCLUIDO' && inFabrica?.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: inFabrica.plano_corte_id },
          data: { status: 'PRODUCAO_FINALIZADA' },
        });
      }
      if (status === 'CONCLUIDO' && setor === 'FABRICA' && !inFabrica?.plano_corte_id) {
        const catKey = this.normalizarCategoriaKey(inFabrica?.categoria);
        const proximoStatusVenda = this.statusAoConcluirPorCategoria[catKey];
        let vendaId = inFabrica?.venda_id ?? undefined;
        let clienteId = inFabrica?.cliente_id ?? undefined;
        if (vendaId && !clienteId) {
          const v = await tx.vendas.findUnique({
            where: { id: vendaId },
            select: { cliente_id: true },
          });
          if (v?.cliente_id) clienteId = v.cliente_id;
        }
        if (proximoStatusVenda && (vendaId || clienteId)) {
          if (vendaId) {
            const venda = await tx.vendas.findUnique({
              where: { id: vendaId },
              select: { id: true, status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({ atual: venda.status, proximo: proximoStatusVenda }).ok &&
              String(venda.status || '').toUpperCase() !== proximoStatusVenda
            ) {
              await tx.vendas.update({
                where: { id: vendaId },
                data: { status: proximoStatusVenda },
              });
            }
          }
          if (clienteId) {
            const cliente = await tx.cliente.findUnique({
              where: { id: clienteId },
              select: { id: true, status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({ atual: cliente.status, proximo: proximoStatusVenda }).ok &&
              String(cliente.status || '').toUpperCase() !== proximoStatusVenda
            ) {
              await tx.cliente.update({
                where: { id: clienteId },
                data: { status: proximoStatusVenda },
              });
            }
          }
          // Próximo evento só: medida→projeto→produção→montagem. Pós-venda (garantia etc.) nunca é criado aqui – só pelo botão na agenda.
          if (catKey === 'MEDIDA_FINA' || catKey === 'AGENDAR_MEDIDA_FINA') {
            const dataCorte = getDataCorteContasReceber();
            const financeiroPendente =
              clienteId != null &&
              (await this.clienteTemRecebiveisVencidosPendentes(tx, clienteId, dataCorte));
            if (!financeiroPendente) {
              await this.criarEventoAguardandoProjetoTecnico(tx, {
                venda_id: vendaId,
                cliente_id: clienteId,
                dataConclusao: opts?.dataConclusao,
              });
            } else {
              this.logger.log(
                `[Agenda] Medição finalizada para cliente ${clienteId} mas Contas a Receber com parcela vencida não paga – não avança para Produção (aguardando financeiro).`,
              );
            }
          }
          if (catKey === 'PROJETO_TECNICO_EM_ANDAMENTO' || catKey === 'AGUARDANDO_PROJETO_TECNICO') {
            await this.criarEventoProducaoAgendada(tx, {
              venda_id: vendaId,
              cliente_id: clienteId,
              dataConclusao: opts?.dataConclusao,
            });
          }
          const categoriasProducaoQueCriamMontagem = [
            'PRODUCAO_EM_ANDAMENTO',
            'PRODUCAO_FINALIZADA',
            'PREPARACAO_TECNICA',
            'CORTE',
            'MONTAGEM_INTERNA',
            'ACABAMENTO',
            'CONFERENCIA_QUALIDADE',
          ];
          if (categoriasProducaoQueCriamMontagem.includes(catKey)) {
            const equipeConcluida = await tx.agenda_fabrica_funcionarios.findMany({
              where: { agenda_fabrica_id: id },
              select: { funcionario_id: true },
            });
            const equipeIds = equipeConcluida.map((e) => e.funcionario_id).filter((fid) => Number.isFinite(fid));
            await this.criarEventoMontagemAgendada(tx, {
              venda_id: vendaId,
              cliente_id: clienteId,
              equipe_ids: equipeIds.length ? equipeIds : undefined,
              dataConclusao: opts?.dataConclusao,
            });
          }
        }
      }
      return agendamento;
    });
  }

  async cancel(
    id: number,
    opts?: { alteradoPorUsuarioId?: number; setor?: 'LOJA' | 'FABRICA' },
  ) {
    const alteradoPor = opts?.alteradoPorUsuarioId
      ? { alterado_por_usuario_id: opts.alteradoPorUsuarioId, alterado_em: new Date() }
      : {};
    const setorForcado = opts?.setor;
    return this.prisma.$transaction(async (tx) => {
      let loja: { id: number; status: string | null; categoria: string | null; venda_id: number | null; cliente_id: number | null } | null = null;
      let fabrica: { id: number; status: string | null; categoria: string | null; venda_id: number | null; cliente_id: number | null; plano_corte_id: number | null } | null = null;
      if (setorForcado !== 'FABRICA') {
        loja = await tx.agenda_loja.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            categoria: true,
            venda_id: true,
            cliente_id: true,
          },
        });
      }
      if (setorForcado !== 'LOJA') {
        fabrica = await tx.agenda_fabrica.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            categoria: true,
            venda_id: true,
            cliente_id: true,
            plano_corte_id: true,
          },
        });
      }
      const agendamento = setorForcado === 'FABRICA' ? fabrica : setorForcado === 'LOJA' ? loja : loja ?? fabrica;
      const setor = setorForcado ?? (loja ? 'LOJA' : fabrica ? 'FABRICA' : null);
      if (!agendamento || !setor) {
        throw new BadRequestException('Agendamento não encontrado');
      }

      const categoriaKey = this.normalizarCategoriaKey(agendamento.categoria);
      const reversao = this.reversaoStatusPorCategoria[categoriaKey];
      const ehAgendaPlanoCorte = setor === 'FABRICA' && (agendamento as any).plano_corte_id;

      const alvosMesmoVinculo: Array<{
        venda_id?: number;
        cliente_id?: number;
      }> = [];
      if (agendamento.venda_id)
        alvosMesmoVinculo.push({ venda_id: agendamento.venda_id });
      if (agendamento.cliente_id)
        alvosMesmoVinculo.push({ cliente_id: agendamento.cliente_id });

      const existeOutroAgendamentoAtivo =
        alvosMesmoVinculo.length > 0
          ? setor === 'LOJA'
            ? await tx.agenda_loja.findFirst({
                where: {
                  id: { not: id },
                  status: { not: 'CANCELADO' },
                  categoria: agendamento.categoria || null,
                  OR: alvosMesmoVinculo,
                },
                select: { id: true },
              })
            : await tx.agenda_fabrica.findFirst({
                where: {
                  id: { not: id },
                  status: { not: 'CANCELADO' },
                  categoria: agendamento.categoria || null,
                  OR: alvosMesmoVinculo,
                },
                select: { id: true },
              })
          : null;

      // Apagar de verdade: apontamentos da timeline ligados a este agendamento e depois o agendamento
      if (setor === 'LOJA') {
        await tx.apontamento_producao.deleteMany({ where: { agenda_loja_id: id } });
        await tx.agenda_loja.delete({ where: { id } });
      } else {
        await tx.apontamento_producao.deleteMany({ where: { agenda_fabrica_id: id } });
        await tx.agenda_fabrica.delete({ where: { id } });
      }

      if (!reversao || ehAgendaPlanoCorte) return { id, deleted: true };

      if (!existeOutroAgendamentoAtivo && agendamento.venda_id) {
        const venda = await tx.vendas.findUnique({
          where: { id: agendamento.venda_id },
          select: { id: true, status: true },
        });
        if (
          venda &&
          String(venda.status || '').toUpperCase() === reversao.statusAplicado
        ) {
          await tx.vendas.update({
            where: { id: venda.id },
            data: { status: reversao.statusAnterior },
          });
        }
      }

      if (!existeOutroAgendamentoAtivo && agendamento.cliente_id) {
        const cliente = await tx.cliente.findUnique({
          where: { id: agendamento.cliente_id },
          select: { id: true, status: true },
        });
        if (
          cliente &&
          String(cliente.status || '').toUpperCase() === reversao.statusAplicado
        ) {
          await tx.cliente.update({
            where: { id: cliente.id },
            data: { status: reversao.statusAnterior },
          });
        }
      }

      return { id, deleted: true };
    });
  }

  /**
   * Apaga definitivamente do banco todos os agendamentos com status CANCELADO (limpa os que foram "excluídos" antes da exclusão real).
   */
  async purgeCancelados(setor: 'LOJA' | 'FABRICA'): Promise<{ deleted: number }> {
    return this.prisma.$transaction(async (tx) => {
      if (setor === 'LOJA') {
        const cancelados = await tx.agenda_loja.findMany({
          where: { status: 'CANCELADO' },
          select: { id: true },
        });
        const ids = cancelados.map((c) => c.id);
        if (ids.length === 0) return { deleted: 0 };
        await tx.apontamento_producao.deleteMany({
          where: { agenda_loja_id: { in: ids } },
        });
        const result = await tx.agenda_loja.deleteMany({
          where: { status: 'CANCELADO' },
        });
        return { deleted: result.count };
      }
      const cancelados = await tx.agenda_fabrica.findMany({
        where: { status: 'CANCELADO' },
        select: { id: true },
      });
      const ids = cancelados.map((c) => c.id);
      if (ids.length === 0) return { deleted: 0 };
      await tx.apontamento_producao.deleteMany({
        where: { agenda_fabrica_id: { in: ids } },
      });
      const result = await tx.agenda_fabrica.deleteMany({
        where: { status: 'CANCELADO' },
      });
      return { deleted: result.count };
    });
  }

  async enviarParaProducao(id: number) {
    const atual = await this.prisma.agenda_loja.findUnique({
      where: { id },
      include: { equipe: true },
    });

    if (!atual) {
      throw new BadRequestException(
        'Agendamento não encontrado ou já está na agenda da fábrica.',
      );
    }
    if (atual.status === 'CANCELADO') {
      throw new BadRequestException(
        'Não é possível enviar agendamento cancelado para produção.',
      );
    }

    const origemProducao = this.inferirOrigemFluxo(
      (atual as any).plano_corte_id,
      atual.venda_id,
    );

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.agenda_fabrica.create({
        data: {
          cliente_id: atual.cliente_id,
          fornecedor_id: atual.fornecedor_id,
          orcamento_id: atual.orcamento_id,
          venda_id: atual.venda_id,
          projeto_id: atual.projeto_id,
          titulo: atual.titulo,
          inicio_em: atual.inicio_em,
          fim_em: atual.fim_em,
          categoria: atual.categoria,
          origem_fluxo: origemProducao,
          status: atual.status,
          equipe: {
            create: (atual.equipe as any[]).map((e) => ({
              funcionario_id: e.funcionario_id,
            })),
          },
        },
        include: { equipe: true, venda: true, plano_corte: true },
      });
      await tx.agenda_loja.update({
        where: { id },
        data: { status: 'CANCELADO' },
      });
      return created;
    });
  }

  /** Status do cliente/venda ao concluir o agendamento por categoria (pipeline). */
  private readonly statusAoConcluirPorCategoria: Record<string, string> = {
    MEDIDA: 'MEDIDA_REALIZADA',
    AGENDAR_MEDIDA: 'MEDIDA_REALIZADA',
    APRESENTACAO: 'ORCAMENTO_APRESENTADO',
    AGENDAR_APRESENTACAO: 'ORCAMENTO_APRESENTADO',
    MEDIDA_FINA: 'MEDIDA_FINA_REALIZADA',
    AGENDAR_MEDIDA_FINA: 'MEDIDA_FINA_REALIZADA',
    PROJETO_TECNICO_EM_ANDAMENTO: 'PROJETO_TECNICO_CONCLUIDO',
    AGUARDANDO_PROJETO_TECNICO: 'PROJETO_TECNICO_CONCLUIDO',
    PRODUCAO_EM_ANDAMENTO: 'AGENDAR_MONTAGEM',
    PRODUCAO_FINALIZADA: 'AGENDAR_MONTAGEM',
    PREPARACAO_TECNICA: 'AGENDAR_MONTAGEM',
    CORTE: 'AGENDAR_MONTAGEM',
    MONTAGEM_INTERNA: 'AGENDAR_MONTAGEM',
    ACABAMENTO: 'AGENDAR_MONTAGEM',
    CONFERENCIA_QUALIDADE: 'AGENDAR_MONTAGEM',
    MONTAGEM_CLIENTE_AGENDADA: 'MONTAGEM_FINALIZADA',
    EM_MONTAGEM_CLIENTE: 'MONTAGEM_FINALIZADA',
  };

  /** Próximo status da venda após concluir projeto técnico (abre nova etapa Produção agendada). */
  private readonly statusAposProjetoTecnico = 'PRODUCAO_AGENDADA';

  /** Próximo status da venda após concluir produção (abre nova etapa Montagem). */
  private readonly statusAposProducao = 'AGENDAR_MONTAGEM';

  /** Data/hora de início para o próximo evento: usa data_conclusao (YYYY-MM-DD) do frontend quando informada. */
  private inicioFimProximoEvento(dataConclusao?: string): { inicio: Date; fim: Date } {
    if (dataConclusao && /^\d{4}-\d{2}-\d{2}$/.test(dataConclusao)) {
      const inicio = new Date(`${dataConclusao}T12:00:00.000Z`);
      const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
      return { inicio, fim };
    }
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
    return { inicio, fim };
  }

  /**
   * Verifica se o cliente possui alguma parcela em Contas a Receber com vencimento <= dataCorte não paga.
   * Usado para bloquear avanço automático para Produção quando a medição é finalizada.
   */
  private async clienteTemRecebiveisVencidosPendentes(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    clienteId: number,
    dataCorte: Date,
  ): Promise<boolean> {
    const conta = await tx.contas_receber.findFirst({
      where: {
        cliente_id: clienteId,
        vencimento_em: { lte: dataCorte },
        status: { not: 'PAGO' },
      },
      select: { id: true },
    });
    if (conta) return true;
    const titulo = await tx.titulos_financeiros.findFirst({
      where: {
        conta_receber_id: { not: null },
        conta_receber: { cliente_id: clienteId },
        vencimento_em: { lte: dataCorte },
        status: { not: 'PAGO' },
      },
      select: { id: true },
    });
    return !!titulo;
  }

  /**
   * Cria evento "Aguardando projeto técnico" e atualiza venda/cliente para AGUARDANDO_PROJETO_TECNICO.
   * Chamado ao concluir medida fina (igual ao fluxo quando contrato fica vigente).
   */
  private async criarEventoAguardandoProjetoTecnico(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    params: { venda_id?: number; cliente_id?: number; dataConclusao?: string },
  ) {
    const vendaId = params.venda_id ?? null;
    const clienteId = params.cliente_id ?? null;
    if (!vendaId && !clienteId) return;
    const titulo = vendaId
      ? `Aguardando projeto técnico - Venda #${vendaId}`
      : 'Aguardando projeto técnico';
    const { inicio, fim } = this.inicioFimProximoEvento(params.dataConclusao);
    await tx.agenda_fabrica.create({
      data: {
        titulo,
        inicio_em: inicio,
        fim_em: fim,
        categoria: 'AGUARDANDO_PROJETO_TECNICO',
        origem_fluxo: 'LOJA_VENDA',
        status: 'PENDENTE',
        venda_id: vendaId ?? undefined,
        cliente_id: clienteId ?? undefined,
      },
    });
    const proximoStatus = 'AGUARDANDO_PROJETO_TECNICO';
    if (vendaId) {
      const venda = await tx.vendas.findUnique({
        where: { id: vendaId },
        select: { id: true, status: true },
      });
      if (
        venda &&
        validarTransicaoStatusCliente({ atual: venda.status, proximo: proximoStatus }).ok &&
        String(venda.status || '').toUpperCase() !== proximoStatus
      ) {
        await tx.vendas.update({
          where: { id: vendaId },
          data: { status: proximoStatus },
        });
      }
    }
    if (clienteId) {
      const cliente = await tx.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, status: true },
      });
      if (
        cliente &&
        validarTransicaoStatusCliente({ atual: cliente.status, proximo: proximoStatus }).ok &&
        String(cliente.status || '').toUpperCase() !== proximoStatus
      ) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { status: proximoStatus },
        });
      }
    }
  }

  /**
   * Cria evento "Produção agendada" e atualiza venda/cliente para PRODUCAO_AGENDADA.
   * Chamado ao concluir projeto técnico (nova etapa aberta automaticamente).
   */
  private async criarEventoProducaoAgendada(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    params: { venda_id?: number; cliente_id?: number; dataConclusao?: string },
  ) {
    const vendaId = params.venda_id ?? null;
    const clienteId = params.cliente_id ?? null;
    if (!vendaId && !clienteId) return;
    const titulo = vendaId
      ? `Produção agendada - Venda #${vendaId}`
      : 'Produção agendada';
    const { inicio, fim } = this.inicioFimProximoEvento(params.dataConclusao);
    await tx.agenda_fabrica.create({
      data: {
        titulo,
        inicio_em: inicio,
        fim_em: fim,
        categoria: 'PRODUCAO_EM_ANDAMENTO',
        origem_fluxo: 'LOJA_VENDA',
        status: 'PENDENTE',
        venda_id: vendaId ?? undefined,
        cliente_id: clienteId ?? undefined,
      },
    });
    const proximoStatus = this.statusAposProjetoTecnico;
    if (vendaId) {
      const venda = await tx.vendas.findUnique({
        where: { id: vendaId },
        select: { id: true, status: true },
      });
      if (
        venda &&
        validarTransicaoStatusCliente({ atual: venda.status, proximo: proximoStatus }).ok &&
        String(venda.status || '').toUpperCase() !== proximoStatus
      ) {
        await tx.vendas.update({
          where: { id: vendaId },
          data: { status: proximoStatus },
        });
      }
    }
    if (clienteId) {
      const cliente = await tx.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, status: true },
      });
      if (
        cliente &&
        validarTransicaoStatusCliente({ atual: cliente.status, proximo: proximoStatus }).ok &&
        String(cliente.status || '').toUpperCase() !== proximoStatus
      ) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { status: proximoStatus },
        });
      }
    }
  }

  /**
   * Cria evento "Aguardando montagem" (MONTAGEM_CLIENTE_AGENDADA) e atualiza venda/cliente para AGENDAR_MONTAGEM.
   * Chamado apenas ao concluir produção. Pós-venda (garantia etc.) não é criado aqui – só pelo botão na agenda.
   */
  private async criarEventoMontagemAgendada(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    params: { venda_id?: number; cliente_id?: number; equipe_ids?: number[]; dataConclusao?: string },
  ) {
    const vendaId = params.venda_id ?? null;
    const clienteId = params.cliente_id ?? null;
    if (!vendaId && !clienteId) return;
    const titulo = vendaId
      ? `Aguardando montagem - Venda #${vendaId}`
      : 'Aguardando montagem';
    const { inicio, fim } = this.inicioFimProximoEvento(params.dataConclusao);
    const created = await tx.agenda_fabrica.create({
      data: {
        titulo,
        inicio_em: inicio,
        fim_em: fim,
        categoria: 'MONTAGEM_CLIENTE_AGENDADA',
        origem_fluxo: 'LOJA_VENDA',
        status: 'PENDENTE',
        venda_id: vendaId ?? undefined,
        cliente_id: clienteId ?? undefined,
      },
    });
    const equipeIds = Array.isArray(params.equipe_ids)
      ? params.equipe_ids.filter((fid) => Number.isFinite(fid))
      : [];
    if (equipeIds.length > 0) {
      await tx.agenda_fabrica_funcionarios.createMany({
        data: equipeIds.map((funcionario_id) => ({
          agenda_fabrica_id: created.id,
          funcionario_id,
        })),
      });
    }
    const proximoStatus = this.statusAposProducao;
    if (vendaId) {
      const venda = await tx.vendas.findUnique({
        where: { id: vendaId },
        select: { id: true, status: true },
      });
      if (
        venda &&
        validarTransicaoStatusCliente({ atual: venda.status, proximo: proximoStatus }).ok &&
        String(venda.status || '').toUpperCase() !== proximoStatus
      ) {
        await tx.vendas.update({
          where: { id: vendaId },
          data: { status: proximoStatus },
        });
      }
    }
    if (clienteId) {
      const cliente = await tx.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, status: true },
      });
      if (
        cliente &&
        validarTransicaoStatusCliente({ atual: cliente.status, proximo: proximoStatus }).ok &&
        String(cliente.status || '').toUpperCase() !== proximoStatus
      ) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { status: proximoStatus },
        });
      }
    }
  }

  /**
   * Job: inicia tarefas cujo horário de início já passou (PENDENTE -> EM_ANDAMENTO)
   * e conclui tarefas cujo horário de término já passou (EM_ANDAMENTO -> CONCLUIDO),
   * atualizando cliente/venda/plano_corte conforme o pipeline.
   */
  async processarAutomaticoPorHorario() {
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const [paraIniciarLoja, paraIniciarFabrica] = await Promise.all([
        tx.agenda_loja.findMany({
          where: { status: 'PENDENTE', inicio_em: { lte: now } },
          select: { id: true },
        }),
        tx.agenda_fabrica.findMany({
          where: { status: 'PENDENTE', inicio_em: { lte: now } },
          select: { id: true },
        }),
      ]);
      if (paraIniciarLoja.length) {
        await tx.agenda_loja.updateMany({
          where: { id: { in: paraIniciarLoja.map((a) => a.id) } },
          data: { status: 'EM_ANDAMENTO' },
        });
      }
      if (paraIniciarFabrica.length) {
        await tx.agenda_fabrica.updateMany({
          where: { id: { in: paraIniciarFabrica.map((a) => a.id) } },
          data: { status: 'EM_ANDAMENTO' },
        });
      }
      const totalIniciadas = paraIniciarLoja.length + paraIniciarFabrica.length;
      if (totalIniciadas) {
        this.logger.log(`[AUTO] Iniciadas ${totalIniciadas} tarefa(s).`);
      }

      const [paraConcluirLoja, paraConcluirFabrica] = await Promise.all([
        tx.agenda_loja.findMany({
          where: { status: 'EM_ANDAMENTO', fim_em: { lte: now } },
          select: {
            id: true,
            categoria: true,
            cliente_id: true,
            venda_id: true,
          },
        }),
        tx.agenda_fabrica.findMany({
          where: { status: 'EM_ANDAMENTO', fim_em: { lte: now } },
          select: {
            id: true,
            categoria: true,
            cliente_id: true,
            venda_id: true,
            plano_corte_id: true,
          },
        }),
      ]);

      for (const ag of paraConcluirLoja) {
        await tx.agenda_loja.update({
          where: { id: ag.id },
          data: { status: 'CONCLUIDO' },
        });
        const catKey = this.normalizarCategoriaKey(ag.categoria);
        const proximoStatus = this.statusAoConcluirPorCategoria[catKey];
        if (proximoStatus) {
          if (ag.venda_id) {
            const venda = await tx.vendas.findUnique({
              where: { id: ag.venda_id },
              select: { id: true, status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({
                atual: venda.status,
                proximo: proximoStatus,
              }).ok &&
              String(venda.status || '').toUpperCase() !== proximoStatus
            ) {
              await tx.vendas.update({
                where: { id: ag.venda_id },
                data: { status: proximoStatus },
              });
            }
          }
          if (ag.cliente_id) {
            const cliente = await tx.cliente.findUnique({
              where: { id: ag.cliente_id },
              select: { id: true, status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({
                atual: cliente.status,
                proximo: proximoStatus,
              }).ok &&
              String(cliente.status || '').toUpperCase() !== proximoStatus
            ) {
              await tx.cliente.update({
                where: { id: ag.cliente_id },
                data: { status: proximoStatus },
              });
            }
          }
        }
      }

      for (const ag of paraConcluirFabrica) {
        await tx.agenda_fabrica.update({
          where: { id: ag.id },
          data: { status: 'CONCLUIDO' },
        });
        if (ag.plano_corte_id) {
          await tx.plano_corte.update({
            where: { id: ag.plano_corte_id },
            data: { status: 'PRODUCAO_FINALIZADA' },
          });
        }
        // Plano de corte é venda de fornecedor: não atualizar status da venda do cliente
        const catKey = this.normalizarCategoriaKey(ag.categoria);
        const proximoStatus = !ag.plano_corte_id
          ? this.statusAoConcluirPorCategoria[catKey]
          : undefined;
        if (proximoStatus) {
          if (ag.venda_id) {
            const venda = await tx.vendas.findUnique({
              where: { id: ag.venda_id },
              select: { id: true, status: true },
            });
            if (
              venda &&
              validarTransicaoStatusCliente({
                atual: venda.status,
                proximo: proximoStatus,
              }).ok &&
              String(venda.status || '').toUpperCase() !== proximoStatus
            ) {
              await tx.vendas.update({
                where: { id: ag.venda_id },
                data: { status: proximoStatus },
              });
            }
          }
          if (ag.cliente_id) {
            const cliente = await tx.cliente.findUnique({
              where: { id: ag.cliente_id },
              select: { id: true, status: true },
            });
            if (
              cliente &&
              validarTransicaoStatusCliente({
                atual: cliente.status,
                proximo: proximoStatus,
              }).ok &&
              String(cliente.status || '').toUpperCase() !== proximoStatus
            ) {
              await tx.cliente.update({
                where: { id: ag.cliente_id },
                data: { status: proximoStatus },
              });
            }
          }
          if (catKey === 'MEDIDA_FINA' || catKey === 'AGENDAR_MEDIDA_FINA') {
            const clienteId =
              ag.cliente_id ??
              (ag.venda_id
                ? (await tx.vendas.findUnique({
                    where: { id: ag.venda_id },
                    select: { cliente_id: true },
                  }))?.cliente_id ?? null
                : null);
            const dataCorte = getDataCorteContasReceber();
            const financeiroPendente =
              clienteId != null &&
              (await this.clienteTemRecebiveisVencidosPendentes(tx, clienteId, dataCorte));
            if (!financeiroPendente) {
              await this.criarEventoAguardandoProjetoTecnico(tx, {
                venda_id: ag.venda_id ?? undefined,
                cliente_id: ag.cliente_id ?? undefined,
              });
            } else {
              this.logger.log(
                `[AUTO] Medição finalizada para cliente ${clienteId} mas Contas a Receber com parcela vencida não paga – não avança para Produção (aguardando financeiro).`,
              );
            }
          }
          if (catKey === 'PROJETO_TECNICO_EM_ANDAMENTO' || catKey === 'AGUARDANDO_PROJETO_TECNICO') {
            await this.criarEventoProducaoAgendada(tx, {
              venda_id: ag.venda_id ?? undefined,
              cliente_id: ag.cliente_id ?? undefined,
            });
          }
          if (catKey === 'PRODUCAO_FINALIZADA') {
            await this.criarEventoMontagemAgendada(tx, {
              venda_id: ag.venda_id ?? undefined,
              cliente_id: ag.cliente_id ?? undefined,
            });
          }
        }
      }
      const totalConcluidas =
        paraConcluirLoja.length + paraConcluirFabrica.length;
      if (totalConcluidas) {
        this.logger.log(`[AUTO] Concluídas ${totalConcluidas} tarefa(s).`);
      }
    });
  }
}
