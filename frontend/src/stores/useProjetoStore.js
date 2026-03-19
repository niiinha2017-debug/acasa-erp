/**
 * useProjetoStore — Store Pinia central do Orçamento Técnico (Acasa Móveis).
 *
 * Responsabilidades:
 *  - Manter o array de ambientes com medidaVendedor, medidaTecnica e itens.
 *  - Importar arquivo Promob/CSV/XML via backend e distribuir itens por ambiente.
 *  - Permitir adição manual de produtos por ambiente.
 *  - Expor getters reativos (totalProjeto, subtotalPorAmbiente etc.) que atualizam
 *    o Header instantaneamente sem nenhum refresh.
 *
 * Compatível com Vue 3 + Pinia ≥ 2 → funciona no Tauri (desktop) e no Capacitor (Android/iOS).
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { EstrategiaPrecosService, OrcamentoTecnicoService } from '@/services'
import { notify } from '@/services/notify'

// ─── Helpers internos ────────────────────────────────────────────────────────

function gerarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * @typedef {{ largura_m: number, altura_m: number, profundidade_m: number }} Medida
 *
 * @typedef {{
 *   id: string
 *   descricao: string
 *   material: string
 *   quantidade: number
 *   area_m2: number
 *   custo_unitario: number
 *   preco_unitario: number
 *   origem: 'promob' | 'manual'
 * }} ItemAmbiente
 *
 * @typedef {{
 *   id: string
 *   nome: string
 *   medidaVendedor: Medida
 *   medidaTecnica: Medida
 *   tipoModulo: 'Balcão' | 'Aéreo' | 'Torre' | 'Painel' | ''
 *   corSelecionada: { id: number, nome_cor: string, valor_m2: number, categoria: string } | null
 *   itens: ItemAmbiente[]
 * }} Ambiente
 */

/** Fatores de consumo de chapa por tipo de módulo */
const FATORES_CONSUMO_MODULO = {
  'Balcão': 3.5,
  'Aéreo': 3.0,
  'Torre': 4.0,
  'Painel': 1.2,
}

const TIPOS_MODULO = Object.keys(FATORES_CONSUMO_MODULO)
const CHAPA_AREA_PADRAO_M2 = 5.06
const MARKUP_VENDA_MDF = 2

/** @returns {Medida} */
function medidaVazia() {
  return { largura_m: 0, altura_m: 0, profundidade_m: 0 }
}

/** @param {string} nome @returns {Ambiente} */
function criarAmbienteVazio(nome = 'Novo ambiente') {
  return {
    id: gerarId(),
    nome,
    medidaVendedor: medidaVazia(),
    medidaTecnica: medidaVazia(),
    tipoModulo: '',
    corSelecionada: null,
    itens: [],
  }
}

/**
 * Converte um item bruto retornado pelo backend Promob em ItemAmbiente.
 * @param {Record<string, unknown>} raw
 * @returns {ItemAmbiente}
 */
function itemDeImport(raw) {
  return {
    id: gerarId(),
    descricao: String(raw.descricao || raw.nome_peca || raw.material || 'Item Promob'),
    material: String(raw.material || ''),
    quantidade: Number(raw.quantidade ?? 1),
    area_m2: Number(raw.area_m2 ?? 0),
    // Backend pode retornar custo por m² ou custo total; preferimos custo unitário/Total
    custo_unitario: Number(raw.custo_unitario ?? raw.custo_material ?? 0),
    preco_unitario: Number(raw.preco_unitario ?? raw.preco_venda_sugerido ?? 0),
    origem: 'promob',
  }
}

// ─── Cálculo de valor de um item ─────────────────────────────────────────────

/**
 * Retorna o valor total de um item levando em conta se é area_m2 ou quantidade.
 * @param {ItemAmbiente} item
 * @param {'custo' | 'preco'} campo
 */
function valorItem(item, campo) {
  const unitario = Number(campo === 'custo' ? item.custo_unitario : item.preco_unitario) || 0
  if (item.area_m2 > 0) {
    return unitario * Number(item.area_m2) * Number(item.quantidade || 1)
  }
  return unitario * Number(item.quantidade || 1)
}

function round2(v) {
  return Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100
}

