import { Controller } from '@nestjs/common';

/**
 * Webhooks externos. Rotas públicas, sem JWT.
 * Adicione aqui endpoints para integrações externas, se necessário.
 */
@Controller('webhooks')
export class WebhooksController {}
