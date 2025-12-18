<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">Constantes</h1>

        <button class="btn btn-primary" @click="$router.push('/constantes/nova')">
          Nova Constante
        </button>
      </div>

      <!-- FILTRO -->
      <div class="form-grid" style="margin-bottom: 16px">
        <div class="form-group col-span-4">
          <label class="form-label">Grupo</label>
          <input class="form-input" v-model="grupo" placeholder="DESPESAS, UNIDADE..." />
        </div>
      </div>

      <!-- TABELA -->
      <table class="table">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Código</th>
            <th>Label</th>
            <th>Valor</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="c in constantes" :key="c.id">
            <td>{{ c.grupo }}</td>
            <td>{{ c.codigo }}</td>
            <td>{{ c.label }}</td>
            <td>{{ c.valor || '-' }}</td>
            <td>{{ c.ativo ? 'Ativo' : 'Inativo' }}</td>
            <td>
              <button class="btn btn-secondary" @click="editar(c.id)">
                Editar
              </button>
            </td>
          </tr>

          <tr v-if="constantes.length === 0">
            <td colspan="6">Nenhuma constante encontrada.</td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>

<script>
import { listarConstantes } from '@/services/constantes'

export default {
  name: 'ConstantesList',

  data() {
    return {
      constantes: [],
      grupo: '',
    }
  },

  watch: {
    grupo() {
      this.carregar()
    },
  },

  mounted() {
    this.carregar()
  },

  methods: {
    async carregar() {
      const { data } = await listarConstantes(
        this.grupo ? { grupo: this.grupo } : {}
      )
      this.constantes = data
    },

    editar(id) {
      this.$router.push(`/constantes/${id}`)
    },
  },
}
</script>
