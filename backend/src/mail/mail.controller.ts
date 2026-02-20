import {
  Controller,
  Get,
  Query,
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  @Get('teste')
  @Permissoes('usuarios.ver')
  async teste(@Query('para') para: string) {
    const enabled = this.config.get<string>('MAIL_TEST_ENABLED') === 'true';
    if (!enabled)
      throw new ForbiddenException('Endpoint de teste desabilitado.');

    if (!para || !para.includes('@')) {
      throw new BadRequestException(
        'O parâmetro "para" deve ser um e-mail válido.',
      );
    }

    const emailLimpo = para.trim().toLowerCase();
    return this.mailService.enviarEmailTeste(emailLimpo);
  }
}
