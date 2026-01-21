import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'
import { PontoRegistrosService } from './ponto-registros.service'
import { AtualizarPontoRegistroDto } from '../dto/atualizar-ponto-registro.dto'

@Controller('ponto/registros')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PontoRegistrosController {
  constructor(private readonly service: PontoRegistrosService) {}

  @Put(':id')
  @Permissoes('PONTO_RELATORIO.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarPontoRegistroDto) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.service.atualizar(cleanId, dto)
  }
}
