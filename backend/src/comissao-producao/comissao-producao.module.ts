import { Module } from '@nestjs/common';
import { RelatoriosModule } from '../relatorios/relatorios.module';
import { ComissaoProducaoController } from './comissao-producao.controller';
import { ComissaoProducaoService } from './comissao-producao.service';

@Module({
  imports: [RelatoriosModule],
  controllers: [ComissaoProducaoController],
  providers: [ComissaoProducaoService],
})
export class ComissaoProducaoModule {}
