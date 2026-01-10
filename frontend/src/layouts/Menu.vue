<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">
      <div class="brand" @click="irPara('/')">A CASA-ERP</div>

      <nav class="nav" ref="navEl">
        <RouterLink to="/">Início</RouterLink>

        <div v-if="temAcesso('financeiro.ver')" class="dropdown-menu" :class="{ active: activeDropdown === 'financeiro' }">
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('financeiro')">
            Financeiro
          </button>
          <div class="dropdown-content">
            <a v-if="temAcesso('despesas.ver')" href="#" @click.prevent="irPara('/despesas')">Despesas</a>
            <a v-if="temAcesso('contas-pagar.ver')" href="#" @click.prevent="irPara('/financeiro/contas-pagar')">Contas a Pagar</a>
            <a v-if="temAcesso('contas-receber.ver')" href="#" @click.prevent="irPara('/financeiro/contas-receber')">Contas a Receber</a>
            <a v-if="temAcesso('compras.ver')" href="#" @click.prevent="irPara('/compras')">Compras</a>
          </div>
        </div>

        <div 
          v-if="temAcesso('clientes.ver') || temAcesso('fornecedores.ver') || temAcesso('produtos.ver') || temAcesso('funcionarios.ver')" 
          class="dropdown-menu" 
          :class="{ active: activeDropdown === 'cadastros' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('cadastros')">
            Cadastros
          </button>
          <div class="dropdown-content">
            <a v-if="temAcesso('clientes.ver')" href="#" @click.prevent="irPara('/clientes')">Clientes</a>
            <a v-if="temAcesso('fornecedores.ver')" href="#" @click.prevent="irPara('/fornecedores')">Fornecedores</a>
            <a v-if="temAcesso('produtos.ver')" href="#" @click.prevent="irPara('/produtos')">Produtos</a>
            <a v-if="temAcesso('funcionarios.ver')" href="#" @click.prevent="irPara('/funcionarios')">Funcionários</a>
          </div>
        </div>

        <div 
          v-if="temAcesso('producao.ver') || temAcesso('plano-corte.ver')" 
          class="dropdown-menu" 
          :class="{ active: activeDropdown === 'producao' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('producao')">
            Produção
          </button>
          <div class="dropdown-content">
            <a v-if="temAcesso('plano-corte.ver')" href="#" @click.prevent="irPara('/plano-corte')">Plano de Corte</a>
            <a v-if="temAcesso('producao.ver')" href="#" @click.prevent="irPara('/producao')">Agenda de Produção</a>
            <a href="#" @click.prevent="irPara('/producao/ordens-servico')">Ordens de Serviço</a>
          </div>
        </div>

        <div v-if="temAcesso('vendas.ver') || temAcesso('orcamentos.ver')" class="dropdown-menu" :class="{ active: activeDropdown === 'vendas' }">
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('vendas')">
            Vendas
          </button>
          <div class="dropdown-content">
            <a v-if="temAcesso('orcamentos.ver')" href="#" @click.prevent="irPara('/orcamentos')">Orçamentos</a>
            <a v-if="temAcesso('vendas.ver')" href="#" @click.prevent="irPara('/vendas')">Vendas</a>
          </div>
        </div>

        <div 
          v-if="temAcesso('configuracoes.ver') || temAcesso('usuarios.ver') || temAcesso('permissoes.gerenciar')" 
          class="dropdown-menu" 
          :class="{ active: activeDropdown === 'configuracoes' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('configuracoes')">
            Configurações
          </button>
          <div class="dropdown-content">
            <a v-if="temAcesso('constantes.ver')" href="#" @click.prevent="irPara('/constantes')">Constantes</a>
            <a v-if="temAcesso('usuarios.ver')" href="#" @click.prevent="irPara('/configuracoes/usuarios')">Usuários</a>
            <a v-if="temAcesso('permissoes.gerenciar')" href="#" @click.prevent="irPara('/configuracoes/permissoes')">Permissões</a>
          </div>
        </div>
      </nav>

      <div class="user-area">
        <div class="user-info">
          <span class="user-name">Olá, {{ usuarioLogado?.nome?.split(' ')[0] || 'Usuário' }}</span>
          <span class="user-role">{{ usuarioLogado?.setor || '-' }}</span>
        </div>
        <button class="btn-logout" type="button" @click="handleLogout">Sair</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import '@/assets/CSS/Menu.css'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

const router = useRouter()
const { usuarioLogado, logout, temAcesso } = useAuth()

const isScrolled = ref(false)
const activeDropdown = ref(null)
const navEl = ref(null)

const toggleDropdown = (menu) => {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

const fecharDropdowns = () => { activeDropdown.value = null }

const irPara = (path) => {
  fecharDropdowns()
  router.push(path).catch(err => console.error('Erro ao navegar:', err))
}

const handleLogout = () => {
  fecharDropdowns()
  logout()
}

const closeDropdownOnClickOutside = (event) => {
  if (navEl.value && !navEl.value.contains(event.target)) {
    fecharDropdowns()
  }
}

const handleScroll = () => { isScrolled.value = window.scrollY > 20 }

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', closeDropdownOnClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', closeDropdownOnClickOutside)
})
</script>

<style scoped>
/* Pequeno ajuste para exibir o setor abaixo do nome */
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: var(--spacing-4);
}
.user-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}
.user-role {
  font-size: var(--font-size-xs);
  color: var(--brand-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>