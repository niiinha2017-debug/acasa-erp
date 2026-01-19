import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs'; // Alterado para bcryptjs para manter consistência com o seu seed
import { PrismaService } from '../prisma/prisma.service';
import { CadastroDto } from './dto/cadastro.dto';
import { PermissoesService } from '../permissoes/permissoes.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly permissoesService: PermissoesService,
  ) {}

  // =========================
  // LOGIN (usuario OU email)
  // =========================
  async login(usuario: string, senha: string) {
    const loginLimpo = String(usuario || '').trim().toLowerCase();
    const isEmail = loginLimpo.includes('@');

    // Busca o usuário apenas pelos campos que restaram no seu model
    const registro = await this.prisma.usuarios.findFirst({
      where: isEmail ? { email: loginLimpo } : { usuario: loginLimpo },
    });

    if (!registro) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    // Validação da senha
    const senhaOk = await bcrypt.compare(senha, registro.senha);
    if (!senhaOk) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    if (registro.status !== 'ATIVO') {
      throw new UnauthorizedException('Este usuário está inativo');
    }

    // Busca as permissões na tabela pivô através do serviço dedicado
    let permissoes: string[] = [];
    try {
      permissoes = await this.permissoesService.permissoesDoUsuarioPorId(registro.id);
    } catch (e) {
      permissoes = [];
    }

    const payload = {
      sub: registro.id,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
      // Opcional: incluir permissões no payload do JWT se o token não ficar muito grande
      // permissoes, 
    };

    const token = await this.jwt.signAsync(payload);

    return {
      token,
      usuario: {
        id: registro.id,
        nome: registro.nome,
        usuario: registro.usuario,
        email: registro.email,
        status: registro.status,
        criado_em: registro.criado_em,
        permissoes, // Retorna as permissões para o frontend
      },
    };
  }

  // =========================
  // CADASTRO
  // =========================
  async cadastro(dto: CadastroDto) {
    // Garanta que o DTO não envie 'setor' ou 'funcao'
    const senhaHash = await bcrypt.hash(dto.senha, 10);

    try {
      const criado = await this.prisma.usuarios.create({
        data: {
          nome: dto.nome,
          usuario: dto.usuario.toLowerCase().trim(),
          email: dto.email.toLowerCase().trim(),
          senha: senhaHash,
          status: dto.status || 'ATIVO',
        },
      });

      // Retorno formatado sem a senha
      const { senha, ...result } = criado;
      return result;
      
    } catch (e: any) {
      // P2002 é o erro de restrição de unicidade do Prisma (@unique)
      if (e?.code === 'P2002') {
        const alvo = e?.meta?.target;
        throw new BadRequestException(`Já existe um cadastro com este ${alvo}`);
      }
      throw e;
    }
  }

  // =========================
  // AUTH / ME (Verificar perfil logado)
  // =========================
  async me(usuarioId: number) {
    const registro = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });

    if (!registro) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let permissoes: string[] = [];
    try {
      permissoes = await this.permissoesService.permissoesDoUsuarioPorId(usuarioId);
    } catch (e) {
      permissoes = [];
    }

    return {
      id: registro.id,
      nome: registro.nome,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
      criado_em: registro.criado_em,
      permissoes,
    };
  }
}