import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CadastroDto } from './dto/cadastro.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // =========================
  // LOGIN
  // =========================
  async login(usuario: string, senha: string) {
    const registro = await this.prisma.usuarios.findUnique({
      where: { usuario },
    });

    if (!registro) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const senhaOk = await bcrypt.compare(senha, registro.senha);
    if (!senhaOk) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload = {
      sub: registro.id,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
    };

    const token = await this.jwt.signAsync(payload);

    return {
      token,
      usuario: {
        id: registro.id,
        nome: registro.nome,
        usuario: registro.usuario,
        email: registro.email,
        setor: registro.setor,
        funcao: registro.funcao,
        status: registro.status,
        criado_em: registro.criado_em,
        atualizado_em: registro.atualizado_em,
      },
    };
  }

  // =========================
  // CADASTRO
  // =========================
  async cadastro(dto: CadastroDto) {
    const senhaHash = await bcrypt.hash(dto.senha, 10);

    try {
      const criado = await this.prisma.usuarios.create({
        data: {
          nome: dto.nome,
          usuario: dto.usuario,
          email: dto.email,
          setor: dto.setor,
          funcao: dto.funcao,
          senha: senhaHash,
          status: dto.status,
        },
      });

      return {
        id: criado.id,
        nome: criado.nome,
        usuario: criado.usuario,
        email: criado.email,
        setor: criado.setor,
        funcao: criado.funcao,
        status: criado.status,
        criado_em: criado.criado_em,
        atualizado_em: criado.atualizado_em,
      };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const alvo = Array.isArray(e?.meta?.target)
          ? e.meta.target.join(', ')
          : 'usuario/email';
        throw new BadRequestException(`Já existe cadastro com: ${alvo}`);
      }
      throw e;
    }
  }

  // =========================
  // AUTH / ME
  // =========================
  async me(usuarioId: number) {
    const registro = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });

    if (!registro) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: registro.id,
      nome: registro.nome,
      usuario: registro.usuario,
      email: registro.email,
      setor: registro.setor,
      funcao: registro.funcao,
      status: registro.status,
      criado_em: registro.criado_em,
      atualizado_em: registro.atualizado_em,
    };
  }
}
