<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">
      <div class="brand" @click="irPara('/')">
        A CASA-ERP
      </div>

      <nav class="nav" ref="navEl">
        <RouterLink to="/">Início</RouterLink>

        <!-- FINANCEIRO -->
        <div
          v-if="temAcesso('financeiro')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'financeiro' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('financeiro')">
            Financeiro
          </button>

          <div class="dropdown-content" @click.stop>
            <a v-if="temAcesso('despesas')" href="#" @click.prevent="irPara('/despesas')">Despesas</a>
            <a href="#" @click.prevent="irPara('/receitas')">Receitas</a>
          </div>
        </div>

        <!-- CADASTROS -->
        <div
          v-if="temAcesso('clientes') || temAcesso('fornecedores') || temAcesso('produtos') || temAcesso('funcionarios')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'cadastros' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('cadastros')">
            Cadastros
          </button>

          <div class="dropdown-content" @click.stop>
            <a v-if="temAcesso('clientes')" href="#" @click.prevent="irPara('/clientes')">Clientes</a>
            <a v-if="temAcesso('fornecedores')" href="#" @click.prevent="irPara('/fornecedores')">Fornecedores</a>
            <a v-if="temAcesso('produtos')" href="#" @click.prevent="irPara('/produtos')">Produtos</a>
            <a v-if="temAcesso('funcionarios')" href="#" @click.prevent="irPara('/funcionarios')">Funcionários</a>
          </div>
        </div>

        <!-- PRODUÇÃO -->
        <div
          v-if="temAcesso('producao') || temAcesso('plano-corte')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'producao' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('producao')">
            Produção
          </button>

          <div class="dropdown-content" @click.stop>
            <a v-if="temAcesso('plano-corte')" href="#" @click.prevent="irPara('/plano-corte')">Plano de Corte</a>
            <a href="#" @click.prevent="irPara('/ordens-servico')">Ordens de Serviço</a>
          </div>
        </div>

        <!-- CONFIGURAÇÕES -->
        <div
          v-if="temAcesso('configuracoes') || temAcesso('constantes')"
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'configuracoes' }"
        >
          <button type="button" class="dropdown-toggle" @click.stop="toggleDropdown('configuracoes')">
            Configurações
          </button>

          <div class="dropdown-content" @click.stop>
            <a v-if="temAcesso('constantes')" href="#" @click.prevent="irPara('/constantes')">Constantes</a>
            <a href="#" @click.prevent="irPara('/configuracoes/usuarios')">Usuários</a>
            <a href="#" @click.prevent="irPara('/logs')">Logs</a>
          </div>
        </div>
      
        </nav>

      <div class="user-area">
        <div class="user-info">
          <span class="user-name">Olá, {{ usuarioLogado?.nome || 'Usuário' }}</span>
          <span class="user-role">{{ usuarioLogado?.setor || '-' }}</span>
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
import { useAuth } from '@/services/useauth'

const DEBUG_MENU = true

const router = useRouter()
const { usuarioLogado, logout, temAcesso } = useAuth()

const user = computed(() => usuarioLogado.value)

const isScrolled = ref(false)
const activeDropdown = ref(null)

const navEl = ref(null)

function toggleDropdown(menu) {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

function fecharDropdowns() {
  activeDropdown.value = null
}

function closeDropdownOnClickOutside(event) {
  if (!navEl.value) return
  if (!navEl.value.contains(event.target)) {
    fecharDropdowns()
  }
}

async function irPara(path) {
  fecharDropdowns()

  if (DEBUG_MENU) {
    console.log('[MENU] clique ->', path)

    const rotas = router.getRoutes().map(r => r.path).sort()
    console.log('[MENU] rotas runtime:', rotas)

    const existe = router.getRoutes().some(r => r.path === path)
    console.log('[MENU] existe rota?', path, '=>', existe)

    if (!existe) {
      console.warn('[MENU] rota não existe no runtime:', path)
      return
    }
  }

  try {
    const res = await router.push(path)
    if (DEBUG_MENU) console.log('[MENU] push OK:', path, res)
  } catch (err) {
    console.error('[MENU] push ERRO:', path, err)
  } finally {
    fecharDropdowns()
  }
}

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function handleLogout() {
  fecharDropdowns()
  logout()
}

function avisar(modulo) {
  fecharDropdowns()
  alert(`${modulo}: página ainda não criada.`)
}

onMounted(() => {
  if (DEBUG_MENU) {
    console.log('[ROTAS RUNTIME]', router.getRoutes().map(r => r.path))
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
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