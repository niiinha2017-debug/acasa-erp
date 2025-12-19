<template>
  <div class="main-container">
    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Funcionários</h1>

        <div class="form-actions-inline">
          <button
            class="btn btn-secondary"
            :disabled="idsSelecionados.length === 0"
            @click="gerarPdf"
          >
            📄 Gerar PDF (Portaria)
          </button>

          <button
            class="btn btn-primary"
            @click="$router.push('/funcionarios/novo')"
          >
            Novo Funcionário
          </button>
        </div>
      </div>

      <!-- BUSCA -->
      <div class="form-group" style="margin-bottom: 16px">
        <input
          class="form-input"
          placeholder="Buscar por nome, CPF, setor ou função…"
          v-model="busca"
        />
      </div>

      <!-- TABELA -->
      <table class="table">
        <thead>
          <tr>
            <th width="40">
              <input
                type="checkbox"
                :checked="todosSelecionados"
                @change="toggleTodos"
              />
            </th>
            <th>Nome</th>
            <th>CPF</th>
            <th>Setor</th>
            <th>Função</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="f in funcionariosFiltrados" :key="f.id">
            <td>
              <input
                type="checkbox"
                :value="f.id"
                v-model="idsSelecionados"
              />
            </td>
            <td>{{ f.nome }}</td>
            <td>{{ f.cpf }}</td>
            <td>{{ f.setor || '-' }}</td>
            <td>{{ f.funcao || '-' }}</td>
            <td>{{ f.status }}</td>
            <td>
              <button class="btn btn-secondary" @click="editar(f.id)">
                Editar
              </button>
            </td>
          </tr>

          <tr v-if="funcionariosFiltrados.length === 0">
            <td colspan="7">Nenhum funcionário encontrado.</td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>



<script>
export default {
  name: 'FuncionariosIndex',

  data() {
    return {
      funcionarios: [],
      busca: '',
      idsSelecionados: [],
    }
  },

  computed: {
    funcionariosFiltrados() {
      if (!this.busca) return this.funcionarios

      const termo = this.busca.toLowerCase()

      return this.funcionarios.filter(f =>
        f.nome?.toLowerCase().includes(termo) ||
        f.cpf?.includes(termo) ||
        f.setor?.toLowerCase().includes(termo) ||
        f.funcao?.toLowerCase().includes(termo)
      )
    },

    todosSelecionados() {
      return (
        this.funcionariosFiltrados.length > 0 &&
        this.idsSelecionados.length === this.funcionariosFiltrados.length
      )
    },
  },

  async mounted() {
    await this.carregar()
  },

  methods: {
    async carregar() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/funcionarios`)
      this.funcionarios = await res.json()
    },

    editar(id) {
      this.$router.push(`/funcionarios/${id}`)
    },

    toggleTodos(e) {
      if (e.target.checked) {
        this.idsSelecionados = this.funcionariosFiltrados.map(f => f.id)
      } else {
        this.idsSelecionados = []
      }
    },

    async gerarPdf() {
      if (this.idsSelecionados.length === 0) {
        alert('Selecione pelo menos um funcionário')
        return
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/funcionarios/pdf`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: this.idsSelecionados }),
        }
      )

      if (!res.ok) {
        alert('Erro ao gerar PDF')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    },
  },
}
</script>

