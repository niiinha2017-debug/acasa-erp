<template>
  <div class="main-container">

    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Plano de Corte</h1>
      </div>

      <!-- FORNECEDOR (OBRIGATÓRIO) -->
      <div class="form-grid">
        <div class="form-group col-span-6">
          <label class="form-label">Fornecedor *</label>
          <select class="form-input form-select">
            <option value="">Selecione o fornecedor</option>
            <!-- options via JS -->
          </select>
        </div>
      </div>

      <!-- ITENS -->
      <div class="form-header" style="margin-top:32px">
        <h2 class="form-title">Itens do Plano</h2>

        <button
          type="button"
          class="btn btn-secondary"
        >
          Adicionar Item
        </button>
      </div>

      <!-- TABELA COM SCROLL -->
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cor</th>
              <th>Unidade</th>
              <th>Quantidade</th>
              <th>Valor Unitário</th>
              <th>Valor Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <!-- LINHA DE ITEM -->
            <tr>
              <td>
                <input class="form-input" placeholder="Ex: MDF" />
              </td>

              <td>
                <input class="form-input" placeholder="Ex: Branco" />
              </td>

              <td>
                <input class="form-input" placeholder="Metro" />
              </td>

              <td>
                <input class="form-input" type="number" step="0.001" />
              </td>

              <td>
                <input class="form-input" type="number" step="0.01" />
              </td>

              <td>
                R$ 0,00
              </td>

              <td>
                <button type="button" class="btn btn-secondary">
                  ✖
                </button>
              </td>
            </tr>

            <!-- SEM ITENS -->
            <tr>
              <td colspan="7">Nenhum item adicionado.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TOTAL + SALVAR -->
      <div class="form-actions">
        <strong>Total: R$ 0,00</strong>

        <button type="submit" class="btn btn-primary">
          Salvar e Enviar para Produção
        </button>
      </div>

    </div>

  </div>
</template>


<script>
export default {
  data() {
    return {
      fornecedores: [],
      fornecedor_id: '',
      itens: []
    }
  },

  computed: {
    total() {
      return this.itens.reduce((s, i) => s + (i.valor_total || 0), 0)
    }
  },

  mounted() {
    this.carregarFornecedores()
  },

  methods: {
    async carregarFornecedores() {
      const api = import.meta.env.VITE_API_URL
      const res = await fetch(`${api}/fornecedores`)
      this.fornecedores = await res.json()
    },

    adicionarItem() {
      this.itens.push({
        nome: '',
        cor: '',
        unidade: '',
        quantidade: 0,
        valor_unitario: 0,
        valor_total: 0
      })
    },

    removerItem(index) {
      this.itens.splice(index, 1)
    },

    calcularItem(item) {
      item.valor_total =
        (Number(item.quantidade) || 0) *
        (Number(item.valor_unitario) || 0)
    },

    async salvar() {
      if (!this.fornecedor_id) {
        alert('Selecione o fornecedor')
        return
      }

      if (this.itens.length === 0) {
        alert('Adicione pelo menos um item')
        return
      }

      const api = import.meta.env.VITE_API_URL

      // 1️⃣ cria o plano de corte (VENDA PARA FORNECEDOR)
      const res = await fetch(`${api}/planos-corte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fornecedor_id: this.fornecedor_id,
          valor_total: this.total,
          itens: this.itens
        })
      })

      const data = await res.json()
      const planoId = data.id

      // 2️⃣ envia direto para produção
      await fetch(`${api}/planos-corte/${planoId}/producao`, {
        method: 'POST'
      })

      // 3️⃣ volta para lista
      this.$router.push('/planos-corte')
    }
  }
}
</script>


