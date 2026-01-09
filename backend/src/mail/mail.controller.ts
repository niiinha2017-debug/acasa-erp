import { Controller, Get, Query, BadRequestException } from '@nestjs/common'
import { MailService } from './mail.service'

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('teste')
  async teste(@Query('para') para: string) {
    // Blindagem: impede o envio se o parâmetro "para" estiver vazio ou malformado
    if (!para || !para.includes('@')) {
      throw new BadRequestException('O parâmetro "para" deve ser um e-mail válido.');
    }

    // Limpeza: remove espaços acidentais (comum em cópia e cola)
    const emailLimpo = para.trim().toLowerCase();
    
    return this.mailService.enviarEmailTeste(emailLimpo);
  }
}