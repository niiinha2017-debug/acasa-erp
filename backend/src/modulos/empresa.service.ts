// src/modulos/empresa/empresa.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmpresaService {
  constructor(private prisma: PrismaService) {}

  async buscar() {
    return this.prisma.empresa.findUnique({
      where: { id: 1 },
    });
  }

  async salvar(dados: any) {
    const { id, updated_at, ...rest } = dados;

    return this.prisma.empresa.upsert({
      where: { id: 1 },
      update: rest,
      create: { ...rest, id: 1 },
    });
  }

  /**
   * Testa se o WHATSAPP_API_TOKEN (do .env) é válido na API da Meta.
   * GET https://graph.facebook.com/v21.0/me com o token.
   */
  async testarWhatsAppToken(): Promise<{ ok: boolean; message?: string; details?: unknown }> {
    const token = process.env.WHATSAPP_API_TOKEN;
    if (!token || !String(token).trim()) {
      return { ok: false, message: 'WHATSAPP_API_TOKEN não está definido no .env' };
    }
    try {
      const url = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = (await res.json()) as { error?: { message?: string }; id?: string; name?: string };
      if (!res.ok) {
        return {
          ok: false,
          message: data?.error?.message || `Erro ${res.status} da API Meta`,
          details: data?.error ?? data,
        };
      }
      return {
        ok: true,
        message: 'Token válido. Conectado à conta/aplicação: ' + (data?.name || data?.id || 'Meta'),
        details: { id: data?.id, name: data?.name },
      };
    } catch (e: unknown) {
      const err = e as Error;
      return {
        ok: false,
        message: err?.message || 'Falha ao chamar a API da Meta',
        details: err?.message ? undefined : String(e),
      };
    }
  }
}
