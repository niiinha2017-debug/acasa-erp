import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { AutomoveisService, CreateAutomovelDto, UpdateAutomovelDto } from './automoveis.service';

@UseGuards(PermissionsGuard)
@Controller('automoveis')
export class AutomoveisController {
  constructor(private readonly service: AutomoveisService) {}

  @Get()
  @Permissoes('automoveis.read')
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get('patrimonio')
  @Permissoes('automoveis.read')
  relatorioPatrimonio() {
    return this.service.relatorioPatrimonio();
  }

  @Get(':id')
  @Permissoes('automoveis.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissoes('automoveis.write')
  create(@Body() body: CreateAutomovelDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Permissoes('automoveis.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAutomovelDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Permissoes('automoveis.write')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
