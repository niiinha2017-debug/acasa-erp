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
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { CreateUsuarioDto } from './dto/cadastro.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK) // Alterado para 200 (mais comum para login)
  async login(@Body() dto: LoginDto) {
    // O AuthService agora retorna 'precisa_trocar_senha'
    return await this.authService.login(dto.usuario, dto.senha);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    if (!dto?.refresh_token) throw new UnauthorizedException('Refresh token ausente');
    return this.authService.refresh(dto.refresh_token);
  }

  // Endpoint que o ADMIN usa para criar o funcionário
  @Post('cadastro')
  @HttpCode(HttpStatus.CREATED)
  cadastro(@Body() dto: CreateUsuarioDto) {
    return this.authService.cadastro(dto);
  }

  @Post('esqueci-senha')
  @HttpCode(HttpStatus.OK)
  esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    return this.authService.esqueciSenha(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('alterar-senha')
  @HttpCode(HttpStatus.OK)
  async alterarSenha(@Req() req: Request, @Body() dto: AlterarSenhaDto) {
    // IMPORTANTE: No JWT o ID costuma estar no 'sub'. 
    // Ajustado para pegar de 'sub' caso o 'id' não exista no objeto user.
    const user = (req as any).user;
    const userId = user.id || user.sub; 

    return await this.authService.alterarSenha(
      Number(userId),
      dto.senha_atual,
      dto.senha_nova,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const user = (req as any).user;
    const userId = user.id || user.sub;

    return await this.authService.me(Number(userId));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { ok: true };
  }
}