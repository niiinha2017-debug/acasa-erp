<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">
          {{ fornecedorId ? 'Editar Fornecedor' : 'Novo Fornecedor' }}
        </h1>
      </div>

      <form @submit.prevent="submitForm">
        <div class="form-grid">

          <!-- DADOS PRINCIPAIS -->
          <div class="form-group col-span-6">
            <label class="form-label">Nome Fantasia *</label>
            <input class="form-input" v-model="fornecedor.nome_fantasia" required />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Razão Social</label>
            <input class="form-input" v-model="fornecedor.razao_social" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">CPF / CNPJ</label>
            <input class="form-input" v-model="fornecedor.cpf_cnpj" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Inscrição Estadual</label>
            <input class="form-input" v-model="fornecedor.inscricao_estadual" />
          </div>

          <!-- CONTATO -->
          <div class="form-group col-span-6">
            <label class="form-label">Telefone da Loja</label>
            <input class="form-input" v-model="fornecedor.telefone_loja" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">E-mail da Loja</label>
            <input class="form-input" v-model="fornecedor.email_loja" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Nome do Vendedor</label>
            <input class="form-input" v-model="fornecedor.vendedor_nome" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Contato do Vendedor</label>
            <input class="form-input" v-model="fornecedor.vendedor_contato" />
          </div>

          <!-- ENDEREÇO -->
          <div class="form-group col-span-4">
            <label class="form-label">CEP</label>
            <input class="form-input" v-model="fornecedor.cep" />
          </div>

          <div class="form-group col-span-8">
            <label class="form-label">Endereço</label>
            <input class="form-input" v-model="fornecedor.endereco" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Número</label>
            <input class="form-input" v-model="fornecedor.numero" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Bairro</label>
            <input class="form-input" v-model="fornecedor.bairro" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Cidade</label>
            <input class="form-input" v-model="fornecedor.cidade" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">UF</label>
            <input class="form-input" v-model="fornecedor.estado" maxlength="2" />
          </div>

          <!-- FINANCEIRO -->
          <div class="form-group col-span-3">
            <label class="form-label">Dia Fechamento</label>
            <input type="number" class="form-input" v-model="fornecedor.dia_fechamento" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Dia Vencimento</label>
            <input type="number" class="form-input" v-model="fornecedor.dia_vencimento" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Chave PIX</label>
            <input class="form-input" v-model="fornecedor.chave_pix" />
          </div>

          <div class="form-group col-span-12">
            <label class="form-label">Dados Bancários</label>
            <textarea class="form-textarea" v-model="fornecedor.dados_bancarios"></textarea>
          </div>

          <div class="form-group col-span-12">
            <label class="form-label">Observação</label>
            <textarea class="form-textarea" v-model="fornecedor.observacao"></textarea>
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Status</label>
            <select class="form-input form-select" v-model="fornecedor.status">
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="voltar">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">
            Salvar
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script>
export default {
  name: 'FornecedoresForm',

  data() {
    return {
      fornecedorId: null,
      fornecedor: {
        nome_fantasia: '',
        razao_social: '',
        cpf_cnpj: '',
        inscricao_estadual: '',
        telefone_loja: '',
        email_loja: '',
        vendedor_nome: '',
        vendedor_contato: '',
        cep: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        dia_fechamento: null,
        dia_vencimento: null,
        chave_pix: '',
        dados_bancarios: '',
        observacao: '',
        status: 'Ativo'
      }
    }
  },

  async mounted() {
    if (this.$route.params.id) {
      this.fornecedorId = this.$route.params.id
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/fornecedores/${this.fornecedorId}`
      )
      this.fornecedor = await res.json()
    }
  },

  methods: {
    async submitForm() {
      const method = this.fornecedorId ? 'PUT' : 'POST'
      const url = this.fornecedorId
        ? `${import.meta.env.VITE_API_URL}/fornecedores/${this.fornecedorId}`
        : `${import.meta.env.VITE_API_URL}/fornecedores`

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.fornecedor)
      })

      this.$router.push('/fornecedores')
    },

    voltar() {
      this.$router.push('/fornecedores')
    }
  }
}
</script>
