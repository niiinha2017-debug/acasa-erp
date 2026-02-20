import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ContratosService } from './contratos.service';

/**
 * Rotas públicas (sem autenticação) para download do PDF e aceite do contrato.
 */
@Controller('contratos-publico')
export class ContratosPublicController {
  constructor(
    private readonly service: ContratosService,
    private readonly config: ConfigService,
  ) {}

  @Get(':token/pdf')
  @HttpCode(HttpStatus.OK)
  async downloadPdf(@Param('token') token: string, @Res() res: Response) {
    const { buffer, numero } = await this.service.getPdfBufferPorTokenPublico(token);
    const filename = `contrato_${numero}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':token/info')
  async info(@Param('token') token: string, @Req() req: Request) {
    const baseUrl =
      this.config.get<string>('APP_URL') ||
      process.env.APP_URL ||
      (req.protocol && req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000');
    return this.service.getInfoPorTokenPublico(token, baseUrl);
  }

  @Post(':token/aceitar')
  @HttpCode(HttpStatus.OK)
  async aceitar(@Param('token') token: string, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
    const userAgent = req.get('user-agent');
    return this.service.registrarAceite(token, ip, userAgent);
  }
}
