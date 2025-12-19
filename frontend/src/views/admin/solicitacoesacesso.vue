<template>
  <div class="admin-container">
    <header class="page-header">
      <h1 class="brand-title">Solicitações de Cadastro</h1>
      <p class="brand-subtitle">Aprove ou rejeite novos acessos ao sistema</p>
    </header>

    <div class="card shadow-md">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Nome</th>
            <th>Usuário</th>
            <th>E-mail</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in solicitacoes" :key="s.id">
            <td>{{ formatarData(s.created_at) }}</td>
            <td><strong>{{ s.nome }}</strong></td>
            <td><span class="badge-user">@{{ s.usuario }}</span></td>
            <td>{{ s.email }}</td>
            <td class="actions">
              <button @click="aprovar(s.id)" class="btn-success">Aprovar</button>
              <button @click="rejeitar(s.id)" class="btn-outline-danger">Remover</button>
            </td>
          </tr>
          <tr v-if="solicitacoes.length === 0">
            <td colspan="5" class="empty-state">Nenhuma solicitação pendente no momento.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api'; // Certifique-se que seu axios está configurado em services/api.js

const solicitacoes = ref([]);

const carregarSolicitacoes = async () => {
  try {
    const { data } = await api.get('/users/pendentes');
    solicitacoes.value = data;
  } catch (err) {
    alert('Erro ao carregar solicitações.');
  }
};

const aprovar = async (id) => {
  if (confirm('Deseja liberar o acesso para este usuário?')) {
    try {
      await api.post(`/users/aprovar/${id}`);
      alert('Usuário aprovado! Ele já pode fazer login.');
      carregarSolicitacoes();
    } catch (err) {
      alert('Erro ao aprovar usuário.');
    }
  }
};

const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR');

onMounted(carregarSolicitacoes);
</script>

<style scoped>
.admin-container { padding: 2rem; }
.erp-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
.erp-table th { background: var(--brand-primary); color: white; padding: 1rem; text-align: left; }
.erp-table td { padding: 1rem; border-bottom: 1px solid #eee; }
.badge-user { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
.btn-success { background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: 0.3s; }
.btn-success:hover { background: #27ae60; }
.actions { display: flex; gap: 10px; justify-content: center; }
.empty-state { text-align: center; padding: 3rem; color: #999; }
</style>