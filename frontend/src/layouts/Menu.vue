<template>
  <nav class="w-full h-16 bg-bg-card/90 backdrop-blur-xl border-b border-border-ui sticky top-0 z-[100] transition-colors duration-300">
    <div class="h-full px-4 md:px-6 flex items-center justify-between">
      
      <!-- LOGO E MARCA -->
      <RouterLink to="/agendamentos?visao=geral" class="flex items-center gap-3 transition-opacity hover:opacity-90">
        <div class="w-9 h-9 bg-gradient-to-br from-[#2f7fb3] to-[#255a82] flex items-center justify-center text-white rounded-xl shadow-sm">
          <i class="pi pi-box text-xs"></i>
        </div>
        <div class="hidden sm:flex flex-col leading-none">
          <span class="font-extrabold text-[13px] tracking-[0.14em] text-slate-900 dark:text-white">A Casa Marcenaria</span>
          <span class="text-[9px] font-medium text-slate-500 dark:text-slate-400">v{{ appVersion }}</span>
        </div>
      </RouterLink>

      <!-- MENU DESKTOP: a partir de lg (1024px); tablet em paisagem continua com hambúrguer -->
      <div class="hidden lg:flex items-center gap-2 rounded-2xl border border-border-ui bg-slate-50/70 dark:bg-slate-900/40 px-2 py-1.5">
        <template v-for="(section, index) in NAV_VISIVEL" :key="section.key">
          <NavMenu
            :label="section.label"
            :items="section.items"
          />
          <!-- Separador entre Comercial e Produção -->
          <div
            v-if="section.key === 'comercial'"
            class="w-px h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex-shrink-0"
            aria-hidden="true"
          />
        </template>
      </div>

      <!-- AÇÕES DIREITA -->
      <div class="flex items-center gap-3">
        <!-- TOGGLE TEMA -->
        <button
          @click="toggleDark()" 
          class="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-300 border border-border-ui rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          title="Alternar tema"
        >
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-sm"></i>
        </button>

        <!-- VERIFICAR ATUALIZAÇÃO (Tauri desktop ou Capacitor Android) -->
        <button
          v-if="showUpdateButton"
          type="button"
          :disabled="checkingUpdate"
          @click="verificarAtualizacao"
          class="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-300 border border-border-ui rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          title="Verificar atualização"
        >
          <i class="pi pi-download text-sm" :class="{ 'pi-spin': checkingUpdate }"></i>
        </button>

        <!-- LOGOUT DESKTOP -->
        <button
          @click="handleLogout" 
          class="hidden lg:flex items-center justify-center w-9 h-9 text-red-500 border border-border-ui rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          title="Sair"
        >
          <i class="pi pi-power-off text-sm"></i>
        </button>

        <!-- MENU MOBILE / TABLET (hambúrguer até lg) -->
        <button
          @click="isMobileMenuOpen = true" 
          class="lg:hidden w-9 h-9 flex items-center justify-center border border-border-ui rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <i class="pi pi-bars text-sm"></i>
        </button>
      </div>
    </div>

    <!-- MENU MOBILE / TABLET DRAWER (visível até lg) -->
    <transition name="slide-right">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[1000] lg:hidden">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
        
        <div class="absolute right-0 top-0 bottom-0 w-[300px] bg-bg-card border-l border-border-ui flex flex-col">
          <!-- HEADER DO DRAWER -->
          <div class="h-16 px-6 border-b border-border-ui flex items-center justify-between">
            <span class="font-bold text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Menu</span>
            <button @click="isMobileMenuOpen = false" class="p-2 text-slate-400 hover:text-slate-600">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- ITENS DO MENU -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <div v-for="section in NAV_VISIVEL" :key="section.key" class="space-y-2">
              <!-- Separador visual entre Comercial e Produção no mobile -->
              <div
                v-if="section.key === 'producao'"
                class="my-4 border-t border-border-ui"
              />
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 px-3 mt-4 mb-2">{{ section.label }}</p>

              <a
                v-for="item in section.items.filter(i => !i.divider)"
                :key="item.to"
                @click="handleMobileNav(item.to)"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <i :class="item.icon" class="text-xs opacity-70 w-4"></i>
                <span>{{ item.label }}</span>
              </a>
            </div>
          </div>

          <!-- FOOTER DO DRAWER -->
          <div class="p-4 border-t border-border-ui">
            <button 
              @click="handleLogout" 
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-500 text-xs font-medium border border-red-300 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <i class="pi pi-power-off text-xs"></i>
              Sair
            </button>
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { can } from '@/services/permissions'
import { useRoute, useRouter } from 'vue-router'
import { NAV_SCHEMA } from '@/services/navigation'
import { PermissoesService } from '@/services/index'
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
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      const updater = tauri?.plugin?.('updater') ?? tauri?.updater
      if (!updater?.check) {
        notify.info('Verificação de atualização não disponível neste ambiente.')
        return
      }
      const update = await updater.check()
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

const isDark = useDark()
const toggleDark = useToggle(isDark)
const isMobileMenuOpen = ref(false)
const menuSections = ref([])

const SECTION_LABELS = {
  comercial: 'Comercial',
  producao: 'Produção',
  financeiro: 'Financeiro',
  cadastros: 'Cadastros',
  configuracoes: 'Configurações',
  dashboard: 'Dashboard',
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

const filtrarItens = (items = []) => {
  const filtrados = items.filter((i) => {
    if (i.divider) return true
    if (!i.perm) return true
    return can(i.perm)
  })
  return limparDivisores(filtrados)
}

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

const fallbackSections = computed(() =>
  Object.entries(NAV_SCHEMA).map(([key, items]) => ({
    key,
    label: SECTION_LABELS[key] || key,
    items,
  })),
)

const NAV_VISIVEL = computed(() => {
  // Usar sempre o menu local (Comercial / Produção); ignora API para evitar cache/Operacional
  const source = fallbackSections.value

  return source
    .map((section) => ({
      ...section,
      items: filtrarItens(section.items || []),
    }))
    .filter((section) => section.items.some((i) => !i.divider))
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
  if (!storage.getToken()) return
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
</style>
