import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { ContratosService } from './contratos.service';
import { AssinarContratoDto } from './dto/assinar-contrato.dto';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('contratos')
export class ContratosController {
  constructor(
    private readonly service: ContratosService,
    private readonly config: ConfigService,
  ) {}

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  @Get()
  @Permissoes('contratos.ver')
  listar(
    @Req() req: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
    @Query('venda_id') vendaId?: string,
    @Query('status') status?: string,
  ) {
    const vendaIdNum = vendaId ? this.cleanId(vendaId) : undefined;
    const statusNorm = status?.trim()?.toUpperCase() || undefined;
    return this.service.listar(
      vendaIdNum && vendaIdNum > 0 ? vendaIdNum : undefined,
      statusNorm,
      req?.user,
    );
  }

  /** Link público temporário (24h) para download do PDF – envio grátis por WhatsApp/e-mail */
  @Get(':id/link-publico')
  @Permissoes('contratos.ver')
  async linkPublico(@Param('id') id: string, @Req() req: Request) {
    const contratoId = this.cleanId(id);
    const baseUrl =
      this.config.get<string>('APP_URL') ||
      process.env.APP_URL ||
      (req.protocol && req.get('host')
        ? `${req.protocol}://${req.get('host')}`
        : 'http://localhost:3000');
    return this.service.obterLinkPublicoPdf(contratoId, baseUrl);
  }

  /** Envia o link do contrato por e-mail automaticamente (usa SMTP do .env) */
  @Post(':id/enviar-email')
  @Permissoes('contratos.ver')
  @HttpCode(HttpStatus.OK)
  async enviarEmail(@Param('id') id: string, @Req() req: Request) {
    const contratoId = this.cleanId(id);
    const baseUrl =
      this.config.get<string>('APP_URL') ||
      process.env.APP_URL ||
      (req.protocol && req.get('host')
        ? `${req.protocol}://${req.get('host')}`
        : 'http://localhost:3000');
    return this.service.enviarContratoPorEmail(contratoId, baseUrl);
  }

  @Get(':id')
  @Permissoes('contratos.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id));
  }

  @Post()
  @Permissoes('contratos.criar')
  criar(@Body() dto: CreateContratoDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  @Permissoes('contratos.editar')
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateContratoDto,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    const userId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.service.atualizar(this.cleanId(id), dto, userId);
  }

  @Delete(':id')
  @Permissoes('contratos.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }

  @Post(':id/assinar')
  @Permissoes('contratos.editar')
  assinar(@Param('id') id: string, @Body() dto: AssinarContratoDto) {
    return this.service.assinar(this.cleanId(id), dto);
  }

  /** Excluir o PDF do contrato assinado (upload) – permite enviar outro depois */
  @Delete(':id/pdf-assinado')
  @Permissoes('contratos.editar')
  @HttpCode(HttpStatus.OK)
  async excluirPdfAssinado(@Param('id') id: string) {
    return this.service.removerPdfAssinadoCliente(this.cleanId(id));
  }

  /** Marcar contrato como vigente por assinatura presencial na loja (opcional: enviar PDF escaneado) */
  @Post(':id/vigente-assinatura-presencial')
  @Permissoes('contratos.editar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }),
  )
  async vigenteAssinaturaPresencial(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request & { user?: { id?: number } },
  ) {
    const contratoId = this.cleanId(id);
    const buffer =
      file?.buffer && Buffer.isBuffer(file.buffer) ? file.buffer : undefined;
    const userId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.service.marcarVigenteAssinaturaPresencial(contratoId, buffer, userId);
  }

  /** Visualizar/baixar o PDF do contrato (assinado, se já tiver sido assinado) */
  @Get(':id/pdf')
  @Permissoes('contratos.ver')
  async visualizarPdf(@Param('id') id: string, @Res() res: Response) {
    const contratoId = this.cleanId(id);
    const buffer = await this.service.obterPdfBuffer(contratoId);
    const nome = `contrato_${contratoId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nome}"`);
    return res.send(buffer);
  }

  @Post(':id/pdf')
  @Permissoes('contratos.ver')
  @HttpCode(HttpStatus.OK)
  async gerarPdf(@Param('id') id: string) {
    const contratoId = this.cleanId(id);
    return this.service.gerarPdfESalvar(contratoId);
  }
}
