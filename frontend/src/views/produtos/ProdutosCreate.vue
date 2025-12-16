<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">Produtos</h1>
        <button class="btn btn-primary" @click="$router.push('/produtos/novo')">
          Novo Produto
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Fornecedor</th>
            <th>Unidade</th>
            <th>Qtd</th>
            <th>Valor Unit.</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtos" :key="p.id">
            <td>{{ p.nome }}</td>
            <td>{{ p.fornecedor || '-' }}</td>
            <td>{{ p.unidade || '-' }}</td>
            <td>{{ p.quantidade }}</td>
            <td>R$ {{ p.valor_unitario }}</td>
            <td>
              <button class="btn btn-secondary" @click="editar(p.id)">
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
  name: 'ProdutosIndex',

  data() {
    return {
      produtos: []
    }
  },

  async mounted() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/produtos`)
    this.produtos = await res.json()
  },

  methods: {
    editar(id) {
      this.$router.push(`/produtos/${id}`)
    }
  }
}
</script>
