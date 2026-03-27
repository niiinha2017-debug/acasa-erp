import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GarantiasService } from './garantias.service';
import { CreateGarantiaDto } from './dto/create-garantia.dto';
import { UpdateGarantiaDto } from './dto/update-garantia.dto';
import { AgendarGarantiaDto } from './dto/agendar-garantia.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('garantias')
export class GarantiasController {
  constructor(private readonly service: GarantiasService) {}

  @Get()
  @Permissoes('garantias.ver')
  listar(
    @Query('status') status?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.listar({
      status: status?.trim() || undefined,
      tipo: tipo?.trim() || undefined,
    });
  }

  @Get(':id')
  @Permissoes('garantias.ver')
  detalhar(@Param('id') id: string) {
    return this.service.detalhar(this.cleanId(id));
  }

  @Post()
  @Permissoes('garantias.criar')
  criar(@Body() dto: CreateGarantiaDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  @Permissoes('garantias.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateGarantiaDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Delete(':id')
  @Permissoes('garantias.deletar')
  deletar(@Param('id') id: string) {
    return this.service.deletar(this.cleanId(id));
  }

  /** Cria um agendamento na agenda vinculado a esta garantia */
  @Post(':id/agendar')
  @Permissoes('garantias.editar', 'agendamentos.ver')
  agendar(@Param('id') id: string, @Body() dto: AgendarGarantiaDto) {
    return this.service.agendar(this.cleanId(id), dto);
  }

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
}
