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
  private toDateOptional(iso?: string | null, field?: string) {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`Data inválida: ${field || 'data'}`)
    return d
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

  private calcHorasOptional(inicio: Date | null, fim: Date | null) {
    if (!inicio || !fim) return 0
    const ms = fim.getTime() - inicio.getTime()
    if (ms <= 0) throw new BadRequestException('fim_em deve ser maior que inicio_em')
    return ms / (1000 * 60 * 60)
  }

  private async snapshotFuncionario(funcionarioId: number) {
    const func = await this.prisma.funcionarios.findUnique({
      where: { id: funcionarioId },
      select: { custo_hora: true, funcao: true },
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

    // ✅ seta o vínculo correto pra include/join e evita os 2 ao mesmo tempo
    const vendaItemId = tipo === 'VENDA_ITEM' ? oid : null
    const planoCorteId = tipo === 'PLANO_CORTE' ? oid : null

    return this.prisma.producao_projetos.upsert({
      where: { origem_tipo_origem_id: { origem_tipo: tipo, origem_id: oid } },
      create: {
        codigo: `PROD-${randomUUID()}`,
        origem_tipo: tipo,
        origem_id: oid,
        status: 'ABERTO',
        venda_item_id: vendaItemId,
        plano_corte_id: planoCorteId,
      },
      update: {
        venda_item_id: vendaItemId,
        plano_corte_id: planoCorteId,
      },
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

    const inicio = this.toDateOptional(inicioIso, 'inicio')!
    const fim = this.toDateOptional(fimIso, 'fim')!
    if (inicio.getTime() >= fim.getTime()) throw new BadRequestException('fim deve ser maior que inicio')

    const projetos = await this.prisma.producao_projetos.findMany({
      where: {
        OR: [
          { encaminhado_em: { gte: inicio, lt: fim } },
          {
            tarefas: {
              some: {
                // ✅ tarefa entra na agenda se tem inicio_em e cruza o intervalo
                inicio_em: { not: null, lt: fim },
                OR: [{ fim_em: null }, { fim_em: { gt: inicio } }],
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

        // ✅ relacionamentos do projeto pra você montar "Cliente/Ambiente" ou "Plano de corte"
        venda_item: {
          select: {
            id: true,
            nome_ambiente: true,
            venda: {
              select: {
                id: true,
                cliente: { select: { id: true, nome_completo: true, nome_fantasia: true, razao_social: true } },
              },
            },
          },
        },
        plano_corte: {
          select: {
            id: true,
            fornecedor: { select: { id: true, nome_fantasia: true, razao_social: true } },
          },
        },

        tarefas: {
          where: {
            inicio_em: { not: null, lt: fim },
            OR: [{ fim_em: null }, { fim_em: { gt: inicio } }],
          },
          orderBy: [{ inicio_em: 'asc' }],
          select: {
            id: true,
            etapa: true,
            status: true,
            observacao: true,
            inicio_em: true,
            fim_em: true,
            horas_total: true,
            custo_total: true,

            funcionarios: {
              select: {
                funcionario_id: true,
                funcao_aplicada: true,
                custo_hora_aplicado: true,
                funcionario: { select: { id: true, nome: true } },
              },
            },
          },
        },
      },
    })

    return projetos.map((p) => {
      const tarefas = p.tarefas || []

      const totalCustoProjeto = this.round2(
        tarefas.reduce((acc, t) => acc + Number(t.custo_total || 0), 0),
      )

      // custos por funcionário baseado no snapshot (horas_total * custo_hora_aplicado)
      const mapFunc: Record<
        string,
        { funcionario_id: number; funcionario_nome: string; total_custo: number; total_tarefas: number }
      > = {}

      let minInicio: Date | null = null
      let maxFim: Date | null = null

      for (const t of tarefas) {
        const horas = Number(t.horas_total || 0)

        if (t.inicio_em && (!minInicio || t.inicio_em < minInicio)) minInicio = t.inicio_em
        if (t.fim_em && (!maxFim || t.fim_em > maxFim)) maxFim = t.fim_em

        for (const f of (t.funcionarios || [])) {
          const fid = Number(f.funcionario_id)
          const nome = f.funcionario?.nome || `FUNC #${fid}`
          const custoHora = Number(f.custo_hora_aplicado || 0)
          const custo = this.round2(horas * custoHora)

          if (!mapFunc[String(fid)]) {
            mapFunc[String(fid)] = { funcionario_id: fid, funcionario_nome: nome, total_custo: 0, total_tarefas: 0 }
          }

          mapFunc[String(fid)].total_custo = this.round2(mapFunc[String(fid)].total_custo + custo)
          mapFunc[String(fid)].total_tarefas += 1
        }
      }

      const custosPorFuncionario = Object.values(mapFunc).sort((a, b) => Number(b.total_custo) - Number(a.total_custo))

      return {
        ...p,
        total_tarefas_intervalo: tarefas.length,
        total_custo_intervalo: totalCustoProjeto,
        janela_intervalo: { inicio_min: minInicio, fim_max: maxFim },
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

        venda_item: {
          select: {
            id: true,
            nome_ambiente: true,
            venda: {
              select: {
                id: true,
                cliente: { select: { id: true, nome_completo: true, nome_fantasia: true, razao_social: true } },
              },
            },
          },
        },
        plano_corte: { select: { id: true, fornecedor: { select: { id: true, nome_fantasia: true, razao_social: true } } } },

        tarefas: {
          orderBy: [{ inicio_em: 'asc' }],
          select: {
            id: true,
            projeto_id: true,
            etapa: true,
            status: true,
            observacao: true,
            inicio_em: true,
            fim_em: true,
            horas_total: true,
            custo_total: true,
            criado_em: true,
            atualizado_em: true,

            funcionarios: {
              select: {
                funcionario_id: true,
                funcao_aplicada: true,
                custo_hora_aplicado: true,
                funcionario: { select: { id: true, nome: true } },
              },
            },
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

    const etapa = String(dto.etapa || '').trim()
    if (!etapa) throw new BadRequestException('etapa é obrigatória')

    const inicio = this.toDateOptional(dto.inicio_em, 'inicio_em')
    const fim = this.toDateOptional(dto.fim_em, 'fim_em')

    const horas = this.round2(this.calcHorasOptional(inicio, fim))

    const funcionarioIds = Array.isArray(dto.funcionario_ids) ? dto.funcionario_ids.map((x) => Number(x)).filter((x) => x > 0) : []
    const uniqueIds = Array.from(new Set(funcionarioIds))

    // snapshots por funcionário
    const pivots = []
    let somaCustoHora = 0

    for (const fid of uniqueIds) {
      const snap = await this.snapshotFuncionario(fid)
      somaCustoHora += Number(snap.custoHora || 0)
      pivots.push({
        funcionario_id: fid,
        funcao_aplicada: snap.funcao,
        custo_hora_aplicado: snap.custoHora,
      })
    }

    const custoTotal = this.round2(horas * somaCustoHora)

    return this.prisma.$transaction(async (tx) => {
      const tarefa = await tx.producao_tarefas.create({
        data: {
          projeto_id: projeto.id,
          etapa,
          status: String(dto.status || 'PENDENTE').trim(),
          observacao: dto.observacao ? String(dto.observacao).trim() : null,

          inicio_em: inicio,
          fim_em: fim,

          horas_total: horas,
          custo_total: custoTotal,
        },
        select: {
          id: true,
          projeto_id: true,
          etapa: true,
          status: true,
          observacao: true,
          inicio_em: true,
          fim_em: true,
          horas_total: true,
          custo_total: true,
          criado_em: true,
          atualizado_em: true,
        },
      })

      if (pivots.length) {
        await tx.producao_tarefa_funcionarios.createMany({
          data: pivots.map((p) => ({ ...p, tarefa_id: tarefa.id })),
        })
      }

      const completa = await tx.producao_tarefas.findUnique({
        where: { id: tarefa.id },
        select: {
          id: true,
          projeto_id: true,
          etapa: true,
          status: true,
          observacao: true,
          inicio_em: true,
          fim_em: true,
          horas_total: true,
          custo_total: true,
          funcionarios: {
            select: {
              funcionario_id: true,
              funcao_aplicada: true,
              custo_hora_aplicado: true,
              funcionario: { select: { id: true, nome: true } },
            },
          },
          criado_em: true,
          atualizado_em: true,
        },
      })

      return completa
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
        etapa: true,
        inicio_em: true,
        fim_em: true,
        horas_total: true,
        custo_total: true,
        funcionarios: { select: { funcionario_id: true, custo_hora_aplicado: true } },
      },
    })

    if (!atual) throw new NotFoundException('Tarefa não encontrada')

    return this.prisma.$transaction(async (tx) => {
      const data: any = {}

      // ============================
      // MUDANÇA DE VÍNCULO (PROJETO)
      // ============================
      const querMudarOrigem = dto.origem_tipo !== undefined || dto.origem_id !== undefined
      if (querMudarOrigem) {
        if (dto.origem_tipo === undefined || dto.origem_id === undefined) {
          throw new BadRequestException('origem_tipo e origem_id devem vir juntos')
        }
        const projeto = await this.resolverProjeto(dto.origem_tipo, dto.origem_id)
        data.projeto_id = projeto.id
      }

      // ============================
      // CAMPOS SIMPLES
      // ============================
      if (dto.etapa !== undefined) {
        const etapa = String(dto.etapa || '').trim()
        if (!etapa) throw new BadRequestException('etapa é obrigatória')
        data.etapa = etapa
      }

      if (dto.status !== undefined) data.status = String(dto.status || '').trim()

      if (dto.observacao !== undefined) {
        data.observacao = dto.observacao ? String(dto.observacao).trim() : null
      }

      // ============================
      // DATAS (opcionais)
      // ============================
      const mudouInicio = dto.inicio_em !== undefined
      const mudouFim = dto.fim_em !== undefined

      if (mudouInicio) data.inicio_em = this.toDateOptional(dto.inicio_em, 'inicio_em')
      if (mudouFim) data.fim_em = this.toDateOptional(dto.fim_em, 'fim_em')

      // ============================
      // FUNCIONÁRIOS (lista)
      // ============================
      const mudouFuncionarios = dto.funcionario_ids !== undefined
      let somaCustoHora = (atual.funcionarios || []).reduce((acc, f) => acc + Number(f.custo_hora_aplicado || 0), 0)

      if (mudouFuncionarios) {
        const ids = Array.isArray(dto.funcionario_ids)
          ? Array.from(new Set(dto.funcionario_ids.map((x) => Number(x)).filter((x) => x > 0)))
          : []

        await tx.producao_tarefa_funcionarios.deleteMany({ where: { tarefa_id: id } })

        somaCustoHora = 0
        if (ids.length) {
          const pivots = []
          for (const fid of ids) {
            const snap = await this.snapshotFuncionario(fid)
            somaCustoHora += Number(snap.custoHora || 0)
            pivots.push({
              tarefa_id: id,
              funcionario_id: fid,
              funcao_aplicada: snap.funcao,
              custo_hora_aplicado: snap.custoHora,
            })
          }

          await tx.producao_tarefa_funcionarios.createMany({ data: pivots })
        }
      }

      // ============================
      // RECÁLCULO (horas + custo_total)
      // ============================
      const precisaRecalcular = mudouInicio || mudouFim || mudouFuncionarios
      if (precisaRecalcular) {
        const inicio = (data.inicio_em !== undefined ? data.inicio_em : atual.inicio_em) as Date | null
        const fim = (data.fim_em !== undefined ? data.fim_em : atual.fim_em) as Date | null

        const horas = this.round2(this.calcHorasOptional(inicio, fim))
        data.horas_total = horas
        data.custo_total = this.round2(horas * somaCustoHora)
      }

      await tx.producao_tarefas.update({
        where: { id },
        data,
      })

      const completa = await tx.producao_tarefas.findUnique({
        where: { id },
        select: {
          id: true,
          projeto_id: true,
          etapa: true,
          status: true,
          observacao: true,
          inicio_em: true,
          fim_em: true,
          horas_total: true,
          custo_total: true,
          atualizado_em: true,
          funcionarios: {
            select: {
              funcionario_id: true,
              funcao_aplicada: true,
              custo_hora_aplicado: true,
              funcionario: { select: { id: true, nome: true } },
            },
          },
        },
      })

      return completa
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
