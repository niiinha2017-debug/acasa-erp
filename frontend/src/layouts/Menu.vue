<template>
  <nav class="menu-bar w-full transition-colors duration-300 overflow-visible z-[9990]">
    <div ref="shellRef" class="ds-nav-shell menu-shell min-w-0 max-w-full" :class="{ 'is-collapsed': usarMenuCompacto }">
      <!-- ESQUERDA: Logo + Pílula de menus (PC) ou hamburger (celular/tablet) -->
      <div class="flex items-center justify-start min-w-0 flex-1 overflow-visible">
        <RouterLink ref="brandRef" to="/agenda-geral" class="flex items-center gap-0 min-w-0 flex-shrink-0 transition-opacity hover:opacity-90">
          <div class="ds-nav-brand-mark flex-shrink-0" aria-hidden="true">
            A
          </div>
          <div class="flex flex-col leading-tight pl-1 sm:pl-1.5 min-w-0 max-w-[120px] sm:max-w-none">
            <span class="font-bold text-xs sm:text-[13px] md:text-sm tracking-tight text-slate-900 dark:text-white truncate">Casa</span>
            <span class="hidden sm:block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">Móveis planejados</span>
            <span class="hidden md:block text-[8px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">v{{ appVersion }}</span>
          </div>
        </RouterLink>

        <!-- Pílula de menus: notebook e desktop (md+), com scroll horizontal se necessário -->
        <div v-if="!deveOcultarMenu" ref="desktopNavRef" class="menu-desktop-nav menu-scroll-area flex-1 min-w-0 ml-4 md:ml-6 overflow-x-auto custom-scroll">
          <div ref="desktopPillRef" class="ds-nav-pill flex items-center gap-x-2 xl:gap-x-4 flex-shrink-0">
            <template v-for="section in NAV_VISIVEL" :key="section.key">
              <NavMenu
                :label="section.label"
                :eyebrow="section.eyebrow"
                :description="section.description"
                :items="section.items"
              />
            </template>
          </div>
        </div>

        <!-- Botão menu (hamburger): só em celular (abaixo de md) -->
        <button
          v-if="!deveOcultarMenu"
          type="button"
          class="menu-mobile-toggle ds-nav-icon-button touch-manipulation flex-shrink-0 ml-1 sm:ml-2"
          aria-label="Abrir menu"
          @click="isMobileMenuOpen = true"
        >
          <i class="pi pi-bars text-base sm:text-lg"></i>
        </button>
      </div>

      <!-- DIREITA: Usuário + ícones -->
      <div ref="actionsRef" class="flex items-center gap-x-1.5 sm:gap-x-2.5 flex-shrink-0">
        <span
          v-if="nomeUsuarioLogado"
          ref="userNameRef"
          class="hidden sm:inline text-xs md:text-[13px] font-medium text-slate-600 dark:text-slate-400 truncate"
          :class="usarNomeCompacto ? 'max-w-[72px] md:max-w-[88px]' : 'max-w-[100px] md:max-w-[140px]'"
          :title="nomeUsuarioLogado"
        >
          {{ nomeUsuarioExibicao }}
        </span>
        <span v-if="nomeUsuarioLogado" ref="userNameMeasureRef" class="menu-user-measure text-xs md:text-[13px] font-medium">{{ nomeUsuarioLogado }}</span>
        <span v-if="nomeUsuarioLogado" ref="userNameCompactMeasureRef" class="menu-user-measure text-xs md:text-[13px] font-medium">{{ nomeUsuarioCompacto }}</span>
        <button
          @click="toggleDark()"
          class="ds-nav-icon-button touch-manipulation"
          title="Alternar tema"
        >
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-xs"></i>
        </button>
        <button
          @click="handleLogout"
          class="ds-nav-icon-button ds-nav-icon-button--danger hidden md:flex"
          title="Sair"
        >
          <i class="pi pi-power-off text-xs"></i>
        </button>
      </div>
    </div>

    <!-- MENU MOBILE DRAWER: Teleport no body para nunca ficar atrás de formulários (Android/WebView) -->
    <Teleport to="body">
      <transition name="slide-right">
        <div
          v-if="isMobileMenuOpen"
          class="menu-drawer-overlay fixed inset-0 z-[99998]"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isMobileMenuOpen = false" aria-hidden="true"></div>
          <div class="absolute right-0 top-0 bottom-0 flex flex-col shadow-2xl w-[85vw] max-w-[320px] sm:max-w-[360px] md:max-w-[400px] max-h-[100dvh]" :class="drawerSubmenuItem ? 'sm:max-w-[420px] md:max-w-[520px]' : ''">
            <div class="flex flex-1 min-h-0 min-w-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
              <!-- Coluna principal do menu: min-h-0 para o flex permitir scroll no filho -->
              <div class="flex flex-col flex-1 min-h-0 w-full min-w-0 overflow-hidden" :class="drawerSubmenuItem ? 'border-r border-slate-200 dark:border-slate-700' : ''">
                <!-- HEADER DO DRAWER -->
                <div class="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Menu</span>
                    <button type="button" @click="isMobileMenuOpen = false" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 touch-manipulation" aria-label="Fechar menu">
                      <i class="pi pi-times text-sm"></i>
                    </button>
                  </div>
                  <p v-if="nomeUsuarioLogado" class="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                    {{ nomeUsuarioLogado }}
                  </p>
                </div>

                <!-- ITENS DO MENU: min-h-0 + overflow-y-auto para scroll funcionar em telas pequenas -->
                <div v-if="!deveOcultarMenu" class="menu-scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-2 overscroll-contain custom-scroll touch-pan-y">
                  <div v-for="section in NAV_VISIVEL" :key="section.key" class="space-y-2">
                    <div class="px-3 pt-4 first:pt-0">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{{ section.eyebrow || 'Navegacao' }}</p>
                      <div class="mt-1 flex items-center justify-between gap-3">
                        <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ section.label }}</p>
                        <span v-if="section.description" class="text-[11px] leading-4 text-slate-500 dark:text-slate-400 text-right max-w-[12rem]">{{ section.description }}</span>
                      </div>
                    </div>
                    <template v-for="item in section.items.filter(i => !i.divider)" :key="item.to || item.label || item.heading">
                      <p
                        v-if="item.heading"
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5 mt-2 first:mt-0"
                      >
                        {{ item.heading }}
                      </p>
                      <button
                        v-else-if="item.children?.length && filhosVisiveis(item).length"
                        type="button"
                        class="w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-slate-600 dark:text-slate-300 text-sm active:bg-slate-200 dark:active:bg-slate-700 transition-colors cursor-pointer touch-manipulation min-w-0 text-left"
                        :class="[
                          item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                          {
                            'bg-slate-100 dark:bg-slate-800': drawerSubmenuItem === item,
                            'ring-1 ring-slate-200 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/60': navState(item).isActive,
                          },
                        ]"
                        @click="drawerSubmenuItem = drawerSubmenuItem === item ? null : item"
                      >
                        <i :class="['pi', item.icon]" class="text-xs opacity-70 w-4 flex-shrink-0"></i>
                        <span class="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span class="break-words line-clamp-2 font-medium text-slate-800 dark:text-slate-100">{{ item.label }}</span>
                          <span v-if="item.description" class="text-[11px] leading-4 text-slate-500 dark:text-slate-400 line-clamp-2">{{ item.description }}</span>
                        </span>
                        <span v-if="navState(item).isActive" class="shrink-0 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white dark:bg-slate-100 dark:text-slate-900">Atual</span>
                        <i class="pi pi-chevron-right text-xs opacity-60 flex-shrink-0"></i>
                      </button>
                      <a
                        v-else-if="item.to"
                        href="#"
                        class="flex items-start gap-3 px-3 py-3 rounded-2xl text-slate-600 dark:text-slate-300 text-sm active:bg-slate-200 dark:active:bg-slate-600 transition-colors cursor-pointer touch-manipulation min-w-0"
                        :class="[
                          item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                          { 'ring-1 ring-slate-200 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/60': navState(item).isActive },
                        ]"
                        @click.prevent="handleMobileNav(item.to)"
                      >
                        <i :class="['pi', item.icon]" class="text-xs opacity-70 w-4 flex-shrink-0"></i>
                        <span class="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span class="break-words line-clamp-2 font-medium text-slate-800 dark:text-slate-100">{{ item.label }}</span>
                          <span v-if="item.description" class="text-[11px] leading-4 text-slate-500 dark:text-slate-400 line-clamp-2">{{ item.description }}</span>
                        </span>
                        <span v-if="navState(item).isActive" class="shrink-0 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white dark:bg-slate-100 dark:text-slate-900">Atual</span>
                      </a>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Lista lateral: subitens (ex.: RH → Horas extras, Fechamento de ponto) -->
              <transition name="slide-left">
                <div v-if="drawerSubmenuItem" class="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
                  <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button type="button" @click="drawerSubmenuItem = null" class="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 touch-manipulation" aria-label="Voltar">
                      <i class="pi pi-chevron-left text-sm"></i>
                    </button>
                    <span class="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">{{ drawerSubmenuItem.label }}</span>
                  </div>
                  <div class="menu-scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scroll touch-pan-y">
                    <template v-for="(child, childIdx) in filhosVisiveis(drawerSubmenuItem)" :key="child.divider ? `div-${childIdx}` : (child.to || childIdx)">
                      <hr v-if="child.divider" class="my-1 border-slate-200 dark:border-slate-700" />
                      <a
                        v-else
                        href="#"
                        class="flex items-start gap-3 px-3 py-3 rounded-2xl text-slate-600 dark:text-slate-300 text-sm active:bg-slate-200 dark:active:bg-slate-600 transition-colors cursor-pointer touch-manipulation"
                        :class="[
                          child.etapaKey ? getStatusHoverBgClass(child.etapaKey) : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                          { 'ring-1 ring-slate-200 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/60': navState(child).isActive },
                        ]"
                        @click.prevent="handleMobileNav(child.to)"
                      >
                        <i :class="['pi', child.icon]" class="text-xs opacity-70 w-4 flex-shrink-0"></i>
                        <span class="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span class="break-words line-clamp-2 font-medium text-slate-800 dark:text-slate-100">{{ child.label }}</span>
                          <span v-if="child.description" class="text-[11px] leading-4 text-slate-500 dark:text-slate-400 line-clamp-2">{{ child.description }}</span>
                        </span>
                        <span v-if="navState(child).isActive" class="shrink-0 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white dark:bg-slate-100 dark:text-slate-900">Atual</span>
                      </a>
                    </template>
                  </div>
                </div>
              </transition>
            </div>

            <!-- FOOTER DO DRAWER -->
            <div class="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              <button
                type="button"
                @click="handleLogout"
                class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-red-500 text-xs font-medium border border-red-300 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 active:opacity-90 transition-colors touch-manipulation"
              >
                <i class="pi pi-power-off text-xs"></i>
                Sair
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { can } from '@/services/permissions'
import { useRoute, useRouter } from 'vue-router'
import { NAV_SCHEMA, NAV_SECTION_META, getNavItemState } from '@/services/navigation'
import { PermissoesService } from '@/services/index'
import { getStatusHoverBgClass } from '@/constantes'
import storage from '@/utils/storage'
import { useDark, useToggle } from '@vueuse/core'

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'

