import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { PontoRelatorioService } from './ponto-relatorio.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'

@Controller('ponto/relatorio')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissoes('PONTO_RELATORIO.ver')
export class PontoRelatorioController {
  constructor(private readonly service: PontoRelatorioService) {}

  @Get('registros')
  listar(
    @Query('funcionario_id') funcionario_id?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('tipo') tipo?: 'ENTRADA' | 'SAIDA',
    @Query('origem') origem?: 'PWA' | 'WEB' | 'ADMIN',
    @Query('status') status?: 'ATIVO' | 'INVALIDADO',
  ) {
    return this.service.listar({ funcionario_id, data_ini, data_fim, tipo, origem, status })
  }
}
