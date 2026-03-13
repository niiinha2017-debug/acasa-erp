/**
 * Store de ambientes (salas) e módulos MDF para o Visual Lab / projeto.
 * Cada ambiente tem nome, dimensões L×P e um array de itens (módulos).
 */

import { ref } from 'vue'

function gerarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** @typedef {{
 *   id: string
 *   largura_mm: number
 *   altura_mm: number
 *   profundidade_mm: number
 *   x_mm: number
 *   y_mm: number
 *   nome?: string
 * }} ModuloItem */

/** @typedef {{
 *   id: string
 *   nome: string
 *   largura_mm: number
 *   profundidade_mm: number
 *   itens: ModuloItem[]
 * }} Ambiente */

const ambientes = ref(/** @type {Ambiente[]} */ ([]))
const nomeProjeto = ref('')

/**
 * @returns {Ambiente}
 */
function criarAmbienteVazio() {
  return {
    id: gerarId(),
    nome: 'Novo ambiente',
    largura_mm: 3000,
    profundidade_mm: 2500,
    itens: [],
  }
}

/**
 * @param {Partial<ModuloItem>} [dados]
 * @returns {ModuloItem}
 */
function criarModuloVazio(dados = {}) {
  return {
    id: gerarId(),
    largura_mm: 600,
    altura_mm: 600,
    profundidade_mm: 18,
    x_mm: 0,
    y_mm: 0,
    nome: '',
    ...dados,
  }
}

export function useAmbientesStore() {
  function addAmbiente(ambiente = null) {
    const novo = ambiente ?? criarAmbienteVazio()
    if (!novo.id) novo.id = gerarId()
    if (!Array.isArray(novo.itens)) novo.itens = []
    ambientes.value = [...ambientes.value, novo]
    return novo
  }

  function removeAmbiente(id) {
    ambientes.value = ambientes.value.filter((a) => a.id !== id)
  }

  function updateAmbiente(id, patch) {
    const idx = ambientes.value.findIndex((a) => a.id === id)
    if (idx === -1) return
    ambientes.value = ambientes.value.map((a) =>
      a.id === id ? { ...a, ...patch } : a
    )
  }

  function getAmbiente(id) {
    return ambientes.value.find((a) => a.id === id) ?? null
  }

  function addItem(ambienteId, modulo = null) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return null
    const item = modulo ?? criarModuloVazio()
    if (!item.id) item.id = gerarId()
    amb.itens = [...amb.itens, item]
    ambientes.value = [...ambientes.value]
    return item
  }

  function removeItem(ambienteId, itemId) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return
    amb.itens = amb.itens.filter((i) => i.id !== itemId)
    ambientes.value = [...ambientes.value]
  }

  function updateItem(ambienteId, itemId, patch) {
    const amb = ambientes.value.find((a) => a.id === ambienteId)
    if (!amb) return
    const idx = amb.itens.findIndex((i) => i.id === itemId)
    if (idx === -1) return
    amb.itens = amb.itens.map((i) =>
      i.id === itemId ? { ...i, ...patch } : i
    )
    ambientes.value = [...ambientes.value]
  }

  /**
   * Exporta o projeto em JSON pronto para o NestJS salvar no banco.
   * Formato: { nome_projeto?, ambientes: [{ id, nome, largura_mm, profundidade_mm, itens }] }
   * @returns {{ nome_projeto?: string, ambientes: Array<{ id: string, nome: string, largura_mm: number, profundidade_mm: number, itens: ModuloItem[] }> }}
   */
  function exportarProjeto() {
    return {
      nome_projeto: nomeProjeto.value || undefined,
      ambientes: ambientes.value.map((a) => ({
        id: a.id,
        nome: a.nome,
        largura_mm: Number(a.largura_mm),
        profundidade_mm: Number(a.profundidade_mm),
        itens: (a.itens || []).map((i) => ({
          id: i.id,
          nome: i.nome || undefined,
          largura_mm: Number(i.largura_mm),
          altura_mm: Number(i.altura_mm),
          profundidade_mm: Number(i.profundidade_mm),
          x_mm: Number(i.x_mm),
          y_mm: Number(i.y_mm),
        })),
      })),
    }
  }

  function setProjeto(nome, listaAmbientes) {
    nomeProjeto.value = nome ?? ''
    ambientes.value = Array.isArray(listaAmbientes)
      ? listaAmbientes.map((a) => ({
          ...criarAmbienteVazio(),
          ...a,
          id: a.id || gerarId(),
          itens: Array.isArray(a.itens) ? a.itens.map((i) => ({ ...criarModuloVazio(), ...i })) : [],
        }))
      : []
  }

  function clear() {
    nomeProjeto.value = ''
    ambientes.value = []
  }

  return {
    ambientes,
    nomeProjeto,
    addAmbiente,
    removeAmbiente,
    updateAmbiente,
    getAmbiente,
    addItem,
    removeItem,
    updateItem,
    exportarProjeto,
    setProjeto,
    clear,
    criarAmbienteVazio,
    criarModuloVazio,
  }
}
