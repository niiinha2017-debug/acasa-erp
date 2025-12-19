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
            <input
  class="form-input"
  :value="funcionario.cpf"
  @input="onCpf"
  required
/>
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">RG</label>
            <input
  class="form-input"
  :value="funcionario.rg"
  @input="onRg"
/>

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
            <input
  class="form-input"
  :value="funcionario.telefone"
  @input="onTelefone"
/>

          </div>

          <!-- ENDEREÇO -->
          <div class="form-group col-span-4">
            <label class="form-label">CEP</label>
            <input
  class="form-input"
  :value="funcionario.cep"
  @input="onCep"
/>

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
<!-- SETOR -->
<div class="form-group col-span-3">
  <label class="form-label">Setor *</label>
  <select
    class="form-input form-select"
    v-model="funcionario.setor"
    required
  >
    <option value="">Selecione</option>
    <option
      v-for="s in setores"
      :key="s.codigo"
      :value="s.codigo"
    >
      {{ s.label }}
    </option>
  </select>
</div>

<!-- FUNÇÃO -->
<div class="form-group col-span-3">
  <label class="form-label">Função *</label>
  <select
    class="form-input form-select"
    v-model="funcionario.funcao"
    :disabled="!funcionario.setor"
    required
  >
    <option value="">Selecione</option>
    <option
      v-for="f in funcoes"
      :key="f.codigo"
      :value="f.codigo"
    >
      {{ f.label }}
    </option>
  </select>
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
<input
  class="form-input"
  :value="salarioBaseMasked"
  @input="onSalarioBase"
/>


          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Salário Adicional</label>
            <input type="number" step="0.01" class="form-input" v-model="funcionario.salario_adicional" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Custo Hora</label>
            <input
  type="number"
  step="0.01"
  class="form-input"
  v-model="funcionario.custo_hora"
  readonly
/>

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
import {
  maskCPF,
  maskRG,
  maskCEP,
  maskTelefone,
  onlyNumbers,
  buscarCep,
  maskMoneyBR,
  moneyBRToNumber,
} from '@/utils/utils'

export default {
  name: 'FuncionariosForm',

  data() {
    return {
      funcionarioId: null,

      // CONSTANTES
      setores: [],
      funcoesTodas: [],

      // MÁSCARAS
      salarioBaseMasked: '',

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
        chave_pix: '',
      },
    }
  },

  computed: {
    funcoes() {
      if (!this.funcionario.setor) return []

      return this.funcoesTodas.filter(
        f => f.extra?.setor === this.funcionario.setor
      )
    },
  },

  async mounted() {
    await this.carregarConstantes()

    if (this.$route.params.id) {
      this.funcionarioId = this.$route.params.id
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/funcionarios/${this.funcionarioId}`
      )
      const data = await res.json()

      this.funcionario = data

      // aplica máscara ao editar
      if (data.salario_base) {
        this.salarioBaseMasked = maskMoneyBR(
          String(data.salario_base * 100)
        )
      }
    }
  },

  methods: {
    async carregarConstantes() {
      const api = import.meta.env.VITE_API_URL

      const resSetores = await fetch(`${api}/constantes?grupo=SETOR`)
      this.setores = await resSetores.json()

      const resFuncoes = await fetch(`${api}/constantes?grupo=FUNCAO`)
      this.funcoesTodas = await resFuncoes.json()
    },

    onCpf(e) {
      this.funcionario.cpf = maskCPF(e.target.value)
    },

    onRg(e) {
      this.funcionario.rg = maskRG(e.target.value)
    },

    onTelefone(e) {
      this.funcionario.telefone = maskTelefone(e.target.value)
    },

    async onCep(e) {
      this.funcionario.cep = maskCEP(e.target.value)

      const cepLimpo = onlyNumbers(this.funcionario.cep)
      if (cepLimpo.length !== 8) return

      const data = await buscarCep(cepLimpo)
      if (!data) return

      this.funcionario.endereco = data.logradouro
      this.funcionario.bairro = data.bairro
      this.funcionario.cidade = data.localidade
      this.funcionario.estado = data.uf
    },

    onSalarioBase(e) {
      this.salarioBaseMasked = maskMoneyBR(e.target.value)

      const valor = moneyBRToNumber(this.salarioBaseMasked)
      this.funcionario.salario_base = valor

      this.calcularCustoHora()
    },

    calcularCustoHora() {
      const salario = Number(this.funcionario.salario_base || 0)
      this.funcionario.custo_hora =
        salario > 0 ? Number((salario / 220).toFixed(2)) : null
    },

    async submitForm() {
      const method = this.funcionarioId ? 'PUT' : 'POST'
      const url = this.funcionarioId
        ? `${import.meta.env.VITE_API_URL}/funcionarios/${this.funcionarioId}`
        : `${import.meta.env.VITE_API_URL}/funcionarios`

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.funcionario),
      })

      this.$router.push('/funcionarios')
    },

    voltar() {
      this.$router.push('/funcionarios')
    },
  },
}
</script>


