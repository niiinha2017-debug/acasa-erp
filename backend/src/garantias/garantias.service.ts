import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGarantiaDto } from './dto/create-garantia.dto';
import { UpdateGarantiaDto } from './dto/update-garantia.dto';
import { AgendarGarantiaDto } from './dto/agendar-garantia.dto';
import { CustosEstruturaService } from '../financeiro/custos-estrutura.service';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { EvolutionService } from '../evolution/evolution.service';
import { RotaCustoViagemService } from '../rota-custo-viagem/rota-custo-viagem.service';
import { FORMAS_PAGAMENTO } from '../shared/constantes/formas-pagamento';

@Injectable()
export class GarantiasService {
  private readonly formasPagamentoMap = new Map(
    (FORMAS_PAGAMENTO || []).map((item) => [String(item.key), String(item.label)]),
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly custosEstruturaService: CustosEstruturaService,
    private readonly financeiroService: FinanceiroService,
    private readonly evolution: EvolutionService,
    private readonly rotaCustoViagemService: RotaCustoViagemService,
  ) {}

  private readonly defaultInclude = {
    cliente: {
      select: {
        id: true,
        nome_completo: true,
        whatsapp: true,
        telefone: true,
        email: true,
        endereco: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        cep: true,
      },
    },
    venda: { select: { id: true, status: true, valor_vendido: true, data_venda: true } },
    funcionario_responsavel: { select: { id: true, nome: true, cargo: true, whatsapp: true } },
    agendamentos: {
      select: {
        id: true,
        titulo: true,
        inicio_em: true,
        fim_em: true,
        km_ida_prevista: true,
        km_volta_prevista: true,
        status: true,
        subetapa: true,
        equipe: {
          include: {
            funcionario: {
              select: { id: true, nome: true, custo_hora: true },
            },
          },
        },
        automoveis_planejados: {
          include: {
            automovel: {
              select: { id: true, descricao: true, placa: true, custo_km: true },
            },
          },
        },
        apontamentos_producao: {
          select: {
            id: true,
            data: true,
            horas: true,
            custo_calculado: true,
            funcionario: {
              select: { id: true, nome: true, custo_hora: true },
            },
          },
        },
      },
      orderBy: { inicio_em: 'desc' as const },
    },
  };

  private parseMoney(input: any): number {
    const s = String(input ?? '').trim();
    if (!s) return 0;
    const cleaned = s.replace(/[^\d,.-]/g, '');
    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned;
    return Number(normalized) || 0;
  }

  private parseDate(input?: string): Date | null {
    if (!input) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    }
    const m = String(input).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  private parseHours(input: any): number {
    const s = String(input ?? '').trim();
    if (!s) return 0;
    const normalized = s.replace(',', '.');
    return Number(normalized) || 0;
  }

