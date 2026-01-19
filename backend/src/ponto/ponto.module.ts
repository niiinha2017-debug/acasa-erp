import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'

import { PontoService } from './ponto.service'
import { PontoAppController } from './ponto-app.controller'
import { PontoAdminController } from './ponto-admin.controller'

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [PontoAppController, PontoAdminController],
  providers: [PontoService],
})
export class PontoModule {}
