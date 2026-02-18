/**
 * No Android (Capacitor), verifica se existe versão nova no subdomínio.
 * Se existir, mostra aviso e abre o link para baixar o APK.
 * O servidor deve expor: https://aplicativo.acasamarcenaria.com.br/updates/android/version.json
 * Formato: { "version": "0.1.11", "url": "https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk" }
 */

import { addDebugEntry } from '@/services/debug-log'

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
  addDebugEntry('android', 'checkAndroidUpdate iniciado', { currentVersion })

  if (typeof window === 'undefined' || window.__TAURI__) {
    addDebugEntry('android', 'ignorado (não é Android)', null)
    return noUpdate
  }
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') {
      addDebugEntry('android', 'ignorado (platform !== android)', { platform: Capacitor.getPlatform() })
      return noUpdate
    }
    addDebugEntry('android', 'fetch version.json', { url: VERSION_JSON_URL })
    const res = await fetch(VERSION_JSON_URL, { cache: 'no-store' })
    if (!res.ok) {
      addDebugEntry('android', 'version.json falhou', { status: res.status })
      return noUpdate
    }
    const data = await res.json()
    const serverVersion = data?.version
    const url = data?.url
    addDebugEntry('android', 'version.json ok', { serverVersion, url, currentVersion })
    if (!serverVersion || !url) {
      addDebugEntry('android', 'version ou url ausente', data)
      return noUpdate
    }
    const hasNewer = isNewer(serverVersion, currentVersion)
    addDebugEntry('android', 'comparação', { serverVersion, currentVersion, hasNewer })
    if (!hasNewer) return noUpdate
    const msg = `Há uma nova versão (${serverVersion}) disponível.\n\nAbrir no navegador para baixar e instalar o APK?`
    if (window.confirm(msg)) {
      addDebugEntry('android', 'usuário confirmou, abrindo navegador', { url })
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url })
      } catch (e) {
        addDebugEntry('android', 'Browser.open falhou, fallback window.open', { error: String(e) })
        window.open(url, '_blank')
      }
    } else {
      addDebugEntry('android', 'usuário cancelou', null)
    }
    return { updateAvailable: true, serverVersion, url }
  } catch (err) {
    console.warn('[checkAndroidUpdate]', err)
    addDebugEntry('android', 'erro', { message: err?.message, stack: err?.stack })
    return noUpdate
  }
}
