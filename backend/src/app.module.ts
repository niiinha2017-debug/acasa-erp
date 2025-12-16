import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

// CORE
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

// CADASTROS
import { ClientesModule } from './clientes/clientes.module'
import { FuncionariosModule } from './funcionarios/funcionarios.module'
import { FornecedoresModule } from './fornecedores/fornecedores.module'
import { ProdutosModule } from './produtos/produtos.module'
import { InsumosModule } from './insumos/insumos.module'

// OPERAÇÃO
import { ComprasModule } from './compras/compras.module'
import { VendasModule } from './vendas/vendas.module'
import { PlanoCorteModule } from './plano-corte/plano-corte.module'
import { AgendaModule } from './agenda/agenda.module'

// FINANCEIRO
import { DespesasModule } from './despesas/despesas.module'
import { FinanceiroModule } from './financeiro/financeiro.module'
import { TarefasModule } from './tarefas/tarefas.module';

// VENDAS
import { OrcamentosModule } from './orcamento/orcamentos.module';

@Module({
  imports: [
    // ENV
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // BANCO
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false,
    }),

    // CORE
    AuthModule,
    UsersModule,

    // CADASTROS
    ClientesModule,
    FuncionariosModule,
    FornecedoresModule,
    ProdutosModule,
    InsumosModule,

    // OPERAÇÃO
    ComprasModule,
    VendasModule,
    PlanoCorteModule,
    AgendaModule,

    // FINANCEIRO
    DespesasModule,
    FinanceiroModule,
    TarefasModule,

    //Vendas
     OrcamentosModule,
  ],
})
export class AppModule {}
