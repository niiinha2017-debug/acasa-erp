import { Injectable,BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import * as path from 'path'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'
import PDFDocument from 'pdfkit'
import { renderHeaderA4Png } from '../../pdf/render-header-a4'


type Filtros = {
  funcionario_id?: string
  data_ini?: string // YYYY-MM-DD
  data_fim?: string // YYYY-MM-DD
  tipo?: 'ENTRADA' | 'SAIDA'
  origem?: 'PWA' | 'WEB' | 'ADMIN'
  status?: 'ATIVO' | 'INVALIDADO'
}

@Injectable()
export class PontoRelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  private inicioDia(ymd?: string) {
    if (!ymd) return undefined
    return new Date(`${ymd}T00:00:00.000Z`)
  }

  private fimDia(ymd?: string) {
    if (!ymd) return undefined
    return new Date(`${ymd}T23:59:59.999Z`)
  }

  private cleanId(v?: string) {
    if (!v) return undefined
    const id = Number(String(v).replace(/\D/g, ''))
    return id ? id : undefined
  }

  async listar(f: Filtros) {
    const where: Prisma.ponto_registrosWhereInput = {}

    const funcionarioId = this.cleanId(f.funcionario_id)
    if (funcionarioId) where.funcionario_id = funcionarioId

    if (f.tipo) where.tipo = f.tipo
    if (f.origem) where.origem = f.origem
    if (f.status) where.status = f.status

    const ini = this.inicioDia(f.data_ini)
    const fim = this.fimDia(f.data_fim)
    if (ini || fim) {
      where.data_hora = {
        ...(ini ? { gte: ini } : {}),
        ...(fim ? { lte: fim } : {}),
      }
    }

    const rows = await this.prisma.ponto_registros.findMany({
      where,
      orderBy: { data_hora: 'desc' },
      select: {
        id: true,
        tipo: true,
        origem: true,
        data_hora: true,

        latitude: true,
        longitude: true,
        precisao_metros: true,

        cep: true,
        rua: true,
        bairro: true,
        cidade: true,
        estado: true,

        ip: true,
        status: true,
        observacao: true,

        funcionario: { select: { id: true, nome: true } },
        dispositivo: { select: { id: true, device_nome: true, plataforma: true } },
      },
    })

    return rows.map((r) => ({
      ...r,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
    }))
  }

  // ✅ DADOS DO PDF (mensal)
  async relatorioMensalPdfData(params: { funcionario_id: number; mes: number; ano: number }) {
    const { funcionario_id, mes, ano } = params




    const dataIni = new Date(ano, mes - 1, 1, 0, 0, 0, 0)
    const dataFim = new Date(ano, mes, 1, 0, 0, 0, 0) // exclusivo

    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { id: true, nome: true },
    })

    const registros = await this.prisma.ponto_registros.findMany({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data_hora: 'asc' },
      select: { data_hora: true, tipo: true, origem: true, status: true },
    })

    const justificativas = await this.prisma.ponto_justificativas.findMany({
      where: {
        funcionario_id,
        data: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data: 'asc' },
      select: { data: true, tipo: true, descricao: true },
    })

    return { funcionario, registros, justificativas }
  }


  
  // ✅ GERA BUFFER DO PDF (pra salvar em arquivos depois)
