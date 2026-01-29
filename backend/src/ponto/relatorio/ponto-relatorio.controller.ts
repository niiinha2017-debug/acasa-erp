import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import PDFDocument from 'pdfkit'

import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'
import { PontoRelatorioService } from './ponto-relatorio.service'

@Controller('ponto/relatorio')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissoes('ponto_relatorio.ver')
export class PontoRelatorioController {
  constructor(private readonly service: PontoRelatorioService) {}

  @Get('registros')
  listar(
    @Query('funcionario_id') funcionario_id?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('tipo') tipo?: 'ENTRADA' | 'SAIDA',
    @Query('origem') origem?: 'PWA' | 'WEB' | 'ADMIN',
    @Query('status') status?: 'ATIVO' | 'INVALIDADO',
  ) {
    return this.service.listar({ funcionario_id, data_ini, data_fim, tipo, origem, status })
  }

  @Get('pdf')
  async pdfMensal(
    @Res() res: Response,
    @Query('funcionario_id') funcionario_id: string,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    const funcId = Number(String(funcionario_id).replace(/\D/g, ''))
    const m = Number(String(mes).replace(/\D/g, ''))
    const a = Number(String(ano).replace(/\D/g, ''))

    const { funcionario, registros, justificativas } = await this.service.relatorioMensalPdfData({
      funcionario_id: funcId,
      mes: m,
      ano: a,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="ponto-${funcId}-${a}-${String(m).padStart(2, '0')}.pdf"`,
    )

    const doc = new PDFDocument({ margin: 40 })
    doc.pipe(res)

    doc.fontSize(14).text('RELATÓRIO DE PONTO (MENSAL)', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).text(`Funcionário: ${funcionario?.nome || funcId}`)
    doc.text(`Referência: ${String(m).padStart(2, '0')}/${a}`)
    doc.moveDown(1)

    doc.fontSize(9).text('REGISTROS:')
    doc.moveDown(0.5)

    registros.forEach((r) => {
      const d = new Date(r.data_hora)
      const dia = d.toLocaleDateString('pt-BR')
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      doc.text(`${dia}  ${hora}  |  ${r.tipo}  |  ${r.origem}  |  ${r.status}`)
    })

    doc.moveDown(1)
    doc.fontSize(9).text('JUSTIFICATIVAS:')
    doc.moveDown(0.5)

    justificativas.forEach((j) => {
      const dia = new Date(j.data).toLocaleDateString('pt-BR')
      doc.text(`${dia}  |  ${j.tipo}${j.descricao ? '  |  ' + j.descricao : ''}`)
    })

    doc.end()
  }
}
