<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <Card>
      <!-- HEADER -->
      <header class="flex flex-col md:flex-row justify-between items-center gap-4 p-6 border-b border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
            <i class="pi pi-users text-brand-primary"></i>
            Gestão de Usuários
          </h2>
          <p class="text-sm font-semibold text-gray-400 mt-1">
            Gerencie permissões e acessos da equipe ACASA.
          </p>
        </div>

        <Button variant="primary" @click="abrirModalCadastro">
          <i class="pi pi-user-plus mr-2"></i>
          Novo Usuário
        </Button>
      </header>

      <!-- SEARCH -->
      <div class="p-4 border-b border-gray-100 bg-gray-50/50">
        <div class="max-w-md">
          <SearchInput
            v-model="filtro"
            placeholder="Buscar por nome, e-mail ou setor..."
            :options="optionsParaBusca"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <Table
          :columns="columns"
          :rows="usuariosFiltrados"
          :loading="loadingTabela"
          empty-text="Nenhum usuário encontrado."
        >
          <template #cell-acesso="{ row }">
            <div class="flex flex-col py-1">
              <span class="font-semibold text-gray-700">{{ row.usuario }}</span>
              <span class="text-[11px] font-semibold text-brand-primary/70">
                {{ row.email }}
              </span>
            </div>
          </template>

          <template #cell-setor="{ row }">
            <select
              v-model="row.setor"
              class="text-xs font-semibold bg-white border border-gray-200 rounded-md px-2 py-1
                     outline-none focus:border-brand-primary transition disabled:opacity-50"
              @change="alterarSetor(row)"
              :disabled="row.id === usuarioLogado?.id"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="FINANCEIRO">FINANCEIRO</option>
              <option value="PRODUCAO">PRODUÇÃO</option>
              <option value="VENDAS">VENDAS</option>
            </select>
          </template>

          <template #cell-status="{ row }">
            <span
              :class="[
                'px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border',
                row.status === 'ATIVO'
                  ? 'bg-green-50 text-success border-green-200'
                  : 'bg-red-50 text-danger border-red-200'
              ]"
            >
              {{ row.status }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex items-center justify-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                @click="editarUsuario(row)"
              >
                <i class="pi pi-pencil text-xs"></i>
              </Button>

              <Button
                v-if="row.status !== 'ATIVO'"
                variant="success"
                size="sm"
                @click="alterarStatus(row, 'ATIVO')"
              >
                <i class="pi pi-check-circle text-xs"></i>
              </Button>

              <Button
                variant="danger"
                size="sm"
                :disabled="row.id === usuarioLogado?.id"
                @click="confirmarExclusao(row)"
              >
                <i class="pi pi-trash text-xs"></i>
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </Card>

    <!-- MODAL -->
    <div
      v-if="exibirModal"
      class="fixed inset-0 z-modal flex items-center justify-center p-4
             bg-slate-900/60 backdrop-blur-sm"
      @click.self="fecharModal"
    >
      <div class="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <header class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">
            {{ modoEdicao ? 'Editar Usuário' : 'Novo Registro' }}
          </h3>

          <button
            @click="fecharModal"
            class="text-gray-400 hover:text-danger transition"
          >
            <i class="pi pi-times"></i>
          </button>
        </header>

        <form class="p-6 space-y-5" @submit.prevent="salvar">
          <div class="grid grid-cols-12 gap-4">
            <Input v-model="formUsuario.nome" label="Nome Completo" class="col-span-12" required />
            <Input v-model="formUsuario.usuario" label="Usuário" class="col-span-5" required />
            <Input v-model="formUsuario.email" label="E-mail Corporativo" class="col-span-7" required />

            <Input
              v-model="formUsuario.senha"
              :label="modoEdicao ? 'Senha (opcional)' : 'Senha de Acesso'"
              type="password"
              class="col-span-6"
              :required="!modoEdicao"
            />

            <div class="col-span-6">
              <label class="text-xs font-black uppercase text-gray-500 mb-1 block">
                Setor
              </label>
              <select
                v-model="formUsuario.setor"
                class="w-full h-10 px-3 border border-gray-200 rounded-md
                       text-sm font-semibold focus:border-brand-primary outline-none"
                required
              >
                <option value="ADMIN">ADMINISTRAÇÃO</option>
                <option value="FINANCEIRO">FINANCEIRO</option>
                <option value="PRODUCAO">PRODUÇÃO</option>
                <option value="VENDAS">VENDAS</option>
              </select>
            </div>
          </div>

          <footer class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" @click="fecharModal">
              Cancelar
            </Button>

            <Button variant="primary" type="submit" :loading="loadingSalvar">
              {{ modoEdicao ? 'Atualizar Dados' : 'Finalizar Cadastro' }}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  </template>

  <!-- LOADING -->
  <template v-else>
    <Card>
      <div class="p-10 flex flex-col items-center justify-center gap-3">
        <i class="pi pi-spin pi-spinner text-brand-primary text-4xl"></i>
        <p class="text-gray-400 font-medium animate-pulse">
          Sincronizando acessos ACASA...
        </p>
      </div>
    </Card>
  </template>
</template>


<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import api from '@/services/api'
import { useAuth } from '@/services/useauth'

// 1. IMPORTAÇÕES (Garanta que o SearchInput está aqui)
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const { usuarioLogado, isAuthenticated, logout } = useAuth()

const usuarios = ref([])
const filtro = ref('') // 2. ESTADO DA BUSCA
const exibirModal = ref(false)
const modoEdicao = ref(false)
const loadingTabela = ref(false)
const loadingSalvar = ref(false)

const formUsuario = ref({
  id: null,
  nome: '',
  usuario: '',
  email: '',
  senha: '',
  setor: 'PRODUCAO',
})

const columns = [
  { key: 'nome', label: 'Nome Completo' },
  { key: 'acesso', label: 'Login / E-mail' },
  { key: 'setor', label: 'Setor' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' },
]

// 3. LÓGICA DE FILTRAGEM (O que faz a busca funcionar)
const usuariosFiltrados = computed(() => {
  const termo = filtro.value.toLowerCase()
  if (!termo) return usuarios.value

  return usuarios.value.filter(u => 
    u.nome?.toLowerCase().includes(termo) ||
    u.usuario?.toLowerCase().includes(termo) ||
    u.email?.toLowerCase().includes(termo) ||
    u.setor?.toLowerCase().includes(termo)
  )
})

async function carregar() {
  if (!isAuthenticated.value) return 
  loadingTabela.value = true
  try {
    const { data } = await api.get('/usuarios')
    usuarios.value = data || []
  } catch (err) {
    if (err.response?.status === 401) logout()
  } finally {
    loadingTabela.value = false
  }
}

// Funções de apoio (Modal e Ações)
function abrirModalCadastro() {
  modoEdicao.value = false
  formUsuario.value = { id: null, nome: '', usuario: '', email: '', senha: '', setor: 'PRODUCAO' }
  exibirModal.value = true
}

function editarUsuario(u) {
  modoEdicao.value = true
  formUsuario.value = { ...u, senha: '' }
  exibirModal.value = true
}

function handleEsc(e) {
  if (e.key === 'Escape' && exibirModal.value) {
    fecharModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
})


function fecharModal() { exibirModal.value = false }

async function salvar() {
  loadingSalvar.value = true
  try {
    if (modoEdicao.value) {
      await api.patch(`/usuarios/${formUsuario.value.id}`, formUsuario.value)
    } else {
      await api.post('/auth/cadastro', formUsuario.value)
    }
    fecharModal()
    await carregar()
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro na operação')
  } finally {
    loadingSalvar.value = false
  }
}

async function alterarSetor(user) {
  try {
    await api.patch(`/usuarios/${user.id}`, { setor: user.setor })
  } catch (err) { alert('Erro ao atualizar setor') }
}

async function alterarStatus(user, novoStatus) {
  try {
    await api.patch(`/usuarios/${user.id}/status`, { status: novoStatus })
    user.status = novoStatus
  } catch (err) { alert('Erro ao alterar status') }
}

async function confirmarExclusao(user) {
  if (!confirm(`Excluir ${user.nome}?`)) return
  try {
    await api.delete(`/usuarios/${user.id}`)
    usuarios.value = usuarios.value.filter(u => u.id !== user.id)
  } catch (err) { alert('Erro ao excluir') }
}

onMounted(async () => {
  // Pequena pausa para garantir que o storage foi lido
  if (!isAuthenticated.value) {
     // Tenta reidratar se necessário ou espera um ciclo
     await new Promise(resolve => setTimeout(resolve, 100)); 
  }
  
  if (isAuthenticated.value) {
    carregar();
  } else {
    console.error("Usuário não autenticado no momento do onMounted");
  }
});

</script>


