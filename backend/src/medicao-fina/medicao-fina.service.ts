import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateMedicaoFinaDto } from './dto/create-medicao-fina.dto';
import { UpdateMedicaoFinaDto } from './dto/update-medicao-fina.dto';
import { FinalizarMedicaoTotemDto } from './dto/finalizar-medicao-totem.dto';

const STATUS_PROJETO_PRONTO_CALCULO = 'PRONTO_PARA_PROJETO_CALCULO';
const STATUS_PROJETO_PRONTO_PRODUCAO = 'PRONTO_PARA_PRODUCAO';

@Injectable()
export class MedicaoFinaService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Lista projetos do cliente (para buscar por cliente e depois escolher projeto) */
  async listarProjetosPorCliente(clienteId: number) {
    if (!clienteId || clienteId <= 0) return [];
    const list = await this.prisma.projetos.findMany({
      where: { cliente_id: clienteId },
      select: { id: true, codigo: true },
      orderBy: { id: 'desc' },
    });
    return list.map((p) => ({ id: p.id, codigo: p.codigo }));
  }

  /** Lista ambientes (vendas_itens) do projeto para seleção na medição fina */
  async listarAmbientesPorProjeto(projetoId: number) {
    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { venda_id: true },
    });
    if (!projeto?.venda_id) return [];

    const itens = await this.prisma.vendas_itens.findMany({
      where: { venda_id: projeto.venda_id },
      select: { nome_ambiente: true },
      distinct: ['nome_ambiente'],
      orderBy: { nome_ambiente: 'asc' },
    });
    return itens.map((i) => i.nome_ambiente);
  }

  /** Busca ou cria medição fina por projeto + ambiente */
  async findByProjetoAndAmbiente(projetoId: number, nomeAmbiente: string) {
    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { id: true },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');

    const nome = String(nomeAmbiente || '').trim();
    if (!nome) throw new BadRequestException('Nome do ambiente é obrigatório.');

    let medicao = await this.prisma.medicao_fina.findUnique({
      where: {
        projeto_id_nome_ambiente: { projeto_id: projetoId, nome_ambiente: nome },
      },
    });

    if (!medicao) {
      medicao = await this.prisma.medicao_fina.create({
        data: {
          projeto_id: projetoId,
          nome_ambiente: nome,
        },
      });
    }

    return this.toResponse(medicao);
  }

  /** Lista todas as medições finas de um projeto */
  async listarPorProjeto(projetoId: number) {
    const list = await this.prisma.medicao_fina.findMany({
      where: { projeto_id: projetoId },
      orderBy: { nome_ambiente: 'asc' },
    });
    return list.map((m) => this.toResponse(m));
  }

  /** Cria ou atualiza medição fina (upsert por projeto_id + nome_ambiente) */
  async salvar(dto: CreateMedicaoFinaDto) {
    const projeto = await this.prisma.projetos.findUnique({
      where: { id: dto.projeto_id },
      select: { id: true },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');

    const nome = String(dto.nome_ambiente || '').trim();
    if (!nome) throw new BadRequestException('Nome do ambiente é obrigatório.');

    const data: any = {
      nome_ambiente: nome,
      altura_cm: dto.altura_cm != null ? new Decimal(dto.altura_cm) : null,
      largura_cm: dto.largura_cm != null ? new Decimal(dto.largura_cm) : null,
      profundidade_cm: dto.profundidade_cm != null ? new Decimal(dto.profundidade_cm) : null,
      altura_promob_cm: dto.altura_promob_cm != null ? new Decimal(dto.altura_promob_cm) : null,
      largura_promob_cm: dto.largura_promob_cm != null ? new Decimal(dto.largura_promob_cm) : null,
      profundidade_promob_cm: dto.profundidade_promob_cm != null ? new Decimal(dto.profundidade_promob_cm) : null,
      prumo_ok: dto.prumo_ok ?? null,
      esquadro_ok: dto.esquadro_ok ?? null,
      interferencias: (dto.interferencias && dto.interferencias.length) ? dto.interferencias : null,
      conferencia_eletrica_ok: dto.conferencia_eletrica_ok ?? null,
      conferencia_hidraulica_ok: dto.conferencia_hidraulica_ok ?? null,
      conferencia_gas_ok: dto.conferencia_gas_ok ?? null,
      conferencia_alvenaria_ok: dto.conferencia_alvenaria_ok ?? null,
      observacoes_montador: dto.observacoes_montador?.trim() || null,
      concluida: dto.concluida ?? false,
    };

    const medicao = await this.prisma.medicao_fina.upsert({
      where: {
        projeto_id_nome_ambiente: { projeto_id: dto.projeto_id, nome_ambiente: nome },
      },
      create: {
        projeto_id: dto.projeto_id,
        ...data,
      },
      update: data,
    });

    if (medicao.concluida) {
      await this.atualizarStatusProjetoQuandoConcluida(medicao.projeto_id);
    }

    return this.toResponse(medicao);
  }

  /** Atualiza medição fina por id */
  async atualizar(id: number, dto: UpdateMedicaoFinaDto) {
    const existente = await this.prisma.medicao_fina.findUnique({
      where: { id },
    });
    if (!existente) throw new NotFoundException('Medição fina não encontrada.');

    const data: any = {};
    if (dto.altura_cm !== undefined) data.altura_cm = new Decimal(dto.altura_cm);
    if (dto.largura_cm !== undefined) data.largura_cm = new Decimal(dto.largura_cm);
    if (dto.profundidade_cm !== undefined) data.profundidade_cm = new Decimal(dto.profundidade_cm);
    if (dto.altura_promob_cm !== undefined) data.altura_promob_cm = dto.altura_promob_cm != null ? new Decimal(dto.altura_promob_cm) : null;
    if (dto.largura_promob_cm !== undefined) data.largura_promob_cm = dto.largura_promob_cm != null ? new Decimal(dto.largura_promob_cm) : null;
    if (dto.profundidade_promob_cm !== undefined) data.profundidade_promob_cm = dto.profundidade_promob_cm != null ? new Decimal(dto.profundidade_promob_cm) : null;
    if (dto.prumo_ok !== undefined) data.prumo_ok = dto.prumo_ok;
    if (dto.esquadro_ok !== undefined) data.esquadro_ok = dto.esquadro_ok;
    if (dto.interferencias !== undefined) data.interferencias = dto.interferencias?.length ? dto.interferencias : null;
    if (dto.conferencia_eletrica_ok !== undefined) data.conferencia_eletrica_ok = dto.conferencia_eletrica_ok;
    if (dto.conferencia_hidraulica_ok !== undefined) data.conferencia_hidraulica_ok = dto.conferencia_hidraulica_ok;
    if (dto.conferencia_gas_ok !== undefined) data.conferencia_gas_ok = dto.conferencia_gas_ok;
    if (dto.conferencia_alvenaria_ok !== undefined) data.conferencia_alvenaria_ok = dto.conferencia_alvenaria_ok;
    if (dto.observacoes_montador !== undefined) data.observacoes_montador = dto.observacoes_montador?.trim() || null;
    if (dto.concluida !== undefined) data.concluida = dto.concluida;

    const medicao = await this.prisma.medicao_fina.update({
      where: { id },
      data,
    });

    if (medicao.concluida) {
      await this.atualizarStatusProjetoQuandoConcluida(medicao.projeto_id);
    }

    return this.toResponse(medicao);
  }

  /** Gatilho: ao marcar medição como concluída, atualiza status do projeto e conclui evento Medição Fina na agenda */
  private async atualizarStatusProjetoQuandoConcluida(projetoId: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.projetos.update({
        where: { id: projetoId },
        data: { status_atual: STATUS_PROJETO_PRONTO_CALCULO },
      });
      await tx.agenda_loja.updateMany({
        where: {
          projeto_id: projetoId,
          status: { not: 'CONCLUIDO' },
          categoria: { in: ['MEDIDA_FINA', 'AGENDAR_MEDIDA_FINA'] },
        },
        data: { status: 'CONCLUIDO', status_aplicado_em: new Date() },
      });
    });
  }

  /** Totem: finaliza medição (medidas obrigatórias), atualiza agenda e timeline para "Medido - Aguardando Técnico" */
  async finalizarMedicaoTotem(dto: FinalizarMedicaoTotemDto) {
    let projetoId = dto.projeto_id;
    if (projetoId == null) {
      if (dto.tipo === 'agenda_loja') {
        const ag = await this.prisma.agenda_loja.findUnique({
          where: { id: dto.agenda_id },
          select: { projeto_id: true },
        });
        if (!ag) throw new NotFoundException('Tarefa da agenda não encontrada.');
        projetoId = ag.projeto_id ?? undefined;
      } else {
        const ag = await this.prisma.agenda_fabrica.findUnique({
          where: { id: dto.agenda_id },
          select: { projeto_id: true },
        });
        if (!ag) throw new NotFoundException('Tarefa da agenda não encontrada.');
        projetoId = ag.projeto_id ?? undefined;
      }
    }
    if (projetoId == null) throw new BadRequestException('Projeto não vinculado a esta tarefa.');

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

    const medicao = await this.prisma.medicao_fina.upsert({
      where: {
        projeto_id_nome_ambiente: { projeto_id: projetoId, nome_ambiente: nomeAmbiente },
      },
      create: {
        projeto_id: projetoId,
        nome_ambiente: nomeAmbiente,
        ...dataMedicao,
      },
      update: dataMedicao,
    });

    const agora = new Date();
    const statusSource = 'MEDIDO_AGUARDANDO_TECNICO';

    await this.prisma.$transaction(async (tx) => {
      if (dto.tipo === 'agenda_loja') {
        await tx.agenda_loja.update({
          where: { id: dto.agenda_id },
          data: {
            status: 'CONCLUIDO',
            status_source: statusSource,
            status_aplicado_em: agora,
          },
        });
      } else {
        await tx.agenda_fabrica.update({
          where: { id: dto.agenda_id },
          data: {
            status: 'CONCLUIDO',
            status_source: statusSource,
            status_aplicado_em: agora,
          },
        });
      }
      await tx.projetos.update({
        where: { id: projetoId },
        data: { status_atual: STATUS_PROJETO_PRONTO_CALCULO },
      });
    });

    return {
      ...this.toResponse(medicao),
      status_tarefa: 'CONCLUIDO',
      status_label: 'Medido - Aguardando Técnico',
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
    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { id: true },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    await this.prisma.projetos.update({
      where: { id: projetoId },
      data: { status_atual: STATUS_PROJETO_PRONTO_PRODUCAO },
    });
    return { ok: true, status_atual: STATUS_PROJETO_PRONTO_PRODUCAO };
  }
}