// Adicione este helper no topo do arquivo ou dentro da classe para converter MS em HH:MM
private msToHHMM(ms: number): string {
  if (ms < 0) {
    const absMs = Math.abs(ms);
    const h = Math.floor(absMs / 3600000);
    const m = Math.floor((absMs % 3600000) / 60000);
    return `-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

private async gerarPdfPontoBuffer(payload: {
  funcionarioNome: string
  funcionarioId: number
  mes: number
  ano: number
  registros: Array<{ data_hora: Date; tipo: string }>
  justificativas: Array<{ data: Date; tipo: string; descricao?: string | null }>
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Margens reduzidas para caber tudo (Top: 20, Bottom: 20)
      const doc = new PDFDocument({ margin: 30, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      const headerBottomY = renderHeaderA4Png(doc)
      
      // --- CÁLCULO DE HORAS ---
      let totalTrabalhadoMs = 0;
      const diasNoMes = new Date(payload.ano, payload.mes, 0).getDate();
      let diasUteis = 0;

      // Cálculo prévio para o resumo
      for (let d = 1; d <= diasNoMes; d++) {
        const dataRef = new Date(payload.ano, payload.mes - 1, d);
        if (dataRef.getDay() !== 0) diasUteis++; // Ignora domingos na meta

        const regs = payload.registros
          .filter(r => new Date(r.data_hora).getUTCDate() === d)
          .sort((a,b) => a.data_hora.getTime() - b.data_hora.getTime());

        for (let i = 0; i < regs.length; i += 2) {
          if (regs[i] && regs[i+1] && regs[i].tipo === 'ENTRADA' && regs[i+1].tipo === 'SAIDA') {
            totalTrabalhadoMs += (regs[i+1].data_hora.getTime() - regs[i].data_hora.getTime());
          }
        }
      }

      const metaHorasDia = 8.8; // Ajuste conforme sua empresa (8h48min = 8.8)
      const totalMetaMs = diasUteis * metaHorasDia * 3600000;
      const saldoMs = totalTrabalhadoMs - totalMetaMs;

      // --- BLOCO DE RESUMO (TOP) ---
      const resumoY = headerBottomY + 10;
      doc.rect(30, resumoY, 535, 45).fill('#f8fafc');
      
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('ESPELHO DE PONTO MENSAL', 35, resumoY + 10);
      doc.fontSize(9).font('Helvetica').text(`Funcionário: ${payload.funcionarioNome.toUpperCase()}`, 35, resumoY + 25);
      
      // Cards de Horas (lado direito)
      const cardX = 350;
      doc.fontSize(8).fillColor('#64748b').text('TRABALHADO', cardX, resumoY + 10);
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(this.msToHHMM(totalTrabalhadoMs), cardX, resumoY + 20);
      
      doc.fontSize(8).fillColor('#64748b').text('SALDO PERÍODO', cardX + 80, resumoY + 10);
      doc.fontSize(10).fillColor(saldoMs >= 0 ? '#10b981' : '#ef4444').text(this.msToHHMM(saldoMs), cardX + 80, resumoY + 20);

      // --- TABELA ---
      const tableTop = resumoY + 55;
      const rowHeight = 14.5; // Altura compacta para caber 31 linhas + assinaturas
      const col = { data: 30, ent1: 85, sai1: 135, ent2: 185, sai2: 235, total: 285, obs: 345 };

      // Header Tabela
      doc.rect(30, tableTop, 535, rowHeight).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
      doc.text('DATA', col.data + 5, tableTop + 4);
      doc.text('ENT 1', col.ent1, tableTop + 4);
      doc.text('SAI 1', col.sai1, tableTop + 4);
      doc.text('ENT 2', col.ent2, tableTop + 4);
      doc.text('SAI 2', col.sai2, tableTop + 4);
      doc.text('TOTAL', col.total, tableTop + 4);
      doc.text('OBSERVAÇÕES', col.obs, tableTop + 4);

      let currentY = tableTop + rowHeight;

      for (let d = 1; d <= diasNoMes; d++) {
        const dataLoop = new Date(payload.ano, payload.mes - 1, d);
        const isDomingo = dataLoop.getDay() === 0;
        const isSabado = dataLoop.getDay() === 6;

        const regsDia = payload.registros
          .filter(r => new Date(r.data_hora).getUTCDate() === d)
          .sort((a,b) => a.data_hora.getTime() - b.data_hora.getTime());
        
        const just = payload.justificativas.find(j => new Date(j.data).getUTCDate() === d);

        // Cor de fundo para finais de semana ou linhas alternadas
        if (isDomingo) doc.rect(30, currentY, 535, rowHeight).fill('#f1f5f9');
        else if (d % 2 === 0) doc.rect(30, currentY, 535, rowHeight).fill('#fafafa');

        doc.fillColor(isDomingo ? '#94a3b8' : '#1e293b').font('Helvetica').fontSize(7.5);
        
        const dataFmt = `${String(d).padStart(2, '0')}/${String(payload.mes).padStart(2, '0')}`;
        const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][dataLoop.getDay()];
        
        doc.text(`${dataFmt} (${diaSemana})`, col.data + 5, currentY + 4);

        // Horários
        const e1 = regsDia.filter(r => r.tipo === 'ENTRADA')[0];
        const s1 = regsDia.filter(r => r.tipo === 'SAIDA')[0];
        const e2 = regsDia.filter(r => r.tipo === 'ENTRADA')[1];
        const s2 = regsDia.filter(r => r.tipo === 'SAIDA')[1];

        doc.text(e1 ? this.formatHora(e1.data_hora) : '--:--', col.ent1, currentY + 4);
        doc.text(s1 ? this.formatHora(s1.data_hora) : '--:--', col.sai1, currentY + 4);
        doc.text(e2 ? this.formatHora(e2.data_hora) : '--:--', col.ent2, currentY + 4);
        doc.text(s2 ? this.formatHora(s2.data_hora) : '--:--', col.sai2, currentY + 4);

        // Cálculo do dia
        let diaMs = 0;
        if (e1 && s1) diaMs += (s1.data_hora.getTime() - e1.data_hora.getTime());
        if (e2 && s2) diaMs += (s2.data_hora.getTime() - e2.data_hora.getTime());
        
        if (diaMs > 0) {
          doc.font('Helvetica-Bold').text(this.msToHHMM(diaMs), col.total, currentY + 4).font('Helvetica');
        }

        // Observações / Justificativas
        if (just) {
          doc.fillColor('#e11d48').fontSize(6.5).text(just.tipo.toUpperCase(), col.obs, currentY + 4);
        } else if (isDomingo) {
          doc.text('DOMINGO', col.obs, currentY + 4);
        }

        currentY += rowHeight;
      }

      // --- ASSINATURAS (FIXADAS NO FUNDO) ---
      const bottomY = 740;
      doc.strokeColor('#cbd5e1').lineWidth(0.5);
      doc.moveTo(50, bottomY).lineTo(250, bottomY).stroke();
      doc.moveTo(345, bottomY).lineTo(545, bottomY).stroke();
      
      doc.fontSize(7).fillColor('#475569');
      doc.text('ASSINATURA DO FUNCIONÁRIO', 50, bottomY + 5, { width: 200, align: 'center' });
      doc.text('RESPONSÁVEL / EMPRESA', 345, bottomY + 5, { width: 200, align: 'center' });

      // Dados da Empresa (Rodapé bem pequeno)
      doc.fontSize(6).text('A CASA MÓVEIS PLANEJADOS - CNPJ: 28.638.791/0001-07 - Ribeirão Preto - SP', 30, 800, { align: 'center' });

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

private formatHora(date: Date) {
  // Garantir que usa o UTC para não mudar a hora por causa do fuso horário do servidor
  return date.getUTCHours().toString().padStart(2, '0') + ':' + 
         date.getUTCMinutes().toString().padStart(2, '0');
}

async gerarPdfMensalESalvar(params: { funcionario_id: number; mes: number; ano: number }) {
  const funcId = Number(params.funcionario_id)
  const mes = Number(params.mes)
  const ano = Number(params.ano)

  if (!funcId) throw new BadRequestException('funcionario_id inválido')
  if (!mes || mes < 1 || mes > 12) throw new BadRequestException('mes inválido')
  if (!ano || ano < 2000) throw new BadRequestException('ano inválido')

  const { funcionario, registros, justificativas } = await this.relatorioMensalPdfData({
    funcionario_id: funcId,
    mes,
    ano,
  })

  const pdfBuffer = await this.gerarPdfPontoBuffer({
    funcionarioNome: funcionario?.nome || '',
    funcionarioId: funcId,
    mes,
    ano,
    registros,
    justificativas,
  })

  // ✅ padrão: /uploads/<ownerType>s/
  const dir = path.join(process.cwd(), 'uploads', 'funcionarios')
  await fs.mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const rand = randomBytes(6).toString('hex')
  const filename = `ponto_${funcId}_${ano}${String(mes).padStart(2, '0')}_${stamp}_${rand}.pdf`

  await fs.writeFile(path.join(dir, filename), pdfBuffer)

  // ✅ URL tem que bater com a pasta real
  const url = `/uploads/funcionarios/${filename}`

  const arquivo = await this.prisma.arquivos.create({
    data: {
      owner_type: 'FUNCIONARIO',
      owner_id: funcId,
      categoria: 'RELATORIO',
      slot_key: null,
      url,
      filename,
      nome: `RELATÓRIO PONTO ${String(mes).padStart(2, '0')}/${ano} - ${funcionario?.nome || ''}`,
      mime_type: 'application/pdf',
      tamanho: pdfBuffer.length,
    },
    select: { id: true },
  })

  return { arquivoId: arquivo.id }
}

}
