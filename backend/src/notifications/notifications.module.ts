import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { N8nWebhookService } from './n8n-webhook.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TelegramService, N8nWebhookService],
  exports: [TelegramService, N8nWebhookService],
})
export class NotificationsModule {}
