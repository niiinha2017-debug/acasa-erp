import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrcamentoDto } from './dto/create-orcamento.dto'
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto'
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto'
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto'
import { promises as fs } from 'fs'
import * as path from 'path'

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  private uploadsBase() {
    // ajusta se você já tem um padrão diferente
    return path.resolve(process.cwd(), 'uploads', 'orcamentos')
  }

  private async garantirPastaOrcamento(orcamentoId: number) {
    const dir = path.join(this.uploadsBase(), String(orcamentoId))
    await fs.mkdir(dir, { recursive: true })
    return dir
  }

  async criar(dto: CreateOrcamentoDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
      select: { id: true, nome_completo: true, cpf: true },
    })

    if (!cliente) throw new NotFoundException('Cliente não encontrado.')

    // snapshot fixo (nome + cpf)
    return this.prisma.orcamentos.create({
      data: {
        cliente_id: cliente.id,
        cliente_nome_snapshot: cliente.nome_completo,
        cliente_cpf_snapshot: cliente.cpf || '',
      },
      include: {
        cliente: true,
        itens: true,
        arquivos: true,
      },
    })
  }

  async listar() {
    const lista = await this.prisma.orcamentos.findMany({
      orderBy: { id: 'desc' },
      include: {
        cliente: true,
        itens: { select: { valor_total: true } },
      },
    })

    // total calculado simples (sem financeiro)
    return lista.map((o) => {
      const total = o.itens.reduce((acc, i) => acc + Number(i.valor_total || 0), 0)
      return {
        ...o,
        total_itens: total,
      }
    })
  }

  async detalhar(id: number) {
    const orc = await this.prisma.orcamentos.findUnique({
      where: { id },
      include: {
        cliente: true, // “resto altera”: aqui vem ao vivo do cadastro
        itens: { orderBy: { id: 'asc' } },
        arquivos: { orderBy: { id: 'desc' } },
      },
    })
    if (!orc) throw new NotFoundException('Orçamento não encontrado.')
    return orc
  }

  async atualizar(id: number, dto: UpdateOrcamentoDto) {
    await this.detalhar(id)
    return this.prisma.orcamentos.update({
      where: { id },
      data: {
        cliente_nome_snapshot: dto.cliente_nome_snapshot,
        cliente_cpf_snapshot: dto.cliente_cpf_snapshot,
      },
      include: { cliente: true, itens: true, arquivos: true },
    })
  }

  async remover(id: number) {
    await this.detalhar(id)

    // remove pasta (arquivos) também
    const dir = path.join(this.uploadsBase(), String(id))
    await fs.rm(dir, { recursive: true, force: true }).catch(() => null)

    return this.prisma.orcamentos.delete({ where: { id } })
  }

  // ---------------- ITENS ----------------
  async adicionarItem(orcamentoId: number, dto: CreateOrcamentoItemDto) {
    await this.detalhar(orcamentoId)
    return this.prisma.orcamento_itens.create({
      data: {
        orcamento_id: orcamentoId,
        nome_ambiente: dto.nome_ambiente,
        descricao: dto.descricao,
        valor_unitario: dto.valor_unitario as any,
        valor_total: dto.valor_total as any,
      },
    })
  }

  async atualizarItem(orcamentoId: number, itemId: number, dto: UpdateOrcamentoItemDto) {
    await this.detalhar(orcamentoId)

    const item = await this.prisma.orcamento_itens.findFirst({
      where: { id: itemId, orcamento_id: orcamentoId },
    })
    if (!item) throw new NotFoundException('Item não encontrado.')

    return this.prisma.orcamento_itens.update({
      where: { id: itemId },
      data: {
        nome_ambiente: dto.nome_ambiente,
        descricao: dto.descricao,
        valor_unitario: dto.valor_unitario as any,
        valor_total: dto.valor_total as any,
      },
    })
  }

  async removerItem(orcamentoId: number, itemId: number) {
    await this.detalhar(orcamentoId)

    const item = await this.prisma.orcamento_itens.findFirst({
      where: { id: itemId, orcamento_id: orcamentoId },
    })
    if (!item) throw new NotFoundException('Item não encontrado.')

    return this.prisma.orcamento_itens.delete({ where: { id: itemId } })
  }

  // ---------------- ARQUIVOS ----------------
  async anexarArquivo(orcamentoId: number, file: any) {
    await this.detalhar(orcamentoId)
    if (!file) throw new BadRequestException('Arquivo não enviado.')

    const pasta = await this.garantirPastaOrcamento(orcamentoId)

    const safeOriginal = file.originalname.replace(/[^\w.\-() ]+/g, '_')
    const nomeFinal = `${Date.now()}-${safeOriginal}`
    const caminhoFinal = path.join(pasta, nomeFinal)

    await fs.writeFile(caminhoFinal, file.buffer)

    const caminhoRelativo = path
      .join('uploads', 'orcamentos', String(orcamentoId), nomeFinal)
      .replace(/\\/g, '/')

    return this.prisma.orcamento_arquivos.create({
      data: {
        orcamento_id: orcamentoId,
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tamanho: file.size,
        caminho: caminhoRelativo,
      },
    })
  }

  async listarArquivos(orcamentoId: number) {
    await this.detalhar(orcamentoId)
    return this.prisma.orcamento_arquivos.findMany({
      where: { orcamento_id: orcamentoId },
      orderBy: { id: 'desc' },
    })
  }

  async obterArquivo(orcamentoId: number, arquivoId: number) {
    await this.detalhar(orcamentoId)

    const arq = await this.prisma.orcamento_arquivos.findFirst({
      where: { id: arquivoId, orcamento_id: orcamentoId },
    })
    if (!arq) throw new NotFoundException('Arquivo não encontrado.')

    const abs = path.resolve(process.cwd(), arq.caminho)
    return { arq, abs }
  }

  async removerArquivo(orcamentoId: number, arquivoId: number) {
    const { arq, abs } = await this.obterArquivo(orcamentoId, arquivoId)
    await fs.rm(abs, { force: true }).catch(() => null)
    return this.prisma.orcamento_arquivos.delete({ where: { id: arq.id } })
  }
}
