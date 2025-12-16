<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">Despesas</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/despesas/nova')"
        >
          Nova Despesa
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="d in despesas" :key="d.id">
            <td>{{ formatDate(d.data) }}</td>
            <td>{{ d.descricao }}</td>
            <td>{{ d.categoria }}</td>
            <td>R$ {{ Number(d.valor).toFixed(2) }}</td>
            <td>{{ d.status }}</td>
            <td>
              <button
                class="btn btn-secondary"
                @click="$router.push(`/despesas/${d.id}/editar`)"
              >
                ✏️
              </button>
              <button
                class="btn btn-secondary"
                @click="excluir(d.id)"
              >
                🗑
              </button>
            </td>
          </tr>

          <tr v-if="!loading && despesas.length === 0">
            <td colspan="6">Nenhuma despesa cadastrada.</td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      despesas: [],
      loading: false,
    }
  },

  mounted() {
    this.carregar()
  },

  methods: {
    async carregar() {
      this.loading = true
      const apiUrl = import.meta.env.VITE_API_URL
      const res = await fetch(`${apiUrl}/despesas`)
      this.despesas = await res.json()
      this.loading = false
    },

    async excluir(id) {
      if (!confirm('Excluir esta despesa?')) return

      const apiUrl = import.meta.env.VITE_API_URL
      await fetch(`${apiUrl}/despesas/${id}`, { method: 'DELETE' })
      this.carregar()
    },

    formatDate(v) {
      if (!v) return ''
      return new Date(v).toLocaleDateString('pt-BR')
    }
  }
}
</script>
