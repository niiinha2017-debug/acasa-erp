import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport' // ✅ Adicionar este
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy' // ✅ Adicionar este import
import { PrismaModule } from '../prisma/prisma.module'
import { PermissoesModule } from '../permissoes/permissoes.module'

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PermissoesModule,
    // ✅ 1. Registrar o PassportModule
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  // ✅ 2. Adicionar o JwtStrategy aqui para que o Guard possa usá-lo
  providers: [AuthService, JwtStrategy], 
  // ✅ 3. Exportar para que outros módulos usem a proteção se necessário
  exports: [AuthService, PassportModule], 
})
export class AuthModule {}