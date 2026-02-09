import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ClientesAniversarioJob } from './clientes-aniversario.job';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [ClientesService, ClientesAniversarioJob],
  controllers: [ClientesController],
})
export class ClientesModule {}
