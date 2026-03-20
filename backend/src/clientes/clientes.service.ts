import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';
import { Prisma } from '@prisma/client';
import {
  PIPELINE_CLIENTE,
  normalizarStatusCliente,
  validarTransicaoStatusCliente,
} from '../shared/constantes/status-matrix';
import { getDataCorteContasReceber } from '../shared/constantes/status-matrix';
import { AgendaService } from '../agenda/agenda.service';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}
  private readonly statusClienteEncerrado =
    PIPELINE_CLIENTE.find(
      (s) => String(s.key || '').toUpperCase() === 'ENCERRADO',
    )?.key || 'ENCERRADO';

  /**
   * Regra automática:
   * Se cliente estiver em MEDIDA_AGENDADA e a data do agendamento de medida já passou,
   * promove para MEDIDA_REALIZADA.
   */
  private async aplicarStatusAutomaticoMedidaRealizada() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const candidatos = await this.prisma.cliente.findMany({
      where: {
        status: 'MEDIDA_AGENDADA',
        OR: [
          {
            agendamentos_loja: {
              some: {
                categoria: 'MEDIDA',
                inicio_em: { lt: hoje },
                status: { not: 'CANCELADO' },
              },
            },
          },
          {
            agendamentos_fabrica: {
              some: {
                categoria: 'MEDIDA',
                inicio_em: { lt: hoje },
                status: { not: 'CANCELADO' },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const ids = candidatos.map((c) => c.id);
    if (!ids.length) return;

    await this.prisma.cliente.updateMany({
      where: { id: { in: ids } },
      data: { status: 'MEDIDA_REALIZADA' },
    });
  }

  /** Retorna null para e-mail vazio/em branco; evita violar unique constraint (vários clientes sem e-mail = null). */
  private normalizarEmail(email: string | null | undefined): string | null {
    if (email == null) return null;
    const t = String(email).trim();
    return t === '' ? null : t;
  }

  async criar(
    dto: CriarClienteDto,
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null,
  ) {
    const statusInicialPipeline =
      PIPELINE_CLIENTE && PIPELINE_CLIENTE.length
        ? PIPELINE_CLIENTE[0].key
        : 'ATIVO';
    const statusDestino = dto.status
      ? normalizarStatusCliente(dto.status)
      : normalizarStatusCliente(statusInicialPipeline);

    const validacaoStatus = validarTransicaoStatusCliente({
      atual: null,
      proximo: statusDestino,
    });
    if (!validacaoStatus.ok) {
      throw new BadRequestException(
        `Criação de cliente: ${validacaoStatus.motivo}`,
      );
    }

    const emailCriar = this.normalizarEmail(dto.email);

    if (emailCriar) {
      const outro = await this.prisma.cliente.findFirst({
        where: { email: emailCriar },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException(
          'Já existe um cliente cadastrado com este e-mail. Use outro e-mail ou edite o cliente existente.',
        );
      }
    }

    const funcionarioId =
      usuario?.funcionario_id != null ? Number(usuario.funcionario_id) : null;
    const isAdmin = !!usuario?.is_admin;
    const vendedorResponsavelId =
      dto.vendedor_responsavel_id ?? (isAdmin ? null : funcionarioId);

    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          indicacao_id: dto.indicacao_id ?? null,
          indicacao_origem: dto.indicacao_origem ?? null,

          nome_completo: dto.nome_completo,
          razao_social: dto.razao_social ?? null,
          nome_fantasia: dto.nome_fantasia ?? null,

          data_nascimento: dto.data_nascimento
            ? new Date(dto.data_nascimento)
            : null,

          cpf: dto.cpf ?? null,
          rg: dto.rg ?? null,
          cnpj: dto.cnpj ?? null,
          ie: dto.ie ?? null,

          telefone: dto.telefone ?? null,
          whatsapp: dto.whatsapp ?? null,
          email: emailCriar,

          estado_civil: dto.estado_civil ?? null,
          nome_conjuge:
            dto.estado_civil === 'CASADO' ? (dto.nome_conjuge ?? null) : null,

          cep: dto.cep ?? null,
          endereco: dto.endereco ?? null,
          numero: dto.numero ?? null,
          complemento: dto.complemento ?? null,
          bairro: dto.bairro ?? null,
          cidade: dto.cidade ?? null,
          estado: dto.estado ?? null,

          status: statusDestino,

          enviar_aniversario_email: dto.enviar_aniversario_email ?? true,
          enviar_aniversario_whatsapp: dto.enviar_aniversario_whatsapp ?? false,

          profissao: dto.profissao ?? null,
          vendedor_responsavel_id: vendedorResponsavelId,
          situacao: dto.situacao ?? null,
        },
      });
      return cliente;
    });
  }

  /**
   * Lista clientes. Se o usuário for vendedor (tem funcionario_id e não é admin),
   * retorna apenas clientes em que ele é o vendedor responsável pelo cadastro.
   */
  async listar(usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null) {
    await this.aplicarStatusAutomaticoMedidaRealizada();

    const where: Prisma.ClienteWhereInput = {
      status: {
        notIn: ['INATIVO', this.statusClienteEncerrado],
      },
    };

    const funcionarioId = usuario?.funcionario_id != null ? Number(usuario.funcionario_id) : null;
    const isAdmin = !!usuario?.is_admin;
    if (funcionarioId != null && !isAdmin) {
      where.OR = [
        { vendedor_responsavel_id: funcionarioId },
        { vendedor_responsavel_id: null },
      ];
    }

    const rows = await this.prisma.cliente.findMany({
      where,
      orderBy: { nome_completo: 'asc' },
      include: {
        vendedor_responsavel: { select: { id: true, nome: true } },
      },
    });

    return rows;
  }

  /**
   * Datas da barra de progresso: primeira ocorrência CONCLUIDO por tipo (agenda loja + fabrica).
   * Usado na tela Progresso do cliente (status + data em cada fase).
   */
  async getDatasProgresso(clienteId: number): Promise<{
    data_medida_venda?: string;
    data_apresentacao?: string;
    data_medida_fina?: string;
  }> {
    const categoriasMedidaVenda = ['MEDIDA', 'AGENDAR_MEDIDA_VENDA'];
    const categoriasApresentacao = ['APRESENTACAO', 'AGENDAR_APRESENTACAO'];
    const categoriasMedidaFina = ['MEDIDA_FINA', 'AGENDAR_MEDIDA_FINA'];

    const eventos = await this.prisma.agenda_loja.findMany({
      where: {
        cliente_id: clienteId,
        status: 'CONCLUIDO',
        categoria: { in: [...categoriasMedidaVenda, ...categoriasApresentacao] },
      },
      select: { categoria: true, fim_em: true, status_aplicado_em: true },
      orderBy: { fim_em: 'asc' },
    });

    const eventosFabrica = await this.prisma.agenda_fabrica.findMany({
      where: {
        cliente_id: clienteId,
        status: 'CONCLUIDO',
        categoria: { in: categoriasMedidaFina },
      },
      select: { categoria: true, fim_em: true, status_aplicado_em: true },
      orderBy: { fim_em: 'asc' },
    });

    const dataOuAplicado = (e: { fim_em: Date; status_aplicado_em: Date | null }) =>
      (e.status_aplicado_em || e.fim_em).toISOString();

    const primeiro = <T extends { categoria: string | null }>(
      arr: T[],
      cats: string[],
    ): T | undefined =>
      arr.find((e) => e.categoria && cats.includes(e.categoria.toUpperCase()));

    const datas: Record<string, string> = {};
    const e1 = primeiro(eventos, categoriasMedidaVenda);
    if (e1) datas.data_medida_venda = dataOuAplicado(e1);
    const e2 = primeiro(eventos, categoriasApresentacao);
    if (e2) datas.data_apresentacao = dataOuAplicado(e2);
    const e3 = primeiro(eventosFabrica, categoriasMedidaFina);
    if (e3) datas.data_medida_fina = dataOuAplicado(e3);

    return datas;
  }

  /**
   * Se o usuário for vendedor (não admin, tem funcionario_id), só pode acessar cliente em que ele é o vendedor responsável.
   */
  private async assertVendedorAcessoCliente(
    clienteId: number,
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null,
  ) {
    const funcionarioId = usuario?.funcionario_id != null ? Number(usuario.funcionario_id) : null;
    if (funcionarioId == null || !!usuario?.is_admin) return;
    const c = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { vendedor_responsavel_id: true },
    });
    if (!c) return;
    if (c.vendedor_responsavel_id != null && c.vendedor_responsavel_id !== funcionarioId) {
      throw new ForbiddenException('Você só pode acessar clientes dos quais é o vendedor responsável.');
    }
  }

  async buscarPorId(id: number, usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null) {
    await this.aplicarStatusAutomaticoMedidaRealizada();
    await this.assertVendedorAcessoCliente(id, usuario);
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    const datas_progresso = await this.getDatasProgresso(id);
    return { ...cliente, datas_progresso };
  }

  async atualizar(
    id: number,
    dto: AtualizarClienteDto,
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null,
  ) {
    await this.assertVendedorAcessoCliente(id, usuario);
    const atual = await this.buscarPorId(id, usuario);

    let statusAtualizado: string | undefined = undefined;
    if (dto.status !== undefined) {
      const destino = normalizarStatusCliente(dto.status);
      const validacaoStatus = validarTransicaoStatusCliente({
        atual: atual.status,
        proximo: destino,
      });
      if (!validacaoStatus.ok) {
        throw new BadRequestException(
          `Atualização de cliente: ${validacaoStatus.motivo}`,
        );
      }
      statusAtualizado = destino;
    }

    const cpfNorm =
      dto.cpf !== undefined && dto.cpf !== null && String(dto.cpf).trim() !== ''
        ? String(dto.cpf).trim()
        : null;
    const cnpjNorm =
      dto.cnpj !== undefined &&
      dto.cnpj !== null &&
      String(dto.cnpj).trim() !== ''
        ? String(dto.cnpj).trim()
        : null;
    const emailNorm =
      dto.email !== undefined &&
      dto.email !== null &&
      String(dto.email).trim() !== ''
        ? String(dto.email).trim()
        : null;

    if (cpfNorm !== null) {
      const outro = await this.prisma.cliente.findFirst({
        where: { cpf: cpfNorm, id: { not: id } },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException('Outro cliente já possui este CPF.');
      }
    }
    if (cnpjNorm !== null) {
      const outro = await this.prisma.cliente.findFirst({
        where: { cnpj: cnpjNorm, id: { not: id } },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException('Outro cliente já possui este CNPJ.');
      }
    }
    if (emailNorm !== null) {
      const outro = await this.prisma.cliente.findFirst({
        where: { email: emailNorm, id: { not: id } },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException('Outro cliente já possui este e-mail.');
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data: {
        indicacao_id: dto.indicacao_id ?? undefined,
        indicacao_origem: dto.indicacao_origem ?? undefined,

        nome_completo: dto.nome_completo ?? undefined,
        razao_social: dto.razao_social ?? undefined,
        nome_fantasia: dto.nome_fantasia ?? undefined,

        data_nascimento: dto.data_nascimento
          ? new Date(dto.data_nascimento)
          : undefined,

        cpf: dto.cpf !== undefined ? (cpfNorm ?? null) : undefined,
        rg: dto.rg ?? undefined,
        cnpj: dto.cnpj !== undefined ? (cnpjNorm ?? null) : undefined,
        ie: dto.ie ?? undefined,

        telefone: dto.telefone ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        email: dto.email !== undefined ? (emailNorm ?? null) : undefined,

        estado_civil: dto.estado_civil ?? undefined,
        nome_conjuge:
          dto.estado_civil === undefined
            ? (dto.nome_conjuge ?? undefined)
            : dto.estado_civil === 'CASADO'
              ? (dto.nome_conjuge ?? null)
              : null,

        cep: dto.cep ?? undefined,
        endereco: dto.endereco ?? undefined,
        numero: dto.numero ?? undefined,
        complemento: dto.complemento ?? undefined,
        bairro: dto.bairro ?? undefined,
        cidade: dto.cidade ?? undefined,
        estado: dto.estado ?? undefined,

        status: statusAtualizado,

        enviar_aniversario_email: dto.enviar_aniversario_email ?? undefined,
        enviar_aniversario_whatsapp:
          dto.enviar_aniversario_whatsapp ?? undefined,

        profissao: dto.profissao ?? undefined,
        vendedor_responsavel_id: dto.vendedor_responsavel_id ?? undefined,
        situacao: dto.situacao ?? undefined,
      },
    });
  }

  async remover(id: number, usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null) {
    await this.assertVendedorAcessoCliente(id, usuario);
    await this.buscarPorId(id, usuario);
    try {
      await this.prisma.cliente.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        await this.prisma.$transaction(async (tx) => {
          const agendasLoja = await tx.agenda_loja.findMany({
            where: { cliente_id: id, status: { not: 'CANCELADO' } },
            select: {
              id: true,
              categoria: true,
              origem_fluxo: true,
              fluxo_tipo: true,
              macroetapa: true,
              subetapa: true,
              execucao_etapa: true,
            },
          });
          for (const agenda of agendasLoja) {
            await tx.agenda_loja.update({
              where: { id: agenda.id },
              data: {
                status: 'CANCELADO',
                ...this.agendaService.montarCamposStatusMatrixFromAtual({
                  categoria: agenda.categoria ?? null,
                  status: 'CANCELADO',
                  origemFluxo: agenda.origem_fluxo ?? null,
                  planoCorteId: null,
                  fluxoTipo: agenda.fluxo_tipo ?? null,
                  macroetapa: agenda.macroetapa ?? null,
                  subetapa: agenda.subetapa ?? null,
                  execucaoEtapa: agenda.execucao_etapa ?? null,
                }),
              },
            });
          }

          const agendasFabrica = await tx.agenda_fabrica.findMany({
            where: { cliente_id: id, status: { not: 'CANCELADO' } },
            select: {
              id: true,
              categoria: true,
              origem_fluxo: true,
              plano_corte_id: true,
              fluxo_tipo: true,
              macroetapa: true,
              subetapa: true,
              execucao_etapa: true,
            },
          });
          for (const agenda of agendasFabrica) {
            await tx.agenda_fabrica.update({
              where: { id: agenda.id },
              data: {
                status: 'CANCELADO',
                ...this.agendaService.montarCamposStatusMatrixFromAtual({
                  categoria: agenda.categoria ?? null,
                  status: 'CANCELADO',
                  origemFluxo: agenda.origem_fluxo ?? null,
                  planoCorteId: agenda.plano_corte_id ?? null,
                  fluxoTipo: agenda.fluxo_tipo ?? null,
                  macroetapa: agenda.macroetapa ?? null,
                  subetapa: agenda.subetapa ?? null,
                  execucaoEtapa: agenda.execucao_etapa ?? null,
                }),
              },
            });
          }

          await tx.contratos.updateMany({
            where: {
              cliente_id: id,
              status: { in: ['RASCUNHO', 'VIGENTE'] },
            },
            data: { status: 'ENCERRADO' },
          });

          await tx.cliente.update({
            where: { id },
            data: { status: this.statusClienteEncerrado },
          });
        });

        return { ok: true };
      }
      throw e;
    }
    return { ok: true };
  }

  async select(q?: string, usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null) {
    await this.aplicarStatusAutomaticoMedidaRealizada();
    const termo = String(q || '').trim();

    const funcionarioId = usuario?.funcionario_id != null ? Number(usuario.funcionario_id) : null;
    const isAdmin = !!usuario?.is_admin;
    const soVendedor = funcionarioId != null && !isAdmin;

    const rows = await this.prisma.cliente.findMany({
      where: {
        AND: [
          {
            status: { notIn: ['INATIVO', this.statusClienteEncerrado] },
          },
          ...(soVendedor
            ? [
                {
                  OR: [
                    { vendedor_responsavel_id: funcionarioId },
                    { vendedor_responsavel_id: null },
                  ],
                },
              ]
            : []),
          ...(termo
            ? [
                {
                  OR: [
                    { nome_completo: { contains: termo } },
                    { razao_social: { contains: termo } },
                    { cpf: { contains: termo } },
                    { cnpj: { contains: termo } },
                  ],
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        nome_completo: true,
        razao_social: true,
      },
      orderBy: { nome_completo: 'asc' },
      take: 50,
    });

    return rows.map((c) => ({
      value: c.id,
      label: c.nome_completo || c.razao_social || `ID #${c.id}`,
    }));
  }

  async aniversariantesDoDia(data: string, enviar?: 'email' | 'whatsapp') {
    const dt = new Date(data);
    if (Number.isNaN(dt.getTime())) throw new Error('Data inválida');

    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const mmdd = `${mm}-${dd}`;

    const filtro =
      enviar === 'email'
        ? Prisma.sql`AND enviar_aniversario_email = 1 AND email IS NOT NULL AND email <> ''`
        : enviar === 'whatsapp'
          ? Prisma.sql`AND enviar_aniversario_whatsapp = 1 AND whatsapp IS NOT NULL AND whatsapp <> ''`
          : Prisma.sql``;

    return this.prisma.$queryRaw(
      Prisma.sql`
    SELECT *
    FROM clientes
    WHERE data_nascimento IS NOT NULL
      AND DATE_FORMAT(data_nascimento, '%m-%d') = ${mmdd}
    ${filtro}
    ORDER BY nome_completo ASC
  `,
    );
  }

  /**
   * Venda_ids com status AGENDAR_MEDIDA_FINA que possuem parcela vencida no Contas a Receber (origem_tipo=VENDA).
   * Usado no Fluxo de Clientes para exibir alerta e bloquear agendamento apenas no bloco daquela venda.
   */
  async getPendenciasAgendamento(): Promise<{ venda_ids: number[] }> {
    const vendas = await this.prisma.vendas.findMany({
      where: { status: 'AGENDAR_MEDIDA_FINA' },
      select: { id: true },
    });
    const vendaIds = vendas.map((v) => v.id).filter((id) => id > 0);
    if (vendaIds.length === 0) return { venda_ids: [] };

    const dataCorte = getDataCorteContasReceber();
    const contas = await this.prisma.contas_receber.findMany({
      where: {
        origem_tipo: 'VENDA',
        origem_id: { in: vendaIds },
        vencimento_em: { lte: dataCorte },
        status: { not: 'PAGO' },
      },
      select: { origem_id: true },
    });
    const idsComPendencia = [
      ...new Set(
        contas.map((c) => c.origem_id).filter((id): id is number => id != null && id > 0),
      ),
    ];
    return { venda_ids: idsComPendencia };
  }
}
