import { Module } from '@nestjs/common';
import { MigracaoDriveController } from './migracao-drive.controller';
import { MigracaoDriveService } from './migracao-drive.service';
import { ExtractionModule } from '../extraction/extraction.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [ExtractionModule, UtilsModule],
  controllers: [MigracaoDriveController],
  providers: [MigracaoDriveService],
})
export class MigracaoDriveModule {}
