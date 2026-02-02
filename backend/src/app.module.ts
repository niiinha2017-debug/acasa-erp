// app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { join } from 'path'
import { ScheduleModule } from '@nestjs/schedule'

import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsuariosModule } from './usuarios/usuarios.module'
import { RecuperacaoSenhaModule } from './recuperacao-senha/recuperacao-senha.module'
import { MailModule } from './mail/mail.module'
import { ClientesModule } from './clientes/clientes.module'
import { FornecedorModule } from './fornecedores/fornecedores.module'
import { ProdutosModule } from './produtos/produtos.module'
import { PlanoCorteModule } from './plano-corte/plano-corte.module'
import { FuncionariosModule } from './funcionarios/funcionarios.module'
import { DespesasModule } from './despesas/despesas.module'
import { OrcamentosModule } from './orcamentos/orcamentos.module'
import { VendasService } from './vendas/vendas.service'
import { VendasController } from './vendas/vendas.controller'
import { ProducaoModule } from './producao/producao.module'
import { FinanceiroModule } from './financeiro/financeiro.module'
import { ComprasModule } from './compras/compras.module'
import { PermissoesModule } from './permissoes/permissoes.module'
import { EmpresaModule } from './modulos/empresa.module'
import { UtilsModule } from './utils/utils.module'
import { ObrasModule } from './obras/obras.module'
import { PontoModule } from './ponto/ponto.module'
import { ArquivosModule } from './arquivos/arquivos.module'
import {ProducaoEncaminhamentoModule,} from './producao-encaminhamento/producao-encaminhamento.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env.production'),
        join(process.cwd(), '.env'),
      ],
    }),

    ScheduleModule.forRoot(), // ✅ AQUI

    PrismaModule,
    ArquivosModule,
    AuthModule,
    UsuariosModule,
    RecuperacaoSenhaModule,
    MailModule,
    ClientesModule,
    FornecedorModule,
    ProdutosModule,
    PlanoCorteModule,
    FuncionariosModule,
    DespesasModule,
    OrcamentosModule,
    ProducaoModule,
    FinanceiroModule,
    ComprasModule,
    PermissoesModule,
    EmpresaModule,
    UtilsModule,
    ObrasModule,
    PontoModule,
    ProducaoEncaminhamentoModule,
  ],
  controllers: [VendasController],
  providers: [VendasService],
})
export class AppModule {}
