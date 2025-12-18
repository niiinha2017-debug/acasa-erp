import { Module } from '@nestjs/common'
import { CnpjController } from './cnpj.controller'
import { CnpjService } from './cnpj.service'

@Module({
  controllers: [CnpjController],
  providers: [CnpjService],
})
export class CnpjModule {}
