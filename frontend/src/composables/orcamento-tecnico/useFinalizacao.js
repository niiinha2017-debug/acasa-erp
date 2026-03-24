import { ref, computed } from 'vue'
import { FORMAS_PAGAMENTO, VENDA_FECHAMENTO_REGRAS, TAXAS_CARTAO, TAXA_NOTA_FISCAL, COMISSOES } from '@/constantes'

/**
 * @param {Object} deps
 * @param {import('vue').Ref}  deps.origemMedida
 * @param {Object}             deps.ORIGEM_MEDIDA
 * @param {import('vue').Ref}  deps.ambientesEditaveis
 * @param {import('vue').Ref}  deps.ambientesTecnico
 * @param {Object}             deps.modulosTecnico
 * @param {Function}           deps.chaveT
 * @param {Function}           deps.areaModuloM2
 * @param {Function}           deps.getCustoM2ByMaterial
 * @param {Function}           deps.getMaterialById
 * @param {Function}           deps.getFerragemById
 * @param {import('vue').Ref}  deps.precoVenda
 */
export function useFinalizacao({
  origemMedida,
  ORIGEM_MEDIDA,
  ambientesEditaveis,
  ambientesTecnico,
  modulosTecnico,
  chaveT,
  areaModuloM2,
  getCustoM2ByMaterial,
  getMaterialById,
  getFerragemById,
  precoVenda,
}) {
  // ── Regras de fechamento ──────────────────────────────────────
  const FORMAS_REMOVIDAS = new Set(
    (VENDA_FECHAMENTO_REGRAS?.FORMAS_REMOVIDAS_FECHAMENTO || []).map((x) => String(x || '').toUpperCase()),
  )
  const PARCELAS_MAX_POR_FORMA = VENDA_FECHAMENTO_REGRAS?.PARCELAS_MAX_POR_FORMA || {}

  // ── Estado: pagamentos ────────────────────────────────────────
  function novaLinhaPagamento() {
    return { forma_pagamento_chave: '', parcelas: 1, valor: 0 }
  }
  const pagamentosFechamento = ref([novaLinhaPagamento()])

  // ── Estado: nota fiscal e comissões ──────────────────────────
  const comNotaFiscal = ref(false)
  const comissoes = ref(
    Object.entries(COMISSOES || {})
      .filter(([key]) => key !== 'VENDEDOR')
      .map(([key, cfg]) => ({
        tipo: key,
        label: cfg.label,
        percentual: cfg.percentual,
        ativo: false,
        nome: '',
      }))
  )

  // ── Formas de pagamento ───────────────────────────────────────
  const FORMAS_PAGAMENTO_OPTIONS = computed(() =>
    (FORMAS_PAGAMENTO || [])
      .filter((x) => !FORMAS_REMOVIDAS.has(String(x.key || '').toUpperCase()))
      .map((x) => ({ label: x.label, value: x.key })),
  )

  function maxParcelasDaForma(forma) {
    const key = String(forma || '').toUpperCase()
    if (key === 'CREDITO') {
      const parcelas = Object.keys(TAXAS_CARTAO?.CREDITO?.parcelas || {}).map(Number).filter(n => n > 0)
      return parcelas.length ? Math.max(...parcelas) : 1
    }
    return Number(PARCELAS_MAX_POR_FORMA?.[key] || 1)
  }

  function parcelasOptionsDaForma(forma) {
    const key = String(forma || '').toUpperCase()
    const max = maxParcelasDaForma(key)
    if (key === 'CREDITO') {
      return Object.keys(TAXAS_CARTAO?.CREDITO?.parcelas || {})
        .map(Number).filter(n => n > 0).sort((a, b) => a - b)
    }
    const base = (VENDA_FECHAMENTO_REGRAS?.PARCELAS_OPCOES || [1]).map(Number).filter(n => n > 0)
    const filtradas = base.filter(n => n <= max)
    return filtradas.length ? filtradas : [Math.max(1, max)]
  }

  function getFormasPagamentoOptionsForRow(rowIdx) {
    const list = pagamentosFechamento.value || []
    const jaTemCredito = list.some(
      (p, i) => i !== rowIdx && String(p?.forma_pagamento_chave || '').toUpperCase() === 'CREDITO',
    )
    const base = FORMAS_PAGAMENTO_OPTIONS.value || []
    if (!jaTemCredito) return base
    return base.filter((opt) => String(opt?.value || '').toUpperCase() !== 'CREDITO')
  }

  function normalizarPagamentoLinha(linha, rowIdx) {
    if (!linha) return
    const forma = String(linha.forma_pagamento_chave || '').toUpperCase()
    const disponiveis = new Set(
      getFormasPagamentoOptionsForRow(rowIdx).map((x) => String(x.value || '').toUpperCase()),
    )
    if (forma && !disponiveis.has(forma)) {
      linha.forma_pagamento_chave = ''
      linha.parcelas = 1
    }
    const max = maxParcelasDaForma(linha.forma_pagamento_chave)
    const parcelas = Number(linha.parcelas || 1)
    linha.parcelas = Number.isFinite(parcelas) ? Math.max(1, Math.min(Math.floor(parcelas), max)) : 1
    linha.valor = Number.isFinite(Number(linha.valor)) ? Number(linha.valor) : 0
  }

  function addPagamento() { pagamentosFechamento.value.push(novaLinhaPagamento()) }
  function removerPagamento(idx) {
    pagamentosFechamento.value.splice(idx, 1)
    if (!pagamentosFechamento.value.length) pagamentosFechamento.value.push(novaLinhaPagamento())
  }

  // ── Taxas ─────────────────────────────────────────────────────
  function taxaCartaoPct(forma, parcelas) {
    const key = String(forma || '').toUpperCase()
    if (key === 'CREDITO') {
      return Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[Number(parcelas)] || 0)
    }
    if (key === 'DEBITO') return Number(TAXAS_CARTAO?.DEBITO?.taxa || 0)
    return 0
  }

  const taxaCartaoReais = computed(() => {
    const base = Number(precoVenda.value || 0)
    const linhas = pagamentosFechamento.value || []
    const totalInformado = linhas.reduce((s, l) => s + Number(l.valor || 0), 0)

    return linhas.reduce((acc, linha) => {
      const pct = taxaCartaoPct(linha.forma_pagamento_chave, linha.parcelas)
      if (!pct) return acc
      // Se o valor foi preenchido usa ele, senão distribui proporcionalmente pelo nº de linhas
      let valorLinha = Number(linha.valor || 0)
      if (!valorLinha) {
        const nLinhas = linhas.length || 1
        valorLinha = totalInformado > 0 ? totalInformado / nLinhas : base / nLinhas
      }
      return acc + Math.round((valorLinha * pct) / 100 * 100) / 100
    }, 0)
  })

  const taxaNfReais = computed(() =>
    comNotaFiscal.value
      ? Math.round((Number(precoVenda.value || 0) * (TAXA_NOTA_FISCAL?.taxa || 0)) / 100 * 100) / 100
      : 0,
  )

  const totalComissoesReais = computed(() => {
    const base = Number(precoVenda.value || 0)
    return (comissoes.value || []).reduce((acc, c) => {
      if (!c.ativo) return acc
      return acc + Math.round((base * c.percentual) / 100 * 100) / 100
    }, 0)
  })

  const precoFinalComTaxas = computed(() =>
    Number(precoVenda.value || 0) + taxaCartaoReais.value + taxaNfReais.value,
  )

  // ── Saldo ─────────────────────────────────────────────────────
  const totalPagamentoInformado = computed(() =>
    (pagamentosFechamento.value || []).reduce((acc, linha) => acc + Number(linha?.valor || 0), 0),
  )

  const saldoPagamento = computed(() =>
    Number(precoFinalComTaxas.value || 0) - Number(totalPagamentoInformado.value || 0),
  )

  // ── Mapeamento para payload de finalização ────────────────────
  function mapearFerragemItem(fer, origemSufixo) {
    const produto = getFerragemById(fer.produto_id)
    const custoUn = Number(produto?.valor_unitario || fer.custo_unitario || 0)
    return {
      descricao: fer.nome || produto?.nome_produto || 'Ferragem',
      material: produto?.nome_produto || fer.nome || '',
      quantidade: Number(fer.quantidade || 1),
      area_m2: 0,
      custo_unitario: custoUn,
      preco_unitario: custoUn,
      origem: origemSufixo,
    }
  }

  function mapearAmbientesParaFinalizacao() {
    if (origemMedida.value === ORIGEM_MEDIDA.TECNICO) {
      return ambientesTecnico.value.map((amb) => {
        const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
        const itens = paredes.flatMap((parede) => {
          const mods = modulosTecnico[chaveT(amb.id, parede.id)] || []
          const itensMdf = mods.map((mod) => ({
            descricao: mod.nome || 'Módulo',
            material: getMaterialById(mod.material_id)?.nome_produto || mod.material_nome_original || '',
            quantidade: 1,
            area_m2: areaModuloM2(mod),
            custo_unitario: getCustoM2ByMaterial(mod.material_id),
            preco_unitario: getCustoM2ByMaterial(mod.material_id),
            origem: 'TECNICO',
          }))
          const itensFerragensMods = mods.flatMap((mod) =>
            (mod.ferragens || [])
              .filter((fer) => Number(fer.quantidade || 0) > 0)
              .map((fer) => mapearFerragemItem(fer, 'TECNICO_FERRAGEM')),
          )
          return [...itensMdf, ...itensFerragensMods]
        })

        return {
          nome: amb.nome_ambiente || `Ambiente ${amb.id}`,
          medidaVendedor: {
            largura_m: Number(amb.largura_m || 0),
            altura_m: Number(amb.pe_direito_m || 0),
            profundidade_m: Number(amb.profundidade_m || 0),
          },
          medidaTecnica: {
            largura_m: Number(amb.largura_m || 0),
            altura_m: Number(amb.pe_direito_m || 0),
            profundidade_m: Number(amb.profundidade_m || 0),
          },
          itens,
        }
      })
    }

    return ambientesEditaveis.value.map((amb, idx) => {
      const larguraMParedes = (amb.paredes || []).reduce(
        (acc, p) => Math.max(acc, Number(p.largura_mm || 0) / 1000), 0,
      )
      const alturaMParedes = (amb.paredes || []).reduce(
        (acc, p) => Math.max(acc, Number(p.altura_mm || 0) / 1000), 0,
      )
      const largura_m = Number(amb.largura_m || amb.largura_mm / 1000 || larguraMParedes || 0)
      const altura_m = Number(amb.pe_direito_m || amb.altura_m || amb.altura_mm / 1000 || alturaMParedes || 0)
      const prof_m = Number(amb.profundidade_m || amb.profundidade_mm / 1000 || 0)
      const origemLabel = origemMedida.value

      const itens = (amb.paredes || []).flatMap((parede) => {
        const itensMdf = (parede.modulos || []).map((mod) => ({
          descricao: mod.nome || 'Módulo',
          material: getMaterialById(mod.material_id)?.nome_produto || mod.material_nome_original || '',
          quantidade: 1,
          area_m2: areaModuloM2(mod),
          custo_unitario: getCustoM2ByMaterial(mod.material_id),
          preco_unitario: getCustoM2ByMaterial(mod.material_id),
          origem: origemLabel,
        }))
        const itensFerragensModulos = (parede.modulos || []).flatMap((mod) =>
          (mod.ferragens || [])
            .filter((fer) => Number(fer.quantidade || 0) > 0)
            .map((fer) => mapearFerragemItem(fer, `${origemLabel}_FERRAGEM`)),
        )
        const itensFerragensParede = (parede.ferragens || [])
          .filter((fer) => Number(fer.quantidade || 0) > 0)
          .map((fer) => mapearFerragemItem(fer, `${origemLabel}_FERRAGEM`))

        return [...itensMdf, ...itensFerragensModulos, ...itensFerragensParede]
      })

      return {
        id: amb._id || idx,
        nome: amb.nome || `Ambiente ${idx + 1}`,
        medidaVendedor: { largura_m, altura_m, profundidade_m: prof_m },
        medidaTecnica: { largura_m, altura_m, profundidade_m: prof_m },
        itens,
      }
    })
  }

  return {
    pagamentosFechamento,
    comNotaFiscal,
    comissoes,
    FORMAS_PAGAMENTO_OPTIONS,
    TAXA_NOTA_FISCAL,
    COMISSOES,
    taxaCartaoReais,
    taxaNfReais,
    totalComissoesReais,
    precoFinalComTaxas,
    totalPagamentoInformado,
    saldoPagamento,
    taxaCartaoPct,
    maxParcelasDaForma,
    parcelasOptionsDaForma,
    getFormasPagamentoOptionsForRow,
    normalizarPagamentoLinha,
    addPagamento,
    removerPagamento,
    mapearAmbientesParaFinalizacao,
  }
}
