import { Injectable } from '@nestjs/common'
import { Prisma, funcionarios, ponto_justificativas } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type Filtros = {
  funcionario_id?: string
  data_ini?: string // YYYY-MM-DD
  data_fim?: string // YYYY-MM-DD
  tipo?: 'ENTRADA' | 'SAIDA'
  origem?: 'PWA' | 'WEB' | 'ADMIN'
  status?: 'ATIVO' | 'INVALIDADO'
}

@Injectable()
export class PontoRelatorioService {
  constructor(private readonly prisma: PrismaService) {}

private parseYmdLocal(ymd?: string) {
  if (!ymd) return undefined
  const [y, m, d] = String(ymd).split('-').map((n) => Number(n))
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d) // local
}

private inicioDia(ymd?: string) {
  const d = this.parseYmdLocal(ymd)
  if (!d) return undefined
  d.setHours(0, 0, 0, 0)
  return d
}

private fimDia(ymd?: string) {
  const d = this.parseYmdLocal(ymd)
  if (!d) return undefined
  d.setHours(23, 59, 59, 999)
  return d
}


  private cleanId(v?: string) {
    if (!v) return undefined
    const id = Number(String(v).replace(/\D/g, ''))
    return id ? id : undefined
  }

  async listar(f: Filtros) {
    const where: Prisma.ponto_registrosWhereInput = {}

    const funcionarioId = this.cleanId(f.funcionario_id)
    if (funcionarioId) where.funcionario_id = funcionarioId

    if (f.tipo) where.tipo = f.tipo
    if (f.origem) where.origem = f.origem
    if (f.status) where.status = f.status

    const ini = this.inicioDia(f.data_ini)
    const fim = this.fimDia(f.data_fim)
    if (ini || fim) {
      where.data_hora = {
        ...(ini ? { gte: ini } : {}),
        ...(fim ? { lte: fim } : {}),
      }
    }

    const rows = await this.prisma.ponto_registros.findMany({
      where,
      orderBy: { data_hora: 'desc' },
      select: {
        id: true,
        tipo: true,
        origem: true,
        data_hora: true,

        latitude: true,
        longitude: true,
        precisao_metros: true,

        cep: true,
        rua: true,
        bairro: true,
        cidade: true,
        estado: true,

        ip: true,
        status: true,
        observacao: true,

        funcionario: { select: { id: true, nome: true } },
        dispositivo: { select: { id: true, device_nome: true, plataforma: true } },
      },
    })

    // mantém seu comportamento: garantir number ou null
    return rows.map((r) => ({
      ...r,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
    }))
  }

  // ✅ usado pelo endpoint GET /ponto/relatorio/pdf
  async relatorioMensalPdfData(params: { funcionario_id: number; mes: number; ano: number }) {
    const { funcionario_id, mes, ano } = params

    const dataIni = new Date(ano, mes - 1, 1, 0, 0, 0, 0)
    const dataFim = new Date(ano, mes, 1, 0, 0, 0, 0) // exclusivo

    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { id: true, nome: true },
    })

    const registros = await this.prisma.ponto_registros.findMany({
      where: {
        funcionario_id,
        data_hora: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data_hora: 'asc' },
      select: {
        id: true,
        data_hora: true,
        tipo: true,
        origem: true,
        status: true,
      },
    })

    const justificativas = await this.prisma.ponto_justificativas.findMany({
      where: {
        funcionario_id,
        data: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data: 'asc' },
      select: {
        id: true,
        data: true,
        tipo: true,
        descricao: true,
      },
    })

    return { funcionario, registros, justificativas }
  }
}
