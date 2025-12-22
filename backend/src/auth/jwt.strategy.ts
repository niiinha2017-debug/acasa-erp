import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret = process.env.JWT_SECRET;

    console.log('🔐 JWT STRATEGY INIT');
    console.log('JWT_SECRET existe?', !!jwtSecret);

    if (!jwtSecret) {
      throw new Error('JWT_SECRET não definido');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    console.log('🟢 JWT VALIDATE CHAMADO');
    console.log('Payload recebido:', payload);

    return {
      userId: payload.sub,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  }
}


