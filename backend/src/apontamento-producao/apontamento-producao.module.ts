import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApontamentoProducaoService } from './apontamento-producao.service';
import { ApontamentoProducaoController } from './apontamento-producao.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ApontamentoProducaoController],
  providers: [ApontamentoProducaoService],
  exports: [ApontamentoProducaoService],
})
export class ApontamentoProducaoModule {}
