import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClausulasService } from './clausulas.service';
import { ClausulasController } from './clausulas.controller';

@Module({
  imports: [PrismaModule],
  providers: [ClausulasService],
  controllers: [ClausulasController],
})
export class ClausulasModule {}

