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

export async function checkAndroidUpdate () {
  if (typeof window === 'undefined' || window.__TAURI__) return
  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0'
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') return
    const res = await fetch(VERSION_JSON_URL, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    const serverVersion = data?.version
    const url = data?.url
    if (!serverVersion || !url) return
    if (!isNewer(serverVersion, currentVersion)) return
    const msg = `Há uma nova versão de A Casa Marcenaria (${serverVersion}) disponível.\n\nDeseja abrir a página para baixar e instalar?`
    if (window.confirm(msg)) {
      window.open(url, '_blank')
    }
  } catch (err) {
    console.warn('[checkAndroidUpdate]', err)
  }
}
