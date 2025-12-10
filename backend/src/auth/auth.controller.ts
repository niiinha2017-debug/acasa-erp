import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  // @UseGuards(AuthGuard('local')) -- Se você estivesse usando a Strategy Local
  // Por enquanto, vamos usar a validação direta para simplificar:
  @Post('login')
  async login(@Request() req) {
    // Busca o usuário pelo body da requisição
    const validatedUser = await this.authService.validateUser(
      req.body.username,
      req.body.password,
    );
    
    if (!validatedUser) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    
    // Se for válido, gera o token JWT
    return this.authService.login(validatedUser);
  }
}