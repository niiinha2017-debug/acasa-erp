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
        <label class="inline-flex items-center relative select-none">
          <input
            class="peer hidden"
            id="toggle-theme"
            type="checkbox"
            :checked="isDark"
            @change="toggleDark()"
            aria-label="Alternar tema"
          />
          <div
            class="relative w-[88px] h-[40px] bg-white dark:bg-slate-800 peer-checked:bg-slate-500 rounded-full
                   after:absolute after:content-[''] after:w-[32px] after:h-[32px]
                   after:bg-gradient-to-r after:from-orange-500 after:to-yellow-400
                   peer-checked:after:from-slate-900 peer-checked:after:to-slate-900
                   after:rounded-full after:top-[4px] after:left-[4px]
                   active:after:w-[40px] peer-checked:after:left-[84px] peer-checked:after:translate-x-[-100%]
                   shadow-sm duration-300 after:duration-300 after:shadow-md"
          ></div>
          <svg
            height="0"
            width="100"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            class="fill-white peer-checked:opacity-60 absolute w-5 h-5 left-[10px]"
          >
            <path
              d="M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5ZM13,0h-2V5h2V0Zm0,19h-2v5h2v-5ZM5,11H0v2H5v-2Zm19,0h-5v2h5v-2Zm-2.81-6.78l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54ZM7.76,17.66l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54Zm0-11.31l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Zm13.44,13.44l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Z"
            ></path>
          </svg>
          <svg
            height="512"
            width="512"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            class="fill-black opacity-60 peer-checked:opacity-70 peer-checked:fill-white absolute w-5 h-5 right-[10px]"
          >
            <path
              d="M12.009,24A12.067,12.067,0,0,1,.075,10.725,12.121,12.121,0,0,1,10.1.152a13,13,0,0,1,5.03.206,2.5,2.5,0,0,1,1.8,1.8,2.47,2.47,0,0,1-.7,2.425c-4.559,4.168-4.165,10.645.807,14.412h0a2.5,2.5,0,0,1-.7,4.319A13.875,13.875,0,0,1,12.009,24Zm.074-22a10.776,10.776,0,0,0-1.675.127,10.1,10.1,0,0,0-8.344,8.8A9.928,9.928,0,0,0,4.581,18.7a10.473,10.473,0,0,0,11.093,2.734.5.5,0,0,0,.138-.856h0C9.883,16.1,9.417,8.087,14.865,3.124a.459.459,0,0,0,.127-.465.491.491,0,0,0-.356-.362A10.68,10.68,0,0,0,12.083,2ZM20.5,12a1,1,0,0,1-.97-.757l-.358-1.43L17.74,9.428a1,1,0,0,1,.035-1.94l1.4-.325.351-1.406a1,1,0,0,1,1.94,0l.355,1.418,1.418.355a1,1,0,0,1,0,1.94l-1.418.355-.355,1.418A1,1,0,0,1,20.5,12ZM16,14a1,1,0,0,0,2,0A1,1,0,0,0,16,14Zm6,4a1,1,0,0,0,2,0A1,1,0,0,0,22,18Z"
            ></path>
          </svg>
        </label>

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

onMounted(() => {
  carregarMenu()
})
</script>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>
