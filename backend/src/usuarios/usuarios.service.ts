import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.usuarios.findMany({
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        status: true,
        funcionario_id: true,
        funcionario: {
          select: { id: true, nome: true, unidade: true, setor: true },
        },
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
        funcionario_id: true,
        funcionario: {
          select: { id: true, nome: true, unidade: true, setor: true },
        },
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
    senha: string;
    status: string;
  }) {
    const senhaHash = await bcrypt.hash(data.senha, 10);

    try {
      const criado = await this.prisma.usuarios.create({
        data: {
          nome: data.nome,
          usuario: data.usuario,
          email: data.email,
          senha: senhaHash,
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

      return criado;
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

  async atualizar(
    id: number,
    data: {
      nome?: string;
      usuario?: string;
      email?: string;
      status?: string;
      senha?: string;
      funcionario_id?: number | null;
    },
  ) {
    const existe = await this.prisma.usuarios.findUnique({
      where: { id },
      select: { id: true, funcionario_id: true },
    });
    if (!existe) throw new NotFoundException('Usuário não encontrado');

    const raw = data.funcionario_id;
    const novoFuncionarioId =
      raw === undefined
        ? undefined
        : raw === null ||
            raw === 0 ||
            (typeof raw === 'number' && Number.isNaN(raw))
          ? null
          : Number(raw);

    try {
      if (novoFuncionarioId !== undefined) {
        if (novoFuncionarioId !== null) {
          const func = await this.prisma.funcionarios.findUnique({
            where: { id: novoFuncionarioId },
            select: { id: true, usuario_id: true },
          });
          if (!func)
            throw new BadRequestException('Funcionário informado não encontrado.');
          if (func.usuario_id != null && func.usuario_id !== id)
            throw new BadRequestException(
              'Este funcionário já está vinculado a outro usuário.',
            );
        }
        const updateData: any = {
          nome: data.nome,
          usuario: data.usuario,
          email: data.email,
          status: data.status,
          funcionario_id: novoFuncionarioId,
        };
        if (data.senha != null && String(data.senha).trim().length >= 6) {
          updateData.senha = await bcrypt.hash(String(data.senha).trim(), 10);
        }
        await this.prisma.$transaction([
          this.prisma.usuarios.update({
            where: { id },
            data: updateData,
          }),
          ...(existe.funcionario_id != null && existe.funcionario_id !== novoFuncionarioId
            ? [
                this.prisma.funcionarios.update({
                  where: { id: existe.funcionario_id },
                  data: { usuario_id: null },
                }),
              ]
            : []),
          ...(novoFuncionarioId != null
            ? [
                this.prisma.funcionarios.update({
                  where: { id: novoFuncionarioId },
                  data: { usuario_id: id },
                }),
              ]
            : []),
        ]);
      } else {
        const updateData: any = {
          nome: data.nome,
          usuario: data.usuario,
          email: data.email,
          status: data.status,
        };
        if (data.senha != null && String(data.senha).trim().length >= 6) {
          updateData.senha = await bcrypt.hash(String(data.senha).trim(), 10);
        }
        await this.prisma.usuarios.update({
          where: { id },
          data: updateData,
        });
      }

      return this.buscarPorId(id);
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
