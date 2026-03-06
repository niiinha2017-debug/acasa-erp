import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { N8nWebhookService } from './n8n-webhook.service';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TelegramService, N8nWebhookService, WhatsAppService],
  exports: [TelegramService, N8nWebhookService, WhatsAppService],
})
export class NotificationsModule {}
