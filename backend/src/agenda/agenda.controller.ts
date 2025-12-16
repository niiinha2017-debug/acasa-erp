import { Controller, Get, Post, Body } from '@nestjs/common'
import { AgendaService } from './agenda.service'

@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }
}
