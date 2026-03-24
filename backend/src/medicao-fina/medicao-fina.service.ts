import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateMedicaoFinaDto } from './dto/create-medicao-fina.dto';
import { UpdateMedicaoFinaDto } from './dto/update-medicao-fina.dto';
import { FinalizarMedicaoTotemDto } from './dto/finalizar-medicao-totem.dto';
import { AgendaService } from '../agenda/agenda.service';
import { statusClienteAoConcluirSubetapa } from '../shared/constantes/status-matrix';

const STATUS_PROJETO_APOS_MEDIDA_FINA = 'PRONTO_PARA_PROJETO_CALCULO';
const STATUS_PROJETO_PRONTO_PRODUCAO = 'PRONTO_PARA_PRODUCAO';
const SUBETAPA_MEDIDA_FINA = 'MEDIDA_FINA';
const CATEGORIAS_MEDIDA_FINA = ['MEDIDA_FINA', 'AGENDAR_MEDIDA_FINA'] as const;
const STATUS_AGENDA_ENCERRADOS = ['CONCLUIDO', 'CANCELADO'] as const;
type AgendaSetor = 'LOJA' | 'FABRICA';
type AgendaReferencia = { id: number; setor: AgendaSetor };

@Injectable()
export class MedicaoFinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  /**
   * Seleção explícita para evitar quebrar quando existir divergência de schema/migration
   * em colunas opcionais mais novas no banco.
   */
  private readonly medicaoSelect = {
    id: true,
    projeto_id: true,
    nome_ambiente: true,
    altura_cm: true,
    largura_cm: true,
    profundidade_cm: true,
    altura_promob_cm: true,
    largura_promob_cm: true,
    profundidade_promob_cm: true,
    prumo_ok: true,
    esquadro_ok: true,
    interferencias: true,
    conferencia_eletrica_ok: true,
    conferencia_hidraulica_ok: true,
    conferencia_gas_ok: true,
    conferencia_alvenaria_ok: true,
    observacoes_montador: true,
    planta_baixa_json: true,
    concluida: true,
    criado_em: true,
    atualizado_em: true,
  } as const;

  /** Resolve projeto_id por id/código do projeto ou id do orçamento */
  async resolverProjetoId(q: string): Promise<{ projeto_id: number } | null> {
    const trim = String(q || '').trim();
    if (!trim) return null;
    const num = Number(trim.replace(/\D/g, ''));
    // 1) Número: pode ser ID do projeto ou ID do orçamento
    if (Number.isFinite(num) && num > 0) {
      const pById = await this.prisma.projetos.findUnique({
        where: { id: num },
        select: { id: true },
      });
      if (pById) return { projeto_id: pById.id };
      const pByOrcamento = await this.prisma.projetos.findFirst({
        where: { orcamento_id: num },
        select: { id: true },
      });
      if (pByOrcamento) return { projeto_id: pByOrcamento.id };
    }
    // 2) Código do projeto (ex: PROJ-2025-001)
    const byCode = await this.prisma.projetos.findFirst({
      where: { codigo: trim },
      select: { id: true },
    });
    return byCode ? { projeto_id: byCode.id } : null;
  }

  private toDecimal(value?: number | null) {
    return value != null ? new Decimal(value) : null;
  }

  private normalizeNomeAmbiente(nomeAmbiente?: string | null) {
    return String(nomeAmbiente || '').trim();
  }

  private normalizeInterferencias(interferencias?: string[] | null) {
    if (!Array.isArray(interferencias)) return null;
    const lista = [...new Set(
      interferencias
        .map((item) => String(item || '').trim().toUpperCase())
        .filter(Boolean),
    )];
    return lista.length ? lista : null;
  }

  private async assertProjetoExiste(projetoId: number) {
    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { id: true },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    return projeto;
  }

  private validarNomeAmbiente(nomeAmbiente: string) {
    const nome = this.normalizeNomeAmbiente(nomeAmbiente);
    if (!nome) throw new BadRequestException('Nome do ambiente é obrigatório.');
    return nome;
  }

  private async upsertMedicaoPorProjetoEAmbiente(
    projetoId: number,
    nomeAmbiente: string,
    data: Record<string, unknown>,
  ) {
    return this.prisma.medicao_fina.upsert({
      where: {
        projeto_id_nome_ambiente: { projeto_id: projetoId, nome_ambiente: nomeAmbiente },
      },
      create: {
        projeto_id: projetoId,
        nome_ambiente: nomeAmbiente,
        ...data,
      },
      update: data,
      select: this.medicaoSelect,
    });
  }

  private async processarConclusaoMedicao(
    medicao: { concluida: boolean; projeto_id: number },
    opts?: { agendaId?: number; setor?: AgendaSetor; statusSource?: string | null },
  ) {
    if (!medicao.concluida) return;
    await this.atualizarStatusProjetoQuandoConcluida(medicao.projeto_id, opts);
  }

  private async resolverProjetoDaAgendaTotem(
    agendaId: number,
    tipo: 'agenda_loja' | 'agenda_fabrica',
  ): Promise<{ projetoId: number; agendaRef: AgendaReferencia }> {
    const agenda = tipo === 'agenda_loja'
      ? await this.prisma.agenda_loja.findUnique({
          where: { id: agendaId },
          select: { id: true, projeto_id: true },
        })
      : await this.prisma.agenda_fabrica.findUnique({
          where: { id: agendaId },
          select: { id: true, projeto_id: true },
        });

    if (!agenda) {
      throw new NotFoundException('Tarefa da agenda não encontrada.');
    }
    if (agenda.projeto_id == null) {
      throw new BadRequestException('Projeto não vinculado a esta tarefa.');
    }

    return {
      projetoId: agenda.projeto_id,
      agendaRef: {
        id: agenda.id,
        setor: tipo === 'agenda_loja' ? 'LOJA' : 'FABRICA',
      },
    };
  }

  private buildCreateData(dto: CreateMedicaoFinaDto) {
    return {
      nome_ambiente: this.normalizeNomeAmbiente(dto.nome_ambiente),
      altura_cm: this.toDecimal(dto.altura_cm),
      largura_cm: this.toDecimal(dto.largura_cm),
      profundidade_cm: this.toDecimal(dto.profundidade_cm),
      altura_promob_cm: this.toDecimal(dto.altura_promob_cm),
      largura_promob_cm: this.toDecimal(dto.largura_promob_cm),
      profundidade_promob_cm: this.toDecimal(dto.profundidade_promob_cm),
      prumo_ok: dto.prumo_ok ?? null,
      esquadro_ok: dto.esquadro_ok ?? null,
      interferencias: this.normalizeInterferencias(dto.interferencias),
      conferencia_eletrica_ok: dto.conferencia_eletrica_ok ?? null,
      conferencia_hidraulica_ok: dto.conferencia_hidraulica_ok ?? null,
      conferencia_gas_ok: dto.conferencia_gas_ok ?? null,
      conferencia_alvenaria_ok: dto.conferencia_alvenaria_ok ?? null,
      observacoes_montador: dto.observacoes_montador?.trim() || null,
      planta_baixa_json: dto.planta_baixa_json ?? null,
      concluida: dto.concluida ?? false,
    };
  }

  private buildUpdateData(dto: UpdateMedicaoFinaDto) {
    const data: Record<string, unknown> = {};

    if (dto.altura_cm !== undefined) data.altura_cm = this.toDecimal(dto.altura_cm);
    if (dto.largura_cm !== undefined) data.largura_cm = this.toDecimal(dto.largura_cm);
    if (dto.profundidade_cm !== undefined) data.profundidade_cm = this.toDecimal(dto.profundidade_cm);
    if (dto.altura_promob_cm !== undefined) data.altura_promob_cm = this.toDecimal(dto.altura_promob_cm);
    if (dto.largura_promob_cm !== undefined) data.largura_promob_cm = this.toDecimal(dto.largura_promob_cm);
    if (dto.profundidade_promob_cm !== undefined) data.profundidade_promob_cm = this.toDecimal(dto.profundidade_promob_cm);
    if (dto.prumo_ok !== undefined) data.prumo_ok = dto.prumo_ok;
    if (dto.esquadro_ok !== undefined) data.esquadro_ok = dto.esquadro_ok;
    if (dto.interferencias !== undefined) data.interferencias = this.normalizeInterferencias(dto.interferencias);
    if (dto.conferencia_eletrica_ok !== undefined) data.conferencia_eletrica_ok = dto.conferencia_eletrica_ok;
    if (dto.conferencia_hidraulica_ok !== undefined) data.conferencia_hidraulica_ok = dto.conferencia_hidraulica_ok;
    if (dto.conferencia_gas_ok !== undefined) data.conferencia_gas_ok = dto.conferencia_gas_ok;
    if (dto.conferencia_alvenaria_ok !== undefined) data.conferencia_alvenaria_ok = dto.conferencia_alvenaria_ok;
    if (dto.observacoes_montador !== undefined) data.observacoes_montador = dto.observacoes_montador?.trim() || null;
    if (dto.planta_baixa_json !== undefined) data.planta_baixa_json = dto.planta_baixa_json;
    if (dto.concluida !== undefined) data.concluida = dto.concluida;

    return data;
  }

  private async buscarAgendaMedidaFinaAtiva(projetoId: number) {
    const where = {
      projeto_id: projetoId,
      status: { notIn: [...STATUS_AGENDA_ENCERRADOS] },
      OR: [
        { subetapa: SUBETAPA_MEDIDA_FINA },
        { categoria: { in: [...CATEGORIAS_MEDIDA_FINA] } },
      ],
    };

    const agendaFabrica = await this.prisma.agenda_fabrica.findFirst({
      where,
      select: { id: true },
      orderBy: { id: 'desc' },
    });
    if (agendaFabrica) {
      return { id: agendaFabrica.id, setor: 'FABRICA' as const };
    }

    const agendaLoja = await this.prisma.agenda_loja.findFirst({
      where,
      select: { id: true },
      orderBy: { id: 'desc' },
    });
    if (agendaLoja) {
      return { id: agendaLoja.id, setor: 'LOJA' as const };
    }

    return null;
  }

  private async concluirAgendaMedidaFina(params: {
    projetoId: number;
    agendaId?: number;
    setor?: AgendaSetor;
    statusSource?: string | null;
  }) {
    const agendaRef =
      params.agendaId != null && params.setor
        ? { id: params.agendaId, setor: params.setor }
        : await this.buscarAgendaMedidaFinaAtiva(params.projetoId);

    if (!agendaRef) return null;

    await this.agendaService.updateStatus(agendaRef.id, 'CONCLUIDO', {
      setorDestino: agendaRef.setor,
      subetapa: SUBETAPA_MEDIDA_FINA,
    });

    if (params.statusSource) {
      if (agendaRef.setor === 'LOJA') {
        await this.prisma.agenda_loja.update({
          where: { id: agendaRef.id },
          data: { status_source: params.statusSource, status_aplicado_em: new Date() },
        });
      } else {
        await this.prisma.agenda_fabrica.update({
          where: { id: agendaRef.id },
          data: { status_source: params.statusSource, status_aplicado_em: new Date() },
        });
      }
    }

    return agendaRef;
  }

  /**
   * Lista projetos do cliente com texto de origem (venda / orçamento).
   * "Projeto" aqui é a ficha técnica interna que liga cliente ↔ venda/orçamento — não é um menu separado no sistema.
   */
  async listarProjetosPorCliente(clienteId: number) {
    if (!clienteId || clienteId <= 0) return [];
    const list = await this.prisma.projetos.findMany({
      where: { cliente_id: clienteId },
      select: {
        id: true,
        codigo: true,
        status_atual: true,
        orcamento_id: true,
        venda_id: true,
        orcamento: { select: { id: true, criado_em: true } },
        venda: { select: { id: true, status: true, data_venda: true } },
      },
      orderBy: { id: 'desc' },
    });
    return list.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      status_atual: p.status_atual,
      orcamento_id: p.orcamento_id,
      venda_id: p.venda_id,
      origem_resumo: this.resumoOrigemProjetoParaUsuario(p),
    }));
  }

  private fmtDataCurta(d: Date | null | undefined): string {
    if (!d) return '';
    try {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  }

  /** Texto amigável: de onde veio esse registro (venda, orçamento ou só cliente). */
  private resumoOrigemProjetoParaUsuario(p: {
    venda_id: number | null;
    orcamento_id: number | null;
    venda?: { id: number; status: string; data_venda: Date } | null;
    orcamento?: { id: number; criado_em: Date } | null;
  }): string {
    if (p.venda_id != null) {
      const dataV = this.fmtDataCurta(p.venda?.data_venda);
      return dataV
        ? `Pedido fechado: venda nº ${p.venda_id} · ${dataV}`
        : `Pedido fechado: venda nº ${p.venda_id}`;
    }
    if (p.orcamento_id != null) {
      const dataO = this.fmtDataCurta(p.orcamento?.criado_em);
      return dataO
        ? `Ainda em orçamento: proposta nº ${p.orcamento_id} · ${dataO}`
        : `Ainda em orçamento: proposta nº ${p.orcamento_id}`;
    }
    return 'Ficha interna sem venda/orçamento vinculado (fale com o escritório)';
  }

  private medicaoOrcamentoComparativoInclude = {
    agenda_loja: {
      select: {
        id: true,
        projeto_id: true,
        inicio_em: true,
      },
    },
    ambientes: {
      orderBy: { nome_ambiente: 'asc' as const },
      include: {
        paredes: {
          orderBy: { nome: 'asc' as const },
        },
      },
    },
  };

  /** Medição para orçamento vinculada ao projeto (agenda com projeto_id). */
  private async findMedicaoOrcamentoPorProjetoAgenda(projetoId: number) {
    return this.prisma.medicao_orcamento.findFirst({
      where: { agenda_loja: { projeto_id: projetoId } },
      include: this.medicaoOrcamentoComparativoInclude,
      orderBy: { atualizado_em: 'desc' },
    });
  }

  /** Medição para orçamento ligada ao mesmo orçamento da ficha do projeto. */
  private async findMedicaoOrcamentoPorOrcamentoId(orcamentoId: number) {
    return this.prisma.medicao_orcamento.findFirst({
      where: { orcamento_id: orcamentoId },
      include: this.medicaoOrcamentoComparativoInclude,
      orderBy: { atualizado_em: 'desc' },
    });
  }

  /** Rascunho pré-medição já associado a agenda da loja deste projeto. */
  private async findPreMedicaoPorProjetoAgenda(projetoId: number) {
    return this.prisma.pre_medicao.findFirst({
      where: { agenda_loja: { projeto_id: projetoId } },
      include: {
        ambientes: { orderBy: { nome_ambiente: 'asc' as const } },
      },
      orderBy: { atualizado_em: 'desc' },
    });
  }

  private mapAmbienteComparativoMedicao(
    amb: {
      id: number;
      nome_ambiente: string;
      largura_m: unknown;
      pe_direito_m: unknown;
      profundidade_m: unknown;
      observacoes: string | null;
      medidas_json: string | null;
      paredes: Array<{
        id: number;
        nome: string;
        largura_m: unknown;
        pe_direito_m: unknown;
        profundidade_m: unknown;
        observacoes: string | null;
        medidas_json: string | null;
      }>;
    },
  ) {
    return {
      id: amb.id,
      nome_ambiente: amb.nome_ambiente,
      largura_m: amb.largura_m != null ? Number(amb.largura_m) : null,
      pe_direito_m: amb.pe_direito_m != null ? Number(amb.pe_direito_m) : null,
      profundidade_m: amb.profundidade_m != null ? Number(amb.profundidade_m) : null,
      observacoes: amb.observacoes ?? null,
      medidas_json: amb.medidas_json ?? null,
      paredes: (amb.paredes || []).map((parede) => ({
        id: parede.id,
        nome: parede.nome,
        largura_m: parede.largura_m != null ? Number(parede.largura_m) : null,
        pe_direito_m: parede.pe_direito_m != null ? Number(parede.pe_direito_m) : null,
        profundidade_m: parede.profundidade_m != null ? Number(parede.profundidade_m) : null,
        observacoes: parede.observacoes ?? null,
        medidas_json: parede.medidas_json ?? null,
      })),
    };
  }

  /**
   * Nomes dos ambientes para a medição fina: venda (se houver) + pré-orçamento / pré-medição.
   * Sem isso, só havia nomes após fechar venda e o painel “Referência pré-orçamento” não casava com o croqui.
   */
  async listarAmbientesPorProjeto(projetoId: number) {
    await this.assertProjetoExiste(projetoId);

    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { venda_id: true },
    });

    const porChave = new Map<string, string>();

    if (projeto?.venda_id) {
      const itens = await this.prisma.vendas_itens.findMany({
        where: { venda_id: projeto.venda_id },
        select: { nome_ambiente: true },
        distinct: ['nome_ambiente'],
        orderBy: { nome_ambiente: 'asc' },
      });
      for (const i of itens) {
        const n = String(i.nome_ambiente || '').trim();
        if (n) porChave.set(n.toLowerCase(), n);
      }
    }

    const comparativo = await this.getComparativoPreOrcamento(projetoId);
    for (const amb of comparativo.ambientes || []) {
      const n = String(amb?.nome_ambiente || '').trim();
      if (n) porChave.set(n.toLowerCase(), n);
    }

    return Array.from(porChave.values()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }

  /** Busca ou cria medição fina por projeto + ambiente */
  async findByProjetoAndAmbiente(projetoId: number, nomeAmbiente: string) {
    await this.assertProjetoExiste(projetoId);

    const nome = this.validarNomeAmbiente(nomeAmbiente);

    let medicao = await this.prisma.medicao_fina.findUnique({
      where: {
        projeto_id_nome_ambiente: { projeto_id: projetoId, nome_ambiente: nome },
      },
      select: this.medicaoSelect,
    });

    if (!medicao) {
      medicao = await this.prisma.medicao_fina.create({
        data: {
          projeto_id: projetoId,
          nome_ambiente: nome,
        },
        select: this.medicaoSelect,
      });
    }

    return this.toResponse(medicao);
  }

  /** Lista todas as medições finas de um projeto */
  async listarPorProjeto(projetoId: number) {
    const list = await this.prisma.medicao_fina.findMany({
      where: { projeto_id: projetoId },
      orderBy: { nome_ambiente: 'asc' },
      select: this.medicaoSelect,
    });
    return list.map((m) => this.toResponse(m));
  }

  /** Cria ou atualiza medição fina (upsert por projeto_id + nome_ambiente) */
  async salvar(dto: CreateMedicaoFinaDto) {
    await this.assertProjetoExiste(dto.projeto_id);

    const nome = this.validarNomeAmbiente(dto.nome_ambiente);

    const data = this.buildCreateData(dto);

    const medicao = await this.upsertMedicaoPorProjetoEAmbiente(dto.projeto_id, nome, data);

    await this.processarConclusaoMedicao(medicao);

    return this.toResponse(medicao);
  }

  /** Atualiza medição fina por id */
  async atualizar(id: number, dto: UpdateMedicaoFinaDto) {
    const existente = await this.prisma.medicao_fina.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existente) throw new NotFoundException('Medição fina não encontrada.');

    const data = this.buildUpdateData(dto);

    const medicao = await this.prisma.medicao_fina.update({
      where: { id },
      data,
      select: this.medicaoSelect,
    });

    await this.processarConclusaoMedicao(medicao);

    return this.toResponse(medicao);
  }

  /** Gatilho: ao marcar medição como concluída, atualiza status do projeto e conclui evento Medição Fina na agenda */
  private async atualizarStatusProjetoQuandoConcluida(
    projetoId: number,
    opts?: { agendaId?: number; setor?: AgendaSetor; statusSource?: string | null },
  ) {
    await this.prisma.projetos.update({
      where: { id: projetoId },
      data: { status_atual: STATUS_PROJETO_APOS_MEDIDA_FINA },
    });

    await this.concluirAgendaMedidaFina({
      projetoId,
      agendaId: opts?.agendaId,
      setor: opts?.setor,
      statusSource: opts?.statusSource ?? null,
    });
  }

  /** Totem: finaliza medição (medidas obrigatórias), atualiza agenda e timeline para "Medido - Aguardando Técnico" */
  async finalizarMedicaoTotem(dto: FinalizarMedicaoTotemDto) {
    const agendaRef = dto.tipo === 'agenda_loja'
      ? { id: dto.agenda_id, setor: 'LOJA' as const }
      : { id: dto.agenda_id, setor: 'FABRICA' as const };

    const projetoResolvido = dto.projeto_id == null
      ? await this.resolverProjetoDaAgendaTotem(dto.agenda_id, dto.tipo)
      : null;
    const projetoId = dto.projeto_id ?? projetoResolvido?.projetoId;
    if (projetoId == null) {
      throw new BadRequestException('Projeto não vinculado a esta tarefa.');
    }

    let nomeAmbiente = (dto.nome_ambiente || '').trim();
    if (!nomeAmbiente) {
      const ambientes = await this.listarAmbientesPorProjeto(projetoId);
      nomeAmbiente = ambientes[0] || 'Ambiente';
    }

    const larguraCm = dto.largura_mm / 10;
    const peDireitoCm = dto.pe_direito_mm / 10;
    const interferencias: string[] = dto.conferencia_ar_condicionado ? ['AR_CONDICIONADO'] : [];

    const dataMedicao = {
      largura_cm: new Decimal(larguraCm),
      altura_cm: new Decimal(peDireitoCm),
      conferencia_hidraulica_ok: dto.conferencia_agua ?? null,
      conferencia_eletrica_ok: dto.conferencia_luz ?? null,
      conferencia_gas_ok: dto.conferencia_gas ?? null,
      interferencias: interferencias.length ? interferencias : null,
      concluida: true,
    };

    const medicao = await this.upsertMedicaoPorProjetoEAmbiente(
      projetoId,
      nomeAmbiente,
      dataMedicao,
    );

    await this.processarConclusaoMedicao(medicao, {
      agendaId: agendaRef.id,
      setor: agendaRef.setor,
      statusSource: 'MEDIDO_AGUARDANDO_TECNICO',
    });

    return {
      ...this.toResponse(medicao),
      status_tarefa: 'CONCLUIDO',
      status_label: 'Medido - Aguardando Técnico',
      proximo_status_venda:
        statusClienteAoConcluirSubetapa({ subetapa: SUBETAPA_MEDIDA_FINA }) || null,
    };
  }

  private toResponse(m: any) {
    return {
      id: m.id,
      projeto_id: m.projeto_id,
      nome_ambiente: m.nome_ambiente,
      altura_cm: m.altura_cm != null ? Number(m.altura_cm) : null,
      largura_cm: m.largura_cm != null ? Number(m.largura_cm) : null,
      profundidade_cm: m.profundidade_cm != null ? Number(m.profundidade_cm) : null,
      altura_promob_cm: m.altura_promob_cm != null ? Number(m.altura_promob_cm) : null,
      largura_promob_cm: m.largura_promob_cm != null ? Number(m.largura_promob_cm) : null,
      profundidade_promob_cm: m.profundidade_promob_cm != null ? Number(m.profundidade_promob_cm) : null,
      prumo_ok: m.prumo_ok,
      esquadro_ok: m.esquadro_ok,
      interferencias: (m.interferencias as string[]) ?? [],
      conferencia_eletrica_ok: m.conferencia_eletrica_ok ?? null,
      conferencia_hidraulica_ok: m.conferencia_hidraulica_ok ?? null,
      conferencia_gas_ok: m.conferencia_gas_ok ?? null,
      conferencia_alvenaria_ok: m.conferencia_alvenaria_ok ?? null,
      observacoes_montador: m.observacoes_montador,
      planta_baixa_json: m.planta_baixa_json ?? null,
      croqui_3d_thumbnail_data_url: null,
      concluida: m.concluida,
      criado_em: m.criado_em,
      atualizado_em: m.atualizado_em,
    };
  }

  /** Retorna projeto com dados do cliente (para exibir na tela de medição) */
  async getProjetoComCliente(projetoId: number) {
    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      include: {
        cliente: {
          select: {
            id: true,
            nome_completo: true,
            razao_social: true,
            cpf: true,
            cnpj: true,
            telefone: true,
            whatsapp: true,
            email: true,
            cep: true,
            endereco: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            estado: true,
          },
        },
      },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    return projeto;
  }

  /** Validar medição: altera status do projeto para Pronto para Produção */
  async validarMedicao(projetoId: number) {
    await this.assertProjetoExiste(projetoId);
    await this.prisma.projetos.update({
      where: { id: projetoId },
      data: { status_atual: STATUS_PROJETO_PRONTO_PRODUCAO },
    });
    return { ok: true, status_atual: STATUS_PROJETO_PRONTO_PRODUCAO };
  }

  /** Referência da pré-medição/orçamento para comparação técnica na medição fina */
  async getComparativoPreOrcamento(projetoId: number) {
    await this.assertProjetoExiste(projetoId);

    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { orcamento_id: true },
    });

    let medicao =
      (await this.findMedicaoOrcamentoPorProjetoAgenda(projetoId)) ?? null;
    if (!medicao && projeto?.orcamento_id) {
      medicao = await this.findMedicaoOrcamentoPorOrcamentoId(projeto.orcamento_id);
    }

    if (medicao) {
      return {
        medicao_orcamento_id: medicao.id,
        agenda_loja_id: medicao.agenda_loja_id,
        atualizado_em: medicao.atualizado_em,
        ambientes: (medicao.ambientes || []).map((amb) =>
          this.mapAmbienteComparativoMedicao(amb),
        ),
      };
    }

    const pre = await this.findPreMedicaoPorProjetoAgenda(projetoId);
    if (pre?.ambientes?.length) {
      return {
        medicao_orcamento_id: null,
        agenda_loja_id: pre.agenda_loja_id,
        atualizado_em: pre.atualizado_em,
        ambientes: pre.ambientes.map((amb) => ({
          id: amb.id,
          nome_ambiente: amb.nome_ambiente,
          largura_m: amb.largura_m != null ? Number(amb.largura_m) : null,
          pe_direito_m: amb.pe_direito_m != null ? Number(amb.pe_direito_m) : null,
          profundidade_m: amb.profundidade_m != null ? Number(amb.profundidade_m) : null,
          observacoes: amb.observacoes ?? null,
          medidas_json: amb.medidas_json ?? null,
          paredes: [],
        })),
      };
    }

    return {
      medicao_orcamento_id: null,
      agenda_loja_id: null,
      atualizado_em: null,
      ambientes: [],
    };
  }
}
