import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitacoesService } from './solicitacoes.service';
import { SolicitacoesController } from './solicitacoes.controller';
import { SolicitacaoCadastro } from './entities/solicitacoe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitacaoCadastro])], // Importante para o banco funcionar
  controllers: [SolicitacoesController],
  providers: [SolicitacoesService],
  exports: [SolicitacoesService],
})
export class SolicitacoesModule {}