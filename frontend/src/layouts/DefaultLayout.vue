<template>
  <div class="min-h-screen bg-bg-page text-text-main transition-colors duration-300">
    <Menu />
    <div class="border-b border-border-ui bg-[var(--bg-card)]">
      <div class="px-4 md:px-6 overflow-x-auto">
        <div class="flex items-center gap-2 py-2 min-w-max">
          <div
            v-for="(tab, index) in openTabs"
            :key="tab.key"
            class="group flex items-center gap-1 rounded-md border text-xs font-semibold transition-colors"
            :class="activeTabId === tab.key
              ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
              : 'border-border-ui bg-white/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800'"
          >
            <button
              type="button"
              class="px-3 py-1.5"
              @click="goToTab(tab)"
            >
              {{ tab.title }}
            </button>
            <button
              type="button"
              class="px-2 py-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="openTabs.length <= 1"
              aria-label="Fechar aba"
              @click="closeTab(tab, index)"
            >
              <i class="pi pi-times text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    <PageShell :contained="false" :padded="true">
      <slot />
    </PageShell>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Menu from '@/layouts/Menu.vue'
import PageShell from '@/components/ui/PageShell.vue'
import { NAV_SCHEMA } from '@/services/navigation'

const route = useRoute()
const router = useRouter()
const openTabs = ref([])
const tabSeq = ref(0)
const activeTabId = ref('')
const TAB_STORAGE_KEY = 'acasa:tabs:v1'

const navItems = Object.values(NAV_SCHEMA).flat().filter((item) => item?.to && !item?.divider)

const activeRouteKey = computed(() => route.fullPath || route.path)

function makeTabKey(routeKey) {
  tabSeq.value += 1
  return `${routeKey}::${Date.now()}::${tabSeq.value}`
}

function persistTabs() {
  try {
    localStorage.setItem(
      TAB_STORAGE_KEY,
      JSON.stringify({
        openTabs: openTabs.value,
        activeTabId: activeTabId.value,
      }),
    )
  } catch (_) {
    // ignore storage write errors (private mode/quota)
  }
}

function restoreTabs() {
  try {
    const raw = localStorage.getItem(TAB_STORAGE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed?.openTabs) ? parsed.openTabs : []

    openTabs.value = list
      .filter((tab) => tab && typeof tab === 'object')
      .map((tab) => ({
        key: String(tab.key || makeTabKey(String(tab.routeKey || tab.to || '/'))),
        routeKey: String(tab.routeKey || tab.to || '/'),
        title: cleanLabel(tab.title || tab.routeKey || 'Pagina'),
        to: String(tab.to || tab.routeKey || '/'),
      }))
      .slice(-15)

    activeTabId.value = String(parsed?.activeTabId || '')
  } catch (_) {
    // ignore storage parse errors
  }
}

function cleanLabel(label) {
  const raw = repairLegacyMojibake(String(label || '').trim())
  return raw.replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Pagina'
}

function repairLegacyMojibake(text) {
  const value = String(text || '')
  if (!/[Ãâð]/.test(value)) return value
  try {
    // Corrige strings salvas no passado em latin1 exibidas como UTF-8 (ex.: JoÃ£o -> João)
    return decodeURIComponent(escape(value))
  } catch (_) {
    return value
  }
}

function splitRouteTo(to) {
  const [path, query = ''] = String(to || '').split('?')
  const params = new URLSearchParams(query)
  return { path: path || '/', params }
}

function resolveTabTitle(currentRoute) {
  if (currentRoute?.path === '/agendamentos') {
    const visao = String(currentRoute?.query?.visao || '').toUpperCase()
    if (visao === 'GERAL') return 'Agenda Geral'
  }

  let candidate = null
  for (const item of navItems) {
    const parsed = splitRouteTo(item.to)
    if (parsed.path !== currentRoute.path) continue

    const expects = Array.from(parsed.params.entries())
    const queryMatches = expects.every(([key, value]) => String(currentRoute?.query?.[key] || '') === value)
    if (queryMatches) return cleanLabel(item.label)
    if (!candidate) candidate = cleanLabel(item.label)
  }

  if (candidate) return candidate
  return cleanLabel(currentRoute?.meta?.title || currentRoute?.name || currentRoute?.path)
}

function upsertTab(currentRoute) {
  if (currentRoute?.meta?.public) return

  const routeKey = currentRoute.fullPath || currentRoute.path
  const to = routeKey
  const title = resolveTabTitle(currentRoute)
  const matchingIndexes = openTabs.value
    .map((tab, index) => (tab.routeKey === routeKey ? index : -1))
    .filter((index) => index >= 0)

  if (matchingIndexes.length) {
    openTabs.value = openTabs.value.map((tab) => (
      tab.routeKey === routeKey ? { ...tab, title, to } : tab
    ))
    const lastMatching = openTabs.value[matchingIndexes[matchingIndexes.length - 1]]
    activeTabId.value = lastMatching?.key || activeTabId.value
    persistTabs()
    return
  }

  const key = makeTabKey(routeKey)
  openTabs.value.push({ key, routeKey, title, to })
  activeTabId.value = key
  if (openTabs.value.length > 15) {
    openTabs.value.shift()
  }
  persistTabs()
}

function goToTab(tab) {
  if (!tab?.to) return
  activeTabId.value = tab.key
  if (tab.to === route.fullPath) return
  router.push(tab.to)
}

function closeTab(tab, index) {
  if (openTabs.value.length <= 1) return

  const isActive = tab.key === activeTabId.value
  openTabs.value.splice(index, 1)
  persistTabs()

  if (!isActive) return

  const fallback = openTabs.value[index] || openTabs.value[index - 1]
  if (!fallback?.to) return

  activeTabId.value = fallback.key
  if (fallback.to !== route.fullPath) router.push(fallback.to)
  persistTabs()
}

function duplicateTab(to) {
  const resolved = router.resolve(to || route.fullPath)
  const routeKey = resolved.fullPath || route.fullPath
  const currentLikeRoute = {
    path: resolved.path || route.path,
    query: resolved.query || route.query,
    meta: route.meta,
    name: resolved.name || route.name,
  }
  const title = resolveTabTitle(currentLikeRoute)
  const key = makeTabKey(routeKey)

  openTabs.value.push({ key, routeKey, title, to: routeKey })
  activeTabId.value = key

  if (openTabs.value.length > 15) {
    openTabs.value.shift()
    if (!openTabs.value.some((tab) => tab.key === activeTabId.value)) {
      activeTabId.value = openTabs.value[openTabs.value.length - 1]?.key || ''
    }
  }

  if (route.fullPath !== routeKey) {
    router.push(routeKey)
  }
  persistTabs()
}

function handleDuplicateTabEvent(event) {
  duplicateTab(event?.detail?.to)
}

watch(
  () => route.fullPath,
  () => {
    upsertTab(route)
    persistTabs()
  },
  { immediate: true },
)

onMounted(() => {
  restoreTabs()
  if (openTabs.value.length) {
    const current = openTabs.value.find((tab) => tab.routeKey === route.fullPath)
    if (current) {
      activeTabId.value = current.key
    } else {
      upsertTab(route)
    }
  } else {
    upsertTab(route)
  }

  window.addEventListener('acasa-tabs-duplicate-current', handleDuplicateTabEvent)
})

onUnmounted(() => {
  window.removeEventListener('acasa-tabs-duplicate-current', handleDuplicateTabEvent)
})
</script>


