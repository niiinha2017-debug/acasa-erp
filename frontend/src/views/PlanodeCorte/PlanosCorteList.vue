<template>
  <div class="main-container">

    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Planos de Corte</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/planos-corte/novo')"
        >
          Novo Plano
        </button>
      </div>

      <!-- ESTADOS -->
      <div v-if="loading">Carregando…</div>
      <div v-if="error">{{ error }}</div>

      <!-- TABELA -->
      <table class="table" v-if="!loading">
        <thead>
          <tr>
            <th>#</th>
            <th>Fornecedor</th>
            <th>Descrição</th>
            <th>Status</th>
            <th>Total</th>
            <th>Criado em</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="plano in planos" :key="plano.id">
            <td>{{ plano.id }}</td>
            <td>{{ plano.fornecedor_nome }}</td>
            <td>{{ plano.descricao_geral || '-' }}</td>
            <td>{{ plano.status }}</td>
            <td>R$ {{ Number(plano.valor_total).toFixed(2) }}</td>
            <td>{{ formatarData(plano.created_at) }}</td>
            <td>
              <button
                class="btn btn-secondary"
                @click="$router.push(`/planos-corte/${plano.id}`)"
              >
                Ver
              </button>
            </td>
          </tr>

          <tr v-if="planos.length === 0">
            <td colspan="7">Nenhum plano de corte cadastrado.</td>
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
      planos: [],
      loading: true,
      error: null,
    }
  },

  mounted() {
    this.carregarPlanos()
  },

  methods: {
    async carregarPlanos() {
      const apiUrl = import.meta.env.VITE_API_URL
      try {
        const res = await fetch(`${apiUrl}/planos-corte`)
        if (!res.ok) throw new Error('Erro ao buscar planos')
        this.planos = await res.json()
      } catch (e) {
        this.error = 'Falha ao carregar planos de corte.'
      } finally {
        this.loading = false
      }
    },

    formatarData(data) {
      if (!data) return '-'
      return new Date(data).toLocaleDateString('pt-BR')
    }
  }
}
</script>
