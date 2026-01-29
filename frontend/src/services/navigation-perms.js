// src/services/navigation-perms.js
import { routes } from 'vue-router/auto-routes'

function normalizePath(input) {
  // aceita string, route object, route record, qualquer coisa
  const raw =
    typeof input === 'string'
      ? input
      : (input?.path ?? '')

  const p = String(raw || '')
  if (!p) return ''
  return p.startsWith('/') ? p : `/${p}`
}

export function buildRoutePermMap() {
  const map = {}

  const walk = (arr = []) => {
    for (const r of arr) {
      const path = normalizePath(r?.path)

      // pegue a perm da meta se existir (não força nada)
      const perm = r?.meta?.perm || r?.meta?.permissao || r?.meta?.requiredPerm

      if (path && typeof perm === 'string' && perm.trim()) {
        map[path] = perm.trim()
      }

      if (Array.isArray(r?.children) && r.children.length) {
        walk(r.children)
      }
    }
  }

  walk(routes)
  return map
}

export function getRequiredPerm(to, routePermMap = {}) {
  const path = normalizePath(to) // ✅ aqui aceita "to" inteiro sem quebrar
  if (!path) return null

  // 1) match exato
  if (routePermMap[path]) return routePermMap[path]

  // 2) tenta pais: /a/b/c -> /a/b -> /a
  const parts = path.split('/').filter(Boolean)
  for (let i = parts.length - 1; i >= 1; i--) {
    const parent = `/${parts.slice(0, i).join('/')}`
    if (routePermMap[parent]) return routePermMap[parent]
  }

  return null
}
