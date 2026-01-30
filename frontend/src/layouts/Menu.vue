<template>
  <nav class="w-full h-16 bg-[var(--bg-card)] border-b border-[var(--border-ui)] shadow-sm sticky top-0 z-[100] transition-colors duration-300">
    <div class="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
      
      <RouterLink to="/" class="flex items-center gap-2 group">
        <div class="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
          <i class="pi pi-box text-sm"></i>
        </div>
        <span class="font-black text-sm uppercase tracking-tighter text-slate-700 dark:text-slate-200">ERP</span>
      </RouterLink>

<div class="hidden md:flex items-center gap-1">
  <NavMenu v-if="NAV_VISIVEL.operacional" label="Operacional" :items="NAV_VISIVEL.operacional" />
  <NavMenu v-if="NAV_VISIVEL.financeiro" label="Financeiro" :items="NAV_VISIVEL.financeiro" />
  <NavMenu v-if="NAV_VISIVEL.cadastros" label="Cadastros" :items="NAV_VISIVEL.cadastros" />
  <NavMenu v-if="NAV_VISIVEL.configuracoes" label="Configurações" :items="NAV_VISIVEL.configuracoes" />
  <NavMenu v-if="NAV_VISIVEL.dashboard" label="Dashboard" :items="NAV_VISIVEL.dashboard" />
</div>


      <div class="flex items-center gap-2">
        <button @click="toggleDark()" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
        </button>

        <button @click="handleLogout" class="hidden md:flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all">
          <i class="pi pi-power-off text-xs"></i>
        </button>

        <button @click="isMobileMenuOpen = true" class="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <i class="pi pi-bars"></i>
        </button>
      </div>
    </div>

    <transition name="slide-right">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[1000] md:hidden">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
        
        <div class="absolute right-0 top-0 bottom-0 w-[280px] bg-[var(--bg-card)] shadow-2xl flex flex-col">
          <div class="p-6 border-b border-[var(--border-ui)] flex items-center justify-between">
            <span class="font-black uppercase tracking-widest text-xs text-slate-400">Menu Principal</span>
            <button @click="isMobileMenuOpen = false" class="p-2 text-slate-500">
              <i class="pi pi-times"></i>
            </button>
          </div>

<div class="flex-1 overflow-y-auto p-4 space-y-2">
  <div v-for="(items, label) in NAV_VISIVEL" :key="label" class="space-y-1">
    <p class="text-[10px] font-bold text-slate-400 uppercase px-3 mt-4 mb-1">{{ label }}</p>

    <a
      v-for="item in items.filter(i => !i.divider)"
      :key="item.to"
      @click="handleMobileNav(item.to)"
      class="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-primary/10 text-slate-600 dark:text-slate-300 font-bold text-sm"
    >
      <i :class="item.icon" class="text-xs opacity-50"></i>
      {{ item.label }}
    </a>
  </div>
</div>


          <div class="p-4 border-t border-[var(--border-ui)]">
            <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 p-3 text-red-500 font-bold uppercase text-[11px] bg-red-50 dark:bg-red-950/20 rounded-xl">
              <i class="pi pi-power-off"></i> Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { can } from '@/services/permissions'
import { useRoute, useRouter } from 'vue-router'
import { NAV_SCHEMA } from '@/services/navigation'
import storage from '@/utils/storage' 
import { useDark, useToggle } from '@vueuse/core'

const route = useRoute()
const router = useRouter()

const isDark = useDark()
const toggleDark = useToggle(isDark)
const isMobileMenuOpen = ref(false)

const handleLogout = () => {
  isMobileMenuOpen.value = false
  storage.removeToken()
  storage.removeUser()
  router.push('/login')
}


const limparDivisores = (items = []) => {
  // remove divider no começo/fim e dividers duplicados
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

const NAV_VISIVEL = computed(() => {
  const out = {}
  for (const [label, items] of Object.entries(NAV_SCHEMA)) {
    const vis = filtrarItens(items)
    // só mantém grupos que tenham pelo menos 1 item real (não divider)
    if (vis.some(i => !i.divider)) out[label] = vis
  }
  return out
})

const handleMobileNav = (to) => {
  isMobileMenuOpen.value = false
  router.push(to)
}
</script>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>