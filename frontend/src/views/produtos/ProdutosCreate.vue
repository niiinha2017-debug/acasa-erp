<template>
  <div class="main-container">
    <div class="form-card animate-fadeIn">

      <!-- HEADER -->
      <div class="form-header">
        <div>
          <h1 class="form-title">
            Cadastro de Produto
          </h1>
          <p class="form-subtitle">
            Informações do produto e fornecedor
          </p>
        </div>
      </div>

      <!-- FORM -->
      <form>

        <div class="form-grid">

          <!-- FORNECEDOR -->
          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Fornecedor
            </label>
            <select class="form-select">
              <option value="">Selecione o fornecedor</option>
            </select>
          </div>

          <!-- NOME -->
          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Nome do Produto
            </label>
            <input
              type="text"
              class="form-input"
              placeholder="Ex: MDF Branco"
            />
          </div>

          <!-- MEDIDA -->
          <div class="form-group col-span-4">
            <label class="form-label">
              Medida
            </label>
            <input
              type="text"
              class="form-input"
              placeholder="Ex: 15mm"
            />
          </div>

          <!-- COR -->
          <div class="form-group col-span-4">
            <label class="form-label">
              Cor
            </label>
            <input
              type="text"
              class="form-input"
              placeholder="Ex: Branco"
            />
          </div>

          <!-- UNIDADE -->
          <div class="form-group col-span-4">
            <label class="form-label">
              Unidade
            </label>
            <select class="form-select">
              <option value="">Selecione</option>
            </select>
          </div>

          <!-- QUANTIDADE -->
          <div class="form-group col-span-6">
            <label class="form-label">
              Quantidade
            </label>
            <input
              type="number"
              class="form-input"
              placeholder="0"
            />
          </div>

          <!-- VALOR UNITÁRIO -->
          <div class="form-group col-span-6">
            <label class="form-label">
              Valor Unitário
            </label>
            <input
              type="number"
              class="form-input"
              placeholder="0,00"
            />
          </div>

        </div>

        <!-- ACTIONS -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            Salvar Produto
          </button>
        </div>

      </form>
    </div>
  </div>
</template>


<script>
import { listarConstantes } from '@/services/constantes'
import api from '@/services/api'

export default {
  name: 'ProdutosForm',

  data() {
    return {
      produtoId: null,

      unidades: [],
      fornecedores: [],

      produto: {
        nome: '',
        fornecedor: '',
        medida: '',
        cor: '',
        unidade: '',
        quantidade: null,
        valor_unitario: null
      }
    }
  },

  async mounted() {
    await Promise.all([
      this.loadUnidades(),
      this.loadFornecedores()
    ])

    if (this.$route.params.id) {
      this.produtoId = this.$route.params.id
      const { data } = await api.get(`/produtos/${this.produtoId}`)
      this.produto = data
    }
  },

  methods: {
    // 🔹 CONSTANTES (UNIDADE_PRODUTO)
    async loadUnidades() {
      const { data } = await listarConstantes({
        grupo: 'UNIDADE_PRODUTO',
        ativo: 1
      })

      this.unidades = data
    },

    // 🔹 FORNECEDORES
    async loadFornecedores() {
      const { data } = await api.get('/fornecedores')
      this.fornecedores = data
    },

    // 🔹 SUBMIT
    async submitForm() {
      try {
        let response

        if (this.produtoId) {
          response = await api.put(
            `/produtos/${this.produtoId}`,
            this.produto
          )
        } else {
          response = await api.post('/produtos', this.produto)
        }

        const produtoSalvo = response.data

        // ⚠️ REGRA IMPORTANTE:
        // backend pode ter retornado um produto já existente
        if (!this.produtoId && produtoSalvo.id) {
          this.$router.push(`/produtos/${produtoSalvo.id}`)
          return
        }

        this.$router.push('/produtos')
      } catch (err) {
        alert(err.response?.data?.message || 'Erro ao salvar produto')
      }
    },

    voltar() {
      this.$router.push('/produtos')
    }
  }
}
</script>
