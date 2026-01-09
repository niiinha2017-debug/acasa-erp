import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  Req, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CadastroDto } from './dto/cadastro.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK) // Padroniza o retorno como 200 em vez de 201 (opcional, mas comum para login)
  async login(@Body() dto: LoginDto) {
    // Padronização: sempre trate strings de entrada para evitar espaços vazios acidentais
    const usuario = dto.usuario.trim();
    const senha = dto.senha;
    
    return this.authService.login(usuario, senha);
  }

  @Post('cadastro')
  async cadastro(@Body() dto: CadastroDto) {
    // Opcional: Você pode forçar o email/usuario para lowercase aqui se não fez no DTO
    if (dto.email) dto.email = dto.email.toLowerCase().trim();
    
    return this.authService.cadastro(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // Padronização: Garantir que o ID extraído do Token seja tratado como número se o seu banco for Int
    const userId = Number(req.user.sub);
    
    return this.authService.me(userId);
  }
}