const route = useRoute()
const router = useRouter()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  storageKey: 'acasa-color-scheme',
})
const toggleDark = useToggle(isDark)
const isMobileMenuOpen = ref(false)
const drawerSubmenuItem = ref(null)
const usarMenuCompacto = ref(false)
const usarNomeCompacto = ref(false)
const shellRef = ref(null)
const brandRef = ref(null)
const desktopNavRef = ref(null)
const desktopPillRef = ref(null)
const actionsRef = ref(null)
const userNameRef = ref(null)
const userNameMeasureRef = ref(null)
const userNameCompactMeasureRef = ref(null)
let layoutResizeObserver = null

const nomeUsuarioLogado = computed(() => {
  const user = storage.getUser()
  if (!user) return ''
  return (user.nome || user.usuario || user.email || '').trim() || ''
})

const nomeUsuarioCompacto = computed(() => {
  const nome = String(nomeUsuarioLogado.value || '').trim()
  if (!nome) return ''

  if (nome.includes('@')) {
    return nome.split('@')[0]
  }

  const partes = nome.split(/\s+/).filter(Boolean)
  if (partes.length <= 2) return partes.join(' ')
  return `${partes[0]} ${partes[1]}`
})

const nomeUsuarioExibicao = computed(() => (
  usarNomeCompacto.value ? nomeUsuarioCompacto.value : nomeUsuarioLogado.value
))

