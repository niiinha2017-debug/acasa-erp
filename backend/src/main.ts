import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { HttpExceptionFilter } from './common/http-exception.filter';

// Carrega .env: backend (cwd) tem prioridade; fallbacks para monorepo sem sobrescrever
loadEnv({ path: join(process.cwd(), '.env'), override: true });
loadEnv({ path: join(process.cwd(), 'backend', '.env'), override: false });
loadEnv({ path: join(__dirname, '..', '.env'), override: false });

const logDir = join(process.cwd(), 'logs');
const runtimeLogFile = join(logDir, 'runtime-errors.log');

function persistRuntimeError(label: string, error: unknown) {
  try {
    mkdirSync(logDir, { recursive: true });
    const normalized =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack || ''}`
        : typeof error === 'string'
          ? error
          : JSON.stringify(error, null, 2);
    appendFileSync(
      runtimeLogFile,
      `[${new Date().toISOString()}] ${label}\n${normalized}\n\n`,
      'utf8',
    );
  } catch {
    // Evita travar o bootstrap por falha de IO no log.
  }
}

process.on('unhandledRejection', (reason) => {
  persistRuntimeError('unhandledRejection', reason);
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  persistRuntimeError('uncaughtException', error);
  console.error('Uncaught exception:', error);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());

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

  // CORS: ERP, PWA de ponto, APK (Capacitor), Tauri. Mesmo backend para web e app nativo.
  app.enableCors({
    origin: [
      'https://localhost',
      'capacitor://localhost',   // Capacitor iOS / WebView
      'http://localhost',       // Capacitor Android
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'tauri://localhost',
      'http://tauri.localhost',
      'https://acasamarcenaria.com.br',
      'https://www.acasamarcenaria.com.br',
      'https://contrato.acasamarcenaria.com.br',
      'https://ponto.acasamarcenaria.com.br',
      'http://localhost:5174',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    preflightContinue: false, // NestJS responde ao OPTIONS com os headers CORS
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend rodando em http://localhost:${port}/api (Validações Ativas)`);
  console.log(`   Escutando em 0.0.0.0:${port} (aceita conexões do host)`);
  console.log('Backend Ready.');
}

bootstrap().catch((err) => {
  persistRuntimeError('bootstrap', err);
  console.error('Falha ao iniciar o backend:', err?.message || err);
  if (String(err?.message || '').includes('EADDRINUSE')) {
    const port = Number(process.env.PORT || 3000);
    console.error(`A porta ${port} já está em uso. Feche o outro processo ou altere a porta.`);
  }
  process.exit(1);
});
