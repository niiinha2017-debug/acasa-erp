/**
 * Storage do token e dados do ponto.
 * Em PWA (principalmente iOS standalone) o localStorage pode falhar ou não persistir.
 * Usamos try/catch, fallback para sessionStorage e leitura/escrita defensiva.
 */

const TOKEN_KEY = 'acasa_ponto_token'
const NOME_KEY = 'acasa_funcionario_nome'
const UUID_KEY = 'acasa_ponto_device_uuid'

/** Guarda em memória como último recurso (ex.: modo privado sem storage) */
let memoryFallback = {}

function safeGet(storage, key) {
  try {
    if (typeof storage !== 'undefined' && storage !== null && storage.getItem) {
      const v = storage.getItem(key)
      if (v != null && v !== '') return v
    }
  } catch (_) {}
  return null
}

function safeSet(storage, key, value) {
  try {
    if (typeof storage !== 'undefined' && storage !== null && storage.setItem) {
      storage.setItem(key, value)
      return true
    }
  } catch (_) {}
  return false
}

/** Lê token: localStorage → sessionStorage → memória */
function getToken() {
  const v = safeGet(typeof localStorage !== 'undefined' ? localStorage : null, TOKEN_KEY) ||
    safeGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, TOKEN_KEY) ||
    memoryFallback[TOKEN_KEY] ||
    null
  return v && typeof v === 'string' ? v : null
}

/**
 * Persiste o token. Em PWA é importante gravar em todos os que funcionarem
 * para maximizar persistência (localStorage pode falhar em standalone).
 */
function setToken(token) {
  if (!token || typeof token !== 'string') return
  memoryFallback[TOKEN_KEY] = token
  safeSet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, TOKEN_KEY, token)
  safeSet(typeof localStorage !== 'undefined' ? localStorage : null, TOKEN_KEY, token)
}

function getFuncionarioNome() {
  return safeGet(typeof localStorage !== 'undefined' ? localStorage : null, NOME_KEY) ||
    safeGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, NOME_KEY) ||
    memoryFallback[NOME_KEY] ||
    ''
}

function setFuncionarioNome(nome) {
  if (nome != null) {
    memoryFallback[NOME_KEY] = String(nome)
    safeSet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, NOME_KEY, String(nome))
    safeSet(typeof localStorage !== 'undefined' ? localStorage : null, NOME_KEY, String(nome))
  }
}

function getDeviceUuid() {
  return safeGet(typeof localStorage !== 'undefined' ? localStorage : null, UUID_KEY) ||
    safeGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, UUID_KEY) ||
    memoryFallback[UUID_KEY] ||
    null
}

function setDeviceUuid(uuid) {
  if (uuid) {
    memoryFallback[UUID_KEY] = uuid
    safeSet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, UUID_KEY, uuid)
    safeSet(typeof localStorage !== 'undefined' ? localStorage : null, UUID_KEY, uuid)
  }
}

function clear() {
  memoryFallback = {}
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(NOME_KEY)
      localStorage.removeItem(UUID_KEY)
    }
  } catch (_) {}
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(NOME_KEY)
      sessionStorage.removeItem(UUID_KEY)
    }
  } catch (_) {}
}

export const pontoStorage = {
  getToken,
  setToken,
  getFuncionarioNome,
  setFuncionarioNome,
  getDeviceUuid,
  setDeviceUuid,
  clear,
}
