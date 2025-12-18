<template>
  <div class="main-container">
    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Despesas</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/despesas/nova')"
        >
          Nova Despesa
        </button>
      </div>

      <!-- BUSCA -->
      <div class="form-grid" style="margin-bottom: 16px">

        <SearchInput
          label="Buscar"
          v-model="busca"
          :options="[]"
          placeholder="Descrição, tipo, status, valor..."
          col-span="col-span-8"
        />

        <!-- DATA INICIAL -->
        <div class="form-group col-span-2">
          <label class="form-label">Data inicial</label>
          <input
            type="date"
            class="form-input"
            v-model="data_inicio"
          />
        </div>

        <!-- DATA FINAL -->
        <div class="form-group col-span-2">
          <label class="form-label">Data final</label>
          <input
            type="date"
            class="form-input"
            v-model="data_fim"
          />
        </div>

      </div>

      <!-- TABELA -->
      <table class="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Valor</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="d in despesas"
            :key="d.id"
          >
            <td>{{ formatDate(d.data) }}</td>

            <td>{{ d.descricao }}</td>

            <td>{{ d.tipo || '-' }}</td>

            <td>{{ d.status }}</td>

            <td>
              R$ {{ Number(d.valor).toFixed(2) }}
            </td>

            <td class="table-actions">
              <button
                class="btn btn-secondary"
                @click="$router.push(`/despesas/${d.id}/editar`)"
              >
                ✏️
              </button>

              <button
                class="btn btn-secondary"
                @click="excluir(d.id)"
              >
                🗑
              </button>
            </td>
          </tr>

          <tr v-if="!loading && despesas.length === 0">
            <td colspan="6">Nenhuma despesa encontrada.</td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>


<script>
import SearchInput from '@/components/ui/SearchInput.vue'
import { parseBuscaInteligente } from '@/utils/search'

export default {
  components: { SearchInput },

  data() {
    return {
      despesas: [],
      loading: false,

      busca: '',
      data_inicio: '',
      data_fim: '',
    }
  },

  watch: {
    busca() {
      this.carregar()
    },
    data_inicio() {
      this.carregar()
    },
    data_fim() {
      this.carregar()
    },
  },

  mounted() {
    this.carregar()
  },

  methods: {
    async carregar() {
      this.loading = true
      const apiUrl = import.meta.env.VITE_API_URL
      const params = new URLSearchParams()

      // BUSCA INTELIGENTE
      if (this.busca) {
        const parsed = parseBuscaInteligente(this.busca)

        if (parsed.texto.length) {
          params.append('busca', parsed.texto.join(' '))
        }

        if (parsed.status) {
          params.append('status', parsed.status)
        }

        if (parsed.tipo) {
          params.append('tipo', parsed.tipo)
        }
      }

      // DATAS
      if (this.data_inicio) params.append('data_inicio', this.data_inicio)
      if (this.data_fim) params.append('data_fim', this.data_fim)

      // URL SEGURA (sem /despesas?)
      const url = params.toString()
        ? `${apiUrl}/despesas?${params}`
        : `${apiUrl}/despesas`

      try {
        const res = await fetch(url)

        if (!res.ok) {
          console.error('❌ Erro ao buscar despesas', res.status)
          this.despesas = []
          return
        }

        const data = await res.json()

        if (!Array.isArray(data)) {
          console.warn('⚠️ API não retornou array:', data)
          this.despesas = []
        } else {
          this.despesas = data
        }
      } catch (e) {
        console.error('❌ Falha de rede ao buscar despesas', e)
        this.despesas = []
      } finally {
        this.loading = false
      }
    },

    async excluir(id) {
      if (!id) {
        alert('Despesa inválida')
        return
      }

      if (!confirm('Excluir esta despesa?')) return

      const apiUrl = import.meta.env.VITE_API_URL

      try {
        await fetch(`${apiUrl}/despesas/${id}`, { method: 'DELETE' })
        this.carregar()
      } catch (e) {
        console.error('❌ erro ao excluir despesa', e)
        alert('Erro ao excluir despesa')
      }
    },

    formatDate(v) {
      if (!v) return ''
      return new Date(v).toLocaleDateString('pt-BR')
    },
  },
}
</script>



