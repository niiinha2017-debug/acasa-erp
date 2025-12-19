<template>
  <div class="main-container">
    <div class="form-card">

      <!-- CABEÇALHO -->
      <div class="form-header">
        <h1 class="form-title">Fornecedores</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/fornecedores/novo')"
        >
          Novo Fornecedor
        </button>
      </div>

      <!-- BUSCA INTELIGENTE -->
      <div class="form-grid mb-4">
        <SearchInput
          v-model="busca"
          label="Buscar fornecedor"
          placeholder="Razão social, CNPJ, vendedor, status, dia de fechamento..."
          col-span="col-span-6"
        />
      </div>

      <!-- TABELA -->
      <table class="table">
        <thead>
          <tr>
            <th>Razão Social</th>
            <th>CNPJ</th>
            <th>Telefone</th>
            <th>Vendedor</th>
            <th>Dia Fechamento</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="f in fornecedoresFiltrados"
            :key="f.id"
          >
            <td>{{ f.razao_social || '-' }}</td>
            <td>{{ f.cpf_cnpj || '-' }}</td>
            <td>{{ f.telefone_loja || '-' }}</td>
            <td>{{ f.vendedor_nome || '-' }}</td>
            <td>
              {{ f.dia_fechamento ? `Dia ${f.dia_fechamento}` : '-' }}
            </td>
            <td>{{ f.status }}</td>
            <td>
              <button
                class="btn btn-secondary"
                @click="editar(f.id)"
              >
                Editar
              </button>
            </td>
          </tr>

          <!-- SEM RESULTADOS -->
          <tr v-if="fornecedoresFiltrados.length === 0">
            <td colspan="7" class="text-center text-muted">
              Nenhum fornecedor encontrado
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>


<script>
import api from '@/services/api'
import SearchInput from '@/components/ui/SearchInput.vue'
import { parseBuscaFornecedor } from '@/utils/search'
import { onlyNumbers } from '@/utils/utils'

export default {
  name: 'FornecedoresIndex',

  components: {
    SearchInput,
  },

  data() {
    return {
      fornecedores: [],
      busca: '',
    }
  },

  async mounted() {
    try {
      const { data } = await api.get('/fornecedores')
      this.fornecedores = data
    } catch (e) {
      console.error('Erro ao carregar fornecedores', e)
      this.fornecedores = []
    }
  },

  computed: {
    fornecedoresFiltrados() {
      if (!this.busca) return this.fornecedores

      const filtros = parseBuscaFornecedor(this.busca)

      return this.fornecedores.filter(f => {
        // STATUS
        if (filtros.status && f.status !== filtros.status) {
          return false
        }

        // DIA DE FECHAMENTO
        if (
          filtros.dia_fechamento &&
          Number(f.dia_fechamento) !== filtros.dia_fechamento
        ) {
          return false
        }

        // CNPJ
        if (
          filtros.cnpj &&
          onlyNumbers(f.cpf_cnpj) !== filtros.cnpj
        ) {
          return false
        }

        // TEXTO LIVRE
        if (filtros.texto.length) {
          const base = `
            ${f.razao_social}
            ${f.nome_fantasia}
            ${f.vendedor_nome}
          `.toLowerCase()

          const ok = filtros.texto.every(t =>
            base.includes(t)
          )

          if (!ok) return false
        }

        return true
      })
    },
  },

  methods: {
    editar(id) {
      this.$router.push(`/fornecedores/${id}`)
    },
  },
}
</script>

