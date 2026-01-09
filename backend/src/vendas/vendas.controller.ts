import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Put, // Trocado Patch por Put para padronização
  Post, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { VendasService } from './vendas.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';

@Controller('vendas')
export class VendasController {
  constructor(private readonly service: VendasService) {}

  /**
   * Função de limpeza de IDs: Protege contra lixo vindo da URL (ex: :123 ou id-123)
   */
  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id));
  }

  @Post()
  criar(@Body() dto: CreateVendaDto) {
    return this.service.criar(dto);
  }

  @Put(':id') // Padronizado para atualização completa da venda
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateVendaDto,
  ) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Put(':id/status') // Padronizado para mudança de status (ex: Pendente -> Pago)
  atualizarStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.service.atualizarStatus(this.cleanId(id), body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204: Sucesso sem corpo de resposta
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }
}