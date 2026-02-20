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
const AGENDA_HOME = '/agendamentos?visao=geral'

function getFirstAllowedRoute() {
  const items = Object.values(NAV_SCHEMA).flat()
  const firstAllowed = items.find((item) => {
    if (!item?.to || item?.divider) return false
    if (!item.perm) return true
    return can(item.perm)
  })
  return firstAllowed?.to || '/alterar-senha'
}

onMounted(() => {
  const target = can('agendamentos.ver') ? AGENDA_HOME : getFirstAllowedRoute()
  router.replace(target)
})
</script>
