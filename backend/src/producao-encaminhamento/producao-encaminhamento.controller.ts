import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'
import { ProducaoEncaminhamentoService } from './producao-encaminhamento.service'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('producao')
export class ProducaoEncaminhamentoController {
  constructor(private readonly service: ProducaoEncaminhamentoService) {}

  @Post('encaminhar')
  @Permissoes('producao.criar')
  encaminhar(@Body() dto: EncaminharProducaoDto) {
    return this.service.encaminhar(dto)
  }
}
