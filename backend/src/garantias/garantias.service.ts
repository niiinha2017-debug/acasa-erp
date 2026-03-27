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

@Injectable()
export class GarantiasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly custosEstruturaService: CustosEstruturaService,
    private readonly financeiroService: FinanceiroService,
  ) {}

  private readonly defaultInclude = {
    cliente: { select: { id: true, nome_completo: true, whatsapp: true, telefone: true, email: true, cidade: true, estado: true } },
    venda: { select: { id: true, status: true, valor_vendido: true, data_venda: true } },
    funcionario_responsavel: { select: { id: true, nome: true, cargo: true, whatsapp: true } },
    agendamentos: {
      select: {
        id: true,
        titulo: true,
        inicio_em: true,
        fim_em: true,
        status: true,
        subetapa: true,
        equipe: {
          include: {
            funcionario: {
              select: { id: true, nome: true, custo_hora: true },
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

  private async calcularResumoPrevisto(params: {
    horasPrevistas?: number;
    inicioEm?: Date | null;
    fimEm?: Date | null;
    funcionarioIds?: number[];
    custoProdutos?: number;
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
      custo_fabrica_previsto: custoFabrica,
      custo_total_previsto: this.round2(custoProdutos + custoEquipe + custoFabrica),
      custo_hora_estrutura: this.round2(custoHoraEstrutura),
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
        horas_previstas: this.round2(Number(garantia.horas_previstas ?? 0)),
        custo_produtos: this.round2(Number(garantia.custo_produtos ?? 0)),
        custo_mao_obra_previsto: this.round2(Number(garantia.custo_mao_obra_previsto ?? 0)),
        custo_fabrica_previsto: this.round2(Number(garantia.custo_fabrica_previsto ?? 0)),
        custo_total_previsto: this.round2(Number(garantia.custo ?? 0)),
        valor_cobrado: this.round2(Number(garantia.valor_venda ?? 0)),
        horas_realizadas: this.round2(resumoReal.horas_realizadas),
        custo_mao_obra_real: this.round2(resumoReal.custo_mao_obra_real),
        custo_fabrica_real: this.round2(custoFabricaReal),
        custo_total_real: this.round2(
          Number(garantia.custo_produtos ?? 0) + resumoReal.custo_mao_obra_real + custoFabricaReal,
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
    const valorVenda = this.parseMoney(dto.valor_venda);

    const garantia = await this.prisma.garantias.create({
      data: {
        cliente_id: dto.cliente_id,
        venda_id: dto.venda_id || null,
        funcionario_responsavel_id: dto.funcionario_responsavel_id || null,
        tipo: dto.tipo || 'GARANTIA',
        titulo: dto.titulo,
        descricao: dto.descricao || null,
        processo: dto.processo || null,
        horas_previstas: resumoPrevisto.horas_previstas.toFixed(2),
        custo_produtos: resumoPrevisto.custo_produtos.toFixed(2),
        custo_mao_obra_previsto: resumoPrevisto.custo_mao_obra_previsto.toFixed(2),
        custo_fabrica_previsto: resumoPrevisto.custo_fabrica_previsto.toFixed(2),
        custo: custo.toFixed(2),
        valor_venda: valorVenda.toFixed(2),
        data_previsao: dataPrevisao,
        observacoes: dto.observacoes || null,
      },
      include: this.defaultInclude,
    });

    await this.sincronizarContaReceber(garantia.id, dto.cliente_id, valorVenda, dto.titulo, dataPrevisao, dto.tipo || 'GARANTIA');

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

    if (dto.valor_venda !== undefined) {
      data.valor_venda = this.parseMoney(dto.valor_venda).toFixed(2);
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
        status: 'PENDENTE',
        equipe: dto.funcionario_ids?.length
          ? {
              create: dto.funcionario_ids.map((fid) => ({
                funcionario_id: fid,
              })),
            }
          : undefined,
      },
      include: {
        equipe: { include: { funcionario: { select: { id: true, nome: true } } } },
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
}
