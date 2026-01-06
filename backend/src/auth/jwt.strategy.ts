import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
  sub: number;
  usuario: string;
  email: string;
  status: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

async validate(payload: any) { // Use any ou atualize seu Type JwtPayload
  if (!payload?.sub) throw new UnauthorizedException('Token inválido');
  
  // O retorno aqui vira o 'req.user' que o sistema todo vai usar
  return { 
    id: payload.sub, 
    usuario: payload.usuario, 
    setor: payload.setor, // <-- É crucial que o setor venha no Token!
    status: payload.status 
  };
}
}
