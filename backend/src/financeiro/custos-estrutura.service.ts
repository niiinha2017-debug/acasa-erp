import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCustosEstruturaDto } from './dto/upsert-custos-estrutura.dto';
import { HORAS_UTEIS_MES_PADRAO, CUSTOS_ESTRUTURA_CONSTANTES } from '../shared/constantes/custos-estrutura';
import { CATEGORIAS_DESPESA_FIXA_SALARIOS as CATEGORIAS_SALARIO_SHARED } from '../../shared/constantes/funcionarios-custos';
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

/** Categorias de despesa consideradas "Despesa Fixa de Salários" (para Taxa de Absorção). */
export const CATEGORIAS_DESPESA_FIXA_SALARIOS = [...CATEGORIAS_SALARIO_SHARED] as const;

/**
 * Categorias de despesa (módulo Despesas) que entram em Custos de Estrutura.
 * Ocupação: Aluguel, IPTU, Seguros. Operacional: Energia, Água, Internet, Folha. Manutenção: reparos, depreciação.
 */
export const CATEGORIAS_CUSTO_ESTRUTURA = {
  OCUPACAO: ['ALUGUEL', 'IPTU', 'SEGUROS', 'SEGURANCA'],
  OPERACIONAL: ['ENERGIA', 'AGUA', 'INTERNET', 'LIMPEZA', 'FOLHA'],
  MANUTENCAO: ['MANUTENCAO', 'DEPRECIACAO_MAQUINAS', 'SEGURO_MAQUINAS', 'MANUTENCAO_PREDIAL'],
} as const;

function normalizarCategoria(cat: string | null): string {
  return (cat ?? '').toUpperCase().trim();
}

