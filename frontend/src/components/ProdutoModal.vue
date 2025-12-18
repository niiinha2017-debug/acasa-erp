<template>
  <div class="modal-backdrop" @click.self="$emit('fechar')">
    <div class="modal-card modal-md">

      <div class="modal-header">
        <h2>Cadastrar Produto</h2>
      </div>

      <div class="form-grid">

        <div class="form-group col-span-6">
          <label class="form-label form-label-required">Fornecedor</label>
          <select class="form-select" v-model="produto.fornecedor">
            <option value="">Selecione</option>
            <option v-for="f in fornecedores" :key="f.id" :value="f.id">
              {{ f.nome }}
            </option>
          </select>
        </div>

        <div class="form-group col-span-6">
          <label class="form-label form-label-required">Nome</label>
          <input class="form-input" v-model="produto.nome" />
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
          <select class="form-select" v-model="produto.unidade">
            <option v-for="u in unidades" :key="u.codigo" :value="u.codigo">
              {{ u.label }}
            </option>
          </select>
        </div>

        <div class="form-group col-span-6">
          <label class="form-label">Quantidade</label>
          <input type="number" class="form-input" v-model.number="produto.quantidade" />
        </div>

        <div class="form-group col-span-6">
          <label class="form-label">Valor unitário</label>
          <input type="number" step="0.01" class="form-input" v-model.number="produto.valor_unitario" />
        </div>

      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" @click="$emit('fechar')">
          Cancelar
        </button>
        <button class="btn btn-primary" @click="salvar">
          Salvar Produto
        </button>
      </div>

    </div>
  </div>
</template>


<script>

export default {
  props: {
    produtoInicial: Object,
    fornecedores: Array,
    unidades: Array
  },

  data() {
    return {
      produto: { ...this.produtoInicial }
    }
  },

  methods: {
    async salvar() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.produto)
      })

      const produtoSalvo = await res.json()
      this.$emit('salvo', produtoSalvo)
    }
  }
}

</script>

