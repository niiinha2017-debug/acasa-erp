import { Body, Controller, Get, Post, Req, Res, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { AlterarSenhaDto } from './dto/alterar-senha.dto'
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto'
import { CadastroDto } from './dto/cadastro.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Tentativa de login recebida para:', dto.usuario)

    const data: any = await this.authService.login(dto.usuario, dto.senha)

    // ✅ Se o service já devolver refresh_token, seta cookie HttpOnly
    if (data?.refresh_token) {
      const isProd = process.env.NODE_ENV === 'production'

      res.cookie('ACASA_REFRESH', data.refresh_token, {
        httpOnly: true,
        secure: isProd,     // prod: true (HTTPS). dev: false
        sameSite: 'lax',    // mesmo domínio => perfeito
        path: '/api/auth',  // só vai junto nos endpoints /api/auth/*
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
      })

      // ✅ não devolve refresh_token no JSON
      const { refresh_token, ...rest } = data
      return rest
    }

    // ✅ enquanto não existir refresh_token no service, retorna como estava
    return data
  }

@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Req() req: Request) {
  const refresh = (req as any).cookies?.ACASA_REFRESH
  if (!refresh) throw new UnauthorizedException('Sessão expirada')
  return this.authService.refresh(refresh)
}


  @Post('cadastro')
  cadastro(@Body() dto: CadastroDto) {
    return this.authService.cadastro(dto)
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
@Post('logout')
@HttpCode(HttpStatus.OK)
async logout(@Res({ passthrough: true }) res: Response) {
  const isProd = process.env.NODE_ENV === 'production'

  res.clearCookie('ACASA_REFRESH', {
    path: '/api/auth',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
  })

  return { message: 'Sessão encerrada' }
}

}