  private round2(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private getFormaPagamentoLabel(chave?: string | null): string {
    const key = String(chave || '').trim().toUpperCase();
    if (!key) return '—';
    return this.formasPagamentoMap.get(key) || key;
  }

  private isTipoCobravel(tipo?: string | null): boolean {
    const tipoUpper = String(tipo || '').toUpperCase();
    return tipoUpper === 'ASSISTENCIA' || tipoUpper === 'MANUTENCAO';
  }

  private calcularSugestaoCobranca(tipo: string | null | undefined, resumoPrevisto: {
    custo_produtos: number;
    custo_total_previsto: number;
  }): number {
    return this.round2(resumoPrevisto.custo_total_previsto + resumoPrevisto.custo_produtos);
  }

  private resolverValorVenda(input: any, tipo: string | null | undefined, resumoPrevisto: {
    custo_produtos: number;
    custo_total_previsto: number;
  }): number {
    const informado = this.parseMoney(input);
    if (informado > 0) {
      return this.round2(informado);
    }

    return this.calcularSugestaoCobranca(tipo, resumoPrevisto);
  }

  private async calcularResumoPrevisto(params: {
    horasPrevistas?: number;
    inicioEm?: Date | null;
    fimEm?: Date | null;
    funcionarioIds?: number[];
    custoProdutos?: number;
    automovelIds?: number[];
    kmIdaPrevista?: number;
    kmVoltaPrevista?: number;
  }) {
    const horasPrevistas =
      params.horasPrevistas && params.horasPrevistas > 0
        ? params.horasPrevistas
        : params.inicioEm && params.fimEm
          ? this.round2((params.fimEm.getTime() - params.inicioEm.getTime()) / (1000 * 60 * 60))
          : 0;

    const funcionarioIds = [...new Set((params.funcionarioIds || []).filter(Boolean))];
    const funcionarios = funcionarioIds.length
      ? await this.prisma.funcionarios.findMany({
          where: { id: { in: funcionarioIds } },
          select: { id: true, nome: true, custo_hora: true },
        })
      : [];

    const custoEquipe = this.round2(
      funcionarios.reduce((total, funcionario) => total + (Number(funcionario.custo_hora ?? 0) * horasPrevistas), 0),
    );

    const automovelIds = [...new Set((params.automovelIds || []).filter(Boolean))];
    const automoveis = automovelIds.length
      ? await this.prisma.automoveis.findMany({
          where: { id: { in: automovelIds } },
          select: { id: true, descricao: true, placa: true, custo_km: true },
        })
      : [];
    const kmTotalPrevisto = this.round2(Number(params.kmIdaPrevista ?? 0) + Number(params.kmVoltaPrevista ?? 0));
    const custoVeiculoPrevisto = this.round2(
      automoveis.reduce((total, automovel) => total + (Number(automovel.custo_km ?? 0) * kmTotalPrevisto), 0),
    );

    const referencia = params.inicioEm || params.fimEm || new Date();
    const custoHoraEstrutura = await this.custosEstruturaService.getCustoHoraEstrutura(
      referencia.getMonth() + 1,
      referencia.getFullYear(),
    );
    const custoFabrica = this.round2(custoHoraEstrutura * horasPrevistas);
    const custoProdutos = this.round2(params.custoProdutos || 0);

    return {
      horas_previstas: this.round2(horasPrevistas),
      custo_produtos: custoProdutos,
      custo_mao_obra_previsto: custoEquipe,
      custo_veiculo_previsto: custoVeiculoPrevisto,
      custo_fabrica_previsto: custoFabrica,
      custo_total_previsto: this.round2(custoProdutos + custoEquipe + custoVeiculoPrevisto + custoFabrica),
      custo_hora_estrutura: this.round2(custoHoraEstrutura),
      km_total_previsto: kmTotalPrevisto,
      equipe_prevista: funcionarios.map((funcionario) => ({
        id: funcionario.id,
        nome: funcionario.nome,
        custo_hora: this.round2(Number(funcionario.custo_hora ?? 0)),
      })),
    };
  }

  private async enriquecerGarantia(garantia: any) {
    const agendamentos = Array.isArray(garantia?.agendamentos) ? garantia.agendamentos : [];

    const resumoReal = agendamentos.reduce(
      (acc, agendamento) => {
        const apontamentos = Array.isArray(agendamento?.apontamentos_producao)
          ? agendamento.apontamentos_producao
          : [];

        for (const apontamento of apontamentos) {
          const horas = Number(apontamento?.horas ?? 0) || 0;
          const custo = Number(apontamento?.custo_calculado ?? 0)
            || (horas * Number(apontamento?.funcionario?.custo_hora ?? 0));
          const dataRef = apontamento?.data ? new Date(apontamento.data) : null;

          acc.horas_realizadas += horas;
          acc.custo_mao_obra_real += custo;

          if (dataRef && !Number.isNaN(dataRef.getTime())) {
            acc.datasReferencia.push(dataRef);
          }
        }

        return acc;
      },
      {
        horas_realizadas: 0,
        custo_mao_obra_real: 0,
        datasReferencia: [] as Date[],
      },
    );

    const agendaIds = agendamentos.map((agendamento) => Number(agendamento?.id)).filter(Boolean);
    const dataInicioRotas = resumoReal.datasReferencia.length
      ? resumoReal.datasReferencia.reduce((min, dataRef) => (dataRef < min ? dataRef : min), resumoReal.datasReferencia[0])
      : null;
    const dataFimRotas = resumoReal.datasReferencia.length
      ? resumoReal.datasReferencia.reduce((max, dataRef) => (dataRef > max ? dataRef : max), resumoReal.datasReferencia[0])
      : null;
    const resumoRotas = agendaIds.length
      ? await this.rotaCustoViagemService.getResumoCustos({
          agenda_loja_ids: agendaIds,
          ...(dataInicioRotas ? { data_inicio: dataInicioRotas.toISOString() } : {}),
          ...(dataFimRotas ? { data_fim: dataFimRotas.toISOString().slice(0, 10) } : {}),
        })
      : { custo_total: 0 };
    const custoVeiculoReal = this.round2(Number((resumoRotas as any).custo_total ?? 0));

    let custoFabricaReal = 0;
    for (const dataRef of resumoReal.datasReferencia) {
      const custoHoraEstrutura = await this.custosEstruturaService.getCustoHoraEstrutura(
        dataRef.getMonth() + 1,
        dataRef.getFullYear(),
      );
      custoFabricaReal += custoHoraEstrutura;
    }
    if (resumoReal.horas_realizadas > 0 && resumoReal.datasReferencia.length > 0) {
      custoFabricaReal = this.round2(
        (custoFabricaReal / resumoReal.datasReferencia.length) * resumoReal.horas_realizadas,
      );
    } else {
      custoFabricaReal = 0;
    }

    return {
      ...garantia,
      resumo_financeiro: {
        tipo_cobravel: this.isTipoCobravel(garantia.tipo),
        forma_pagamento_chave: garantia.forma_pagamento_chave || null,
        forma_pagamento_label: this.getFormaPagamentoLabel(garantia.forma_pagamento_chave),
        quantidade_parcelas: Math.max(1, Number((garantia as any).quantidade_parcelas ?? 1) || 1),
        horas_previstas: this.round2(Number(garantia.horas_previstas ?? 0)),
        custo_produtos: this.round2(Number(garantia.custo_produtos ?? 0)),
        custo_mao_obra_previsto: this.round2(Number(garantia.custo_mao_obra_previsto ?? 0)),
        custo_fabrica_previsto: this.round2(Number(garantia.custo_fabrica_previsto ?? 0)),
        custo_total_previsto: this.round2(Number(garantia.custo ?? 0)),
        valor_cobrado: this.round2(Number(garantia.valor_venda ?? 0)),
        sugestao_cobranca: this.calcularSugestaoCobranca(garantia.tipo, {
          custo_produtos: this.round2(Number(garantia.custo_produtos ?? 0)),
          custo_total_previsto: this.round2(Number(garantia.custo ?? 0)),
        }),
        horas_realizadas: this.round2(resumoReal.horas_realizadas),
        custo_mao_obra_real: this.round2(resumoReal.custo_mao_obra_real),
        custo_veiculo_real: custoVeiculoReal,
        custo_fabrica_real: this.round2(custoFabricaReal),
        custo_total_real: this.round2(
          Number(garantia.custo_produtos ?? 0) + resumoReal.custo_mao_obra_real + custoVeiculoReal + custoFabricaReal,
        ),
      },
    };
  }

  async listar(filtros?: { status?: string; tipo?: string }) {
    const where: any = {};
    if (filtros?.status) where.status = filtros.status;
    if (filtros?.tipo) where.tipo = filtros.tipo;

    const garantias = await this.prisma.garantias.findMany({
      where,
      include: this.defaultInclude,
      orderBy: { criado_em: 'desc' },
    });
    return Promise.all(garantias.map((garantia) => this.enriquecerGarantia(garantia)));
  }

  async detalhar(id: number) {
    const garantia = await this.prisma.garantias.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
    if (!garantia) throw new NotFoundException('Garantia não encontrada');
    return this.enriquecerGarantia(garantia);
  }

  async criar(dto: CreateGarantiaDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    if (dto.venda_id) {
      const venda = await this.prisma.vendas.findUnique({ where: { id: dto.venda_id } });
      if (!venda) throw new NotFoundException('Venda não encontrada');
    }

    if (dto.funcionario_responsavel_id) {
      const func = await this.prisma.funcionarios.findUnique({ where: { id: dto.funcionario_responsavel_id } });
      if (!func) throw new NotFoundException('Funcionário não encontrado');
    }

    const dataPrevisao = this.parseDate(dto.data_previsao);
    const horasPrevistas = this.parseHours(dto.horas_previstas);
    const custoProdutos = this.parseMoney(dto.custo_produtos || dto.custo);
    const resumoPrevisto = await this.calcularResumoPrevisto({
      horasPrevistas,
      custoProdutos,
      funcionarioIds: dto.funcionario_responsavel_id ? [dto.funcionario_responsavel_id] : [],
    });
    const custo = this.parseMoney(dto.custo) || resumoPrevisto.custo_total_previsto;
    const tipoGarantia = dto.tipo || 'GARANTIA';
    const valorVenda = this.resolverValorVenda(dto.valor_venda, tipoGarantia, resumoPrevisto);

    const garantia = await this.prisma.garantias.create({
      data: {
        cliente_id: dto.cliente_id,
        venda_id: dto.venda_id || null,
        funcionario_responsavel_id: dto.funcionario_responsavel_id || null,
        tipo: tipoGarantia,
        titulo: dto.titulo,
        descricao: dto.descricao || null,
        processo: dto.processo || null,
        horas_previstas: resumoPrevisto.horas_previstas.toFixed(2),
        custo_produtos: resumoPrevisto.custo_produtos.toFixed(2),
        custo_mao_obra_previsto: resumoPrevisto.custo_mao_obra_previsto.toFixed(2),
        custo_fabrica_previsto: resumoPrevisto.custo_fabrica_previsto.toFixed(2),
        custo: custo.toFixed(2),
        valor_venda: valorVenda.toFixed(2),
        forma_pagamento_chave: dto.forma_pagamento_chave || null,
        quantidade_parcelas: Math.max(1, Number(dto.quantidade_parcelas) || 1),
        data_previsao: dataPrevisao,
        observacoes: dto.observacoes || null,
      },
      include: this.defaultInclude,
    });

    await this.sincronizarContaReceber(garantia.id, dto.cliente_id, valorVenda, dto.titulo, dataPrevisao, tipoGarantia);

    return this.enriquecerGarantia(garantia);
  }

  async atualizar(id: number, dto: UpdateGarantiaDto) {
    const existente = await this.prisma.garantias.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Garantia não encontrada');

    const data: any = {};

    if (dto.cliente_id !== undefined) data.cliente_id = dto.cliente_id;
    if (dto.venda_id !== undefined) data.venda_id = dto.venda_id || null;
    if (dto.funcionario_responsavel_id !== undefined) data.funcionario_responsavel_id = dto.funcionario_responsavel_id || null;
    if (dto.tipo !== undefined) data.tipo = dto.tipo;
    if (dto.titulo !== undefined) data.titulo = dto.titulo;
    if (dto.forma_pagamento_chave !== undefined) data.forma_pagamento_chave = dto.forma_pagamento_chave || null;
    if (dto.quantidade_parcelas !== undefined) data.quantidade_parcelas = Math.max(1, Number(dto.quantidade_parcelas) || 1);
    if (dto.descricao !== undefined) data.descricao = dto.descricao || null;
    if (dto.processo !== undefined) data.processo = dto.processo || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.observacoes !== undefined) data.observacoes = dto.observacoes || null;

    if (dto.data_previsao !== undefined) data.data_previsao = this.parseDate(dto.data_previsao);
    if (dto.data_conclusao !== undefined) data.data_conclusao = this.parseDate(dto.data_conclusao);

    // Ao concluir, marca automaticamente a data de conclusão
    if (dto.status === 'CONCLUIDA' && !data.data_conclusao) {
      data.data_conclusao = new Date();
    }

    const funcionarioIdsPrevistos = [
      dto.funcionario_responsavel_id !== undefined
        ? dto.funcionario_responsavel_id
        : existente.funcionario_responsavel_id,
    ].filter(Boolean) as number[];

    const horasPrevistasInformadas =
      dto.horas_previstas !== undefined
        ? this.parseHours(dto.horas_previstas)
        : Number((existente as any).horas_previstas ?? 0);
    const custoProdutosInformado =
      dto.custo_produtos !== undefined
        ? this.parseMoney(dto.custo_produtos)
        : Number((existente as any).custo_produtos ?? 0);

    const resumoPrevisto = await this.calcularResumoPrevisto({
      horasPrevistas: horasPrevistasInformadas,
      custoProdutos: custoProdutosInformado,
      funcionarioIds: funcionarioIdsPrevistos,
      inicioEm: data.data_previsao ?? undefined,
    });

    if (
      dto.horas_previstas !== undefined
      || dto.custo_produtos !== undefined
      || dto.custo !== undefined
      || dto.funcionario_responsavel_id !== undefined
    ) {
      data.horas_previstas = resumoPrevisto.horas_previstas.toFixed(2);
      data.custo_produtos = resumoPrevisto.custo_produtos.toFixed(2);
      data.custo_mao_obra_previsto = resumoPrevisto.custo_mao_obra_previsto.toFixed(2);
      data.custo_fabrica_previsto = resumoPrevisto.custo_fabrica_previsto.toFixed(2);
      data.custo = (dto.custo !== undefined
        ? this.parseMoney(dto.custo)
        : resumoPrevisto.custo_total_previsto).toFixed(2);
    } else if (dto.custo !== undefined) {
      data.custo = this.parseMoney(dto.custo).toFixed(2);
    }

    if (dto.valor_venda !== undefined || dto.tipo !== undefined) {
      const tipoFinalParaCobranca = dto.tipo !== undefined ? dto.tipo : existente.tipo;
      const resumoParaCobranca = {
        custo_produtos: this.round2(Number(data.custo_produtos ?? resumoPrevisto.custo_produtos ?? existente.custo_produtos ?? 0)),
        custo_total_previsto: this.round2(Number(data.custo ?? resumoPrevisto.custo_total_previsto ?? existente.custo ?? 0)),
      };
      data.valor_venda = this.resolverValorVenda(
        dto.valor_venda !== undefined ? dto.valor_venda : existente.valor_venda,
        tipoFinalParaCobranca,
        resumoParaCobranca,
      ).toFixed(2);
    }

    const garantia = await this.prisma.garantias.update({
      where: { id },
      data,
      include: this.defaultInclude,
    });

    const valorVendaFinal = Number(garantia.valor_venda ?? 0);
    const clienteIdFinal = (garantia as any).cliente_id;
    const tituloFinal = (garantia as any).titulo || '';
    const previsaoFinal = (garantia as any).data_previsao ?? null;
    const tipoFinal = (garantia as any).tipo || 'GARANTIA';
    await this.sincronizarContaReceber(id, clienteIdFinal, valorVendaFinal, tituloFinal, previsaoFinal, tipoFinal);

    return this.enriquecerGarantia(garantia);
  }

