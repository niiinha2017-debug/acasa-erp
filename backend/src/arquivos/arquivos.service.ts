import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ArquivosService {
  constructor(private prisma: PrismaService) {}

  private normUpper(v: any) {
    const s = String(v ?? '')
      .trim()
      .toUpperCase();
    return s.length ? s : null;
  }

  private ownerType(v: any) {
    const s = this.normUpper(v);
    if (!s) throw new BadRequestException('owner_type é obrigatório.');
    if (!/^[A-Z0-9_]+$/.test(s))
      throw new BadRequestException('owner_type inválido.');
    return s;
  }

  private ownerId(v: any) {
    const n = Number(v);
    if (!n || n <= 0) throw new BadRequestException('owner_id inválido.');
    return n;
  }

  private folderFromOwnerType(ownerType: string) {
    // PRODUTO -> produtos, ORCAMENTO -> orcamentos, EMPRESA -> empresas
    return ownerType.toLowerCase() + 's';
  }

  async listar(params: {
    owner_type?: string;
    owner_id?: any;
    categoria?: string;
    page?: number;
    pageSize?: number;
  }) {
    const owner_type_raw = this.normUpper(params.owner_type);
    const owner_id_raw = String(params.owner_id ?? '').replace(/\D/g, '');

    // se não vier filtro, retorna vazio (sem quebrar tela)
    if (!owner_type_raw || !owner_id_raw)
      return {
        data: [],
        meta: { page: 1, pageSize: 0, total: 0, totalPages: 0 },
      };

    const owner_type = this.ownerType(owner_type_raw);
    const owner_id = this.ownerId(owner_id_raw);
    const categoria = this.normUpper(params.categoria);

    const where: any = { owner_type, owner_id };
    if (categoria) where.categoria = categoria;

    if (!params.page) {
      const rows = await this.prisma.arquivos.findMany({
        where,
        orderBy: { criado_em: 'desc' },
      });
      return rows;
    }

    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 20));

    const total = await this.prisma.arquivos.count({ where });
    const data = await this.prisma.arquivos.findMany({
      where,
      orderBy: { criado_em: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async remover(id: number) {
    const cleanId = Number(id);
    if (!cleanId) throw new BadRequestException('ID inválido.');

    const arquivo = await this.prisma.arquivos.findUnique({
      where: { id: cleanId },
    });
    if (!arquivo) throw new NotFoundException('Arquivo não encontrado.');

    // ✅ se for imagem principal do produto, limpa o "atalho"
    if (
      arquivo.owner_type === 'PRODUTO' &&
      arquivo.slot_key === 'IMAGEM_PRINCIPAL'
    ) {
      try {
        await this.prisma.produtos.update({
          where: { id: arquivo.owner_id },
          data: { imagem_url: null },
        });
      } catch {}
    }

    // tenta apagar o arquivo físico (best effort)
    try {
      const rel = arquivo.url.replace(/^\//, '');
      const abs = path.join(process.cwd(), rel);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {}

    await this.prisma.arquivos.delete({ where: { id: cleanId } });
    return { ok: true };
  }

  async salvarUpload(params: {
    owner_type: string;
    owner_id: number;
    categoria?: string | null;
    slot_key?: string | null;
    file: Express.Multer.File;
  }) {
    const owner_type = this.ownerType(params.owner_type);
    const owner_id = this.ownerId(params.owner_id);
    const categoria = this.normUpper(params.categoria);
    const slot_key = this.normUpper(params.slot_key);

    const folder = this.folderFromOwnerType(owner_type);
    const url = `/uploads/${folder}/${params.file.filename}`;

    // ✅ Se slot_key foi informado -> upsert (substitui)
    if (slot_key) {
      const existente = await this.prisma.arquivos.findUnique({
        where: {
          owner_type_owner_id_slot_key: { owner_type, owner_id, slot_key },
        },
      });

      const salvo = await this.prisma.arquivos.upsert({
        where: {
          owner_type_owner_id_slot_key: { owner_type, owner_id, slot_key },
        },
        create: {
          owner_type,
          owner_id,
          categoria,
          slot_key,
          url,
          filename: params.file.filename,
          nome: params.file.originalname,
          mime_type: params.file.mimetype,
          tamanho: params.file.size,
        },
        update: {
          categoria,
          url,
          filename: params.file.filename,
          nome: params.file.originalname,
          mime_type: params.file.mimetype,
          tamanho: params.file.size,
        },
      });

      // apaga arquivo antigo (best effort)
      if (existente?.url && existente.url !== salvo.url) {
        try {
          const relOld = existente.url.replace(/^\//, '');
          const absOld = path.join(process.cwd(), relOld);
          if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
        } catch {}
      }

      // ✅ espelha no produto para o index usar
      if (owner_type === 'PRODUTO' && slot_key === 'IMAGEM_PRINCIPAL') {
        await this.prisma.produtos.update({
          where: { id: owner_id },
          data: { imagem_url: url },
        });
      }

      return salvo;
    }

    // ✅ slot_key null -> cria múltiplos
    return this.prisma.arquivos.create({
      data: {
        owner_type,
        owner_id,
        categoria,
        slot_key: null,
        url,
        filename: params.file.filename,
        nome: params.file.originalname,
        mime_type: params.file.mimetype,
        tamanho: params.file.size,
      },
    });
  }

  async buscarPorId(id: number) {
    const arq = await this.prisma.arquivos.findUnique({ where: { id } });
    if (!arq) throw new NotFoundException('Arquivo não encontrado.');
    return arq;
  }
}
