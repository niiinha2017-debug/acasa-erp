import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Dispara webhooks para n8n (self-hosted). Permite workflows como:
 * "Toda vez que o ponto fechar, calcule custo de hora extra e jogue no DRE"
 * Configure: N8N_WEBHOOK_URL_PONTO_BATIDO e/ou N8N_WEBHOOK_URL_RELATORIO no .env
 */
@Injectable()
export class N8nWebhookService {
  private readonly urlPontoBatido: string | undefined;
  private readonly urlRelatorio: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.urlPontoBatido = this.config.get<string>('N8N_WEBHOOK_URL_PONTO_BATIDO');
    this.urlRelatorio = this.config.get<string>('N8N_WEBHOOK_URL_RELATORIO');
  }

  private async post(url: string, payload: object): Promise<void> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn('[n8n] Webhook failed:', url, res.status, await res.text());
      }
    } catch (e) {
      console.warn('[n8n] Webhook error:', url, e);
    }
  }

  /** Dispara webhook quando um ponto é batido (para n8n processar custos, etc.). */
  async onPontoBatido(payload: {
    registro_id: number;
    funcionario_id: number;
    funcionario_nome: string;
    tipo: string;
    data_hora: string;
    origem?: string;
  }): Promise<void> {
    if (!this.urlPontoBatido) return;
    await this.post(this.urlPontoBatido, { evento: 'ponto_batido', ...payload });
  }

  /** Dispara webhook quando um relatório/espelho de ponto é gerado. */
  async onRelatorioGerado(payload: {
    funcionario_id: number;
    funcionario_nome: string;
    mes: number;
    ano: number;
    arquivo_id?: number;
  }): Promise<void> {
    if (!this.urlRelatorio) return;
    await this.post(this.urlRelatorio, { evento: 'relatorio_ponto_gerado', ...payload });
  }
}
