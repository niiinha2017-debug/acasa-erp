<template>
  <header 
    class="sticky top-0 z-sticky w-full transition-all duration-300"
    :class="[
      isScrolled 
        ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50 py-2' 
        : 'bg-white/95 backdrop-blur-md border-b border-gray-100 py-3'
    ]"
  >
    <div class="max-w-[1440px] mx-auto px-6 flex items-center gap-8">
      
      <div 
        @click="irPara('/')" 
        class="text-xl font-black text-gray-900 cursor-pointer whitespace-nowrap tracking-tighter hover:text-brand-primary transition-colors uppercase"
      >
        A CASA<span class="text-brand-primary">-ERP</span>
      </div>

      <nav ref="navEl" class="flex-1 hidden lg:flex items-center justify-center gap-1 p-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
        
        <RouterLink to="/" class="nav-link-tw" active-class="nav-link-active-tw">
          Início
        </RouterLink>

        <div class="relative group">
          <button @click.stop="toggleDropdown('operacional')" class="nav-link-tw" :class="{'nav-link-active-tw': activeDropdown === 'operacional'}">
            Operacional
            <i class="pi pi-chevron-down text-[10px] transition-transform" :class="{ 'rotate-180': activeDropdown === 'operacional' }"></i>
          </button>
          <div v-if="activeDropdown === 'operacional'" class="dropdown-container-tw">
            <a href="#" @click.prevent="irPara('/vendas')" class="dropdown-item-tw"><i class="pi pi-cart-plus mr-2 opacity-50"></i> Vendas</a>
            <a href="#" @click.prevent="irPara('/orçamentos')" class="dropdown-item-tw"><i class="pi pi-file-edit mr-2 opacity-50"></i> Orçamentos</a>
            <hr class="my-1 border-gray-50">
            <a href="#" @click.prevent="irPara('/producao')" class="dropdown-item-tw"><i class="pi pi-box mr-2 opacity-50"></i> Produção</a>
            <a href="#" @click.prevent="irPara('/plano-corte')" class="dropdown-item-tw"><i class="pi pi-table mr-2 opacity-50"></i> Plano de Corte</a>
          </div>
        </div>

        <div class="relative group">
          <button @click.stop="toggleDropdown('financeiro')" class="nav-link-tw" :class="{'nav-link-active-tw': activeDropdown === 'financeiro'}">
            Financeiro
            <i class="pi pi-chevron-down text-[10px] transition-transform" :class="{ 'rotate-180': activeDropdown === 'financeiro' }"></i>
          </button>
          <div v-if="activeDropdown === 'financeiro'" class="dropdown-container-tw">
            <a href="#" @click.prevent="irPara('/financeiro')" class="dropdown-item-tw"><i class="pi pi-wallet mr-2 opacity-50"></i> Fluxo de Caixa</a>
            <a href="#" @click.prevent="irPara('/despesas')" class="dropdown-item-tw"><i class="pi pi-minus-circle mr-2 opacity-50"></i> Despesas</a>
            <a href="#" @click.prevent="irPara('/compras')" class="dropdown-item-tw"><i class="pi pi-shopping-bag mr-2 opacity-50"></i> Compras</a>
            <a href="#" @click.prevent="irPara('/financeiro/contas-receber')" class="dropdown-item-tw"><i class="pi pi-inbox mr-2 opacity-50"></i> Contas a Receber</a>  
            <a href="#" @click.prevent="irPara('/financeiro/contas-pagar')" class="dropdown-item-tw"><i class="pi pi-outbox mr-2 opacity-50"></i> Contas a Pagar</a>
          </div>
        </div>

        <div class="relative group">
          <button @click.stop="toggleDropdown('cadastros')" class="nav-link-tw" :class="{'nav-link-active-tw': activeDropdown === 'cadastros'}">
            Cadastros
            <i class="pi pi-chevron-down text-[10px] transition-transform" :class="{ 'rotate-180': activeDropdown === 'cadastros' }"></i>
          </button>
          <div v-if="activeDropdown === 'cadastros'" class="dropdown-container-tw">
            <a href="#" @click.prevent="irPara('/clientes')" class="dropdown-item-tw"><i class="pi pi-users mr-2 opacity-50"></i> Clientes</a>
            <a href="#" @click.prevent="irPara('/fornecedores')" class="dropdown-item-tw"><i class="pi pi-truck mr-2 opacity-50"></i> Fornecedores</a>
            <a href="#" @click.prevent="irPara('/funcionarios')" class="dropdown-item-tw"><i class="pi pi-id-card mr-2 opacity-50"></i> Funcionários</a>
            <a href="#" @click.prevent="irPara('/produtos')" class="dropdown-item-tw"><i class="pi pi-tag mr-2 opacity-50"></i> Produtos</a>
          </div>
        </div>

        <div class="relative group">
          <button @click.stop="toggleDropdown('configuracoes')" class="nav-link-tw" :class="{'nav-link-active-tw': activeDropdown === 'configuracoes'}">
            Configurações
            <i class="pi pi-chevron-down text-[10px] transition-transform" :class="{ 'rotate-180': activeDropdown === 'configuracoes' }"></i>
          </button>
          <div v-if="activeDropdown === 'configuracoes'" class="dropdown-container-tw">
            <a href="#" @click.prevent="irPara('/configuracoes/permissoes')" class="dropdown-item-tw"><i class="pi pi-users mr-2 opacity-50"></i> Permissões</a>
            <a href="#" @click.prevent="irPara('/configuracoes/usuarios')" class="dropdown-item-tw"><i class="pi pi-truck mr-2 opacity-50"></i> Usuários</a>
            <a href="#" @click.prevent="irPara('/constantes')" class="dropdown-item-tw"><i class="pi pi-building mr-2 opacity-50"></i> Constantes</a>
          </div>
        </div>
      </nav>
      <div class="flex items-center gap-4 pl-4 border-l border-gray-100 font-sans">
        <div class="hidden sm:flex flex-col items-end leading-tight">
          <span class="text-sm font-bold text-gray-900 leading-none mb-1">{{ usuarioLogado?.nome?.split(' ')[0] || 'Usuário' }}</span>
          <span class="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em]">{{ usuarioLogado?.setor || '-' }}</span>
        </div>
        
        <button @click="handleLogout" class="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-danger hover:bg-red-50 transition-all group">
          <i class="pi pi-power-off font-bold group-hover:scale-110 transition-transform"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

const router = useRouter()
const { usuarioLogado, logout, temAcesso } = useAuth()

const isScrolled = ref(false)
const activeDropdown = ref(null)
const navEl = ref(null)

// Alterna entre os menus: 'operacional', 'financeiro' ou 'cadastros'
const toggleDropdown = (menu) => {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

const fecharDropdowns = () => { activeDropdown.value = null }

const irPara = (path) => {
  fecharDropdowns()
  router.push(path).catch(err => console.error('Erro ao navegar:', err))
}

const handleLogout = async () => {
  if (confirm('Deseja realmente sair do sistema?')) {
    fecharDropdowns()
    await logout()
    router.push('/login') // Redireciona para o login após limpar a sessão
  }
}

// Fecha o menu se clicar em qualquer lugar fora da área do <nav>
const closeDropdownOnClickOutside = (event) => {
  if (navEl.value && !navEl.value.contains(event.target)) {
    fecharDropdowns()
  }
}

// Controla a aparência do menu (transparência/sombra) ao rolar a página
const handleScroll = () => { isScrolled.value = window.scrollY > 10 }

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', closeDropdownOnClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', closeDropdownOnClickOutside)
})
</script>
