<template>
  <div class="main-container">
    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Planos de Corte</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/planos-corte/novo')"
        >
          Novo Plano
        </button>
      </div>
<div class="form-group mb-4">
  <input
    class="form-input"
    v-model="busca"
    placeholder="Buscar por fornecedor, item, status ou data"
  />
</div>

      <!-- TABELA -->
      <table class="table">
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Descrição</th>
            <th>Valor total</th>
            <th>Status</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>

        <tbody v-if="planos.length">
          <tr v-for="plano in planos" :key="plano.id">

            <!-- FORNECEDOR -->
            <td>
              {{ plano.fornecedor?.nome || '-' }}
            </td>

            <!-- DESCRIÇÃO -->
            <td class="text-secondary">
              {{ descricaoItens(plano.itens) }}
            </td>

            <!-- VALOR -->
            <td>
              R$ {{ plano.valor_total.toFixed(2) }}
            </td>

            <!-- STATUS -->
            <td>
              <span class="badge">
                {{ plano.status }}
              </span>
            </td>

            <!-- DATA -->
            <td>
              {{ formatarData(plano.created_at) }}
            </td>

            <!-- AÇÕES -->
            <td>
              <button
                class="btn btn-ghost btn-sm"
                @click="abrir(plano.id)"
              >
                Ver
              </button>
            </td>

          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td colspan="6" class="text-center text-secondary">
              Nenhum plano cadastrado
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>

<script>
import { parseBuscaPlanoCorte } from '@/utils/search'

export default {
  name: 'PlanoCorteList',

  data() {
    return {
      planos: [],
      busca: ''
    }
  },

  async mounted() {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/planos-corte`
    )
    this.planos = await res.json()
  },

  computed: {
    planosFiltrados() {
      if (!this.busca) return this.planos

      const filtros = parseBuscaPlanoCorte(this.busca)

      return this.planos.filter(plano => {
        // STATUS
        if (filtros.status && plano.status !== filtros.status) {
          return false
        }

        // DATA
        if (filtros.data) {
          const dataPlano = new Date(plano.created_at)
            .toLocaleDateString('pt-BR')

          if (!dataPlano.includes(filtros.data)) {
            return false
          }
        }

        // TEXTO (fornecedor + itens)
const textoPlano = [
  plano.fornecedor?.nome,
  ...plano.itens.map(i =>
    i.cor ? `${i.nome} ${i.cor}` : i.nome
  )
]
  .join(' ')
  .toLowerCase()


        return filtros.texto.every(t =>
          textoPlano.includes(t)
        )
      })
    }
  },

  methods: {
descricaoItens(itens = []) {
  return itens
    .map(i => {
      if (i.cor) return `${i.nome} (${i.cor})`
      return i.nome
    })
    .join(' • ')
},


    formatarData(data) {
      if (!data) return '-'
      return new Date(data).toLocaleDateString('pt-BR')
    },

    abrir(id) {
      this.$router.push(`/planos-corte/${id}`)
    }
  }
}
</script>

