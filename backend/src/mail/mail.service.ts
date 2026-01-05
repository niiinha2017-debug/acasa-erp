import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true', // false no 587 (STARTTLS)
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  async enviarEmailTeste(para: string) {
    try {
      const from = process.env.MAIL_FROM || process.env.MAIL_USER
      const info = await this.transporter.sendMail({
        from,
        to: para,
        subject: 'Teste ACASA ERP',
        text: 'Envio de e-mail funcionando ✅',
        html: `<p>Envio de e-mail funcionando ✅</p>`,
      })

      return { ok: true, messageId: info.messageId }
    } catch (e) {
      throw new InternalServerErrorException('Falha ao enviar e-mail (SMTP).')
    }
  }
}
