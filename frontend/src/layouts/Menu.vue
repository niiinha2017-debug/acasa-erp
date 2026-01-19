<template>
  <nav class="flex items-center justify-center gap-2 w-full h-14 relative z-[100] bg-[var(--bg-card)] border-b border-[var(--border-ui)] shadow-sm transition-colors duration-300">
    
    <RouterLink 
      to="/" 
      class="flex items-center px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-all"
    >
      Início
    </RouterLink>

    <NavMenu label="Operacional" :items="NAV_SCHEMA.operacional" />
    <NavMenu label="Financeiro" :items="NAV_SCHEMA.financeiro" />
    <NavMenu label="Cadastros" :items="NAV_SCHEMA.cadastros" />
    <NavMenu label="Configurações" :items="NAV_SCHEMA.configuracoes" />

    <div class="h-6 w-[1px] bg-[var(--border-ui)] mx-2"></div>

    <button 
      @click="toggleDark()" 
      class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
             hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-yellow-400"
      title="Alternar Tema"
    >
      <i :class="isDark ? 'pi pi-sun text-lg' : 'pi pi-moon text-lg'"></i>
    </button>

    <div class="h-6 w-[1px] bg-[var(--border-ui)] mx-2"></div>

    <button 
      @click="handleLogout" 
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group"
    >
      <i class="pi pi-power-off text-xs group-hover:scale-110 transition-transform"></i>
      <span class="font-black text-[11px] uppercase tracking-widest">Sair</span>
    </button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { NAV_SCHEMA } from '@/services/navigation'
import storage from '@/utils/storage' 
import { useDark, useToggle } from '@vueuse/core'

const router = useRouter()

// Lógica de Dark Mode Profissional
const isDark = useDark() // Detecta preferência do sistema e gerencia a classe .dark no HTML
const toggleDark = useToggle(isDark)

const handleLogout = () => {
  storage.removeToken()
  storage.removeUser()
  localStorage.removeItem('erp_lembrar_usuario')
  router.push('/login')
}
</script>