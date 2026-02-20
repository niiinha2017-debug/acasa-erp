import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';

import { PontoService } from './ponto.service';
import { PontoAppController } from './ponto-app.controller';
import { PontoAdminController } from './ponto-admin.controller';

import { PontoRelatorioController } from './relatorio/ponto-relatorio.controller';
import { PontoRelatorioService } from './relatorio/ponto-relatorio.service';

import { PontoRegistrosController } from './registro/ponto-registros.controller';
import { PontoRegistrosService } from './registro/ponto-registros.service';

import { PontoJustificativasController } from './justificativa/ponto-justificativas.controller';
import { PontoJustificativasService } from './justificativa/ponto-justificativas.service';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, MailModule],
  controllers: [
    PontoAppController,
    PontoAdminController,
    PontoRelatorioController,
    PontoRegistrosController,
    PontoJustificativasController,
  ],
  providers: [
    PontoService,
    PontoRelatorioService,
    PontoRegistrosService,
    PontoJustificativasService,
  ],
  exports: [PontoRelatorioService],
})
export class PontoModule {}
