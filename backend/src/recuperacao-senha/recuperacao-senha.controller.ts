import { Body, Controller, Post } from '@nestjs/common';
import { RecuperacaoSenhaService } from './recuperacao-senha.service';
import { SolicitarRecuperacaoDto } from './dto/solicitar-recuperacao.dto';
import { ConfirmarRecuperacaoDto } from './dto/confirmar-recuperacao.dto';

@Controller('recuperacao-senha')
export class RecuperacaoSenhaController {
  constructor(private readonly service: RecuperacaoSenhaService) {}

  @Post('solicitar')
  async solicitar(@Body() dto: SolicitarRecuperacaoDto) {
    return this.service.solicitar(dto.email);
  }

  @Post('confirmar')
  async confirmar(@Body() dto: ConfirmarRecuperacaoDto) {
    return this.service.confirmar(dto.token, dto.senha_nova);
  }
}
