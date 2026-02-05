import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter

  constructor(private readonly config: ConfigService) {
this.transporter = nodemailer.createTransport({
  host: this.config.get<string>('MAIL_HOST'),
  port: Number(this.config.get<string>('MAIL_PORT')),
  secure: this.config.get<string>('MAIL_SECURE') === 'true',
  auth: {
    user: this.config.get<string>('MAIL_USER'),
    pass: this.config.get<string>('MAIL_PASS'),
  },
  requireTLS: this.config.get<string>('MAIL_SECURE') !== 'true', // só pra 587
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
})

  }

  async enviarEmailTeste(para: string) {
    const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('MAIL_USER')

    try {
      const info = await this.transporter.sendMail({
        from,
        to: para,
        subject: 'ACASA-ERP - Teste de e-mail',
        text: 'Se você recebeu este e-mail, o SMTP do ACASA-ERP está OK.',
      })

      return { ok: true, messageId: info.messageId }
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Falha ao enviar e-mail: ${err?.message || 'erro desconhecido'}`,
      )
    }
  }
  async enviarSenhaProvisoria(para: string, senhaProvisoria: string, nome?: string) {
    const from =
      this.config.get<string>('MAIL_FROM') || this.config.get<string>('MAIL_USER')

    const text =
`Olá${nome ? `, ${nome}` : ''}.

Seu acesso ao ACASA ERP foi criado.

Sua senha provisória é: ${senhaProvisoria}

Entre no sistema e altere sua senha imediatamente.

— ACASA ERP`

    await this.transporter.sendMail({
      from,
      to: para,
      subject: 'ACASA-ERP - Senha provisória',
      text,
    })

    return { ok: true }
  }
async enviarAniversarioCliente(para: string, nome?: string) {
  const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('MAIL_USER')

  const text =
`Olá${nome ? `, ${nome}` : ''}!

Passando para te desejar um feliz aniversário! 🎉

— ACASA ERP`

  await this.transporter.sendMail({
    from,
    to: para,
    subject: 'ACASA-ERP - Feliz aniversário!',
    text,
  })

  return { ok: true }
}


}
