import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

@Post('login')
login(@Body() dto: LoginDto) {
  console.log('Tentativa de login recebida para:', dto.usuario); // Adicione isso para debug
  return this.authService.login(dto.usuario, dto.senha);
}


  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    const user: any = (req as any).user
    return this.authService.me(Number(user.id))
  }
}
