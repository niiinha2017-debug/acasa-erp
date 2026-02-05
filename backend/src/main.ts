import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // ✅ ADICIONE ISSO
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ✅ ADICIONE O VALIDATION PIPE AQUI
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Remove campos que não estão no DTO
    forbidNonWhitelisted: true, // Dá erro se mandarem campos extras
    transform: true,        // Converte tipos (ex: string para number) automaticamente
  }));

  app.use(cookieParser());

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://192.168.15.155:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://acasamarcenaria.com.br',
      'https://www.acasamarcenaria.com.br',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend rodando na porta 3000 com Validações Ativas');
}

bootstrap();