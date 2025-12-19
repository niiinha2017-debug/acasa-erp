// app.module.ts
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
import { InsumoPlanoCorteModule } from './plano-corte/insumo-plano-corte.module'

// FINANCEIRO
import { DespesasModule } from './despesas/despesas.module'
import { FinanceiroModule } from './financeiro/financeiro.module'
import { TarefasModule } from './tarefas/tarefas.module'

// VENDAS / OUTROS
import { OrcamentosModule } from './orcamento/orcamentos.module'
import { CnpjModule } from './cnpj/cnpj.module'
import { ConstantesModule } from './constants/constantes.module'

@Module({
  imports: [
    // 🔑 ENV — PRODUÇÃO (EC2)
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.production', '.env'],
}),


    // 🗄️ DATABASE
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
    InsumoPlanoCorteModule,

    // FINANCEIRO
    DespesasModule,
    FinanceiroModule,
    TarefasModule,

    // OUTROS
    OrcamentosModule,
    CnpjModule,
    ConstantesModule,
  ],
})
export class AppModule {}
