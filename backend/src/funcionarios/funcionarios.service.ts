import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Funcionario } from './funcionario.entity'
import PDFDocument from 'pdfkit'

@Injectable()
export class FuncionariosService {
  constructor(
    @InjectRepository(Funcionario)
    private repo: Repository<Funcionario>,
  ) {}

  create(data: Partial<Funcionario>) {
    const funcionario = this.repo.create(data)
    return this.repo.save(funcionario)
  }

  findAll() {
    return this.repo.find({ order: { nome: 'ASC' } })
  }

  async findOne(id: number) {
    const funcionario = await this.repo.findOne({ where: { id } })
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado')
    return funcionario
  }

  async gerarPdfPortaria(ids: number[]): Promise<Buffer> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Nenhum funcionário selecionado')
    }

    const funcionarios = await this.repo.find({
      where: { id: In(ids) }, // ✅ certo
      order: { nome: 'ASC' },
    })

    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      doc
        .fontSize(16)
        .text('LISTA DE FUNCIONÁRIOS – PORTARIA', { align: 'center' })
        .moveDown(2)

      // Cabeçalho
      doc.fontSize(10)
      doc.text('Nome', 50, doc.y, { continued: true })
      doc.text('CPF', 220, doc.y, { continued: true })
      doc.text('RG', 330, doc.y, { continued: true })
      doc.text('Função', 420, doc.y)

      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(0.5)

      // Linhas
      for (const f of funcionarios) {
        doc.fontSize(10)
        doc.text(f.nome ?? '-', 50, doc.y, { continued: true })
        doc.text(f.cpf ?? '-', 220, doc.y, { continued: true })
        doc.text((f as any).rg ?? '-', 330, doc.y, { continued: true })     // 👈 troque para o nome real do campo no seu Entity
        doc.text((f as any).funcao ?? '-', 420, doc.y)                      // 👈 idem
        doc.moveDown(0.5)
      }

      doc.moveDown(2)
      doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' })

      doc.end()
    })
  }

  async update(id: number, data: Partial<Funcionario>) {
    const funcionario = await this.findOne(id)
    Object.assign(funcionario, data)
    return this.repo.save(funcionario)
  }

  async remove(id: number) {
    const funcionario = await this.findOne(id)
    return this.repo.remove(funcionario)
  }
}
