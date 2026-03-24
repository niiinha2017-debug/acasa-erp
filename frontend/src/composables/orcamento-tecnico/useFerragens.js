/**
 * Gerenciamento de ferragens: upsert, custo, resolução de pendências, toggle de visibilidade.
 * Recebe getFerragemById como dependência injetada (de useMateriais).
 */
export function useFerragens({ getFerragemById }) {
  let _uid = 0
  function uid() { return ++_uid }

  function novaFerragem() {
    return {
      _id: uid(),
      produto_id: null,
      nome: '',
      nome_original: '',
      quantidade: 1,
      custo_unitario: 0,
      nao_encontrada: false,
      _resolver_produto_id: null,
    }
  }

  function chaveFerragemMerge(ferragem = {}) {
    if (ferragem?.produto_id != null) return `ID_${ferragem.produto_id}`
    const nome = normalizarNomeFerragem(ferragem?.nome_original || ferragem?.nome || '')
    return nome ? `NOME_${nome}` : ''
  }

  function normalizarNomeFerragem(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  function nomeFerragemExibicao(fer) {
    return fer?.nome || getFerragemById(fer?.produto_id)?.nome_produto || fer?.nome_original || '—'
  }

  function upsertFerragemNoModulo(mod, dadosFerragem = {}) {
    mod.ferragens = Array.isArray(mod.ferragens) ? mod.ferragens : []
    const quantidadeNova = Math.max(1, Number(dadosFerragem?.quantidade || 1))
    const chave = chaveFerragemMerge(dadosFerragem)
    if (!chave) return null

    const existente = mod.ferragens.find((item) => chaveFerragemMerge(item) === chave)
    if (existente) {
      existente.quantidade = Math.max(1, Number(existente.quantidade || 0) + quantidadeNova)
      if (dadosFerragem.produto_id != null) {
        existente.produto_id = dadosFerragem.produto_id
        existente.nao_encontrada = false
        existente.nome = dadosFerragem.nome || existente.nome
        existente.custo_unitario = Number(dadosFerragem.custo_unitario || existente.custo_unitario || 0)
        existente.nome_original = dadosFerragem.nome_original || existente.nome_original || existente.nome
        existente._resolver_produto_id = null
      }
      return existente
    }

    const nova = {
      ...novaFerragem(),
      ...dadosFerragem,
      quantidade: quantidadeNova,
      nome_original: dadosFerragem.nome_original || dadosFerragem.nome || '',
      nao_encontrada: Boolean(dadosFerragem.nao_encontrada),
    }
    mod.ferragens.push(nova)
    return nova
  }

  function aplicarVinculoFerragemNaLinha(fer, prod) {
    if (!fer || !prod) return
    fer.produto_id = prod.id
    fer.nome = prod.nome_produto || fer.nome || ''
    fer.nome_original = fer.nome_original || prod.nome_produto || ''
    fer.custo_unitario = Number(prod.valor_unitario || 0)
    fer.nao_encontrada = false
    fer._resolver_produto_id = null
    fer.quantidade = Math.max(1, Number(fer?.quantidade || 1))
  }

  function onSelecionarFerragem(fer) {
    const prod = getFerragemById(fer.produto_id)
    if (prod) {
      fer.nome = prod.nome_produto || ''
      fer.nome_original = fer.nome_original || prod.nome_produto || ''
      fer.nao_encontrada = false
      fer._resolver_produto_id = null
      fer.custo_unitario = Number(prod.valor_unitario || 0)
    }
  }

  function onSelecionarFerragemNoModulo(mod, produtoId) {
    mod._ferragens_abertas = true
    if (!produtoId) { mod._ferragemBuscaId = null; return }
    const prod = getFerragemById(produtoId)
    if (!prod) { mod._ferragemBuscaId = null; return }
    upsertFerragemNoModulo(mod, {
      produto_id: prod.id,
      nome: prod.nome_produto || '',
      nome_original: prod.nome_produto || '',
      quantidade: 1,
      custo_unitario: Number(prod.valor_unitario || 0),
      nao_encontrada: false,
    })
    mod._ferragemBuscaId = null
  }

  function onSelecionarFerragemNaParede(parede, produtoId) {
    if (!produtoId) { parede._ferragemBuscaId = null; return }
    const prod = getFerragemById(produtoId)
    if (!prod) { parede._ferragemBuscaId = null; return }
    upsertFerragemNoModulo(parede, {
      produto_id: prod.id,
      nome: prod.nome_produto || '',
      nome_original: prod.nome_produto || '',
      quantidade: 1,
      custo_unitario: Number(prod.valor_unitario || 0),
      nao_encontrada: false,
    })
    parede._ferragemBuscaId = null
  }

  function resolverFerragemPendente(mod, fer, produtoId) {
    if (!produtoId) return
    const prod = getFerragemById(produtoId)
    if (!prod) return
    aplicarVinculoFerragemNaLinha(fer, prod)
  }

  function resolverFerragemPendenteNaParede(parede, fer, produtoId) {
    if (!produtoId) return
    const prod = getFerragemById(produtoId)
    if (!prod) return
    aplicarVinculoFerragemNaLinha(fer, prod)
  }

  function getCustoFerragemUnitario(fer) {
    if (fer?.nao_encontrada) return 0
    const prod = getFerragemById(fer?.produto_id)
    if (prod) return Number(prod.valor_unitario || 0)
    return Number(fer?.custo_unitario || 0)
  }

  function getPrecoVendaFerragemUnitario(fer) {
    return getCustoFerragemUnitario(fer) * 2
  }

  function custoFerragemItem(fer) {
    return Number(fer?.quantidade || 0) * getPrecoVendaFerragemUnitario(fer)
  }

  function quantidadeFerragensModulo(mod) {
    return (mod.ferragens || []).reduce((a, f) => a + Number(f.quantidade || 0), 0)
  }

  function custoFerragensModulo(mod) {
    return (mod.ferragens || []).reduce((a, f) => a + custoFerragemItem(f), 0)
  }

  function quantidadeFerragensLista(ferragens = []) {
    return (ferragens || []).reduce((a, f) => a + Number(f.quantidade || 0), 0)
  }

  function custoFerragensLista(ferragens = []) {
    return (ferragens || []).reduce((a, f) => a + custoFerragemItem(f), 0)
  }

  function qtdFerragensPendentes(mod) {
    return (mod.ferragens || []).reduce((acc, fer) => acc + (fer?.nao_encontrada ? 1 : 0), 0)
  }

  function addFerragem(mod) {
    mod._ferragens_abertas = true
    mod.ferragens.push(novaFerragem())
  }

  function removerFerragem(mod, fIdx) {
    mod.ferragens.splice(fIdx, 1)
  }

  function addFerragemParede(parede) {
    parede.ferragens = Array.isArray(parede.ferragens) ? parede.ferragens : []
    parede.ferragens.push(novaFerragem())
  }

  function removerFerragemParede(parede, fIdx) {
    parede.ferragens.splice(fIdx, 1)
  }

  function ferragensAbertas(mod) {
    return Boolean(mod?._ferragens_abertas)
  }

  function toggleFerragens(mod) {
    mod._ferragens_abertas = !ferragensAbertas(mod)
  }

  function ferragensParedeAbertas(parede) {
    return parede?._ferragens_parede_abertas !== false
  }

  function toggleFerragensParede(parede) {
    parede._ferragens_parede_abertas = !ferragensParedeAbertas(parede)
  }

  return {
    novaFerragem,
    upsertFerragemNoModulo,
    nomeFerragemExibicao,
    onSelecionarFerragem,
    onSelecionarFerragemNoModulo,
    onSelecionarFerragemNaParede,
    resolverFerragemPendente,
    resolverFerragemPendenteNaParede,
    getCustoFerragemUnitario,
    getPrecoVendaFerragemUnitario,
    custoFerragemItem,
    quantidadeFerragensModulo,
    custoFerragensModulo,
    quantidadeFerragensLista,
    custoFerragensLista,
    qtdFerragensPendentes,
    addFerragem,
    removerFerragem,
    addFerragemParede,
    removerFerragemParede,
    ferragensAbertas,
    toggleFerragens,
    ferragensParedeAbertas,
    toggleFerragensParede,
  }
}
