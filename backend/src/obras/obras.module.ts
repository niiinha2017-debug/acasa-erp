import { Module } from '@nestjs/common'
import { ObrasController } from './obras.controller'
import { ObrasService } from './obras.service'

@Module({
  controllers: [ObrasController],
  providers: [ObrasService],
})
export class ObrasModule {}
