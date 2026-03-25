import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Req,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MigracaoDriveService } from './migracao-drive.service';
import { Request } from 'express';

// Aceita qualquer mimetype — valida pelo conteúdo (magic bytes) no service
function zipFileFilter(_req: any, file: Express.Multer.File, cb: any) {
  const nome = (file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const mimeOk =
    mime.includes('zip') ||
    mime.includes('octet-stream') ||
    mime.includes('x-compressed') ||
    mime === 'application/x-zip' ||
    mime === '';

  const extOk = nome.endsWith('.zip') || nome === '';

  if (!mimeOk && !extOk) {
    return cb(
      new BadRequestException(
        `Tipo de arquivo não suportado (mime: ${mime}, nome: ${file.originalname}). Envie um .zip do Google Drive.`,
      ),
      false,
    );
  }
  cb(null, true);
}

@Controller('migracao-drive')
export class MigracaoDriveController {
  private readonly logger = new Logger(MigracaoDriveController.name);

  constructor(private readonly migracaoService: MigracaoDriveService) {}

  /**
   * POST /migracao-drive/preview
   *
   * Recebe um ZIP baixado do Google Drive e retorna uma pré-visualização
   * de todos os clientes e arquivos encontrados, sem salvar nada no banco.
   *
   * Query params:
   *   extrair_dados=true   → tenta ler PDFs/DOCXs e extrair dados do cliente
   */
  @Post('preview')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
      fileFilter: zipFileFilter,
    }),
  )
  async preview(
    @UploadedFile() arquivo: Express.Multer.File,
    @Query('extrair_dados') extrairDados?: string,
  ) {
    if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado.');

    this.logger.log(`Preview: ${arquivo.originalname} (${arquivo.mimetype}, ${arquivo.size} bytes)`);

    return this.migracaoService.gerarPreview(arquivo.buffer, {
      extrairDados: extrairDados === 'true' || extrairDados === '1',
    });
  }

  /**
   * POST /migracao-drive/importar
   *
   * Importa de fato o ZIP: cria os clientes no ERP e salva os arquivos.
   *
   * Query params:
   *   extrair_dados=true       → extrai CPF/valor/data dos PDFs antes de criar
   *   pular_existentes=false   → se false, também salva arquivos em clientes já existentes
   */
  @Post('importar')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
      fileFilter: zipFileFilter,
    }),
  )
  async importar(
    @UploadedFile() arquivo: Express.Multer.File,
    @Query('extrair_dados') extrairDados?: string,
    @Query('pular_existentes') pularExistentes?: string,
    @Req() req?: Request,
  ) {
    if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado.');

    const usuarioId = (req as any)?.user?.id ?? null;

    return this.migracaoService.importar(arquivo.buffer, {
      extrairDados: extrairDados === 'true' || extrairDados === '1',
      pular_existentes: pularExistentes !== 'false',
      usuario_id: usuarioId,
    });
  }

  /**
   * DELETE /migracao-drive/cliente/:id/reset
   *
   * Remove tudo que foi criado pela migração para um cliente:
   * orçamentos, vendas, contratos, contas a receber e arquivos.
   * O cadastro do cliente em si é mantido.
   */
  @Get('importados')
  listarImportados() {
    return this.migracaoService.listarImportados();
  }

  @Get('cliente/:id/stats')
  async statsCliente(@Param('id') id: string) {
    const clienteId = parseInt(id, 10);
    if (isNaN(clienteId) || clienteId < 1) {
      throw new BadRequestException('ID de cliente inválido.');
    }
    return this.migracaoService.statsCliente(clienteId);
  }

  @Delete('cliente/:id/reset')
  async resetCliente(@Param('id') id: string) {
    const clienteId = parseInt(id, 10);
    if (isNaN(clienteId) || clienteId < 1) {
      throw new BadRequestException('ID de cliente inválido.');
    }
    return this.migracaoService.resetarFluxoCliente(clienteId);
  }

  @Delete('cliente/:id/excluir')
  async excluirCliente(@Param('id') id: string) {
    const clienteId = parseInt(id, 10);
    if (isNaN(clienteId) || clienteId < 1) {
      throw new BadRequestException('ID de cliente inválido.');
    }
    return this.migracaoService.excluirClienteImportado(clienteId);
  }
}
