import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/cadastro.dto';
import { PermissoesService } from '../permissoes/permissoes.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly permissoesService: PermissoesService,
    private readonly mailService: MailService,
  ) {}

  // 1. REFRESH TOKEN (Necessário para o build)
  async refresh(refreshToken: string) {
    try {
      const decoded = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const userId = Number(decoded?.sub);
      if (!userId) throw new UnauthorizedException('Sessão inválida');

      const user = await this.prisma.usuarios.findUnique({
        where: { id: userId },
        select: { id: true, usuario: true, email: true, status: true },
      });

      if (!user || user.status === 'INATIVO') {
        throw new UnauthorizedException('Sessão inválida ou conta desativada');
      }

      const payload = {
        sub: user.id,
        usuario: user.usuario,
        email: user.email,
        status: user.status,
      };

      const token = await this.jwt.signAsync(payload, { expiresIn: '15m' });
      return { token };
    } catch {
      throw new UnauthorizedException('Sessão expirada');
    }
  }

  // 2. LOGIN
  async login(usuario: string, senha: string) {
    const loginLimpo = String(usuario || '')
      .trim()
      .toLowerCase();
    const isEmail = loginLimpo.includes('@');

    const registro = await this.prisma.usuarios.findFirst({
      where: isEmail ? { email: loginLimpo } : { usuario: loginLimpo },
    });

    if (!registro) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const senhaOk = await bcrypt.compare(senha, registro.senha);
    if (!senhaOk) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    if (registro.status === 'INATIVO') {
      throw new UnauthorizedException('Sua conta está desativada.');
    }

    let permissoes: string[] = [];
    try {
      permissoes = await this.permissoesService.permissoesDoUsuarioPorId(
        registro.id,
      );
    } catch {
      permissoes = [];
    }

    const recPendente = await this.prisma.recuperacao_senha.findFirst({
      where: { usuario_id: registro.id, utilizado: false },
      orderBy: { criado_em: 'desc' },
    });

    const payload = {
      sub: registro.id,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
    };

    const token = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    const refresh_token = await this.jwt.signAsync(
      { sub: registro.id },
      { expiresIn: '8h', secret: process.env.JWT_REFRESH_SECRET }, // Mude de 30d para 8h
    );

    return {
      token,
      refresh_token,
      precisa_trocar_senha: !!recPendente,
      usuario: {
        id: registro.id,
        nome: registro.nome,
        usuario: registro.usuario,
        email: registro.email,
        status: registro.status,
        permissoes,
      },
    };
  }

  // 3. CADASTRO (Admin cria funcionário)
  async cadastro(dto: CreateUsuarioDto) {
    const emailLimpo = String(dto.email || '')
      .trim()
      .toLowerCase();
    const usuarioLimpo = String(dto.usuario || '')
      .trim()
      .toLowerCase();
    const senhaProvisoria = this.gerarSenhaProvisoria();
    const senhaHash = await bcrypt.hash(senhaProvisoria, 10);

    try {
      const criado = await this.prisma.usuarios.create({
        data: {
          nome: dto.nome,
          usuario: usuarioLimpo,
          email: emailLimpo,
          senha: senhaHash,
          status: 'PENDENTE',
        },
      });

      // 🔐 Atribuir permissões padrão: INDEX e DASHBOARD
      // Estas são as telas que o novo usuário terá acesso ANTES de receber outras permissões
      try {
        const permissoesDefault = await this.prisma.permissoes.findMany({
          where: {
            chave: {
              in: [
                'index.visualizar',
                'dashboard.visualizar',
                'pendente.visualizar',
              ],
            },
          },
        });

        for (const perm of permissoesDefault) {
          await this.prisma.usuarios_permissoes
            .create({
              data: { usuario_id: criado.id, permissao_id: perm.id },
            })
            .catch(() => {}); // Ignora duplicadas
        }
      } catch (e) {
        // Se falhar, apenas loga. O usuário pode ter permissões atribuídas manualmente depois.
        console.warn(
          `[AUTH] Erro ao atribuir permissões padrão para usuário ${criado.id}: ${e}`,
        );
      }

      await this.prisma.recuperacao_senha.create({
        data: {
          usuario_id: criado.id,
          email: emailLimpo,
          senha_antiga: senhaHash,
          senha_nova: senhaHash,
          utilizado: false,
        },
      });

      await this.mailService.enviarSenhaProvisoria(
        emailLimpo,
        senhaProvisoria,
        criado.nome,
      );

      return { ...criado, email_enviado: true };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException(`Já existe um cadastro com este dado.`);
      }
      throw e;
    }
  }

  // 4. ME (Necessário para o build)
  async me(usuarioId: number) {
    const registro = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });
    if (!registro) throw new NotFoundException('Usuário não encontrado');

    let permissoes: string[] = [];
    try {
      permissoes =
        await this.permissoesService.permissoesDoUsuarioPorId(usuarioId);
    } catch {
      permissoes = [];
    }

    return {
      id: registro.id,
      nome: registro.nome,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
      funcionario_id: registro.funcionario_id,
      permissoes,
    };
  }

  // 5. ESQUECI SENHA (Necessário para o build)
  async esqueciSenha(email: string) {
    const emailLimpo = String(email || '')
      .trim()
      .toLowerCase();
    const usuario = await this.prisma.usuarios.findUnique({
      where: { email: emailLimpo },
    });

    if (!usuario) return { ok: true };

    const senhaProvisoria = this.gerarSenhaProvisoria();
    const senhaNovaHash = await bcrypt.hash(senhaProvisoria, 10);

    await this.prisma.$transaction([
      this.prisma.usuarios.update({
        where: { id: usuario.id },
        data: { senha: senhaNovaHash },
      }),
      this.prisma.recuperacao_senha.create({
        data: {
          usuario_id: usuario.id,
          email: emailLimpo,
          senha_antiga: usuario.senha,
          senha_nova: senhaNovaHash,
          utilizado: false,
        },
      }),
    ]);

    await this.mailService.enviarSenhaProvisoria(
      emailLimpo,
      senhaProvisoria,
      usuario.nome,
    );
    return { ok: true };
  }

  // 6. ALTERAR SENHA (Ativa a conta)
  async alterarSenha(usuarioId: number, senhaAtual: string, senhaNova: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) throw new UnauthorizedException('Usuário inválido');

    const senhaOk = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaOk) throw new BadRequestException('Senha atual incorreta');

    const novaHash = await bcrypt.hash(senhaNova, 10);
    const rec = await this.prisma.recuperacao_senha.findFirst({
      where: { usuario_id: usuarioId, utilizado: false },
      orderBy: { criado_em: 'desc' },
    });

    await this.prisma.$transaction([
      this.prisma.usuarios.update({
        where: { id: usuarioId },
        data: { senha: novaHash, status: 'ATIVO' }, // Ativa aqui!
      }),
      ...(rec
        ? [
            this.prisma.recuperacao_senha.update({
              where: { id: rec.id },
              data: { utilizado: true },
            }),
          ]
        : []),
    ]);

    return { ok: true };
  }

  private gerarSenhaProvisoria() {
    const n = Math.floor(100000 + Math.random() * 900000);
    return `ACASA-${n}`;
  }
}
