<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
      <button @click="$router.push('/usuarios/novo')" class="btn-primary">
        + Novo Usuário
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4">{{ user.nome }}</td>
            <td class="px-6 py-4">{{ user.email }}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{{ user.role }}</span>
            </td>
            <td class="px-6 py-4 text-center">
              <button @click="$router.push(`/usuarios/editar/${user.id}`)" class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
              <button @click="deletarUsuario(user.id)" class="text-red-600 hover:text-red-900">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const users = ref([]);

const carregarUsuarios = async () => {
  try {
    const { data } = await api.get('/users');
    users.value = data;
  } catch (error) {
    alert('Erro ao carregar usuários');
  }
};

const deletarUsuario = async (id) => {
  if (confirm('Tem certeza que deseja excluir este usuário?')) {
    try {
      await api.delete(`/users/${id}`);
      carregarUsuarios();
    } catch (error) {
      alert('Erro ao excluir');
    }
  }
};

onMounted(carregarUsuarios);
</script>