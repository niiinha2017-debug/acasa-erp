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
  funcionario: any // Objeto completo do funcionário vindo do banco
  mes: number
  ano: number
  registros: any[]
  justificativas: any[]
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      const headerBottomY = renderHeaderA4Png(doc)
      
      // --- LÓGICA DE CÁLCULO BASEADA NO CADASTRO ---
      let totalTrabalhadoMs = 0;
      let totalMetaMs = 0;
      const diasNoMes = new Date(payload.ano, payload.mes, 0).getDate();

      // Pegamos a carga horária do banco (ex: 8.8 ou 8.0)
      const cargaPadraoMs = Number(payload.funcionario.carga_horaria_dia || 0) * 3600000;

      // Percorre os dias para calcular Totais e Meta
      for (let d = 1; d <= diasNoMes; d++) {
        const dataRef = new Date(payload.ano, payload.mes - 1, d);
        const diaSemana = dataRef.getDay(); // 0=Dom, 6=Sab

        // Calcula Meta do Dia
        if (diaSemana === 0) {
          // Domingo meta zero
        } else if (diaSemana === 6) {
          // Se tiver horário de sábado cadastrado, calcula a meta do sábado
          if (payload.funcionario.horario_sabado_entrada_1 && payload.funcionario.horario_sabado_saida_1) {
             // Exemplo simplificado: se tem horário de sábado, a meta é o tempo entre eles
             // Mas geralmente usa-se uma carga fixa se cadastrada.
             // Aqui vou usar 0 para sábado a menos que você defina carga_sabado
          }
        } else {
          totalMetaMs += cargaPadraoMs;
        }

        // Calcula Trabalho do Dia
        const regs = payload.registros
          .filter(r => new Date(r.data_hora).getUTCDate() === d)
          .sort((a,b) => a.data_hora.getTime() - b.data_hora.getTime());

        for (let i = 0; i < regs.length; i += 2) {
          if (regs[i] && regs[i+1] && regs[i].tipo === 'ENTRADA' && regs[i+1].tipo === 'SAIDA') {
            totalTrabalhadoMs += (regs[i+1].data_hora.getTime() - regs[i].data_hora.getTime());
          }
        }
      }

      const saldoMs = totalTrabalhadoMs - totalMetaMs;

      // --- RENDERIZAÇÃO DO CABEÇALHO DO RELATÓRIO ---
      const resumoY = headerBottomY + 10;
      doc.rect(30, resumoY, 535, 50).fill('#f8fafc');
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('ESPELHO DE PONTO MENSAL', 35, resumoY + 10);
      
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`Funcionário:`, 35, resumoY + 25, {continued: true})
         .fillColor('#1e293b').font('Helvetica-Bold').text(` ${payload.funcionario.nome.toUpperCase()}`);
      
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`Carga Diária:`, 35, resumoY + 35, {continued: true})
         .fillColor('#1e293b').font('Helvetica-Bold').text(` ${payload.funcionario.carga_horaria_dia}h`);

      // Painel de Saldos
      doc.fontSize(7).fillColor('#64748b').text('TRABALHADO', 380, resumoY + 12);
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(this.msToHHMM(totalTrabalhadoMs), 380, resumoY + 22);
      
      doc.fontSize(7).fillColor('#64748b').text('SALDO MÊS', 460, resumoY + 12);
      doc.fontSize(10).fillColor(saldoMs >= 0 ? '#10b981' : '#ef4444').text(this.msToHHMM(saldoMs), 460, resumoY + 22);

      // --- TABELA (Compacta para caber tudo) ---
      const tableTop = resumoY + 60;
      const rowH = 14.5; 
      const col = { d: 30, e1: 85, s1: 130, e2: 175, s2: 220, t: 265, obs: 320 };

      doc.rect(30, tableTop, 535, rowH).fill('#1e293b');
      doc.fillColor('#fff').fontSize(7).text('DATA', col.d + 5, tableTop + 4);
      doc.text('ENT 1', col.e1, tableTop + 4); doc.text('SAI 1', col.s1, tableTop + 4);
      doc.text('ENT 2', col.e2, tableTop + 4); doc.text('SAI 2', col.s2, tableTop + 4);
      doc.text('TOTAL', col.t, tableTop + 4); doc.text('OBSERVAÇÕES', col.obs, tableTop + 4);

      let currentY = tableTop + rowH;
      for (let d = 1; d <= diasNoMes; d++) {
        const dataLoop = new Date(payload.ano, payload.mes - 1, d);
        const isFimSemana = dataLoop.getDay() === 0 || dataLoop.getDay() === 6;

        if (isFimSemana) doc.rect(30, currentY, 535, rowH).fill('#f1f5f9');
        else if (d % 2 === 0) doc.rect(30, currentY, 535, rowH).fill('#fafafa');

        doc.fillColor(isFimSemana ? '#64748b' : '#1e293b').font('Helvetica').fontSize(7);
        const dataFmt = `${String(d).padStart(2, '0')}/${String(payload.mes).padStart(2, '0')} (${['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][dataLoop.getDay()]})`;
        doc.text(dataFmt, col.d + 5, currentY + 4);

        const regsDia = payload.registros.filter(r => new Date(r.data_hora).getUTCDate() === d).sort((a,b) => a.data_hora.getTime() - b.data_hora.getTime());
        const e1 = regsDia.filter(r => r.tipo === 'ENTRADA')[0];
        const s1 = regsDia.filter(r => r.tipo === 'SAIDA')[0];
        const e2 = regsDia.filter(r => r.tipo === 'ENTRADA')[1];
        const s2 = regsDia.filter(r => r.tipo === 'SAIDA')[1];

        doc.text(e1 ? this.formatHora(e1.data_hora) : '--:--', col.e1, currentY + 4);
        doc.text(s1 ? this.formatHora(s1.data_hora) : '--:--', col.s1, currentY + 4);
        doc.text(e2 ? this.formatHora(e2.data_hora) : '--:--', col.e2, currentY + 4);
        doc.text(s2 ? this.formatHora(s2.data_hora) : '--:--', col.s2, currentY + 4);

        let diaMs = 0;
        if (e1 && s1) diaMs += (s1.data_hora.getTime() - e1.data_hora.getTime());
        if (e2 && s2) diaMs += (s2.data_hora.getTime() - e2.data_hora.getTime());
        
        if (diaMs > 0) doc.font('Helvetica-Bold').text(this.msToHHMM(diaMs), col.t, currentY + 4).font('Helvetica');

        const just = payload.justificativas.find(j => new Date(j.data).getUTCDate() === d);
        if (just) doc.fillColor('#e11d48').fontSize(6).text(just.tipo.toUpperCase(), col.obs, currentY + 4);
        else if (dataLoop.getDay() === 0) doc.text('REPOUSO SEMANAL', col.obs, currentY + 4);

        currentY += rowH;
      }

      // --- ASSINATURAS ---
      const sigY = 750;
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, sigY).lineTo(230, sigY).stroke();
      doc.moveTo(350, sigY).lineTo(530, sigY).stroke();
      doc.fontSize(7).fillColor('#475569').text('ASSINATURA DO FUNCIONÁRIO', 50, sigY + 5, { width: 180, align: 'center' });
      doc.text('RESPONSÁVEL / EMPRESA', 350, sigY + 5, { width: 180, align: 'center' });

      doc.end()
    } catch (err) { reject(err) }
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
  funcionario, // o objeto que veio do prisma
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
