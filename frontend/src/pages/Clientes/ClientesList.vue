<script setup>
import { ref, onMounted } from 'vue';

const clientes = ref([]);
const loading = ref(true);
const error = ref('');

const loadClientes = async () => {
  try {
    const res = await fetch('http://localhost:3000/clientes');
    if (!res.ok) throw new Error('Erro ao carregar clientes');
    clientes.value = await res.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(loadClientes);
</script>

<template>
  <div class="page">
    <h1>Clientes</h1>

    <div v-if="loading">Carregando...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Email</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in clientes" :key="c.id">
          <td>{{ c.nome }}</td>
          <td>{{ c.telefone || '-' }}</td>
          <td>{{ c.email || '-' }}</td>
          <td>{{ c.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
