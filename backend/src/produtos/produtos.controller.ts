import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete
} from '@nestjs/common'
import { ProdutosService } from './produtos.service'
import { Produto } from './produto.entity'

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  // CREATE
  @Post()
  async create(@Body() body: Partial<Produto>) {
    return this.service.create(body)
  }

  // LIST
  @Get()
  async findAll() {
    return this.service.findAll()
  }

  // GET ONE
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id))
  }

  // UPDATE
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<Produto>
  ) {
    return this.service.update(Number(id), body)
  }

  // DELETE
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
