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
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlanoCorteService } from '../service/plano-corte.service';
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto';
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto';
import { PIPELINE_PLANO_CORTE } from '../../shared/constantes/pipeline-plano-corte';

import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissoes } from '../../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('plano-corte')
export class PlanoCorteController {
  constructor(private readonly service: PlanoCorteService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Post()
  @Permissoes('plano_corte.criar')
  create(@Body() dto: CreatePlanoCorteDto, @Req() req?: any) {
    const criadoPorUsuarioId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.service.create(dto, criadoPorUsuarioId ? { criadoPorUsuarioId } : undefined);
  }

  @Get()
  @Permissoes('plano_corte.ver')
  findAll() {
    return this.service.findAll();
  }

  @Get('pipeline')
  @Permissoes('plano_corte.ver')
  pipeline() {
    return PIPELINE_PLANO_CORTE;
  }

  @Get(':id')
  @Permissoes('plano_corte.ver')
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.cleanId(id));
  }

  @Put(':id')
  @Permissoes('plano_corte.editar')
  update(@Param('id') id: string, @Body() dto: UpdatePlanoCorteDto, @Req() req?: any) {
    const criadoPorUsuarioId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.service.update(this.cleanId(id), dto, criadoPorUsuarioId ? { criadoPorUsuarioId } : undefined);
  }

  @Post(':id/pdf')
  @Permissoes('plano_corte.ver')
  @HttpCode(HttpStatus.OK)
  gerarPdf(@Param('id') id: string) {
    return this.service.gerarPdfESalvar(this.cleanId(id));
  }

  @Delete(':id')
  @Permissoes('plano_corte.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(this.cleanId(id));
  }
}
