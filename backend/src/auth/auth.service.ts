import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Valida email + senha
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null; // usuário não encontrado
    }

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) {
      return null; // senha inválida
    }

    const { password, ...result } = user;
    return result;
  }

  async login(user: any) {
    // Payload do JWT:
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
