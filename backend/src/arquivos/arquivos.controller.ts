import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { ArquivosService } from './arquivos.service';

function onlySafeName(v: any) {
  return (
    String(v ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'SEM_NOME'
  );
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('arquivos')
export class ArquivosController {
  constructor(private readonly arquivosService: ArquivosService) {}

  // 1. LISTAR (Fixo: agora usa as variáveis corretas da Query)
  @Get()
  @Permissoes('arquivos.ver')
  listar(
    @Query('owner_type') owner_type: string,
    @Query('owner_id') owner_id: string,
    @Query('categoria') categoria?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const oid = Number(String(owner_id || '').replace(/\D/g, ''));

    if (!owner_type || !oid) {
      throw new BadRequestException(
        'owner_type e owner_id são obrigatórios para listar.',
      );
    }

    if (page) {
      return this.arquivosService.listar({
        owner_type,
        owner_id: oid,
        categoria,
        page: Number(page),
        pageSize: Number(pageSize || 20),
      });
    }

    return this.arquivosService.listar({
      owner_type,
      owner_id: oid,
      categoria,
    });
  }

  // 2. UPLOAD (Fixo: Adicionado decorador @Post e limpeza de arquivo em caso de erro)
  @Post('upload')
  @Permissoes('arquivos.criar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const ot = String((req as any).body?.owner_type || '')
            .trim()
            .toUpperCase();
          const folder = ot ? ot.toLowerCase() + 's' : 'geral';
          const dir = `./uploads/${folder}`;
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const body: any = (req as any)?.body || {};
          const ownerType = String(body.owner_type || '')
            .trim()
            .toUpperCase();
          const prefixo = onlySafeName(body.prefixo || ownerType || 'ARQUIVO');
          const nomeBase = onlySafeName(
            body.nome_base || body.cliente_nome || body.nome || '',
          );
          const data = todayYmd();
          const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
          const ext = extname(file.originalname || '');

          const finalName = nomeBase
            ? `${prefixo}_${nomeBase}_${data}_${rand}${ext}`
            : `${prefixo}_${data}_${rand}${ext}`;

          cb(null, finalName);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ) {
    const body: any = (res.req as any)?.body || {};

    if (!file) throw new BadRequestException('Arquivo não enviado.');

    const oid = Number(String(body.owner_id || '').replace(/\D/g, ''));

    if (!body.owner_type || !oid) {
      // Se deu erro, apaga o arquivo que o multer acabou de salvar para não "sujar" o HD
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new BadRequestException(
        'owner_type e owner_id são obrigatórios no body.',
      );
    }

    return this.arquivosService.salvarUpload({
      owner_type: String(body.owner_type).trim().toUpperCase(),
      owner_id: oid,
      categoria: body.categoria ?? null,
      slot_key: body.slot_key ?? null,
      file,
    });
  }

  // 3. BAIXAR BLOB
  @Get(':id/blob')
  @Permissoes('arquivos.ver')
  async baixarBlob(@Param('id') id: string, @Res() res: Response) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    if (!cleanId) throw new BadRequestException('ID inválido.');

    const arquivo = await this.arquivosService.buscarPorId(cleanId);
    const rel = String(arquivo.url || '').replace(/^\//, '');
    const relNoUploads = rel.replace(/^uploads[\/\\]/, '');
    const abs = join(process.cwd(), 'uploads', relNoUploads);

    if (!fs.existsSync(abs)) {
      throw new BadRequestException(`Arquivo físico não encontrado.`);
    }

    res.setHeader(
      'Content-Type',
      arquivo.mime_type || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${arquivo.filename}"`,
    );
    return res.sendFile(abs);
  }

  // 4. REMOVER
  @Delete(':id')
  @Permissoes('arquivos.excluir')
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.arquivosService.remover(cleanId);
  }
}
