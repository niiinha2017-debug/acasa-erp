export function getBaseOriginFromApi(apiInstance) {
  const base = apiInstance?.defaults?.baseURL || ''
  return base.replace(/\/$/, '')
}

/**
 * Abre URL no app externo (Tauri: opener; Android: Capacitor Browser; senão: window.open).
 * Para Tauri e Android não há “web” rodando — o link deve abrir no navegador/app do sistema.
 */
export async function openExternalUrl(url) {
  if (!url || typeof url !== 'string') return false
  const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)
  if (isTauri) {
    try {
      const openerMod = await import('@tauri-apps/plugin-opener').catch(() => null)
      if (openerMod?.open) {
        await openerMod.open(url)
        return true
      }
      if (typeof openerMod?.openUrl === 'function') {
        await openerMod.openUrl(url)
        return true
      }
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (tauri?.opener?.open) {
        await tauri.opener.open(url)
        return true
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        await tauri.opener.openUrl(url)
        return true
      }
      if (tauri?.shell?.open) {
        await tauri.shell.open(url)
        return true
      }
    } catch (_) {
      return false
    }
  }
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() === 'android') {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return true
    }
  } catch (_) {}
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    return !!w
  } catch (_) {
    return false
  }
}
