import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contratos')
export class ContratosController {
  constructor(private readonly service: ContratosService) {}

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  @Get()
  @Permissoes('contratos.ver')
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  @Permissoes('contratos.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id));
  }

  @Post()
  @Permissoes('contratos.criar')
  criar(@Body() dto: CreateContratoDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  @Permissoes('contratos.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateContratoDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Delete(':id')
  @Permissoes('contratos.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }

  @Post(':id/pdf')
  @Permissoes('contratos.ver')
  @HttpCode(HttpStatus.OK)
  async gerarPdf(@Param('id') id: string) {
    const contratoId = this.cleanId(id);
    return this.service.gerarPdfESalvar(contratoId);
  }
}
