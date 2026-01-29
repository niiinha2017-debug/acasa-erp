import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'

import { PontoJustificativasService } from './ponto-justificativas.service'
import { SalvarPontoJustificativaDto } from '../justificativa/salvar-ponto-justificativa.dto'

@Controller('ponto/justificativas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PontoJustificativasController {
  constructor(private readonly service: PontoJustificativasService) {}

  @Get()
  @Permissoes('ponto_relatorio.ver')
  listar(
    @Query('funcionario_id') funcionario_id?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.service.listar({ funcionario_id, mes, ano })
  }

  @Put()
  @Permissoes('ponto_relatorio.editar')
  salvar(@Body() dto: SalvarPontoJustificativaDto) {
    return this.service.salvar(dto)
  }

  @Delete(':id')
  @Permissoes('ponto_relatorio.editar')
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.service.remover(cleanId)
  }
}
