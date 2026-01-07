<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">
      <div class="brand" @click="router.push('/')">
        A CASA-ERP
      </div>

      <nav class="nav">
        <RouterLink to="/">Início</RouterLink>

        <div
          v-if="temAcesso('financeiro')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'financeiro' }"
          @click="toggleDropdown('financeiro')"
        >
          <button type="button" class="dropdown-toggle">Financeiro</button>
          <div class="dropdown-content" @click.stop>
            <a href="#" @click.prevent="avisar('Despesas')">Despesas</a>
            <a href="#" @click.prevent="avisar('Receitas')">Receitas</a>
          </div>
        </div>

<div
  v-if="temAcesso('clientes') || temAcesso('fornecedores')"
  class="dropdown-menu"
  :class="{ active: activeDropdown === 'cadastros' }"
>
  <button
    type="button"
    class="dropdown-toggle"
    @click.stop="toggleDropdown('cadastros')"
  >
    Cadastros
  </button>

  <div v-if="activeDropdown === 'cadastros'" class="dropdown-content" @click.stop>
    <a v-if="temAcesso('clientes')" href="#" @click.prevent="irPara('/clientes')">Clientes</a>
    <a v-if="temAcesso('fornecedores')" href="#" @click.prevent="irPara('/fornecedores')">Fornecedores</a>
    <a v-if="temAcesso('produtos')" href="#" @click.prevent="irPara('/produtos')">Produtos</a>
    <a v-if="temAcesso('plano-corte')" href="#" @click.prevent="irPara('/plano-corte')">Plano de Corte</a> 
    <a v-if="temAcesso('funcionarios')" href="#" @click.prevent="irPara('/funcionarios')">Funcionários</a> 
  </div>
</div>




        <div
          v-if="temAcesso('producao')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'producao' }"
          @click="toggleDropdown('producao')"
        >
          <button type="button" class="dropdown-toggle">Produção</button>
          <div class="dropdown-content" @click.stop>
            <a href="#" @click.prevent="avisar('Plano de Corte')">Plano de Corte</a>
            <a href="#" @click.prevent="avisar('Ordens de Serviço')">Ordens de Serviço</a>
          </div>
        </div>

        <div
          v-if="temAcesso('configuracoes')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'configuracoes' }"
          @click="toggleDropdown('configuracoes')"
        >
          <button type="button" class="dropdown-toggle">Configurações</button>
          <div class="dropdown-content" @click.stop>
            <a href="#" @click.prevent="avisar('Constantes')">Constantes</a>
            <a href="#" @click.stop.prevent="irPara('/configuracoes/usuarios')">Usuários</a>
            <a href="#" @click.prevent="avisar('Logs do Sistema')">Logs</a>
          </div>
        </div>
      </nav>

      <div class="user-area">
        <div class="user-info">
          <span class="user-name">Olá, {{ user?.nome || 'Usuário' }}</span>
          <span class="user-role">{{ user?.setor }}</span>
        </div>
        <button class="btn-logout" type="button" @click="handleLogout">
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import '@/assets/CSS/Menu.css'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth' // Importamos seu novo Auth

const router = useRouter()
const { usuarioLogado, logout, temAcesso } = useAuth() // Pegamos as funções mágicas

const user = computed(() => usuarioLogado.value)
const isScrolled = ref(false)
const activeDropdown = ref(null)

function toggleDropdown(menu) {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

function closeDropdownOnClickOutside(event) {
  const navElement = document.querySelector('.nav')
  if (navElement && !navElement.contains(event.target)) {
    activeDropdown.value = null
  }
}

async function irPara(path) {
  activeDropdown.value = null

  // ✅ 1) Log do clique
  console.log('[MENU] clique ->', path)

  // ✅ 2) Log das rotas que EXISTEM no runtime
  const rotas = router.getRoutes().map(r => r.path).sort()
  console.log('[MENU] rotas runtime:', rotas)

  // ✅ 3) Confirma se a rota existe
  const existe = router.getRoutes().some(r => r.path === path)
  console.log('[MENU] existe rota?', path, '=>', existe)

  // ✅ 4) Tenta navegar e loga o resultado
  try {
    const res = await router.push(path)
    console.log('[MENU] push OK:', path, res)
  } catch (err) {
    console.error('[MENU] push ERRO:', path, err)
  }
}


function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function handleLogout() {
  logout() // Usa a função do service que limpa storage e redireciona
}

function avisar(modulo) {
  activeDropdown.value = null
  alert(`${modulo}: página ainda não criada.`)
}
onMounted(() => {
  console.log('[ROTAS RUNTIME]', router.getRoutes().map(r => r.path))
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', closeDropdownOnClickOutside)
  handleScroll()
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