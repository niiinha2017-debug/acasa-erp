<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">Funcionários</h1>
        <button class="btn btn-primary" @click="$router.push('/funcionarios/novo')">
          Novo Funcionário
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Setor</th>
            <th>Função</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="f in funcionarios" :key="f.id">
            <td>{{ f.nome }}</td>
            <td>{{ f.cpf }}</td>
            <td>{{ f.setor || '-' }}</td>
            <td>{{ f.funcao || '-' }}</td>
            <td>{{ f.status }}</td>
            <td>
              <button class="btn btn-secondary" @click="editar(f.id)">
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>

<script>
export default {
  name: 'FuncionariosIndex',

  data() {
    return {
      funcionarios: []
    }
  },

  async mounted() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/funcionarios`)
    this.funcionarios = await res.json()
  },

  methods: {
    editar(id) {
      this.$router.push(`/funcionarios/${id}`)
    }
  }
}
</script>
