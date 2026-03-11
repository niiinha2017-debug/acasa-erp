import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { CreateContaReceberDto } from './dto/create-conta-receber.dto';
import { UpdateContaReceberDto } from './dto/update-conta-receber.dto';
import { ReceberContaReceberDto } from './dto/receber-conta-receber.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('financeiro/contas-receber')
export class ContasReceberController {
  constructor(private readonly service: FinanceiroService) {}

  private cleanIdOrFail(id: string | number): number {
    const n = Number(String(id).replace(/\D/g, ''));
    if (!Number.isFinite(n) || n <= 0)
      throw new BadRequestException('id inválido');
    return n;
  }

  @Get()
  @Permissoes('contas_receber.ver')
  listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('origem') origem?: string,
    @Query('status') status?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return this.service.listarContasReceber({
      fornecedor_id: fornecedor_id
        ? this.cleanIdOrFail(fornecedor_id)
        : undefined,
      cliente_id: cliente_id ? this.cleanIdOrFail(cliente_id) : undefined,
      origem: origem?.trim() || undefined,
      status: status?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
    });
  }

  @Get(':id')
  @Permissoes('contas_receber.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaReceber(this.cleanIdOrFail(id));
  }

  @Post()
  @Permissoes('contas_receber.criar')
  criar(@Body() dto: CreateContaReceberDto) {
    return this.service.criarContaReceber(dto);
  }

  @Put(':id')
  @Permissoes('contas_receber.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateContaReceberDto) {
    return this.service.atualizarContaReceber(this.cleanIdOrFail(id), dto);
  }

  @Post(':id/receber')
  @Permissoes('contas_receber.editar')
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string, @Body() dto: ReceberContaReceberDto) {
    return this.service.receberContaReceber(this.cleanIdOrFail(id), dto);
  }

  @Delete(':id')
  @Permissoes('contas_receber.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id') id: string): Promise<void> {
    await this.service.removerContaReceber(this.cleanIdOrFail(id));
  }
}
