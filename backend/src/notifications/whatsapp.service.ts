import { Injectable } from '@nestjs/common';

/**
 * WhatsApp Cloud API (Meta).
 * Envio de mensagens de texto usando WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID do .env.
 */
@Injectable()
export class WhatsAppService {
  private readonly baseUrl = 'https://graph.facebook.com/v21.0';

  get isConfigured(): boolean {
    return Boolean(
      process.env.WHATSAPP_API_TOKEN?.trim() &&
        process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
    );
  }

  /**
   * Envia mensagem de texto para um número WhatsApp.
   * @param to Número com DDI, só dígitos (ex: 5511999999999).
   * @param text Texto da mensagem.
   */
  async sendText(
    to: string,
    text: string,
  ): Promise<{ ok: boolean; messageId?: string; error?: string }> {
    const token = process.env.WHATSAPP_API_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!token || !phoneNumberId) {
      return {
        ok: false,
        error:
          'WHATSAPP_API_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurados no .env',
      };
    }
    const onlyDigits = String(to).replace(/\D/g, '');
    if (onlyDigits.length < 10) {
      return { ok: false, error: 'Número de telefone inválido.' };
    }
    const toNumber = onlyDigits.startsWith('55')
      ? onlyDigits
      : '55' + onlyDigits;

    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toNumber,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      });
      const data = (await res.json()) as {
        messages?: { id: string }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        return {
          ok: false,
          error: data?.error?.message || `Erro ${res.status} da API WhatsApp`,
        };
      }
      const messageId = data?.messages?.[0]?.id;
      return { ok: true, messageId };
    } catch (e: unknown) {
      const err = e as Error;
      return {
        ok: false,
        error: err?.message || 'Falha ao enviar mensagem WhatsApp',
      };
    }
  }
}
