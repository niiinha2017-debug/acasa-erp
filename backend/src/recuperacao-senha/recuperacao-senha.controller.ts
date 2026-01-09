import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { RecuperacaoSenhaService } from './recuperacao-senha.service';
import { SolicitarRecuperacaoDto } from './dto/solicitar-recuperacao.dto';
import { ConfirmarRecuperacaoDto } from './dto/confirmar-recuperacao.dto';

@Controller('recuperacao-senha')
export class RecuperacaoSenhaController {
  constructor(private readonly service: RecuperacaoSenhaService) {}

  /**
   * Solicita o envio do e-mail de recuperação.
   * Usamos HTTP 200 (OK) mesmo que o e-mail não exista por segurança (evita enumeração de usuários).
   */
  @Post('solicitar')
  @HttpCode(HttpStatus.OK)
  async solicitar(@Body() dto: SolicitarRecuperacaoDto) {
    return this.service.solicitar(dto.email);
  }

  /**
   * Confirma a troca da senha usando o token recebido.
   * Retornamos OK para confirmar que o processo de atualização foi concluído.
   */
  @Post('confirmar')
  @HttpCode(HttpStatus.OK)
  async confirmar(@Body() dto: ConfirmarRecuperacaoDto) {
    return this.service.confirmar(dto.token, dto.senha_nova);
  }
}