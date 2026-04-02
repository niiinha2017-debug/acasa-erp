<template>
  <div
    class="default-layout h-screen w-screen overflow-hidden flex flex-col bg-bg-card text-text-main transition-colors duration-300"
    :class="{
      'default-layout--compact-chrome': isCompactChrome,
      'default-layout--planta2d-immersive': hideChromeMedicaoImmersivo,
    }"
  >
    <!-- Header unificado: Menu + Abas (mesma cor de fundo, sem espaço entre eles) -->
    <header
      v-show="!hideChromeMedicaoImmersivo"
      class="default-layout__header flex-shrink-0 flex flex-col pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      :class="{ 'default-layout__header--compact': isCompactChrome }"
    >
      <Menu />
      <!-- Barra de abas colada ao Menu -->
      <div v-if="showTabs" class="ds-tab-strip" :class="{ 'ds-tab-strip--compact': isCompactChrome }">
        <div class="ds-tab-strip__scroller overflow-x-auto custom-scroll -mb-px">
          <div class="ds-tab-strip__tabs flex items-center min-w-max">
            <div
              v-for="(tab, index) in openTabs"
              :key="tab.key"
              class="ds-tab-chip group text-xs font-medium"
              :class="{ 'is-active': activeTabId === tab.key }"
            >
              <button
                type="button"
                class="ds-tab-chip__button flex-1 text-left truncate focus:outline-none focus:ring-0"
                @click="goToTab(tab)"
              >
                {{ tab.title }}
              </button>
              <button
                type="button"
                class="ds-tab-chip__close flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
    </header>
    <!-- Área de conteúdo: único scroll da página -->
    <div
      class="default-layout__content flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-[env(safe-area-inset-bottom)]"
      :class="{
        'default-layout__content--immersive': isImmersiveContent,
        'default-layout__content--planta2d-chrome': hideChromeMedicaoImmersivo,
      }"
    >
      <PageShell :contained="false" :padded="false">
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
const isAgendaFullscreen = computed(() => {
  const p = route.path
  return p === '/agendamentos' || p.startsWith('/agendamentos/')
})
/** Visualizador de arquivos: modo immersive mas mantém abas visíveis. */
const isArquivoViewer = computed(() => {
  const p = route.path
  return p.startsWith('/arquivos/') && !p.startsWith('/arquivos/importacao')
})
/** Ativa layout immersive (sem overflow externo) para medição e visualizador. */
const isImmersiveContent = computed(() => isArquivoViewer.value)
const hideChromeMedicaoImmersivo = computed(() => false)
const isCompactChrome = computed(() => isAgendaFullscreen.value)
const showTabs = computed(() => !isAgendaFullscreen.value)
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

function normalizeRouteKey(currentRoute) {
  const path = currentRoute?.path || '/'

  // Nessas telas, a query representa estado interno do filtro e não deve abrir uma nova aba.
  if (path === '/rh/ponto/relatorio') return path

  return currentRoute?.fullPath || path
}

const activeRouteKey = computed(() => normalizeRouteKey(route))

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
  if (!currentRoute?.path) return 'Página'

  if (currentRoute.path === '/agendamentos' || currentRoute.path === '/agenda-geral') {
    return 'Agenda Operacional'
  }

  let candidate = null
  for (const item of navItems) {
    const parsed = splitRouteTo(item.to)
    if (parsed.path !== currentRoute.path) continue

    const expects = Array.from(parsed.params.entries())
    const query = currentRoute.query ?? {}
    const queryMatches = expects.every(([key, value]) => String(query[key] || '') === value)
    if (queryMatches) return cleanLabel(item.label)
    if (!candidate) candidate = cleanLabel(item.label)
  }

  if (candidate) return candidate
  return cleanLabel(currentRoute?.meta?.title || currentRoute?.name || currentRoute?.path)
}

function upsertTab(currentRoute) {
  if (!currentRoute?.path) return
  if (currentRoute?.meta?.public) return

  const routeKey = normalizeRouteKey(currentRoute)
  const to = currentRoute.fullPath || currentRoute.path
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
  if (tab.routeKey === activeRouteKey.value) return
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
  const to = event?.detail?.to || '/clientes'
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
    const current = openTabs.value.find((tab) => tab.routeKey === activeRouteKey.value)
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
