import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarTarefaDto } from './dto/criar-tarefa.dto'
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'

@Injectable()
export class ProducaoService {
  constructor(private readonly prisma: PrismaService) {}

  private toDate(iso: string, field: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`Data inválida: ${field}`)
    return d
  }

  private calcHoras(inicio: Date, fim: Date) {
    const ms = fim.getTime() - inicio.getTime()
    if (ms <= 0) throw new BadRequestException('fim_em deve ser maior que inicio_em')
    return ms / (1000 * 60 * 60)
  }

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  private normalizarOrigemTipo(tipo: string) {
    const t = String(tipo || '').trim().toUpperCase()
    if (!t) throw new BadRequestException('origem_tipo é obrigatório')
    return t
  }

  private normalizarOrigemId(id: any) {
    const n = Number(id)
    if (!n || Number.isNaN(n)) throw new BadRequestException('origem_id é obrigatório')
    return n
  }

  /**
   * resolve/cria projeto (produção) pelo unique (origem_tipo, origem_id)
   */
  private async resolverProjeto(origem_tipo: string, origem_id: number) {
    const tipo = this.normalizarOrigemTipo(origem_tipo)
    const oid = this.normalizarOrigemId(origem_id)

    // ⚠️ O nome "origem_tipo_origem_id" depende do Prisma gerar este compound unique.
    // Como você tem @@unique([origem_tipo, origem_id]), esse é o padrão mais comum.
    // Se der erro aqui, é só ajustar o nome do campo composto no `where`.
    return this.prisma.producao_projetos.upsert({
      where: {
        origem_tipo_origem_id: { origem_tipo: tipo, origem_id: oid },
      },
      create: {
        origem_tipo: tipo,
        origem_id: oid,
        status: 'ABERTO',
      },
      update: {},
      select: { id: true, origem_tipo: true, origem_id: true, status: true, encaminhado_em: true },
    })
  }

  /**
   * Encaminha uma origem para Produção:
   * - cria/garante projeto
   * - seta status (default ENCAMINHADO_PRODUCAO)
   * - seta encaminhado_em = now()
   */
  async encaminhar(dto: EncaminharProducaoDto) {
    const tipo = this.normalizarOrigemTipo(dto.origem_tipo)
    const oid = this.normalizarOrigemId(dto.origem_id)
    const status = String(dto.status || 'ENCAMINHADO_PRODUCAO').trim()

    const agora = new Date()

    return this.prisma.producao_projetos.upsert({
      where: {
        origem_tipo_origem_id: { origem_tipo: tipo, origem_id: oid },
      },
      create: {
        origem_tipo: tipo,
        origem_id: oid,
        status,
        encaminhado_em: agora,
      },
      update: {
        status,
        encaminhado_em: agora,
      },
      select: {
        id: true,
        origem_tipo: true,
        origem_id: true,
        status: true,
        encaminhado_em: true,
        atualizado_em: true,
      },
    })
  }

  /**
   * Agenda de Produção (projetos) no intervalo
   * Critério: projetos encaminhados no intervalo
   * + inclui tarefas que intersectam o intervalo
   */
  async agenda(inicioIso: string, fimIso: string) {
    const inicio = this.toDate(inicioIso, 'inicio')
    const fim = this.toDate(fimIso, 'fim')

    return this.prisma.producao_projetos.findMany({
      where: {
        encaminhado_em: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: [{ encaminhado_em: 'desc' }],
      select: {
        id: true,
        origem_tipo: true,
        origem_id: true,
        status: true,
        encaminhado_em: true,
        criado_em: true,
        atualizado_em: true,
        tarefas: {
          where: {
            // intersecta intervalo
            inicio_em: { lt: fim },
            fim_em: { gt: inicio },
          },
          orderBy: [{ inicio_em: 'asc' }],
          select: {
            id: true,
            funcionario_id: true,
            titulo: true,
            status: true,
            observacao: true,
            inicio_em: true,
            fim_em: true,
            custo_hora_aplicado: true,
            custo_total: true,
            funcionario: { select: { id: true, nome: true } },
          },
        },
      },
    })
  }

  async criarTarefa(dto: CriarTarefaDto) {
    const projeto = await this.resolverProjeto(dto.origem_tipo, dto.origem_id)

    const inicio = this.toDate(dto.inicio_em, 'inicio_em')
    const fim = this.toDate(dto.fim_em, 'fim_em')
    const horas = this.calcHoras(inicio, fim)

    const funcionarioId = this.normalizarOrigemId(dto.funcionario_id) // reaproveita validação numérica
    const titulo = String(dto.titulo || '').trim()
    if (!titulo) throw new BadRequestException('titulo é obrigatório')

    const status = String(dto.status || 'PENDENTE').trim()
    const observacao = dto.observacao ? String(dto.observacao).trim() : null

    // snapshot CPV: mantém 0 por enquanto (você liga depois com custo/hora do funcionário)
    const custoHoraAplicado = 0
    const custoTotal = this.round2(horas * custoHoraAplicado)

    return this.prisma.producao_tarefas.create({
      data: {
        projeto_id: projeto.id,
        funcionario_id: funcionarioId,
        titulo,
        status,
        observacao,
        inicio_em: inicio,
        fim_em: fim,
        custo_hora_aplicado: custoHoraAplicado,
        custo_total: custoTotal,
      },
      select: {
        id: true,
        projeto_id: true,
        funcionario_id: true,
        titulo: true,
        status: true,
        observacao: true,
        inicio_em: true,
        fim_em: true,
        custo_hora_aplicado: true,
        custo_total: true,
        criado_em: true,
        atualizado_em: true,
      },
    })
  }

  async atualizarTarefa(id: number, dto: AtualizarTarefaDto) {
    const atual = await this.prisma.producao_tarefas.findUnique({
      where: { id },
      select: { id: true, projeto_id: true, inicio_em: true, fim_em: true, custo_hora_aplicado: true },
    })
    if (!atual) throw new NotFoundException('Tarefa não encontrada')

    const data: any = {}

    // mudar vínculo se vier (exige os 2)
    const querMudarVinculo =
      (dto.origem_tipo !== undefined && String(dto.origem_tipo || '').trim() !== '') ||
      dto.origem_id !== undefined

    if (querMudarVinculo) {
      const tipo = this.normalizarOrigemTipo(dto.origem_tipo)
      const oid = this.normalizarOrigemId(dto.origem_id)
      const projeto = await this.resolverProjeto(tipo, oid)
      data.projeto_id = projeto.id
    }

    if (dto.funcionario_id !== undefined) data.funcionario_id = this.normalizarOrigemId(dto.funcionario_id)
    if (dto.titulo !== undefined) {
      const titulo = String(dto.titulo || '').trim()
      if (!titulo) throw new BadRequestException('titulo é obrigatório')
      data.titulo = titulo
    }
    if (dto.status !== undefined) data.status = String(dto.status || '').trim()
    if (dto.observacao !== undefined) data.observacao = dto.observacao ? String(dto.observacao).trim() : null

    const mudouInicio = dto.inicio_em !== undefined
    const mudouFim = dto.fim_em !== undefined

    if (mudouInicio) data.inicio_em = this.toDate(dto.inicio_em, 'inicio_em')
    if (mudouFim) data.fim_em = this.toDate(dto.fim_em, 'fim_em')

    if (mudouInicio || mudouFim) {
      const inicio = data.inicio_em ?? atual.inicio_em
      const fim = data.fim_em ?? atual.fim_em
      const horas = this.calcHoras(inicio, fim)
      data.custo_total = this.round2(horas * Number(atual.custo_hora_aplicado || 0))
    }

    return this.prisma.producao_tarefas.update({
      where: { id },
      data,
      select: {
        id: true,
        projeto_id: true,
        funcionario_id: true,
        titulo: true,
        status: true,
        observacao: true,
        inicio_em: true,
        fim_em: true,
        custo_hora_aplicado: true,
        custo_total: true,
        atualizado_em: true,
      },
    })
  }

  async removerTarefa(id: number) {
    try {
      await this.prisma.producao_tarefas.delete({ where: { id } })
      return { ok: true }
    } catch {
      throw new NotFoundException('Tarefa não encontrada')
    }
  }
}
