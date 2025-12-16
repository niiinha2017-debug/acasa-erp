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
  <div class="main-container">

    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Clientes</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/clientes/novo')"
        >
          Novo Cliente
        </button>
      </div>

      <!-- ESTADOS -->
      <div v-if="loading">Carregando…</div>
      <div v-if="error">{{ error }}</div>

      <!-- TABELA -->
      <table class="table" v-if="!loading">
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
            <td>{{ cliente.telefone || '-' }}</td>
            <td>{{ cliente.email || '-' }}</td>
            <td>{{ cliente.cpf_cnpj || '-' }}</td>
            <td>{{ cliente.status }}</td>
            <td>
              <button
                class="btn btn-secondary"
                @click="$router.push(`/clientes/${cliente.id}`)"
              >
                Editar
              </button>
            </td>
          </tr>

          <tr v-if="clientes.length === 0">
            <td colspan="6">Nenhum cliente cadastrado.</td>
          </tr>
        </tbody>
      </table>

    </div>

  </div>
</template>
