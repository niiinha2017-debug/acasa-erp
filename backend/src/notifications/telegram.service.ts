import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Telegram Bot API - 100% grátis.
 * Envia notificações de "Ponto Batido" ou "Relatório Disponível" para o celular.
 * Configure: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID (gestor) no .env
 */
@Injectable()
export class TelegramService {
  private readonly botToken: string | undefined;
  private readonly defaultChatId: string | undefined;
  private readonly baseUrl = 'https://api.telegram.org/bot';

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.defaultChatId = this.config.get<string>('TELEGRAM_CHAT_ID');
  }

  get isConfigured(): boolean {
    return Boolean(this.botToken && this.defaultChatId);
  }

  /**
   * Envia mensagem para um chat (ou chat padrão do gestor).
   */
  async sendMessage(text: string, chatId?: string): Promise<boolean> {
    const cid = chatId || this.defaultChatId;
    if (!this.botToken || !cid) return false;

    try {
      const url = `${this.baseUrl}${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cid,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn('[Telegram] sendMessage failed:', res.status, err);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Telegram] sendMessage error:', e);
      return false;
    }
  }

  /**
   * Notificação de ponto batido (para gestor ou funcionário).
   */
  async sendPontoBatido(
    nomeFuncionario: string,
    tipo: 'ENTRADA' | 'SAIDA',
    dataHora: Date,
  ): Promise<boolean> {
    const hora = dataHora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const label = tipo === 'ENTRADA' ? 'Entrada' : 'Saída';
    const text = `🕐 <b>Ponto registrado</b>\n${nomeFuncionario}\n${label} às ${hora}`;
    return this.sendMessage(text);
  }

  /**
   * Notificação de relatório de ponto disponível (espelho mensal).
   */
  async sendRelatorioDisponivel(
    nomeFuncionario: string,
    mes: number,
    ano: number,
    linkOuMensagem?: string,
  ): Promise<boolean> {
    const ref = `${String(mes).padStart(2, '0')}/${ano}`;
    let text = `📋 <b>Espelho de ponto disponível</b>\n${nomeFuncionario} - Ref. ${ref}`;
    if (linkOuMensagem) text += `\n${linkOuMensagem}`;
    return this.sendMessage(text);
  }
}
