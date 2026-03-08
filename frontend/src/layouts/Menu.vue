<template>
  <nav class="menu-bar w-full min-h-[4rem] h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm fixed top-0 left-0 right-0 z-[9990] transition-colors duration-300 overflow-visible pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
    <div class="h-full min-w-0 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2">
      
      <!-- LOGO E MARCA (A Casa Móveis Planejados) -->
      <RouterLink to="/agendamentos/loja" class="flex items-center gap-0 min-w-0 flex-shrink transition-opacity hover:opacity-90">
        <!-- Bloco azul com "A" (como no logo) -->
        <div class="w-8 h-10 sm:h-11 flex-shrink-0 bg-[#2563a8] flex items-center justify-center text-white font-bold text-lg sm:text-xl tracking-tight rounded-none shadow-sm" aria-hidden="true">
          A
        </div>
        <div class="flex flex-col leading-tight pl-2 min-w-0">
          <span class="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white truncate">Casa</span>
          <span class="hidden sm:block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">Móveis planejados</span>
          <span class="hidden sm:block text-[8px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">v{{ appVersion }}</span>
        </div>
      </RouterLink>

      <!-- MENU DESKTOP/TABLET (oculto quando usuário está com senha provisória) -->
      <div v-if="!deveOcultarMenu" class="hidden md:flex items-center gap-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 px-2 py-1.5 shadow-sm">
        <template v-for="(section, index) in NAV_VISIVEL" :key="section.key">
          <NavMenu
            :label="section.label"
            :items="section.items"
          />
        </template>
      </div>

      <!-- BOTÃO MENU MOBILE (hamburger) – visível só quando o menu desktop está oculto -->
      <button
        v-if="!deveOcultarMenu"
        type="button"
        class="md:hidden flex items-center justify-center w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:bg-slate-200 dark:active:bg-slate-700 transition-colors touch-manipulation"
        aria-label="Abrir menu"
        @click="isMobileMenuOpen = true"
      >
        <i class="pi pi-bars text-lg"></i>
      </button>

      <!-- NOME DO USUÁRIO LOGADO + AÇÕES -->
      <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <span
          v-if="nomeUsuarioLogado"
          class="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px] lg:max-w-[140px]"
          :title="nomeUsuarioLogado"
        >
          {{ nomeUsuarioLogado }}
        </span>
        <!-- TOGGLE TEMA -->
        <button
          @click="toggleDark()" 
          class="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all"
          title="Alternar tema"
        >
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-sm"></i>
        </button>

        <!-- LOGOUT DESKTOP -->
        <button
          v-if="showUpdateButton"
          type="button"
          @click="verificarAtualizacao"
          :disabled="checkingUpdate"
          class="hidden lg:flex items-center justify-center gap-1.5 w-auto px-2.5 h-9 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-xs font-medium"
          title="Verificar e instalar atualização do aplicativo"
        >
          <i class="pi pi-download text-sm" aria-hidden="true"></i>
          <span>{{ checkingUpdate ? 'Verificando...' : 'Atualizar app' }}</span>
        </button>
        <button
          @click="handleLogout" 
          class="hidden lg:flex items-center justify-center w-9 h-9 text-red-500 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          title="Sair"
        >
          <i class="pi pi-power-off text-sm"></i>
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
          <div class="absolute right-0 top-0 bottom-0 flex flex-col shadow-2xl" :class="drawerSubmenuItem ? 'w-[min(520px,calc(100vw-2rem))] max-w-[520px]' : 'w-[min(320px,calc(100vw-2rem))] max-w-[320px]'">
            <div class="flex flex-1 min-w-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
              <!-- Coluna principal do menu -->
              <div class="flex flex-col flex-shrink-0 w-[min(320px,100%)]" :class="drawerSubmenuItem ? 'border-r border-slate-200 dark:border-slate-700' : ''">
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

                <!-- ITENS DO MENU (oculto quando senha provisória) -->
                <div v-if="!deveOcultarMenu" class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 overscroll-contain">
                  <div v-for="section in NAV_VISIVEL" :key="section.key" class="space-y-2">
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 px-3 mt-4 mb-2">{{ section.label }}</p>
                    <template v-for="item in section.items.filter(i => !i.divider)" :key="item.to || item.label">
                      <button
                        v-if="item.children?.length && filhosVisiveis(item).length"
                        type="button"
                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm active:bg-slate-200 dark:active:bg-slate-700 transition-colors cursor-pointer touch-manipulation min-w-0 text-left"
                        :class="[item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-slate-100 dark:hover:bg-slate-800', { 'bg-slate-100 dark:bg-slate-800': drawerSubmenuItem === item }]"
                        @click="drawerSubmenuItem = drawerSubmenuItem === item ? null : item"
                      >
                        <i :class="item.icon" class="text-xs opacity-70 w-4 flex-shrink-0"></i>
                        <span class="break-words line-clamp-2 flex-1">{{ item.label }}</span>
                        <i class="pi pi-chevron-right text-xs opacity-60 flex-shrink-0"></i>
                      </button>
                      <a
                        v-else-if="item.to"
                        href="#"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm active:bg-slate-200 dark:active:bg-slate-600 transition-colors cursor-pointer touch-manipulation min-w-0"
                        :class="item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-slate-100 dark:hover:bg-slate-800'"
                        @click.prevent="handleMobileNav(item.to)"
                      >
                        <i :class="item.icon" class="text-xs opacity-70 w-4 flex-shrink-0"></i>
                        <span class="break-words line-clamp-2">{{ item.label }}</span>
                      </a>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Lista lateral: subitens (ex.: RH → Horas extras, Fechamento de ponto) -->
              <transition name="slide-left">
                <div v-if="drawerSubmenuItem" class="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-800/30">
                  <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button type="button" @click="drawerSubmenuItem = null" class="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 touch-manipulation" aria-label="Voltar">
                      <i class="pi pi-chevron-left text-sm"></i>
                    </button>
                    <span class="font-semibold text-sm text-slate-700 dark:text-slate-200">{{ drawerSubmenuItem.label }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1">
                    <template v-for="(child, childIdx) in filhosVisiveis(drawerSubmenuItem)" :key="child.divider ? `div-${childIdx}` : (child.to || childIdx)">
                      <hr v-if="child.divider" class="my-1 border-slate-200 dark:border-slate-700" />
                      <a
                        v-else
                        href="#"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm active:bg-slate-200 dark:active:bg-slate-600 transition-colors cursor-pointer touch-manipulation"
                        :class="child.etapaKey ? getStatusHoverBgClass(child.etapaKey) : 'hover:bg-slate-100 dark:hover:bg-slate-700'"
                        @click.prevent="handleMobileNav(child.to)"
                      >
                        <i :class="child.icon" class="text-xs opacity-70 w-4 flex-shrink-0"></i>
                        <span class="break-words line-clamp-2">{{ child.label }}</span>
                      </a>
                    </template>
                  </div>
                </div>
              </transition>
            </div>

            <!-- FOOTER DO DRAWER -->
            <div class="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 space-y-2">
              <button
                v-if="showUpdateButton"
                type="button"
                @click="verificarAtualizacao"
                :disabled="checkingUpdate"
                class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 active:opacity-90 transition-colors touch-manipulation disabled:opacity-60"
              >
                <i class="pi pi-download text-xs"></i>
                {{ checkingUpdate ? 'Verificando...' : 'Atualizar aplicativo' }}
              </button>
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
import { ref, computed, watch, onMounted } from 'vue'
import { can } from '@/services/permissions'
import { useRoute, useRouter } from 'vue-router'
import { NAV_SCHEMA } from '@/services/navigation'
import { PermissoesService } from '@/services/index'
import { getStatusHoverBgClass } from '@/constantes'
import storage from '@/utils/storage'
import { notify } from '@/services/notify'
import { checkAndroidUpdate } from '@/utils/check-android-update'
import { useDark, useToggle } from '@vueuse/core'

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'

const isTauri = computed(() => typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__))
const isCapacitorAndroid = ref(false)
const showUpdateButton = computed(() => isTauri.value || isCapacitorAndroid.value)
const checkingUpdate = ref(false)

