import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ClientesModule } from './clientes/clientes.module'
import { FuncionariosModule } from './funcionarios/funcionarios.module'
import { FornecedoresModule } from './fornecedores/fornecedores.module'
import { ProdutosModule } from './produtos/produtos.module'
import { ComprasModule } from './compras/compras.module'
import { VendasModule } from './vendas/vendas.module';
import { VendasFornecedorModule } from './vendas-fornecedor/vendas-fornecedor.module';

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

    // MÓDULOS
    UsersModule,
    AuthModule,
    ClientesModule,
    FuncionariosModule,
    FornecedoresModule,
    ProdutosModule,
    ComprasModule,
    VendasModule,
    VendasFornecedorModule,
  ],
})
export class AppModule {}
