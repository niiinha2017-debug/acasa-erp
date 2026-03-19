import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import PDFKitDoc from 'pdfkit';
import * as path from 'path';
import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import { renderHeaderA4Png } from '../pdf/render-header-a4';
import { AgendaService } from '../agenda/agenda.service';

// ─── Tipos internos para importação de projeto ───────────────────────────────

interface ItemBruto {
  nome_ambiente?: string;
  nome_peca?: string;
  nome_material: string;
  tipo_item?: 'MDF' | 'FERRAGEM';
  espessura_mm: number | null;
  largura_mm: number;
  comprimento_mm: number;
  quantidade: number;
}

interface PecaPlano {
  nome_material: string;
  espessura_mm: number | null;
  largura_mm: number;
  comprimento_mm: number;
}

interface GrupoMaterial {
  nome_original: string;
  tipo_item?: 'MDF' | 'FERRAGEM';
  espessura_mm: number | null;
  quantidade_pecas: number;
  area_m2: number;
}

interface ProdutoRow {
  id: number;
  nome_produto: string;
  cor?: string | null;
  espessura_mm: number | null;
  preco_m2: Decimal | null;
  custo_unitario_real: Decimal | null;
  valor_unitario: Decimal | null;
  categoria_base: string | null;
}

interface RegraCategoria {
  margemPct: number;
  custoRhM2: number;
}

interface CustosAba3 {
  hora_homem_value: number;
  custo_fixo_fabrica_value: number;
}

