import { NAV_SCHEMA } from '@/services/navigation'

const ROUTE_TITLE_INDEX = (() => {
  const entries = []
  Object.values(NAV_SCHEMA || {}).forEach((sectionItems) => {
    ;(sectionItems || []).forEach((item) => {
      if (!item?.to || item?.divider) return
      const path = String(item.to).split('?')[0]
      entries.push({
        path,
        title: String(item.label || '').replace(/[^\p{L}\p{N}\s\-_/()]/gu, '').trim(),
      })
    })
  })
  return entries.sort((a, b) => b.path.length - a.path.length)
})()

const MENU_ROUTE_PATHS = new Set(
  ROUTE_TITLE_INDEX.map((entry) => entry.path),
)

function normalizePath(path = '') {
  return String(path || '').split('?')[0].replace(/\/+$/, '') || '/'
}

function routeToStableLabel(path) {
  const normalized = normalizePath(path)
  const slug = normalized
    .replace(/\//g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
  const hash = Math.abs(
    Array.from(normalized).reduce((acc, c) => ((acc * 31) + c.charCodeAt(0)) | 0, 7),
  ).toString(36)
  return `route_${slug || 'home'}_${hash}`
}

function inferWindowTitle(resolved, explicitTitle) {
  if (explicitTitle?.trim()) return explicitTitle.trim()

  const exact = ROUTE_TITLE_INDEX.find((entry) => resolved.path === entry.path)
  if (exact?.title) return exact.title

  const prefix = ROUTE_TITLE_INDEX.find((entry) =>
    resolved.path.startsWith(`${entry.path}/`),
  )
  if (prefix?.title) return prefix.title

  const last = resolved.path.split('/').filter(Boolean).pop() || 'Tela'
  return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getPageTitleForTarget(router, to, options = {}) {
  const resolved = router.resolve(to)
  return inferWindowTitle(resolved, options.windowTitle)
}

export async function openRouteInNewContext(router, to, options = {}) {
  const resolved = router.resolve(to)
  const href = resolved.href
  const pushFallback = router.__acasaOriginalPush?.bind(router) || router.push.bind(router)
  const pageTitle = getPageTitleForTarget(router, to, options)
  const windowTitle = `A Casa ERP | ${pageTitle}`
  const routeExists = Array.isArray(resolved.matched) && resolved.matched.length > 0

  if (!routeExists) {
    alert(`A rota ${resolved.path} nao existe no sistema.`)
    return
  }

  if (window.__TAURI__ || window.__TAURI_INTERNALS__) {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const label = routeToStableLabel(resolved.path)
      const existing = await WebviewWindow.getByLabel(label)
      if (existing) {
        let focused = false
        try {
          await existing.setFocus()
          focused = true
        } catch {
          // Janela com handle antigo/stale: segue para criar uma nova.
        }
        if (focused) return
      }

      const routeParam = encodeURIComponent(href)
      const titleParam = encodeURIComponent(windowTitle)
      const url = `/?openRoute=${routeParam}&openTitle=${titleParam}`

      const createWindow = (windowLabel) => new WebviewWindow(windowLabel, {
        url,
        title: windowTitle,
        width: 1280,
        height: 720,
        resizable: true,
        devtools: false,
      })

      try {
        createWindow(label)
      } catch (err) {
        const detail = String(err?.message || err || '')
        if (!detail.toLowerCase().includes('already exists')) throw err
        createWindow(`${label}_${Date.now()}`)
      }
      return
    } catch (err) {
      console.warn('[OPEN_ROUTE_TAURI]', err)
      const detail = String(err?.message || err || 'erro desconhecido')
      alert(`Nao foi possivel abrir a janela para ${resolved.path}: ${detail}`)
      return
    }
  }

  const newWindow = window.open(href, '_blank', 'noopener,noreferrer')
  if (!newWindow) await pushFallback(to)
}

export function shouldOpenInNewWindow(toOrResolved) {
  const path = normalizePath(toOrResolved?.path || toOrResolved)
  return MENU_ROUTE_PATHS.has(path)
}
