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

  private normalizarId(valor: any, field: string) {
    const n = Number(valor)
    if (!n || Number.isNaN(n)) throw new BadRequestException(`${field} é obrigatório`)
    return n
  }

  private async resolverProjeto(origem_tipo: string, origem_id: number) {
    const tipo = this.normalizarOrigemTipo(origem_tipo)
    const oid = this.normalizarId(origem_id, 'origem_id')

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

  async encaminhar(dto: EncaminharProducaoDto) {
    const tipo = this.normalizarOrigemTipo(dto.origem_tipo)
    const oid = this.normalizarId(dto.origem_id, 'origem_id')
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

  async agenda(inicioIso: string, fimIso: string) {
    if (!inicioIso || !fimIso) throw new BadRequestException('inicio e fim são obrigatórios')

    const inicio = this.toDate(inicioIso, 'inicio')
    const fim = this.toDate(fimIso, 'fim')

    if (inicio.getTime() >= fim.getTime()) {
      throw new BadRequestException('fim deve ser maior que inicio')
    }

    const projetos = await this.prisma.producao_projetos.findMany({
      where: {
        tarefas: {
          some: {
            inicio_em: { lt: fim },
            fim_em: { gt: inicio },
          },
        },
      },
      orderBy: [
        { encaminhado_em: 'desc' },
        { id: 'desc' },
      ],
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
        const fid = Number(t.funcionario_id)
        const nome = t.funcionario?.nome || '—'

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

      const custosPorFuncionario = Object.values(mapFunc).sort((a, b) => {
        return Number(b.total_custo) - Number(a.total_custo)
      })

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
async buscarProjeto(id: number) {
  const projeto = await this.prisma.producao_projetos.findUnique({
    where: { id },
    select: {
      id: true,
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


  async criarTarefa(dto: CriarTarefaDto) {
    const projeto = await this.resolverProjeto(dto.origem_tipo, dto.origem_id)

    const inicio = this.toDate(dto.inicio_em, 'inicio_em')
    const fim = this.toDate(dto.fim_em, 'fim_em')
    const horas = this.calcHoras(inicio, fim)

    const funcionarioId = this.normalizarId(dto.funcionario_id, 'funcionario_id')
    const titulo = String(dto.titulo || '').trim()
    if (!titulo) throw new BadRequestException('titulo é obrigatório')

    const status = String(dto.status || 'PENDENTE').trim()
    const observacao = dto.observacao ? String(dto.observacao).trim() : null

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

    const querMudarVinculo =
      (dto.origem_tipo !== undefined && String(dto.origem_tipo || '').trim() !== '') ||
      dto.origem_id !== undefined

    if (querMudarVinculo) {
      const tipo = this.normalizarOrigemTipo(dto.origem_tipo)
      const oid = this.normalizarId(dto.origem_id, 'origem_id')
      const projeto = await this.resolverProjeto(tipo, oid)
      data.projeto_id = projeto.id
    }

    if (dto.funcionario_id !== undefined) data.funcionario_id = this.normalizarId(dto.funcionario_id, 'funcionario_id')

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
      return
    } catch {
      throw new NotFoundException('Tarefa não encontrada')
    }
  }
}
