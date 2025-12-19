<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div class="bg-white p-8 rounded-lg shadow">
      <h2 class="text-xl font-bold mb-6">Editar Usuário</h2>
      
      <form @submit.prevent="salvarEdicao">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Nome Completo</label>
          <input v-model="form.nome" type="text" class="w-full p-2 border rounded" required>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">E-mail</label>
          <input v-model="form.email" type="email" class="w-full p-2 border rounded" required>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium mb-1">Cargo / Nível de Acesso</label>
          <select v-model="form.role" class="w-full p-2 border rounded">
            <option value="admin">Administrador</option>
            <option value="producao">Produção</option>
            <option value="vendas">Vendas</option>
          </select>
        </div>

        <div class="flex gap-4">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Salvar Alterações
          </button>
          <button type="button" @click="$router.push('/usuarios')" class="bg-gray-200 px-4 py-2 rounded">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const form = ref({ nome: '', email: '', role: 'vendas' });

onMounted(async () => {
  try {
    const { data } = await api.get(`/users/${route.params.id}`);
    form.value = data;
  } catch (error) {
    alert('Erro ao buscar dados do usuário');
  }
});

const salvarEdicao = async () => {
  try {
    await api.put(`/users/${route.params.id}`, form.value);
    alert('Usuário atualizado com sucesso!');
    router.push('/usuarios');
  } catch (error) {
    alert('Erro ao salvar');
  }
};
</script>