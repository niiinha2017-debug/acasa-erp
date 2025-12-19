<template>
  <div class="main-container">
    <div class="form-card animate-fadeIn">

      <!-- HEADER -->
      <div class="form-header">
        <div>
          <h1 class="form-title">Nova Despesa</h1>
        </div>
      </div>

      <form @submit.prevent="submitForm">

        <!-- LINHA 1 -->
        <div class="form-grid">
          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Descrição
            </label>
            <select
              v-model="despesa.descricao"
              required
              class="form-select"
            >
              <option value="">Selecione</option>
              <option
                v-for="d in descricoesFinanceiras"
                :key="d.id"
                :value="d.codigo"
              >
                {{ d.label }}
              </option>
            </select>
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">
              Categoria
            </label>
            <input
              type="text"
              v-model="despesa.categoria"
              disabled
              class="form-input"
            />
          </div>
        </div>

        <!-- LINHA 2 -->
        <div class="form-grid">
          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Tipo
            </label>
            <select
              v-model="despesa.tipo"
              required
              class="form-select"
            >
              <option value="">Selecione</option>
              <option
                v-for="t in tiposFinanceiros"
                :key="t.id"
                :value="t.codigo"
              >
                {{ t.label }}
              </option>
            </select>
          </div>

          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Status
            </label>
            <select
              v-model="despesa.status"
              required
              class="form-select"
            >
              <option
                v-for="s in statusFinanceiro"
                :key="s.id"
                :value="s.codigo"
              >
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- LINHA 3 -->
        <div class="form-grid">
          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Forma de Pagamento
            </label>
            <select
              v-model="despesa.forma_pagamento"
              required
              class="form-select"
            >
              <option value="">Selecione</option>
              <option
                v-for="f in formasPagamento"
                :key="f.id"
                :value="f.codigo"
              >
                {{ f.label }}
              </option>
            </select>
          </div>

          <div
            class="form-group col-span-6"
            v-if="exigeParcelas"
          >
            <label class="form-label">
              Parcelas
            </label>
            <select
              v-model="despesa.parcelas"
              class="form-select"
            >
              <option value="">Selecione</option>
              <option
                v-for="p in parcelasCartao"
                :key="p.id"
                :value="p.codigo"
              >
                {{ p.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- LINHA 4 -->
        <div class="form-grid">
          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              v-model="despesa.valor"
              required
              class="form-input"
            />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label form-label-required">
              Data
            </label>
            <input
              type="date"
              v-model="despesa.data"
              required
              class="form-input"
            />
          </div>
        </div>

        <!-- OBSERVAÇÃO -->
        <div class="form-group col-span-12">
          <label class="form-label">
            Observação
          </label>
          <textarea
            v-model="despesa.observacao"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>

        <!-- AÇÕES -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelar"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="salvando"
          >
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>

        <!-- MENSAGENS -->
        <p v-if="mensagemErro" class="form-error">
          {{ mensagemErro }}
        </p>

        <p v-if="mensagemSucesso" class="form-help">
          {{ mensagemSucesso }}
        </p>

      </form>
    </div>
  </div>
</template>


<script>
import SearchInput from '@/components/ui/SearchInput.vue'

export default {
  name: 'DespesasCreate',

  components: {
    SearchInput,
  },

  data() {
    return {
      salvando: false,
      mensagemErro: '',
      mensagemSucesso: '',

      // CONSTANTES (VINDAS DO BACKEND)
      descricoesFinanceiras: [],
      tiposFinanceiros: [],
      statusFinanceiro: [],
      formasPagamento: [],
      parcelasCartao: [],

      despesa: {
        descricao: '',
        categoria: '',
        tipo: '',
        status: '',
        forma_pagamento: '',
        parcelas: '',
        valor: null,
        data: '',
        observacao: '',
      },
    }
  },

  async mounted() {
    await Promise.all([
      this.carregarConstantes('DESCRICOES_FINANCEIRAS', 'descricoesFinanceiras'),
      this.carregarConstantes('TIPOS_FINANCEIROS', 'tiposFinanceiros'),
      this.carregarConstantes('STATUS_FINANCEIRO', 'statusFinanceiro'),
      this.carregarConstantes('FORMAS_PAGAMENTO', 'formasPagamento'),
      this.carregarConstantes('PARCELAS_CARTAO', 'parcelasCartao'),
    ])
  },

  watch: {
    // DESCRIÇÃO → CATEGORIA AUTOMÁTICA
    'despesa.descricao'(codigo) {
      const item = this.descricoesFinanceiras.find(
        d => d.codigo === codigo
      )
      this.despesa.categoria = item ? item.extra?.categoria || '' : ''
    },
  },

  computed: {
    exigeParcelas() {
      return (
        this.despesa.forma_pagamento === 'CREDITO' ||
        this.despesa.forma_pagamento === 'CHEQUE'
      )
    },
  },

  methods: {
    async carregarConstantes(grupo, destino) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/constantes?grupo=${grupo}&ativo=1`
        )

        if (!res.ok) throw new Error(`Erro ao carregar ${grupo}`)

        this[destino] = await res.json()
      } catch (e) {
        console.error(e)
        this.mensagemErro = 'Erro ao carregar constantes do sistema'
      }
    },

    async submitForm() {
      this.mensagemErro = ''
      this.salvando = true

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/despesas`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.despesa),
          }
        )

        if (!res.ok) {
          throw new Error('Erro ao salvar despesa')
        }

        this.mensagemSucesso = 'Despesa salva com sucesso'
        this.$router.push('/despesas')

      } catch (e) {
        this.mensagemErro = e.message
      } finally {
        this.salvando = false
      }
    },

    cancelar() {
      this.$router.push('/despesas')
    },
  },
}
</script>



