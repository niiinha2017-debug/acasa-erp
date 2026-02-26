import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
import { PIPELINE_PRODUCAO } from '../shared/constantes/pipeline-producao';

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

    const montagemLoja = await params.tx.agenda_loja.findFirst({
      where: {
        venda_id: vendaId,
        categoria: {
          in: ['MONTAGEM_CLIENTE_FINALIZADA', 'MONTAGEM_FINALIZADA'],
        },
        status: 'CONCLUIDO',
      },
      select: { id: true },
    });
    const montagemFabrica = await params.tx.agenda_fabrica.findFirst({
      where: {
        venda_id: vendaId,
        categoria: {
          in: ['MONTAGEM_CLIENTE_FINALIZADA', 'MONTAGEM_FINALIZADA'],
        },
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

  async create(dto: CreateAgendaDto) {
    const {
      equipe_ids,
      categoria,
      apontamentos,
      origem_fluxo,
      setor_destino,
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

    const dataAgenda = {
      ...dadosAgenda,
      cliente_id: clienteId,
      fornecedor_id: fornecedorId,
      categoria: categoria || null,
      origem_fluxo: origemFluxo,
    };
    const isLoja = setorDestino === 'LOJA';

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

      const createPayload: any = {
        ...dataAgenda,
        equipe: {
          create: idsEquipe.map((id) => ({ funcionario_id: id })),
        },
      };
      if (!isLoja && dto.plano_corte_id) {
        createPayload.plano_corte_id = dto.plano_corte_id;
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
        if (isLoja) {
          await tx.agenda_loja_apontamentos.createMany({
            data: apontamentos.map((item: any) => ({
              agenda_loja_id: agendamento.id,
              funcionario_id: item.funcionario_id,
              inicio_em: new Date(item.inicio_em),
              fim_em: new Date(item.fim_em),
            })),
          });
        } else {
          await tx.agenda_fabrica_apontamentos.createMany({
            data: apontamentos.map((item: any) => ({
              agenda_fabrica_id: agendamento.id,
              funcionario_id: item.funcionario_id,
              inicio_em: new Date(item.inicio_em),
              fim_em: new Date(item.fim_em),
            })),
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
    const where: any = {
      inicio_em: {
        gte: inicio ? new Date(inicio) : undefined,
        lte: fim ? new Date(fim) : undefined,
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
      equipe: { include: { funcionario: true } },
      venda: true,
      apontamentos: true,
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
    return this.prisma.agenda_fabrica.findMany({
      where,
      include,
      orderBy: { inicio_em: 'asc' },
    });
  }

  async findOneLoja(id: number) {
    return this.prisma.agenda_loja.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async findOneFabrica(id: number) {
    return this.prisma.agenda_fabrica.findUnique({
      where: { id },
      select: { id: true },
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

  async update(id: number, dto: UpdateAgendaDto) {
    const inLoja = await this.prisma.agenda_loja.findUnique({
      where: { id },
      include: { equipe: true, apontamentos: true },
    });
    const inFabrica = await this.prisma.agenda_fabrica.findUnique({
      where: { id },
      include: { equipe: true, apontamentos: true },
    });
    const setor: 'LOJA' | 'FABRICA' = inLoja
      ? 'LOJA'
      : inFabrica
        ? 'FABRICA'
        : (null as any);
    const atual = inLoja ?? inFabrica;
    if (!atual) {
      throw new BadRequestException('Agendamento não encontrado');
    }

    const {
      equipe_ids,
      categoria,
      apontamentos,
      origem_fluxo,
      setor_destino,
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

      const updateData: any = {
        ...dadosAgenda,
        cliente_id: clienteId,
        fornecedor_id: fornecedorId,
        categoria: categoria ?? (atual as any).categoria ?? null,
        origem_fluxo: origemFluxo,
        inicio_em: inicio,
        fim_em: fim,
      };

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
        if (setor === 'LOJA') {
          await tx.agenda_loja_apontamentos.deleteMany({
            where: { agenda_loja_id: id },
          });
          if (apontamentos.length) {
            await tx.agenda_loja_apontamentos.createMany({
              data: apontamentos.map((item) => ({
                agenda_loja_id: id,
                funcionario_id: item.funcionario_id,
                inicio_em: new Date(item.inicio_em),
                fim_em: new Date(item.fim_em),
              })),
            });
          }
        } else {
          await tx.agenda_fabrica_apontamentos.deleteMany({
            where: { agenda_fabrica_id: id },
          });
          if (apontamentos.length) {
            await tx.agenda_fabrica_apontamentos.createMany({
              data: apontamentos.map((item) => ({
                agenda_fabrica_id: id,
                funcionario_id: item.funcionario_id,
                inicio_em: new Date(item.inicio_em),
                fim_em: new Date(item.fim_em),
              })),
            });
          }
        }
      }

      const novoStatus = clienteStatus;
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

      if (planoCorteId) {
        await tx.plano_corte.update({
          where: { id: planoCorteId },
          data: { status: 'EM_ANDAMENTO' },
        });
      }

      return agendamento;
    });
  }

  async updateStatus(id: number, status: string, categoria?: string) {
    const inLoja = await this.prisma.agenda_loja.findUnique({
      where: { id },
      select: { id: true },
    });
    const inFabrica = await this.prisma.agenda_fabrica.findUnique({
      where: { id },
      select: { id: true, plano_corte_id: true },
    });
    const setor = inLoja ? 'LOJA' : inFabrica ? 'FABRICA' : null;
    if (!setor) {
      throw new BadRequestException('Agendamento não encontrado');
    }
    return this.prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = { status };
      if (categoria) data.categoria = categoria;
      if (setor === 'LOJA') {
        const agendamento = await tx.agenda_loja.update({
          where: { id },
          data: data as any,
        });
        return agendamento;
      }
      const agendamento = await tx.agenda_fabrica.update({
        where: { id },
        data: data as any,
      });
      if (status === 'CONCLUIDO' && inFabrica?.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: inFabrica.plano_corte_id },
          data: { status: 'FINALIZADO' },
        });
      }
      return agendamento;
    });
  }

  async cancel(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const loja = await tx.agenda_loja.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          categoria: true,
          venda_id: true,
          cliente_id: true,
        },
      });
      const fabrica = await tx.agenda_fabrica.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          categoria: true,
          venda_id: true,
          cliente_id: true,
        },
      });
      const agendamento = loja ?? fabrica;
      const setor = loja ? 'LOJA' : fabrica ? 'FABRICA' : null;
      if (!agendamento || !setor) {
        throw new BadRequestException('Agendamento não encontrado');
      }
      const atualizado =
        setor === 'LOJA'
          ? await tx.agenda_loja.update({
              where: { id },
              data: { status: 'CANCELADO' },
            })
          : await tx.agenda_fabrica.update({
              where: { id },
              data: { status: 'CANCELADO' },
            });

      const categoriaKey = this.normalizarCategoriaKey(agendamento.categoria);
      const reversao = this.reversaoStatusPorCategoria[categoriaKey];
      if (!reversao) return atualizado;

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
      if (existeOutroAgendamentoAtivo) return atualizado;

      if (agendamento.venda_id) {
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

      if (agendamento.cliente_id) {
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

      return atualizado;
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
  };

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
            data: { status: 'FINALIZADO' },
          });
        }
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
      const totalConcluidas =
        paraConcluirLoja.length + paraConcluirFabrica.length;
      if (totalConcluidas) {
        this.logger.log(`[AUTO] Concluídas ${totalConcluidas} tarefa(s).`);
      }
    });
  }
}
