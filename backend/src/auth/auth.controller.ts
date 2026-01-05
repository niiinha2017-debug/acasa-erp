import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CadastroDto } from './dto/cadastro.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.usuario, dto.senha);
  }

  @Post('cadastro')
  async cadastro(@Body() dto: CadastroDto) {
    return this.authService.cadastro(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // req.user vem do JwtStrategy.validate()
    return this.authService.me(req.user.sub);
  }
}