@Injectable()
export class OrcamentoTecnicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  private toNum(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private normCategoria(value?: string | null): 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA' {
    const t = String(value ?? '').trim().toUpperCase();
    if (t.includes('TERCI') || t.includes('PREMIUM') || t.includes('PREMIUN')) return 'TERCIARIA';
    if (t.includes('SECUND') || t.includes('DESIGN') || t.includes('DESIGNER') || t.includes('DESGNER')) return 'SECUNDARIA';
    return 'PRIMARIA';
  }

  private inferirCategoriaAmbiente(ambiente: {
    nome_ambiente?: string | null;
    observacoes?: string | null;
  }): 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA' {
    const source = `${String(ambiente?.nome_ambiente ?? '')} ${String(ambiente?.observacoes ?? '')}`.toUpperCase();
    if (source.includes('TERCIARIA') || source.includes('PREMIUM') || source.includes('PREMIUN')) return 'TERCIARIA';
    if (source.includes('SECUNDARIA') || source.includes('DESIGN') || source.includes('DESIGNER') || source.includes('DESGNER')) return 'SECUNDARIA';
    if (source.includes('PRIMARIA') || source.includes('ESSENCIAL')) return 'PRIMARIA';
    return 'PRIMARIA';
  }

  private async carregarRegrasMatriz(): Promise<Record<'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA', RegraCategoria>> {
    const regras: Record<'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA', RegraCategoria> = {
      PRIMARIA: { margemPct: 0, custoRhM2: 0 },
      SECUNDARIA: { margemPct: 0, custoRhM2: 0 },
      TERCIARIA: { margemPct: 0, custoRhM2: 0 },
    };

    const rows = await (this.prisma as any).operationalMatrix.findMany({
      where: { thickness: 0, group: 'AGRUPADO' },
      select: {
        category: true,
        min_cost_base: true,
        avg_cost_base: true,
        max_cost_base: true,
        mdf_extra_pct: true,
      },
      take: 30,
    });

    for (const row of rows ?? []) {
      const categoria = this.normCategoria(row?.category);
      const margem = this.toNum(row?.mdf_extra_pct);
      const min = this.toNum(row?.min_cost_base);
      const avg = this.toNum(row?.avg_cost_base);
      const max = this.toNum(row?.max_cost_base);

      if (categoria === 'PRIMARIA') regras.PRIMARIA = { margemPct: margem, custoRhM2: min || avg || max };
      if (categoria === 'SECUNDARIA') regras.SECUNDARIA = { margemPct: margem, custoRhM2: avg || min || max };
      if (categoria === 'TERCIARIA') regras.TERCIARIA = { margemPct: margem, custoRhM2: max || avg || min };
    }

    return regras;
  }

  private calcularAreaParede(parede: {
    largura_m?: Decimal | null;
    pe_direito_m?: Decimal | null;
  }): number {
    const largura = this.toNum(parede?.largura_m);
    const peDireito = this.toNum(parede?.pe_direito_m);
    if (largura > 0 && peDireito > 0) return largura * peDireito;
    return 0;
  }

  private calcularAreaAmbiente(ambiente: {
    largura_m?: Decimal | null;
    pe_direito_m?: Decimal | null;
    paredes?: Array<{ largura_m?: Decimal | null; pe_direito_m?: Decimal | null }>;
  }): number {
    const paredes = Array.isArray(ambiente?.paredes) ? ambiente.paredes : [];
    if (paredes.length) {
      const areaParedes = paredes.reduce((acc, p) => acc + this.calcularAreaParede(p), 0);
      if (areaParedes > 0) return areaParedes;
    }

    const largura = this.toNum(ambiente?.largura_m);
    const peDireito = this.toNum(ambiente?.pe_direito_m);
    if (largura > 0 && peDireito > 0) return largura * peDireito;
    return 0;
  }

  private valorItem(areaM2: number, regra: RegraCategoria): Decimal {
    const custoBase = areaM2 * this.toNum(regra?.custoRhM2);
    const valor = custoBase * (1 + this.toNum(regra?.margemPct) / 100);
    return new Decimal(Math.max(0, Math.round((valor + Number.EPSILON) * 100) / 100));
  }

  private async getCustosAba3Padrao(): Promise<CustosAba3> {
    const cacheRow: any = await (this.prisma as any).operationalMatrix.findFirst({
      where: {
        category: '_RH_CACHE_',
        thickness: -1,
        group: '_CACHE_',
      },
      select: {
        min_cost_base: true,
        avg_cost_base: true,
      },
    });

    return {
      hora_homem_value: this.toNum(cacheRow?.min_cost_base),
      custo_fixo_fabrica_value: this.toNum(cacheRow?.avg_cost_base),
    };
  }

  private calcularAreaRealMedicao(ambientes: any[]): number {
    let total = 0;
    for (const amb of ambientes ?? []) {
      const paredes = Array.isArray(amb?.paredes) ? amb.paredes : [];
      if (paredes.length > 0) {
        total += paredes.reduce((acc: number, p: any) => acc + this.calcularAreaParede(p), 0);
      } else {
        total += this.calcularAreaAmbiente(amb);
      }
    }
    return Math.round(total * 1000) / 1000;
  }

  private async getAreaRealM2ByOrcamentoTecnicoId(orcamentoTecnicoId?: number): Promise<number> {
    if (!Number(orcamentoTecnicoId) || Number(orcamentoTecnicoId) <= 0) return 0;
    const ot = await this.prisma.orcamento_tecnico.findUnique({
      where: { id: Number(orcamentoTecnicoId) },
      select: {
        agenda_loja: {
          select: {
            medicao_orcamento: {
              select: {
                ambientes: {
                  select: {
                    largura_m: true,
                    pe_direito_m: true,
                    paredes: {
                      select: {
                        largura_m: true,
                        pe_direito_m: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const ambientes = (ot as any)?.agenda_loja?.medicao_orcamento?.ambientes ?? [];
    return this.calcularAreaRealMedicao(ambientes);
  }

  /**
   * Lista orçamentos técnicos (opcional: filtrar por agenda_loja_id).
   */
  async listar(agendaLojaId?: number) {
    const where = agendaLojaId != null ? { agenda_loja_id: agendaLojaId } : {};
    return this.prisma.orcamento_tecnico.findMany({
      where,
      include: {
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            cliente_id: true,
            cliente: { select: { id: true, nome_completo: true } },
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  /**
   * Busca um orçamento técnico por id com itens.
   */
  async buscarPorId(id: number) {
    const ot = await this.prisma.orcamento_tecnico.findUnique({
      where: { id },
      include: {
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            cliente_id: true,
            cliente: { select: { id: true, nome_completo: true, telefone: true, whatsapp: true, email: true } },
            orcamento: {
              select: {
                id: true,
                itens: { select: { valor_total: true } },
              },
            },
            medicao_orcamento: {
              select: {
                id: true,
                concluida: true,
                ambientes: {
                  orderBy: { nome_ambiente: 'asc' },
                  select: {
                    id: true,
                    nome_ambiente: true,
                    observacoes: true,
                    largura_m: true,
                    pe_direito_m: true,
                    profundidade_m: true,
                    paredes: {
                      orderBy: { nome: 'asc' },
                      select: {
                        id: true,
                        nome: true,
                        largura_m: true,
                        pe_direito_m: true,
                        profundidade_m: true,
                        observacoes: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        itens: { orderBy: { id: 'asc' } },
      },
    });
    if (!ot) throw new BadRequestException('Orçamento técnico não encontrado.');

    const precoEstimadoVendedor = (ot.agenda_loja as any)?.orcamento?.itens?.reduce(
      (acc: number, item: any) => acc + this.toNum(item?.valor_total),
      0,
    ) ?? 0;
    const custoTecnicoBase = (ot.itens ?? []).reduce((acc, item) => acc + this.toNum((item as any)?.valor_total), 0);
    const ambientesMedidos = (ot.agenda_loja as any)?.medicao_orcamento?.ambientes ?? [];
    const areaRealM2 = this.calcularAreaRealMedicao(ambientesMedidos);

    return {
      ...ot,
      resumo_base: {
        preco_estimado_vendedor: Math.round(precoEstimadoVendedor * 100) / 100,
        custo_tecnico_base: Math.round(custoTecnicoBase * 100) / 100,
        area_real_m2: areaRealM2,
        total_ambientes: ambientesMedidos.length,
      },
    };
  }

  /**
   * Cria um orçamento técnico a partir dos ambientes medidos selecionados.
   * Salva em orcamento_tecnico e orcamento_tecnico_itens (tabelas independentes do orçamento antigo).
   */
  async criarDeMedicao(agendaLojaId: number, ambienteIds: number[]) {
    const agenda = await this.prisma.agenda_loja.findUnique({
      where: { id: agendaLojaId },
      select: { id: true },
    });
    if (!agenda) throw new BadRequestException('Agendamento não encontrado.');
    if (!Array.isArray(ambienteIds) || ambienteIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um ambiente para converter em orçamento técnico.');
    }

    const medicao = await this.prisma.medicao_orcamento.findUnique({
      where: { agenda_loja_id: agendaLojaId },
      include: {
        ambientes: {
          where: { id: { in: ambienteIds } },
          orderBy: { nome_ambiente: 'asc' },
          include: { paredes: { orderBy: { nome: 'asc' } } },
        },
      },
    });
    if (!medicao) throw new BadRequestException('Medição para orçamento não encontrada para este agendamento.');
    const ambientes = medicao.ambientes ?? [];
    if (ambientes.length === 0) throw new BadRequestException('Selecione ao menos um ambiente para converter em orçamento técnico.');

    const regrasMatriz = await this.carregarRegrasMatriz();
    const itensCreate: Array<{
      nome_ambiente: string;
      descricao: string;
      valor_unitario: Decimal;
      valor_total: Decimal;
      observacao: string;
    }> = [];

    for (const amb of ambientes) {
      const nomeAmbiente = amb.nome_ambiente ?? 'Ambiente';
      const categoria = this.inferirCategoriaAmbiente({
        nome_ambiente: amb.nome_ambiente,
        observacoes: amb.observacoes,
      });
      const regra = regrasMatriz[categoria];
      const paredes = amb.paredes ?? [];
      if (paredes.length === 0) {
        const areaAmbiente = this.calcularAreaAmbiente(
          {
            largura_m: amb.largura_m,
            pe_direito_m: amb.pe_direito_m,
            paredes: amb.paredes,
          },
        );
        const valorAmbiente = this.valorItem(areaAmbiente, regra);
        itensCreate.push({
          nome_ambiente: nomeAmbiente,
          descricao: nomeAmbiente,
          valor_unitario: valorAmbiente,
          valor_total: valorAmbiente,
          observacao: (amb.observacoes ?? '').slice(0, 2000),
        });
      } else {
        for (const p of paredes) {
          const partes: string[] = [p.nome ?? 'Parede'];
          if (p.largura_m != null || p.pe_direito_m != null || p.profundidade_m != null) {
            const vals = [
              p.largura_m != null ? `${Number(p.largura_m) * 1000}mm` : null,
              p.pe_direito_m != null ? `${Number(p.pe_direito_m) * 1000}mm` : null,
              p.profundidade_m != null ? `${Number(p.profundidade_m) * 1000}mm` : null,
            ].filter(Boolean);
            if (vals.length) partes.push(vals.join(' × '));
          }
          const areaParede = this.calcularAreaParede({
            largura_m: p.largura_m,
            pe_direito_m: p.pe_direito_m,
          });
          const valorParede = this.valorItem(areaParede, regra);
          itensCreate.push({
            nome_ambiente: nomeAmbiente,
            descricao: partes.join(' — ').slice(0, 500),
            valor_unitario: valorParede,
            valor_total: valorParede,
            observacao: ((p.observacoes ?? '').trim() || '').slice(0, 2000),
          });
        }
      }
    }

    const orcamentoTecnico = await this.prisma.orcamento_tecnico.create({
      data: {
        agenda_loja_id: agendaLojaId,
        itens: {
          create: itensCreate,
        },
      },
      include: { itens: true },
    });
    return orcamentoTecnico;
  }

  private toDecimal2(value: unknown): Decimal {
    const n = this.toNum(value);
    const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
    return new Decimal(Math.max(0, rounded));
  }

  private async obterOuCriarAgendaParaOrcamentoDireto(clienteId: number) {
    const agendaPendente = await this.prisma.agenda_loja.findFirst({
      where: {
        cliente_id: clienteId,
        status: { notIn: ['CONCLUIDO', 'CANCELADO'] },
      },
      orderBy: [{ inicio_em: 'asc' }, { id: 'asc' }],
      select: { id: true, cliente_id: true, titulo: true },
    });

    if (agendaPendente) {
      return { agenda: agendaPendente, agendaVinculada: true };
    }

    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);

    const agendaCriada = await this.agendaService.criarAgendaLojaAutomatica({
      cliente_id: clienteId,
      titulo: 'Orcamento Tecnico Direto',
      inicio_em: inicio,
      fim_em: fim,
      subetapa: 'ORCAMENTO',
      origem_fluxo: 'ORCAMENTO_TECNICO',
      status: 'PENDENTE',
    });

    return { agenda: agendaCriada, agendaVinculada: false };
  }

  async criarDireto(body: {
    cliente_id?: number;
    cliente_rapido?: {
      nome_completo?: string;
      telefone?: string;
      whatsapp?: string;
      email?: string;
    };
  }) {
    let clienteId = Number(body?.cliente_id || 0) || 0;

    if (!clienteId) {
      const nome = String(body?.cliente_rapido?.nome_completo || '').trim();
      if (!nome) {
        throw new BadRequestException('Selecione um cliente existente ou informe os dados do cadastro rapido.');
      }

      const novoCliente = await this.prisma.cliente.create({
        data: {
          nome_completo: nome,
          telefone: String(body?.cliente_rapido?.telefone || '').trim() || null,
          whatsapp: String(body?.cliente_rapido?.whatsapp || '').trim() || null,
          email: String(body?.cliente_rapido?.email || '').trim() || null,
          situacao: 'ATIVO',
        },
        select: { id: true, nome_completo: true },
      });
      clienteId = novoCliente.id;
    } else {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true },
      });
      if (!cliente) throw new BadRequestException('Cliente nao encontrado.');
    }

    const { agenda, agendaVinculada } = await this.obterOuCriarAgendaParaOrcamentoDireto(clienteId);

    const criado = await this.prisma.orcamento_tecnico.create({
      data: { agenda_loja_id: agenda.id },
      include: {
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            cliente_id: true,
            cliente: { select: { id: true, nome_completo: true, telefone: true, whatsapp: true, email: true } },
            orcamento: { select: { id: true } },
          },
        },
      },
    });

    return {
      ...criado,
      agenda_vinculada: agendaVinculada,
    };
  }

  async finalizarOrcamento(
    id: number,
    body: {
      ambientes?: Array<{
        id?: string;
        nome?: string;
        medidaVendedor?: { largura_m?: number; altura_m?: number; profundidade_m?: number };
        medidaTecnica?: { largura_m?: number; altura_m?: number; profundidade_m?: number };
        itens?: Array<{
          descricao?: string;
          material?: string;
          quantidade?: number;
          area_m2?: number;
          custo_unitario?: number;
          preco_unitario?: number;
          origem?: string;
        }>;
      }>;
    },
  ) {
    if (!Number(id) || id <= 0) throw new BadRequestException('ID do orcamento tecnico invalido.');

    const existente = await this.prisma.orcamento_tecnico.findUnique({
      where: { id },
      include: {
        agenda_loja: {
          select: {
            id: true,
            cliente_id: true,
            orcamento: { select: { id: true } },
          },
        },
      },
    });
    if (!existente) throw new BadRequestException('Orcamento tecnico nao encontrado.');

    const ambientes = Array.isArray(body?.ambientes) ? body.ambientes : [];

    const resultado = await this.prisma.$transaction(async (tx) => {
      const medicao = await tx.medicao_orcamento.upsert({
        where: { agenda_loja_id: existente.agenda_loja_id },
        create: {
          agenda_loja_id: existente.agenda_loja_id,
          cliente_id: existente.agenda_loja?.cliente_id ?? null,
          concluida: false,
        },
        update: {
          cliente_id: existente.agenda_loja?.cliente_id ?? null,
        },
        select: { id: true },
      });

      await tx.medicao_orcamento_ambiente.deleteMany({
        where: { medicao_orcamento_id: medicao.id },
      });

      for (const amb of ambientes) {
        const nomeAmb = String(amb?.nome || '').trim() || 'Ambiente';
        const vendedor = amb?.medidaVendedor || {};
        const tecnica = amb?.medidaTecnica || {};

        await tx.medicao_orcamento_ambiente.create({
          data: {
            medicao_orcamento_id: medicao.id,
            nome_ambiente: nomeAmb.slice(0, 191),
            largura_m: this.toNum(vendedor?.largura_m) || null,
            pe_direito_m: this.toNum(vendedor?.altura_m) || null,
            profundidade_m: this.toNum(vendedor?.profundidade_m) || null,
            medidas_json: JSON.stringify({
              medida_vendedor: vendedor,
              medida_tecnica: tecnica,
            }),
          },
        });
      }

      await tx.orcamento_tecnico_itens.deleteMany({ where: { orcamento_tecnico_id: id } });

      for (const amb of ambientes) {
        const nomeAmb = String(amb?.nome || '').trim() || 'Ambiente';
        const itens = Array.isArray(amb?.itens) ? amb.itens : [];

        for (const item of itens) {
          const quantidade = Math.max(1, this.toNum(item?.quantidade) || 1);
          const areaM2 = Math.max(0, this.toNum(item?.area_m2));
          const fator = areaM2 > 0 ? areaM2 * quantidade : quantidade;
          const precoUnit = this.toNum(item?.preco_unitario);
          const custoUnit = this.toNum(item?.custo_unitario);
          const totalVenda = Math.max(0, precoUnit * fator);

          await tx.orcamento_tecnico_itens.create({
            data: {
              orcamento_tecnico_id: id,
              nome_ambiente: nomeAmb.slice(0, 191),
              descricao: String(item?.descricao || 'Item').slice(0, 500),
              valor_unitario: this.toDecimal2(precoUnit),
              valor_total: this.toDecimal2(totalVenda),
              observacao: JSON.stringify({
                material: String(item?.material || ''),
                quantidade,
                area_m2: areaM2,
                origem: String(item?.origem || 'manual'),
                custo_unitario: custoUnit,
              }).slice(0, 2000),
            },
          });
        }
      }

      const totais = await tx.orcamento_tecnico_itens.aggregate({
        where: { orcamento_tecnico_id: id },
        _sum: { valor_total: true },
      });

      return {
        total_venda: this.toNum(totais._sum.valor_total),
      };
    });

    return {
      ok: true,
      orcamento_tecnico_id: id,
      total_venda: Math.round(resultado.total_venda * 100) / 100,
      pode_gerar_pdf_contrato: Boolean(existente.agenda_loja?.orcamento?.id),
      orcamento_id: existente.agenda_loja?.orcamento?.id ?? null,
    };
  }

  // ─── Importação de Projeto (CSV / XML do Promob ou Corte Cloud) ────────────

  private normTxt(v?: string | null): string {
    return String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private tokenize(text: string): string[] {
    return this.normTxt(text)
      .split(' ')
      .filter((w) => w.length >= 3);
  }

  private detectTipo(produto: ProdutoRow | null): string {
    if (!produto) return 'NAO_IDENTIFICADO';
    const base = String(produto.categoria_base ?? '').toUpperCase();
    if (base.includes('FERRAG')) return 'FERRAGEM';
    if (base === 'INSUMO') return 'INSUMO';
    return 'MDF';
  }

  private ehCategoriaFerragem(categoriaBase?: string | null): boolean {
    return String(categoriaBase || '').toUpperCase().includes('FERRAG');
  }

  private matchProduto(
    grupo: GrupoMaterial,
    produtos: ProdutoRow[],
  ): ProdutoRow | null {
    const alvo = this.normTxt(grupo.nome_original);
    if (!alvo) return null;

    const produtosPorTipo = (grupo.tipo_item === 'FERRAGEM')
      ? produtos.filter((p) => this.ehCategoriaFerragem(p.categoria_base))
      : produtos.filter((p) => !this.ehCategoriaFerragem(p.categoria_base));
    const basePool = produtosPorTipo.length ? produtosPorTipo : produtos;

    // se tem espessura, prioriza produtos com a mesma espessura
    const candidatos =
      grupo.espessura_mm != null
        ? basePool.filter((p) => p.espessura_mm === grupo.espessura_mm)
        : basePool;

    const pool = candidatos.length ? candidatos : produtos;

    const normalizarChavesProduto = (prod: ProdutoRow): string[] => {
      const nome = this.normTxt(prod.nome_produto);
      const cor = this.normTxt(prod.cor ?? '');
      const chaves = [
        nome,
        cor,
        this.normTxt(`${nome} ${cor}`),
        this.normTxt(`${cor} ${nome}`),
      ].filter(Boolean);

      return Array.from(new Set(chaves));
    };

    const exatoPool = pool.find((prod) => normalizarChavesProduto(prod).includes(alvo));
    if (exatoPool) return exatoPool;

    return produtos.find((prod) => normalizarChavesProduto(prod).includes(alvo)) || null;
  }

  private splitCsvLinha(linha: string, separador: string): string[] {
    const result: string[] = [];
    let current = '';
    let emAspas = false;
    for (const ch of linha) {
      if (ch === '"') {
        emAspas = !emAspas;
      } else if (ch === separador && !emAspas) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  private limparCampoCsv(value: unknown): string {
    return String(value ?? '').trim();
  }

  private extrairEspessuraDoMaterial(material: string): number | null {
    const match = String(material || '').match(/(\d+(?:[.,]\d+)?)\s*mm/i);
    if (!match?.[1]) return null;
    const valor = Number(String(match[1]).replace(',', '.'));
    return Number.isFinite(valor) && valor > 0 ? Math.round(valor) : null;
  }

  private parseDimensaoPromobFixa(raw: unknown): { largura: number; altura: number } {
    const texto = this.limparCampoCsv(raw);
    if (!texto) return { largura: 0, altura: 0 };

    const partes = texto
      .toLowerCase()
      .split('x')
      .map((parte) => this.parseNumeroProjeto(parte.trim()))
      .filter((parte) => parte > 0);

    return {
      largura: partes[0] || 0,
      altura: partes[1] || 0,
    };
  }

  private parseCsvPromobLayoutFixo(linhas: string[]): ItemBruto[] {
    const itens: ItemBruto[] = [];

    for (const linha of linhas) {
      const colunasBase = this.splitCsvLinha(linha, ';');
      const colunas = (colunasBase.length === 1 && linha.includes(';')
        ? linha.split(';')
        : colunasBase)
        .map((coluna) => this.limparCampoCsv(coluna));

      if (colunas.length < 5) continue;

      const ambiente = this.limparCampoCsv(colunas[0]);
      const peca = this.limparCampoCsv(colunas[1]);
      const material = this.limparCampoCsv(colunas[2]);
      const quantidade = Math.max(1, Math.round(this.parseNumeroProjeto(colunas[3]) || 1));
      const dimensaoRaw = this.limparCampoCsv(colunas[4]);
      const dimensaoNorm = this.normTxt(dimensaoRaw);

      const linhaEhCabecalho =
        this.normTxt(ambiente).includes('AMBIENTE') ||
        this.normTxt(peca).includes('MODULO') ||
        this.normTxt(peca).includes('PECA') ||
        this.normTxt(material).includes('MATERIAL') ||
        this.normTxt(dimensaoRaw).includes('DIMENS');

      if (linhaEhCabecalho) continue;
      if (!material || !dimensaoRaw) continue;

      if (dimensaoNorm === 'UN' || dimensaoNorm === 'UNIDADE' || dimensaoNorm === 'UNID') {
        itens.push({
          nome_ambiente: ambiente || undefined,
          nome_peca: peca || undefined,
          nome_material: material,
          tipo_item: 'FERRAGEM',
          espessura_mm: null,
          largura_mm: 0,
          comprimento_mm: 0,
          quantidade,
        });
        continue;
      }

      const dimensoes = this.parseDimensaoPromobFixa(dimensaoRaw);
      if (!(dimensoes.largura > 0 && dimensoes.altura > 0)) continue;

      itens.push({
        nome_ambiente: ambiente || undefined,
        nome_peca: peca || undefined,
        nome_material: material,
        tipo_item: 'MDF',
        espessura_mm: this.extrairEspessuraDoMaterial(material),
        largura_mm: dimensoes.largura,
        comprimento_mm: dimensoes.altura,
        quantidade,
      });
    }

    return itens;
  }

  private parseNumeroProjeto(raw: unknown): number {
    let s = String(raw ?? '')
      .replace(/\u00A0/g, ' ')
      .trim();
    if (!s) return 0;

    s = s
      .replace(/[^0-9,.-]/g, '')
      .replace(/(?!^)-/g, '');

    if (!s) return 0;

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (hasComma) {
      s = s.replace(',', '.');
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  private parseDimensoesProjeto(raw: unknown): { largura: number; comprimento: number } {
    const txt = String(raw ?? '').trim();
    if (!txt) return { largura: 0, comprimento: 0 };

    const normalizado = txt
      .replace(/\u00A0/g, ' ')
      .replace(/,/g, '.')
      .toUpperCase();

    const match = normalizado.match(/([0-9]+(?:\.[0-9]+)?)\s*[X*]\s*([0-9]+(?:\.[0-9]+)?)/);
    if (!match) return { largura: 0, comprimento: 0 };

    const largura = this.parseNumeroProjeto(match[1]);
    const comprimento = this.parseNumeroProjeto(match[2]);
    return {
      largura: largura > 0 ? largura : 0,
      comprimento: comprimento > 0 ? comprimento : 0,
    };
  }

  private expandirPecasParaPlano(itensBrutos: ItemBruto[]): PecaPlano[] {
    const pecas: PecaPlano[] = [];
    for (const item of itensBrutos) {
      const largura = Number(item?.largura_mm || 0);
      const comprimento = Number(item?.comprimento_mm || 0);
      if (!(largura > 0 && comprimento > 0)) continue;

      const qtd = Math.max(1, Math.round(Number(item?.quantidade || 1)));
      for (let i = 0; i < qtd; i++) {
        pecas.push({
          nome_material: String(item?.nome_material || 'Material'),
          espessura_mm: item?.espessura_mm ?? null,
          largura_mm: largura,
          comprimento_mm: comprimento,
        });
      }
    }
    return pecas;
  }

  private calcularPlanoCorteSimples(
    pecasEntrada: Array<{ largura_mm: number; comprimento_mm: number }>,
    larguraChapaMm: number,
    comprimentoChapaMm: number,
  ) {
    const pecas = [...pecasEntrada]
      .filter((p) => Number(p?.largura_mm) > 0 && Number(p?.comprimento_mm) > 0)
      .sort((a, b) => {
        const maxA = Math.max(a.largura_mm, a.comprimento_mm);
        const maxB = Math.max(b.largura_mm, b.comprimento_mm);
        if (maxB !== maxA) return maxB - maxA;
        return b.largura_mm * b.comprimento_mm - a.largura_mm * a.comprimento_mm;
      });

    type Shelf = { y: number; altura: number; larguraUsada: number };
    type Board = {
      index: number;
      shelves: Shelf[];
      usedHeight: number;
      placements: Array<{ x: number; y: number; largura: number; comprimento: number; rotated: boolean }>;
    };

    const boards: Board[] = [];

    const tentarEncaixarEmBoard = (board: Board, largura: number, comprimento: number) => {
      let melhorShelf: Shelf | null = null;
      let melhorWidth = 0;
      let melhorHeight = 0;
      let melhorRot = false;
      let menorSobra = Number.POSITIVE_INFINITY;

      for (const shelf of board.shelves) {
        const opcoes = [
          { w: largura, h: comprimento, rot: false },
          { w: comprimento, h: largura, rot: true },
        ];
        for (const op of opcoes) {
          if (op.h > shelf.altura) continue;
          if (shelf.larguraUsada + op.w > larguraChapaMm) continue;
          const sobra = larguraChapaMm - (shelf.larguraUsada + op.w);
          if (sobra < menorSobra) {
            menorSobra = sobra;
            melhorShelf = shelf;
            melhorWidth = op.w;
            melhorHeight = op.h;
            melhorRot = op.rot;
          }
        }
      }

      if (melhorShelf) {
        const x = melhorShelf.larguraUsada;
        const y = melhorShelf.y;
        melhorShelf.larguraUsada += melhorWidth;
        board.placements.push({
          x,
          y,
          largura: melhorWidth,
          comprimento: melhorHeight,
          rotated: melhorRot,
        });
        return true;
      }

      let melhorNova: { w: number; h: number; rot: boolean } | null = null;
      const novasOpcoes = [
        { w: largura, h: comprimento, rot: false },
        { w: comprimento, h: largura, rot: true },
      ];
      for (const op of novasOpcoes) {
        if (op.w > larguraChapaMm) continue;
        if (board.usedHeight + op.h > comprimentoChapaMm) continue;
        if (!melhorNova || op.h < melhorNova.h) melhorNova = op;
      }

      if (!melhorNova) return false;

      const novaShelf: Shelf = {
        y: board.usedHeight,
        altura: melhorNova.h,
        larguraUsada: melhorNova.w,
      };
      board.shelves.push(novaShelf);
      board.usedHeight += melhorNova.h;
      board.placements.push({
        x: 0,
        y: novaShelf.y,
        largura: melhorNova.w,
        comprimento: melhorNova.h,
        rotated: melhorNova.rot,
      });
      return true;
    };

    for (const peca of pecas) {
      let encaixou = false;
      for (const board of boards) {
        if (tentarEncaixarEmBoard(board, peca.largura_mm, peca.comprimento_mm)) {
          encaixou = true;
          break;
        }
      }
      if (!encaixou) {
        const novoBoard: Board = {
          index: boards.length,
          shelves: [],
          usedHeight: 0,
          placements: [],
        };
        const okNovo = tentarEncaixarEmBoard(novoBoard, peca.largura_mm, peca.comprimento_mm);
        if (okNovo) boards.push(novoBoard);
      }
    }

    return {
      total_chapas: boards.length,
      boards,
    };
  }

  /**
   * Parseia CSV exportado do Promob ou Corte Cloud.
   * Tenta detectar automaticamente as colunas de material, espessura,
   * largura, comprimento e quantidade.
   */
  private parseCsv(content: string): ItemBruto[] {
    const linhas = content
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (linhas.length < 2) return [];

    const itensPromobFixos = this.parseCsvPromobLayoutFixo(linhas);
    if (itensPromobFixos.length > 0) return itensPromobFixos;

    const candidatosSeparador = [';', '\t', ',', '|'];
    const headersChave = [
      'MATERIAL',
      'DESCRICAO',
      'CHAPA',
      'ESPESSURA',
      'LARGURA',
      'COMPRIMENTO',
      'ALTURA',
      'QUANTIDADE',
      'QTD',
      'QTY',
      'AREA',
      'M2',
    ];

    let linhaHeader = 0;
    let separador = ';';
    let melhorScore = -1;
    let melhorCols = 0;

    const limiteBuscaHeader = Math.min(linhas.length, 25);
    for (let i = 0; i < limiteBuscaHeader; i++) {
      for (const sep of candidatosSeparador) {
        if (sep !== ';' && linhas[i].includes(';')) continue;
        const cols = this.splitCsvLinha(linhas[i], sep);
        if (cols.length < 2) continue;
        const headersNorm = cols.map((h) => this.normTxt(h));
        const score = headersNorm.reduce((acc, h) => {
          return acc + (headersChave.some((k) => h.includes(k)) ? 1 : 0);
        }, 0);
        if (score > melhorScore || (score === melhorScore && cols.length > melhorCols)) {
          melhorScore = score;
          melhorCols = cols.length;
          linhaHeader = i;
          separador = sep;
        }
      }
    }

    const headers = this.splitCsvLinha(linhas[linhaHeader], separador).map((h) => this.normTxt(h));

    const idx = (nomes: string[]): number => {
      for (const nome of nomes) {
        const i = headers.findIndex((h) => h.includes(nome) || nome.includes(h));
        if (i >= 0) return i;
      }
      return -1;
    };

    const iMat = idx(['MATERIAL', 'MAT', 'COR', 'NOME', 'DESCRICAO', 'CHAPA', 'PRODUTO', 'ITEM', 'PECA']);
    const iEsp = idx(['ESPESSURA', 'ESP', 'THICKNESS', 'GROSSURA', 'ESPESS', 'MM']);
    const iLar = idx(['LARGURA', 'LAR', 'WIDTH', 'LARG', 'DIM X', 'X']);
    const iCom = idx(['COMPRIMENTO', 'COM', 'ALTURA', 'LENGTH', 'COMP', 'DIM Y', 'Y']);
    const iQtd = idx(['QUANTIDADE', 'QTD', 'QT', 'QUANT', 'QTY', 'QTDE', 'PECAS']);
    const iArea = idx(['AREA M2', 'AREA TOTAL', 'AREA', 'M2', 'METRAGEM']);
    const iDim = idx(['DIMENSOES', 'DIMENSAO', 'MEDIDAS', 'TAMANHO']);

    if (iMat < 0 && iArea < 0) return [];

    const itens: ItemBruto[] = [];

    for (let i = linhaHeader + 1; i < linhas.length; i++) {
      const cols = this.splitCsvLinha(linhas[i], separador);
      if (cols.every((c) => !c)) continue;

      const nomeMat = iMat >= 0 ? String(cols[iMat] ?? '') : '';
      if (!nomeMat) continue;

      const espRaw = iEsp >= 0 ? String(cols[iEsp] ?? '') : '';
      const espNum = Number(espRaw.replace(/\D/g, ''));
      const espessura = espNum > 0 ? espNum : null;

      let lar = iLar >= 0 ? this.parseNumeroProjeto(cols[iLar]) : 0;
      let com = iCom >= 0 ? this.parseNumeroProjeto(cols[iCom]) : 0;
      const qtdRaw = iQtd >= 0 ? this.parseNumeroProjeto(cols[iQtd]) : 1;
      const qtd = qtdRaw > 0 ? qtdRaw : 1;

      const dimRaw = iDim >= 0 ? String(cols[iDim] ?? '') : '';
      const dimNorm = this.normTxt(dimRaw);

      if (dimNorm === 'UN' || dimNorm === 'UNIDADE' || dimNorm === 'UNID') {
        itens.push({
          nome_material: nomeMat,
          tipo_item: 'FERRAGEM',
          espessura_mm: null,
          largura_mm: 0,
          comprimento_mm: 0,
          quantidade: qtd,
        });
        continue;
      }

      if ((lar <= 0 || com <= 0) && iDim >= 0) {
        const dim = this.parseDimensoesProjeto(cols[iDim]);
        if (lar <= 0) lar = dim.largura;
        if (com <= 0) com = dim.comprimento;
      }

      // Se tiver coluna de area diretamente, computa largura/comprimento fictícios
      if (lar === 0 && com === 0 && iArea >= 0) {
        const areaM2 = this.parseNumeroProjeto(cols[iArea]);
        if (areaM2 > 0) {
          const lado = Math.sqrt(areaM2) * 1000;
          itens.push({ nome_material: nomeMat, espessura_mm: espessura, largura_mm: lado, comprimento_mm: lado, quantidade: qtd });
        }
        continue;
      }

      if (lar > 0 && com > 0) {
        itens.push({ nome_material: nomeMat, tipo_item: 'MDF', espessura_mm: espessura, largura_mm: lar, comprimento_mm: com, quantidade: qtd });
      }
    }

    return itens;
  }

  /**
   * Parseia XML exportado do Promob (atributos de tags Peca/Item/Part).
   * Funciona com múltiplos nomes de atributos comuns.
   */
  private parseXml(content: string): ItemBruto[] {
    const itens: ItemBruto[] = [];

    // Extrai todos os atributos de uma tag como objeto chave→valor
    const extractAttrs = (tag: string): Record<string, string> => {
      const attrs: Record<string, string> = {};
      const re = /(\w+)\s*=\s*"([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(tag)) !== null) {
        attrs[m[1].toUpperCase()] = m[2];
      }
      return attrs;
    };

    const getAttr = (
      attrs: Record<string, string>,
      nomes: string[],
    ): string => {
      for (const n of nomes) {
        if (attrs[n] !== undefined) return attrs[n];
      }
      return '';
    };

    // Busca tags que representam peças
    const tagRe = /<(?:Peca|PECA|Pec|Item|ITEM|Piece|Part)\b([^/]*)\/?>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(content)) !== null) {
      const attrs = extractAttrs(m[1]);

      const nomeMat = getAttr(attrs, ['MATERIAL', 'MAT', 'COR', 'COLOR', 'NOME', 'NAME', 'DESCRICAO', 'CHAPA']);
      if (!nomeMat) continue;

      const espRaw = getAttr(attrs, ['ESPESSURA', 'ESP', 'ESPESSURA_MM', 'THICKNESS']);
      const espNum = Number(espRaw.replace(/\D/g, ''));
      const espessura = espNum > 0 ? espNum : null;

      const lar = Number(getAttr(attrs, ['LARGURA', 'LAR', 'WIDTH', 'L']).replace(',', '.')) || 0;
      const com = Number(getAttr(attrs, ['COMPRIMENTO', 'COMP', 'ALT', 'HEIGHT', 'C', 'COMPRIMENTO_MM', 'LENGTH', 'A']).replace(',', '.')) || 0;
      const qtd = Number(getAttr(attrs, ['QUANTIDADE', 'QTD', 'QTY', 'QUANT', 'Q']).replace(',', '.')) || 1;

      if (lar > 0 && com > 0) {
        itens.push({ nome_material: nomeMat, espessura_mm: espessura, largura_mm: lar, comprimento_mm: com, quantidade: qtd });
      }
    }

    return itens;
  }

  /**
   * Importa um arquivo de projeto (CSV ou XML do Promob / Corte Cloud),
   * cruza com os materiais da Aba 1 e insumos da Aba 2, e retorna
   * o custo real de material + estimativa de RH/Fábrica da Aba 3.
   */
  async importarProjeto(
    buffer: Buffer,
    filename: string,
    opts?: {
      hora_homem_value?: number;
      custo_fixo_fabrica_value?: number;
      acrescimo_pct?: number;
      orcamento_tecnico_id?: number;
    },
  ) {
    const CHAPA_LARGURA_MM = 2750;
    const CHAPA_COMPRIMENTO_MM = 1840;
    const AREA_CHAPA_M2 = (CHAPA_LARGURA_MM * CHAPA_COMPRIMENTO_MM) / 1_000_000;

    const ext = String(filename || '').split('.').pop()?.toLowerCase();
    const content = buffer.toString('utf-8');
    const isXml = ext === 'xml' || content.trimStart().startsWith('<');

    let itensBrutos: ItemBruto[];
    if (isXml) {
      itensBrutos = this.parseXml(content);
    } else {
      itensBrutos = this.parseCsv(content);
    }

    if (!itensBrutos.length) {
      throw new BadRequestException(
        'Nenhuma peça válida encontrada no arquivo. ' +
        'Certifique-se de exportar no formato CSV ou XML do Promob / Corte Cloud com as colunas de Material, Espessura, Largura, Comprimento e Quantidade.',
      );
    }

    // Agrupa por material + espessura, somando áreas
    const grupos = new Map<string, GrupoMaterial>();
    for (const item of itensBrutos) {
      const key = `${item.tipo_item ?? 'MDF'}__${this.normTxt(item.nome_material)}__${item.espessura_mm ?? 0}`;
      const g = grupos.get(key) ?? {
        nome_original: item.nome_material,
        tipo_item: item.tipo_item ?? 'MDF',
        espessura_mm: item.espessura_mm,
        quantidade_pecas: 0,
        area_m2: 0,
      };
      g.quantidade_pecas += item.quantidade;
      if (item.tipo_item !== 'FERRAGEM') {
        g.area_m2 += (item.largura_mm * item.comprimento_mm * item.quantidade) / 1_000_000;
      }
      grupos.set(key, g);
    }

    // Carrega todos os produtos ativos de uma vez (evita N+1)
    const todosProdutos = await this.prisma.produtos.findMany({
      where: { status: 'ATIVO' },
      select: {
        id: true,
        nome_produto: true,
        cor: true,
        espessura_mm: true,
        preco_m2: true,
        custo_unitario_real: true,
        valor_unitario: true,
        categoria_base: true,
      },
    }) as ProdutoRow[];

    const itens: Array<{
      nome_original: string;
      espessura_mm: number | null;
      quantidade_pecas: number;
      area_m2: number;
      produto_id: number | null;
      produto_nome: string | null;
      tipo: string;
      preco_m2: number;
      custo_total: number;
      encontrado: boolean;
    }> = [];

    let custoMaterialReal = 0;

    for (const [, g] of grupos) {
      const match = this.matchProduto(g, todosProdutos);
      const tipoDetectado = this.detectTipo(match);
      const precoBase = match
        ? Number(match.preco_m2 ?? match.custo_unitario_real ?? match.valor_unitario ?? 0)
        : 0;
      const aplicaMarkup100 = tipoDetectado === 'FERRAGEM' || tipoDetectado === 'INSUMO';
      const preco = aplicaMarkup100
        ? (precoBase > 0 ? precoBase * 2 : 0)
        : precoBase;
      const area = Math.round(g.area_m2 * 1000) / 1000;
      const custo = tipoDetectado !== 'MDF'
        ? Math.round((Math.max(1, g.quantidade_pecas) * preco) * 100) / 100
        : Math.round(area * preco * 100) / 100;
      custoMaterialReal += custo;

      itens.push({
        nome_original: g.nome_original,
        espessura_mm: g.espessura_mm,
        quantidade_pecas: Math.round(g.quantidade_pecas),
        area_m2: area,
        produto_id: match?.id ?? null,
        produto_nome: match?.nome_produto ?? null,
        tipo: tipoDetectado,
        preco_m2: Math.round(preco * 10000) / 10000,
        custo_total: custo,
        encontrado: match != null,
      });
    }

    itens.sort((a, b) => a.nome_original.localeCompare(b.nome_original));

    const pecasPlano = this.expandirPecasParaPlano(itensBrutos);
    const pecasPorGrupo = new Map<string, PecaPlano[]>();
    for (const peca of pecasPlano) {
      const key = `MDF__${this.normTxt(peca.nome_material)}__${peca.espessura_mm ?? 0}`;
      const arr = pecasPorGrupo.get(key) ?? [];
      arr.push(peca);
      pecasPorGrupo.set(key, arr);
    }

    const aproveitamentoChapas: Array<{
      material: string;
      espessura_mm: number | null;
      chapas_inteiras: number;
      area_pecas_m2: number;
      area_chapas_m2: number;
      aproveitamento_pct: number;
      desperdicio_pct: number;
      preco_custo_m2: number;
      custo_chapa_unitaria: number;
      custo_chapas_material: number;
      layouts: Array<{
        chapa_index: number;
        largura_mm: number;
        comprimento_mm: number;
        pecas: Array<{ x: number; y: number; largura: number; comprimento: number; rotated: boolean }>;
      }>;
    }> = [];

    let totalChapasInteiras = 0;
    let custoChapasTotal = 0;

    for (const item of itens) {
      const key = `${item.tipo === 'FERRAGEM' ? 'FERRAGEM' : 'MDF'}__${this.normTxt(item.nome_original)}__${item.espessura_mm ?? 0}`;
      const pecasGrupo = pecasPorGrupo.get(key) ?? [];
      if (pecasGrupo.length === 0) continue;

      const plano = this.calcularPlanoCorteSimples(
        pecasGrupo.map((p) => ({ largura_mm: p.largura_mm, comprimento_mm: p.comprimento_mm })),
        CHAPA_LARGURA_MM,
        CHAPA_COMPRIMENTO_MM,
      );

      const chapas = Math.max(1, Number(plano.total_chapas || 0));
      const areaPecasM2 = Math.round(item.area_m2 * 1000) / 1000;
      const areaChapasM2 = Math.round(chapas * AREA_CHAPA_M2 * 1000) / 1000;
      const aproveitamentoPct = areaChapasM2 > 0
        ? Math.round(((areaPecasM2 / areaChapasM2) * 100 + Number.EPSILON) * 100) / 100
        : 0;
      const desperdicioPct = Math.max(0, Math.round((100 - aproveitamentoPct + Number.EPSILON) * 100) / 100);
      const custoChapaUnitaria = Math.round((Number(item.preco_m2 || 0) * AREA_CHAPA_M2) * 100) / 100;
      const custoChapasMaterial = Math.round((chapas * custoChapaUnitaria) * 100) / 100;

      totalChapasInteiras += chapas;
      custoChapasTotal += custoChapasMaterial;

      aproveitamentoChapas.push({
        material: item.nome_original,
        espessura_mm: item.espessura_mm,
        chapas_inteiras: chapas,
        area_pecas_m2: areaPecasM2,
        area_chapas_m2: areaChapasM2,
        aproveitamento_pct: aproveitamentoPct,
        desperdicio_pct: desperdicioPct,
        preco_custo_m2: Math.round(Number(item.preco_m2 || 0) * 10000) / 10000,
        custo_chapa_unitaria: custoChapaUnitaria,
        custo_chapas_material: custoChapasMaterial,
        layouts: plano.boards.slice(0, 8).map((board) => ({
          chapa_index: board.index,
          largura_mm: CHAPA_LARGURA_MM,
          comprimento_mm: CHAPA_COMPRIMENTO_MM,
          pecas: board.placements,
        })),
      });
    }

    const custoPecasTerceiros = Math.round(
      itens
        .filter((i) => String(i.tipo || '').toUpperCase() !== 'MDF')
        .reduce((s, i) => s + Number(i.custo_total || 0), 0) * 100,
    ) / 100;

    // Estimativa de RH/Fábrica (valores vindos da Aba 3 já preenchida no frontend)
    const areaTotal = itens.reduce((s, i) => s + i.area_m2, 0);
    const custosPadraoAba3 = await this.getCustosAba3Padrao();
    const horaHomem = Number(opts?.hora_homem_value ?? custosPadraoAba3.hora_homem_value ?? 0);
    const custoFixo = Number(opts?.custo_fixo_fabrica_value ?? custosPadraoAba3.custo_fixo_fabrica_value ?? 0);
    const acrescimoPct = Number(opts?.acrescimo_pct ?? 0);

    const areaBaseRh = (await this.getAreaRealM2ByOrcamentoTecnicoId(opts?.orcamento_tecnico_id)) || areaTotal;
    const custoRhEstimado = Math.round((horaHomem + custoFixo) * areaBaseRh * 100) / 100;
    const custoTotalProducao = Math.round((custoChapasTotal + custoPecasTerceiros + custoRhEstimado) * 100) / 100;
    const acrescimoValor = Math.round(custoTotalProducao * (acrescimoPct / 100) * 100) / 100;
    const precoVendaSugerido = Math.round((custoTotalProducao + acrescimoValor) * 100) / 100;

    let medicaoResumo: {
      area_real_m2: number;
      area_arquivo_m2: number;
      diferenca_m2: number;
      diferenca_pct: number;
    } | null = null;

    if (Number(opts?.orcamento_tecnico_id) > 0) {
      const areaRealM2 = await this.getAreaRealM2ByOrcamentoTecnicoId(opts?.orcamento_tecnico_id);
      const areaArquivoM2 = Math.round(areaTotal * 1000) / 1000;
      const diferencaM2 = Math.round((areaArquivoM2 - areaRealM2) * 1000) / 1000;
      const base = areaRealM2 > 0 ? areaRealM2 : 1;
      const diferencaPct = Math.round((diferencaM2 / base) * 10000) / 100;
      medicaoResumo = {
        area_real_m2: areaRealM2,
        area_arquivo_m2: areaArquivoM2,
        diferenca_m2: diferencaM2,
        diferenca_pct: diferencaPct,
      };
    }

    return {
      formato: isXml ? 'XML' : 'CSV',
      total_pecas_brutas: itensBrutos.length,
      total_grupos: itens.length,
      area_total_m2: Math.round(areaTotal * 1000) / 1000,
      custo_material_real: Math.round(custoMaterialReal * 100) / 100,
      chapas_inteiras_total: totalChapasInteiras,
      custo_chapas_total: Math.round(custoChapasTotal * 100) / 100,
      custo_pecas_terceiros: custoPecasTerceiros,
      custo_rh_estimado: custoRhEstimado,
      custo_total_producao: custoTotalProducao,
      margem_lucro_pct: Math.round(acrescimoPct * 100) / 100,
      preco_venda_sugerido: precoVendaSugerido,
      acrescimo_valor: acrescimoValor,
      custo_total_estimado: precoVendaSugerido,
      area_base_rh_m2: Math.round(areaBaseRh * 1000) / 1000,
      custos_aba3: {
        hora_homem_value: Math.round(horaHomem * 10000) / 10000,
        custo_fixo_fabrica_value: Math.round(custoFixo * 10000) / 10000,
      },
      aproveitamento_chapas: aproveitamentoChapas,
      aproveitamento_chapas_resumo: {
        largura_chapa_mm: CHAPA_LARGURA_MM,
        comprimento_chapa_mm: CHAPA_COMPRIMENTO_MM,
        area_chapa_m2: Math.round(AREA_CHAPA_M2 * 1000) / 1000,
        total_chapas_inteiras: totalChapasInteiras,
        custo_chapas_total: Math.round(custoChapasTotal * 100) / 100,
      },
      resumo_materiais: itens.map((i) => ({
        material: i.nome_original,
        espessura_mm: i.espessura_mm,
        area_m2: i.area_m2,
        preco_custo_m2: i.preco_m2,
        custo_material: i.custo_total,
        encontrado: i.encontrado,
      })),
      medicao_real_resumo: medicaoResumo,
      nao_encontrados: itens.filter((i) => !i.encontrado).length,
      itens,
    };
  }

  // ─── Vínculo de Materiais por Categoria Comercial ─────────────────────────

  private normCat(val?: string | null): 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA' {
    const v = this.normTxt(val ?? '');
    if (v.includes('SECUND') || v.includes('DESIGN') || v.includes('DESIGNER') || v.includes('DESGNER')) return 'SECUNDARIA';
    if (v.includes('TERCI') || v.includes('PREMIUM') || v.includes('PREMIUN')) return 'TERCIARIA';
    return 'PRIMARIA';
  }

  /**
   * Recebe a lista de itens retornada por `importarProjeto`, consulta a categoria
   * comercial (PRIMARIA/SECUNDARIA/TERCIARIA) de cada produto vinculado no DB,
   * aplica a fórmula de CMV por m² (((preco * 2) / 5.06) × 1.20) por item,
   * agrupa os custos por categoria e separa os itens pendentes (sem match) para
   * reclassificação manual.
   */
  async vincularMateriais(payload: {
    itens: Array<{
      nome_original: string;
      espessura_mm?: number | null;
      area_m2: number;
      preco_m2: number;
      produto_id: number | null;
      produto_nome?: string | null;
      tipo?: string;
      custo_total: number;
      encontrado: boolean;
      categoria_manual?: string | null; // preenchida pelo usuário para pendentes
    }>;
    hora_homem_value?: number;
    custo_fixo_fabrica_value?: number;
    acrescimo_pct?: number;
    orcamento_tecnico_id?: number;
    preco_estimado_vendedor?: number;
  }) {
    const AREA_CHAPA = 5.06;
    const LOSS = 0.2;

    const itensEntrada = Array.isArray(payload?.itens) ? payload.itens : [];
    const itensNormalizados = itensEntrada
      .map((item) => ({
        nome_original: String(item?.nome_original ?? '').trim(),
        espessura_mm: item?.espessura_mm != null ? this.parseNumeroProjeto(item.espessura_mm) : null,
        area_m2: this.parseNumeroProjeto(item?.area_m2),
        preco_m2: this.parseNumeroProjeto(item?.preco_m2),
        produto_id: item?.produto_id != null ? this.parseNumeroProjeto(item.produto_id) : null,
        produto_nome: item?.produto_nome != null ? String(item.produto_nome) : null,
        tipo: item?.tipo != null ? String(item.tipo) : 'MDF',
        custo_total: this.parseNumeroProjeto(item?.custo_total),
        encontrado: Boolean(item?.encontrado),
        categoria_manual: item?.categoria_manual != null ? String(item.categoria_manual) : null,
      }))
      .filter((item) => item.nome_original.length > 0 && item.area_m2 > 0);

    if (itensNormalizados.length === 0) {
      throw new BadRequestException('Nenhum item válido para vínculo. Importe novamente o arquivo e verifique as dimensões.');
    }

    // Carrega categoria dos produtos encontrados em uma única query
    const produtoIds = itensNormalizados
      .filter((i) => i.encontrado && i.produto_id != null)
      .map((i) => Number(i.produto_id))
      .filter((id) => Number.isFinite(id) && id > 0);

    const prodMap = new Map<number, string>();
    if (produtoIds.length > 0) {
      const rows = await this.prisma.produtos.findMany({
        where: { id: { in: produtoIds } },
        select: { id: true, categoria_base: true },
      });
      for (const r of rows) prodMap.set(r.id, r.categoria_base ?? '');
    }

    const resumo = {
      PRIMARIA:   { label: 'Essencial', area_m2: 0, custo_material: 0, custo_cmv: 0, itens: 0 },
      SECUNDARIA: { label: 'Desgner',   area_m2: 0, custo_material: 0, custo_cmv: 0, itens: 0 },
      TERCIARIA:  { label: 'Premiun',   area_m2: 0, custo_material: 0, custo_cmv: 0, itens: 0 },
    };

    const itensVinculados: Array<{
      nome_original: string;
      espessura_mm: number | null;
      area_m2: number;
      preco_m2: number;
      produto_id: number | null;
      produto_nome: string | null;
      tipo: string;
      custo_total: number;
      categoria_comercial: 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA';
      cmv_m2: number;
      custo_cmv: number;
    }> = [];

    const itensPendentes: Array<{
      nome_original: string;
      espessura_mm: number | null;
      area_m2: number;
      motivo: string;
    }> = [];

    for (const item of itensNormalizados) {
      // Determina categoria: produto no DB, ou manual, ou pendente
      let categoria: 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA' | null = null;

      if (item.encontrado && item.produto_id != null && Number(item.produto_id) > 0) {
        const catDb = prodMap.get(Number(item.produto_id)) ?? '';
        categoria = this.normCat(catDb);
      } else if (item.categoria_manual) {
        categoria = this.normCat(item.categoria_manual);
      }

      if (categoria == null) {
        itensPendentes.push({
          nome_original: item.nome_original,
          espessura_mm: item.espessura_mm ?? null,
          area_m2: Math.round(item.area_m2 * 1000) / 1000,
          motivo: 'Produto não encontrado. Selecione a categoria manualmente.',
        });
        continue;
      }

      const cmvM2 = item.preco_m2 > 0
        ? ((item.preco_m2 * 2) / AREA_CHAPA) * (1 + LOSS)
        : 0;
      const custoCmv = Math.round(cmvM2 * item.area_m2 * 100) / 100;

      itensVinculados.push({
        nome_original: item.nome_original,
        espessura_mm: item.espessura_mm ?? null,
        area_m2: Math.round(item.area_m2 * 1000) / 1000,
        preco_m2: item.preco_m2,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome ?? null,
        tipo: item.tipo ?? 'MDF',
        custo_total: item.custo_total,
        categoria_comercial: categoria,
        cmv_m2: Math.round(cmvM2 * 10000) / 10000,
        custo_cmv: custoCmv,
      });

      resumo[categoria].area_m2     += item.area_m2;
      resumo[categoria].custo_material += item.custo_total;
      resumo[categoria].custo_cmv   += custoCmv;
      resumo[categoria].itens       += 1;
    }

    // Arredonda resumo
    for (const cat of Object.keys(resumo) as Array<keyof typeof resumo>) {
      resumo[cat].area_m2        = Math.round(resumo[cat].area_m2 * 1000) / 1000;
      resumo[cat].custo_material = Math.round(resumo[cat].custo_material * 100) / 100;
      resumo[cat].custo_cmv      = Math.round(resumo[cat].custo_cmv * 100) / 100;
    }

    const areaVinculada    = itensVinculados.reduce((s, i) => s + i.area_m2, 0);
    const custoCmvTotal    = itensVinculados.reduce((s, i) => s + i.custo_cmv, 0);
    const custoMaterialTotal = itensVinculados.reduce((s, i) => s + i.custo_total, 0);

    const custosPadraoAba3 = await this.getCustosAba3Padrao();
    const horaHomem  = Number(payload.hora_homem_value ?? custosPadraoAba3.hora_homem_value ?? 0);
    const custoFixo  = Number(payload.custo_fixo_fabrica_value ?? custosPadraoAba3.custo_fixo_fabrica_value ?? 0);
    const acrescimo  = Number(payload.acrescimo_pct ?? 0);

    const areaBaseRh = (await this.getAreaRealM2ByOrcamentoTecnicoId(payload.orcamento_tecnico_id)) || areaVinculada;
    const custoRhEstimado = Math.round((horaHomem + custoFixo) * areaBaseRh * 100) / 100;
    const subtotal        = Math.round((custoCmvTotal + custoRhEstimado) * 100) / 100;
    const acrescimoValor  = Math.round(subtotal * (acrescimo / 100) * 100) / 100;
    const custoTotalEstimado = Math.round((subtotal + acrescimoValor) * 100) / 100;

    let precoEstimadoVendedor = Number(payload.preco_estimado_vendedor ?? 0);
    if (precoEstimadoVendedor <= 0 && Number(payload.orcamento_tecnico_id) > 0) {
      const ot = await this.prisma.orcamento_tecnico.findUnique({
        where: { id: Number(payload.orcamento_tecnico_id) },
        select: {
          agenda_loja: {
            select: {
              orcamento: {
                select: {
                  itens: { select: { valor_total: true } },
                },
              },
            },
          },
        },
      });
      precoEstimadoVendedor = ((ot as any)?.agenda_loja?.orcamento?.itens ?? []).reduce(
        (acc: number, item: any) => acc + this.toNum(item?.valor_total),
        0,
      );
    }

    const diferencial = Math.round((precoEstimadoVendedor - custoTotalEstimado) * 100) / 100;
    const margemPct = precoEstimadoVendedor > 0
      ? Math.round(((diferencial / precoEstimadoVendedor) * 100 + Number.EPSILON) * 100) / 100
      : 0;
    const margemRisco = precoEstimadoVendedor > 0 && custoTotalEstimado > precoEstimadoVendedor;

    return {
      itens_vinculados: itensVinculados,
      itens_pendentes: itensPendentes,
      resumo_por_categoria: resumo,
      area_vinculada_m2:     Math.round(areaVinculada * 1000) / 1000,
      area_base_rh_m2:       Math.round(areaBaseRh * 1000) / 1000,
      custo_material_total:  Math.round(custoMaterialTotal * 100) / 100,
      custo_cmv_total:       Math.round(custoCmvTotal * 100) / 100,
      custo_rh_estimado:     custoRhEstimado,
      acrescimo_valor:       acrescimoValor,
      custo_total_estimado:  custoTotalEstimado,
      nao_vinculados:        itensPendentes.length,
      comparativo_orcamento: {
        preco_estimado_vendedor: Math.round(precoEstimadoVendedor * 100) / 100,
        custo_tecnico_fabrica: custoTotalEstimado,
        diferencial_valor: diferencial,
        margem_pct: margemPct,
        margem_em_risco: margemRisco,
      },
    };
  }

  // ─── PDF de Proposta Técnica (apenas dados públicos — sem custos internos) ──
  async gerarPdfPropostaCliente(
    otId: number,
    opts: {
      preco_venda: number;
      validade: string;
      valor_entrada: number;
      quantidade_parcelas: number;
      observacoes_pagamento?: string;
      prazo_entrega_dias_uteis: number;
    },
  ): Promise<{ arquivoId: number }> {
    const ot = await this.prisma.orcamento_tecnico.findUnique({
      where: { id: otId },
      select: {
        id: true,
        agenda_loja: {
          select: {
            titulo: true,
            cliente: {
              select: {
                nome_completo: true,
                razao_social: true,
                whatsapp: true,
                telefone: true,
                email: true,
                endereco: true,
                numero: true,
                bairro: true,
                cidade: true,
                estado: true,
                cep: true,
              },
            },
            medicao_orcamento: {
              select: {
                ambientes: {
                  orderBy: { nome_ambiente: 'asc' },
                  select: {
                    id: true,
                    nome_ambiente: true,
                    largura_m: true,
                    pe_direito_m: true,
                    paredes: {
                      select: { nome: true, largura_m: true, pe_direito_m: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ot) throw new BadRequestException('Orçamento técnico não encontrado.');

    const cliente = (ot as any).agenda_loja?.cliente ?? {};
    const ambientes: any[] = (ot as any).agenda_loja?.medicao_orcamento?.ambientes ?? [];

    const ambientesComArea = ambientes.map((amb) => {
      const paredes = Array.isArray(amb.paredes) ? amb.paredes : [];
      const area =
        paredes.length > 0
          ? paredes.reduce((acc: number, p: any) => acc + this.calcularAreaParede(p), 0)
          : this.calcularAreaAmbiente(amb);
      return { nome: String(amb.nome_ambiente || '-'), area_m2: Math.round(area * 1000) / 1000 };
    });

    const totalAreaM2 =
      Math.round(ambientesComArea.reduce((acc, a) => acc + a.area_m2, 0) * 1000) / 1000;

    const precoVenda = Math.max(0, this.toNum(opts.preco_venda));
    const valorEntrada = Math.max(0, this.toNum(opts.valor_entrada));
    const qtdParcelas = Math.max(1, Math.round(this.toNum(opts.quantidade_parcelas)));
    const prazoEntrega = Math.max(0, Math.round(this.toNum(opts.prazo_entrega_dias_uteis)));
    const validade = String(opts.validade || '').trim() || '-';
    const observacoes = String(opts.observacoes_pagamento || '').trim();
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const nomeCliente = String(cliente.nome_completo || cliente.razao_social || '-').toUpperCase();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFKitDoc({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const LEFT = 40;
        const RIGHT = doc.page.width - 40;
        const TW = RIGHT - LEFT;

        const headerBottom = renderHeaderA4Png(doc);
        let y = headerBottom + 12;

        doc.font('Helvetica-Bold').fontSize(18).fillColor('#1e293b')
          .text('PROPOSTA TECNICA', LEFT, y, { width: TW, align: 'center' });
        y += 26;

        doc.font('Helvetica').fontSize(8).fillColor('#64748b')
          .text(
            `Emitido em: ${dataEmissao}   ·   Ref. Orçamento Técnico #${otId}`,
            LEFT, y, { width: TW, align: 'center' },
          );
        y += 18;

        doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(LEFT, y).lineTo(RIGHT, y).stroke();
        y += 14;

        const tel = String(cliente.whatsapp || cliente.telefone || cliente.email || '-');
        const endPartes = [
          cliente.endereco,
          cliente.numero ? `No ${String(cliente.numero)}` : null,
          cliente.bairro ? `Bairro: ${String(cliente.bairro)}` : null,
          cliente.cidade
            ? `${String(cliente.cidade)}${cliente.estado ? ' - ' + String(cliente.estado) : ''}`
            : null,
          cliente.cep ? `CEP: ${String(cliente.cep)}` : null,
        ].filter((s): s is string => Boolean(s));
        const endereco = endPartes.join(' - ') || '-';

        const drawInfoRow = (label: string, value: string) => {
          const lw = 80;
          doc.font('Helvetica').fontSize(9);
          const textH = doc.heightOfString(value, { width: TW - lw });
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151')
            .text(label, LEFT, y, { width: lw });
          doc.font('Helvetica').fontSize(9).fillColor('#111827')
            .text(value, LEFT + lw, y, { width: TW - lw });
          y += Math.max(14, textH + 3);
        };

        drawInfoRow('CLIENTE:', nomeCliente);
        drawInfoRow('CONTATO:', tel);
        drawInfoRow('ENDERECO:', endereco);
        y += 12;

        doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(LEFT, y).lineTo(RIGHT, y).stroke();
        y += 14;

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b')
          .text('AMBIENTES MEDIDOS', LEFT, y, { width: TW });
        y += 14;

        const colAreaW = 90;
        const colNomeW = TW - colAreaW;

        doc.rect(LEFT, y, TW, 20).fill('#f1f5f9');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155')
          .text('AMBIENTE', LEFT + 6, y + 5, { width: colNomeW });
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155')
          .text('AREA (m2)', LEFT + colNomeW, y + 5, { width: colAreaW - 4, align: 'right' });
        y += 22;

        for (let i = 0; i < ambientesComArea.length; i++) {
          if (y + 22 > doc.page.height - 80) { doc.addPage(); y = 60; }
          const amb = ambientesComArea[i];
          if (i % 2 === 0) doc.rect(LEFT, y, TW, 18).fill('#f8fafc');
          doc.font('Helvetica').fontSize(9).fillColor('#0f172a')
            .text(amb.nome, LEFT + 6, y + 4, { width: colNomeW });
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a')
            .text(amb.area_m2.toFixed(3), LEFT + colNomeW, y + 4, { width: colAreaW - 4, align: 'right' });
          doc.lineWidth(0.3).strokeColor('#e2e8f0')
            .moveTo(LEFT, y + 18).lineTo(RIGHT, y + 18).stroke();
          y += 20;
        }

        doc.rect(LEFT, y, TW, 24).fill('#1e293b');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
          .text('METRAGEM TOTAL', LEFT + 6, y + 6, { width: colNomeW });
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
          .text(`${totalAreaM2.toFixed(3)} m2`, LEFT + colNomeW, y + 6, { width: colAreaW - 4, align: 'right' });
        y += 28;

        doc.font('Helvetica').fontSize(8).fillColor('#059669')
          .text('Projeto validado com as medidas reais da obra', LEFT, y, { width: TW });
        y += 20;

        if (y + 140 > doc.page.height - 40) { doc.addPage(); y = 60; }
        doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(LEFT, y).lineTo(RIGHT, y).stroke();
        y += 14;

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b')
          .text('RESUMO FINANCEIRO', LEFT, y, { width: TW });
        y += 14;

        doc.rect(LEFT, y, TW, 30).fill('#1e293b');
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
          .text('VALOR TOTAL DA PROPOSTA', LEFT + 8, y + 8, { width: TW - 200 });
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#10b981')
          .text(brl(precoVenda), RIGHT - 190, y + 8, { width: 186, align: 'right' });
        y += 36;

        const drawDetailRow = (label: string, value: string) => {
          doc.lineWidth(0.3).strokeColor('#e2e8f0')
            .moveTo(LEFT + 4, y).lineTo(RIGHT - 4, y).stroke();
          doc.font('Helvetica').fontSize(10).fillColor('#374151')
            .text(label, LEFT + 8, y + 5, { width: TW - 200 });
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827')
            .text(value, RIGHT - 190, y + 5, { width: 186, align: 'right' });
          y += 24;
        };

        const restoParcelar = Math.max(0, precoVenda - valorEntrada);
        const valorParcela = qtdParcelas > 0 ? restoParcelar / qtdParcelas : 0;

        drawDetailRow('Entrada (ato da assinatura)', brl(valorEntrada));
        if (qtdParcelas > 1) {
          drawDetailRow(
            `Saldo em parcelas (${qtdParcelas}x)`,
            `${qtdParcelas}x de ${brl(valorParcela)}`,
          );
        } else {
          drawDetailRow('Parcelas', `${qtdParcelas}x`);
        }
        drawDetailRow('Validade da proposta', validade);
        drawDetailRow('Prazo de entrega estimado', `${prazoEntrega} dias uteis`);

        if (observacoes) {
          y += 6;
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151')
            .text('Observacoes:', LEFT + 8, y, { width: TW - 16 });
          y += 14;
          doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
            .text(observacoes, LEFT + 8, y, { width: TW - 16 });
          y += doc.heightOfString(observacoes, { width: TW - 16 }) + 12;
        }

        if (y + 100 > doc.page.height - 40) { doc.addPage(); y = 60; }
        y += 36;

        doc.lineWidth(0.8).strokeColor('#94a3b8').moveTo(LEFT, y).lineTo(LEFT + 230, y).stroke();
        doc.font('Helvetica').fontSize(8).fillColor('#374151')
          .text(nomeCliente, LEFT, y + 6, { width: 230 });
        doc.font('Helvetica').fontSize(7).fillColor('#64748b')
          .text('Assinatura do Cliente', LEFT, y + 17, { width: 230 });

        doc.lineWidth(0.8).strokeColor('#94a3b8').moveTo(RIGHT - 190, y).lineTo(RIGHT, y).stroke();
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
          .text('Data: _____ / _____ / _____', RIGHT - 190, y + 6, { width: 190 });
        doc.font('Helvetica').fontSize(7).fillColor('#64748b')
          .text('Data de aceite', RIGHT - 190, y + 17, { width: 190 });

        doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
          .text(
            `Documento emitido em ${dataEmissao}   ·   Orçamento Técnico #${otId}`,
            LEFT, doc.page.height - 28, { width: TW, align: 'center' },
          );

        doc.end();
      } catch (e) {
        reject(e);
      }
    });

    const dir = path.join(process.cwd(), 'uploads', 'relatorios');
    await fs.mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = randomBytes(6).toString('hex');
    const filename = `proposta_tecnica_${otId}_${stamp}_${rand}.pdf`;
    await fs.writeFile(path.join(dir, filename), pdfBuffer);
    const url = `/uploads/relatorios/${filename}`;
    const arquivo = await this.prisma.arquivos.create({
      data: {
        owner_type: 'ORCAMENTO_TECNICO',
        owner_id: otId,
        categoria: 'RELATORIO',
        slot_key: null,
        url,
        filename,
        nome: `PROPOSTA TECNICA #${otId}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      },
      select: { id: true },
    });
    return { arquivoId: arquivo.id };
  }
}
