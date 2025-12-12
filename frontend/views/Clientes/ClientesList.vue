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
  <section class="page-clientes">
    <header class="page-header">
      <h1>Clientes</h1>
    </header>

    <div v-if="loading" class="page-loading">
      Carregando clientes...
    </div>

    <div v-else-if="error" class="page-error">
      {{ error }}
    </div>

    <div v-else class="clientes-table-wrapper">
      <table class="clientes-table">
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
            <td>
              <span class="status-badge">
                {{ c.status }}
              </span>
            </td>
          </tr>

          <tr v-if="clientes.length === 0">
            <td colspan="4" class="empty">
              Nenhum cliente cadastrado
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
