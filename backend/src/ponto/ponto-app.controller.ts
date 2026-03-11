import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PontoService } from './ponto.service';
import { PontoRelatorioService } from './relatorio/ponto-relatorio.service';
import { AtivarDto } from './dto/ativar.dto';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { PontoAuthGuard } from './ponto-auth.guard';
import { Public } from '../auth/public.decorator';

/**
 * Rotas do app de Ponto (PWA/APK). Acesso por convite (token próprio), não usa login do ERP.
 * @Public() no controller: o JwtAuthGuard global ignora aqui; o PontoAuthGuard exige o token do convite em me/hoje/registrar.
 */
@Public()
@Controller('ponto')
export class PontoAppController {
  constructor(
    private readonly service: PontoService,
    private readonly relatorioService: PontoRelatorioService,
  ) {}

  @Public()
  @Post('ativar')
  ativar(@Body() dto: AtivarDto) {
    return this.service.ativar(dto);
  }

  @UseGuards(PontoAuthGuard)
  @Get('hoje')
  hoje(@Req() req: any) {
    return this.service.hoje(req);
  }

  @UseGuards(PontoAuthGuard)
  @Post('registrar')
  registrar(@Body() dto: RegistrarPontoDto, @Req() req: any) {
    return this.service.registrar(dto, req);
  }

  @UseGuards(PontoAuthGuard)
  @Get('ultimo')
  ultimo(@Req() req: any) {
    return this.service.ultimo(req);
  }

  @UseGuards(PontoAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.service.me(req);
  }

  /** Comprovante em imagem (PNG/JPEG) do próprio funcionário para compartilhar */
  @UseGuards(PontoAuthGuard)
  @Get('comprovante/:id')
  async comprovanteImagem(
    @Param('id') id: string,
    @Query('formato') formato: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const registroId = Number(String(id).replace(/\D/g, ''));
    if (!registroId) {
      res.status(400).json({ message: 'ID do registro inválido' });
      return;
    }
    const funcionarioId = req.ponto?.funcionario_id;
    if (!funcionarioId) {
      res.status(401).json({ message: 'Não autorizado' });
      return;
    }
    const data = await this.relatorioService.getRegistroComprovante(registroId);
    if (!data || data.registro.funcionario_id !== funcionarioId) {
      throw new ForbiddenException(
        'Registro não encontrado ou não pertence a você.',
      );
    }
    const fmt = String(formato || '').toLowerCase();
    const ext: 'png' | 'jpeg' =
      fmt === 'jpeg' || fmt === 'jpg' ? 'jpeg' : 'png';
    try {
      const { buffer, contentType, ext: extReal } =
        await this.relatorioService.gerarComprovanteImageBuffer(registroId, ext);
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="comprovante-ponto-${registroId}.${extReal}"`,
      );
      res.send(buffer);
    } catch {
      // Se PNG/JPEG falharem (ex.: sharp sem SVG), devolve comprovante em PDF
      const buffer = await this.relatorioService.gerarComprovantePdfBuffer(
        registroId,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="comprovante-ponto-${registroId}.pdf"`,
      );
      res.send(buffer);
    }
    return;
  }
}
