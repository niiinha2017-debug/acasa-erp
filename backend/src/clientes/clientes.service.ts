import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarClienteDto } from './dto/criar-cliente.dto'
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

async criar(dto: CriarClienteDto) {
  return this.prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.create({
      data: {
        indicacao_id: dto.indicacao_id ?? null,

        nome_completo: dto.nome_completo,
        razao_social: dto.razao_social ?? null,
        nome_fantasia: dto.nome_fantasia ?? null,

        data_nascimento: dto.data_nascimento ? new Date(dto.data_nascimento) : null,

        cpf: dto.cpf ?? null,
        rg: dto.rg ?? null,
        cnpj: dto.cnpj ?? null,
        ie: dto.ie ?? null,

        telefone: dto.telefone ?? null,
        whatsapp: dto.whatsapp ?? null,
        email: dto.email ?? null,

        estado_civil: dto.estado_civil ?? null,
        nome_conjuge: dto.estado_civil === 'CASADO' ? (dto.nome_conjuge ?? null) : null,

        cep: dto.cep ?? null,
        endereco: dto.endereco ?? null,
        numero: dto.numero ?? null,
        complemento: dto.complemento ?? null,
        bairro: dto.bairro ?? null,
        cidade: dto.cidade ?? null,
        estado: dto.estado ?? null,

        status: dto.status,

        enviar_aniversario_email: dto.enviar_aniversario_email ?? true,
        enviar_aniversario_whatsapp: dto.enviar_aniversario_whatsapp ?? false,
      },
    })

    await tx.obras.create({
      data: {
        cliente_id: cliente.id,
        status_processo: 'CLIENTE_CADASTRADO',
        // ⚠️ se obras tiver campos obrigatórios além desses, precisa preencher aqui
      },
    })

    return cliente
  })
}

async listar() {
  const rows = await this.prisma.cliente.findMany({
    orderBy: { nome_completo: 'asc' },
    include: {
      obras: {
        orderBy: { id: 'desc' },
        take: 1,
        select: { id: true, status_processo: true },
      },
    },
  })

  // você quer o status do pipeline: vem da última obra (status_processo)
  return rows.map((c) => ({
    ...c,
    pipeline_status: c.obras?.[0]?.status_processo ?? null,
  }))
}



  async buscarPorId(id: number) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } })
    if (!cliente) throw new NotFoundException('Cliente não encontrado')
    return cliente
  }

  async atualizar(id: number, dto: AtualizarClienteDto) {
    await this.buscarPorId(id)

    return this.prisma.cliente.update({
      where: { id },
data: {
  indicacao_id: dto.indicacao_id ?? undefined,

  nome_completo: dto.nome_completo ?? undefined,
  razao_social: dto.razao_social ?? undefined,
  nome_fantasia: dto.nome_fantasia ?? undefined,

  data_nascimento: dto.data_nascimento ? new Date(dto.data_nascimento) : undefined,

  cpf: dto.cpf ?? undefined,
  rg: dto.rg ?? undefined,
  cnpj: dto.cnpj ?? undefined,
  ie: dto.ie ?? undefined,

  telefone: dto.telefone ?? undefined,
  whatsapp: dto.whatsapp ?? undefined,
  email: dto.email ?? undefined, // <-- não apaga se não veio

  estado_civil: dto.estado_civil ?? undefined,
  nome_conjuge:
    dto.estado_civil === undefined
      ? dto.nome_conjuge ?? undefined
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

  status: dto.status ?? undefined,

  enviar_aniversario_email: dto.enviar_aniversario_email ?? undefined,
  enviar_aniversario_whatsapp: dto.enviar_aniversario_whatsapp ?? undefined,
},

    })
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    await this.prisma.cliente.delete({ where: { id } })
    return { ok: true }
  }

  async select(q?: string) {
  const termo = String(q || '').trim()

  const rows = await this.prisma.cliente.findMany({
    where: {
      status: 'ATIVO',
      ...(termo
        ? {
            OR: [
              { nome_completo: { contains: termo } },
              { razao_social: { contains: termo } },
              { cpf: { contains: termo } },
              { cnpj: { contains: termo } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nome_completo: true,
      razao_social: true,
    },
    orderBy: { nome_completo: 'asc' },
    take: 50,
  })

  return rows.map((c) => ({
    value: c.id,
    label: c.nome_completo || c.razao_social || `ID #${c.id}`,
  }))
}


  async aniversariantesDoDia(data: string, enviar?: 'email' | 'whatsapp') {
    const dt = new Date(data)
    if (Number.isNaN(dt.getTime())) throw new Error('Data inválida')

    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    const mmdd = `${mm}-${dd}`

const filtro =
  enviar === 'email'
    ? Prisma.sql`AND enviar_aniversario_email = 1 AND email IS NOT NULL AND email <> ''`
: enviar === 'whatsapp'
  ? Prisma.sql`AND enviar_aniversario_whatsapp = 1 AND whatsapp IS NOT NULL AND whatsapp <> ''`
  : Prisma.sql``


return this.prisma.$queryRaw(
  Prisma.sql`
    SELECT *
    FROM clientes
    WHERE data_nascimento IS NOT NULL
      AND DATE_FORMAT(data_nascimento, '%m-%d') = ${mmdd}
    ${filtro}
    ORDER BY nome_completo ASC
  `,
)

  }
}
