import {
  Module,
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EvolutionService } from './evolution.service';
import type { SendMediaOptions } from './evolution.service';

@Controller('evolution')
class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Get('configurado')
  async configurado(): Promise<{ ok: boolean }> {
    const ok = await this.evolutionService.isConfiguredAsync();
    return { ok };
  }

  @Post('instance/create')
  async createInstance(
    @Body('instanceName') instanceName?: string,
  ): Promise<{ instanceName: string; qrCodeBase64?: string; pairingCode?: string } | null> {
    const ok = await this.evolutionService.isConfiguredAsync();
    if (!ok) {
      throw new BadRequestException(
        'Evolution API não configurada. Configure em Configurações > Contato (URL, API Key e Nome da instância).',
      );
    }
    const result = await this.evolutionService.createInstance(instanceName);
    return result
      ? {
          instanceName: result.instanceName,
          qrCodeBase64: result.qrCodeBase64,
          pairingCode: result.pairingCode,
        }
      : null;
  }

  @Get('instance/qrcode')
  async getQrCode(
    @Query('instanceName') instanceName?: string,
  ): Promise<{ code?: string; pairingCode?: string } | null> {
    const data = await this.evolutionService.fetchQrCode(instanceName);
    return data ?? null;
  }

  @Post('message/send')
  async sendMessage(
    @Body('remoteJid') remoteJid: string,
    @Body('text') text: string,
    @Body('instanceName') instanceName?: string,
  ) {
    if (!remoteJid || !text) {
      throw new BadRequestException('remoteJid e text são obrigatórios.');
    }
    return this.evolutionService.sendMessage(remoteJid, text, instanceName);
  }

  @Post('message/sendMedia')
  async sendMedia(
    @Body('remoteJid') remoteJid: string,
    @Body('media') media: string,
    @Body('caption') caption?: string,
    @Body('fileName') fileName?: string,
    @Body('mimetype') mimetype?: string,
    @Body('mediatype') mediatype?: SendMediaOptions['mediatype'],
    @Body('instanceName') instanceName?: string,
  ) {
    if (!remoteJid || !media) {
      throw new BadRequestException('remoteJid e media são obrigatórios.');
    }
    const options: SendMediaOptions = {
      caption,
      fileName,
      mimetype,
      mediatype,
    };
    return this.evolutionService.sendMedia(
      remoteJid,
      media,
      options,
      instanceName,
    );
  }
}

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 2,
    }),
  ],
  controllers: [EvolutionController],
  providers: [EvolutionService],
  exports: [EvolutionService],
})
export class EvolutionModule {}
