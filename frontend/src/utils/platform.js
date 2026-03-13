/**
 * Detecta o ambiente de execução: Tauri (desktop), Capacitor (tablet/mobile) ou Browser.
 * Expõe configuração para Three.js baseada na plataforma.
 */

/** @type {'tauri' | 'capacitor' | 'browser' | null} */
let _platformCache = null

/**
 * Verifica se está rodando no Tauri (desktop).
 * @returns {boolean}
 */
export function isTauri() {
  if (typeof window === 'undefined') return false
  return !!(window.__TAURI__ || window.__TAURI_INTERNALS__)
}

/**
 * Detecta a plataforma atual (async: precisa carregar Capacitor para distinguir de browser).
 * @returns {Promise<'tauri' | 'capacitor' | 'browser'>}
 */
export async function getPlatform() {
  if (_platformCache) return _platformCache
  if (isTauri()) {
    _platformCache = 'tauri'
    return _platformCache
  }
  try {
    const { Capacitor } = await import('@capacitor/core')
    const p = Capacitor.getPlatform()
    if (p === 'android' || p === 'ios') {
      _platformCache = 'capacitor'
      return _platformCache
    }
  } catch {
    // @capacitor/core não disponível ou não é app nativo
  }
  _platformCache = 'browser'
  return _platformCache
}

/**
 * Configuração do Three.js por plataforma.
 * @typedef {Object} ThreeConfig
 * @property {'high' | 'medium'} quality
 * @property {boolean} shadows
 * @property {number | null} targetFps - null = sem limite (máximo desempenho)
 */

/**
 * Retorna a configuração recomendada do Three.js para a plataforma atual.
 * - Tauri (Desktop): qualidade alta, sombras ativadas, FPS livre.
 * - Capacitor (Tablet): qualidade média, sem sombras, FPS 30 para economizar bateria.
 * - Browser: qualidade alta (comportamento padrão).
 * @returns {Promise<ThreeConfig>}
 */
export async function getThreeConfig() {
  const platform = await getPlatform()
  if (platform === 'tauri') {
    return {
      quality: 'high',
      shadows: true,
      targetFps: null,
    }
  }
  if (platform === 'capacitor') {
    return {
      quality: 'medium',
      shadows: false,
      targetFps: 30,
    }
  }
  return {
    quality: 'high',
    shadows: true,
    targetFps: null,
  }
}
