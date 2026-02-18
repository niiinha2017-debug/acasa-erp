import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import PDFDocument from 'pdfkit';
import { renderHeaderA4Png } from '../../pdf/render-header-a4';

type Filtros = {
  funcionario_id?: string;
  data_ini?: string;
  data_fim?: string;
  tipo?: 'ENTRADA' | 'SAIDA';
  origem?: 'PWA' | 'WEB' | 'ADMIN';
  status?: 'ATIVO' | 'INVALIDADO';
};

@Injectable()
export class PontoRelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async listarFuncionariosAtivos() {
    return this.prisma.funcionarios.findMany({
      where: { status: 'ATIVO' },
      select: {
        id: true,
        nome: true,
        status: true,
        whatsapp: true,
        custo_hora: true,
        carga_horaria_dia: true,
        carga_horaria_semana: true,
        horario_entrada_1: true,
        horario_saida_1: true,
        horario_entrada_2: true,
        horario_saida_2: true,
        horario_sabado_entrada_1: true,
        horario_sabado_saida_1: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  // --- MÉTODOS AUXILIARES QUE O SEU CONTROLLER USA ---
  private inicioDia(ymd?: string) {
    if (!ymd) return undefined;
    return new Date(`${ymd}T00:00:00.000Z`);
  }

  private fimDia(ymd?: string) {
    if (!ymd) return undefined;
    return new Date(`${ymd}T23:59:59.999Z`);
  }

  private cleanId(v?: string) {
    if (!v) return undefined;
    const id = Number(String(v).replace(/\D/g, ''));
    return id ? id : undefined;
  }

  private formatHora(date: any) {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private dateKeySP(date: any): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo',
    });
  }

  private parseHHMMToDecimal(str: string | null | undefined): number {
    if (!str || typeof str !== 'string') return 0;
    const parts = str.trim().split(/[:\s]/).map(Number);
    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;
    const s = Number(parts[2]) || 0;
    return h + m / 60 + s / 3600;
  }

  private derivarCargaDosHorarios(f: any): {
    cargaSegSex: number;
    cargaSabado: number;
    cargaSemana: number;
  } {
    if (!f) return { cargaSegSex: 0, cargaSabado: 0, cargaSemana: 0 };

    let cargaSegSex = 0;
    const e1 = this.parseHHMMToDecimal(f.horario_entrada_1);
    const s1 = this.parseHHMMToDecimal(f.horario_saida_1);
    const e2 = this.parseHHMMToDecimal(f.horario_entrada_2);
    const s2 = this.parseHHMMToDecimal(f.horario_saida_2);
    if (s1 > e1) cargaSegSex += s1 - e1;
    if (s2 > e2) cargaSegSex += s2 - e2;

    let cargaSabado = 0;
    const es = this.parseHHMMToDecimal(f.horario_sabado_entrada_1);
    const ss = this.parseHHMMToDecimal(f.horario_sabado_saida_1);
    if (ss > es) cargaSabado = ss - es;

    return {
      cargaSegSex,
      cargaSabado,
      cargaSemana: 5 * cargaSegSex + cargaSabado,
    };
  }

  /** Meta diária para uma data (0=Dom, 1-5=Seg-Sex, 6=Sáb) */
  private metaDiaParaData(dataStr: string, funcionario: any): number {
    const d = new Date(dataStr + 'T12:00:00').getDay();
    if (d === 0) return 0;

    const cargaDia = Number(funcionario?.carga_horaria_dia || 0);
    const cargaSemana = Number(funcionario?.carga_horaria_semana || 0);
    const derivado = this.derivarCargaDosHorarios(funcionario);

    if (derivado.cargaSegSex > 0 || derivado.cargaSabado > 0) {
      return d === 6 ? derivado.cargaSabado : derivado.cargaSegSex;
    }
    if (cargaDia > 0) return cargaDia;
    if (cargaSemana > 0) return Number((cargaSemana / 6).toFixed(2));
    return 0;
  }

  /** Retorna carga diária fixa (para compatibilidade). Prefira metaDiaParaData. */
  private cargaDiaHoras(funcionario: any): number {
    const derivado = this.derivarCargaDosHorarios(funcionario);
    if (derivado.cargaSegSex > 0) return derivado.cargaSegSex;
    if (derivado.cargaSabado > 0) return derivado.cargaSabado;

    const cargaDia = Number(funcionario?.carga_horaria_dia || 0);
    if (cargaDia > 0) return cargaDia;

    const cargaSemana = Number(funcionario?.carga_horaria_semana || 0);
    if (cargaSemana > 0) return Number((cargaSemana / 6).toFixed(2));

    throw new BadRequestException(
      'Funcionário sem carga horária cadastrada (dia/semana ou horários).',
    );
  }

  private msToHHMM(ms: number): string {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const h = Math.floor(absMs / 3600000);
    const m = Math.floor((absMs % 3600000) / 60000);
    return `${isNegative ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private horasParaDecimal(ms: number): number {
    return Math.round((ms / 3600000) * 100) / 100;
  }

  private calcularHorasTrabalhadasDia(registrosDia: any[]): number {
    const regs = [...registrosDia]
      .filter((r) => r?.status === 'ATIVO')
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    let totalMs = 0;
    let entrada: Date | null = null;
    for (const r of regs) {
      if (r.tipo === 'ENTRADA') {
        entrada = new Date(r.data_hora);
        continue;
      }
      if (r.tipo === 'SAIDA' && entrada) {
        const saida = new Date(r.data_hora);
        if (saida.getTime() > entrada.getTime())
          totalMs += saida.getTime() - entrada.getTime();
        entrada = null;
      }
    }
    return this.horasParaDecimal(totalMs);
  }

  // --- FECHAMENTO FOLHA ---
  async fechamentoFolha(params: {
    data_ini: string;
    data_fim: string;
    apenas_ativos?: boolean;
  }) {
    const ini = this.inicioDia(params.data_ini);
    const fim = this.fimDia(params.data_fim);
    if (!ini || !fim) {
      throw new BadRequestException('Período (data_ini e data_fim) obrigatório.');
    }

    const funcionarios = await this.prisma.funcionarios.findMany({
      where: params.apenas_ativos !== false ? { status: 'ATIVO' } : {},
      select: {
        id: true,
        nome: true,
        carga_horaria_dia: true,
        carga_horaria_semana: true,
        horario_entrada_1: true,
        horario_saida_1: true,
        horario_entrada_2: true,
        horario_saida_2: true,
        horario_sabado_entrada_1: true,
        horario_sabado_saida_1: true,
        custo_hora: true,
        salario_base: true,
        salario_adicional: true,
      },
      orderBy: { nome: 'asc' },
    });

    const registros = await this.prisma.ponto_registros.findMany({
      where: {
        status: 'ATIVO',
        data_hora: { gte: ini, lte: fim },
      },
      orderBy: { data_hora: 'asc' },
    });

    const porFuncionario = new Map<number, any[]>();
    for (const r of registros) {
      if (!porFuncionario.has(r.funcionario_id))
        porFuncionario.set(r.funcionario_id, []);
      porFuncionario.get(r.funcionario_id)!.push(r);
    }

    const porDia = new Map<string, any[]>();
    for (const r of registros) {
      const key = new Date(r.data_hora).toISOString().slice(0, 10);
      if (!porDia.has(key)) porDia.set(key, []);
      porDia.get(key)!.push(r);
    }

    const diasNoPeriodo = Math.ceil((fim.getTime() - ini.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const diasUteis = Math.floor(diasNoPeriodo * (6 / 7));

    const linhas = funcionarios.map((f) => {
      const regs = porFuncionario.get(f.id) || [];
      const porDiaF = new Map<string, any[]>();
      for (const r of regs) {
        const key = new Date(r.data_hora).toISOString().slice(0, 10);
        const d = new Date(key + 'T12:00:00').getDay();
        if (d === 0) continue;
        if (!porDiaF.has(key)) porDiaF.set(key, []);
        porDiaF.get(key)!.push(r);
      }

      let horasTrabalhadas = 0;
      let metaTotal = 0;
      for (const [key, arr] of porDiaF) {
        horasTrabalhadas += this.calcularHorasTrabalhadasDia(arr);
        metaTotal += this.metaDiaParaData(key, f);
      }
      const saldo = horasTrabalhadas - metaTotal;
      const horasExtras = saldo > 0 ? saldo : 0;
      const saldoDevedorHoras = saldo < 0 ? Math.abs(saldo) : 0;

      const custoHora = Number(f.custo_hora || 0) || 0;
      const salarioBase = Number(f.salario_base || 0) || 0;
      const salarioAdicional = Number(f.salario_adicional || 0) || 0;
      const salarioContratado = salarioBase + salarioAdicional;

      const salarioApurado =
        horasTrabalhadas * custoHora + horasExtras * custoHora * 0.5;

      const hToHHMM = (h: number) => {
        const m = Math.round((h || 0) * 60);
        const hh = Math.floor(m / 60);
        const mm = m % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      };

      return {
        funcionario_id: f.id,
        nome: f.nome || '',
        horas_trabalhadas: Math.round(horasTrabalhadas * 100) / 100,
        horas_extras: Math.round(horasExtras * 100) / 100,
        saldo_devedor_horas: Math.round(saldoDevedorHoras * 100) / 100,
        custo_hora: custoHora,
        salario_contratado: Math.round(salarioContratado * 100) / 100,
        salario_apurado: Math.round(salarioApurado * 100) / 100,
        horas_trabalhadas_hhmm: hToHHMM(horasTrabalhadas),
        horas_extras_hhmm: hToHHMM(horasExtras),
        saldo_devedor_hhmm: hToHHMM(saldoDevedorHoras),
      };
    });

    return { linhas };
  }

  // --- LISTAGEM (O QUE ALIMENTA A TELA) ---
  async listar(f: Filtros) {
    const where: Prisma.ponto_registrosWhereInput = {};
    const funcionarioId = this.cleanId(f.funcionario_id);
    if (funcionarioId) where.funcionario_id = funcionarioId;
    if (f.tipo) where.tipo = f.tipo;
    if (f.origem) where.origem = f.origem;
    if (f.status) where.status = f.status;

    const ini = this.inicioDia(f.data_ini);
    const fim = this.fimDia(f.data_fim);
    if (ini || fim) {
      where.data_hora = {
        ...(ini ? { gte: ini } : {}),
        ...(fim ? { lte: fim } : {}),
      };
    }

    const rows = await this.prisma.ponto_registros.findMany({
      where,
      orderBy: { data_hora: 'desc' },
      include: {
        funcionario: { select: { nome: true } },
        dispositivo: { select: { device_nome: true } },
      },
    });

    return rows.map((r) => ({
      ...r,
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
    }));
  }

  // --- BUSCA DE DADOS PARA O PDF ---
  async relatorioMensalPdfData(params: {
    funcionario_id: number;
    mes: number;
    ano: number;
  }) {
    const { funcionario_id, mes, ano } = params;
    const dataIni = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));
    const dataFim = new Date(Date.UTC(ano, mes, 1, 0, 0, 0));

    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: {
        id: true,
        nome: true,
        carga_horaria_dia: true,
        carga_horaria_semana: true,
        horario_entrada_1: true,
        horario_saida_1: true,
        horario_entrada_2: true,
        horario_saida_2: true,
        horario_sabado_entrada_1: true,
        horario_sabado_saida_1: true,
      },
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

  // --- GERAÇÃO DO PDF (LAYOUT CORRIGIDO) ---
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

        let totalTrabalhadoMs = 0;
        let totalMetaMs = 0;
        const cargaDecimal = this.cargaDiaHoras(payload.funcionario);
        const diasNoMes = new Date(payload.ano, payload.mes, 0).getDate();

        // 1. Cálculos de Totais (meta variável: Seg-Sex vs Sábado)
        for (let d = 1; d <= diasNoMes; d++) {
          const dt = new Date(payload.ano, payload.mes - 1, d);
          const diaKey = `${payload.ano}-${String(payload.mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const metaDia = this.metaDiaParaData(diaKey, payload.funcionario);
          totalMetaMs += metaDia * 3600000;

          const diaRegs = payload.registros.filter(
            (r) => new Date(r.data_hora).getUTCDate() === d,
          );
          for (let i = 0; i < diaRegs.length; i += 2) {
            if (
              diaRegs[i] &&
              diaRegs[i + 1] &&
              diaRegs[i].tipo === 'ENTRADA' &&
              diaRegs[i + 1].tipo === 'SAIDA'
            ) {
              totalTrabalhadoMs +=
                new Date(diaRegs[i + 1].data_hora).getTime() -
                new Date(diaRegs[i].data_hora).getTime();
            }
          }
        }
        const saldoMs = totalTrabalhadoMs - totalMetaMs;

        // 2. Cabeçalho Resumo
        const resY = headerBottomY + 10;
        doc.rect(30, resY, 535, 50).fill('#f8fafc');
        doc
          .fillColor('#1e293b')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('ESPELHO DE PONTO MENSAL', 35, resY + 10);
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748b')
          .text('Funcionário: ', 35, resY + 25, { continued: true })
          .fillColor('#1e293b')
          .font('Helvetica-Bold')
          .text(payload.funcionario?.nome?.toUpperCase() || '');
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748b')
          .text('Carga Diária: ', 35, resY + 35, { continued: true })
          .fillColor('#1e293b')
          .text(`${cargaDecimal.toFixed(2)}h`);

        doc
          .fillColor('#64748b')
          .fontSize(7)
          .text('TRABALHADO', 380, resY + 12);
        doc
          .fillColor('#0f172a')
          .fontSize(10)
          .text(this.msToHHMM(totalTrabalhadoMs), 380, resY + 22);
        doc.fillColor('#64748b').text('SALDO PERÍODO', 460, resY + 12);
        doc
          .fillColor(saldoMs >= 0 ? '#10b981' : '#ef4444')
          .text(this.msToHHMM(saldoMs), 460, resY + 22);

        // 3. Tabela
        const col = {
          d: 35,
          e1: 95,
          s1: 140,
          e2: 185,
          s2: 230,
          t: 280,
          obs: 335,
        };
        let curY = resY + 60;
        const rowH = 14.3;

        doc.rect(30, curY, 535, rowH).fill('#1e293b');
        doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold');
        doc.text('DATA', col.d, curY + 4);
        doc.text('ENT 1', col.e1, curY + 4);
        doc.text('SAI 1', col.s1, curY + 4);
        doc.text('ENT 2', col.e2, curY + 4);
        doc.text('SAI 2', col.s2, curY + 4);
        doc.text('TOTAL', col.t, curY + 4);
        doc.text('OBSERVAÇÕES', col.obs, curY + 4);
        curY += rowH;

        for (let d = 1; d <= diasNoMes; d++) {
          const dt = new Date(payload.ano, payload.mes - 1, d);
          const diaSem = dt.getDay();
          if (diaSem === 0 || diaSem === 6)
            doc.rect(30, curY, 535, rowH).fill('#f1f5f9');
          else if (d % 2 === 0) doc.rect(30, curY, 535, rowH).fill('#fafafa');

          doc
            .fillColor(diaSem === 0 ? '#94a3b8' : '#1e293b')
            .font('Helvetica')
            .fontSize(7);
          const dataLabel = `${String(d).padStart(2, '0')}/${String(payload.mes).padStart(2, '0')} (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][diaSem]})`;
          doc.text(dataLabel, col.d, curY + 4);

          const diaKey = `${payload.ano}-${String(payload.mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dRegs = payload.registros
            .filter((r) => this.dateKeySP(r.data_hora) === diaKey)
            .sort(
              (a, b) =>
                new Date(a.data_hora).getTime() -
                new Date(b.data_hora).getTime(),
            );
          const e1 = dRegs[0],
            s1 = dRegs[1],
            e2 = dRegs[2],
            s2 = dRegs[3];

          doc.text(
            e1 ? this.formatHora(e1.data_hora) : '--:--',
            col.e1,
            curY + 4,
          );
          doc.text(
            s1 ? this.formatHora(s1.data_hora) : '--:--',
            col.s1,
            curY + 4,
          );
          doc.text(
            e2 ? this.formatHora(e2.data_hora) : '--:--',
            col.e2,
            curY + 4,
          );
          doc.text(
            s2 ? this.formatHora(s2.data_hora) : '--:--',
            col.s2,
            curY + 4,
          );

          let dMs = 0;
          if (e1 && s1 && e1.tipo === 'ENTRADA' && s1.tipo === 'SAIDA')
            dMs +=
              new Date(s1.data_hora).getTime() -
              new Date(e1.data_hora).getTime();
          if (e2 && s2 && e2.tipo === 'ENTRADA' && s2.tipo === 'SAIDA')
            dMs +=
              new Date(s2.data_hora).getTime() -
              new Date(e2.data_hora).getTime();

          if (dMs > 0)
            doc
              .font('Helvetica-Bold')
              .text(this.msToHHMM(dMs), col.t, curY + 4)
              .font('Helvetica');

          const j = payload.justificativas.find(
            (j) => this.dateKeySP(j.data) === diaKey,
          );
          if (j)
            doc
              .fillColor('#e11d48')
              .fontSize(6)
              .text(j.tipo.toUpperCase(), col.obs, curY + 4);
          else if (diaSem === 0)
            doc.fillColor('#94a3b8').text('REPOUSO SEMANAL', col.obs, curY + 4);

          curY += rowH;
        }

        // 4. Assinaturas
        doc
          .strokeColor('#cbd5e1')
          .lineWidth(0.5)
          .moveTo(50, 760)
          .lineTo(230, 760)
          .stroke();
        doc.moveTo(350, 760).lineTo(530, 760).stroke();
        doc
          .fontSize(7)
          .fillColor('#475569')
          .text('ASSINATURA DO FUNCIONÁRIO', 50, 765, {
            width: 180,
            align: 'center',
          });
        doc.text('RESPONSÁVEL / EMPRESA', 350, 765, {
          width: 180,
          align: 'center',
        });

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  // --- MÉTODO PRINCIPAL ---
  async gerarPdfMensalESalvar(params: {
    funcionario_id: number;
    mes: number;
    ano: number;
  }) {
    const { funcionario, registros, justificativas } =
      await this.relatorioMensalPdfData(params);

    if (!funcionario)
      throw new BadRequestException('Funcionário não encontrado');

    const pdfBuffer = await this.gerarPdfPontoBuffer({
      funcionario,
      registros,
      justificativas,
      mes: params.mes,
      ano: params.ano,
    });

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
        nome: `RELATÓRIO PONTO ${String(params.mes).padStart(2, '0')}/${params.ano} - ${funcionario.nome}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      },
    });

    return { arquivoId: arquivo.id };
  }
}
