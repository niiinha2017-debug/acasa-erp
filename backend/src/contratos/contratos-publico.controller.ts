import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContratosService } from './contratos.service';
import { Public } from '../auth/public.decorator';

/**
 * Rotas públicas (sem autenticação) para download do PDF e aceite do contrato.
 */
@Public()
@Controller('contratos-publico')
export class ContratosPublicController {
  private readonly logger = new Logger(ContratosPublicController.name);

  constructor(
    private readonly service: ContratosService,
    private readonly config: ConfigService,
  ) {}

  @Get(':token/pdf')
  @HttpCode(HttpStatus.OK)
  async downloadPdf(@Param('token') token: string, @Res() res: Response) {
    try {
      const { buffer, numero } =
        await this.service.getPdfBufferPorTokenPublico(token);
      const filename = `contrato_${numero}.pdf`.replace(
        /[^a-zA-Z0-9_.-]/g,
        '_',
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(buffer);
    } catch (e: any) {
      this.logger.warn(`PDF público (token): ${e?.message || e}`);
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        'Falha ao gerar PDF do contrato. Tente novamente ou peça um novo link.',
      );
    }
  }

  @Get(':token/info')
  async info(@Param('token') token: string, @Req() req: Request) {
    try {
      const baseUrl =
        this.config.get<string>('APP_URL') ||
        process.env.APP_URL ||
        (req.protocol && req.get('host')
          ? `${req.protocol}://${req.get('host')}`
          : 'http://localhost:3000');
      return this.service.getInfoPorTokenPublico(token, baseUrl);
    } catch (e: any) {
      this.logger.warn(`Info público (token): ${e?.message || e}`);
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        'Não foi possível carregar os dados do contrato.',
      );
    }
  }

  /** Incluir contrato assinado (upload do PDF) – rota pública com token do link */
  @Post(':token/incluir-assinado')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }),
  )
  async incluirAssinado(
    @Param('token') token: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const buffer =
        file?.buffer && Buffer.isBuffer(file.buffer) ? file.buffer : undefined;
      return this.service.incluirContratoAssinadoPorToken(token, buffer);
    } catch (e: any) {
      this.logger.warn(`Incluir assinado (token): ${e?.message || e}`);
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        e?.message ||
          'Não foi possível incluir o contrato assinado. Tente novamente.',
      );
    }
  }

  @Post(':token/aceitar')
  @HttpCode(HttpStatus.OK)
  async aceitar(
    @Param('token') token: string,
    @Req() req: Request,
    @Body()
    payload?: {
      timezone?: string;
      acceptanceLocalTime?: string;
      deviceLabel?: string;
      screen?: string;
    },
  ) {
    try {
      const ipForwarded = String(req.headers['x-forwarded-for'] || '')
        .split(',')[0]
        ?.trim();
      const ip = req.ip || req.socket?.remoteAddress || ipForwarded;
      const userAgent = req.get('user-agent');
      return this.service.registrarAceite(token, {
        ipAddress: ip,
        userAgent,
        timezone: payload?.timezone,
        acceptanceLocalTime: payload?.acceptanceLocalTime,
        deviceLabel: payload?.deviceLabel,
        screen: payload?.screen,
      });
    } catch (e: any) {
      this.logger.warn(`Aceitar público (token): ${e?.message || e}`);
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        'Não foi possível registrar o aceite. Tente novamente.',
      );
    }
  }
}
