import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  /**
   * Rota raiz da API
   * Útil para verificar se o servidor está online (Health Check)
   */
  @Get()
  getHello(): string {
    return this.service.getHello();
  }
}
