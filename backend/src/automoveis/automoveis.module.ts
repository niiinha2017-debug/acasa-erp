import { Module } from '@nestjs/common';
import { AutomoveisController } from './automoveis.controller';
import { AutomoveisService } from './automoveis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AutomoveisController],
  providers: [AutomoveisService],
  exports: [AutomoveisService],
})
export class AutomoveisModule {}
