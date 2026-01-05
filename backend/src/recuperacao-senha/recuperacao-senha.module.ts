import { Module } from '@nestjs/common';
import { RecuperacaoSenhaController } from './recuperacao-senha.controller';
import { RecuperacaoSenhaService } from './recuperacao-senha.service';

@Module({
  controllers: [RecuperacaoSenhaController],
  providers: [RecuperacaoSenhaService]
})
export class RecuperacaoSenhaModule {}
