import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'

import { PontoService } from './ponto.service'
import { PontoAppController } from './ponto-app.controller'

@Module({
  imports: [
    ConfigModule,  // se já for global pode até tirar, mas pode deixar
    PrismaModule,
    AuthModule,    // ✅ ISSO resolve o JwtService
  ],
  controllers: [PontoAppController],
  providers: [PontoService],
})
export class PontoModule {}
