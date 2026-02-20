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
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

import { ContratosService } from './contratos.service';
import { AssinarContratoDto } from './dto/assinar-contrato.dto';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  listar(@Query('venda_id') vendaId?: string) {
    const vendaIdNum = vendaId ? this.cleanId(vendaId) : undefined;
    return this.service.listar(vendaIdNum && vendaIdNum > 0 ? vendaIdNum : undefined);
  }

  /** Link público temporário (24h) para download do PDF – envio grátis por WhatsApp/e-mail */
  @Get(':id/link-publico')
  @Permissoes('contratos.ver')
  async linkPublico(@Param('id') id: string, @Req() req: Request) {
    const contratoId = this.cleanId(id);
    const baseUrl =
      this.config.get<string>('APP_URL') ||
      process.env.APP_URL ||
      (req.protocol && req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000');
    return this.service.obterLinkPublicoPdf(contratoId, baseUrl);
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
  atualizar(@Param('id') id: string, @Body() dto: UpdateContratoDto) {
    return this.service.atualizar(this.cleanId(id), dto);
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

  @Post(':id/pdf')
  @Permissoes('contratos.ver')
  @HttpCode(HttpStatus.OK)
  async gerarPdf(@Param('id') id: string) {
    const contratoId = this.cleanId(id);
    return this.service.gerarPdfESalvar(contratoId);
  }
}
