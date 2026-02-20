import { Injectable } from '@nestjs/common';

/**
 * API de feriados nacionais (Brasil) - 100% grátis, sem API key.
 * Brasil API: https://brasilapi.com.br/api/feriados/v1/{ano}
 */
export type FeriadoItem = {
  date: string; // YYYY-MM-DD
  name: string;
  type: string;
};

@Injectable()
export class FeriadosService {
  private readonly baseUrl = 'https://brasilapi.com.br/api/feriados/v1';

  /**
   * Retorna os feriados nacionais do ano.
   */
  async getFeriadosPorAno(ano: number): Promise<FeriadoItem[]> {
    const url = `${this.baseUrl}/${ano}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('[Feriados] API falhou:', res.status, await res.text());
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('[Feriados] Erro ao buscar:', e);
      return [];
    }
  }

  /**
   * Retorna os feriados de um mês específico (ano + mês 1-12).
   */
  async getFeriadosPorMes(ano: number, mes: number): Promise<FeriadoItem[]> {
    const todos = await this.getFeriadosPorAno(ano);
    const prefix = `${ano}-${String(mes).padStart(2, '0')}-`;
    return todos.filter((f) => f.date && f.date.startsWith(prefix));
  }
}
