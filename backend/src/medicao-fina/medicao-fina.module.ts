import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MedicaoFinaService } from './medicao-fina.service';
import { MedicaoFinaController } from './medicao-fina.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MedicaoFinaController],
  providers: [MedicaoFinaService],
  exports: [MedicaoFinaService],
})
export class MedicaoFinaModule {}
