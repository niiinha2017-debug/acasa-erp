<template>
  <div class="main-container">
    <div class="form-card">

      <div class="form-header">
        <h1 class="form-title">
          {{ funcionarioId ? 'Editar Funcionário' : 'Novo Funcionário' }}
        </h1>
      </div>

      <form @submit.prevent="submitForm">
        <div class="form-grid">

          <!-- DADOS PESSOAIS -->
          <div class="form-group col-span-6">
            <label class="form-label">Nome *</label>
            <input class="form-input" v-model="funcionario.nome" required />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">CPF *</label>
            <input class="form-input" v-model="funcionario.cpf" required />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">RG</label>
            <input class="form-input" v-model="funcionario.rg" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Nascimento</label>
            <input type="date" class="form-input" v-model="funcionario.nascimento" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Sexo</label>
            <select class="form-input form-select" v-model="funcionario.sexo">
              <option value="">Selecione</option>
              <option>Feminino</option>
              <option>Masculino</option>
              <option>Outro</option>
            </select>
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Estado Civil</label>
            <input class="form-input" v-model="funcionario.estado_civil" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Escolaridade</label>
            <input class="form-input" v-model="funcionario.escolaridade" />
          </div>

          <!-- CONTATO -->
          <div class="form-group col-span-6">
            <label class="form-label">E-mail</label>
            <input class="form-input" v-model="funcionario.email" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Telefone</label>
            <input class="form-input" v-model="funcionario.telefone" />
          </div>

          <!-- ENDEREÇO -->
          <div class="form-group col-span-4">
            <label class="form-label">CEP</label>
            <input class="form-input" v-model="funcionario.cep" />
          </div>

          <div class="form-group col-span-8">
            <label class="form-label">Endereço</label>
            <input class="form-input" v-model="funcionario.endereco" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Número</label>
            <input class="form-input" v-model="funcionario.numero" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Complemento</label>
            <input class="form-input" v-model="funcionario.complemento" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Bairro</label>
            <input class="form-input" v-model="funcionario.bairro" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Cidade</label>
            <input class="form-input" v-model="funcionario.cidade" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">UF</label>
            <input class="form-input" v-model="funcionario.estado" maxlength="2" />
          </div>

          <!-- VÍNCULO PROFISSIONAL -->
          <div class="form-group col-span-3">
            <label class="form-label">Setor</label>
            <input class="form-input" v-model="funcionario.setor" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Função</label>
            <input class="form-input" v-model="funcionario.funcao" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Tipo de Contrato</label>
            <input class="form-input" v-model="funcionario.tipo_contrato" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Carga Horária</label>
            <input type="number" class="form-input" v-model="funcionario.carga_horaria" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Data Admissão</label>
            <input type="date" class="form-input" v-model="funcionario.data_admissao" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Data Demissão</label>
            <input type="date" class="form-input" v-model="funcionario.data_demissao" />
          </div>

          <!-- FINANCEIRO -->
          <div class="form-group col-span-3">
            <label class="form-label">Salário Base</label>
            <input type="number" step="0.01" class="form-input" v-model="funcionario.salario_base" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Salário Adicional</label>
            <input type="number" step="0.01" class="form-input" v-model="funcionario.salario_adicional" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Custo Hora</label>
            <input type="number" step="0.01" class="form-input" v-model="funcionario.custo_hora" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Forma de Pagamento</label>
            <input class="form-input" v-model="funcionario.forma_pagamento" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Banco</label>
            <input class="form-input" v-model="funcionario.banco" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Agência</label>
            <input class="form-input" v-model="funcionario.agencia" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Conta Corrente</label>
            <input class="form-input" v-model="funcionario.conta_corrente" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Tipo de Conta</label>
            <input class="form-input" v-model="funcionario.tipo_conta" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Chave PIX</label>
            <input class="form-input" v-model="funcionario.chave_pix" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Status</label>
            <select class="form-input form-select" v-model="funcionario.status">
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
  name: 'FuncionariosForm',

  data() {
    return {
      funcionarioId: null,
      funcionario: {
        nome: '',
        cpf: '',
        rg: '',
        nascimento: null,
        sexo: '',
        estado_civil: '',
        escolaridade: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        email: '',
        telefone: '',
        setor: '',
        funcao: '',
        tipo_contrato: '',
        data_admissao: null,
        data_demissao: null,
        status: 'Ativo',
        salario_base: null,
        salario_adicional: null,
        carga_horaria: null,
        custo_hora: null,
        forma_pagamento: '',
        banco: '',
        agencia: '',
        conta_corrente: '',
        tipo_conta: '',
        chave_pix: ''
      }
    }
  },

  async mounted() {
    if (this.$route.params.id) {
      this.funcionarioId = this.$route.params.id
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/funcionarios/${this.funcionarioId}`
      )
      this.funcionario = await res.json()
    }
  },

  methods: {
    async submitForm() {
      const method = this.funcionarioId ? 'PUT' : 'POST'
      const url = this.funcionarioId
        ? `${import.meta.env.VITE_API_URL}/funcionarios/${this.funcionarioId}`
        : `${import.meta.env.VITE_API_URL}/funcionarios`

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.funcionario)
      })

      this.$router.push('/funcionarios')
    },

    voltar() {
      this.$router.push('/funcionarios')
    }
  }
}
</script>
