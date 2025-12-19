<template>
  <div class="main-container">
    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <div>
          <h1 class="form-title">Plano de Corte</h1>
          <p class="form-subtitle">
            Registro de venda de serviço para produção
          </p>
        </div>
      </div>

      <!-- FORM -->
      <form @submit.prevent="salvar">

        <!-- DADOS DO PLANO -->
        <div class="form-grid">

          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Fornecedor
            </label>
            <select
              class="form-select"
              v-model="plano.fornecedor_id"
              required
            >
              <option value="">Selecione</option>
              <option
                v-for="f in fornecedores"
                :key="f.id"
                :value="f.id"
              >
                {{ f.nome }}
              </option>
            </select>
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">
              Data prevista
            </label>
            <input
              type="date"
              class="form-input"
              v-model="plano.data_prevista"
            />
          </div>

        </div>

        <div class="divider"></div>

        <!-- ITENS -->
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">
            Itens do Plano
          </h3>

          <button
            type="button"
            class="btn btn-outline"
            @click="adicionarItem"
          >
            Adicionar item
          </button>
        </div>

        <table class="table table--compact">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Qtd</th>
              <th>Valor unit.</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody v-if="plano.itens.length">
            <tr v-for="(item, index) in plano.itens" :key="index">

              <!-- PRODUTO -->
              <td>
                <input
                  class="form-input"
                  v-model="item.busca"
                  placeholder="Buscar produto"
                  @blur="onBuscarProduto(item)"
                />
                <div v-if="item.produtoNaoEncontrado" class="mt-2">
  <button
    type="button"
    class="btn btn-sm btn-outline"
    @click="abrirModalProduto(item)"
  >
    Cadastrar produto
  </button>
</div>

                <small
                  v-if="item.produto"
                  class="text-tertiary"
                >
                  {{ item.produto.nome }} • {{ item.produto.unidade }}
                </small>
              </td>

              <!-- UNIDADE -->
              <td>
                <select
                  class="form-select"
                  v-model="item.unidade"
                  disabled
                >
                  <option :value="item.unidade">
                    {{ item.unidade }}
                  </option>
                </select>
              </td>

              <!-- QTD -->
              <td>
                <input
                  type="number"
                  step="0.001"
                  class="form-input"
                  v-model.number="item.quantidade"
                />
              </td>

              <!-- VALOR -->
              <td>
                <input
                  type="number"
                  step="0.01"
                  class="form-input"
                  v-model.number="item.valor_unitario"
                />
              </td>

              <!-- TOTAL -->
              <td class="text-right">
                R$ {{ totalItem(item) }}
              </td>

              <td>
                <button
                  type="button"
                  class="btn btn-ghost btn-icon"
                  @click="removerItem(index)"
                >
                  ✕
                </button>
              </td>

            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="6" class="text-center text-secondary">
                Nenhum item adicionado
              </td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <!-- TOTAL -->
        <div class="flex justify-between items-center">
          <strong>Total</strong>
          <span class="text-xl font-bold">
            R$ {{ totalPlano }}
          </span>
        </div>

        <!-- AÇÃO -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
          >
            Salvar e enviar para produção
          </button>
        </div>

      </form>
    </div>

    <!-- MODAL PRODUTO (ÚNICO) -->
    <ProdutoModal
      v-if="mostrarModalProduto"
      :produtoInicial="produtoBase"
      @salvo="onProdutoCriado"
      @fechar="mostrarModalProduto = false"
    />

  </div>
</template>


<script>
import ProdutoModal from '@/components/ProdutoModal.vue'

export default {
  name: 'planodeCorteCreate',

  components: {
    ProdutoModal
  },

  data() {
    return {
      fornecedores: [],
      produtos: [],
      unidades: [],

      plano: {
        fornecedor_id: '',
        data_prevista: '',
        itens: []
      },

      // controle do modal
      mostrarModalProduto: false,
      itemProdutoAtual: null,

      produtoBase: {
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

  computed: {
    totalPlano() {
      return this.plano.itens
        .reduce(
          (total, item) =>
            total +
            Number(item.quantidade || 0) *
            Number(item.valor_unitario || 0),
          0
        )
        .toFixed(2)
    }
  },

  async mounted() {
    this.fornecedores = await (
      await fetch(`${import.meta.env.VITE_API_URL}/fornecedores`)
    ).json()

    this.produtos = await (
      await fetch(`${import.meta.env.VITE_API_URL}/produtos`)
    ).json()

    this.unidades = await (
      await fetch(
        `${import.meta.env.VITE_API_URL}/constantes?grupo=UNIDADE`
      )
    ).json()
  },

  methods: {
    adicionarItem() {
      this.plano.itens.push({
        busca: '',
        produto: null,
        unidade: '',
        quantidade: 0,
        valor_unitario: 0,
        produtoNaoEncontrado: false
      })
    },

    removerItem(index) {
      this.plano.itens.splice(index, 1)
    },

    totalItem(item) {
      return (
        (Number(item.quantidade || 0) *
          Number(item.valor_unitario || 0))
      ).toFixed(2)
    },

    // 🔍 BUSCA SOMENTE
    onBuscarProduto(item) {
      item.produtoNaoEncontrado = false
      item.produto = null

      const texto = item.busca?.trim().toLowerCase()
      if (!texto) return

      const produto = this.produtos.find(
        p =>
          p.nome.toLowerCase() === texto &&
          p.fornecedor === this.plano.fornecedor_id
      )

      if (produto) {
        item.produto = produto
        item.unidade = produto.unidade
        item.valor_unitario = produto.valor_unitario
        return
      }

      item.produtoNaoEncontrado = true
    },

    // ➕ ABRE MODAL POR BOTÃO
    abrirModalProduto(item) {
      this.itemProdutoAtual = item

      this.produtoBase = {
        nome: item.busca,
        fornecedor: this.plano.fornecedor_id,
        medida: '',
        cor: '',
        unidade: '',
        quantidade: 0,
        valor_unitario: 0
      }

      this.mostrarModalProduto = true
    },

    // ❌ FECHAR MODAL
    fecharModalProduto() {
      this.mostrarModalProduto = false
      this.itemProdutoAtual = null
    },

    // ✅ PRODUTO CRIADO
    onProdutoCriado(produto) {
      this.produtos.push(produto)

      if (this.itemProdutoAtual) {
        this.itemProdutoAtual.produto = produto
        this.itemProdutoAtual.busca = produto.nome
        this.itemProdutoAtual.unidade = produto.unidade
        this.itemProdutoAtual.valor_unitario =
          produto.valor_unitario
        this.itemProdutoAtual.produtoNaoEncontrado = false
      }

      this.fecharModalProduto()
    },

    async salvar() {
      await fetch(`${import.meta.env.VITE_API_URL}/planos-corte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.plano)
      })

      this.$router.push('/plano-corte')
    }
  }
}
</script>


