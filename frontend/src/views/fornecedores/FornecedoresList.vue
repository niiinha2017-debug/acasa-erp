<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">Fornecedores</h1>
        <button class="btn btn-primary" @click="$router.push('/fornecedores/novo')">
          Novo Fornecedor
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Nome Fantasia</th>
            <th>CNPJ / CPF</th>
            <th>Telefone</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="f in fornecedores" :key="f.id">
            <td>{{ f.nome_fantasia }}</td>
            <td>{{ f.cpf_cnpj || '-' }}</td>
            <td>{{ f.telefone_loja || '-' }}</td>
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
  name: 'FornecedoresIndex',

  data() {
    return {
      fornecedores: []
    }
  },

  async mounted() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/fornecedores`)
    this.fornecedores = await res.json()
  },

  methods: {
    editar(id) {
      this.$router.push(`/fornecedores/${id}`)
    }
  }
}
</script>
