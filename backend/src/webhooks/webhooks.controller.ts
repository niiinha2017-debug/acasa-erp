import { Controller } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

/**
 * Webhooks externos. Rotas públicas, sem JWT.
 * Adicione aqui endpoints para integrações externas, se necessário.
 */
@Public()
@Controller('webhooks')
export class WebhooksController {}
