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

  private getRefreshSecret() {
    return (
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      'acasa_dev_secret'
    );
  }

  private async buscarUsuarioPorLogin(loginLimpo: string, isEmail: boolean) {
    try {
      return await this.prisma.usuarios.findFirst({
        where: isEmail ? { email: loginLimpo } : { usuario: loginLimpo },
      });
    } catch (error: any) {
      if (error?.code === 'P5010') {
        await this.prisma.$disconnect();
        await this.prisma.$connect();
        return await this.prisma.usuarios.findFirst({
          where: isEmail ? { email: loginLimpo } : { usuario: loginLimpo },
        });
      }
      throw error;
    }
  }

  // 1. REFRESH TOKEN (Necessário para o build)
  async refresh(refreshToken: string) {
    try {
      const decoded = await this.jwt.verifyAsync(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      const userId = Number(decoded?.sub);
      if (!userId) throw new UnauthorizedException('Sessão inválida');

      const user = await this.prisma.usuarios.findUnique({
        where: { id: userId },
        select: {
          id: true,
          usuario: true,
          email: true,
          status: true,
          is_admin: true,
        },
      });

      if (!user || user.status === 'INATIVO') {
        throw new UnauthorizedException('Sessão inválida ou conta desativada');
      }

      const payload = {
        sub: user.id,
        usuario: user.usuario,
        email: user.email,
        status: user.status,
        is_admin: user.is_admin,
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

    const registro = await this.buscarUsuarioPorLogin(loginLimpo, isEmail);

    if (!registro) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    if (!registro.senha || typeof registro.senha !== 'string') {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    let senhaOk = false;
    try {
      senhaOk = await bcrypt.compare(senha, registro.senha);
    } catch {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }
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
      select: { id: true },
    });

    const payload = {
      sub: registro.id,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
      is_admin: registro.is_admin,
    };

    const token = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    const refresh_token = await this.jwt.signAsync(
      { sub: registro.id },
      { expiresIn: '7d', secret: this.getRefreshSecret() }, // 7 dias: evita logout precoce; access token continua 15m
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
        is_admin: registro.is_admin,
        funcionario_id: registro.funcionario_id,
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
    const senhaManual = String(dto.senha || '').trim();
    const usarSenhaManual = senhaManual.length > 0;
    const senhaFinal = usarSenhaManual
      ? senhaManual
      : this.gerarSenhaProvisoria();
    const senhaHash = await bcrypt.hash(senhaFinal, 10);

    try {
      const criado = await this.prisma.usuarios.create({
        data: {
          nome: dto.nome,
          usuario: usuarioLimpo,
          email: emailLimpo,
          senha: senhaHash,
          status: 'PENDENTE',
          cargo: dto.cargo ?? undefined,
        },
      });

      // 🔐 Atribuir permissões padrão mínimas do novo usuário
      // Mantém apenas Agenda (tela inicial) e tela de Pendente.
      try {
        const permissoesDefault = await this.prisma.permissoes.findMany({
          where: {
            chave: {
              in: ['agendamentos.ver', 'pendente.visualizar'],
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

      if (!usarSenhaManual) {
        await this.criarRecuperacaoSenha(criado.id, emailLimpo, senhaHash, senhaHash);

        await this.mailService.enviarSenhaProvisoria(
          emailLimpo,
          senhaFinal,
          criado.nome,
          criado.criado_em ?? new Date(),
        );
      }

      return { ...criado, email_enviado: !usarSenhaManual };
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

    const recPendente = await this.prisma.recuperacao_senha.findFirst({
      where: { usuario_id: usuarioId, utilizado: false },
      orderBy: { criado_em: 'desc' },
      select: { id: true },
    });

    return {
      id: registro.id,
      nome: registro.nome,
      usuario: registro.usuario,
      email: registro.email,
      status: registro.status,
      is_admin: registro.is_admin,
      funcionario_id: registro.funcionario_id,
      permissoes,
      precisa_trocar_senha: !!recPendente,
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

    await this.prisma.$transaction(async (tx) => {
      await tx.usuarios.update({
        where: { id: usuario.id },
        data: { senha: senhaNovaHash, status: 'PENDENTE' },
      });
      await tx.$executeRaw`
        INSERT INTO recuperacao_senha (usuario_id, email, senha_antiga, senha_nova, utilizado)
        VALUES (${usuario.id}, ${emailLimpo}, ${usuario.senha}, ${senhaNovaHash}, 0)
      `;
    });

    await this.mailService.enviarSenhaProvisoria(
      emailLimpo,
      senhaProvisoria,
      usuario.nome,
    );
    return { ok: true };
  }

  async reenviarSenhaProvisoria(email: string) {
    const emailLimpo = String(email || '')
      .trim()
      .toLowerCase();

    const usuario = await this.prisma.usuarios.findUnique({
      where: { email: emailLimpo },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario com este e-mail nao encontrado.');
    }

    const senhaProvisoria = this.gerarSenhaProvisoria();
    const senhaNovaHash = await bcrypt.hash(senhaProvisoria, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.usuarios.update({
        where: { id: usuario.id },
        data: { senha: senhaNovaHash, status: 'PENDENTE' },
      });
      await tx.$executeRaw`
        INSERT INTO recuperacao_senha (usuario_id, email, senha_antiga, senha_nova, utilizado)
        VALUES (${usuario.id}, ${emailLimpo}, ${usuario.senha}, ${senhaNovaHash}, 0)
      `;
    });

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
      select: { id: true },
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

  /** Insere em recuperacao_senha sem usar coluna expira_em (compatível com DB atual). */
  private async criarRecuperacaoSenha(
    usuario_id: number,
    email: string,
    senha_antiga: string | null,
    senha_nova: string | null,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO recuperacao_senha (usuario_id, email, senha_antiga, senha_nova, utilizado)
      VALUES (${usuario_id}, ${email}, ${senha_antiga}, ${senha_nova}, 0)
    `;
  }
}