  /**
   * Cria ou atualiza a conta a receber vinculada à garantia.
   * Apenas ASSISTENCIA e MANUTENCAO geram cobrança — GARANTIA é custo da empresa.
   * Se valor_venda <= 0 ou tipo GARANTIA, cancela a conta existente (se houver).
   */
  private async sincronizarContaReceber(
    garantiaId: number,
    clienteId: number,
    valorVenda: number,
    titulo: string,
    dataPrevisao: Date | null,
    tipo: string,
  ) {
    const existente = await this.prisma.contas_receber.findFirst({
      where: { origem_tipo: 'GARANTIA', origem_id: garantiaId },
    });

    const tipoUpper = String(tipo || '').toUpperCase();
    const cobravel = tipoUpper === 'ASSISTENCIA' || tipoUpper === 'MANUTENCAO';
    const prefixo = tipoUpper === 'ASSISTENCIA' ? 'Assistência' : tipoUpper === 'MANUTENCAO' ? 'Manutenção' : 'Garantia';
    const descricao = `${prefixo} - ${titulo || `#${garantiaId}`}`;

    if (cobravel && valorVenda > 0) {
      if (existente) {
        await this.prisma.contas_receber.update({
          where: { id: existente.id },
          data: {
            cliente_id: clienteId,
            valor_original: valorVenda.toFixed(2),
            descricao,
            vencimento_em: dataPrevisao,
          },
        });
      } else {
        await this.financeiroService.criarContaReceber({
          cliente_id: clienteId,
          origem_tipo: 'GARANTIA',
          origem_id: garantiaId,
          descricao,
          valor_original: valorVenda.toFixed(2),
          status: 'EM_ABERTO',
          vencimento_em: dataPrevisao,
        });
      }
    } else if (existente && existente.status !== 'PAGO') {
      await this.prisma.contas_receber.update({
        where: { id: existente.id },
        data: { status: 'CANCELADO' },
      });
    }
  }

