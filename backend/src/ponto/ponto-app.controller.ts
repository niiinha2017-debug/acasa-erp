import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
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

@Controller('ponto')
export class PontoAppController {
  constructor(
    private readonly service: PontoService,
    private readonly relatorioService: PontoRelatorioService,
  ) {}

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

  /** Comprovante em PNG (só do próprio funcionário) para compartilhar no WhatsApp */
  @UseGuards(PontoAuthGuard)
  @Get('comprovante/:id')
  async comprovantePng(
    @Param('id') id: string,
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
      throw new ForbiddenException('Registro não encontrado ou não pertence a você.');
    }
    const buffer = await this.relatorioService.gerarComprovanteImageBuffer(
      registroId,
      'png',
      320,
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="comprovante-ponto-${registroId}.png"`,
    );
    res.send(buffer);
    return;
  }
}
