// src/modulos/empresa/empresa.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvolutionService } from '../evolution/evolution.service';

interface TestarEvolutionApiInput {
  evolution_api_url?: string;
  evolution_api_key?: string;
  evolution_instance_name?: string;
}

@Injectable()
export class EmpresaService {
  constructor(
    private prisma: PrismaService,
    private evolution: EvolutionService,
  ) {}

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
   * Testa a conexão com a Evolution API (WhatsApp). Usa configuração salva na empresa ou .env.
   */
  async testarEvolutionApi(config?: TestarEvolutionApiInput): Promise<{ ok: boolean; message?: string; details?: unknown }> {
    return this.evolution.testConnection({
      baseUrl: config?.evolution_api_url,
      apiKey: config?.evolution_api_key,
      instanceName: config?.evolution_instance_name,
    });
  }
}
