import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'

@Injectable()
export class ClientesAniversarioJob {
  private readonly logger = new Logger(ClientesAniversarioJob.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // todo dia às 08:00 (São Paulo)
  @Cron('08:35', { timeZone: 'America/Sao_Paulo' })
  async executar() {
    const hoje = new Date()
    const dia = hoje.getDate()
    const mes = hoje.getMonth() + 1

    const clientes = await this.prisma.cliente.findMany({
      where: {
        status: 'ATIVO',
        enviar_aniversario_email: true,
        email: { not: null },
        data_nascimento: { not: null },
      },
      select: {
        id: true,
        nome_completo: true,
        razao_social: true,
        email: true,
        data_nascimento: true,
      },
    })

    const aniversariantes = clientes.filter((c) => {
      const d = new Date(c.data_nascimento as any)
      return d.getDate() === dia && (d.getMonth() + 1) === mes
    })

    if (!aniversariantes.length) return

    for (const c of aniversariantes) {
      const nome = c.nome_completo || c.razao_social || undefined
      try {
        await this.mail.enviarAniversarioCliente(String(c.email), nome)
        this.logger.log(`Aniversário enviado: cliente ${c.id} -> ${c.email}`)
      } catch (e: any) {
        this.logger.error(`Falha enviando aniversário cliente ${c.id}: ${e?.message || e}`)
      }
    }
  }
}