/** Usuário com senha provisória não vê o menu (fica só na tela de troca); ocultar itens de navegação. */
const deveOcultarMenu = computed(() => {
  const user = storage.getUser()
  return !!user?.precisa_trocar_senha || String(user?.status || '').toUpperCase() !== 'ATIVO'
})
const menuSections = ref([])

const handleLogout = () => {
  isMobileMenuOpen.value = false
  storage.removeToken()
  storage.removeUser()
  router.push('/login')
}

const limparDivisores = (items = []) => {
  const out = []
  for (const it of items) {
    if (it.divider) {
      if (!out.length) continue
      if (out[out.length - 1]?.divider) continue
      out.push(it)
      continue
    }
    out.push(it)
  }
  while (out.length && out[out.length - 1]?.divider) out.pop()
  return out
}

function filhosVisiveis(item) {
  const list = item.children || []
  return list.filter((child) => {
    if (!child.perm) return true
    return Array.isArray(child.perm) ? child.perm.some((p) => can(p)) : can(child.perm)
  })
}

const filtrarItens = (items = []) => {
  const filtrados = items.filter((i) => {
    if (i.divider) return true
    if (i.heading) return true
    if (i.children?.length) return filhosVisiveis(i).length > 0
    if (!i.perm) return true
    return Array.isArray(i.perm) ? i.perm.some((p) => can(p)) : can(i.perm)
  })
  return limparDivisores(filtrados)
}

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
  drawerSubmenuItem.value = null
})
watch(isMobileMenuOpen, (open) => {
  if (!open) drawerSubmenuItem.value = null
})

