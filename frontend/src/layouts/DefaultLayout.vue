<template>
  <div class="pt-16 min-h-screen bg-slate-100 dark:bg-slate-950 text-text-main transition-colors duration-300">
    <Menu />
    <!-- Área de conteúdo com stacking context explícito para o menu fixo ficar sempre por cima (Android/WebView/landscape) -->
    <div class="relative z-0 isolation-isolate">
      <!-- Barra de abas abertas -->
      <div class="border-b border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/50 backdrop-blur-sm">
        <div class="px-4 md:px-6 overflow-x-auto custom-scroll">
          <div class="flex items-center gap-1.5 py-2.5 min-w-max">
            <div
              v-for="(tab, index) in openTabs"
              :key="tab.key"
              class="group flex items-center gap-0 rounded-lg text-xs font-medium transition-all duration-200 overflow-hidden min-w-0 max-w-[180px] sm:max-w-[220px]"
              :class="activeTabId === tab.key
                ? 'bg-brand-primary/12 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-primary shadow-sm ring-1 ring-brand-primary/25 dark:ring-brand-primary/30'
                : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-800 dark:hover:text-slate-200'"
            >
              <button
                type="button"
                class="flex-1 px-3 py-2 text-left truncate focus:outline-none focus:ring-0"
                @click="goToTab(tab)"
              >
                {{ tab.title }}
              </button>
              <button
                type="button"
                class="flex-shrink-0 p-1.5 rounded-md transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-600/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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

function flattenNavItems() {
  const out = []
  for (const items of Object.values(NAV_SCHEMA)) {
    for (const item of items || []) {
      if (item?.divider) continue
      if (item?.children?.length) {
        for (const child of item.children) {
          if (child?.to) out.push(child)
        }
      } else if (item?.to) {
        out.push(item)
      }
    }
  }
  return out
}
const navItems = flattenNavItems()

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
    // Corrige strings legadas salvas em latin1 e exibidas como UTF-8.
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
  if (currentRoute?.path === '/agendamentos/loja') {
    return 'Agenda Loja'
  }
  if (currentRoute?.path === '/agendamentos/fabrica') {
    return 'Agenda Fábrica'
  }
  if (currentRoute?.path === '/agendamentos') {
    const visao = String(currentRoute?.query?.visao || '').toUpperCase()
    if (visao === 'GERAL') return 'Agenda Geral'
    if (visao === 'LOJA') return 'Agenda Loja'
    if (visao === 'FABRICA' || visao === 'PRODUCAO') return 'Agenda Fábrica'
    return 'Agenda Loja'
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

/** Fecha a aba atual e navega para o path (ex.: após salvar orçamento). */
function handleCloseCurrentTabAndGo(event) {
  const to = event?.detail?.to || '/orcamentos'
  const idx = openTabs.value.findIndex((tab) => tab.key === activeTabId.value)
  if (openTabs.value.length <= 1) {
    router.push(to)
    return
  }
  if (idx >= 0) {
    openTabs.value.splice(idx, 1)
    persistTabs()
  }
  const existing = openTabs.value.find((tab) => tab.to === to || tab.routeKey === to)
  if (existing) {
    activeTabId.value = existing.key
    if (route.fullPath !== to) router.push(to)
  } else {
    router.push(to)
  }
  persistTabs()
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
  window.addEventListener('acasa-close-current-tab-and-go', handleCloseCurrentTabAndGo)
})

onUnmounted(() => {
  window.removeEventListener('acasa-tabs-duplicate-current', handleDuplicateTabEvent)
  window.removeEventListener('acasa-close-current-tab-and-go', handleCloseCurrentTabAndGo)
})
</script>


