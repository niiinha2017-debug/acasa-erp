import { Injectable } from '@nestjs/common'
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

  private parseYmd(ymd?: string) {
    if (!ymd) return undefined
    const [y, m, d] = String(ymd).split('-').map((n) => Number(n))
    if (!y || !m || !d) return undefined
    return new Date(y, m - 1, d)
  }

  private inicioDia(ymd?: string) {
    const d = this.parseYmd(ymd)
    if (!d) return undefined
    d.setHours(0, 0, 0, 0)
    return d
  }

  private fimDia(ymd?: string) {
    const d = this.parseYmd(ymd)
    if (!d) return undefined
    d.setHours(23, 59, 59, 999)
    return d
  }

  async listar(f: Filtros) {
    const where: any = {}

    if (f.funcionario_id) {
      const id = Number(String(f.funcionario_id).replace(/\D/g, ''))
      if (id) where.funcionario_id = id
    }

    if (f.tipo) where.tipo = f.tipo
    if (f.origem) where.origem = f.origem
    if (f.status) where.status = f.status

    const ini = this.inicioDia(f.data_ini)
    const fim = this.fimDia(f.data_fim)
    if (ini || fim) {
      where.data_hora = {}
      if (ini) where.data_hora.gte = ini
      if (fim) where.data_hora.lte = fim
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
        localidade: true,
        ip: true,
        status: true,
        observacao: true,

        funcionario: { select: { id: true, nome: true } },
        dispositivo: { select: { id: true, device_nome: true, plataforma: true } },
      },
    })

    // opcional (ajuda no mapa)
    return rows.map((r: any) => ({
      ...r,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
    }))
  }
}
