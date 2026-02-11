import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async listar() {
    return this.prisma.usuarios.findMany({
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        status: true,
        criado_em: true,
        atualizado_em: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async buscarPorId(id: number) {
    const registro = await this.prisma.usuarios.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        status: true,
        criado_em: true,
        atualizado_em: true,
      },
    });

    if (!registro) throw new NotFoundException('Usuário não encontrado');
    return registro;
  }

  async criar(data: {
    nome: string;
    usuario: string;
    email: string;
    senha?: string;
    status?: string;
    enviar_senha_provisoria?: boolean;
  }) {
    const nome = String(data.nome || '').trim();
    const usuario = String(data.usuario || '')
      .trim()
      .toLowerCase();
    const email = String(data.email || '')
      .trim()
      .toLowerCase();

    const enviarSenhaProvisoria = data.enviar_senha_provisoria !== false;
    const senhaProvisoria = this.gerarSenhaProvisoria();
    const senhaBase = enviarSenhaProvisoria ? senhaProvisoria : data.senha;

    if (!senhaBase || String(senhaBase).length < 6) {
      throw new BadRequestException('Senha inválida para criação do usuário');
    }

    const senhaHash = await bcrypt.hash(senhaBase, 10);
    const status = enviarSenhaProvisoria
      ? 'PENDENTE'
      : String(data.status || 'PENDENTE').toUpperCase();

    try {
      const criado = await this.prisma.usuarios.create({
        data: {
          nome,
          usuario,
          email,
          senha: senhaHash,
          status,
        },
        select: {
          id: true,
          nome: true,
          usuario: true,
          email: true,
          status: true,
          criado_em: true,
          atualizado_em: true,
        },
      });

      if (!enviarSenhaProvisoria) {
        return { ...criado, email_enviado: false, email_destino: null };
      }

      await this.prisma.recuperacao_senha.create({
        data: {
          usuario_id: criado.id,
          email,
          senha_antiga: senhaHash,
          senha_nova: senhaHash,
          utilizado: false,
        },
      });

      try {
        await this.mailService.enviarSenhaProvisoria(
          email,
          senhaProvisoria,
          nome,
        );
        return { ...criado, email_enviado: true, email_destino: email };
      } catch (e) {
        await this.prisma.$transaction([
          this.prisma.recuperacao_senha.deleteMany({
            where: { usuario_id: criado.id },
          }),
          this.prisma.usuarios.delete({
            where: { id: criado.id },
          }),
        ]);

        throw new BadRequestException(
          'Usuário não foi criado pois o e-mail da senha provisória falhou. Verifique o SMTP.',
        );
      }
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

  private gerarSenhaProvisoria() {
    const n = Math.floor(100000 + Math.random() * 900000);
    return `ACASA-${n}`;
  }

  async atualizar(
    id: number,
    data: {
      nome?: string;
      usuario?: string;
      email?: string;
      status?: string;
    },
  ) {
    const existe = await this.prisma.usuarios.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Usuário não encontrado');

    try {
      return await this.prisma.usuarios.update({
        where: { id },
        data: {
          nome: data.nome,
          usuario: data.usuario,
          email: data.email,
          status: data.status,
        },
        select: {
          id: true,
          nome: true,
          usuario: true,
          email: true,
          status: true,
          criado_em: true,
          atualizado_em: true,
        },
      });
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

  async remover(id: number) {
    // mantém seu padrão de checagem
    await this.buscarPorId(id);

    return this.prisma.usuarios.delete({
      where: { id },
    });
  }

  async atualizarStatus(id: number, status: string) {
    const existe = await this.prisma.usuarios.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.usuarios.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        status: true,
        criado_em: true,
        atualizado_em: true,
      },
    });
  }
}
