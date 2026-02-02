import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarTarefaDto } from './dto/criar-tarefa.dto'
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto'
import { randomUUID } from 'crypto'

@Injectable()
export class ProducaoService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================
  // HELPERS
  // ============================
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

  private normalizarId(valor: any, field: string) {
    const n = Number(valor)
    if (!Number.isFinite(n) || n < 1) throw new BadRequestException(`${field} é obrigatório`)
    return n
  }

  private async snapshotFuncionario(funcionarioId: number) {
    const func = await this.prisma.funcionarios.findUnique({
      where: { id: funcionarioId },
      select: { custo_hora: true, funcao: true }, // <<< aqui é o snapshot
    })
    if (!func) throw new BadRequestException('Funcionário não encontrado')

    return {
      custoHora: Number(func.custo_hora || 0),
      funcao: func.funcao ? String(func.funcao) : null,
    }
  }

  private async resolverProjeto(origem_tipo: string, origem_id: number) {
    const tipo = this.normalizarOrigemTipo(origem_tipo)
    const oid = this.normalizarId(origem_id, 'origem_id')

    return this.prisma.producao_projetos.upsert({
      where: { origem_tipo_origem_id: { origem_tipo: tipo, origem_id: oid } },
      create: {
        codigo: `PROD-${randomUUID()}`,
        origem_tipo: tipo,
        origem_id: oid,
        status: 'ABERTO',
      },
      update: {},
      select: {
        id: true,
        codigo: true,
        origem_tipo: true,
        origem_id: true,
        status: true,
        encaminhado_em: true,
      },
    })
  }

  // ============================
  // AGENDA
  // ============================
  async agenda(inicioIso: string, fimIso: string) {
    if (!inicioIso || !fimIso) throw new BadRequestException('inicio e fim são obrigatórios')

    const inicio = this.toDate(inicioIso, 'inicio')
    const fim = this.toDate(fimIso, 'fim')

    if (inicio.getTime() >= fim.getTime()) throw new BadRequestException('fim deve ser maior que inicio')

    const projetos = await this.prisma.producao_projetos.findMany({
      where: {
        OR: [
          { encaminhado_em: { gte: inicio, lt: fim } },
          {
            tarefas: {
              some: {
                inicio_em: { lt: fim },
                fim_em: { gt: inicio },
              },
            },
          },
        ],
      },
      orderBy: [{ encaminhado_em: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        codigo: true,
        origem_tipo: true,
        origem_id: true,
        status: true,
        encaminhado_em: true,
        criado_em: true,
        atualizado_em: true,

        tarefas: {
          where: {
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
            horas_total: true,
            funcao_aplicada: true,
            custo_hora_aplicado: true,
            custo_total: true,
            funcionario: { select: { id: true, nome: true } },
          },
        },
      },
    })

    return projetos.map((p) => {
      const tarefas = p.tarefas || []

      const totalCustoProjeto = this.round2(
        tarefas.reduce((acc, t) => acc + Number(t.custo_total || 0), 0),
      )

      const mapFunc: Record<
        string,
        { funcionario_id: number; funcionario_nome: string; total_custo: number; total_tarefas: number }
      > = {}

      let minInicio: Date | null = null
      let maxFim: Date | null = null

      for (const t of tarefas) {
        const fid = t.funcionario_id ? Number(t.funcionario_id) : 0
        const nome = t.funcionario?.nome || (fid ? '—' : 'SEM FUNCIONÁRIO')

        if (!mapFunc[String(fid)]) {
          mapFunc[String(fid)] = {
            funcionario_id: fid,
            funcionario_nome: nome,
            total_custo: 0,
            total_tarefas: 0,
          }
        }

        mapFunc[String(fid)].total_custo = this.round2(
          mapFunc[String(fid)].total_custo + Number(t.custo_total || 0),
        )
        mapFunc[String(fid)].total_tarefas += 1

        if (!minInicio || t.inicio_em < minInicio) minInicio = t.inicio_em
        if (!maxFim || t.fim_em > maxFim) maxFim = t.fim_em
      }

      const custosPorFuncionario = Object.values(mapFunc).sort((a, b) => Number(b.total_custo) - Number(a.total_custo))

      return {
        ...p,
        total_tarefas_intervalo: tarefas.length,
        total_custo_intervalo: totalCustoProjeto,
        janela_intervalo: {
          inicio_min: minInicio,
          fim_max: maxFim,
        },
        custos_por_funcionario: custosPorFuncionario,
      }
    })
  }

  // ============================
  // BUSCAR PROJETO
  // ============================
  async buscarProjeto(id: number) {
    const projeto = await this.prisma.producao_projetos.findUnique({
      where: { id },
      select: {
        id: true,
        codigo: true,
        origem_tipo: true,
        origem_id: true,
        status: true,
        encaminhado_em: true,
        criado_em: true,
        atualizado_em: true,

        tarefas: {
          orderBy: [{ inicio_em: 'asc' }],
          select: {
            id: true,
            projeto_id: true,
            funcionario_id: true,
            titulo: true,
            status: true,
            observacao: true,
            inicio_em: true,
            fim_em: true,
            horas_total: true,
            funcao_aplicada: true,
            custo_hora_aplicado: true,
            custo_total: true,
            criado_em: true,
            atualizado_em: true,
            funcionario: { select: { id: true, nome: true } },
          },
        },
      },
    })

    if (!projeto) throw new NotFoundException('Projeto de produção não encontrado')
    return projeto
  }

  // ============================
  // CRIAR TAREFA
  // ============================
  async criarTarefa(dto: CriarTarefaDto) {
    const projeto = await this.resolverProjeto(dto.origem_tipo, dto.origem_id)

    const inicio = this.toDate(dto.inicio_em, 'inicio_em')
    const fim = this.toDate(dto.fim_em, 'fim_em')
    const horas = this.round2(this.calcHoras(inicio, fim))

    const titulo = String(dto.titulo || '').trim()
    if (!titulo) throw new BadRequestException('titulo é obrigatório')

    let funcionarioId: number | null = null
    let custoHoraAplicado = 0
    let funcaoAplicada: string | null = null

    if (dto.funcionario_id !== undefined && dto.funcionario_id !== null) {
      funcionarioId = this.normalizarId(dto.funcionario_id, 'funcionario_id')
      const snap = await this.snapshotFuncionario(funcionarioId)
      custoHoraAplicado = snap.custoHora
      funcaoAplicada = snap.funcao
    }

    const custoTotal = this.round2(horas * custoHoraAplicado)

    return this.prisma.producao_tarefas.create({
      data: {
        projeto_id: projeto.id,
        funcionario_id: funcionarioId,
        titulo,
        status: String(dto.status || 'PENDENTE').trim(),
        observacao: dto.observacao ? String(dto.observacao).trim() : null,

        inicio_em: inicio,
        fim_em: fim,

        // ✅ snapshots
        horas_total: horas,
        funcao_aplicada: funcaoAplicada,
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
        horas_total: true,
        funcao_aplicada: true,
        custo_hora_aplicado: true,
        custo_total: true,
        criado_em: true,
        atualizado_em: true,
      },
    })
  }

  // ============================
  // ATUALIZAR TAREFA
  // ============================
  async atualizarTarefa(id: number, dto: AtualizarTarefaDto) {
    const atual = await this.prisma.producao_tarefas.findUnique({
      where: { id },
      select: {
        id: true,
        projeto_id: true,
        funcionario_id: true,
        inicio_em: true,
        fim_em: true,
        horas_total: true,
        funcao_aplicada: true,
        custo_hora_aplicado: true,
      },
    })

    if (!atual) throw new NotFoundException('Tarefa não encontrada')

    const data: any = {}

    // ============================
    // MUDANÇA DE VÍNCULO (PROJETO)
    // ============================
    const querMudarOrigem = dto.origem_tipo !== undefined || dto.origem_id !== undefined
    if (querMudarOrigem) {
      if (dto.origem_tipo === undefined || dto.origem_id === undefined) {
        throw new BadRequestException('origem_tipo e origem_id devem vir juntos')
      }

      const tipo = this.normalizarOrigemTipo(dto.origem_tipo)
      const oid = this.normalizarId(dto.origem_id, 'origem_id')

      const projeto = await this.resolverProjeto(tipo, oid)
      data.projeto_id = projeto.id
    }

    // ============================
    // CAMPOS SIMPLES
    // ============================
    if (dto.titulo !== undefined) {
      const titulo = String(dto.titulo || '').trim()
      if (!titulo) throw new BadRequestException('titulo é obrigatório')
      data.titulo = titulo
    }

    if (dto.status !== undefined) data.status = String(dto.status || '').trim()

    if (dto.observacao !== undefined) {
      data.observacao = dto.observacao ? String(dto.observacao).trim() : null
    }

    // ============================
    // HORÁRIOS
    // ============================
    const mudouInicio = dto.inicio_em !== undefined
    const mudouFim = dto.fim_em !== undefined

    if (mudouInicio) data.inicio_em = this.toDate(dto.inicio_em as string, 'inicio_em')
    if (mudouFim) data.fim_em = this.toDate(dto.fim_em as string, 'fim_em')

    // ============================
    // FUNCIONÁRIO (snapshot)
    // ============================
    let custoHoraAplicado = Number(atual.custo_hora_aplicado || 0)

    if (dto.funcionario_id !== undefined) {
      if (dto.funcionario_id === null) {
        data.funcionario_id = null
        data.custo_hora_aplicado = 0
        data.funcao_aplicada = null
        custoHoraAplicado = 0
      } else {
        const funcionarioId = this.normalizarId(dto.funcionario_id, 'funcionario_id')
        const snap = await this.snapshotFuncionario(funcionarioId)

        custoHoraAplicado = snap.custoHora
        data.funcionario_id = funcionarioId
        data.custo_hora_aplicado = custoHoraAplicado
        data.funcao_aplicada = snap.funcao
      }
    }

    // ============================
    // RECÁLCULO (horas + custo_total)
    // ============================
    const precisaRecalcular = mudouInicio || mudouFim || dto.funcionario_id !== undefined
    if (precisaRecalcular) {
      const inicio = data.inicio_em ?? atual.inicio_em
      const fim = data.fim_em ?? atual.fim_em

      const horas = this.round2(this.calcHoras(inicio, fim))
      data.horas_total = horas
      data.custo_total = this.round2(horas * custoHoraAplicado)
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
        horas_total: true,
        funcao_aplicada: true,
        custo_hora_aplicado: true,
        custo_total: true,
        atualizado_em: true,
      },
    })
  }

  // ============================
  // REMOVER
  // ============================
  async removerTarefa(id: number) {
    try {
      await this.prisma.producao_tarefas.delete({ where: { id } })
      return
    } catch {
      throw new NotFoundException('Tarefa não encontrada')
    }
  }
}
