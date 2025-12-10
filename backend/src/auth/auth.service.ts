import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Importe o bcrypt
import { UsersService } from '../users/users.service'; // Importe o UsersService

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, // Injeção do UsersService
    private jwtService: JwtService,
  ) {}

  // Novo método: Validar as credenciais (comparar senha com hash)
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    // 1. Verifica se o usuário existe
    if (!user) {
      return null;
    }

    // 2. Compara a senha informada (pass) com o hash salvo no banco (user.password)
    const isMatch = await bcrypt.compare(pass, user.password);

    if (user && isMatch) {
      // Se a senha for válida, remove o campo da senha para não retornar
      const { password, ...result } = user;
      return result; // Retorna o objeto do usuário sem a senha
    }
    
    return null; // Credenciais inválidas
  }


  // Método de Login (Que gera o token JWT)
  async login(user: any) {
    
    // O user que chega aqui já foi validado pelo 'validateUser' ou pela Strategy
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}