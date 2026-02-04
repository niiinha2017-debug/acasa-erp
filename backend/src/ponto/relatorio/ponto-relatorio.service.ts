import { Injectable, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import * as path from 'path'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'
import PDFDocument from 'pdfkit'
import { renderHeaderA4Png } from '../../pdf/render-header-a4'

@Injectable()
export class PontoRelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  // Helpers de data
  private formatHora(date: any) {
    const d = new Date(date);
    return d.getUTCHours().toString().padStart(2, '0') + ':' + 
           d.getUTCMinutes().toString().padStart(2, '0');
  }

  private msToHHMM(ms: number): string {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const h = Math.floor(absMs / 3600000);
    const m = Math.floor((absMs % 3600000) / 60000);
    return `${isNegative ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  async relatorioMensalPdfData(params: { funcionario_id: number; mes: number; ano: number }) {
    const { funcionario_id, mes, ano } = params;
    const dataIni = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 1);

    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { id: true, nome: true, carga_horaria_dia: true },
    });

    const registros = await this.prisma.ponto_registros.findMany({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data_hora: 'asc' },
    });

    const justificativas = await this.prisma.ponto_justificativas.findMany({
      where: {
        funcionario_id,
        data: { gte: dataIni, lt: dataFim },
      },
    });

    return { funcionario, registros, justificativas };
  }

  private async gerarPdfPontoBuffer(payload: {
    funcionario: any;
    mes: number;
    ano: number;
    registros: any[];
    justificativas: any[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const headerBottomY = renderHeaderA4Png(doc);
        
        // --- CÁLCULO DE SALDO ---
        let totalTrabalhadoMs = 0;
        let totalMetaMs = 0;
        const cargaDecimal = Number(payload.funcionario?.carga_horaria_dia || 8);
        const cargaMs = cargaDecimal * 3600000;
        const diasNoMes = new Date(payload.ano, payload.mes, 0).getDate();

        for (let d = 1; d <= diasNoMes; d++) {
          const dt = new Date(payload.ano, payload.mes - 1, d);
          if (dt.getDay() > 0 && dt.getDay() < 6) totalMetaMs += cargaMs;

          const diaRegs = payload.registros.filter(r => new Date(r.data_hora).getUTCDate() === d);
          for (let i = 0; i < diaRegs.length; i += 2) {
            if (diaRegs[i] && diaRegs[i+1]) {
              totalTrabalhadoMs += (new Date(diaRegs[i+1].data_hora).getTime() - new Date(diaRegs[i].data_hora).getTime());
            }
          }
        }
        const saldoMs = totalTrabalhadoMs - totalMetaMs;

        // --- RESUMO ---
        const resY = headerBottomY + 10;
        doc.rect(30, resY, 535, 50).fill('#f8fafc');
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('ESPELHO DE PONTO MENSAL', 35, resY + 10);
        doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Funcionário: ', 35, resY + 25, {continued: true})
           .fillColor('#1e293b').font('Helvetica-Bold').text(payload.funcionario?.nome?.toUpperCase() || '');
        doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Carga Diária: ', 35, resY + 35, {continued: true})
           .fillColor('#1e293b').text(`${cargaDecimal.toFixed(2)}h`);

        doc.fillColor('#64748b').fontSize(7).text('TRABALHADO', 380, resY + 12);
        doc.fillColor('#0f172a').fontSize(10).text(this.msToHHMM(totalTrabalhadoMs), 380, resY + 22);
        doc.fillColor('#64748b').text('SALDO MÊS', 460, resY + 12);
        doc.fillColor(saldoMs >= 0 ? '#10b981' : '#ef4444').text(this.msToHHMM(saldoMs), 460, resY + 22);

        // --- TABELA ---
        const col = { d: 35, e1: 90, s1: 135, e2: 180, s2: 225, t: 275, obs: 330 };
        let curY = resY + 60;
        const rowH = 14.5;

        doc.rect(30, curY, 535, rowH).fill('#1e293b');
        doc.fillColor('#fff').fontSize(7).text('DATA', col.d, curY + 4);
        doc.text('ENT 1', col.e1, curY + 4); doc.text('SAI 1', col.s1, curY + 4);
        doc.text('ENT 2', col.e2, curY + 4); doc.text('SAI 2', col.s2, curY + 4);
        doc.text('TOTAL', col.t, curY + 4); doc.text('OBSERVAÇÕES', col.obs, curY + 4);
        curY += rowH;

        for (let d = 1; d <= diasNoMes; d++) {
          const dt = new Date(payload.ano, payload.mes - 1, d);
          const diaSem = dt.getDay();
          if (diaSem === 0 || diaSem === 6) doc.rect(30, curY, 535, rowH).fill('#f1f5f9');
          
          doc.fillColor('#1e293b').font('Helvetica').fontSize(7);
          doc.text(`${String(d).padStart(2,'0')}/${String(payload.mes).padStart(2,'0')} (${['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][diaSem]})`, col.d, curY + 4);

          const dRegs = payload.registros.filter(r => new Date(r.data_hora).getUTCDate() === d).sort((a,b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
          const e1 = dRegs[0], s1 = dRegs[1], e2 = dRegs[2], s2 = dRegs[3];

          doc.text(e1 ? this.formatHora(e1.data_hora) : '--:--', col.e1, curY + 4);
          doc.text(s1 ? this.formatHora(s1.data_hora) : '--:--', col.s1, curY + 4);
          doc.text(e2 ? this.formatHora(e2.data_hora) : '--:--', col.e2, curY + 4);
          doc.text(s2 ? this.formatHora(s2.data_hora) : '--:--', col.s2, curY + 4);

          let dMs = 0;
          if (e1 && s1) dMs += (new Date(s1.data_hora).getTime() - new Date(e1.data_hora).getTime());
          if (e2 && s2) dMs += (new Date(s2.data_hora).getTime() - new Date(e2.data_hora).getTime());
          if (dMs > 0) doc.font('Helvetica-Bold').text(this.msToHHMM(dMs), col.t, curY + 4).font('Helvetica');

          const j = payload.justificativas.find(j => new Date(j.data).getUTCDate() === d);
          if (j) doc.fillColor('#e11d48').text(j.tipo, col.obs, curY + 4);
          else if (diaSem === 0) doc.fillColor('#94a3b8').text('REPOUSO', col.obs, curY + 4);

          curY += rowH;
        }

        doc.strokeColor('#cbd5e1').moveTo(50, 750).lineTo(230, 750).stroke();
        doc.moveTo(350, 750).lineTo(530, 750).stroke();
        doc.fontSize(7).fillColor('#475569').text('ASSINATURA DO FUNCIONÁRIO', 50, 755, { width: 180, align: 'center' });
        doc.text('RESPONSÁVEL / EMPRESA', 350, 755, { width: 180, align: 'center' });

        doc.end();
      } catch (e) { reject(e); }
    });
  }

  async gerarPdfMensalESalvar(params: { funcionario_id: number; mes: number; ano: number }) {
    const data = await this.relatorioMensalPdfData(params);
    const pdfBuffer = await this.gerarPdfPontoBuffer({ ...data, mes: params.mes, ano: params.ano });

    const dir = path.join(process.cwd(), 'uploads', 'funcionarios');
    await fs.mkdir(dir, { recursive: true });
    const filename = `ponto_${params.funcionario_id}_${params.ano}${params.mes}_${randomBytes(4).toString('hex')}.pdf`;
    await fs.writeFile(path.join(dir, filename), pdfBuffer);

    const arquivo = await this.prisma.arquivos.create({
      data: {
        owner_type: 'FUNCIONARIO',
        owner_id: params.funcionario_id,
        categoria: 'RELATORIO',
        url: `/uploads/funcionarios/${filename}`,
        filename,
        nome: `RELATÓRIO PONTO ${params.mes}/${params.ano}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      }
    });
    return { arquivoId: arquivo.id };
  }
}