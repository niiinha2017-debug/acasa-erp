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
   
  ],
})
export class AppModule {}
