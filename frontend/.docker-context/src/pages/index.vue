<template>
  <div class="h-24 flex items-center text-sm text-slate-500">
    Redirecionando...
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { can } from '@/services/permissions'
import { NAV_SCHEMA } from '@/services/navigation'

definePage({ meta: { perm: 'index.visualizar' } })

const router = useRouter()
const AGENDA_HOME = '/agendamentos/loja'

function getFirstAllowedRoute() {
  const flat = []
  for (const items of Object.values(NAV_SCHEMA)) {
    for (const item of items || []) {
      if (item?.divider) continue
      if (item?.children?.length) {
        flat.push(...item.children)
      } else {
        flat.push(item)
      }
    }
  }
  const firstAllowed = flat.find((item) => {
    if (!item?.to) return false
    if (!item.perm) return true
    return Array.isArray(item.perm) ? item.perm.some((p) => can(p)) : can(item.perm)
  })
  return firstAllowed?.to || '/alterar-senha'
}

onMounted(() => {
  const target = can('agendamentos.ver') ? AGENDA_HOME : getFirstAllowedRoute()
  router.replace(target)
})
</script>
