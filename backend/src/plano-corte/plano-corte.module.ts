import { Module } from '@nestjs/common';
import { PlanoCorteController } from './controllers/plano-corte.controller';
import { PlanoCorteItensController } from './controllers/plano-corte-itens.controller';
import { PlanoCorteConsumosController } from './controllers/plano-corte-consumos.controller';

import { PlanoCorteService } from './service/plano-corte.service';
import { PlanoCorteItensService } from './service/plano-corte-itens.service';
import { PlanoCorteConsumosService } from './service/plano-corte-consumos.service';
import { ProdutosModule } from '../produtos/produtos.module';

@Module({
  imports: [ProdutosModule],
  controllers: [
    PlanoCorteController,
    PlanoCorteItensController,
    PlanoCorteConsumosController,
  ],
  providers: [
    PlanoCorteService,
    PlanoCorteItensService,
    PlanoCorteConsumosService,
  ],
})
export class PlanoCorteModule {}
