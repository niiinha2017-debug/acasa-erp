import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto';
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto';
import { renderHeaderA4Png } from '../pdf/render-header-a4';
import {
  FUNCIONARIOS_BASE_CALCULO,
  FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS,
} from '../shared/constantes/funcionarios-custos';
import {
  INSS_FAIXAS_2025,
  INSS_TETO_CONTRIBUICAO,
  IRRF_FAIXAS_2025,
  IRRF_DEDUCAO_DEPENDENTE,
  FGTS_ALIQUOTA,
  FERIAS_PERIODO_AQUISITIVO_MESES,
  FERIAS_DIAS_DIREITO,
  FERIAS_ADICIONAL_TERCIO,
  FERIAS_TABELA_FALTAS,
  FUNCIONARIO_STATUS_TRANSICOES,
  FUNCIONARIO_STATUS_MOTIVOS_OBRIGATORIOS,
  FUNCIONARIO_STATUS_LABELS,
} from '../shared/constantes/tabelas-impostos';
import { UpsertFuncionarioCustoConstanteDto } from './dto/upsert-funcionario-custo-constante.dto';
import { AtualizarStatusFuncionarioDto } from './dto/atualizar-status-funcionario.dto';

@Injectable()
export class FuncionariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private readonly STATUS_ATIVO = 'ATIVO';
  private readonly STATUS_INATIVO = 'INATIVO';

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  private round4(n: number) {
    return Math.round((n + Number.EPSILON) * 10000) / 10000;
  }

  private toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private normalizarTexto(v?: string | null): string {
    return String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private textoDespesa(despesa: {
    categoria?: string | null;
    classificacao?: string | null;
    local?: string | null;
  }): string {
    return FUNCIONARIOS_BASE_CALCULO.campos_texto
      .map((campo) => this.normalizarTexto(despesa[campo]))
      .filter(Boolean)
      .join(' ');
  }

  async sincronizarComSistemaRH(params?: {
    mes?: number;
    ano?: number;
    capacidade_m2_mes?: number;
  }) {
    const now = new Date();
    const mes =
      Number.isFinite(Number(params?.mes)) && Number(params?.mes) >= 1 && Number(params?.mes) <= 12
        ? Number(params?.mes)
        : now.getMonth() + 1;
    const ano =
      Number.isFinite(Number(params?.ano)) && Number(params?.ano) >= 2000
        ? Number(params?.ano)
        : now.getFullYear();

    const divisorPadraoM2 = FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_m2.divisor_padrao;
    const capacidadeM2 = this.toNum(params?.capacidade_m2_mes);
    const divisorM2 = capacidadeM2 > 0 ? capacidadeM2 : divisorPadraoM2;

    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const despesasMes = await this.prisma.despesas.findMany({
      where: {
        tipo_movimento: 'SAIDA',
        data_vencimento: { gte: inicioMes, lte: fimMes },
      },
      select: {
        categoria: true,
        classificacao: true,
        local: true,
        valor_total: true,
      },
    });

    const normalizadas = [...FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS].map((k) => this.normalizarTexto(k));
    const termosComissao = ['COMISSAO', 'COMISSOES'].map((v) => this.normalizarTexto(v));

    const termosSalario = ['SALARIO', 'SALARIOS'].map((v) => this.normalizarTexto(v));
    const termosHoraExtra = ['HORA_EXTRA', 'HORAS_EXTRAS'].map((v) => this.normalizarTexto(v));
    const termosProLabore = ['PRO_LABORE', 'PRO LABORE'].map((v) => this.normalizarTexto(v));

    const termosEncargosFixos = [
      'INSS',
      'FGTS',
      'VALE_TRANSPORTE',
      'VALE TRANSPORTE',
      'VALE_ALIMENTACAO',
      'VALE ALIMENTACAO',
      'PLANO_SAUDE',
      'PLANO SAUDE',
    ].map((v) => this.normalizarTexto(v));

    const termosBeneficiosExtras = normalizadas.filter((k) => {
      return (
        k.includes('BENEFICIO') ||
        k === 'VA' ||
        k === 'VR' ||
        k === 'VT' ||
        k === 'VALE' ||
        k.includes('VALE ') ||
        k.includes('PLANO SAUDE')
      );
    });

    const containsAny = (texto: string, termos: string[]) => termos.some((t) => texto.includes(t));

    let fabricaProducao = 0;
    let admProLabore = 0;
    let somaEncargosBeneficios = 0;

    for (const despesa of despesasMes) {
      const texto = this.textoDespesa(despesa);
      const local = this.normalizarTexto(despesa.local);
      const valor = this.toNum((despesa as any).valor_total);

      if (!Number.isFinite(valor) || valor <= 0) continue;

      // Exclusão global: comissão não entra nos cards de RH.
      if (containsAny(texto, termosComissao)) continue;

      const isFabrica = local === 'FABRICA';
      const isEscritorio = local === 'ESCRITORIO';
      const isSalario = containsAny(texto, termosSalario);
      const isHoraExtra = containsAny(texto, termosHoraExtra);
      const isProLabore = containsAny(texto, termosProLabore);
      const isEncargoBeneficio =
        containsAny(texto, termosEncargosFixos) || containsAny(texto, termosBeneficiosExtras);

      if (isFabrica && (isSalario || isHoraExtra)) {
        fabricaProducao += valor;
        continue;
      }

      if (isProLabore || (isEscritorio && isSalario)) {
        admProLabore += valor;
        continue;
      }

      if (isEncargoBeneficio) {
        somaEncargosBeneficios += valor;
      }
    }

    const folhaTotal = fabricaProducao + admProLabore;
    const custoHoraHomemM2 = this.round4(fabricaProducao / divisorM2);
    const custoFixoFabricaM2 = this.round4(somaEncargosBeneficios / divisorM2);

    return {
      fabricaProducao: this.round2(fabricaProducao),
      admProLabore: this.round2(admProLabore),
      folhaTotal: this.round2(folhaTotal),
      custoHoraHomemM2,
      custoFixoFabricaM2,
    };
  }

  async calcularEstruturaCustos() {
    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const divisorHoraHomemPadrao =
      FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_hora.divisor_padrao;
    const divisorHoraFabricaPadrao =
      FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_m2.divisor_padrao;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: 1 },
      select: { horas_uteis_mes_fabrica: true },
    });

    const horasUteisMesFabrica = this.toNum((empresa as any)?.horas_uteis_mes_fabrica);
    const divisorHoraHomem =
      horasUteisMesFabrica > 0 ? horasUteisMesFabrica : divisorHoraHomemPadrao;

    // Quando capacidade_m2_mes não está disponível no schema, usamos horas totais da fábrica.
    const divisorHoraFabrica =
      horasUteisMesFabrica > 0
        ? horasUteisMesFabrica
        : divisorHoraFabricaPadrao > 0
          ? divisorHoraFabricaPadrao
          : divisorHoraHomemPadrao;

    const despesasMes = await this.prisma.despesas.findMany({
      where: {
        tipo_movimento: 'SAIDA',
        data_registro: { gte: inicioMes, lte: fimMes },
      },
      select: {
        categoria: true,
        classificacao: true,
        local: true,
        valor_total: true,
      },
    });

    const todasKeywords = [...FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS].map((k) => this.normalizarTexto(k));
    const containsAny = (texto: string, termos: string[]) => termos.some((termo) => texto.includes(termo));

    const categoriasHoraHomem = ['SALARIO', 'SALARIOS', 'HORA_EXTRA', 'HORAS_EXTRAS', 'FERIAS'].map((v) =>
      this.normalizarTexto(v),
    );
    const categoriasHoraFabricaBase = [
      'INSS',
      'FGTS',
      'VALE_TRANSPORTE',
      'VALE TRANSPORTE',
      'VALE_ALIMENTACAO',
      'VALE ALIMENTACAO',
      'PLANO_SAUDE',
      'PLANO SAUDE',
    ].map((v) => this.normalizarTexto(v));

    const categoriasBeneficiosExtras = todasKeywords.filter((k) => {
      return (
        k.includes('BENEFICIO') ||
        k === 'VALE' ||
        k === 'VT' ||
        k === 'VA' ||
        k === 'VR' ||
        k.includes('PLANO SAUDE')
      );
    });

    const categoriasDespesaGlobal = ['PRO_LABORE', 'PRO LABORE', 'COMISSAO', 'COMISSOES'].map((v) =>
      this.normalizarTexto(v),
    );

    let totalHoraHomem = 0;
    let totalHoraFabrica = 0;
    let despesaGlobal = 0;

    for (const despesa of despesasMes) {
      const texto = this.textoDespesa(despesa);
      const localNorm = this.normalizarTexto(despesa.local);
      const valor = this.toNum((despesa as any).valor_total);
      const isLocalFabrica = localNorm === 'FABRICA';

      if (containsAny(texto, categoriasDespesaGlobal)) {
        despesaGlobal += valor;
        continue;
      }

      if (isLocalFabrica && containsAny(texto, categoriasHoraHomem)) {
        totalHoraHomem += valor;
        continue;
      }

      if (
        isLocalFabrica &&
        (containsAny(texto, categoriasHoraFabricaBase) || containsAny(texto, categoriasBeneficiosExtras))
      ) {
        totalHoraFabrica += valor;
      }
    }

    const custoHoraHomem = this.round4(totalHoraHomem / divisorHoraHomem);
    const custoHoraFabrica = this.round4(totalHoraFabrica / divisorHoraFabrica);

    return {
      custoHoraHomem,
      custoHoraFabrica,
      despesaGlobal: this.round2(despesaGlobal),
    };
  }

  private calcularStatus(input: {
    data_inicio?: Date | null;
    admissao?: Date | null;
    demissao?: Date | null;
  }) {
    const dataInicio = input.data_inicio ?? null;
    const admissao = input.admissao ?? null;
    const demissao = input.demissao ?? null;

    if (demissao) return this.STATUS_INATIVO;
    if (admissao) return this.STATUS_ATIVO;
    if (dataInicio) return this.STATUS_ATIVO;
    return this.STATUS_INATIVO;
  }

  async listar() {
    const funcionarios = await this.prisma.funcionarios.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        usuario_id: true,
        nome: true,
        cpf: true,
        pis: true,
        rg: true,
        data_nascimento: true,
        telefone: true,
        whatsapp: true,
        email: true,
        estado_civil: true,
        escolaridade: true,
        unidade: true,
        setor: true,
        cargo: true,
        funcao: true,
        cep: true,
        endereco: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        estado: true,
        data_inicio: true,
        admissao: true,
        demissao: true,
        salario_base: true,
        impostos_encargos_percentual: true,
        custo_total_mensal: true,
        salario_adicional: true,
        custo_hora: true,
        tem_vale: true,
        vale: true,
        tem_vale_transporte: true,
        vale_transporte: true,
        horario_entrada_1: true,
        horario_saida_1: true,
        horario_entrada_2: true,
        horario_saida_2: true,
        horario_sabado_entrada_1: true,
        horario_sabado_saida_1: true,
        carga_horaria_dia: true,
        carga_horaria_semana: true,
        forma_pagamento: true,
        dia_pagamento: true,
        banco: true,
        agencia: true,
        conta: true,
        pix_tipo_chave: true,
        pix_chave: true,
        status: true,
        criado_em: true,
        atualizado_em: true,
        usuario: {
          select: { id: true, status: true },
        },
      },
    });

    const usuarioIds = funcionarios
      .map((f) => f.usuario?.id)
      .filter((id): id is number => id != null);
    const idsPendenteSenha = new Set<number>();
    if (usuarioIds.length > 0) {
      const recs = await this.prisma.recuperacao_senha.findMany({
        where: { usuario_id: { in: usuarioIds }, utilizado: false },
        select: { usuario_id: true },
      });
      recs.forEach((r) => idsPendenteSenha.add(r.usuario_id));
    }

    return funcionarios.map((f) => {
      const statusNorm = String(f.status ?? '').trim().toUpperCase();
      const usuario = f.usuario;
      const pendenteSenha = usuario ? idsPendenteSenha.has(usuario.id) : false;
      const statusUsuario = usuario ? String(usuario.status ?? '').trim().toUpperCase() : '';
      const statusAcesso =
        statusNorm === 'INATIVO'
          ? 'Inativo'
          : usuario && (statusUsuario === 'PENDENTE' || pendenteSenha)
            ? 'Pendente de Senha'
            : 'Ativo';

      const { usuario: _u, ...rest } = f;
      return {
        ...rest,
        status_acesso: statusAcesso,
      };
    });
  }

  async buscarPorId(id: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id },
    });
    if (!funcionario)
      throw new NotFoundException('Funcionário não encontrado.');
    return funcionario;
  }

  private calcularHorasMesBasePorFuncionario(f: {
    carga_horaria_semana?: unknown;
    carga_horaria_dia?: unknown;
  }): number {
    const semanal = Number(f.carga_horaria_semana ?? 0);
    if (Number.isFinite(semanal) && semanal > 0) return this.round2(semanal * 4);

    const diaria = Number(f.carga_horaria_dia ?? 0);
    if (Number.isFinite(diaria) && diaria > 0) return this.round2(diaria * 22);

    return FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_hora.divisor_padrao;
  }

  private calcularCustoConstanteFuncionario(input: {
    salario_base?: unknown;
    impostos_encargos_percentual?: unknown;
    salario_adicional?: unknown;
    beneficios?: unknown;
    horas_mes_base?: unknown;
  }) {
    const salarioBase = Number(input.salario_base ?? 0) || 0;
    const encargosPct = Number(input.impostos_encargos_percentual ?? 0) || 0;
    const salarioAdicional = Number(input.salario_adicional ?? 0) || 0;
    const beneficios = Number(input.beneficios ?? 0) || 0;
    const horasMesBase = Number(input.horas_mes_base ?? 0) || 0;

    const custoTotalMensal = this.round2(
      salarioBase * (1 + encargosPct / 100) + salarioAdicional + beneficios,
    );
    const custoHora = horasMesBase > 0 ? this.round4(custoTotalMensal / horasMesBase) : 0;

    return {
      salario_base: this.round2(salarioBase),
      impostos_encargos_percentual: this.round2(encargosPct),
      salario_adicional: this.round2(salarioAdicional),
      beneficios: this.round2(beneficios),
      horas_mes_base: this.round2(
        horasMesBase > 0
          ? horasMesBase
          : FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_hora.divisor_padrao,
      ),
      custo_total_mensal: custoTotalMensal,
      custo_hora: custoHora,
    };
  }

  async sincronizarConstanteCustoComFuncionario(funcionarioId: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionarioId },
      select: {
        id: true,
        salario_base: true,
        impostos_encargos_percentual: true,
        salario_adicional: true,
        tem_vale: true,
        vale: true,
        tem_vale_transporte: true,
        vale_transporte: true,
        carga_horaria_semana: true,
        carga_horaria_dia: true,
      },
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    const beneficios =
      (funcionario.tem_vale ? Number(funcionario.vale ?? 0) || 0 : 0) +
      (funcionario.tem_vale_transporte
        ? Number(funcionario.vale_transporte ?? 0) || 0
        : 0);

    const calculado = this.calcularCustoConstanteFuncionario({
      salario_base: funcionario.salario_base,
      impostos_encargos_percentual: funcionario.impostos_encargos_percentual,
      salario_adicional: funcionario.salario_adicional,
      beneficios,
      horas_mes_base: this.calcularHorasMesBasePorFuncionario(funcionario),
    });

    const saved = await (this.prisma as any).funcionario_custo_constante.upsert({
      where: { funcionario_id: funcionarioId },
      update: calculado,
      create: {
        funcionario_id: funcionarioId,
        ...calculado,
      },
    });

    await this.prisma.funcionarios.update({
      where: { id: funcionarioId },
      data: {
        custo_total_mensal: calculado.custo_total_mensal,
        custo_hora: calculado.custo_hora,
      },
    });

    return saved;
  }

  async obterConstanteCusto(funcionarioId: number) {
    await this.buscarPorId(funcionarioId);
    return this.sincronizarConstanteCustoComFuncionario(funcionarioId);
  }

  async upsertConstanteCusto(
    funcionarioId: number,
    dto: UpsertFuncionarioCustoConstanteDto,
  ) {
    await this.buscarPorId(funcionarioId);

    const atual = await (this.prisma as any).funcionario_custo_constante.findUnique({
      where: { funcionario_id: funcionarioId },
    });

    const horasMesBasePadrao =
      atual?.horas_mes_base ??
      FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_hora.divisor_padrao;

    const payload = {
      salario_base:
        dto.salario_base ?? atual?.salario_base ?? 0,
      impostos_encargos_percentual:
        dto.impostos_encargos_percentual ?? atual?.impostos_encargos_percentual ?? 0,
      salario_adicional:
        dto.salario_adicional ?? atual?.salario_adicional ?? 0,
      beneficios:
        dto.beneficios ?? atual?.beneficios ?? 0,
      horas_mes_base:
        dto.horas_mes_base ?? horasMesBasePadrao,
    };

    const calculado = this.calcularCustoConstanteFuncionario(payload);

    const saved = await (this.prisma as any).funcionario_custo_constante.upsert({
      where: { funcionario_id: funcionarioId },
      update: calculado,
      create: {
        funcionario_id: funcionarioId,
        ...calculado,
      },
    });

    await this.prisma.funcionarios.update({
      where: { id: funcionarioId },
      data: {
        salario_base: calculado.salario_base,
        impostos_encargos_percentual: calculado.impostos_encargos_percentual,
        salario_adicional: calculado.salario_adicional,
        custo_total_mensal: calculado.custo_total_mensal,
        custo_hora: calculado.custo_hora,
      },
    });

    return saved;
  }
  private onlyDigits(v: any) {
    return String(v ?? '').replace(/\D/g, '');
  }

  private formatCPF(v: any) {
    const d = this.onlyDigits(v).padStart(11, '0');
    if (d.length !== 11) return String(v ?? '-');
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }

  private formatRG(v: any) {
    // RG no seu print já está ok, mas isso garante consistência se vier sem máscara.
    const d = this.onlyDigits(v);
    if (!d) return String(v ?? '-');

    // Se vier com 9 dígitos (ex: 191646374), formata 00.000.000-0
    if (d.length === 9)
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
    return String(v ?? '-'); // se já vier formatado, mantém
  }

  private normalizarUnidadeFiltro(unidade?: string | null) {
    const key = String(unidade || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
    if (key === 'LOJA') return ['LOJA'];
    if (key === 'FABRICA') return ['FABRICA', 'FÁBRICA'];
    return [];
  }

  async gerarPdf(ids: number[]): Promise<Buffer> {
    const funcionarios = await this.prisma.funcionarios.findMany({
      where: { id: { in: ids } },
      select: { nome: true, cpf: true, rg: true },
      orderBy: { nome: 'asc' },
    });

    if (!funcionarios.length) {
      throw new NotFoundException('Nenhum funcionário encontrado.');
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const startY = renderHeaderA4Png(doc);
    let y = startY + 40;

    const renderHeaderTabela = () => {
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('NOME', 40, y);
      doc.text('CPF', 310, y);
      doc.text('RG', 430, y);

      y += 18;
      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 10;
      doc.font('Helvetica').fontSize(10);
    };

    renderHeaderTabela();

    for (const f of funcionarios) {
      if (y > 750) {
        doc.addPage();
        const startY2 = renderHeaderA4Png(doc);
        y = startY2 + 40;
        renderHeaderTabela();
      }

      doc.text((f.nome || '-').toUpperCase(), 40, y, { width: 260 });
      doc.text(this.formatCPF(f.cpf), 310, y);
      doc.text(this.formatRG(f.rg), 430, y);
      y += 18;
    }

    doc.end();
    return done;
  }

  private escSvg(value: unknown) {
    if (value == null || value === '') return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async gerarImagem(ids: number[], formato: 'png' | 'jpeg' = 'png'): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
    const funcionarios = await this.prisma.funcionarios.findMany({
      where: { id: { in: ids } },
      select: { nome: true, cpf: true, rg: true },
      orderBy: { nome: 'asc' },
    });

    if (!funcionarios.length) {
      throw new NotFoundException('Nenhum funcionário encontrado.');
    }

    const baseWidth = 1180;
    const headerHeight = 172;
    const tableHeaderHeight = 46;
    const rowHeight = 34;
    const footerHeight = 32;
    const baseHeight = headerHeight + tableHeaderHeight + (funcionarios.length * rowHeight) + footerHeight;
    const scale = 2;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseWidth} ${baseHeight}" width="${baseWidth * scale}" height="${baseHeight * scale}">
  <rect width="${baseWidth}" height="${baseHeight}" fill="#ffffff"/>
  <rect x="32" y="28" width="${baseWidth - 64}" height="96" rx="18" fill="#f8fafc" stroke="#dbe4ee" stroke-width="1.5"/>
  <text x="64" y="62" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Relatório de Funcionários</text>
  <text x="64" y="88" font-family="Arial, sans-serif" font-size="15" fill="#475569">Relação consolidada para conferência visual da equipe</text>
  <text x="64" y="112" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Gerado em ${this.escSvg(new Date().toLocaleString('pt-BR'))}</text>

  <rect x="32" y="146" width="${baseWidth - 64}" height="46" fill="#eaf0f6" rx="10"/>
  <text x="56" y="174" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#334155">NOME</text>
  <text x="620" y="174" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#334155">CPF</text>
  <text x="900" y="174" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#334155">RG</text>

  ${funcionarios.map((f, index) => {
    const y = headerHeight + tableHeaderHeight + (index * rowHeight);
    const rowY = y - 2;
    const lineY = y + 22;
    return `
    <rect x="32" y="${rowY}" width="${baseWidth - 64}" height="${rowHeight - 2}" fill="${index % 2 === 0 ? '#ffffff' : '#fbfdff'}"/>
    <text x="56" y="${lineY}" font-family="Arial, sans-serif" font-size="13" fill="#0f172a">${this.escSvg(String(f.nome || '-').toUpperCase())}</text>
    <text x="620" y="${lineY}" font-family="Arial, sans-serif" font-size="13" fill="#334155">${this.escSvg(this.formatCPF(f.cpf))}</text>
    <text x="900" y="${lineY}" font-family="Arial, sans-serif" font-size="13" fill="#334155">${this.escSvg(this.formatRG(f.rg))}</text>
    <line x1="32" y1="${y + rowHeight - 1}" x2="${baseWidth - 32}" y2="${y + rowHeight - 1}" stroke="#edf2f7" stroke-width="1"/>
    `;
  }).join('')}
</svg>`;

    const svgBuffer = Buffer.from(svg, 'utf8');
    const pipeline = sharp(svgBuffer);
    if (formato === 'jpeg') {
      return {
        buffer: await pipeline.jpeg({ quality: 92 }).toBuffer(),
        contentType: 'image/jpeg',
        ext: 'jpg',
      };
    }
    return {
      buffer: await pipeline.png().toBuffer(),
      contentType: 'image/png',
      ext: 'png',
    };
  }

  async select(q?: string, unidade?: string) {
    const termo = String(q || '').trim();
    const unidadesPermitidas = this.normalizarUnidadeFiltro(unidade);

    const rows = await this.prisma.funcionarios.findMany({
      where: {
        status: 'ATIVO',
        ...(unidadesPermitidas.length
          ? {
              unidade: {
                in: unidadesPermitidas,
              },
            }
          : {}),
        ...(termo
          ? {
              OR: [{ nome: { contains: termo } }, { cpf: { contains: termo } }],
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: { nome: 'asc' },
      take: 50,
    });

    return rows.map((f) => ({
      value: f.id,
      label: f.nome,
    }));
  }

  async gerarPdfESalvar(ids: number[]) {
    const pdfBuffer = await this.gerarPdf(ids);

    const dir = path.join(process.cwd(), 'uploads', 'relatorios');
    await fs.mkdir(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = randomBytes(6).toString('hex');
    const filename = `relatorio_funcionarios_${stamp}_${rand}.pdf`;

    await fs.writeFile(path.join(dir, filename), pdfBuffer);

    const url = `/uploads/relatorios/${filename}`;

    const arquivo = await this.prisma.arquivos.create({
      data: {
        owner_type: 'EMPRESA',
        owner_id: 1,
        categoria: 'RELATORIO',
        slot_key: null, // importante para não bater no unique
        url,
        filename,
        nome: `RELATORIO FUNCIONARIOS ${stamp}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      },
      select: { id: true },
    });

    return { arquivoId: arquivo.id };
  }

  async gerarRelatorioESalvar(ids: number[], formato?: string) {
    const fmt = String(formato || 'pdf').trim().toLowerCase();
    if (fmt === 'png' || fmt === 'jpeg' || fmt === 'jpg') {
      const normalized = fmt === 'jpg' ? 'jpeg' : fmt;
      const image = await this.gerarImagem(ids, normalized as 'png' | 'jpeg');

      const dir = path.join(process.cwd(), 'uploads', 'relatorios');
      await fs.mkdir(dir, { recursive: true });

      const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const rand = randomBytes(6).toString('hex');
      const filename = `relatorio_funcionarios_${stamp}_${rand}.${image.ext}`;

      await fs.writeFile(path.join(dir, filename), image.buffer);

      const url = `/uploads/relatorios/${filename}`;

      const arquivo = await this.prisma.arquivos.create({
        data: {
          owner_type: 'EMPRESA',
          owner_id: 1,
          categoria: 'RELATORIO',
          slot_key: null,
          url,
          filename,
          nome: `RELATORIO FUNCIONARIOS ${stamp}`,
          mime_type: image.contentType,
          tamanho: image.buffer.length,
        },
        select: { id: true },
      });

      return { arquivoId: arquivo.id };
    }

    return this.gerarPdfESalvar(ids);
  }

  private gerarLoginUnico(nome: string): string {
    const base = String(nome ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '')
      .slice(0, 50) || 'usuario';
    let login = base;
    let n = 0;
    return login;
  }

  private cargoUsuarioPorUnidade(unidade: string | null | undefined): 'VENDEDOR_LOJA' | 'MONTADOR_FABRICA' | undefined {
    const u = String(unidade ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
    if (u === 'LOJA') return 'VENDEDOR_LOJA';
    if (u === 'FABRICA' || u === 'FÁBRICA') return 'MONTADOR_FABRICA';
    return undefined;
  }

  async criar(dto: CriarFuncionarioDto) {
    try {
      const data = this.normalizarDatas(dto);
      delete (data as any).criar_usuario;

      // status baseado na sua regra (demissao inativa, admissao/registro ativa)
      data.status = this.calcularStatus({
        data_inicio: data.data_inicio,
        admissao: data.admissao,
        demissao: data.demissao,
      });

      data.custo_total_mensal = this.calcularCustoTotalMensal({
        salario_base: data.salario_base,
        impostos_encargos_percentual: data.impostos_encargos_percentual,
        salario_adicional: data.salario_adicional,
        tem_vale: data.tem_vale,
        vale: data.vale,
        tem_vale_transporte: data.tem_vale_transporte,
        vale_transporte: data.vale_transporte,
      }) ?? undefined;

      const funcionario = await this.prisma.funcionarios.create({ data });

      const email = String(funcionario.email ?? '').trim().toLowerCase();
      const criarUsuario =
        dto.criar_usuario !== false && email.length > 0 && email.includes('@');

      if (criarUsuario) {
        try {
          const baseLogin = this.gerarLoginUnico(funcionario.nome);
          let login = baseLogin;
          let n = 0;
          while (
            await this.prisma.usuarios.findUnique({
              where: { usuario: login },
              select: { id: true },
            })
          ) {
            n++;
            login = `${baseLogin}.${n}`;
          }

          const cargoUsuario = this.cargoUsuarioPorUnidade(funcionario.unidade);
          const criado = await this.authService.cadastro({
            nome: funcionario.nome,
            email,
            usuario: login,
            senha: undefined,
            cargo: cargoUsuario,
          });

          const usuarioId = (criado as any).id;
          if (usuarioId) {
            await this.prisma.usuarios.update({
              where: { id: usuarioId },
              data: { funcionario_id: funcionario.id },
            });
            await this.prisma.funcionarios.update({
              where: { id: funcionario.id },
              data: { usuario_id: usuarioId },
            });
          }
        } catch (err: any) {
          if (err?.code === 'P2002' || err?.response?.statusCode === 400) {
            throw new BadRequestException(
              err?.message ?? 'E-mail já utilizado por outro usuário. Desmarque "Criar usuário de acesso" ou use outro e-mail.',
            );
          }
          throw err;
        }
      }

      await this.sincronizarConstanteCustoComFuncionario(funcionario.id);

      return funcionario;
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new BadRequestException('CPF já cadastrado.');
      throw e;
    }
  }

  async atualizar(id: number, dto: AtualizarFuncionarioDto) {
    await this.buscarPorId(id);

    try {
      const data = this.normalizarDatas(dto);

      // só recalcula se mexeu em registro ou demissao
      const mexeuEmInicio = Object.prototype.hasOwnProperty.call(
        data,
        'data_inicio',
      );
      const mexeuEmAdmissao = Object.prototype.hasOwnProperty.call(
        data,
        'admissao',
      );
      const mexeuEmDemissao = Object.prototype.hasOwnProperty.call(
        data,
        'demissao',
      );

      if (mexeuEmInicio || mexeuEmAdmissao || mexeuEmDemissao) {
        const atual = await this.prisma.funcionarios.findUnique({
          where: { id },
          select: { data_inicio: true, admissao: true, demissao: true },
        });
        if (!atual) throw new NotFoundException('Funcionário não encontrado.');
        data.status = this.calcularStatus({
          data_inicio: mexeuEmInicio ? data.data_inicio : atual.data_inicio,
          admissao: mexeuEmAdmissao ? data.admissao : atual.admissao,
          demissao: mexeuEmDemissao ? data.demissao : atual.demissao,
        });
      }

      const camposCusto = [
        'salario_base',
        'impostos_encargos_percentual',
        'salario_adicional',
        'tem_vale',
        'vale',
        'tem_vale_transporte',
        'vale_transporte',
      ];
      const mexeuEmCusto = camposCusto.some((c) => Object.prototype.hasOwnProperty.call(data, c));
      if (mexeuEmCusto) {
        const atual = await this.prisma.funcionarios.findUnique({
          where: { id },
          select: {
            salario_base: true,
            impostos_encargos_percentual: true,
            salario_adicional: true,
            tem_vale: true,
            vale: true,
            tem_vale_transporte: true,
            vale_transporte: true,
          },
        });
        if (atual) {
          const merged = { ...atual, ...data };
          data.custo_total_mensal =
            this.calcularCustoTotalMensal({
              salario_base: merged.salario_base,
              impostos_encargos_percentual: merged.impostos_encargos_percentual,
              salario_adicional: merged.salario_adicional,
              tem_vale: merged.tem_vale,
              vale: merged.vale,
              tem_vale_transporte: merged.tem_vale_transporte,
              vale_transporte: merged.vale_transporte,
            }) ?? undefined;
        }
      }

      const atualizado = await this.prisma.funcionarios.update({
        where: { id },
        data,
      });

      if (mexeuEmCusto || Object.prototype.hasOwnProperty.call(data, 'carga_horaria_semana') || Object.prototype.hasOwnProperty.call(data, 'carga_horaria_dia')) {
        await this.sincronizarConstanteCustoComFuncionario(id);
      }

      return atualizado;
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new BadRequestException('CPF já cadastrado.');
      throw e;
    }
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    await this.prisma.funcionarios.delete({ where: { id } });
    return { ok: true };
  }

  /** Calcula custo total mensal: base*(1+impostos/100) + adicional + vale + vale_transporte */
  private calcularCustoTotalMensal(f: {
    salario_base?: number | null;
    impostos_encargos_percentual?: number | null;
    salario_adicional?: number | null;
    tem_vale?: boolean;
    vale?: number | null;
    tem_vale_transporte?: boolean;
    vale_transporte?: number | null;
  }): number | null {
    const base = Number(f.salario_base ?? 0);
    if (!base && base !== 0) return null;
    const pct = Number(f.impostos_encargos_percentual ?? 0) || 0;
    const adicional = Number(f.salario_adicional ?? 0) || 0;
    const vale = f.tem_vale ? Number(f.vale ?? 0) || 0 : 0;
    const vt = f.tem_vale_transporte ? Number(f.vale_transporte ?? 0) || 0 : 0;
    const total = base * (1 + pct / 100) + adicional + vale + vt;
    return Math.round(total * 100) / 100;
  }

  private normalizarDatas(dto: any) {
    const data = { ...dto };

    // Dados da empresa: garantir que unidade, setor e cargo sejam persistidos
    const camposEmpresa = ['unidade', 'setor', 'cargo'] as const;
    for (const campo of camposEmpresa) {
      if (Object.prototype.hasOwnProperty.call(dto, campo)) {
        const v = dto[campo];
        const valor =
          v && typeof v === 'object' ? (v.value ?? v.label ?? '') : v;
        data[campo] =
          valor === '' || valor === undefined || valor === null
            ? null
            : String(valor).trim() || null;
      }
    }

    const camposData = [
      'data_nascimento',
      'admissao',
      'demissao',
      'data_inicio',
    ];

    for (const campo of camposData) {
      if (Object.prototype.hasOwnProperty.call(data, campo)) {
        const v = data[campo];
        if (!v) {
          data[campo] = null;
        } else {
          const d = new Date(v);
          data[campo] = isNaN(d.getTime()) ? null : d;
        }
      }
    }

    // Compatibilidade com payload antigo: "registro" passa a preencher "data_inicio"
    if (Object.prototype.hasOwnProperty.call(data, 'registro')) {
      const v = data.registro;
      if (!v) {
        data.data_inicio = null;
      } else {
        const d = new Date(v);
        data.data_inicio = isNaN(d.getTime()) ? null : d;
      }
      delete data.registro;
    }

    return data;
  }

  // ══════════════════════════════════════════════════════════════════
  // BASE DE CÁLCULO DE IMPOSTOS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Calcula INSS progressivo sobre o salário bruto.
   * Aplica a tabela de faixas 2025 e limita ao teto de contribuição.
   */
  private calcularINSS(salarioBruto: number): {
    contribuicao: number;
    detalheFaixas: Array<{ faixa: string; base: number; aliquota: number; contribuicao: number }>;
  } {
    let contribuicaoTotal = 0;
    const detalheFaixas: Array<{ faixa: string; base: number; aliquota: number; contribuicao: number }> = [];
    let baseRestante = salarioBruto;
    let limiteAnterior = 0;

    for (const faixa of INSS_FAIXAS_2025) {
      if (baseRestante <= 0) break;

      const limiteAtual = faixa.limiteAte ?? Infinity;
      const baseFaixa = faixa.limiteAte
        ? Math.min(baseRestante, faixa.limiteAte - limiteAnterior)
        : baseRestante;

      if (baseFaixa <= 0) break;

      const contribuicaoFaixa = this.round2(baseFaixa * faixa.aliquota);
      contribuicaoTotal += contribuicaoFaixa;

      detalheFaixas.push({
        faixa: faixa.limiteAte
          ? `Até R$ ${faixa.limiteAte.toFixed(2)}`
          : `Acima de R$ ${limiteAnterior.toFixed(2)} (teto)`,
        base: this.round2(baseFaixa),
        aliquota: faixa.aliquota,
        contribuicao: contribuicaoFaixa,
      });

      baseRestante -= baseFaixa;
      limiteAnterior = faixa.limiteAte ?? limiteAnterior;
    }

    // Garante que não ultrapasse o teto
    const contribuicao = this.round2(Math.min(contribuicaoTotal, INSS_TETO_CONTRIBUICAO));
    return { contribuicao, detalheFaixas };
  }

  /**
   * Calcula IRRF mensal após deduzir INSS e dependentes.
   */
  private calcularIRRF(salarioBruto: number, inssContribuicao: number, dependentes: number): {
    baseCalculo: number;
    deducaoDependentes: number;
    aliquota: number;
    parcelaDeduzir: number;
    irrf: number;
    irrfEfetivo: number;
    faixaLabel: string;
  } {
    const deducaoDependentes = this.round2(dependentes * IRRF_DEDUCAO_DEPENDENTE);
    const baseCalculo = this.round2(Math.max(0, salarioBruto - inssContribuicao - deducaoDependentes));

    let aliquota = 0;
    let parcelaDeduzir = 0;
    let faixaLabel = 'Isento';

    for (const faixa of IRRF_FAIXAS_2025) {
      if (faixa.limiteAte === null || baseCalculo <= faixa.limiteAte) {
        aliquota = faixa.aliquota;
        parcelaDeduzir = faixa.parcelaDeduzir;
        faixaLabel =
          faixa.limiteAte
            ? `Até R$ ${faixa.limiteAte.toFixed(2)} (${(faixa.aliquota * 100).toFixed(1)}%)`
            : `Acima de R$ 5.877,72 (27,5%)`;
        break;
      }
    }

    const irrf = this.round2(Math.max(0, baseCalculo * aliquota - parcelaDeduzir));
    const irrfEfetivo = salarioBruto > 0 ? this.round4(irrf / salarioBruto) : 0;

    return { baseCalculo, deducaoDependentes, aliquota, parcelaDeduzir, irrf, irrfEfetivo, faixaLabel };
  }

  /**
   * Retorna o detalhamento completo de impostos para um funcionário no mês de referência.
   */
  async calcularImpostos(
    funcionarioId: number,
    params?: { dependentes?: number; mes?: number; ano?: number },
  ) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionarioId },
      select: {
        id: true,
        nome: true,
        salario_base: true,
        salario_adicional: true,
        tem_vale: true,
        vale: true,
        tem_vale_transporte: true,
        vale_transporte: true,
        admissao: true,
        demissao: true,
        data_inicio: true,
        status: true,
      },
    });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado.');

    const dependentes = Math.max(0, Number(params?.dependentes ?? 0));
    const now = new Date();
    const mes = params?.mes ?? now.getMonth() + 1;
    const ano = params?.ano ?? now.getFullYear();

    const salarioBase = this.toNum(funcionario.salario_base);
    const salarioAdicional = this.toNum(funcionario.salario_adicional);
    const vale = funcionario.tem_vale ? this.toNum(funcionario.vale) : 0;
    const valeTransporte = funcionario.tem_vale_transporte ? this.toNum(funcionario.vale_transporte) : 0;

    // Salário bruto = base + adicional (sem vales, que são benefícios não incidentes em INSS/IRRF)
    const salarioBruto = this.round2(salarioBase + salarioAdicional);

    // INSS
    const inssCalculo = this.calcularINSS(salarioBruto);
    const inssContribuicao = inssCalculo.contribuicao;

    // IRRF
    const irrfCalculo = this.calcularIRRF(salarioBruto, inssContribuicao, dependentes);
    const irrf = irrfCalculo.irrf;

    // FGTS (pago pelo empregador sobre salário bruto)
    const fgts = this.round2(salarioBruto * FGTS_ALIQUOTA);

    // Líquido do funcionário
    const salarioLiquido = this.round2(Math.max(0, salarioBruto - inssContribuicao - irrf));

    // Custo total para a empresa (salário bruto + FGTS + vales)
    const custoTotalEmpresa = this.round2(salarioBruto + fgts + vale + valeTransporte);

    // 13º proporcional estimado (base: meses trabalhados no ano)
    const admissaoBase = funcionario.admissao ?? funcionario.data_inicio;
    const mesesTrabalhados = this.calcularMesesTrabalhados(admissaoBase, mes, ano);
    const decimoTerceiroBruto = this.round2((salarioBruto / 12) * mesesTrabalhados);
    const fgtsDecimoTerceiro = this.round2(decimoTerceiroBruto * FGTS_ALIQUOTA);
    const inssDecimoTerceiro = this.calcularINSS(decimoTerceiroBruto).contribuicao;

    return {
      funcionario: { id: funcionario.id, nome: funcionario.nome, status: funcionario.status },
      referencia: { mes, ano },
      salarios: {
        salario_base: this.round2(salarioBase),
        salario_adicional: this.round2(salarioAdicional),
        salario_bruto: salarioBruto,
      },
      inss: {
        contribuicao: inssContribuicao,
        teto: INSS_TETO_CONTRIBUICAO,
        detalhe_faixas: inssCalculo.detalheFaixas,
      },
      irrf: {
        dependentes,
        deducao_dependentes: irrfCalculo.deducaoDependentes,
        base_calculo: irrfCalculo.baseCalculo,
        aliquota_efetiva: `${(irrfCalculo.aliquota * 100).toFixed(1)}%`,
        faixa: irrfCalculo.faixaLabel,
        imposto: irrf,
        aliquota_real_salario: `${(irrfCalculo.irrfEfetivo * 100).toFixed(2)}%`,
      },
      fgts: {
        aliquota: `${(FGTS_ALIQUOTA * 100).toFixed(0)}%`,
        deposito_mensal: fgts,
        nota: 'Depositado pelo empregador; não desconta do salário líquido.',
      },
      beneficios: {
        vale_alimentacao: vale,
        vale_transporte: valeTransporte,
        total_beneficios: this.round2(vale + valeTransporte),
      },
      resultado: {
        salario_liquido: salarioLiquido,
        custo_total_empresa: custoTotalEmpresa,
        encargos_total: this.round2(inssContribuicao + irrf + fgts),
      },
      decimo_terceiro_estimado: {
        meses_trabalhados_no_ano: mesesTrabalhados,
        bruto: decimoTerceiroBruto,
        inss_estimado: inssDecimoTerceiro,
        fgts_estimado: fgtsDecimoTerceiro,
        liquido_estimado: this.round2(Math.max(0, decimoTerceiroBruto - inssDecimoTerceiro)),
      },
    };
  }

  /** Calcula quantos meses o funcionário trabalhou até o mês/ano de referência dentro do ano corrente */
  private calcularMesesTrabalhados(admissao: Date | null | undefined, mesRef: number, anoRef: number): number {
    if (!admissao) return mesRef; // sem data: assume início do ano
    const admDate = new Date(admissao);
    const admAno = admDate.getFullYear();
    const admMes = admDate.getMonth() + 1;

    if (admAno > anoRef) return 0;
    if (admAno < anoRef) return mesRef; // trabalha o ano inteiro até mesRef
    // mesmo ano: conta a partir do mês de admissão
    return Math.max(0, mesRef - admMes + 1);
  }

  // ══════════════════════════════════════════════════════════════════
  // CÁLCULO DE FÉRIAS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Calcula os períodos aquisitivos de férias e o montante a receber.
   * Considera admissao ou data_inicio como início do vínculo.
   */
  async calcularFerias(funcionarioId: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionarioId },
      select: {
        id: true,
        nome: true,
        salario_base: true,
        admissao: true,
        data_inicio: true,
        demissao: true,
        status: true,
      },
    });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado.');

    const dataInicio = funcionario.admissao ?? funcionario.data_inicio;
    if (!dataInicio) {
      return {
        funcionario: { id: funcionario.id, nome: funcionario.nome },
        aviso: 'Funcionário sem data de admissão ou data de início; cálculo indisponível.',
        periodos: [],
      };
    }

    const hoje = new Date();
    const salarioBase = this.toNum(funcionario.salario_base);
    const inicio = new Date(dataInicio);

    // Gera todos os períodos aquisitivos desde a admissão
    const periodos: Array<{
      periodo: string;
      inicio_aquisitivo: string;
      fim_aquisitivo: string;
      situacao: 'VENCIDO' | 'EM_CURSO' | 'A_VENCER';
      dias_direito: number;
      valor_ferias: number;
      adicional_tercio: number;
      total_ferias: number;
      fgts_ferias: number;
    }> = [];

    let inicioAquisitivo = new Date(inicio);
    let numPeriodo = 1;

    while (true) {
      const fimAquisitivo = new Date(inicioAquisitivo);
      fimAquisitivo.setMonth(fimAquisitivo.getMonth() + FERIAS_PERIODO_AQUISITIVO_MESES);

      if (inicioAquisitivo > hoje) break;

      const situacao: 'VENCIDO' | 'EM_CURSO' | 'A_VENCER' =
        fimAquisitivo <= hoje ? 'VENCIDO' : 'EM_CURSO';

      const diasDireito = FERIAS_DIAS_DIREITO;
      const valorFeriasDia = this.round4(salarioBase / 30);
      const valorFerias = this.round2(valorFeriasDia * diasDireito);
      const adicionalTercio = this.round2(valorFerias * FERIAS_ADICIONAL_TERCIO);
      const totalFerias = this.round2(valorFerias + adicionalTercio);
      const fgtsFerias = this.round2(valorFerias * FGTS_ALIQUOTA);

      periodos.push({
        periodo: `${numPeriodo}º Período`,
        inicio_aquisitivo: inicioAquisitivo.toISOString().slice(0, 10),
        fim_aquisitivo: fimAquisitivo.toISOString().slice(0, 10),
        situacao,
        dias_direito: diasDireito,
        valor_ferias: valorFerias,
        adicional_tercio: adicionalTercio,
        total_ferias: totalFerias,
        fgts_ferias: fgtsFerias,
      });

      if (fimAquisitivo > hoje) break;

      // Avança para o próximo período
      inicioAquisitivo = new Date(fimAquisitivo);
      numPeriodo++;

      // Limite de segurança: máximo 50 períodos
      if (numPeriodo > 50) break;
    }

    const periodosVencidos = periodos.filter((p) => p.situacao === 'VENCIDO');
    const periodoAtual = periodos.find((p) => p.situacao === 'EM_CURSO') ?? null;

    // Férias proporcionais (caso rescisão hoje ou em AVISO_PREVIO)
    const mesesPeriodoAtual = periodoAtual
      ? this.diffMeses(new Date(periodoAtual.inicio_aquisitivo), hoje)
      : 0;
    const feriasProporcionalBruto = this.round2(
      (salarioBase / 12) * mesesPeriodoAtual,
    );
    const adicionalTercioProporcional = this.round2(feriasProporcionalBruto * FERIAS_ADICIONAL_TERCIO);
    const totalFeriasProporcional = this.round2(feriasProporcionalBruto + adicionalTercioProporcional);
    const fgtsFeriasProporcional = this.round2(feriasProporcionalBruto * FGTS_ALIQUOTA);

    const totalVencidoDevido = this.round2(
      periodosVencidos.reduce((s, p) => s + p.total_ferias, 0),
    );

    return {
      funcionario: { id: funcionario.id, nome: funcionario.nome, status: funcionario.status },
      dados_base: {
        data_admissao: inicio.toISOString().slice(0, 10),
        salario_base: salarioBase,
        hoje: hoje.toISOString().slice(0, 10),
      },
      periodos,
      resumo: {
        total_periodos_vencidos: periodosVencidos.length,
        total_vencido_devido: totalVencidoDevido,
        periodo_atual: periodoAtual
          ? {
              inicio: periodoAtual.inicio_aquisitivo,
              fim: periodoAtual.fim_aquisitivo,
              meses_trabalhados: mesesPeriodoAtual,
            }
          : null,
      },
      ferias_proporcionais: {
        meses_trabalhados_periodo_atual: mesesPeriodoAtual,
        valor_proporcional: feriasProporcionalBruto,
        adicional_tercio: adicionalTercioProporcional,
        total: totalFeriasProporcional,
        fgts_sobre_ferias: fgtsFeriasProporcional,
        nota: 'Calculado como se houvesse rescisão hoje (sem justa causa).',
      },
    };
  }

  /** Diferença em meses inteiros entre duas datas (data2 >= data1) */
  private diffMeses(data1: Date, data2: Date): number {
    const anos = data2.getFullYear() - data1.getFullYear();
    const meses = data2.getMonth() - data1.getMonth();
    const total = anos * 12 + meses;
    // ajuste se não fechou o mês completo
    const dia1 = data1.getDate();
    const dia2 = data2.getDate();
    return dia2 >= dia1 ? total : Math.max(0, total - 1);
  }

  // ══════════════════════════════════════════════════════════════════
  // FLUXO DE STATUS DO FUNCIONÁRIO
  // ══════════════════════════════════════════════════════════════════

  /**
   * Valida e aplica uma transição de status ao funcionário.
   * Lança BadRequestException se a transição for inválida ou faltando motivo obrigatório.
   */
  async atualizarStatusComValidacao(id: number, dto: AtualizarStatusFuncionarioDto) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id },
      select: { id: true, nome: true, status: true, admissao: true, demissao: true },
    });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado.');

    const statusAtual = String(funcionario.status ?? '').toUpperCase();
    const novoStatus = String(dto.status ?? '').toUpperCase();

    // Verifica transição válida
    const transicoesPermitidas: string[] = FUNCIONARIO_STATUS_TRANSICOES[statusAtual] ?? [];
    if (!transicoesPermitidas.includes(novoStatus)) {
      const labelAtual = FUNCIONARIO_STATUS_LABELS[statusAtual] ?? statusAtual;
      const labelNovo = FUNCIONARIO_STATUS_LABELS[novoStatus] ?? novoStatus;
      throw new BadRequestException(
        `Transição inválida: "${labelAtual}" → "${labelNovo}". ` +
          (transicoesPermitidas.length
            ? `Permitido: ${transicoesPermitidas.map((s) => FUNCIONARIO_STATUS_LABELS[s] ?? s).join(', ')}.`
            : 'Nenhuma transição permitida a partir deste status.'),
      );
    }

    // Valida motivo obrigatório
    if (FUNCIONARIO_STATUS_MOTIVOS_OBRIGATORIOS[novoStatus] && !dto.motivo?.trim()) {
      const labelNovo = FUNCIONARIO_STATUS_LABELS[novoStatus] ?? novoStatus;
      throw new BadRequestException(
        `O campo "motivo" é obrigatório para a transição para "${labelNovo}".`,
      );
    }

    // Prepara dados adicionais por tipo de transição
    const dataRef = dto.data_referencia ? new Date(dto.data_referencia) : new Date();
    const updateData: Record<string, unknown> = { status: novoStatus };

    if (novoStatus === 'ATIVO' && !funcionario.admissao) {
      updateData.admissao = dataRef;
    }
    if (novoStatus === 'INATIVO' && !funcionario.demissao) {
      updateData.demissao = dataRef;
    }

    const atualizado = await this.prisma.funcionarios.update({
      where: { id },
      data: updateData as any,
      select: { id: true, nome: true, status: true, admissao: true, demissao: true },
    });

    return {
      ok: true,
      funcionario: atualizado,
      transicao: {
        de: statusAtual,
        de_label: FUNCIONARIO_STATUS_LABELS[statusAtual] ?? statusAtual,
        para: novoStatus,
        para_label: FUNCIONARIO_STATUS_LABELS[novoStatus] ?? novoStatus,
        motivo: dto.motivo ?? null,
        data_referencia: dataRef.toISOString().slice(0, 10),
      },
    };
  }

  /** Retorna os status disponíveis para transição a partir do status atual do funcionário */
  async listarTransicoesDisponiveis(id: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id },
      select: { id: true, nome: true, status: true },
    });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado.');

    const statusAtual = String(funcionario.status ?? '').toUpperCase();
    const transicoesPermitidas: string[] = FUNCIONARIO_STATUS_TRANSICOES[statusAtual] ?? [];

    return {
      funcionario: { id: funcionario.id, nome: funcionario.nome },
      status_atual: {
        valor: statusAtual,
        label: FUNCIONARIO_STATUS_LABELS[statusAtual] ?? statusAtual,
      },
      transicoes_disponiveis: transicoesPermitidas.map((s) => ({
        valor: s,
        label: FUNCIONARIO_STATUS_LABELS[s] ?? s,
        motivo_obrigatorio: Boolean(FUNCIONARIO_STATUS_MOTIVOS_OBRIGATORIOS[s]),
      })),
      todos_os_status: Object.entries(FUNCIONARIO_STATUS_LABELS).map(([valor, label]) => ({
        valor,
        label,
      })),
    };
  }
}
