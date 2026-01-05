import { Controller, Get, Query } from '@nestjs/common'
import { MailService } from './mail.service'

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('teste')
  async teste(@Query('para') para: string) {
    return this.mailService.enviarEmailTeste(para)
  }
}