@Injectable()
export class CustosEstruturaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Horas úteis da fábrica no mês: parâmetro lançado no cadastro da Empresa (Configurações).
   * Se os funcionários trabalham 220h/mês, a fábrica deve usar 220 como base de cálculo da Taxa de Máquina.
   * Se não estiver preenchido, usa a constante 176.
   */
  async getHorasUteisFromParametro(): Promise<number> {
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: 1 },
        select: { horas_uteis_mes_fabrica: true } as any,
      });
      const h = toNum((empresa as any)?.horas_uteis_mes_fabrica);
      return h > 0 ? h : HORAS_UTEIS_MES_PADRAO;
    } catch {
      return HORAS_UTEIS_MES_PADRAO;
    }
  }

  /** Parâmetros para a tela: horas úteis vêm do cadastro da Empresa (base de cálculo); fallback 176. */
  async getConstantes() {
    const horas = await this.getHorasUteisFromParametro();
    return {
      horas_uteis_mes_padrao: horas,
      origem_custo_fabrica: CUSTOS_ESTRUTURA_CONSTANTES.origem_custo_fabrica,
    };
  }

  /** Retorna horas úteis do mês: do registro salvo (se existir) ou do parâmetro Empresa (horas_uteis_mes_fabrica) ou constante. */
  async getHorasUteisMes(mes: number, ano: number): Promise<number> {
    const row = await this.prisma.custos_estrutura_mensal.findFirst({
      where: { mes, ano },
      select: { horas_uteis_mes: true },
    });
    const saved = row ? toNum((row as any).horas_uteis_mes) : 0;
    if (saved > 0) return saved;
    return this.getHorasUteisFromParametro();
  }

  /**
   * Taxa de Absorção = Total Despesas Fixas de Salários (competência) / Horas úteis do mês.
   * Usada na DRE por ambiente: (tempo Totem) × taxa = quanto da despesa fixa de salários foi consumida pelo projeto.
   */
  async getTaxaAbsorcaoSalarios(mes: number, ano: number): Promise<number> {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const categoriasSalario = [...CATEGORIAS_DESPESA_FIXA_SALARIOS];
    const despesasSalarios = await this.prisma.despesas.findMany({
      where: {
        data_registro: { gte: inicioMes, lte: fimMes },
        categoria: { in: categoriasSalario },
      },
      select: { valor_total: true },
    });
    const totalSalarios = despesasSalarios.reduce((s, d) => s + toNum((d as any).valor_total), 0);
    const horasUteis = await this.getHorasUteisMes(mes, ano);
    if (horasUteis <= 0) return 0;
    return round4(totalSalarios / horasUteis);
  }

  /**
   * Total das Despesas Fixas de Salários no mês (competência por data_registro).
   * Para exibição na DRE Geral.
   */
  async getTotalDespesasFixasSalarios(mes: number, ano: number): Promise<number> {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const categoriasSalario = [...CATEGORIAS_DESPESA_FIXA_SALARIOS];
    const despesasSalarios = await this.prisma.despesas.findMany({
      where: {
        data_registro: { gte: inicioMes, lte: fimMes },
        categoria: { in: categoriasSalario },
      },
      select: { valor_total: true },
    });
    return round2(despesasSalarios.reduce((s, d) => s + toNum((d as any).valor_total), 0));
  }

  /** Busca registro por mês/ano. */
  async getByMesAno(mes: number, ano: number) {
    const row = await this.prisma.custos_estrutura_mensal.findFirst({
      where: { mes, ano },
    });
    if (!row) return null;
    return {
      id: (row as any).id,
      mes: (row as any).mes,
      ano: (row as any).ano,
      custo_ocupacao: toNum((row as any).custo_ocupacao),
      custo_operacional: toNum((row as any).custo_operacional),
      custo_manutencao_depreciacao: toNum((row as any).custo_manutencao_depreciacao),
      horas_uteis_mes: toNum((row as any).horas_uteis_mes),
      custo_hora_estrutura: toNum((row as any).custo_hora_estrutura),
      criado_em: (row as any).criado_em,
      atualizado_em: (row as any).atualizado_em,
    };
  }

  /**
   * Despesas fixas do mês: tabela Despesas, somente SAÍDA, categorias Ocupação + Operacional + Manutenção.
   * Competência por data_vencimento. Usado para os cards de Custos de Estrutura (automação total).
   */
  async getTotaisFromDespesas(mes: number, ano: number): Promise<{
    custo_ocupacao: number;
    custo_operacional: number;
    custo_manutencao_depreciacao: number;
    total_custos: number;
  }> {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const despesas = await this.prisma.despesas.findMany({
      where: {
        tipo_movimento: 'SAIDA',
        data_vencimento: { gte: inicioMes, lte: fimMes },
      },
      select: { categoria: true, valor_total: true },
    });
    let custo_ocupacao = 0;
    let custo_operacional = 0;
    let custo_manutencao_depreciacao = 0;
    const setOcup = new Set<string>(CATEGORIAS_CUSTO_ESTRUTURA.OCUPACAO);
    const setOper = new Set<string>(CATEGORIAS_CUSTO_ESTRUTURA.OPERACIONAL);
    const setManut = new Set<string>(CATEGORIAS_CUSTO_ESTRUTURA.MANUTENCAO);
    for (const d of despesas) {
      const cat = normalizarCategoria(d.categoria);
      const valor = toNum((d as any).valor_total);
      if (setOcup.has(cat)) custo_ocupacao += valor;
      else if (setOper.has(cat)) custo_operacional += valor;
      else if (setManut.has(cat)) custo_manutencao_depreciacao += valor;
    }
    return {
      custo_ocupacao: round2(custo_ocupacao),
      custo_operacional: round2(custo_operacional),
      custo_manutencao_depreciacao: round2(custo_manutencao_depreciacao),
      total_custos: round2(custo_ocupacao + custo_operacional + custo_manutencao_depreciacao),
    };
  }

  /** Retorna custo_hora_estrutura para um mês/ano (para DRE). Se não houver registro salvo, calcula a partir das despesas + constante de horas. */
  async getCustoHoraEstrutura(mes: number, ano: number): Promise<number> {
    const row = await this.prisma.custos_estrutura_mensal.findFirst({
      where: { mes, ano },
      select: { custo_hora_estrutura: true },
    });
    if (row && toNum((row as any).custo_hora_estrutura) > 0) {
      return toNum((row as any).custo_hora_estrutura);
    }
    const totais = await this.getTotaisFromDespesas(mes, ano);
    const horas = await this.getHorasUteisMes(mes, ano);
    if (horas <= 0) return 0;
    return round4(totais.total_custos / horas);
  }

  /** Dados para gráfico de evolução: últimos N meses (total custos e custo/hora). */
  async getGraficoEvolucao(ultimosMeses: number = 12): Promise<{
    labels: string[];
    total_custos_estrutura: number[];
    custo_hora_estrutura: number[];
  }> {
    const hoje = new Date();
    const labels: string[] = [];
    const total_custos_estrutura: number[] = [];
    const custo_hora_estrutura: number[] = [];
    for (let i = ultimosMeses - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = d.getMonth() + 1;
      const ano = d.getFullYear();
      const resumo = await this.getResumo(mes, ano);
      labels.push(`${String(mes).padStart(2, '0')}/${ano}`);
      total_custos_estrutura.push(resumo.total_custos_estrutura);
      custo_hora_estrutura.push(resumo.custo_hora_estrutura);
    }
    return { labels, total_custos_estrutura, custo_hora_estrutura };
  }

  /**
   * Total de compras (almoxarifado / matéria-prima) do mês: tabela Compras, data_compra no mês.
   * Retorna 0 se não houver compras ou em caso de erro — não quebra o resumo.
   */
  async getTotalComprasMes(mes: number, ano: number): Promise<number> {
    try {
      const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);
      const compras = await this.prisma.compras.findMany({
        where: {
          data_compra: { gte: inicioMes, lte: fimMes },
        },
        select: { valor_total: true },
      });
      const total = compras.reduce((s, c) => s + toNum((c as any).valor_total), 0);
      return round2(total);
    } catch (err) {
      console.warn('[CustosEstrutura] getTotalComprasMes falhou (retornando 0):', (err as Error)?.message ?? err);
      return 0;
    }
  }

  /** Resumo anual agregado: soma dos 12 meses do ano (somente automático, sem preenchimento manual). */
  async getResumoAnual(ano: number) {
    let custoOcupacao = 0;
    let custoOperacional = 0;
    let custoManutencao = 0;
    let totalCustos = 0;
    let totalCompras = 0;
    let horasUteisTotal = 0;
    for (let m = 1; m <= 12; m++) {
      const r = await this.getResumo(m, ano);
      custoOcupacao += r.custo_ocupacao;
      custoOperacional += r.custo_operacional;
      custoManutencao += r.custo_manutencao_depreciacao;
      totalCustos += r.total_custos_estrutura;
      totalCompras += r.total_compras_mes;
      horasUteisTotal += r.horas_uteis_mes;
    }
    const projecaoTotal = round2(totalCustos + totalCompras);
    const custoHoraEstrutura = horasUteisTotal > 0 ? round4(totalCustos / horasUteisTotal) : 0;
    return {
      mes: null,
      ano,
      custo_ocupacao: round2(custoOcupacao),
      custo_operacional: round2(custoOperacional),
      custo_manutencao_depreciacao: round2(custoManutencao),
      total_custos_estrutura: round2(totalCustos),
      horas_uteis_mes: horasUteisTotal,
      custo_hora_estrutura: custoHoraEstrutura,
      total_compras_mes: round2(totalCompras),
      custo_fabrica: round2(totalCustos),
      custo_hora: custoHoraEstrutura,
      projecao_total: projecaoTotal,
      origem_custo_fabrica: 'despesas' as const,
      periodo: 'ano' as const,
    };
  }

  /**
   * Resumo automático (automação total, sem preenchimento manual).
   * 1) Despesas fixas: tabela Despesas, SAÍDA, categorias Ocupação + Operacional + Manutenção do mês.
   * 2) Compras: tabela Compras (matéria-prima/almoxarifado), total do mês; retorna 0 se não houver.
   * 3) Taxa de máquina: Custo Hora = total despesas ÷ horas úteis (parâmetro Empresa, ex.: 220h; fallback 176).
   * Sem erros: se despesas ou compras falharem, retorna 0 no campo afetado sem zerar o resto da resposta.
   */
  async getResumo(mes?: number, ano?: number) {
    const hoje = new Date();
    const m = mes ?? hoje.getMonth() + 1;
    const a = ano ?? hoje.getFullYear();

    let fromDespesas: { custo_ocupacao: number; custo_operacional: number; custo_manutencao_depreciacao: number; total_custos: number };
    try {
      fromDespesas = await this.getTotaisFromDespesas(m, a);
    } catch (err) {
      console.warn('[CustosEstrutura] getTotaisFromDespesas falhou (usando zeros):', (err as Error)?.message ?? err);
      fromDespesas = {
        custo_ocupacao: 0,
        custo_operacional: 0,
        custo_manutencao_depreciacao: 0,
        total_custos: 0,
      };
    }

    let totalComprasMes = 0;
    try {
      totalComprasMes = await this.getTotalComprasMes(m, a);
    } catch (err) {
      console.warn('[CustosEstrutura] getTotalComprasMes em getResumo falhou (usando 0):', (err as Error)?.message ?? err);
    }

    const total = round2(
      fromDespesas.custo_ocupacao + fromDespesas.custo_operacional + fromDespesas.custo_manutencao_depreciacao,
    );
    const horasUteis = await this.getHorasUteisFromParametro();
    const custoHoraEstrutura = horasUteis > 0 ? round4(total / horasUteis) : 0;
    const projecaoTotal = round2(total + totalComprasMes);

    console.log(
      `[CustosEstrutura] Resumo ${String(m).padStart(2, '0')}/${a}: Despesas fixas = R$ ${total.toFixed(2)} | Compras (mês) = R$ ${totalComprasMes.toFixed(2)} | Projeção total = R$ ${projecaoTotal.toFixed(2)} | Taxa = R$ ${custoHoraEstrutura.toFixed(4)}/h (${horasUteis}h)`,
    );
    return {
      mes: m,
      ano: a,
      custo_ocupacao: fromDespesas.custo_ocupacao,
      custo_operacional: fromDespesas.custo_operacional,
      custo_manutencao_depreciacao: fromDespesas.custo_manutencao_depreciacao,
      total_custos_estrutura: total,
      horas_uteis_mes: horasUteis,
      custo_hora_estrutura: custoHoraEstrutura,
      total_compras_mes: totalComprasMes,
      from_despesas: fromDespesas,
      custo_fabrica: total,
      custo_hora: custoHoraEstrutura,
      projecao_total: projecaoTotal,
      origem_custo_fabrica: 'despesas' as const,
      periodo: 'mes' as const,
    };
  }

  /** Cria ou atualiza registro do mês/ano e recalcula custo_hora_estrutura. */
  async upsert(dto: UpsertCustosEstruturaDto) {
    const ocup = toNum(dto.custo_ocupacao);
    const oper = toNum(dto.custo_operacional);
    const manut = toNum(dto.custo_manutencao_depreciacao);
    const horas = toNum(dto.horas_uteis_mes);
    if (horas <= 0) {
      throw new Error('horas_uteis_mes deve ser maior que zero');
    }
    const total = ocup + oper + manut;
    const custoHora = round4(total / horas);
    const now = new Date();
    const existing = await this.prisma.custos_estrutura_mensal.findFirst({
      where: { mes: dto.mes, ano: dto.ano },
    });
    const data = {
      custo_ocupacao: ocup,
      custo_operacional: oper,
      custo_manutencao_depreciacao: manut,
      horas_uteis_mes: horas,
      custo_hora_estrutura: custoHora,
      atualizado_em: now,
    };
    const created = existing
      ? await this.prisma.custos_estrutura_mensal.update({
          where: { id: (existing as any).id },
          data,
        })
      : await this.prisma.custos_estrutura_mensal.create({
          data: {
            mes: dto.mes,
            ano: dto.ano,
            ...data,
          },
        });
    return {
      id: (created as any).id,
      mes: (created as any).mes,
      ano: (created as any).ano,
      custo_ocupacao: ocup,
      custo_operacional: oper,
      custo_manutencao_depreciacao: manut,
      horas_uteis_mes: horas,
      custo_hora_estrutura: custoHora,
    };
  }
}
