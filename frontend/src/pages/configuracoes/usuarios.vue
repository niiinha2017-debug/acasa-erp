<template>
  <div v-if="isAuthenticated && usuarioLogado" class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Gestão de Usuários</h2>
          <p class="form-label" style="margin:0; color: var(--text-muted);">
            Gerencie permissões, e-mails e acessos ao sistema.
          </p>
        </div>

        <Button variant="primary" @click="abrirModalCadastro">
          + Novo Usuário
        </Button>
      </header>


<div class="card-filter">
  <SearchInput 
    v-model="filtro" 
    placeholder="Buscar por nome, CPF ou cargo..." 
    :options="optionsParaBusca"
  />
</div>


      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="usuariosFiltrados" 
          :loading="loadingTabela"
          empty-text="Nenhum usuário encontrado."
        >
          <template #cell-acesso="{ row }">
            <div class="cell-stack">
              <strong style="font-size: 0.95rem;">{{ row.usuario }}</strong>
              <span class="cell-muted">{{ row.email }}</span>
            </div>
          </template>

          <template #cell-setor="{ row }">
            <select
              v-model="row.setor"
              class="form-input"
              style="padding: 4px 8px; height: auto; font-size: 0.85rem;"
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
              :class="['badge', row.status === 'ATIVO' ? 'badge-success' : 'badge-danger']"
            >
              {{ row.status }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button variant="secondary" size="sm" @click="editarUsuario(row)">✏</Button>
              <Button v-if="row.status !== 'ATIVO'" variant="success" size="sm" @click="alterarStatus(row, 'ATIVO')">✔</Button>
              <Button 
                variant="danger" 
                size="sm" 
                @click="confirmarExclusao(row)"
                :disabled="row.id === usuarioLogado?.id"
              >
                🗑
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
<div v-if="exibirModal" class="modal-overlay" @click.self="fecharModal">
  <div class="modal-content">
    <Card>
      <header class="card-header header-between">
        <div>
          <h3 class="card-title" style="margin:0;">
            {{ modoEdicao ? 'Editar Usuário' : 'Novo Usuário' }}
          </h3>
          <p class="cell-muted" style="margin:0;">
            {{ modoEdicao ? 'Atualize os dados do usuário.' : 'Cadastre um novo usuário para acessar o sistema.' }}
          </p>
        </div>

        <Button variant="outline" size="sm" type="button" @click="fecharModal">
          ✕
        </Button>
      </header>

      <div style="padding: 16px 20px;">
        <form class="form-grid" @submit.prevent="salvar">
          <Input
            v-model="formUsuario.nome"
            label="Nome Completo"
            placeholder="Ex: Maria Silva"
            class="col-span-12"
            :required="true"
          />

          <Input
            v-model="formUsuario.usuario"
            label="Usuário"
            placeholder="Ex: maria"
            class="col-span-4"
            :required="true"
          />

          <Input
            v-model="formUsuario.email"
            label="E-mail"
            placeholder="ex: maria@email.com"
            class="col-span-8"
            :required="true"
          />

          <Input
            v-model="formUsuario.senha"
            :label="modoEdicao ? 'Senha (opcional)' : 'Senha'"
            :placeholder="modoEdicao ? 'Deixe vazio para não alterar' : 'Digite a senha'"
            type="password"
            class="col-span-6"
            :required="!modoEdicao"
            autocomplete="new-password"
          />

          <div class="form-group col-span-6">
            <label class="form-label">Setor <span class="required">*</span></label>
            <select v-model="formUsuario.setor" class="form-input" required>
              <option value="ADMIN">ADMIN</option>
              <option value="FINANCEIRO">FINANCEIRO</option>
              <option value="PRODUCAO">PRODUÇÃO</option>
              <option value="VENDAS">VENDAS</option>
            </select>
          </div>

          <div class="col-span-12" style="display:flex; justify-content:flex-end; gap:10px; margin-top: 6px;">
            <Button variant="outline" type="button" @click="fecharModal" :disabled="loadingSalvar">
              Cancelar
            </Button>

            <Button type="submit" :loading="loadingSalvar" :disabled="loadingSalvar">
              {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar' }}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  </div>
</div>

  </div>

  <div v-else class="page-container" style="display:flex; justify-content:center; align-items:center; height:200px;">
    <p>Verificando permissões...</p>
  </div>
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


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal-content {
  width: 100%;
  max-width: 500px;
  padding: 20px;
}
.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>