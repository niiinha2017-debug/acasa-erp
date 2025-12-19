<template>
  <div class="main-container">
    <div class="form-card">

      <h1 class="form-title">
        {{ constanteId ? 'Editar Constante' : 'Nova Constante' }}
      </h1>

      <div class="form-grid">

        <div class="form-group col-span-4">
          <label class="form-label">Grupo</label>
          <input class="form-input" v-model="form.grupo" required />
        </div>

        <div class="form-group col-span-4">
          <label class="form-label">Código</label>
          <input class="form-input" v-model="form.codigo" required />
        </div>

        <div class="form-group col-span-4">
          <label class="form-label">Label</label>
          <input class="form-input" v-model="form.label" required />
        </div>

        <div class="form-group col-span-4">
          <label class="form-label">Valor</label>
          <input class="form-input" v-model="form.valor" />
        </div>

        <div class="form-group col-span-4">
          <label class="form-label">
            <input type="checkbox" v-model="form.ativo" />
            Ativo
          </label>
        </div>

      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="salvar">Salvar</button>
        <button class="btn btn-secondary" @click="$router.push('/constantes')">
          Voltar
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import {
  criarConstante,
  atualizarConstante,
  listarConstantes,
} from '@/services/constantes'

export default {
  name: 'ConstantesForm',

  data() {
    return {
      constanteId: null,
      form: {
        grupo: '',
        codigo: '',
        label: '',
        valor: '',
        ativo: true,
      },
    }
  },

  async mounted() {
    if (this.$route.params.id) {
      this.constanteId = this.$route.params.id
      const { data } = await listarConstantes()
      const c = data.find(i => i.id == this.constanteId)
      if (c) this.form = { ...c, ativo: !!c.ativo }
    }
  },

  methods: {
    async salvar() {
      const payload = {
        ...this.form,
        ativo: this.form.ativo ? 1 : 0,
      }

      if (this.constanteId) {
        await atualizarConstante(this.constanteId, payload)
      } else {
        await criarConstante(payload)
      }

      this.$router.push('/constantes')
    },
  },
}
</script>
