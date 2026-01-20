import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { AlterarSenhaDto } from './dto/alterar-senha.dto'
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    console.log('Tentativa de login recebida para:', dto.usuario)
    return this.authService.login(dto.usuario, dto.senha)
  }

  @Post('esqueci-senha')
  esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    return this.authService.esqueciSenha(dto.email)
  }

  @UseGuards(JwtAuthGuard)
  @Post('alterar-senha')
  alterarSenha(@Req() req: Request, @Body() dto: AlterarSenhaDto) {
    const user: any = (req as any).user
    return this.authService.alterarSenha(
      Number(user.id),
      dto.senha_atual,
      dto.senha_nova,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    const user: any = (req as any).user
    return this.authService.me(Number(user.id))
  }
}
