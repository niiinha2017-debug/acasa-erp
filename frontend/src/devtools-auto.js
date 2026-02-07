// src/devtools-auto.js
export async function autoOpenDevtools() {
  try {
    if (import.meta.env.VITE_TAURI_DEVTOOLS !== 'true') return

    const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
    if (!isTauri) return

    // ✅ v2 compat: importar do pacote raiz
    const mod = await import('@tauri-apps/api')
    const win = mod.getCurrentWindow()
    await win.openDevtools()
  } catch (e) {
    console.warn('DevTools não abriu:', e)
  }
}
