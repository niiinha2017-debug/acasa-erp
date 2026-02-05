import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { AlterarSenhaDto } from './dto/alterar-senha.dto'
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto'
import { CreateUsuarioDto } from './dto/cadastro.dto'
import { RefreshDto } from './dto/refresh.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

@Post('login')
@HttpCode(HttpStatus.CREATED)
async login(@Body() dto: LoginDto) {
  console.log('AUTH LOGIN HIT:', {
    usuario: dto?.usuario,
    hasSenha: !!dto?.senha,
    ts: new Date().toISOString(),
  })

  const r = await this.authService.login(dto.usuario, dto.senha)

  console.log('AUTH LOGIN OK:', {
    userId: r?.usuario?.id,
    status: r?.usuario?.status,
    precisaTrocarSenha: r?.precisa_trocar_senha,
    ts: new Date().toISOString(),
  })

  return r
}


  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    if (!dto?.refresh_token) throw new UnauthorizedException('Sessão expirada')
    return this.authService.refresh(dto.refresh_token)
  }

  @Post('cadastro')
  cadastro(@Body() dto: CreateUsuarioDto) {
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
  async logout() {
    // ✅ no app, logout é só apagar token/refresh no Flutter
    return { ok: true }
  }
}
