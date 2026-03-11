import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MedicaoFinaService } from './medicao-fina.service';
import { CreateMedicaoFinaDto } from './dto/create-medicao-fina.dto';
import { UpdateMedicaoFinaDto } from './dto/update-medicao-fina.dto';
import { FinalizarMedicaoTotemDto } from './dto/finalizar-medicao-totem.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('medicao-fina')
export class MedicaoFinaController {
  constructor(private readonly service: MedicaoFinaService) {}

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  /** Resolve projeto_id por id ou código (query: q=123 ou q=PROJ-2025-001) */
  @Get('projeto/resolver')
  @Permissoes('agendamentos.vendas', 'agendamentos.ver')
  resolverProjeto(@Query('q') q: string) {
    return this.service.resolverProjetoId(q || '');
  }

  /** Lista projetos do cliente (para buscar por cliente e carregar ambientes) */
  @Get('projetos-por-cliente/:clienteId')
  @Permissoes('agendamentos.vendas', 'agendamentos.ver')
  projetosPorCliente(@Param('clienteId') clienteId: string) {
    return this.service.listarProjetosPorCliente(this.cleanId(clienteId));
  }

  /** Dados do projeto e cliente (para exibir após abrir medição) */
  @Get('projeto/:projetoId/dados')
  @Permissoes('agendamentos.vendas', 'agendamentos.ver')
  getProjetoComCliente(@Param('projetoId') projetoId: string) {
    return this.service.getProjetoComCliente(this.cleanId(projetoId));
  }

  /** Validar medição: define status do projeto como Pronto para Produção */
  @Post('projeto/:projetoId/validar')
  @Permissoes('agendamentos.vendas')
  validarMedicao(@Param('projetoId') projetoId: string) {
    return this.service.validarMedicao(this.cleanId(projetoId));
  }

  /** Lista nomes dos ambientes (vendas_itens) do projeto */
  @Get('projeto/:projetoId/ambientes')
  @Permissoes('agendamentos.vendas', 'agendamentos.ver')
  listarAmbientes(@Param('projetoId') projetoId: string) {
    return this.service.listarAmbientesPorProjeto(this.cleanId(projetoId));
  }

  /** Lista todas as medições finas do projeto */
  @Get('projeto/:projetoId')
  @Permissoes('agendamentos.vendas', 'agendamentos.ver')
  listarPorProjeto(@Param('projetoId') projetoId: string) {
    return this.service.listarPorProjeto(this.cleanId(projetoId));
  }

  /** Busca ou cria medição fina por projeto + ambiente (query: ambiente = nome) */
  @Get('projeto/:projetoId/ambiente')
  @Permissoes('agendamentos.vendas', 'agendamentos.ver')
  findByProjetoAndAmbiente(
    @Param('projetoId') projetoId: string,
    @Query('ambiente') ambiente: string,
  ) {
    return this.service.findByProjetoAndAmbiente(
      this.cleanId(projetoId),
      ambiente || '',
    );
  }

  /** Totem: finalizar medição e enviar para engenharia (atualiza tarefa para Medido - Aguardando Técnico) */
  @Post('finalizar-totem')
  @Permissoes('agendamentos.vendas', 'agendamentos.producao')
  finalizarTotem(@Body() dto: FinalizarMedicaoTotemDto) {
    return this.service.finalizarMedicaoTotem(dto);
  }

  /** Cria ou atualiza medição fina (upsert por projeto_id + nome_ambiente) */
  @Post()
  @Permissoes('agendamentos.vendas')
  salvar(@Body() dto: CreateMedicaoFinaDto) {
    return this.service.salvar(dto);
  }

  /** Atualiza medição fina por id */
  @Put(':id')
  @Permissoes('agendamentos.vendas')
  atualizar(@Param('id') id: string, @Body() dto: UpdateMedicaoFinaDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }
}
