<script>
export default {
  name: 'ClientesList',
  data() {
    return {
      clientes: [],
      loading: true,
      error: null,
    }
  },
  mounted() {
    this.fetchClientes()
  },
  methods: {
    async fetchClientes() {
      this.loading = true
      const apiUrl = import.meta.env.VITE_API_URL

      try {
        const response = await fetch(`${apiUrl}/clientes`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        this.clientes = await response.json()
      } catch (e) {
        this.error = 'Falha ao carregar clientes.'
        console.error(e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>


<template>
  <div class="page">
    <!-- Header da página -->
    <header class="page-header">
      <h1>Clientes</h1>

      <button
        class="btn-gradient"
        @click="$router.push('/clientes/novo')"
      >
        Novo Cliente
      </button>
    </header>

    <!-- Conteúdo -->
    <div class="page-content">

      <div v-if="loading">Carregando…</div>
      <div v-if="error">{{ error }}</div>

      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>E-mail</th>
            <th>CPF/CNPJ</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="cliente in clientes" :key="cliente.id">
            <td>{{ cliente.nome }}</td>
            <td>{{ cliente.telefone }}</td>
            <td>{{ cliente.email }}</td>
            <td>{{ cliente.cpf_cnpj }}</td>
            <td>{{ cliente.status }}</td>
            <td class="table-actions">
  <!-- Editar -->
  <button
    class="action-btn edit"
    title="Editar"
    @click="$router.push(`/clientes/${cliente.id}/editar`)"
  >
    ✏️
  </button>

  <!-- Inativar / Ativar -->
  <button
    class="action-btn toggle"
    :title="cliente.status === 'Ativo' ? 'Inativar' : 'Ativar'"
    @click="toggleStatus(cliente)"
  >
    ⏸
  </button>

  <!-- Excluir -->
  <button
    class="action-btn delete"
    title="Excluir"
    @click="excluirCliente(cliente.id)"
  >
    🗑
  </button>
</td>
          </tr>

          <tr v-if="!loading && clientes.length === 0">
            <td colspan="6">Nenhum cliente cadastrado.</td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>
