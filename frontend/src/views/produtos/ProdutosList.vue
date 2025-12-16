<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">
          {{ produtoId ? 'Editar Produto' : 'Novo Produto' }}
        </h1>
      </div>

      <form @submit.prevent="submitForm">
        <div class="form-grid">

          <div class="form-group col-span-6">
            <label class="form-label">Nome *</label>
            <input class="form-input" v-model="produto.nome" required />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Fornecedor</label>
            <input class="form-input" v-model="produto.fornecedor" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Medida</label>
            <input class="form-input" v-model="produto.medida" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Cor</label>
            <input class="form-input" v-model="produto.cor" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Unidade</label>
            <input class="form-input" v-model="produto.unidade" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Quantidade</label>
            <input type="number" class="form-input" v-model="produto.quantidade" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Valor Unitário</label>
            <input type="number" step="0.01" class="form-input" v-model="produto.valor_unitario" />
          </div>

        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="voltar">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">
            Salvar
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script>
export default {
  name: 'ProdutosForm',

  data() {
    return {
      produtoId: null,
      produto: {
        nome: '',
        fornecedor: '',
        medida: '',
        cor: '',
        unidade: '',
        quantidade: 0,
        valor_unitario: 0
      }
    }
  },

  async mounted() {
    if (this.$route.params.id) {
      this.produtoId = this.$route.params.id
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/produtos/${this.produtoId}`
      )
      this.produto = await res.json()
    }
  },

  methods: {
    async submitForm() {
      const method = this.produtoId ? 'PUT' : 'POST'
      const url = this.produtoId
        ? `${import.meta.env.VITE_API_URL}/produtos/${this.produtoId}`
        : `${import.meta.env.VITE_API_URL}/produtos`

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.produto)
      })

      this.$router.push('/produtos')
    },

    voltar() {
      this.$router.push('/produtos')
    }
  }
}
</script>
