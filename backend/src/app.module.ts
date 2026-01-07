// app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { join } from 'path'

// PRISMA
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RecuperacaoSenhaModule } from './recuperacao-senha/recuperacao-senha.module';
import { MailModule } from './mail/mail.module';
import { ClientesModule } from './clientes/clientes.module'
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { ProdutosModule } from './produtos/produtos.module';
import { PlanoCorteModule } from './plano-corte/plano-corte.module';
import { PlanoCorteConsumosModule } from './plano-corte-consumos/plano-corte-consumos.module';
import { PlanoCorteItensModule } from './plano-corte-itens/plano-corte-itens.module';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { ConstantesModule } from './constantes/constantes.module';

@Module({
  imports: [
    // 🔑 ENV
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env.production'),
        join(process.cwd(), '.env'),
      ],
    }),

    // 🧠 ORM ÚNICO
    PrismaModule,

    AuthModule,

    UsuariosModule,

    RecuperacaoSenhaModule,

    MailModule,

    ClientesModule,

    FornecedoresModule,

    ProdutosModule,

    PlanoCorteModule,

    PlanoCorteConsumosModule,

    PlanoCorteItensModule,

    FuncionariosModule,

    ConstantesModule,
   
  ],
})
export class AppModule {}
