<template>
  <div class="page-container">
    <div class="card">
      <header class="table-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>Gestão de Usuários</h2>
          <p>Gerencie permissões e acessos ao sistema.</p>
        </div>
        <button class="btn btn--primary" @click="exibirModal = true">
          + Novo Usuário
        </button>
      </header>

      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Usuário</th>
            <th>Setor</th>
            <th>Status</th>
            <th style="text-align: center;">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nome }}</td>
            <td><strong>{{ u.usuario }}</strong></td>
            <td>
              <select 
                v-model="u.setor" 
                class="form-input" 
                @change="alterarSetor(u)"
                :disabled="u.id === usuarioLogado?.id"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="FINANCEIRO">FINANCEIRO</option>
                <option value="PRODUCAO">PRODUÇÃO</option>
                <option value="VENDAS">VENDAS</option>
              </select>
            </td>
            <td>
              <span :class="u.status === 'ATIVO' ? 'badge-success' : 'badge-warning'">
                {{ u.status }}
              </span>
            </td>
            <td style="display: flex; gap: 8px; justify-content: center;">
              <button 
                v-if="u.status !== 'ATIVO'" 
                class="btn btn--sm btn--success" 
                @click="alterarStatus(u, 'ATIVO')"
                title="Ativar Usuário"
              >
                ✔
              </button>
              
              <button 
                class="btn btn--sm btn--danger" 
                @click="confirmarExclusao(u)"
                :disabled="u.id === usuarioLogado?.id"
                title="Excluir Usuário"
              >
                🗑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="exibirModal" class="modal-overlay">
      <div class="modal-content card">
        <h3>Cadastrar Novo Usuário</h3>
        <form @submit.prevent="cadastrar">
          <div class="form-group">
            <label>Nome Completo</label>
            <input v-model="novoUsuario.nome" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Login (Usuário)</label>
            <input v-model="novoUsuario.usuario" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input v-model="novoUsuario.senha" type="password" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Setor Inicial</label>
            <select v-model="novoUsuario.setor" class="form-input">
              <option value="PRODUCAO">PRODUÇÃO</option>
              <option value="FINANCEIRO">FINANCEIRO</option>
              <option value="VENDAS">VENDAS</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          
          <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 10px;">
            <button type="submit" class="btn btn--primary" :disabled="loading">Salvar</button>
            <button type="button" class="btn btn--outline" @click="exibirModal = false">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useAuth } from '@/services/useauth'

const { usuarioLogado } = useAuth()
const usuarios = ref([])
const exibirModal = ref(false)
const loading = ref(false)

const novoUsuario = ref({
  nome: '',
  usuario: '',
  senha: '',
  setor: 'PRODUCAO'
})

async function carregar() {
  const { data } = await api.get('/usuarios')
  usuarios.value = data
}

async function cadastrar() {
  loading.value = true
  try {
    await api.post('/auth/cadastro', novoUsuario.value)
    alert('Usuário cadastrado com sucesso!')
    exibirModal.value = false
    novoUsuario.value = { nome: '', usuario: '', senha: '', setor: 'PRODUCAO' }
    carregar()
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao cadastrar')
  } finally {
    loading.value = false
  }
}

async function alterarSetor(user) {
  try {
    await api.patch(`/usuarios/${user.id}`, { setor: user.setor })
  } catch (err) {
    alert('Erro ao atualizar setor')
  }
}

async function alterarStatus(user, novoStatus) {
  try {
    await api.patch(`/usuarios/${user.id}/status`, { status: novoStatus })
    user.status = novoStatus
  } catch (err) {
    alert('Erro ao alterar status')
  }
}

async function confirmarExclusao(user) {
  if (confirm(`Tem certeza que deseja excluir ${user.nome}?`)) {
    try {
      await api.delete(`/usuarios/${user.id}`)
      usuarios.value = usuarios.value.filter(u => u.id !== user.id)
    } catch (err) {
      alert('Erro ao excluir usuário')
    }
  }
}

onMounted(carregar)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-content {
  width: 100%;
  max-width: 450px;
  padding: 30px;
}
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
</style>