async function verificarAtualizacao() {
  if (!showUpdateButton.value || checkingUpdate.value) return
  checkingUpdate.value = true
  try {
      if (isTauri.value) {
      const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'
      try {
        const res = await fetch('https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const serverVersion = data?.version || '?'
          notify.info(`Desktop: versão atual ${currentVersion} | servidor ${serverVersion}`)
        }
      } catch (_) {
        // ignore erro de debug de versão
      }

      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      if (update?.available) {
        notify.success(`Atualização ${update.version} disponível. Baixando e instalando...`)
        try {
          await update.downloadAndInstall()
          notify.success('Instalação concluída. Reiniciando o app...')
          window.location.reload()
        } catch (e) {
          console.error('[Menu downloadAndInstall]', e)
          notify.error('Download automático falhou. Abrindo a página para baixar manualmente.')
          const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
          const url = 'https://aplicativo.acasamarcenaria.com.br'
          if (tauri?.opener?.open) await tauri.opener.open(url)
          else if (typeof tauri?.opener?.openUrl === 'function') await tauri.opener.openUrl(url)
          else if (tauri?.shell?.open) await tauri.shell.open(url)
          else window.open(url, '_blank')
        }
      } else {
        notify.success('Você está na versão mais recente.')
      }
    } else {
      // Capacitor Android
      const result = await checkAndroidUpdate()
      if (!result.updateAvailable) {
        notify.success('Você está na versão mais recente.')
      }
    }
  } catch (err) {
    console.error('[Menu verificarAtualizacao]', err)
    const msg = err?.message || 'Não foi possível verificar atualização.'
    notify.error(msg)
    if (isTauri.value) {
      notify.info('Baixe a versão mais recente em aplicativo.acasamarcenaria.com.br')
    }
  } finally {
    checkingUpdate.value = false
  }
}

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

const nomeUsuarioLogado = computed(() => {
  const user = storage.getUser()
  if (!user) return ''
  return (user.nome || user.usuario || user.email || '').trim() || ''
})

/** Usuário com senha provisória não vê o menu (fica só na tela de troca); ocultar itens de navegação. */
const deveOcultarMenu = computed(() => {
  const user = storage.getUser()
  return !!user?.precisa_trocar_senha
})
const menuSections = ref([])

const SECTION_LABELS = {
  comercial: 'Comercial',
  producao: 'Produção',
  financeiro: 'Financeiro',
  cadastros: 'Cadastros',
  configuracoes: 'Configurações',
  relatorios: 'Relatórios',
}

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
    label: SECTION_LABELS[key] || key,
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

const handleMobileNav = (to) => {
  isMobileMenuOpen.value = false
  const target = router.resolve(to).fullPath
  if (target === route.fullPath) {
    window.dispatchEvent(new CustomEvent('acasa-tabs-duplicate-current', { detail: { to: target } }))
    return
  }
  router.push(target)
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

async function detectarCapacitorAndroid() {
  if (typeof window === 'undefined' || window.__TAURI__) return
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() === 'android') isCapacitorAndroid.value = true
  } catch {
    // não é ambiente Capacitor
  }
}

onMounted(() => {
  carregarMenu()
  detectarCapacitorAndroid()
})
</script>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }
.slide-left-enter-active, .slide-left-leave-active { transition: all 0.2s ease; }
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(10px); opacity: 0; }
</style>