function round3(v) {
  return Math.round((Number(v || 0) + Number.EPSILON) * 1000) / 1000
}

function calcularAreaRealDoAmbiente(ambiente) {
  const larguraMm = Number(ambiente?.medidaTecnica?.largura_m || 0)
  const alturaMm = Number(ambiente?.medidaTecnica?.altura_m || 0)
  const larguraM = larguraMm / 1000
  const alturaM = alturaMm / 1000
  if (!Number.isFinite(larguraM) || !Number.isFinite(alturaM)) return 0
  if (larguraM <= 0 || alturaM <= 0) return 0
  return larguraM * alturaM
}

function calcularAreaEstimadaDoAmbiente(ambiente) {
  const larguraMmVendedor = Number(ambiente?.medidaVendedor?.largura_m || 0)
  const alturaMmVendedor = Number(ambiente?.medidaVendedor?.altura_m || 0)
  const larguraMVendedor = larguraMmVendedor / 1000
  const alturaMVendedor = alturaMmVendedor / 1000
  const areaVendedor = larguraMVendedor > 0 && alturaMVendedor > 0 ? larguraMVendedor * alturaMVendedor : 0
  if (areaVendedor > 0) return areaVendedor

  return calcularAreaRealDoAmbiente(ambiente)
}

function calcularCustoBaseM2Import(data) {
  const resumo = Array.isArray(data?.resumo_materiais) ? data.resumo_materiais : []
  const totalArea = resumo.reduce((acc, row) => acc + Number(row?.area_m2 || 0), 0)
  const totalCusto = resumo.reduce((acc, row) => acc + Number(row?.custo_material || 0), 0)
  if (totalArea > 0 && totalCusto > 0) return totalCusto / totalArea

  const itens = Array.isArray(data?.itens) ? data.itens : []
  const precos = itens
    .map((row) => Number(row?.preco_m2 || 0))
    .filter((v) => Number.isFinite(v) && v > 0)
  if (!precos.length) return 0
  return precos.reduce((acc, v) => acc + v, 0) / precos.length
}

