import { ref } from 'vue'
import { notify } from '@/services/notify'

/**
 * Parse e importação de arquivos Promob (XML / JSON / CSV).
 * Recebe materiais, catalogoFerragens e upsertFerragemNoModulo como dependências injetadas.
 */
export function usePromob({ materiais, catalogoFerragens, upsertFerragemNoModulo }) {
  const promobFileInput = ref(null)
  const promobArquivoNome = ref('')
  const promobMensagem = ref('')
  const promobMensagemErro = ref(false)
  const ambientesPromob = ref([])

  let _uid = 0
  function uid() { return ++_uid }

  // ── Utilitários de texto ───────────────────────────────────────
  function normalizarTexto(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  function numeroPositivo(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  function normalizarNomeMaterialArquivo(materialNome) {
    return normalizarTexto(materialNome)
      .replace(/\b(MDF|MDP|BP|FF|TX|UV)\b/g, ' ')
      .replace(/\b\d+(?:[.,]\d+)?\s*MM\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function inferirCategoriaPromob(materialNome) {
    const material = normalizarTexto(materialNome)
    if (!material) return 'PRIMARIA'
    if (material.includes('PREMIUM') || material.includes('LACA') || material.includes('PRETO TX') || material.includes('NUDE')) return 'TERCIARIA'
    if (material.includes('CARVALHO') || material.includes('FREIJO') || material.includes('AMADEIR') || material.includes('DESIGN')) return 'SECUNDARIA'
    return 'PRIMARIA'
  }

  // ── Buscas no catálogo ─────────────────────────────────────────
  function encontrarMaterialPromob(materialNome) {
    const alvoNormalizado = normalizarNomeMaterialArquivo(materialNome)
    if (!alvoNormalizado) return null
    return materiais.value.find((m) => {
      const nomeNormalizado = normalizarNomeMaterialArquivo(m.nome_produto || m.group || '')
      return nomeNormalizado === alvoNormalizado
    }) || null
  }

  function encontrarFerragemPromob(nomeFerragem) {
    const alvo = normalizarTexto(nomeFerragem)
    if (!alvo) return null
    return catalogoFerragens.value.find((f) => normalizarTexto(f.nome_produto) === alvo) || null
  }

  // ── Detecção de tipo de item (MDF ou Ferragem) ─────────────────
  function identificarTipoItemPromob(dimensaoBruta = '') {
    const dimensaoNormalizada = normalizarTexto(String(dimensaoBruta || '').trim())

    if (dimensaoNormalizada.includes('UN') || dimensaoNormalizada === 'UNIDADE' || dimensaoNormalizada === 'UNID') {
      return { tipo: 'ferragem', valido: true, dimensoes: null, dimensaoBruta }
    }

    const dimensoes = dimensaoBruta.split('x').map((valor) => numeroPositivo(String(valor || '').trim(), 0))
    const largura = numeroPositivo(dimensoes[0], 0)
    const altura = dimensoes.length > 1 ? numeroPositivo(dimensoes[1], 0) : 0

    if (largura > 0 && altura > 0) {
      return { tipo: 'mdf', valido: true, dimensoes: { largura, altura }, dimensaoBruta }
    }

    return { tipo: 'mdf', valido: false, dimensoes: null, dimensaoBruta }
  }

  // ── Fábrica de módulo Promob ───────────────────────────────────
  function novoModuloPromob(modulo = {}) {
    const materialNome = String(modulo.material_nome || modulo.material || modulo.materialName || modulo.nome_material || 'Branco').trim()
    const material = encontrarMaterialPromob(materialNome)
    const naoEncontrado = !material
    return {
      _id: uid(),
      nome: String(modulo.nome || modulo.descricao || modulo.tipo || 'Módulo Promob').trim() || 'Módulo Promob',
      largura_mm: numeroPositivo(modulo.largura_mm ?? modulo.largura ?? modulo.width, 1200),
      altura_mm: numeroPositivo(modulo.altura_mm ?? modulo.altura ?? modulo.height, 800),
      material_id: material?.id ?? null,
      material_nao_encontrado: naoEncontrado,
      _ferragens_abertas: Array.isArray(modulo.ferragens) && modulo.ferragens.length > 0,
      ferragens: [],
      material_nome_original: materialNome,
      categoria_importada: inferirCategoriaPromob(materialNome),
    }
  }

  // ── Normalizadores de estrutura ────────────────────────────────
  function normalizarParedePromob(parede = {}, idx = 0) {
    const modulosEntrada = Array.isArray(parede.modulos) ? parede.modulos : Array.isArray(parede.modules) ? parede.modules : []
    return {
      _id: uid(),
      nome: String(parede.nome || parede.name || `Parede ${idx + 1}`).trim() || `Parede ${idx + 1}`,
      largura_mm: numeroPositivo(parede.largura_mm ?? parede.largura ?? parede.width, 2800),
      altura_mm: numeroPositivo(parede.altura_mm ?? parede.altura ?? parede.height, 2700),
      modulos: modulosEntrada.length ? modulosEntrada.map((mod) => novoModuloPromob(mod)) : [novoModuloPromob()],
      ferragens: Array.isArray(parede.ferragens) ? parede.ferragens : [],
    }
  }

  function normalizarAmbientePromob(ambiente = {}, idx = 0) {
    const paredesEntrada = Array.isArray(ambiente.paredes) ? ambiente.paredes : Array.isArray(ambiente.walls) ? ambiente.walls : []
    const modulosDiretos = Array.isArray(ambiente.modulos) ? ambiente.modulos : Array.isArray(ambiente.modules) ? ambiente.modules : []
    return {
      _id: uid(),
      nome: String(ambiente.nome || ambiente.name || `Ambiente ${idx + 1}`).trim() || `Ambiente ${idx + 1}`,
      paredes: paredesEntrada.length
        ? paredesEntrada.map((parede, paredeIdx) => normalizarParedePromob(parede, paredeIdx))
        : [normalizarParedePromob({ nome: 'Parede principal', modulos: modulosDiretos.length ? modulosDiretos : [novoModuloPromob()] }, 0)],
      ferragens: Array.isArray(ambiente.ferragens) ? ambiente.ferragens : [],
    }
  }

  function normalizarParedePromobComDeteccaoFerragem(parede = {}, idx = 0) {
    const modulosEntrada = Array.isArray(parede.modulos) ? parede.modulos : Array.isArray(parede.modules) ? parede.modules : []
    const modulos = []
    const ferragensParedeOrfas = []

    for (const modulo of modulosEntrada) {
      const dimensaoBruta = modulo.dimensoes || modulo.dimensao || modulo.size || modulo.width_height || ''
      const tipoItem = dimensaoBruta ? identificarTipoItemPromob(String(dimensaoBruta).trim()) : { tipo: 'mdf', valido: false, dimensoes: null }

      if (tipoItem.tipo === 'ferragem') {
        ferragensParedeOrfas.push({
          nome: modulo.material_nome || modulo.material || modulo.nome || '',
          quantidade: numeroPositivo(modulo.quantidade || 1, 1),
        })
      } else {
        modulos.push(novoModuloPromob(modulo))
      }
    }

    const modulosFinais = modulos.length > 0 ? modulos : [novoModuloPromob()]

    return {
      _id: uid(),
      nome: String(parede.nome || parede.name || `Parede ${idx + 1}`).trim() || `Parede ${idx + 1}`,
      largura_mm: numeroPositivo(parede.largura_mm ?? parede.largura ?? parede.width, 2800),
      altura_mm: numeroPositivo(parede.altura_mm ?? parede.altura ?? parede.height, 2700),
      modulos: modulosFinais,
      ferragens: ferragensParedeOrfas.map((fer) => {
        const ferragem = encontrarFerragemPromob(fer.nome)
        return {
          _id: uid(),
          produto_id: ferragem?.id ?? null,
          nome: ferragem?.nome_produto || fer.nome,
          nome_original: fer.nome,
          quantidade: fer.quantidade,
          custo_unitario: Number(ferragem?.valor_unitario || 0),
          nao_encontrada: !ferragem,
        }
      }),
    }
  }

  function normalizarAmbientePromobComDeteccaoFerragem(ambiente = {}, idx = 0) {
    const paredesEntrada = Array.isArray(ambiente.paredes) ? ambiente.paredes : Array.isArray(ambiente.walls) ? ambiente.walls : []
    const modulosDiretos = Array.isArray(ambiente.modulos) ? ambiente.modulos : Array.isArray(ambiente.modules) ? ambiente.modules : []

    const paredesProcessadas = paredesEntrada.length
      ? paredesEntrada.map((parede, paredeIdx) => normalizarParedePromobComDeteccaoFerragem(parede, paredeIdx))
      : [normalizarParedePromobComDeteccaoFerragem({ nome: 'Parede principal', modulos: modulosDiretos.length ? modulosDiretos : [] }, 0)]

    const ferragensAmbiente = Array.isArray(ambiente.ferragens) ? ambiente.ferragens : []

    return {
      _id: uid(),
      nome: String(ambiente.nome || ambiente.name || `Ambiente ${idx + 1}`).trim() || `Ambiente ${idx + 1}`,
      paredes: paredesProcessadas,
      ferragens: ferragensAmbiente.map((fer) => {
        const ferragem = encontrarFerragemPromob(typeof fer === 'string' ? fer : fer.nome || fer.material_nome || '')
        const nomeFer = typeof fer === 'string' ? fer : fer.nome || fer.material_nome || ''
        return {
          _id: uid(),
          produto_id: ferragem?.id ?? null,
          nome: ferragem?.nome_produto || nomeFer,
          nome_original: nomeFer,
          quantidade: typeof fer === 'string' ? 1 : numeroPositivo(fer.quantidade || 1, 1),
          custo_unitario: Number(ferragem?.valor_unitario || 0),
          nao_encontrada: !ferragem,
        }
      }),
    }
  }

  // ── Remapeamento de materiais após catálogo carregar ───────────
  function remapearMateriaisPromob(ambientes = []) {
    return ambientes.map((ambiente, ambIdx) => ({
      ...ambiente,
      _id: ambiente._id || uid(),
      nome: ambiente.nome || `Ambiente ${ambIdx + 1}`,
      paredes: (ambiente.paredes || []).map((parede, paredeIdx) => ({
        ...parede,
        _id: parede._id || uid(),
        nome: parede.nome || `Parede ${paredeIdx + 1}`,
        modulos: (parede.modulos || []).map((modulo) => {
          const materialNome = modulo.material_nome_original || modulo.nome_material || modulo.material_nome || modulo.nome || 'Branco'
          const material = encontrarMaterialPromob(materialNome)
          const materialSelecionadoId = modulo.material_id ?? material?.id ?? null
          const materialSelecionado = materialSelecionadoId != null
            ? materiais.value.find((m) => m.id === materialSelecionadoId)
            : null
          return {
            ...modulo,
            _id: modulo._id || uid(),
            material_id: materialSelecionadoId,
            material_nao_encontrado: !materialSelecionado,
            _ferragens_abertas: Boolean(modulo._ferragens_abertas) || (Array.isArray(modulo.ferragens) && modulo.ferragens.length > 0),
            _ferragemBuscaId: null,
            categoria_importada: inferirCategoriaPromob(materialNome),
            ferragens: Array.isArray(modulo.ferragens) ? modulo.ferragens : [],
          }
        }),
        _ferragemBuscaId: null,
        _ferragens_parede_abertas: parede?._ferragens_parede_abertas !== false,
        ferragens: (Array.isArray(parede.ferragens) ? parede.ferragens : []).map((fer) => {
          const nomeOriginal = fer?.nome_original || fer?.nome || ''
          const ferragemEncontrada = (fer?.produto_id != null)
            ? catalogoFerragens.value.find((f) => f.id === fer.produto_id)
            : encontrarFerragemPromob(nomeOriginal)
          return {
            _id: fer?._id || uid(),
            produto_id: fer?.produto_id ?? ferragemEncontrada?.id ?? null,
            nome: fer?.nome || ferragemEncontrada?.nome_produto || nomeOriginal,
            nome_original: nomeOriginal,
            quantidade: Math.max(1, Number(fer?.quantidade || 1)),
            custo_unitario: Number(fer?.custo_unitario ?? ferragemEncontrada?.valor_unitario ?? 0),
            nao_encontrada: fer?.produto_id != null ? !ferragemEncontrada : !ferragemEncontrada,
          }
        }),
      })),
      ferragens: Array.isArray(ambiente.ferragens) ? ambiente.ferragens : [],
    }))
  }

  // ── Parsers ────────────────────────────────────────────────────
  function extrairAttrsPromob(rawAttrs = '') {
    const attrs = {}
    const regex = /(\w+)\s*=\s*"([^"]*)"/g
    let match = regex.exec(rawAttrs)
    while (match) {
      attrs[String(match[1] || '').toUpperCase()] = match[2]
      match = regex.exec(rawAttrs)
    }
    return attrs
  }

  function parsePromobXmlSimulado(texto) {
    const ambientesMap = new Map()
    const tagRegex = /<(?:modulo|Modulo|module|Module|item|Item|peca|Peca|part|Part)\b([^>]*)\/?>(?:<\/[^>]+>)?/g
    let match = tagRegex.exec(texto)

    while (match) {
      const attrs = extrairAttrsPromob(match[1])
      const ambienteNome = String(attrs.AMBIENTE || attrs.ROOM || attrs.ENVIRONMENT || 'Ambiente Promob').trim()
      const paredeNome = String(attrs.PAREDE || attrs.WALL || 'Parede principal').trim()
      const ambienteKey = normalizarTexto(ambienteNome) || `AMBIENTE_${ambientesMap.size + 1}`

      if (!ambientesMap.has(ambienteKey)) {
        ambientesMap.set(ambienteKey, { nome: ambienteNome || 'Ambiente Promob', paredes: [] })
      }

      const ambiente = ambientesMap.get(ambienteKey)
      let parede = ambiente.paredes.find((item) => normalizarTexto(item.nome) === normalizarTexto(paredeNome))
      if (!parede) {
        parede = {
          nome: paredeNome || 'Parede principal',
          largura_mm: numeroPositivo(attrs.PAREDE_LARGURA_MM || attrs.WALL_WIDTH || attrs.LARGURA_PAREDE, 2800),
          altura_mm: numeroPositivo(attrs.PAREDE_ALTURA_MM || attrs.WALL_HEIGHT || attrs.ALTURA_PAREDE, 2700),
          modulos: [],
          ferragens: [],
        }
        ambiente.paredes.push(parede)
      }

      const dimensaoBruta = String(attrs.DIMENSOES || attrs.DIMENSIONS || attrs.DIMENSAO || attrs.DIMENSION || attrs.TAMANHO || attrs.SIZE || '').trim()
      const quantidade = numeroPositivo(attrs.QUANTIDADE || attrs.QUANTITY || '1', 1)
      const nomeModulo = String(attrs.NOME || attrs.NAME || attrs.DESCRICAO || 'Módulo Promob').trim()
      const materialNome = String(attrs.MATERIAL || attrs.MAT || attrs.COR || attrs.COLOR || 'Branco').trim()
      const tipoItem = dimensaoBruta ? identificarTipoItemPromob(dimensaoBruta) : { tipo: 'mdf', valido: false, dimensoes: null, dimensaoBruta }

      if (tipoItem.tipo === 'ferragem') {
        if (!Array.isArray(parede.ferragens)) parede.ferragens = []
        const ferragem = encontrarFerragemPromob(materialNome)
        upsertFerragemNoModulo(parede, {
          produto_id: ferragem?.id ?? null,
          nome: ferragem?.nome_produto || materialNome,
          nome_original: materialNome,
          quantidade: Math.max(1, quantidade),
          custo_unitario: Number(ferragem?.valor_unitario || 0),
          nao_encontrada: !ferragem,
        })
        match = tagRegex.exec(texto)
        continue
      }

      let larguraMm = numeroPositivo(attrs.LARGURA_MM || attrs.WIDTH || attrs.LARGURA, 0)
      let alturaMm = numeroPositivo(attrs.ALTURA_MM || attrs.HEIGHT || attrs.ALTURA, 0)
      if (tipoItem.valido && tipoItem.dimensoes) { larguraMm = tipoItem.dimensoes.largura; alturaMm = tipoItem.dimensoes.altura }
      if (!(larguraMm > 0) || !(alturaMm > 0)) { larguraMm = 1200; alturaMm = 800 }

      for (let idx = 0; idx < Math.max(1, quantidade); idx += 1) {
        parede.modulos.push({ nome: nomeModulo, material_nome: materialNome, largura_mm: larguraMm, altura_mm: alturaMm })
      }

      match = tagRegex.exec(texto)
    }

    const ambientes = Array.from(ambientesMap.values())
    if (!ambientes.length) {
      return [normalizarAmbientePromob({
        nome: 'Ambiente Promob',
        paredes: [{ nome: 'Parede principal', largura_mm: 2800, altura_mm: 2700, modulos: [{ nome: 'Aéreo 2 portas', material_nome: 'Branco', largura_mm: 1200, altura_mm: 800 }] }],
      })]
    }
    return ambientes.map((ambiente, idx) => normalizarAmbientePromob(ambiente, idx))
  }

  function parsePromobJsonSimulado(texto) {
    const bruto = JSON.parse(texto)
    const ambientes = Array.isArray(bruto) ? bruto : Array.isArray(bruto?.ambientes) ? bruto.ambientes : Array.isArray(bruto?.rooms) ? bruto.rooms : null

    let ambientesProcessados = []
    if (ambientes?.length) {
      ambientesProcessados = ambientes.map((ambiente, idx) => normalizarAmbientePromobComDeteccaoFerragem(ambiente, idx))
    } else if (Array.isArray(bruto?.modulos) || Array.isArray(bruto?.modules)) {
      ambientesProcessados = [normalizarAmbientePromobComDeteccaoFerragem({ nome: bruto.nome || 'Ambiente Promob', modulos: bruto.modulos || bruto.modules }, 0)]
    } else {
      ambientesProcessados = [normalizarAmbientePromobComDeteccaoFerragem({ nome: bruto?.nome || 'Ambiente Promob', modulos: [bruto] }, 0)]
    }

    return ambientesProcessados
  }

  function parseLinhaCsvPromob(linha) {
    const colunas = []
    let atual = ''
    let emAspas = false
    for (const char of String(linha || '')) {
      if (char === '"') { emAspas = !emAspas; continue }
      if (char === ';' && !emAspas) { colunas.push(atual.trim()); atual = ''; continue }
      atual += char
    }
    colunas.push(atual.trim())
    return colunas
  }

  function parsePromobCsvSimulado(texto) {
    const linhas = String(texto || '')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((linha) => linha.trim())
      .filter(Boolean)

    if (linhas.length < 2) {
      return [normalizarAmbientePromob({ nome: 'Ambiente Promob', paredes: [{ nome: 'Parede principal', largura_mm: 2800, altura_mm: 2700, modulos: [{ nome: 'Modulo CSV', material_nome: 'Branco', largura_mm: 1200, altura_mm: 800 }] }] })]
    }

    const ambientesMap = new Map()

    for (let linhaIdx = 0; linhaIdx < linhas.length; linhaIdx += 1) {
      const partesBase = parseLinhaCsvPromob(linhas[linhaIdx])
      const partes = (partesBase.length === 1 && linhas[linhaIdx].includes(';')
        ? String(linhas[linhaIdx]).split(';')
        : partesBase).map((parte) => String(parte || '').trim())

      if (partes.length < 5) continue

      const ambienteNome = String(partes[0] || '').trim()
      const moduloNome = String(partes[1] || '').trim()
      const materialNome = String(partes[2] || '').trim()
      const quantidadeRaw = Number(String(partes[3] || '').replace(/\D/g, '')) || 1
      const dimensaoBruta = String(partes[4] || '').trim()

      const linhaEhCabecalho = [ambienteNome, moduloNome, materialNome, String(partes[3] || ''), String(partes[4] || '')]
        .some((v) => ['AMBIENTE', 'MODULO', 'ITEM', 'MATERIAL', 'DESCRICAO', 'QUANTIDADE', 'DIMENS', 'TAMANHO'].some((k) => normalizarTexto(v).includes(k)))
      if (linhaEhCabecalho) continue
      if (!ambienteNome || !moduloNome || !materialNome) continue

      const tipoItem = identificarTipoItemPromob(dimensaoBruta)
      const ambienteKey = normalizarTexto(ambienteNome || 'Ambiente Promob') || `AMBIENTE_${linhaIdx}`

      if (!ambientesMap.has(ambienteKey)) {
        ambientesMap.set(ambienteKey, { nome: ambienteNome || 'Ambiente Promob', paredes: [] })
      }

      const ambiente = ambientesMap.get(ambienteKey)
      let parede = ambiente.paredes.find((item) => normalizarTexto(item.nome) === 'PAREDE PRINCIPAL')
      if (!parede) {
        parede = { nome: 'Parede principal', largura_mm: 2800, altura_mm: 2700, modulos: [], ferragens: [] }
        ambiente.paredes.push(parede)
      }

      if (tipoItem.tipo === 'ferragem') {
        if (!Array.isArray(parede.ferragens)) parede.ferragens = []
        const ferragem = encontrarFerragemPromob(materialNome)
        upsertFerragemNoModulo(parede, {
          produto_id: ferragem?.id ?? null,
          nome: ferragem?.nome_produto || materialNome,
          nome_original: materialNome,
          quantidade: Math.max(1, quantidadeRaw),
          custo_unitario: Number(ferragem?.valor_unitario || 0),
          nao_encontrada: !ferragem,
        })
        continue
      }

      if (!tipoItem.valido || !tipoItem.dimensoes) continue
      const { largura, altura } = tipoItem.dimensoes
      for (let q = 0; q < Math.max(1, quantidadeRaw); q += 1) {
        parede.modulos.push({ nome: moduloNome, material_nome: materialNome, largura_mm: largura, altura_mm: altura })
      }
    }

    const ambientes = Array.from(ambientesMap.values())
    return ambientes.map((ambiente, idx) => normalizarAmbientePromob(ambiente, idx))
  }

  // ── Upload e processamento ─────────────────────────────────────
  function abrirUploadPromob() {
    promobFileInput.value?.click()
  }

  async function handlePromobUpload(event) {
    const file = event?.target?.files?.[0]
    if (!file) return

    promobArquivoNome.value = file.name
    promobMensagem.value = 'Processando arquivo do Promob...'
    promobMensagemErro.value = false

    try {
      const texto = await file.text()
      const extensao = String(file.name.split('.').pop() || '').toLowerCase()
      const ambientes = extensao === 'json'
        ? parsePromobJsonSimulado(texto)
        : extensao === 'csv'
          ? parsePromobCsvSimulado(texto)
          : parsePromobXmlSimulado(texto)

      ambientesPromob.value = remapearMateriaisPromob(ambientes)
      promobMensagem.value = `Importação concluída: ${ambientesPromob.value.length} ambiente(s) mapeado(s) automaticamente.`
      promobMensagemErro.value = false
      notify.success('Arquivo do Promob importado com sucesso.')
    } catch {
      ambientesPromob.value = []
      promobMensagem.value = 'Não foi possível ler o arquivo. Revise a estrutura XML, JSON ou CSV e tente novamente.'
      promobMensagemErro.value = true
      notify.error('Falha ao importar arquivo do Promob.')
    } finally {
      if (event?.target) event.target.value = ''
    }
  }

  return {
    promobFileInput,
    promobArquivoNome,
    promobMensagem,
    promobMensagemErro,
    ambientesPromob,
    abrirUploadPromob,
    handlePromobUpload,
    remapearMateriaisPromob,
    normalizarTexto,
    inferirCategoriaPromob,
    encontrarMaterialPromob,
    encontrarFerragemPromob,
    novoModuloPromob,
    normalizarAmbientePromob,
  }
}
