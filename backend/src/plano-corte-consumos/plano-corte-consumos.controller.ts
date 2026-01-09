import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { PlanoCorteConsumosService } from './plano-corte-consumos.service';
import { CreatePlanoCorteConsumoDto } from './dto/create-plano-corte-consumo.dto';

@Controller('plano-corte-consumos')
export class PlanoCorteConsumosController {
  constructor(private readonly service: PlanoCorteConsumosService) {}

  /**
   * Garante que IDs vindos da URL sejam apenas números
   */
  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Post()
  create(@Body() dto: CreatePlanoCorteConsumoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.cleanId(id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(this.cleanId(id));
  }
}