async function calcularKitTotalM2(acrescimoPct) {
  const { data } = await EstrategiaPrecosService.listarInsumosFixos()
  const insumos = Array.isArray(data) ? data : []
  const multiplicador = 1 + (Number(acrescimoPct || 0) / 100)
  const mult = Number.isFinite(multiplicador) && multiplicador > 0 ? multiplicador : 1

  const total = insumos.reduce((acc, item) => {
    const compra = Number(item?.value_compra ?? item?.value ?? 0)
    const fator = Number(item?.fator_conversao || 1)
    const fatorSeguro = Number.isFinite(fator) && fator > 0 ? fator : 1
    const referencia = (compra / fatorSeguro) * 2
    return acc + referencia * mult
  }, 0)

  return total
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useProjetoStore = defineStore('acasa-projeto', () => {
  // ── Estado ──────────────────────────────────────────────────────────────────

  /** @type {import('vue').Ref<Ambiente[]>} */
  const ambientes = ref([])

  /**
   * Resultado bruto da última chamada à API de importação Promob.
   * Inclui resumo_materiais, custo_total_producao, preco_venda_sugerido etc.
   * @type {import('vue').Ref<Record<string, unknown> | null>}
   */
  const importResult = ref(null)

  /** true enquanto um upload/importação estiver em andamento. */
  const importando = ref(false)

  /**
   * ID do orçamento técnico atualmente aberto.
   * Definido pela página antes de qualquer importação.
   * @type {import('vue').Ref<number | null>}
   */
  const orcamentoTecnicoId = ref(null)
  const matrizEssencialRows = ref([])
  const matrizEssencialLoaded = ref(false)

  function calcularPrecoVendaM2(custoBaseM2) {
    const custo = Number(custoBaseM2 || 0)
    if (!Number.isFinite(custo) || custo <= 0) return 0
    return custo * MARKUP_VENDA_MDF
  }

  function calcularCustoBaseM2DaLinha(row) {
    const costBase = Number(row?.cost_base ?? 0)
    return Number.isFinite(costBase) && costBase > 0 ? costBase : 0
  }

  async function carregarMatrizEssencialSeNecessario() {
    if (matrizEssencialLoaded.value) return
    const { data } = await EstrategiaPrecosService.buscarMdfPorCategoria('PRIMARIA')
    matrizEssencialRows.value = Array.isArray(data) ? data : []
    matrizEssencialLoaded.value = true
  }

  function escolherLinhaMaterial(rows, materialPreferencial) {
    if (!Array.isArray(rows) || rows.length === 0) return null

    const termo = String(materialPreferencial || '').trim().toUpperCase()
    if (termo) {
      const porNome = rows.find((r) => String(r?.group || r?.color || '').toUpperCase().includes(termo))
      if (porNome) return porNome
    }

    const branco = rows.find((r) => String(r?.group || r?.color || '').toUpperCase().includes('MDF BRANCO'))
      || rows.find((r) => String(r?.group || r?.color || '').toUpperCase().includes('BRANCO'))
    if (branco) return branco

    return rows[0]
  }

  /**
   * Busca cores de materiais (MDFs/chapas) pelo nome.
   * @param {string} termoBusca - Ex: "Gianduia", "Branco"
   * @returns {Promise<Array>}
   */
  async function buscarCoresMateriais(termoBusca) {
    const termo = String(termoBusca || '').trim()
    if (!termo || termo.length < 2) return []

    try {
      // Busca na Matriz por nome de cor (group/color field)
      const { data } = await EstrategiaPrecosService.buscarMdfPorCategoria('PRIMARIA')
      const linhas = Array.isArray(data) ? data : []

      // Filtra por correspondência em nome de cor
      const termoUpper = termo.toUpperCase()
      return linhas
        .filter((row) => {
          const cor = String(row?.group || row?.color || '').toUpperCase()
          return cor.includes(termoUpper)
        })
        .map((row) => ({
          id: row?.id || String(row?.color || '').replace(/\s+/g, '-'),
          nome_cor: String(row?.group || row?.color || 'Sem nome'),
          categoria: String(row?.categoria || 'PRIMARIA'),
          custo_m2: calcularCustoBaseM2DaLinha(row),
          valor_m2: calcularPrecoVendaM2(calcularCustoBaseM2DaLinha(row)),
          row_raw: row,
        }))
        .slice(0, 10) // Limita a 10 resultados
    } catch {
      return []
    }
  }

  /**
   * Calcula preço por m² de chapa com Tipo de Módulo + Fator de Consumo.
   * Fórmula: m² totais de chapa = Área × Fator de Consumo
   * Preço Final = m² totais × Valor da Chapa
   * @param {string} ambienteId
   * @param {{ tipoModulo?: string, corSelecionada?: object }} opts
   * @returns {Promise<object>}
   */
  async function calcularPrecoAmbienteComModulo(ambienteId, opts = {}) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return null

    // 1. Calcula área do desenho (m²)
    const areaProjeto = calcularAreaEstimadaDoAmbiente(amb)
    if (areaProjeto <= 0) return null

    // 2. Obtém tipo de módulo e fator de consumo
    const tipoModulo = String(opts?.tipoModulo || amb.tipoModulo || '').trim()
    const fatorConsumo = FATORES_CONSUMO_MODULO[tipoModulo] || 0
    if (fatorConsumo <= 0) return null

    // 3. Calcula m² totais de chapa = Área projeto × Fator
    const m2TotalChapa = round2(areaProjeto * fatorConsumo)

    // 4. Obtém valor da chapa (m²)
    let custoChapaM2 = 0
    let valorChapaM2 = 0
    let nomeCorSelecionada = ''
    let categoriaCor = 'PRIMARIA'

    if (opts?.corSelecionada && opts.corSelecionada.valor_m2 > 0) {
      custoChapaM2 = Number(opts.corSelecionada.custo_m2 ?? 0)
      valorChapaM2 = Number(opts.corSelecionada.valor_m2)
      nomeCorSelecionada = String(opts.corSelecionada.nome_cor || '')
      categoriaCor = String(opts.corSelecionada.categoria || 'PRIMARIA')
    } else if (amb.corSelecionada && amb.corSelecionada.valor_m2 > 0) {
      custoChapaM2 = Number(amb.corSelecionada.custo_m2 ?? 0)
      valorChapaM2 = Number(amb.corSelecionada.valor_m2)
      nomeCorSelecionada = String(amb.corSelecionada.nome_cor || '')
      categoriaCor = String(amb.corSelecionada.categoria || 'PRIMARIA')
    } else {
      try {
        await carregarMatrizEssencialSeNecessario()
        const linha = escolherLinhaMaterial(matrizEssencialRows.value, 'MDF Branco')
        if (linha) {
          custoChapaM2 = calcularCustoBaseM2DaLinha(linha)
          valorChapaM2 = calcularPrecoVendaM2(custoChapaM2)
          nomeCorSelecionada = String(linha?.group || linha?.color || 'MDF Branco')
        }
      } catch {
        return null
      }
    }

    if (custoChapaM2 <= 0 || valorChapaM2 <= 0) return null

    // 5. Calcula preço final: m² chapa × valor m²
    const precoFinal = round2(m2TotalChapa * valorChapaM2)

    const itemAuto = {
      id: gerarId(),
      descricao: `Chapa ${nomeCorSelecionada} - ${tipoModulo} (${m2TotalChapa} m²)`,
      material: nomeCorSelecionada,
      quantidade: 1,
      area_m2: round3(m2TotalChapa),
      custo_unitario: round2(custoChapaM2),
      preco_unitario: round2(valorChapaM2),
      origem: 'manual',
    }

    // Remove itens auto anteriores e insere novo
    const itensSemAuto = amb.itens.filter(
      (i) => !String(i?.descricao || '').includes('Chapa')
    )
    amb.itens = [...itensSemAuto, itemAuto]
    ambientes.value = [...ambientes.value]

    return {
      area_projeto: round3(areaProjeto),
      fator_consumo: fatorConsumo,
      m2_total_chapa: round3(m2TotalChapa),
      custo_chapa_m2: round2(custoChapaM2),
      valor_chapa_m2: round2(valorChapaM2),
      preco_final: precoFinal,
      nome_cor: nomeCorSelecionada,
      tipo_modulo: tipoModulo,
    }
  }

  async function calcularPrecoAmbiente(ambienteId, opts = {}) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return

    const areaEstimada = calcularAreaEstimadaDoAmbiente(amb)
    if (areaEstimada <= 0) return

    let custoBaseM2 = 0
    let precoVendaM2 = 0
    let materialAplicado = String(opts?.material || '').trim()

    try {
      await carregarMatrizEssencialSeNecessario()
      const linha = escolherLinhaMaterial(matrizEssencialRows.value, materialAplicado)
      if (linha) {
        custoBaseM2 = calcularCustoBaseM2DaLinha(linha)
        precoVendaM2 = calcularPrecoVendaM2(custoBaseM2)
        if (!materialAplicado) {
          materialAplicado = String(linha?.group || linha?.color || 'MDF Branco').trim()
        }
      }
    } catch {
      // Mantém fallback abaixo em caso de falha de API
    }

    if (custoBaseM2 <= 0) {
      materialAplicado = materialAplicado || 'MDF Branco'
      custoBaseM2 = 0
      precoVendaM2 = 0
    }

    const totalAmbiente = round2(areaEstimada * precoVendaM2)

    const itemAuto = {
      id: gerarId(),
      descricao: 'Calculo automatico Area x Matriz',
      material: materialAplicado,
      quantidade: 1,
      area_m2: round3(areaEstimada),
      custo_unitario: round2(custoBaseM2),
      preco_unitario: round2(precoVendaM2),
      origem: 'manual',
    }

    const itensSemAuto = amb.itens.filter((i) => String(i?.descricao || '') !== 'Calculo automatico Area x Matriz')
    amb.itens = [...itensSemAuto, itemAuto]
    ambientes.value = [...ambientes.value]

    return {
      area_estimada: round3(areaEstimada),
      custo_base_m2: round2(custoBaseM2),
      preco_venda_m2: round2(precoVendaM2),
      total: totalAmbiente,
      material: materialAplicado || 'MDF Branco',
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Adiciona/substitui o conjunto de ambientes vindos de uma pré-medição ou do backend.
   * Preserva medidaTecnica e itens se o ambiente já existir (por id).
   * @param {Array<Record<string, unknown>>} lista
   */
  function carregarAmbientes(lista) {
    const existentes = new Map(ambientes.value.map((a) => [String(a.id), a]))

    ambientes.value = (lista ?? []).map((raw) => {
      const id = String(raw.id ?? gerarId())
      const anterior = existentes.get(id)

      return {
        ...criarAmbienteVazio(raw.nome_ambiente || raw.nome || 'Ambiente'),
        id,
        // Medida do vendedor vinda da pré-medição (campos do banco)
        medidaVendedor: {
          largura_m: Number(raw.largura_m ?? raw.medidaVendedor?.largura_m ?? 0),
          altura_m: Number(raw.pe_direito_m ?? raw.altura_m ?? raw.medidaVendedor?.altura_m ?? 0),
          profundidade_m: Number(raw.profundidade_m ?? raw.medidaVendedor?.profundidade_m ?? 0),
        },
        // Preserva medida técnica já editada, mas aceita carga inicial do backend
        medidaTecnica: anterior?.medidaTecnica ?? {
          largura_m: Number(raw.medidaTecnica?.largura_m ?? 0),
          altura_m: Number(raw.medidaTecnica?.altura_m ?? 0),
          profundidade_m: Number(raw.medidaTecnica?.profundidade_m ?? 0),
        },
        itens: anterior?.itens ?? [],
      }
    })
  }

  /**
   * Adiciona um ambiente vazio (ou com dados iniciais) à lista.
   * @param {Partial<Ambiente>} [dados]
   * @returns {Ambiente}
   */
  function adicionarAmbiente(dados = {}) {
    const novo = {
      ...criarAmbienteVazio(dados.nome),
      ...dados,
      id: gerarId(), // sempre novo id para evitar colisão
      itens: Array.isArray(dados.itens) ? dados.itens : [],
    }
    ambientes.value = [...ambientes.value, novo]
    return novo
  }

  /**
   * Remove um ambiente pelo id.
   * @param {string} id
   */
  function removerAmbiente(id) {
    ambientes.value = ambientes.value.filter((a) => a.id !== id)
  }

  /**
   * Atualiza campos genéricos de um ambiente (ex.: nome).
   * @param {string} id
   * @param {Partial<Ambiente>} patch
   */
  function atualizarAmbiente(id, patch) {
    ambientes.value = ambientes.value.map((a) =>
      a.id === id ? { ...a, ...patch } : a,
    )
  }

  /**
   * Atualiza medidaVendedor ou medidaTecnica de um ambiente.
   * O Header totalProjeto recalcula instantaneamente via computed.
   *
   * @param {string} ambienteId
   * @param {'vendedor' | 'tecnica'} tipo
   * @param {Partial<Medida>} patch
   */
  function atualizarMedida(ambienteId, tipo, patch) {
    const campo = tipo === 'vendedor' ? 'medidaVendedor' : 'medidaTecnica'
    ambientes.value = ambientes.value.map((a) =>
      a.id === ambienteId
        ? { ...a, [campo]: { ...a[campo], ...patch } }
        : a,
    )
  }

  /**
   * Importa arquivo CSV/XML do Promob via backend e distribui os itens retornados
   * nos ambientes da store por correspondência de nome (case-insensitive).
   * Ambientes ainda não existentes são criados automaticamente.
   *
   * @param {{
   *   arquivo: File,
   *   orcamentoTecnicoId?: number,
  *   ambienteId?: string,
  *   areaRealM2?: number,
   *   custoConfig?: {
   *     hora_homem_value?: number,
   *     custo_fixo_fabrica_value?: number,
   *     acrescimo_pct?: number,
   *   }
   * }} params
   */
  async function importarPromob({ arquivo, orcamentoTecnicoId: oId, ambienteId, areaRealM2, custoConfig = {} }) {
    if (!arquivo) return

    const oTecnicoId = oId ?? orcamentoTecnicoId.value
    importando.value = true

    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      if (oTecnicoId != null) {
        fd.append('orcamento_tecnico_id', String(oTecnicoId))
      }
      fd.append('hora_homem_value', String(custoConfig.hora_homem_value ?? 0))
      fd.append('custo_fixo_fabrica_value', String(custoConfig.custo_fixo_fabrica_value ?? 0))
      fd.append('acrescimo_pct', String(custoConfig.acrescimo_pct ?? 0))

      const { data } = await OrcamentoTecnicoService.importarProjeto(fd)

      // Guarda resultado bruto para exibição na UI (resumo_materiais, chapas, etc.)
      importResult.value = { ...data, itens: (data.itens || []).map((i) => ({ ...i })) }

      // ── Distribui itens nos ambientes (modo legado por item importado) ────
      // No fluxo por card de ambiente (ambienteId informado), usamos somente
      // o cálculo automático por área real para evitar dupla contagem.
      if (!ambienteId) {
        const itensRetornados = Array.isArray(data.itens) ? data.itens : []

        for (const rawItem of itensRetornados) {
          const nomeAmb = String(rawItem.ambiente || rawItem.nome_ambiente || '').trim()
          const nomeAmbLower = nomeAmb.toLowerCase()

          // Tenta achar ambiente já existente
          let alvo = nomeAmbLower
            ? ambientes.value.find((a) => a.nome.trim().toLowerCase() === nomeAmbLower)
            : null

          // Se o item nomeia um ambiente desconhecido, cria automaticamente
          if (!alvo && nomeAmb) {
            alvo = adicionarAmbiente({ nome: nomeAmb })
          }

          // Fallback: usa o primeiro ambiente; se não existir, cria um genérico
          if (!alvo) {
            if (ambientes.value.length === 0) {
              alvo = adicionarAmbiente({ nome: 'Projeto' })
            } else {
              alvo = ambientes.value[0]
            }
          }

          alvo.itens = [...alvo.itens, itemDeImport(rawItem)]
          // Dispara reatividade do array raiz
          ambientes.value = [...ambientes.value]
        }
      }

      // ── Cálculo financeiro automático baseado na Matriz Operacional ───────
      const ambienteAlvo = ambienteId
        ? ambientes.value.find((a) => a.id === ambienteId)
        : null

      if (ambienteAlvo) {
        const areaRealCalculada = Number(areaRealM2 || 0) > 0
          ? Number(areaRealM2)
          : calcularAreaRealDoAmbiente(ambienteAlvo)

        if (areaRealCalculada > 0) {
          const custoBaseM2 = calcularCustoBaseM2Import(data)

          let kitTotalM2 = 0
          try {
            kitTotalM2 = await calcularKitTotalM2(custoConfig?.acrescimo_pct)
          } catch {
            kitTotalM2 = 0
          }

          const custoUnitarioM2 = custoBaseM2 + kitTotalM2
          const margemPct = Number(custoConfig?.acrescimo_pct || 0)
          const precoUnitarioM2 = custoUnitarioM2 * (1 + margemPct / 100)

          const itemCalculo = {
            id: gerarId(),
            descricao: 'Calculo automatico Matriz Operacional',
            material: String(data?.resumo_materiais?.[0]?.material || 'Matriz Operacional'),
            quantidade: 1,
            area_m2: round2(areaRealCalculada),
            custo_unitario: round2(custoUnitarioM2),
            preco_unitario: round2(precoUnitarioM2),
            origem: 'promob',
          }

          const itensSemCalculo = ambienteAlvo.itens.filter(
            (i) => String(i?.descricao || '') !== 'Calculo automatico Matriz Operacional',
          )
          ambienteAlvo.itens = [...itensSemCalculo, itemCalculo]
          ambientes.value = [...ambientes.value]
        }
      }

      notify.success('Arquivo Promob importado com sucesso.')
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Erro ao importar arquivo Promob.')
    } finally {
      importando.value = false
    }
  }

  /**
   * Adiciona manualmente um produto ao ambiente especificado.
   * O totalProjeto do Header atualiza na mesma tick.
   *
   * @param {string} ambienteId
   * @param {{
   *   descricao: string,
   *   material?: string,
   *   quantidade?: number,
   *   preco_unitario?: number,
   *   custo_unitario?: number,
   *   area_m2?: number,
   * }} produto
   * @returns {ItemAmbiente | null}
   */
  function adicionarItemManual(ambienteId, produto) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return null

    const item = {
      id: gerarId(),
      descricao: String(produto.descricao || 'Item manual'),
      material: String(produto.material || ''),
      quantidade: Number(produto.quantidade ?? 1),
      area_m2: Number(produto.area_m2 ?? 0),
      custo_unitario: Number(produto.custo_unitario ?? 0),
      preco_unitario: Number(produto.preco_unitario ?? 0),
      origem: 'manual',
    }

    amb.itens = [...amb.itens, item]
    ambientes.value = [...ambientes.value]
    return item
  }

  /**
   * Remove um item de um ambiente.
   * @param {string} ambienteId
   * @param {string} itemId
   */
  function removerItem(ambienteId, itemId) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return
    amb.itens = amb.itens.filter((i) => i.id !== itemId)
    ambientes.value = [...ambientes.value]
  }

  /**
   * Edita campos de um item existente.
   * @param {string} ambienteId
   * @param {string} itemId
   * @param {Partial<ItemAmbiente>} patch
   */
  function atualizarItem(ambienteId, itemId, patch) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return
    amb.itens = amb.itens.map((i) => (i.id === itemId ? { ...i, ...patch } : i))
    ambientes.value = [...ambientes.value]
  }

  /** Reseta o estado completo (chamar ao desmontar a página de orçamento técnico). */
  function reset() {
    ambientes.value = []
    importResult.value = null
    importando.value = false
    orcamentoTecnicoId.value = null
  }

  // ── Getters (computed reativos) ──────────────────────────────────────────────

  /**
   * Preço de venda total do projeto — soma de todos os itens de todos os ambientes.
   * Atualiza instantaneamente ao alterar qualquer medida ou produto.
   */
  const totalProjeto = computed(() =>
    ambientes.value.reduce(
      (total, amb) =>
        total + amb.itens.reduce((s, item) => s + valorItem(item, 'preco'), 0),
      0,
    ),
  )

  /**
   * Custo de produção total do projeto (uso interno da fábrica).
   */
  const totalCustoProducao = computed(() =>
    ambientes.value.reduce(
      (total, amb) =>
        total + amb.itens.reduce((s, item) => s + valorItem(item, 'custo'), 0),
      0,
    ),
  )

  /** Quantidade de ambientes no projeto. */
  const totalAmbientes = computed(() => ambientes.value.length)

  /** Quantidade total de itens em todos os ambientes. */
  const totalItens = computed(() =>
    ambientes.value.reduce((s, a) => s + (a.itens?.length ?? 0), 0),
  )

  /**
   * Subtotal por ambiente: Map<ambienteId, { custo: number, preco: number }>.
   * Usado pelos cards para exibir o subtotal de cada ambiente sem re-somar tudo.
   */
  const subtotalPorAmbiente = computed(() =>
    Object.fromEntries(
      ambientes.value.map((amb) => [
        amb.id,
        {
          custo: amb.itens.reduce((s, i) => s + valorItem(i, 'custo'), 0),
          preco: amb.itens.reduce((s, i) => s + valorItem(i, 'preco'), 0),
        },
      ]),
    ),
  )

  /**
   * Margem bruta do projeto em % — calculada sobre o preço de venda.
   * Retorna 0 se totalProjeto for zero (evita divisão por zero).
   */
  const margemProjeto = computed(() => {
    const preco = totalProjeto.value
    const custo = totalCustoProducao.value
    if (preco <= 0) return 0
    return ((preco - custo) / preco) * 100
  })

  // ── API pública da store ─────────────────────────────────────────────────────

  return {
    // Config
    TIPOS_MODULO,
    FATORES_CONSUMO_MODULO,
    
    // Estado
    ambientes,
    importResult,
    importando,
    orcamentoTecnicoId,

    // Actions
    carregarAmbientes,
    adicionarAmbiente,
    removerAmbiente,
    atualizarAmbiente,
    atualizarMedida,
    calcularPrecoAmbiente,
    calcularPrecoAmbienteComModulo,
    buscarCoresMateriais,
    importarPromob,
    adicionarItemManual,
    removerItem,
    atualizarItem,
    reset,

    // Getters
    totalProjeto,
    totalCustoProducao,
    totalAmbientes,
    totalItens,
    subtotalPorAmbiente,
    margemProjeto,
  }
})
