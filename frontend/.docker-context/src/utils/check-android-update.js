/**
 * No Android (Capacitor), verifica se existe versão nova no subdomínio.
 * Se existir, mostra aviso e abre o link para baixar o APK.
 * O servidor deve expor: https://aplicativo.acasamarcenaria.com.br/updates/android/version.json
 * Formato: { "version": "0.1.11", "url": "https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk" }
 */

const VERSION_JSON_URL = 'https://aplicativo.acasamarcenaria.com.br/updates/android/version.json'

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
export async function checkAndroidUpdate () {
  const noUpdate = { updateAvailable: false }
  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0'

  if (typeof window === 'undefined' || window.__TAURI__) {
    return noUpdate
  }
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') {
      return noUpdate
    }
    // CapacitorHttp = requisição nativa, evita CORS do WebView
    const { CapacitorHttp } = await import('@capacitor/core')
    const res = await CapacitorHttp.get({ url: VERSION_JSON_URL })
    const status = res.status ?? 0
    if (status < 200 || status >= 300) {
      return noUpdate
    }
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
    const serverVersion = data?.version
    const url = data?.url
    if (!serverVersion || !url) {
      return noUpdate
    }
    const hasNewer = isNewer(serverVersion, currentVersion)
    if (!hasNewer) return noUpdate
    const msg = `Há uma nova versão (${serverVersion}) disponível.\n\nAbrir no navegador para baixar e instalar o APK?`
    if (window.confirm(msg)) {
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url })
      } catch (e) {
        window.open(url, '_blank')
      }
    } else {
    }
    return { updateAvailable: true, serverVersion, url }
  } catch (err) {
    console.warn('[checkAndroidUpdate]', err)
    return noUpdate
  }
}
