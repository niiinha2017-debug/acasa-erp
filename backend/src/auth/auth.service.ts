import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Senha inválida.');
    }

const token = this.jwtService.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
  },
  {
    secret: process.env.JWT_SECRET || 'acasa_fallback_secret',
    expiresIn: '1d',
  },
);


    return {
      message: 'Login efetuado com sucesso!',
      token, // Retorna o token
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
