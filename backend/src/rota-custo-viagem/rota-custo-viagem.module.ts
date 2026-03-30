import { Module } from '@nestjs/common';
import { RotaCustoViagemController } from './rota-custo-viagem.controller';
import { RotaCustoViagemService } from './rota-custo-viagem.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RotaCustoViagemController],
  providers: [RotaCustoViagemService],
  exports: [RotaCustoViagemService],
})
export class RotaCustoViagemModule {}
