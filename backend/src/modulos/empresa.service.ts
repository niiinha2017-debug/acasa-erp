// src/modulos/empresa/empresa.service.ts
import { Injectable } from '@nestjs/common';
// Use dois pontos para subir um nível (de 'modulos' para 'src') e entrar em 'prisma'
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
}