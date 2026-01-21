import { NAV_SCHEMA } from '@/services/navigation'

export function buildRoutePermMap() {
  const map = new Map()

  Object.values(NAV_SCHEMA).forEach((grupo) => {
    grupo.forEach((item) => {
      if (item?.to && item?.perm) map.set(item.to, item.perm)
    })
  })

  return map
}

export function getRequiredPerm(path, routePermMap) {
  // mais específico primeiro
  const entries = Array.from(routePermMap.entries()).sort((a, b) => b[0].length - a[0].length)

  for (const [base, perm] of entries) {
    if (path === base || path.startsWith(base + '/')) return perm
  }
  return null
}
