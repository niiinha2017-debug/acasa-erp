import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const rawPass = this.config.get<string>('MAIL_PASS') ?? '';
    // Gmail app password is often copied with spaces every 4 chars.
    const normalizedPass = rawPass.replace(/\s+/g, '');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get<string>('MAIL_PORT')),
      secure: this.config.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: normalizedPass,
      },
      requireTLS: this.config.get<string>('MAIL_SECURE') !== 'true',
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async enviarEmailTeste(para: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    try {
      const info = await this.transporter.sendMail({
        from,
        to: para,
        subject: 'ACASA-ERP - Teste de e-mail',
        text: 'Se voce recebeu este e-mail, o SMTP do ACASA-ERP esta OK.',
      });

      return { ok: true, messageId: info.messageId };
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Falha ao enviar e-mail: ${err?.message || 'erro desconhecido'}`,
      );
    }
  }

  async enviarSenhaProvisoria(
    para: string,
    senhaProvisoria: string,
    nome?: string,
  ) {
    const destino = String(para || '').trim().toLowerCase();
    if (!destino || !destino.includes('@')) {
      throw new InternalServerErrorException(
        'Destinatario de senha provisoria invalido',
      );
    }

    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    const text = `Ola${nome ? `, ${nome}` : ''}.

Seu acesso ao ACASA ERP foi criado.

Sua senha provisoria e: ${senhaProvisoria}

Entre no sistema e altere sua senha imediatamente.

- ACASA ERP`;

    await this.transporter.sendMail({
      from,
      to: destino,
      subject: 'ACASA-ERP - Senha provisoria',
      text,
    });

    this.logger.log(`Senha provisoria enviada para: ${destino}`);
    return { ok: true };
  }

  async enviarAniversarioCliente(para: string, nome?: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    const text = `Ola${nome ? `, ${nome}` : ''}!

Passando para te desejar um feliz aniversario!

- ACASA ERP`;

    await this.transporter.sendMail({
      from,
      to: para,
      subject: 'ACASA-ERP - Feliz aniversario!',
      text,
    });

    return { ok: true };
  }
}
