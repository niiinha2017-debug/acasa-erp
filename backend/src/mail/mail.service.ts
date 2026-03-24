import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly brevoApiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.brevoApiKey = this.config.get<string>('BREVO_API_KEY');
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
    });
  }

  private async sendSmtpMail(
    options: nodemailer.SendMailOptions,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const info = await this.transporter.sendMail(options);
      const accepted = Array.isArray(info.accepted)
        ? info.accepted.map((item) => String(item).toLowerCase())
        : [];
      const expectedRecipients = [options.to]
        .flat()
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());

      if (
        expectedRecipients.length > 0 &&
        !expectedRecipients.some((recipient) => accepted.includes(recipient))
      ) {
        throw new InternalServerErrorException(
          'SMTP nao confirmou o destinatario do e-mail.',
        );
      }

      return info;
    } catch (err: any) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(
        `Falha ao enviar e-mail: ${err?.message || 'erro desconhecido'}`,
      );
    }
  }

  async enviarEmailTeste(para: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    const info = await this.sendSmtpMail({
      from,
      to: para,
      subject: 'ACASA-ERP - Teste de e-mail',
      text: 'Se você recebeu este e-mail, o SMTP do ACASA-ERP está OK.',
    });

    return { ok: true, messageId: info.messageId };
  }
  /**
   * Envia e-mail com senha provisória. dataRegistro em UTC/Date; exibida em horário de Brasília.
   */
  async enviarSenhaProvisoria(
    para: string,
    senhaProvisoria: string,
    nome?: string,
    dataRegistro?: Date,
  ) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    const dataRef = dataRegistro ?? new Date();
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(dataRef);

    const text = `Olá${nome ? `, ${nome}` : ''}.

Seu acesso ao ACASA ERP foi criado em ${dataFormatada} (horário de Brasília).

Sua senha provisória é: ${senhaProvisoria}

Entre no sistema e altere sua senha imediatamente.

— ACASA ERP`;

    const info = await this.sendSmtpMail({
      from,
      to: para,
      subject: 'ACASA-ERP - Senha provisória',
      text,
    });

    return { ok: true, messageId: info.messageId };
  }
  async enviarAniversarioCliente(para: string, nome?: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    const text = `Olá${nome ? `, ${nome}` : ''}!

Passando para te desejar um feliz aniversário! 🎉

— ACASA ERP`;

    const info = await this.sendSmtpMail({
      from,
      to: para,
      subject: 'ACASA-ERP - Feliz aniversário!',
      text,
    });

    return { ok: true, messageId: info.messageId };
  }

  /**
   * Envia o link do PDF do contrato por e-mail (SMTP do .env).
   * O cliente acessa o link para visualizar e baixar o PDF. Sem assinatura interna/subdomínio.
   */
  async enviarContratoLink(
    para: string,
    nomeCliente: string,
    link: string,
  ): Promise<{ ok: boolean }> {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');

    const subject = 'Link do contrato (PDF)';
    const text = `Olá${nomeCliente ? `, ${nomeCliente}` : ''},\n\nSegue o link para visualizar e baixar o PDF do contrato (válido por 24h):\n\n${link}\n\nAtt.`;
    const html = `<!DOCTYPE html><html><body><p>Olá${nomeCliente ? `, ${nomeCliente}` : ''},</p><p>Segue o link para visualizar e baixar o PDF do contrato (válido por 24h):</p><p><a href="${link}">${link}</a></p><p>Att.</p></body></html>`;

    const info = await this.sendSmtpMail({
      from,
      to: para,
      subject,
      text,
      html,
    });

    return { ok: true, messageId: info.messageId };
  }

  /**
   * Envia espelho de ponto mensal por e-mail (até 300/dia grátis com Brevo).
   * Se BREVO_API_KEY estiver definido, usa Brevo; senão usa SMTP (nodemailer).
   * pdfBuffer opcional: anexa o PDF ao e-mail.
   */
  async enviarEspelhoPonto(
    para: string,
    nome: string,
    mes: number,
    ano: number,
    pdfBuffer?: Buffer,
  ): Promise<{ ok: boolean }> {
    const ref = `${String(mes).padStart(2, '0')}/${ano}`;
    const subject = `ACASA-ERP - Espelho de ponto ${ref}`;
    const text = `Olá${nome ? `, ${nome}` : ''}.\n\nSegue em anexo o espelho de ponto referente a ${ref}.\n\n— ACASA ERP`;
    const html = `<!DOCTYPE html><html><body><p>Olá${nome ? `, ${nome}` : ''}.</p><p>Segue em anexo o espelho de ponto referente a <strong>${ref}</strong>.</p><p>— ACASA ERP</p></body></html>`;

    if (this.brevoApiKey) {
      try {
        const body: Record<string, unknown> = {
          sender: {
            email:
              this.config.get<string>('MAIL_USER') ||
              this.config.get<string>('BREVO_SENDER_EMAIL') ||
              'noreply@acasa.com',
            name:
              this.config
                .get<string>('MAIL_FROM')
                ?.replace(/^[^<]*<[^>]+>$/, '')
                .trim() || 'ACASA ERP',
          },
          to: [{ email: para }],
          subject,
          htmlContent: html,
        };
        if (pdfBuffer && pdfBuffer.length) {
          body.attachment = [
            {
              name: `espelho-ponto-${ref.replace('/', '-')}.pdf`,
              content: pdfBuffer.toString('base64'),
            },
          ];
        }
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Brevo: ${res.status} ${err}`);
        }
        return { ok: true };
      } catch (e: any) {
        throw new InternalServerErrorException(
          `Falha ao enviar e-mail (Brevo): ${e?.message || 'erro desconhecido'}`,
        );
      }
    }

    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER');
    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to: para,
      subject,
      text,
      html: html,
    };
    if (pdfBuffer && pdfBuffer.length) {
      mailOptions.attachments = [
        {
          filename: `espelho-ponto-${ref.replace('/', '-')}.pdf`,
          content: pdfBuffer,
        },
      ];
    }
    const info = await this.sendSmtpMail(mailOptions);
    return { ok: true, messageId: info.messageId };
  }
}
