// backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/user.module'; 
import { ConfigModule } from '@nestjs/config'; 

@Module({
  imports: [
    // 1. ConfigModule para ler o .env (resolve TS2345 ao fornecer valores)
    ConfigModule.forRoot({ isGlobal: true }), 
    
    TypeOrmModule.forRoot({
      type: 'mysql', // CORREÇÃO CRÍTICA PARA MYSQL
      host: process.env.DB_HOST,
      // 2. Usar valores default se for undefined
      port: parseInt(process.env.DB_PORT, 10) || 3306, 
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'], 
      synchronize: true, 
    }),
    UsersModule, 
    // Outros Módulos
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}