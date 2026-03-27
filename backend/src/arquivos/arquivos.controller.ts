import {
  BadRequestException,
  Body,
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

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { Public } from '../auth/public.decorator';
import { ArquivosService, getUploadFolderFromOwnerType } from './arquivos.service';
import { ConfirmarImportacaoLeituraDto } from './dto/confirmar-importacao-leitura.dto';

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

// Token simples para acesso temporário ao HTML do DOCX sem autenticação JWT
function gerarTokenDocx(id: number): string {
  const secret = 'acasa-docx-preview-2025';
  const payload = `${id}:${secret}`;
  // SHA-like simples com Buffer
  const buf = Buffer.from(payload);
  return buf.toString('base64url').slice(0, 32);
}

function gerarTokenDownload(id: number): string {
  const secret = 'acasa-download-2026';
  const payload = `${id}:${secret}`;
  const buf = Buffer.from(payload);
  return buf.toString('base64url').slice(0, 40);
}

@UseGuards(PermissionsGuard)
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

  /** Consolida leitura dos documentos do cliente (CONTRATO → financeiro; projeto/orçamento → produção). */
  @Get('consolidacao/cliente/:clienteId')
  @Permissoes('arquivos.ver', 'clientes.ver')
  consolidacaoCliente(
    @Param('clienteId') clienteId: string,
    @Query('orc_ids') orcIds?: string,
  ) {
    const id = Number(String(clienteId || '').replace(/\D/g, ''));
    if (!id) throw new BadRequestException('clienteId inválido.');
    const orcamentoArquivoIds = orcIds
      ? String(orcIds).split(',').map(Number).filter((n) => n > 0)
      : undefined;
    return this.arquivosService.consolidacaoCliente(id, { orcamentoArquivoIds });
  }

  /** Lista todas as versões de orçamento do cliente agrupadas por nome base, com valor e ambientes extraídos. */
  @Get('orcamentos/cliente/:clienteId')
  @Permissoes('arquivos.ver', 'clientes.ver')
  listarOrcamentosCliente(@Param('clienteId') clienteId: string) {
    const id = Number(String(clienteId || '').replace(/\D/g, ''));
    if (!id) throw new BadRequestException('clienteId inválido.');
    return this.arquivosService.listarOrcamentosCliente(id);
  }

  /** Retorna o markup salvo na última ordem de serviço do cliente. */
  @Get('markup/cliente/:clienteId')
  @Permissoes('arquivos.ver', 'clientes.ver')
  markupSalvoCliente(@Param('clienteId') clienteId: string) {
    const id = Number(String(clienteId || '').replace(/\D/g, ''));
    if (!id) throw new BadRequestException('clienteId inválido.');
    return this.arquivosService.markupSalvoCliente(id);
  }

  /** Grava parcelas em contas_receber, cria ordem_servico (entrega) e producao_etapas por ambiente. */
  @Post('importacao-leitura/confirmar/:clienteId')
  @Permissoes('contas_receber.criar')
  confirmarImportacaoLeitura(
    @Param('clienteId') clienteId: string,
    @Body() body: ConfirmarImportacaoLeituraDto,
  ) {
    const id = Number(String(clienteId || '').replace(/\D/g, ''));
    if (!id) throw new BadRequestException('clienteId inválido.');
    return this.arquivosService.confirmarImportacaoLeitura(id, {
      data_entrega_prevista: body?.data_entrega_prevista,
      valor_bruto: body?.valor_bruto,
      valor_impostos_nf: body?.valor_impostos_nf,
      valor_comissao: body?.valor_comissao,
      valor_taxas_cartao: body?.valor_taxas_cartao,
      valor_taxas_processamento_cartao: body?.valor_taxas_processamento_cartao,
      valor_taxas_antecipacao_credito: body?.valor_taxas_antecipacao_credito,
      valor_liquido: body?.valor_liquido,
      taxa_nota_percentual: body?.taxa_nota_percentual,
      tem_nota_fiscal: body?.tem_nota_fiscal,
      comissionados: body?.comissionados,
      parcelas: body?.parcelas,
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
          const folder = ot ? getUploadFolderFromOwnerType(ot) : 'geral';
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

    const { arquivo, resolvido } =
      await this.arquivosService.resolverArquivoFisicoPorId(cleanId);
    const abs = resolvido?.abs || '';

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

  @Get(':id/download-token')
  @Permissoes('arquivos.ver')
  async downloadToken(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    if (!cleanId) throw new BadRequestException('ID inválido.');
    return {
      token: gerarTokenDownload(cleanId),
      url: `/api/arquivos/${cleanId}/download-pub?token=${encodeURIComponent(
        gerarTokenDownload(cleanId),
      )}`,
      id: cleanId,
    };
  }

  @Public()
  @Get(':id/download-pub')
  async baixarPublico(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    if (!cleanId) throw new BadRequestException('ID inválido.');
    if (!token || token !== gerarTokenDownload(cleanId)) {
      return res.status(403).send('Acesso negado.');
    }

    const { arquivo, resolvido } =
      await this.arquivosService.resolverArquivoFisicoPorId(cleanId);
    const abs = resolvido?.abs || '';

    if (!fs.existsSync(abs)) {
      throw new BadRequestException(`Arquivo físico não encontrado.`);
    }

    res.setHeader(
      'Content-Type',
      arquivo.mime_type || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${arquivo.filename}"`,
    );
    return res.sendFile(abs);
  }

  // 4. DOCX → HTML (para visualização inline)
  // Gera token temporário para acesso sem JWT ao HTML do DOCX
  @Get(':id/html-token')
  @Permissoes('arquivos.ver')
  async htmlDocxToken(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    if (!cleanId) throw new BadRequestException('ID inválido.');
    return { token: gerarTokenDocx(cleanId), id: cleanId };
  }

  // Endpoint público — sem JWT, acesso via token na URL
  @Public()
  @Get(':id/html-pub')
  async htmlDocxPublic(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    if (!cleanId) throw new BadRequestException('ID inválido.');
    if (!token || token !== gerarTokenDocx(cleanId)) {
      return res.status(403).send('Acesso negado.');
    }
    // Reusa a lógica do endpoint autenticado
    return this.servirHtmlDocx(cleanId, res);
  }

  @Get(':id/html')
  @Permissoes('arquivos.ver')
  async htmlDocx(@Param('id') id: string, @Res() res: Response) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    if (!cleanId) throw new BadRequestException('ID inválido.');
    return this.servirHtmlDocx(cleanId, res);
  }

  private async servirHtmlDocx(cleanId: number, res: Response) {
    const { arquivo, resolvido } =
      await this.arquivosService.resolverArquivoFisicoPorId(cleanId);
    const abs = resolvido?.abs || '';

    if (!fs.existsSync(abs)) throw new BadRequestException('Arquivo não encontrado.');

    const mime = (arquivo.mime_type || '').toLowerCase();
    const nome = (arquivo.filename || '').toLowerCase();
    const isDocx =
      mime.includes('wordprocessingml') ||
      mime.includes('msword') ||
      nome.endsWith('.docx') ||
      nome.endsWith('.doc');

    if (!isDocx) throw new BadRequestException('Arquivo não é um DOCX.');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ path: abs });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; background: #fff; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: #1a1a1a;
      padding: 2rem 2.5rem 3rem;
    }
    img { max-width: 100%; height: auto; display: block; margin: 0.5em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    td, th { border: 1px solid #d1d5db; padding: 6px 10px; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; }
    p { margin: 0 0 0.6em; }
    h1 { font-size: 1.5em; margin: 0 0 0.5em; font-weight: 700; }
    h2 { font-size: 1.25em; margin: 1em 0 0.4em; font-weight: 700; }
    h3 { font-size: 1.05em; margin: 0.8em 0 0.3em; font-weight: 600; }
    ul, ol { margin: 0 0 0.7em; padding-left: 1.5em; }
    li { margin-bottom: 0.25em; }
    strong, b { font-weight: 700; }
  </style>
</head>
<body>${result.value}</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    return res.send(html);
  }

  // 5. REMOVER
  @Delete(':id')
  @Permissoes('arquivos.excluir')
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.arquivosService.remover(cleanId);
  }
}
