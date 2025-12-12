import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',        // FRONT LOCAL (Vite)
      'http://54.164.55.32',
      'https://54.164.55.32',
      'http://iniciantevencedor.com.br',
      'https://iniciantevencedor.com.br',
      'http://www.iniciantevencedor.com.br',
      'https://www.iniciantevencedor.com.br',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(3000);
}
bootstrap();
