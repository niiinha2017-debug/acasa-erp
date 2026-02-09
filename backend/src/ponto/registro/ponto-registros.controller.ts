import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissoes } from '../../auth/permissoes.decorator';
import { PontoRegistrosService } from './ponto-registros.service';
import { AtualizarPontoRegistroDto } from '../dto/atualizar-ponto-registro.dto';
import { CriarPontoRegistroDto } from '../dto/criar-ponto-registro.dto';

@Controller('ponto/registros')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PontoRegistrosController {
  constructor(private readonly service: PontoRegistrosService) {}

  @Post()
  @Permissoes('ponto_relatorio.editar')
  criar(@Body() dto: CriarPontoRegistroDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  @Permissoes('ponto_relatorio.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarPontoRegistroDto) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.service.atualizar(cleanId, dto);
  }

  @Delete(':id')
  @Permissoes('ponto_relatorio.editar')
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.service.remover(cleanId);
  }
}