  async deletar(id: number) {
    const existente = await this.prisma.garantias.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Garantia não encontrada');

    // Cancela conta a receber vinculada (se não paga)
    const contaReceber = await this.prisma.contas_receber.findFirst({
      where: { origem_tipo: 'GARANTIA', origem_id: id },
    });
    if (contaReceber && contaReceber.status !== 'PAGO') {
      await this.prisma.contas_receber.update({
        where: { id: contaReceber.id },
        data: { status: 'CANCELADO' },
      });
    }

    return this.prisma.garantias.delete({ where: { id } });
  }

  /**
   * Cria um agendamento na agenda_loja vinculado a esta garantia
   */
  async agendar(id: number, dto: AgendarGarantiaDto) {
    const garantia = await this.prisma.garantias.findUnique({
      where: { id },
      include: { cliente: true },
    });
    if (!garantia) throw new NotFoundException('Garantia não encontrada');

    const inicioEm = new Date(dto.inicio_em);
    const fimEm = new Date(dto.fim_em);

    if (isNaN(inicioEm.getTime()) || isNaN(fimEm.getTime())) {
      throw new BadRequestException('Datas de início e fim inválidas');
    }

    const subetapa = dto.subetapa || (garantia.tipo === 'ASSISTENCIA' ? 'ASSISTENCIA' : 'GARANTIA');

    const garantiaResumo = await this.calcularResumoPrevisto({
      horasPrevistas: Number((garantia as any).horas_previstas ?? 0),
      inicioEm: inicioEm,
      fimEm: fimEm,
      funcionarioIds: dto.funcionario_ids || (garantia.funcionario_responsavel_id ? [garantia.funcionario_responsavel_id] : []),
      custoProdutos: Number((garantia as any).custo_produtos ?? 0),
      automovelIds: dto.automovel_ids || [],
      kmIdaPrevista: dto.km_ida_prevista,
      kmVoltaPrevista: dto.km_volta_prevista,
    });

    // Cria o agendamento na agenda_loja
    const agendamento = await this.prisma.agenda_loja.create({
      data: {
        cliente_id: garantia.cliente_id,
        venda_id: garantia.venda_id,
        garantia_id: garantia.id,
        titulo: dto.titulo,
        inicio_em: inicioEm,
        fim_em: fimEm,
        origem_fluxo: 'POS_VENDA',
        fluxo_tipo: 'OBRA_VIGENTE',
        macroetapa: 'POS_VENDA',
        subetapa,
        execucao_etapa: 'PENDENTE',
        status: 'PENDENTE',
        km_ida_prevista: dto.km_ida_prevista != null ? Number(dto.km_ida_prevista).toFixed(2) : undefined,
        km_volta_prevista: dto.km_volta_prevista != null ? Number(dto.km_volta_prevista).toFixed(2) : undefined,
        equipe: dto.funcionario_ids?.length
          ? {
              create: dto.funcionario_ids.map((fid) => ({
                funcionario_id: fid,
              })),
            }
          : undefined,
        automoveis_planejados: dto.automovel_ids?.length
          ? {
              create: dto.automovel_ids.map((automovelId) => ({
                automovel_id: automovelId,
              })),
            }
          : undefined,
      } as any,
      include: {
        equipe: { include: { funcionario: { select: { id: true, nome: true } } } },
        automoveis_planejados: { include: { automovel: { select: { id: true, descricao: true, placa: true, custo_km: true } } } },
      },
    });

    // Atualiza status da garantia para AGENDADA
    await this.prisma.garantias.update({
      where: { id },
      data: {
        status: 'AGENDADA',
        horas_previstas: garantiaResumo.horas_previstas.toFixed(2),
        custo_mao_obra_previsto: garantiaResumo.custo_mao_obra_previsto.toFixed(2),
        custo_fabrica_previsto: garantiaResumo.custo_fabrica_previsto.toFixed(2),
        custo: garantiaResumo.custo_total_previsto.toFixed(2),
      },
    });

    return agendamento;
  }

