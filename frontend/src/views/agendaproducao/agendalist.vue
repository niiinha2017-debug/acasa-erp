<template>
  <div class="main-container">

    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">Agenda de Produção</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/agenda/novo')"
        >
          Novo Agendamento
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Referência</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in agenda" :key="item.id">
            <td>{{ item.data }}</td>
            <td>{{ item.tipo }}</td>
            <td>{{ item.referencia }}</td>
            <td>{{ item.status }}</td>

            <td>
              <button
                class="btn btn-secondary"
                @click="$router.push(`/agenda/${item.id}/editar`)"
              >
                ✏️
              </button>
            </td>
          </tr>

          <tr v-if="agenda.length === 0">
            <td colspan="5">Nenhum agendamento encontrado.</td>
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
      agenda: [],
    }
  },

  mounted() {
    this.carregarAgenda()
  },

  methods: {
    async carregarAgenda() {
      const apiUrl = import.meta.env.VITE_API_URL
      const res = await fetch(`${apiUrl}/agenda`)
      this.agenda = await res.json()
    }
  }
}
</script>
