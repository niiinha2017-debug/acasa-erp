import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarClienteDto } from './dto/criar-cliente.dto'
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto'
import { Prisma } from '@prisma/client'


@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarClienteDto) {
    return this.prisma.cliente.create({
      data: {
        indicacao_id: dto.indicacao_id ?? null,
        nome_completo: dto.nome_completo,
        razao_social: dto.razao_social ?? null,
        data_nascimento: new Date(dto.data_nascimento),

        cpf: dto.cpf ?? null,
        rg: dto.rg ?? null,
        cnpj: dto.cnpj ?? null,
        ie: dto.ie ?? null,

        telefone: dto.telefone ?? null,
        whatsapp: dto.whatsapp ?? null,
        email: dto.email,

        cep: dto.cep ?? null,
        endereco: dto.endereco ?? null,
        numero: dto.numero ?? null,
        bairro: dto.bairro ?? null,
        cidade: dto.cidade ?? null,
        estado: dto.estado ?? null,

        enviar_aniversario_email: dto.enviar_aniversario_email ?? true,
        enviar_aniversario_whatsapp: dto.enviar_aniversario_whatsapp ?? false,
      },
    })
  }

  async listar() {
    return this.prisma.cliente.findMany({
      orderBy: { nome_completo: 'asc' },
    })
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
        data_nascimento: dto.data_nascimento ? new Date(dto.data_nascimento) : undefined,

        cpf: dto.cpf ?? undefined,
        rg: dto.rg ?? undefined,
        cnpj: dto.cnpj ?? undefined,
        ie: dto.ie ?? undefined,

        telefone: dto.telefone ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        email: dto.email ?? undefined,

        cep: dto.cep ?? undefined,
        endereco: dto.endereco ?? undefined,
        numero: dto.numero ?? undefined,
        bairro: dto.bairro ?? undefined,
        cidade: dto.cidade ?? undefined,
        estado: dto.estado ?? undefined,

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

  /**
   * Aniversariantes do dia (MySQL): compara mês-dia.
   * Se quiser filtrar por canal, use enviar: 'email' | 'whatsapp'
   */
  async aniversariantesDoDia(data: string, enviar?: 'email' | 'whatsapp') {
    const dt = new Date(data)
    if (Number.isNaN(dt.getTime())) throw new Error('Data inválida')

    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    const mmdd = `${mm}-${dd}`

    const filtro =
      enviar === 'email'
        ? Prisma.sql`AND enviar_aniversario_email = 1`
        : enviar === 'whatsapp'
          ? Prisma.sql`AND enviar_aniversario_whatsapp = 1`
          : Prisma.sql``

    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM clientes
        WHERE DATE_FORMAT(data_nascimento, '%m-%d') = ${mmdd}
        ${filtro}
        ORDER BY nome_completo ASC
      `,
    )
  }
}

