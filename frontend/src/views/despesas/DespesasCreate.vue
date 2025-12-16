<template>
  <div class="main-container">
    <div class="form-card">
      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Nova Despesa</h1>
      </div>

      <!-- FORM -->
      <form @submit.prevent="submitForm">
        <div class="form-grid">
          <!-- Descrição -->
          <div class="form-group col-span-12">
            <label class="form-label">Descrição *</label>
            <input
              class="form-input"
              v-model.trim="despesa.descricao"
              required
              placeholder="Ex: Conta de luz / combustível / manutenção"
            />
          </div>

          <!-- Categoria -->
          <div class="form-group col-span-6">
            <label class="form-label">Categoria</label>
            <input
              class="form-input"
              v-model.trim="despesa.categoria"
              placeholder="Ex: Energia, Transporte, Manutenção..."
            />
          </div>

          <!-- Data -->
          <div class="form-group col-span-3">
            <label class="form-label">Data *</label>
            <input
              class="form-input"
              type="date"
              v-model="despesa.data"
              required
            />
          </div>

          <!-- Status -->
          <div class="form-group col-span-3">
            <label class="form-label">Status</label>
            <select class="form-input form-select" v-model="despesa.status">
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <!-- Valor -->
          <div class="form-group col-span-4">
            <label class="form-label">Valor (R$) *</label>
            <input
              class="form-input"
              type="number"
              step="0.01"
              min="0"
              v-model.number="despesa.valor"
              required
              placeholder="0,00"
            />
          </div>

          <!-- Forma de pagamento -->
          <div class="form-group col-span-4">
            <label class="form-label">Forma de Pagamento</label>
            <select class="form-input form-select" v-model="despesa.forma_pagamento">
              <option value="">Selecione</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Pix">Pix</option>
              <option value="Cartão">Cartão</option>
              <option value="Boleto">Boleto</option>
              <option value="Transferência">Transferência</option>
            </select>
          </div>

          <!-- Centro de custo -->
          <div class="form-group col-span-4">
            <label class="form-label">Centro de Custo</label>
            <input
              class="form-input"
              v-model.trim="despesa.centro_custo"
              placeholder="Ex: Produção, Administrativo..."
            />
          </div>

          <!-- Observação -->
          <div class="form-group col-span-12">
            <label class="form-label">Observação</label>
            <textarea
              class="form-textarea"
              v-model.trim="despesa.observacao"
              placeholder="Detalhes adicionais..."
            ></textarea>
          </div>
        </div>

        <!-- AÇÕES -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="cancelar">
            Cancelar
          </button>

          <button type="submit" class="btn btn-primary" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar Despesa' }}
          </button>
        </div>

        <p v-if="mensagemErro" class="text-sm" style="color: var(--danger); margin-top: 12px;">
          {{ mensagemErro }}
        </p>

        <p v-if="mensagemSucesso" class="text-sm" style="color: var(--success); margin-top: 12px;">
          {{ mensagemSucesso }}
        </p>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DespesasCreate',

  data() {
    return {
      salvando: false,
      mensagemErro: '',
      mensagemSucesso: '',

      despesa: {
        descricao: '',
        categoria: '',
        data: this.todayISO(),
        valor: 0,
        status: 'Pendente',
        forma_pagamento: '',
        centro_custo: '',
        observacao: '',
      },
    }
  },

  methods: {
    todayISO() {
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },

    async submitForm() {
      this.mensagemErro = ''
      this.mensagemSucesso = ''
      this.salvando = true

      const apiUrl = import.meta.env.VITE_API_URL
      const endpoint = `${apiUrl}/despesas`

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.despesa),
        })

        if (res.ok || res.status === 201) {
          this.mensagemSucesso = 'Despesa cadastrada com sucesso!'
          // volta pra lista (ajuste a rota se usar outro caminho)
          this.$router.push('/despesas')
        } else {
          let msg = 'Erro ao cadastrar despesa.'
          try {
            const data = await res.json()
            msg = data?.message || msg
          } catch (_) {}
          this.mensagemErro = msg
        }
      } catch (e) {
        this.mensagemErro = 'Erro de conexão com a API. Verifique o backend.'
        console.error(e)
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
