<template>
  <div class="main-container">

    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Clientes</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/clientes/novo')"
        >
          Novo Cliente
        </button>
      </div>

      <!-- BUSCA INTELIGENTE -->
      <div class="form-grid mb-4">
        <SearchInput
          v-model="busca"
          label="Buscar cliente"
          placeholder="Nome, telefone, status, fase, data…"
          col-span="col-span-6"
        />
      </div>

      <!-- ESTADOS -->
      <div v-if="loading">Carregando…</div>
      <div v-if="error">{{ error }}</div>

      <!-- TABELA -->
      <table class="table" v-if="!loading">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Contato</th>
            <th>Status</th>
            <th>Fase</th>
            <th>Datas</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="cliente in clientesFiltrados"
            :key="cliente.id"
          >
            <td>{{ cliente.nome }}</td>

            <!-- CONTATO -->
            <td>{{ cliente.telefone || '-' }}</td>

            <!-- STATUS -->
            <td>{{ cliente.status }}</td>

            <!-- FASE (VEM DA MONTAGEM – DEPOIS) -->
            <td>{{ cliente.fase_montagem || '-' }}</td>

            <!-- DATAS (AGENDA / ÚLTIMA ATUALIZAÇÃO – DEPOIS) -->
            <td>{{ cliente.data_agenda || '-' }}</td>

            <td>
              <button
                class="btn btn-secondary"
                @click="$router.push(`/clientes/${cliente.id}`)"
              >
                Editar
              </button>
            </td>
          </tr>

          <!-- SEM RESULTADOS -->
          <tr v-if="clientesFiltrados.length === 0">
            <td colspan="6">
              Nenhum cliente encontrado.
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
import { parseBuscaInteligente } from '@/utils/search'

export default {
  name: 'ClientesList',

  components: {
    SearchInput,
  },

  data() {
    return {
      clientes: [],
      busca: '',

      loading: false,
      error: null,
    }
  },

  mounted() {
    console.group('🟦 ClientesList → mounted')
    console.log('estado inicial', {
      clientes: this.clientes,
      loading: this.loading,
      error: this.error,
    })
    console.groupEnd()

    this.fetchClientes()
  },

  computed: {
    clientesFiltrados() {
      if (!this.busca) return this.clientes

      const filtros = parseBuscaInteligente(this.busca)

      return this.clientes.filter(c => {
        // STATUS
        if (filtros.status && c.status !== filtros.status) {
          return false
        }

        // TEXTO LIVRE
        if (filtros.texto.length) {
          const base = `
            ${c.nome}
            ${c.telefone}
            ${c.email}
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
    async fetchClientes() {
      console.group('📡 fetchClientes')

      console.log('ANTES da requisição', {
        loading: this.loading,
        clientes: this.clientes,
      })

      this.loading = true
      this.error = null

      try {
        console.log('➡️ chamando API /clientes')
        const response = await api.get('/clientes')

        console.log('⬅️ resposta bruta:', response)
        console.log('⬅️ response.data:', response.data)

        if (!Array.isArray(response.data)) {
          throw new Error('Resposta da API não é um array')
        }

        this.clientes = response.data

        console.log('✅ clientes setados com sucesso', this.clientes)

      } catch (e) {
        console.error('❌ ERRO REAL em fetchClientes', e)

        this.error = 'Erro ao carregar clientes'
        this.clientes = []

      } finally {
        this.loading = false

        console.log('FIM do fetchClientes', {
          loading: this.loading,
          clientes: this.clientes,
          error: this.error,
        })

        console.groupEnd()
      }
    },

    async excluir(id) {
      console.group('🗑 excluir cliente')

      console.log('id recebido:', id)

      if (!id) {
        console.warn('❗ id inválido, abortando')
        console.groupEnd()
        return
      }

      if (!confirm('Excluir este cliente?')) {
        console.log('❌ exclusão cancelada pelo usuário')
        console.groupEnd()
        return
      }

      try {
        console.log('➡️ DELETE /clientes/' + id)
        await api.delete(`/clientes/${id}`)

        console.log('✅ cliente excluído, recarregando lista')
        await this.fetchClientes()

      } catch (e) {
        console.error('❌ erro ao excluir cliente', e)
        alert('Erro ao excluir cliente')
      }

      console.groupEnd()
    },
  },
}
</script>







