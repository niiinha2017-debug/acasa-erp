import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

const INTEGRATION_BAILEYS = 'WHATSAPP-BAILEYS';

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface CreateInstanceResult {
  instanceName: string;
  instanceId?: string;
  status?: string;
  qrCodeBase64?: string;
  pairingCode?: string;
}

export interface SendMessageResult {
  key?: { remoteJid: string; fromMe: boolean; id: string };
  messageTimestamp?: string;
  status?: string;
}

export interface SendMediaOptions {
  caption?: string;
  fileName?: string;
  mimetype?: string;
  /** 'image' | 'video' | 'document' */
  mediatype?: 'image' | 'video' | 'document';
}

/**
 * Integração com Evolution API (WhatsApp via Baileys).
 * Configuração: tabela empresa (evolution_api_url, evolution_api_key, evolution_instance_name) ou .env.
 */
@Injectable()
export class EvolutionService {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /** Configuração vinda da empresa (banco) ou .env. */
  async getConfig(): Promise<EvolutionConfig | null> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: 1 },
      select: {
        evolution_api_url: true,
        evolution_api_key: true,
        evolution_instance_name: true,
      },
    });
    const url = (empresa?.evolution_api_url || this.config.get<string>('EVOLUTION_API_URL') || '').trim().replace(/\/$/, '');
    const key = (empresa?.evolution_api_key || this.config.get<string>('EVOLUTION_API_KEY') || '').trim();
    const instance = (empresa?.evolution_instance_name || this.config.get<string>('EVOLUTION_INSTANCE_NAME') || 'acasa-erp').trim() || 'acasa-erp';
    if (!url || !key) return null;
    return { baseUrl: url, apiKey: key, instanceName: instance };
  }

  private headers(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: apiKey,
    };
  }

  /** Verifica se há configuração (empresa ou .env). Síncrono apenas para env. */
  get isConfigured(): boolean {
    const url = (this.config.get<string>('EVOLUTION_API_URL') || '').trim();
    const key = (this.config.get<string>('EVOLUTION_API_KEY') || '').trim();
    return Boolean(url && key);
  }

  async isConfiguredAsync(): Promise<boolean> {
    const c = await this.getConfig();
    return Boolean(c?.baseUrl && c?.apiKey);
  }

  /**
   * Testa a conexão com a Evolution API e o estado da instância (para exibir em Configurações).
   */
  async testConnection(): Promise<{ ok: boolean; message?: string; details?: unknown }> {
    const c = await this.getConfig();
    if (!c) {
      return { ok: false, message: 'Evolution API não configurada. Preencha URL, API Key e Nome da instância em Configurações > Contato.' };
    }
    try {
      const res = await fetch(
        `${c.baseUrl}/instance/connectionState/${encodeURIComponent(c.instanceName)}`,
        { headers: { apikey: c.apiKey } },
      );
      const data = (await res.json()) as { instance?: { state?: string }; error?: string; message?: string };
      if (!res.ok) {
        return {
          ok: false,
          message: data?.message || data?.error || `Erro ${res.status} da Evolution API`,
          details: data,
        };
      }
      const state = data?.instance?.state;
      if (state === 'open') {
        return { ok: true, message: 'Evolution API conectada. Instância "' + c.instanceName + '" está conectada ao WhatsApp.', details: data };
      }
      return {
        ok: false,
        message: state ? `Instância "${c.instanceName}" não está conectada (estado: ${state}). Escaneie o QR Code na Evolution API.` : 'Resposta inválida da Evolution API.',
        details: data,
      };
    } catch (e: unknown) {
      const err = e as Error;
      return {
        ok: false,
        message: err?.message || 'Falha ao conectar na Evolution API. Verifique a URL e se o servidor está no ar.',
        details: err?.message ? undefined : String(e),
      };
    }
  }

  /**
   * Cria uma instância na Evolution API e retorna o QR Code em base64
   * para exibir no dashboard (conectar WhatsApp).
   */
  async createInstance(
    instanceName?: string,
  ): Promise<CreateInstanceResult | null> {
    const c = await this.getConfig();
    if (!c) return null;
    const name = instanceName || c.instanceName;

    try {
      await firstValueFrom(
        this.httpService.post(
          `${c.baseUrl}/instance/create`,
          {
            instanceName: name,
            integration: INTEGRATION_BAILEYS,
            qrcode: true,
          },
          { headers: this.headers(c.apiKey) },
        ),
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (status === 403 && data) {
        throw new Error(
          `Evolution API: instância "${name}" já existe ou nome em uso.`,
        );
      }
      throw err;
    }

    const connect = await this.fetchQrCode(name);
    return {
      instanceName: name,
      qrCodeBase64: connect?.code,
      pairingCode: connect?.pairingCode,
    };
  }

  /**
   * Obtém o QR Code atual da instância (para reconectar ou exibir no dashboard).
   */
  async fetchQrCode(
    instanceName?: string,
  ): Promise<{ code?: string; pairingCode?: string; count?: number } | null> {
    const c = await this.getConfig();
    if (!c) return null;
    const name = instanceName || c.instanceName;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ code?: string; pairingCode?: string; count?: number }>(
          `${c.baseUrl}/instance/connect/${encodeURIComponent(name)}`,
          { headers: this.headers(c.apiKey) },
        ),
      );
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Envia mensagem de texto para um número (remoteJid).
   * @param remoteJid Número com DDI, ex: 5581999990000 ou 5581999990000@s.whatsapp.net
   * @param text Texto da mensagem
   */
  async sendMessage(
    remoteJid: string,
    text: string,
    instanceName?: string,
  ): Promise<SendMessageResult | null> {
    const c = await this.getConfig();
    if (!c) return null;
    const name = instanceName || c.instanceName;
    const number = this.normalizeNumber(remoteJid);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<SendMessageResult>(
          `${c.baseUrl}/message/sendText/${encodeURIComponent(name)}`,
          { number, text },
          { headers: this.headers(c.apiKey) },
        ),
      );
      return data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      throw new Error(msg || 'Falha ao enviar mensagem via Evolution API');
    }
  }

  /**
   * Envia mídia (PDF de orçamento, foto da Medição Fina, etc.).
   * @param remoteJid Número com DDI
   * @param media URL pública ou base64 do arquivo
   * @param options caption, fileName, mimetype, mediatype (image|video|document)
   */
  async sendMedia(
    remoteJid: string,
    media: string,
    options: SendMediaOptions = {},
    instanceName?: string,
  ): Promise<SendMessageResult | null> {
    const c = await this.getConfig();
    if (!c) return null;
    const name = instanceName || c.instanceName;
    const number = this.normalizeNumber(remoteJid);

    const mimetype =
      options.mimetype ||
      (options.mediatype === 'document' ? 'application/pdf' : 'image/jpeg');
    const mediatype = options.mediatype || 'document';
    const caption = options.caption ?? '';
    const fileName = options.fileName ?? 'arquivo.pdf';

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<SendMessageResult>(
          `${c.baseUrl}/message/sendMedia/${encodeURIComponent(name)}`,
          {
            number,
            mediatype,
            mimetype,
            caption,
            media,
            fileName,
          },
          { headers: this.headers(c.apiKey) },
        ),
      );
      return data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      throw new Error(msg || 'Falha ao enviar mídia via Evolution API');
    }
  }

  private normalizeNumber(remoteJid: string): string {
    const raw = String(remoteJid).replace(/\D/g, '');
    if (raw.length < 10) return remoteJid;
    return raw.startsWith('55') ? raw : '55' + raw;
  }
}
