import { Module } from '@nestjs/common'
import { PermissoesController } from './permissoes.controller'
import { PermissoesService } from './permissoes.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PermissoesController],
  providers: [PermissoesService],
  exports: [PermissoesService], // ✅ ESSENCIAL
})
export class PermissoesModule {}
