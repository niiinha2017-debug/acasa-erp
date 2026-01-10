import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { DespesasService } from './despesas.service'
import { CreateDespesaDto } from './dto/create-despesa.dto'
import { UpdateDespesaDto } from './dto/update-despesa.dto'

@Controller('despesas')
export class DespesasController {
  constructor(private readonly service: DespesasService) {}

  // ✅ CRIAR (PADRÃO DO PROJETO: PUT, não POST)
  // Cria 1 ou N parcelas (recorrência)
  @Put()
  create(@Body() dto: CreateDespesaDto) {
    return this.service.create(dto) // retorna despesas[]
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.findOne(cleanId)
  }

  // ✅ ATUALIZAR UMA PARCELA (PUT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDespesaDto) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.update(cleanId, dto)
  }

  // ✅ ATUALIZAR O GRUPO (RECORRÊNCIA)
  // Atualiza todos os lançamentos com o mesmo recorrencia_id
  @Put('recorrencia/:recorrenciaId')
  updateRecorrencia(
    @Param('recorrenciaId') recorrenciaId: string,
    @Body() dto: UpdateDespesaDto,
  ) {
    return this.service.updateRecorrencia(recorrenciaId, dto) // retorna count
  }

  // ✅ EXCLUIR UMA PARCELA
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.remove(cleanId)
  }

  // ✅ EXCLUIR O GRUPO (RECORRÊNCIA)
  @Delete('recorrencia/:recorrenciaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRecorrencia(@Param('recorrenciaId') recorrenciaId: string) {
    return this.service.removeRecorrencia(recorrenciaId) // retorna count
  }
}
