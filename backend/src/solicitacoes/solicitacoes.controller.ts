// Adicione o 'Get' aqui dentro das chaves { ... }
import { Controller, Post, Body, Get } from '@nestjs/common'; 
import { SolicitacoesService } from './solicitacoes.service';

@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly solicitacoesService: SolicitacoesService) {}

  @Post('registrar')
  async registrar(@Body() dados: any) {
    return this.solicitacoesService.criarSolicitacao(dados);
  }

  @Get('lista-pendente') // Agora o 'Get' será reconhecido!
  async listar() {
    return this.solicitacoesService.buscarTodas();
  }
}