const fallbackSections = computed(() =>
  Object.entries(NAV_SCHEMA).map(([key, items]) => ({
    key,
    label: NAV_SECTION_META[key]?.label || key,
    eyebrow: NAV_SECTION_META[key]?.eyebrow || 'Navegacao',
    description: NAV_SECTION_META[key]?.description || '',
    items,
  })),
)

const NAV_VISIVEL = computed(() => {
  // Usa sempre o menu local (Comercial / Produção)
  const source = fallbackSections.value

  const filtrado = source
    .map((section) => ({
      ...section,
      items: filtrarItens(section.items || []),
    }))
    .filter((section) => section.items.some((i) => !i.divider))

  // Só mostra menu completo para admin quando filtrado vier vazio (ex.: bug). Vendedor vê só o que tem permissão.
  const user = storage.getUser()
  const isAdmin = user?.is_admin === true || (Array.isArray(user?.permissoes) && user.permissoes.includes('ADMIN'))
  if (!filtrado.length && !isAdmin) return []
  if (!filtrado.length) return source

  return filtrado
})

watch(() => NAV_VISIVEL.value, async () => {
  await nextTick()
  updateMenuLayout()
}, { deep: true })

const handleMobileNav = (to) => {
  isMobileMenuOpen.value = false
  const target = router.resolve(to).fullPath
  if (target === route.fullPath) {
    window.dispatchEvent(new CustomEvent('acasa-tabs-duplicate-current', { detail: { to: target } }))
    return
  }
  router.push(target)
}

