// backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/user.module'; 
import { ConfigModule } from '@nestjs/config'; // Módulo necessário

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    TypeOrmModule.forRoot({
      type: 'mysql', // CORREÇÃO: MySQL
      host: process.env.DB_HOST,
      // Usar valor padrão para resolver TS2345
      port: parseInt(process.env.DB_PORT || '3306', 10), 
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // Assumindo que a Entity está em src/users/entities/user.ts
      entities: [__dirname + '/**/*.ts'], 
      synchronize: true, 
    }),
    UsersModule, // Importa o UsersModule
    // ... outros módulos
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}