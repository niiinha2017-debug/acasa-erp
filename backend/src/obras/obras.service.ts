import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type AtualizarObraPayload = {
  cliente_id?: number

  data_medida?: string | Date | null
  data_orcamento?: string | Date | null
  data_medida_fina?: string | Date | null
  data_producao?: string | Date | null
  data_montagem?: string | Date | null
}

@Injectable()
export class ObrasService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // HELPERS
  // =====================================================

  private toDate(value: any): Date | null {
    if (value === null || value === undefined || value === '') return null
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida')
    return d
  }

  /**
   * Regra do processo (preview/automático):
   * - agendou data -> avança status
   * - não inventa intermediárias aqui (isso virá depois)
   * - prioridade da última etapa com data preenchida
   */
private calcularStatusPorDatas(dados: {
  data_montagem?: Date | null
  data_producao?: Date | null
  data_medida_fina?: Date | null
  data_orcamento?: Date | null
  data_medida?: Date | null
}): string {
  const now = new Date()

  const isValid = (d?: Date | null) => d instanceof Date && !Number.isNaN(d.getTime())
  const isFuture = (d: Date) => d.getTime() > now.getTime()

  // =====================================================
  // MONTAGEM (prioridade mais alta)
  // =====================================================
  if (isValid(dados.data_montagem)) {
    const d = dados.data_montagem as Date
    // sem campo "finalizada": quando passa, vira EM_MONTAGEM (você disse “já passou a data”)
    return isFuture(d) ? 'MONTAGEM_AGENDADA' : 'EM_MONTAGEM'
  }

  // =====================================================
  // PRODUÇÃO
  // =====================================================
  if (isValid(dados.data_producao)) {
    const d = dados.data_producao as Date
    return isFuture(d) ? 'PRODUCAO_AGENDADA' : 'EM_PRODUCAO'
  }

  // =====================================================
  // MEDIDA FINA
  // =====================================================
  if (isValid(dados.data_medida_fina)) {
    const d = dados.data_medida_fina as Date
    return isFuture(d) ? 'MEDIDA_FINA_AGENDADA' : 'MEDIDA_FINA_REALIZADA'
  }

  // =====================================================
  // ORÇAMENTO (você só tem data_orcamento hoje)
  // - se tem data futura: "ORCAMENTO_EM_ANDAMENTO" (ou "AGENDAR"? você não tem AGENDAR_ORCAMENTO no model)
  // - se passou: você precisa decidir o próximo marco (ENVIADO/NEGOCIACAO/APROVADO etc.)
  //   como não há campo para isso, não invento: fica EM_ANDAMENTO.
  // =====================================================
  if (isValid(dados.data_orcamento)) {
    return 'ORCAMENTO_EM_ANDAMENTO'
  }

  // =====================================================
  // MEDIDA INICIAL
  // =====================================================
  if (isValid(dados.data_medida)) {
    const d = dados.data_medida as Date
    return isFuture(d) ? 'MEDIDA_AGENDADA' : 'MEDIDA_REALIZADA'
  }

  // =====================================================
  // Sem datas: pendência inicial
  // =====================================================
  return 'AGENDAR_MEDIDA'
}

  private async garantirExiste(id: number) {
    const obra = await this.prisma.obras.findUnique({ where: { id } })
    if (!obra) throw new NotFoundException('Obra não encontrada')
    return obra
  }

  // =====================================================
  // CREATE
  // =====================================================

  async criarObra(body: AtualizarObraPayload) {
    if (!body?.cliente_id) throw new BadRequestException('cliente_id é obrigatório')

    const data_medida = this.toDate(body.data_medida)
    const data_orcamento = this.toDate(body.data_orcamento)
    const data_medida_fina = this.toDate(body.data_medida_fina)
    const data_producao = this.toDate(body.data_producao)
    const data_montagem = this.toDate(body.data_montagem)

    const status_calculado = this.calcularStatusPorDatas({
      data_medida,
      data_orcamento,
      data_medida_fina,
      data_producao,
      data_montagem,
    })

    const status_processo = status_calculado

    // valida cliente existir (pra não estourar FK silencioso)
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: body.cliente_id },
      select: { id: true },
    })
    if (!cliente) throw new BadRequestException('Cliente não encontrado')

    return this.prisma.obras.create({
      data: {
        cliente_id: body.cliente_id,
        status_processo,
        data_medida,
        data_orcamento,
        data_medida_fina,
        data_producao,
        data_montagem,
      },
    })
  }

  // =====================================================
  // READ
  // =====================================================

async buscarPorId(id: number) {
  const obra = await this.prisma.obras.findUnique({
    where: { id },
    include: { cliente: true },
  })
  if (!obra) throw new NotFoundException('Obra não encontrada')

  const novoStatus = this.calcularStatusPorDatas({
    data_medida: obra.data_medida,
    data_orcamento: obra.data_orcamento,
    data_medida_fina: obra.data_medida_fina,
    data_producao: obra.data_producao,
    data_montagem: obra.data_montagem,
  })

  if (novoStatus !== obra.status_processo) {
    await this.prisma.obras.update({
      where: { id: obra.id },
      data: { status_processo: novoStatus },
    })
    ;(obra as any).status_processo = novoStatus
  }

  return obra
}


async buscarPorCliente(clienteId: number) {
  const obras = await this.prisma.obras.findMany({
    where: { cliente_id: clienteId },
    orderBy: { atualizado_em: 'desc' },
  })

  // auto-correção best effort (não trava a listagem se der erro)
  for (const o of obras) {
    const novoStatus = this.calcularStatusPorDatas({
      data_medida: o.data_medida,
      data_orcamento: o.data_orcamento,
      data_medida_fina: o.data_medida_fina,
      data_producao: o.data_producao,
      data_montagem: o.data_montagem,
    })

    if (novoStatus !== o.status_processo) {
      try {
        await this.prisma.obras.update({
          where: { id: o.id },
          data: { status_processo: novoStatus },
        })
        ;(o as any).status_processo = novoStatus
      } catch {}
    }
  }

  return obras
}


  // =====================================================
  // UPDATE
  // =====================================================

  async atualizar(id: number, body: AtualizarObraPayload) {
    const atual = await this.garantirExiste(id)

    const data_medida = body.data_medida !== undefined ? this.toDate(body.data_medida) : atual.data_medida
    const data_orcamento =
      body.data_orcamento !== undefined ? this.toDate(body.data_orcamento) : atual.data_orcamento
    const data_medida_fina =
      body.data_medida_fina !== undefined ? this.toDate(body.data_medida_fina) : atual.data_medida_fina
    const data_producao =
      body.data_producao !== undefined ? this.toDate(body.data_producao) : atual.data_producao
    const data_montagem =
      body.data_montagem !== undefined ? this.toDate(body.data_montagem) : atual.data_montagem

    // status: se vier explícito no body, respeita.
    // se não vier, calcula por datas (regra que você definiu).
const status_processo = this.calcularStatusPorDatas({
  data_medida,
  data_orcamento,
  data_medida_fina,
  data_producao,
  data_montagem,
})


    return this.prisma.obras.update({
      where: { id },
      data: {
        status_processo,
        data_medida,
        data_orcamento,
        data_medida_fina,
        data_producao,
        data_montagem,
      },
    })
  }
}
