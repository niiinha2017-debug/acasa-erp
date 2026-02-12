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

type FechamentoFolhaParams = {
  data_ini: string;
  data_fim: string;
  apenas_ativos?: boolean;
};

@Injectable()
export class PontoRelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  private round2(v: number) {
    return Math.round((Number(v) || 0) * 100) / 100;
  }

  private parseYmd(ymd: string, fim = false) {
    const s = String(ymd || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      throw new BadRequestException('Data inválida. Use YYYY-MM-DD.');
    }
    return new Date(`${s}T${fim ? '23:59:59.999' : '00:00:00.000'}Z`);
  }

  private contarDiasUteis(dataIni: Date, dataFim: Date) {
    let total = 0;
    const cursor = new Date(dataIni);
    while (cursor <= dataFim) {
      const dow = cursor.getUTCDay();
      if (dow >= 1 && dow <= 5) total += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return total;
  }

  private calcularHorasTrabalhadas(registros: Array<{ data_hora: Date; tipo: 'ENTRADA' | 'SAIDA' }>) {
    const ordenados = [...registros].sort(
      (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
    );
    let totalMs = 0;
    let entrada: Date | null = null;
    for (const r of ordenados) {
      if (r.tipo === 'ENTRADA') {
        entrada = new Date(r.data_hora);
        continue;
      }
      if (r.tipo === 'SAIDA' && entrada) {
        const saida = new Date(r.data_hora);
        const diff = saida.getTime() - entrada.getTime();
        if (diff > 0) totalMs += diff;
        entrada = null;
      }
    }
    return totalMs / 3600000;
  }

  private async ensureTabelaFechamentoFolha() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ponto_fechamentos_folha (
        id INT NOT NULL AUTO_INCREMENT,
        funcionario_id INT NOT NULL,
        data_ini DATE NOT NULL,
        data_fim DATE NOT NULL,
        horas_meta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        horas_trabalhadas DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        horas_extras DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        saldo_devedor_horas DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        custo_hora DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        salario_contratado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        valor_hora_extra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        desconto_devedor_aplicado TINYINT(1) NOT NULL DEFAULT 0,
        valor_desconto_devedor DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        salario_apurado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY ponto_fechamentos_folha_func_periodo_key (funcionario_id, data_ini, data_fim),
        INDEX ponto_fechamentos_folha_data_idx (data_ini, data_fim),
        CONSTRAINT ponto_fechamentos_folha_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  async fecharFolhaPeriodo(params: FechamentoFolhaParams) {
    const dataIni = this.parseYmd(params.data_ini);
    const dataFim = this.parseYmd(params.data_fim, true);
    if (dataIni > dataFim) {
      throw new BadRequestException('data_ini não pode ser maior que data_fim.');
    }

    await this.ensureTabelaFechamentoFolha();

    const funcionarios = await this.prisma.funcionarios.findMany({
      where: params.apenas_ativos === false ? {} : { status: 'ATIVO' },
      select: {
        id: true,
        nome: true,
        status: true,
        salario_base: true,
        salario_adicional: true,
        custo_hora: true,
        carga_horaria_dia: true,
        carga_horaria_semana: true,
      },
      orderBy: { nome: 'asc' },
    });

    const linhas: any[] = [];
    for (const f of funcionarios) {
      const registros = await this.prisma.ponto_registros.findMany({
        where: {
          funcionario_id: f.id,
          status: 'ATIVO',
          data_hora: { gte: dataIni, lte: dataFim },
        },
        select: { data_hora: true, tipo: true },
      });

      const horasTrabalhadas = this.round2(this.calcularHorasTrabalhadas(registros as any));
      const cargaDia = Number(f.carga_horaria_dia || 0);
      const cargaSem = Number(f.carga_horaria_semana || 0);
      const metaDia = cargaDia > 0 ? cargaDia : (cargaSem > 0 ? cargaSem / 5 : 0);
      const diasUteis = this.contarDiasUteis(dataIni, dataFim);
      const horasMeta = this.round2(metaDia * diasUteis);
      const horasExtras = this.round2(Math.max(horasTrabalhadas - horasMeta, 0));
      const saldoDevedorHoras = this.round2(Math.max(horasMeta - horasTrabalhadas, 0));

      const salarioContratado = this.round2(
        Number(f.salario_base || 0) + Number(f.salario_adicional || 0),
      );
      const custoHoraBase = Number(f.custo_hora || 0);
      const custoHora = this.round2(
        custoHoraBase > 0
          ? custoHoraBase
          : horasMeta > 0
            ? salarioContratado / horasMeta
            : 0,
      );

      const valorHoraExtra = this.round2(horasExtras * custoHora);
      const valorDescontoDevedor = 0;
      const descontoDevedorAplicado = 0;
      const salarioApurado = this.round2(
        salarioContratado + valorHoraExtra - valorDescontoDevedor,
      );

      await this.prisma.$executeRawUnsafe(
        `
          INSERT INTO ponto_fechamentos_folha (
            funcionario_id, data_ini, data_fim, horas_meta, horas_trabalhadas, horas_extras,
            saldo_devedor_horas, custo_hora, salario_contratado, valor_hora_extra,
            desconto_devedor_aplicado, valor_desconto_devedor, salario_apurado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            horas_meta = VALUES(horas_meta),
            horas_trabalhadas = VALUES(horas_trabalhadas),
            horas_extras = VALUES(horas_extras),
            saldo_devedor_horas = VALUES(saldo_devedor_horas),
            custo_hora = VALUES(custo_hora),
            salario_contratado = VALUES(salario_contratado),
            valor_hora_extra = VALUES(valor_hora_extra),
            desconto_devedor_aplicado = VALUES(desconto_devedor_aplicado),
            valor_desconto_devedor = VALUES(valor_desconto_devedor),
            salario_apurado = VALUES(salario_apurado)
        `,
        f.id,
        params.data_ini,
        params.data_fim,
        horasMeta,
        horasTrabalhadas,
        horasExtras,
        saldoDevedorHoras,
        custoHora,
        salarioContratado,
        valorHoraExtra,
        descontoDevedorAplicado,
        valorDescontoDevedor,
        salarioApurado,
      );

      linhas.push({
        funcionario_id: f.id,
        nome: f.nome,
        status: f.status,
        horas_meta: horasMeta,
        horas_trabalhadas: horasTrabalhadas,
        horas_extras: horasExtras,
        saldo_devedor_horas: saldoDevedorHoras,
        custo_hora: custoHora,
        salario_contratado: salarioContratado,
        valor_hora_extra: valorHoraExtra,
        desconto_devedor_aplicado: false,
        valor_desconto_devedor: 0,
        salario_apurado: salarioApurado,
      });
    }

    const totais = linhas.reduce(
      (acc, l) => {
        acc.horas_meta += Number(l.horas_meta || 0);
        acc.horas_trabalhadas += Number(l.horas_trabalhadas || 0);
        acc.horas_extras += Number(l.horas_extras || 0);
        acc.saldo_devedor_horas += Number(l.saldo_devedor_horas || 0);
        acc.salario_contratado += Number(l.salario_contratado || 0);
        acc.valor_hora_extra += Number(l.valor_hora_extra || 0);
        acc.salario_apurado += Number(l.salario_apurado || 0);
        return acc;
      },
      {
        horas_meta: 0,
        horas_trabalhadas: 0,
        horas_extras: 0,
        saldo_devedor_horas: 0,
        salario_contratado: 0,
        valor_hora_extra: 0,
        salario_apurado: 0,
      },
    );

    return {
      data_ini: params.data_ini,
      data_fim: params.data_fim,
      apenas_ativos: params.apenas_ativos !== false,
      linhas,
      totais: {
        horas_meta: this.round2(totais.horas_meta),
        horas_trabalhadas: this.round2(totais.horas_trabalhadas),
        horas_extras: this.round2(totais.horas_extras),
        saldo_devedor_horas: this.round2(totais.saldo_devedor_horas),
        salario_contratado: this.round2(totais.salario_contratado),
        valor_hora_extra: this.round2(totais.valor_hora_extra),
        salario_apurado: this.round2(totais.salario_apurado),
      },
    };
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
    return (
      d.getUTCHours().toString().padStart(2, '0') +
      ':' +
      d.getUTCMinutes().toString().padStart(2, '0')
    );
  }

  private msToHHMM(ms: number): string {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const h = Math.floor(absMs / 3600000);
    const m = Math.floor((absMs % 3600000) / 60000);
    return `${isNegative ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
        const cargaDecimal = Number(
          payload.funcionario?.carga_horaria_dia || 0,
        );
        const cargaMs = cargaDecimal * 3600000;
        const diasNoMes = new Date(payload.ano, payload.mes, 0).getDate();

        // 1. Cálculos de Totais
        for (let d = 1; d <= diasNoMes; d++) {
          const dt = new Date(payload.ano, payload.mes - 1, d);
          if (dt.getDay() > 0 && dt.getDay() < 6) totalMetaMs += cargaMs;

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

          const dRegs = payload.registros
            .filter((r) => new Date(r.data_hora).getUTCDate() === d)
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
            (j) => new Date(j.data).getUTCDate() === d,
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

  // --- PDF EM LOTE (EQUIPE) ---
  async gerarPdfMensalEquipeESalvar(params: {
    funcionario_ids?: any[];
    mes: number;
    ano: number;
  }) {
    const idsRaw = Array.isArray(params.funcionario_ids)
      ? params.funcionario_ids
      : [];
    const ids = Array.from(
      new Set(
        idsRaw
          .map((v) => this.cleanId(String(v)))
          .filter((v): v is number => Boolean(v)),
      ),
    );

    const funcionarios = await this.prisma.funcionarios.findMany({
      where: ids.length
        ? { id: { in: ids } }
        : { status: 'ATIVO' },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });

    if (!funcionarios.length) {
      throw new BadRequestException('Nenhum funcionário encontrado');
    }

    const arquivos: Array<{
      arquivoId: number;
      funcionario_id: number;
      funcionario_nome: string;
    }> = [];

    for (const f of funcionarios) {
      const res = await this.gerarPdfMensalESalvar({
        funcionario_id: f.id,
        mes: params.mes,
        ano: params.ano,
      });
      arquivos.push({
        arquivoId: res.arquivoId,
        funcionario_id: f.id,
        funcionario_nome: f.nome,
      });
    }

    return { total: arquivos.length, arquivos };
  }
}
