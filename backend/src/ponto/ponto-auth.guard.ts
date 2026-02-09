import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class PontoAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = String(req.headers['authorization'] || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

    if (!token) throw new UnauthorizedException('Token do Ponto ausente');

    const token_hash = sha256(token);

    const dispositivo = await this.prisma.ponto_dispositivos.findFirst({
      where: {
        token_hash,
        status: 'ATIVO',
      },
      include: {
        funcionario: true,
      },
    });

    if (!dispositivo)
      throw new UnauthorizedException('Token do Ponto inválido ou revogado');

    // injeta no request p/ controller usar
    req.ponto = {
      dispositivo_id: dispositivo.id,
      funcionario_id: dispositivo.funcionario_id,
    };

    // atualiza último uso
    await this.prisma.ponto_dispositivos.update({
      where: { id: dispositivo.id },
      data: { ultimo_uso_em: new Date() },
    });

    return true;
  }
}
