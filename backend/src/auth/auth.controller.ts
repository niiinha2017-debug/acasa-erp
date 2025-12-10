import { 
  Controller, 
  Post, 
  Request, 
  UseGuards, 
  UnauthorizedException // 1. CLASSE AGORA IMPORTADA
} from '@nestjs/common'; // <-- Importe do pacote @nestjs/common

import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Request() req) {
    const validatedUser = await this.authService.validateUser(
      req.body.username,
      req.body.password,
    );
    
    // 2. ADICIONE A VERIFICAÇÃO DE FALHA AQUI
    if (!validatedUser) {
      // O TypeScript agora reconhecerá essa classe
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    
    // 3. Se for válido, gera o token JWT
    return this.authService.login(validatedUser);
  }
}