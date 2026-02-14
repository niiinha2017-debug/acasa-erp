// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MailModule } from './mail/mail.module';
import { ClientesModule } from './clientes/clientes.module';
import { FornecedorModule } from './fornecedores/fornecedores.module';
import { ProdutosModule } from './produtos/produtos.module';
import { PlanoCorteModule } from './plano-corte/plano-corte.module';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { DespesasModule } from './despesas/despesas.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { VendasModule } from './vendas/vendas.module';
import { ContratosModule } from './contratos/contratos.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { ComprasModule } from './compras/compras.module';
import { PermissoesModule } from './permissoes/permissoes.module';
import { EmpresaModule } from './modulos/empresa.module';
import { UtilsModule } from './utils/utils.module';
import { PontoModule } from './ponto/ponto.module';
import { ArquivosModule } from './arquivos/arquivos.module';
import { AgendaModule } from './agenda/agenda.module';

@Module({
  imports: [
    // Local: usa .env
    // EC2/produção: usa .env.production (se existir)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? [
              join(__dirname, '..', '.env.production'),
              join(process.cwd(), 'backend', '.env.production'),
              join(__dirname, '..', '.env'),
              join(process.cwd(), 'backend', '.env'),
            ]
          : [
              join(__dirname, '..', '.env'),
              join(process.cwd(), 'backend', '.env'),
              join(__dirname, '..', '.env.production'),
              join(process.cwd(), 'backend', '.env.production'),
            ],
    }),

    ScheduleModule.forRoot(), // ✅ AQUI

    PrismaModule,
    ArquivosModule,
    AuthModule,
    UsuariosModule,
    MailModule,
    ClientesModule,
    FornecedorModule,
    ProdutosModule,
    PlanoCorteModule,
    FuncionariosModule,
    DespesasModule,
    OrcamentosModule,
    ContratosModule,
    FinanceiroModule,
    ComprasModule,
    PermissoesModule,
    EmpresaModule,
    UtilsModule,
    PontoModule,
    AgendaModule,
    VendasModule,
  ],
})
export class AppModule {}
