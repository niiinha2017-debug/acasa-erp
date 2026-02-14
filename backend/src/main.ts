import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // ✅ ADICIONE ISSO
import cookieParser from 'cookie-parser';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

loadEnv({ path: join(process.cwd(), 'backend', '.env'), override: true });
loadEnv({ path: join(__dirname, '..', '.env'), override: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ✅ ValidationPipe: whitelist remove campos extras; forbidNonWhitelisted desativado
  // para evitar 400 em rotas GET (ex: /despesas) quando o client envia body/params extras
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos que não estão no DTO
      forbidNonWhitelisted: false, // Evita 400 em GET/rotas sem DTO
      transform: true, // Converte tipos (ex: string para number) automaticamente
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: [
      'https://localhost',
      'capacitor://localhost',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'tauri://localhost', // ✅ Importante para Tauri v1 (Windows)
      'http://tauri.localhost', // ✅ Importante para Tauri v2
      'https://acasamarcenaria.com.br',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend rodando na porta 3000 com Validações Ativas');
}

bootstrap();
