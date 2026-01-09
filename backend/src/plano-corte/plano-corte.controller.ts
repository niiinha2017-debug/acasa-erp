import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, // Padronizado para edições
  Delete,
  HttpCode,
  HttpStatus 
} from '@nestjs/common'
import { PlanoCorteService } from './plano-corte.service'
import { CreatePlanoCorteDto } from './dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from './dto/update-plano-corte.dto' // Certifique-se de que este DTO existe

@Controller('plano-corte')
export class PlanoCorteController {
  constructor(private readonly service: PlanoCorteService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Post()
  create(@Body() dto: CreatePlanoCorteDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.cleanId(id))
  }

  @Put(':id') // Padronizado: PUT para o formulário de edição
  update(@Param('id') id: string, @Body() dto: UpdatePlanoCorteDto) {
    return this.service.update(this.cleanId(id), dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(this.cleanId(id))
  }
}