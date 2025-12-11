// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Importe suas entidades (entities) aqui

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', // Ou 'mysql', 'sqlite', etc.
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [/* Lista das suas classes de Entidade */],
      synchronize: true, // Use SOMENTE em desenvolvimento
    }),
    // Outros Módulos, como AuthModule, UsersModule, etc.
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}