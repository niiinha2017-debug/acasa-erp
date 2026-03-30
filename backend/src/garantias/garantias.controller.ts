import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Get(':id/pdf')
  @Permissoes('garantias.ver')
  async gerarPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.gerarPdf(this.cleanId(id));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="garantia-${this.cleanId(id)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
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

  /** Envia OS + link Google Maps via WhatsApp para os funcionários da garantia */
  @Post(':id/enviar-whatsapp')
  @Permissoes('garantias.ver')
  enviarWhatsapp(@Param('id') id: string) {
    return this.service.enviarWhatsapp(this.cleanId(id));
  }

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
}
