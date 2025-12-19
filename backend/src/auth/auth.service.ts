import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log('--- DIAGNÓSTICO DE LOGIN ---');
    console.log('Tentando validar email:', email);
    
    const user = await this.usersService.findByEmail(email);
    
    if (user) {
      console.log('Usuário encontrado no banco. Comparando senhas...');
      const isMatch = await bcrypt.compare(pass, user.password);
      console.log('Resultado do Match (Bcrypt):', isMatch);

      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    } else {
      console.log('Usuário não encontrado para o email:', email);
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
