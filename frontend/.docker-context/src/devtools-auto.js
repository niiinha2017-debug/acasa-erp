// src/devtools-auto.js
export async function openTauriDevtools() {
  try {
    const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
    if (!isTauri) return

    const mod = await import('@tauri-apps/api')
    const win = mod.getCurrentWindow()
    await win.openDevtools()
  } catch (e) {
    console.warn('DevTools não abriu:', e)
  }
}

export async function autoOpenDevtools() {
  try {
    if (import.meta.env.VITE_TAURI_DEVTOOLS !== 'true') return

    const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
    if (!isTauri) return

    await openTauriDevtools()
  } catch (e) {
    console.warn('DevTools não abriu:', e)
  }
}

/** No Tauri, F12 não abre o DevTools; este listener abre com F12 ou Ctrl+Shift+I */
export function setupDevtoolsShortcut() {
  const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)
  if (!isTauri) return

  window.addEventListener('keydown', (e) => {
    const isF12 = e.key === 'F12'
    const isCtrlShiftI = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I'
    if (!isF12 && !isCtrlShiftI) return

    e.preventDefault()
    openTauriDevtools()
  })
}
