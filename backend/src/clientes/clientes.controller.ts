import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'

import { ClientesService } from './clientes.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionGuard } from '../auth/permission/permission.guard'
import { RequirePermission } from '../auth/permission/permission.decorator'

@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('clientes.ver')
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly service: ClientesService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Post()
  create(@Body() dto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto) {
    return this.service.update(+id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id)
  }
}
