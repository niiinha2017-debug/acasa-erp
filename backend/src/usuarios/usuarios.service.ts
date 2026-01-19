import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

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
        criado_em: true,
        atualizado_em: true,
      },
      orderBy: { id: 'asc' },
    })
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
    })

    if (!registro) throw new NotFoundException('Usuário não encontrado')
    return registro
  }

  async criar(data: {
    nome: string
    usuario: string
    email: string
    senha: string
    status: string
  }) {
    const senhaHash = await bcrypt.hash(data.senha, 10)

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
      })

      return criado
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const alvo = Array.isArray(e?.meta?.target)
          ? e.meta.target.join(', ')
          : 'usuario/email'
        throw new BadRequestException(`Já existe cadastro com: ${alvo}`)
      }
      throw e
    }
  }

  async atualizar(
    id: number,
    data: {
      nome?: string
      usuario?: string
      email?: string
      status?: string
    },
  ) {
    const existe = await this.prisma.usuarios.findUnique({ where: { id } })
    if (!existe) throw new NotFoundException('Usuário não encontrado')

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
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const alvo = Array.isArray(e?.meta?.target)
          ? e.meta.target.join(', ')
          : 'usuario/email'
        throw new BadRequestException(`Já existe cadastro com: ${alvo}`)
      }
      throw e
    }
  }

  async remover(id: number) {
    // mantém seu padrão de checagem
    await this.buscarPorId(id)

    return this.prisma.usuarios.delete({
      where: { id },
    })
  }

  async atualizarStatus(id: number, status: string) {
    const existe = await this.prisma.usuarios.findUnique({ where: { id } })
    if (!existe) throw new NotFoundException('Usuário não encontrado')

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
    })
  }
}
