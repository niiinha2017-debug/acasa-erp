import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { ContratosPublicController } from './contratos-publico.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClausulasModule } from '../clausulas/clausulas.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    ClausulasModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ||
          process.env.JWT_SECRET ||
          'acasa_dev_secret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [ContratosController, ContratosPublicController],
  providers: [ContratosService],
  exports: [ContratosService],
})
export class ContratosModule {}
