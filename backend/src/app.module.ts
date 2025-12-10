import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // 1. Carrega as variáveis do arquivo .env (onde estará a senha)
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Configura a conexão com o MySQL
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD, // A senha virá do arquivo .env
      database: process.env.DB_NAME || 'acasa_erp',
      entities: [], 
      synchronize: true, // Cria as tabelas sozinho (bom para dev)
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}