  async enviarWhatsapp(id: number): Promise<{ ok: boolean; message: string; destinatarios: string[] }> {
    const garantia = await this.prisma.garantias.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true, nome_completo: true, whatsapp: true, telefone: true,
            endereco: true, bairro: true, cidade: true, estado: true, cep: true,
          },
        },
        funcionario_responsavel: { select: { id: true, nome: true, cargo: true, whatsapp: true } },
        agendamentos: {
          select: {
            id: true, titulo: true, inicio_em: true, fim_em: true,
            equipe: {
              include: { funcionario: { select: { id: true, nome: true, whatsapp: true } } },
            },
          },
          orderBy: { inicio_em: 'asc' },
          take: 1,
        },
      },
    });
    if (!garantia) throw new NotFoundException('Garantia não encontrada');

    // Montar link do Google Maps
    const cli = garantia.cliente as any;
    const enderecoPartes = [
      cli?.endereco, cli?.bairro, cli?.cidade, cli?.estado, cli?.cep,
    ].filter(Boolean);
    const mapsLink = enderecoPartes.length
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoPartes.join(', '))}`
      : null;

    // Coletar todos os números a enviar (responsável + equipe do próximo agendamento)
    const numerosSet = new Set<string>();
    const respWhats = (garantia.funcionario_responsavel as any)?.whatsapp;
    if (respWhats) numerosSet.add(String(respWhats).replace(/\D/g, ''));
    for (const ag of (garantia as any).agendamentos || []) {
      for (const membro of ag.equipe || []) {
        const w = membro.funcionario?.whatsapp;
        if (w) numerosSet.add(String(w).replace(/\D/g, ''));
      }
    }
    const numeros = [...numerosSet].filter((n) => n.length >= 10);
    if (!numeros.length) {
      return { ok: false, message: 'Nenhum funcionário com WhatsApp cadastrado para esta OS.', destinatarios: [] };
    }

    // Montar mensagem
    const tipoLabel =
      garantia.tipo === 'ASSISTENCIA' ? 'Assistência' :
      garantia.tipo === 'MANUTENCAO' ? 'Manutenção' : 'Garantia';
    const fmtData = (d: any) =>
      d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    const fmtHora = (d: any) =>
      d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

    const proximoAg = (garantia as any).agendamentos?.[0];
    const dataAg = proximoAg ? `${fmtData(proximoAg.inicio_em)} às ${fmtHora(proximoAg.inicio_em)}` : fmtData((garantia as any).data_previsao);

    let msg = `📋 *OS #${garantia.id} — ${tipoLabel}*\n`;
    msg += `*${String(garantia.titulo || '')}*\n\n`;
    msg += `👤 *Cliente:* ${cli?.nome_completo || '—'}\n`;
    if (cli?.whatsapp || cli?.telefone) {
      msg += `📞 *Contato:* ${[cli?.whatsapp, cli?.telefone].filter(Boolean).join(' / ')}\n`;
    }
    if (enderecoPartes.length) {
      msg += `📍 *Endereço:* ${enderecoPartes.join(', ')}\n`;
    }
    if (mapsLink) {
      msg += `🗺️ *Google Maps:* ${mapsLink}\n`;
    }
    msg += `\n📅 *Data prevista:* ${dataAg}\n`;
    if (garantia.descricao) {
      msg += `\n📝 *Problema:* ${String(garantia.descricao).substring(0, 300)}${garantia.descricao.length > 300 ? '...' : ''}\n`;
    }
    if (garantia.processo) {
      msg += `\n🔧 *Serviço:* ${String(garantia.processo).substring(0, 300)}${garantia.processo.length > 300 ? '...' : ''}\n`;
    }
    msg += `\n_Sistema ACASA ERP_`;

    // Gerar PDF
    let pdfBase64: string | null = null;
    try {
      const pdfBuffer = await this.gerarPdf(id);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (e) {
      console.error('[GarantiasService] Falha ao gerar PDF para WhatsApp:', e);
    }

    const destinatariosEnviados: string[] = [];
    const erros: string[] = [];

    for (const numero of numeros) {
      try {
        // 1. Texto com info + Maps
        await this.evolution.sendMessage(numero, msg);

        // 2. PDF como documento (se gerado)
        if (pdfBase64) {
          await this.evolution.sendMedia(
            numero,
            pdfBase64,
            {
              mediatype: 'document',
              mimetype: 'application/pdf',
              fileName: `OS-${id}-${tipoLabel.toLowerCase().replace(' ', '-')}.pdf`,
              caption: `Ordem de Serviço #${id}`,
            },
          );
        }
        destinatariosEnviados.push(numero);
      } catch (e: any) {
        erros.push(`${numero}: ${e?.message || 'erro desconhecido'}`);
      }
    }

    if (!destinatariosEnviados.length) {
      return {
        ok: false,
        message: `Falha ao enviar para todos os destinatários. ${erros.join('; ')}`,
        destinatarios: [],
      };
    }

    const parcial = erros.length ? ` (${erros.length} falha(s): ${erros.join('; ')})` : '';
    return {
      ok: true,
      message: `OS enviada por WhatsApp para ${destinatariosEnviados.length} funcionário(s).${parcial}`,
      destinatarios: destinatariosEnviados,
    };
  }

  async gerarPdf(id: number): Promise<Buffer> {
    const garantia = await this.prisma.garantias.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true, nome_completo: true, whatsapp: true, telefone: true,
            email: true, endereco: true, bairro: true, cidade: true, estado: true, cep: true,
          },
        },
        venda: { select: { id: true, status: true, valor_vendido: true } },
        funcionario_responsavel: { select: { id: true, nome: true, cargo: true, whatsapp: true } },
        agendamentos: {
          select: {
            id: true, titulo: true, inicio_em: true, fim_em: true, status: true,
            equipe: {
              include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
            },
          },
          orderBy: { inicio_em: 'asc' },
        },
      },
    });
    if (!garantia) throw new NotFoundException('Garantia não encontrada');

    // Extrair produtos das observações (formato interno)
    const INICIO = '[PRODUTOS_GARANTIA]';
    const FIM = '[/PRODUTOS_GARANTIA]';
    const obsRaw = String((garantia as any).observacoes || '');
    const matchProd = obsRaw.match(/\[PRODUTOS_GARANTIA\]\n([\s\S]*?)\n\[\/PRODUTOS_GARANTIA\]/);
    const produtos: Array<{ nome: string; quantidade: number; unitario: number; marca: string; cor: string; medida: string }> = [];
    if (matchProd?.[1]) {
      for (const linha of matchProd[1].split('\n')) {
        if (!linha.startsWith('- ')) continue;
        const partes = linha.slice(2).split('|');
        produtos.push({
          nome: partes[1] || '',
          quantidade: Number(partes[2]) || 1,
          unitario: Number(partes[3]) || 0,
          marca: partes[4] || '',
          cor: partes[5] || '',
          medida: partes[6] || '',
        });
      }
    }

    const obsLimpa = obsRaw
      .replace(/\[PRODUTOS_GARANTIA\][\s\S]*?\[\/PRODUTOS_GARANTIA\]/g, '')
      .trim();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument = require('pdfkit') as typeof import('pdfkit');
    const { renderHeaderA4Png } = await import('../pdf/render-header-a4');

    const fmt = (v: number) =>
      Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtData = (d: any) =>
      d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    const fmtHora = (d: any) =>
      d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const marginX = 46;
      const pageW = doc.page.width - marginX * 2;
      const divider = (yPos: number) => {
        doc.moveTo(marginX, yPos).lineTo(marginX + pageW, yPos).lineWidth(0.5).strokeColor('#d1d5db').stroke();
      };

      // ─── CABEÇALHO ───────────────────────────────────────────────
      const headerBottom = renderHeaderA4Png(doc);
      let y = headerBottom + 16;

      // Faixa título OS
      doc.rect(marginX, y, pageW, 30).fill('#1e3a5f');
      const tipoLabel =
        garantia.tipo === 'ASSISTENCIA' ? 'ASSISTÊNCIA' :
        garantia.tipo === 'MANUTENCAO' ? 'MANUTENÇÃO' : 'GARANTIA';
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(13)
        .text(`ORDEM DE SERVIÇO — ${tipoLabel}`, marginX + 10, y + 9, { width: pageW * 0.65 });
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
        .text(`OS Nº ${garantia.id}`, marginX + pageW * 0.7, y + 12, { width: pageW * 0.28, align: 'right' });
      y += 38;

      // ─── DADOS GERAIS (grade 2 colunas) ──────────────────────────
      const col = pageW / 2;

      const campo = (label: string, valor: string, cx: number, cy: number, w = col - 12) => {
        doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5)
          .text(label.toUpperCase(), cx, cy, { width: w });
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9.5)
          .text(valor || '—', cx, cy + 9, { width: w });
      };

      const dataAbertura = fmtData((garantia as any).criado_em);
      campo('Título', String(garantia.titulo || ''), marginX, y, pageW);
      y += 28;

      campo('Cliente', String((garantia.cliente as any)?.nome_completo || ''), marginX, y);
      campo('Aberta em', dataAbertura, marginX + col, y);
      y += 28;

      const contato = [(garantia.cliente as any)?.whatsapp, (garantia.cliente as any)?.telefone]
        .filter(Boolean).join(' / ') || '—';
      campo('Contato cliente', contato, marginX, y);

      const dataPrevisao = fmtData((garantia as any).data_previsao);
      campo('Previsão de execução', dataPrevisao, marginX + col, y);
      y += 28;

      const cli = garantia.cliente as any;
      const enderecoLinha = [cli?.endereco, cli?.bairro].filter(Boolean).join(', ');
      const cidadeEstado = [cli?.cidade, cli?.estado].filter(Boolean).join(' — ');
      const cepLinha = cli?.cep ? `CEP: ${cli.cep}` : '';
      const enderecoCompleto = [enderecoLinha, cidadeEstado, cepLinha].filter(Boolean).join('  |  ') || '—';
      campo('Endereço de execução', enderecoCompleto, marginX, y, pageW);
      y += 28;

      const respNome = (garantia.funcionario_responsavel as any)?.nome || '—';
      const respCargo = (garantia.funcionario_responsavel as any)?.cargo || '';
      campo('Responsável', respCargo ? `${respNome} (${respCargo})` : respNome, marginX, y);

      const vendaRef = garantia.venda_id ? `Venda #${garantia.venda_id}` : '—';
      campo('Venda vinculada', vendaRef, marginX + col, y);
      y += 28;

      campo('Forma de pagamento', this.getFormaPagamentoLabel((garantia as any).forma_pagamento_chave), marginX, y);
      campo('Valor de referência', fmt(Number((garantia as any).valor_venda ?? 0)), marginX + col, y);
      y += 28;

      const quantidadeParcelas = Math.max(1, Number((garantia as any).quantidade_parcelas ?? 1) || 1);
      campo('Parcelas', `${quantidadeParcelas}x`, marginX, y);
      campo('Valor por parcela', fmt(Number((garantia as any).valor_venda ?? 0) / quantidadeParcelas), marginX + col, y);
      y += 28;

      divider(y); y += 12;

      // ─── DESCRIÇÃO DO PROBLEMA ────────────────────────────────────
      if (garantia.descricao) {
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9).text('DESCRIÇÃO DO PROBLEMA', marginX, y);
        y = doc.y + 4;
        doc.fillColor('#374151').font('Helvetica').fontSize(9)
          .text(String(garantia.descricao), marginX, y, { width: pageW });
        y = doc.y + 12;
        divider(y); y += 12;
      }

      // ─── SERVIÇO A EXECUTAR ───────────────────────────────────────
      if (garantia.processo) {
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9).text('SERVIÇO A EXECUTAR', marginX, y);
        y = doc.y + 4;
        doc.fillColor('#374151').font('Helvetica').fontSize(9)
          .text(String(garantia.processo), marginX, y, { width: pageW });
        y = doc.y + 12;
        divider(y); y += 12;
      }

      // ─── MATERIAIS / PRODUTOS ─────────────────────────────────────
      if (produtos.length > 0) {
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9).text('MATERIAIS NECESSÁRIOS', marginX, y);
        y = doc.y + 6;

        // cabeçalho da tabela
        doc.rect(marginX, y, pageW, 16).fill('#f3f4f6');
        const cw = [pageW * 0.40, pageW * 0.20, pageW * 0.15, pageW * 0.10, pageW * 0.15];
        const cx = [marginX, marginX + cw[0], marginX + cw[0] + cw[1], marginX + cw[0] + cw[1] + cw[2], marginX + cw[0] + cw[1] + cw[2] + cw[3]];
        const heads = ['Produto', 'Variação', 'Qtd.', 'Unit.', 'Total'];
        heads.forEach((h, i) => {
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5)
            .text(h, cx[i] + 2, y + 5, { width: cw[i] - 4, align: i >= 2 ? 'right' : 'left' });
        });
        y += 18;

        let totalMat = 0;
        for (const prod of produtos) {
          const total = prod.quantidade * prod.unitario;
          totalMat += total;
          const variacao = [prod.marca, prod.cor, prod.medida].filter(Boolean).join(' / ') || '—';
          const rowH = 16;
          doc.fillColor('#111827').font('Helvetica').fontSize(8.5).text(prod.nome, cx[0] + 2, y + 3, { width: cw[0] - 4 });
          doc.fillColor('#6b7280').font('Helvetica').fontSize(8).text(variacao, cx[1] + 2, y + 3, { width: cw[1] - 4 });
          doc.fillColor('#111827').font('Helvetica').fontSize(8.5).text(String(prod.quantidade), cx[2] + 2, y + 3, { width: cw[2] - 4, align: 'right' });
          doc.fillColor('#111827').font('Helvetica').fontSize(8.5).text(fmt(prod.unitario), cx[3] + 2, y + 3, { width: cw[3] - 4, align: 'right' });
          doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8.5).text(fmt(total), cx[4] + 2, y + 3, { width: cw[4] - 4, align: 'right' });
          y += rowH;
          doc.moveTo(marginX, y).lineTo(marginX + pageW, y).lineWidth(0.3).strokeColor('#e5e7eb').stroke();
        }

        // Total da linha
        y += 4;
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9)
          .text('Total materiais:', marginX, y, { width: pageW * 0.83, align: 'right' });
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9)
          .text(fmt(totalMat), marginX + pageW * 0.83, y, { width: pageW * 0.17, align: 'right' });
        y += 18;

        divider(y); y += 12;
      }

      // ─── AGENDAMENTOS ─────────────────────────────────────────────
      const agendamentos: any[] = (garantia as any).agendamentos || [];
      if (agendamentos.length > 0) {
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9).text('AGENDAMENTOS', marginX, y);
        y = doc.y + 6;

        for (const ag of agendamentos) {
          const dataAg = fmtData(ag.inicio_em);
          const horaIni = fmtHora(ag.inicio_em);
          const horaFim = fmtHora(ag.fim_em);
          const equipeNomes = (ag.equipe || []).map((e: any) => e.funcionario?.nome).filter(Boolean).join(', ') || '—';

          doc.rect(marginX, y, pageW, 14).fill('#f9fafb');
          doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8.5)
            .text(`${dataAg}  ${horaIni}–${horaFim}`, marginX + 4, y + 3, { width: pageW * 0.4 });
          doc.fillColor('#374151').font('Helvetica').fontSize(8)
            .text(`Equipe: ${equipeNomes}`, marginX + pageW * 0.42, y + 3, { width: pageW * 0.57 });
          y += 16;
        }
        y += 6;
        divider(y); y += 12;
      }

      // ─── OBSERVAÇÕES ──────────────────────────────────────────────
      if (obsLimpa) {
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9).text('OBSERVAÇÕES', marginX, y);
        y = doc.y + 4;
        doc.fillColor('#374151').font('Helvetica').fontSize(8.5)
          .text(obsLimpa, marginX, y, { width: pageW });
        y = doc.y + 12;
        divider(y); y += 12;
      }

      // ─── CAMPO DE ASSINATURA ──────────────────────────────────────
      const assinaturaY = Math.max(y + 20, doc.page.height - 130);
      divider(assinaturaY);
      const halfW = pageW / 2 - 20;
      const assinX1 = marginX + 20;
      const assinX2 = marginX + pageW / 2 + 20;

      doc.moveTo(assinX1, assinaturaY + 50).lineTo(assinX1 + halfW, assinaturaY + 50).lineWidth(0.5).strokeColor('#374151').stroke();
      doc.fillColor('#6b7280').font('Helvetica').fontSize(8)
        .text('Funcionário responsável / Data', assinX1, assinaturaY + 53, { width: halfW, align: 'center' });

      doc.moveTo(assinX2, assinaturaY + 50).lineTo(assinX2 + halfW, assinaturaY + 50).lineWidth(0.5).strokeColor('#374151').stroke();
      doc.fillColor('#6b7280').font('Helvetica').fontSize(8)
        .text('Aprovado por / Data', assinX2, assinaturaY + 53, { width: halfW, align: 'center' });

      // ─── RODAPÉ ───────────────────────────────────────────────────
      const pageBottom = doc.page.height - 28;
      doc.moveTo(marginX, pageBottom).lineTo(marginX + pageW, pageBottom).lineWidth(0.3).strokeColor('#d1d5db').stroke();
      const geradoEm = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5)
        .text(`OS #${garantia.id}  —  Gerado em ${geradoEm}`, marginX, pageBottom + 6, { width: pageW, align: 'center' });

      doc.end();
    });
  }
}
