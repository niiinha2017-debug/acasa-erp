<template>
  <nav class="w-full h-16 bg-[var(--bg-card)] border-b border-border-ui sticky top-0 z-[100] transition-colors duration-300">
    <div class="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
      
      <!-- LOGO E MARCA -->
      <RouterLink to="/agendamentos?visao=geral" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 bg-brand-primary flex items-center justify-center text-white rounded-md">
          <i class="pi pi-box text-xs"></i>
        </div>
        <span class="font-semibold text-base text-slate-900 dark:text-white hidden sm:inline">A CASA ERP</span>
      </RouterLink>

      <!-- MENU DESKTOP -->
      <div class="hidden md:flex items-center gap-6">
        <NavMenu
          v-for="section in NAV_VISIVEL"
          :key="section.key"
          :label="section.label"
          :items="section.items"
        />
      </div>

      <!-- AÇÕES DIREITA -->
      <div class="flex items-center gap-3">
        <!-- TOGGLE TEMA -->
        <button 
          @click="toggleDark()" 
          class="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-border-ui rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          title="Alternar tema"
        >
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-sm"></i>
        </button>

        <!-- LOGOUT DESKTOP -->
        <button 
          @click="handleLogout" 
          class="hidden md:flex items-center justify-center w-9 h-9 text-red-500 border border-border-ui rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          title="Sair"
        >
          <i class="pi pi-power-off text-sm"></i>
        </button>

        <!-- MENU MOBILE -->
        <button 
          @click="isMobileMenuOpen = true" 
          class="md:hidden w-9 h-9 flex items-center justify-center border border-border-ui rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <i class="pi pi-bars text-sm"></i>
        </button>
      </div>
    </div>

    <!-- MENU MOBILE DRAWER -->
    <transition name="slide-right">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[1000] md:hidden">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
        
        <div class="absolute right-0 top-0 bottom-0 w-[280px] bg-[var(--bg-card)] border-l border-border-ui flex flex-col">
          <!-- HEADER DO DRAWER -->
          <div class="h-16 px-6 border-b border-border-ui flex items-center justify-between">
            <span class="font-semibold text-sm text-slate-600 dark:text-slate-400">Menu</span>
            <button @click="isMobileMenuOpen = false" class="p-2 text-slate-400 hover:text-slate-600">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- ITENS DO MENU -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <div v-for="section in NAV_VISIVEL" :key="section.key" class="space-y-2">
              <p class="text-xs font-semibold text-slate-400 px-3 mt-4 mb-2">{{ section.label }}</p>

              <a
                v-for="item in section.items.filter(i => !i.divider)"
                :key="item.to"
                @click="handleMobileNav(item.to)"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
import { useDark, useToggle } from '@vueuse/core'

const route = useRoute()
const router = useRouter()

const isDark = useDark()
const toggleDark = useToggle(isDark)
const isMobileMenuOpen = ref(false)
const menuSections = ref([])

const SECTION_LABELS = {
  operacional: 'Operacional',
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
  const source = menuSections.value.length
    ? menuSections.value
    : fallbackSections.value

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

onMounted(carregarMenu)
</script>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>