import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { PontoService } from './ponto.service'
import { CriarConviteDto } from './dto/criar-convite.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('ponto')
export class PontoAdminController {
  constructor(private readonly service: PontoService) {}

  // ERP: só admin gera link
@UseGuards(JwtAuthGuard)
@Post('convites')
criarConvite(@Body() dto: CriarConviteDto) {
  return this.service.criarConvite(dto)
 }
}