function navState(item) {
  return getNavItemState(item, route)
}

function updateMenuLayout() {
  if (deveOcultarMenu.value) {
    usarMenuCompacto.value = false
    usarNomeCompacto.value = false
    return
  }

  const shellWidth = shellRef.value?.clientWidth || 0
  const brandWidth = brandRef.value?.$el?.offsetWidth || brandRef.value?.offsetWidth || 0
  const actionsWidth = actionsRef.value?.offsetWidth || 0
  const currentVisibleNameWidth = userNameRef.value?.offsetWidth || 0
  const actionsBaseWidth = Math.max(0, actionsWidth - currentVisibleNameWidth)
  const navWidth = desktopPillRef.value?.scrollWidth || desktopNavRef.value?.scrollWidth || 0
  const fullNameWidth = userNameMeasureRef.value?.offsetWidth || currentVisibleNameWidth
  const compactNameWidth = userNameCompactMeasureRef.value?.offsetWidth || Math.min(fullNameWidth, 88)
  const reserveWidth = 84

  if (!shellWidth || !navWidth) {
    usarNomeCompacto.value = false
    usarMenuCompacto.value = shellWidth > 0 && shellWidth < 1180
    return
  }

  const requiredWithFullName = brandWidth + actionsBaseWidth + navWidth + fullNameWidth + reserveWidth
  const requiredWithCompactName = brandWidth + actionsBaseWidth + navWidth + compactNameWidth + reserveWidth

  if (shellWidth >= requiredWithFullName) {
    usarNomeCompacto.value = false
    usarMenuCompacto.value = false
    return
  }

  if (shellWidth >= requiredWithCompactName) {
    usarNomeCompacto.value = true
    usarMenuCompacto.value = false
    return
  }

  usarNomeCompacto.value = false
  usarMenuCompacto.value = true
}

const carregarMenu = async () => {
  if (!storage.getToken() || route.path === '/login') return
  try {
    const res = await PermissoesService.menu()
    const data = res?.data ?? res
    menuSections.value = Array.isArray(data) ? data : []
  } catch (e) {
    menuSections.value = []
  }
}

onMounted(() => {
  carregarMenu()
  nextTick(updateMenuLayout)
  window.addEventListener('resize', updateMenuLayout)

  if (typeof ResizeObserver !== 'undefined') {
    layoutResizeObserver = new ResizeObserver(() => updateMenuLayout())
    if (shellRef.value) layoutResizeObserver.observe(shellRef.value)
    if (actionsRef.value) layoutResizeObserver.observe(actionsRef.value)
    if (desktopNavRef.value) layoutResizeObserver.observe(desktopNavRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMenuLayout)
  layoutResizeObserver?.disconnect()
})
</script>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }
.slide-left-enter-active, .slide-left-leave-active { transition: all 0.2s ease; }
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(10px); opacity: 0; }
.menu-desktop-nav {
  display: flex;
}
.menu-mobile-toggle {
  display: none;
}
.menu-shell.is-collapsed .menu-desktop-nav {
  position: absolute;
  left: -9999px;
  top: 0;
  opacity: 0;
  pointer-events: none;
}
.menu-shell.is-collapsed .menu-mobile-toggle {
  display: inline-flex;
}
.menu-user-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
  inset-inline-start: -9999px;
  inset-block-start: 0;
}
.menu-scroll-area {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.menu-scroll-area::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
/* Garante scroll por toque no drawer em telas pequenas */
.menu-drawer-overlay .overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
</style>
