/**
 * No Android (Capacitor), verifica se existe versão nova do app Ponto.
 * Se existir, mostra aviso e abre o link para baixar o APK.
 */

const VERSION_JSON_URL = 'https://ponto.acasamarcenaria.com.br/version.json'

function parseVersion (v) {
  if (!v || typeof v !== 'string') return [0, 0, 0]
  return v.trim().split('.').map(n => parseInt(n, 10) || 0).slice(0, 3)
}

function isNewer (serverVersion, currentVersion) {
  const s = parseVersion(serverVersion)
  const c = parseVersion(currentVersion)
  for (let i = 0; i < 3; i++) {
    if (s[i] > c[i]) return true
    if (s[i] < c[i]) return false
  }
  return false
}

/**
 * @returns {Promise<{ updateAvailable: boolean, serverVersion?: string, url?: string }>}
 */
export async function checkPontoUpdate (opts = {}) {
  const interactive = !!opts.interactive
  const noUpdate = (reason) => ({ updateAvailable: false, reason })
  if (typeof window === 'undefined') return noUpdate
  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
  try {
    const { Capacitor, CapacitorHttp } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') return noUpdate('not-android')
    // CapacitorHttp evita CORS no WebView Android
    const res = await CapacitorHttp.get({ url: VERSION_JSON_URL })
    const status = res.status ?? 0
    if (status < 200 || status >= 300) {
      if (interactive) window.alert('Não foi possível consultar a versão no servidor.')
      return noUpdate('http-status')
    }
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
    const serverVersion = data?.version
    const url = data?.url
    if (!serverVersion || !url) {
      if (interactive) window.alert('Versão/URL não encontradas no servidor.')
      return noUpdate('missing-fields')
    }
    if (!isNewer(serverVersion, currentVersion)) {
      if (interactive) window.alert(`Você já está na última versão (${currentVersion}).`)
      return noUpdate('up-to-date')
    }
    const msg = `Há uma nova versão (${serverVersion}) disponível.\n\nAbrir no navegador para baixar e instalar o APK?`
    if (window.confirm(msg)) {
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url })
      } catch {
        window.open(url, '_blank')
      }
    }
    return { updateAvailable: true, serverVersion, url }
  } catch (err) {
    console.warn('[checkPontoUpdate]', err)
    if (interactive) window.alert('Não foi possível consultar a versão no servidor.')
    return noUpdate('exception')
  }
}
