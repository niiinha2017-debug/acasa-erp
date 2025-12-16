<template>
  <div class="main-container clientes-form">
    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Cadastro de Cliente</h1>
      </div>

      <!-- BUSCA DE CLIENTE -->
      <div class="form-grid">
        <div class="form-group col-span-9">
          <label class="form-label">Buscar cliente</label>
          <input
            class="form-input"
            v-model="busca"
            placeholder="Nome, e-mail ou CPF"
            @input="buscarClientes"
          />
        </div>

        <div class="form-group col-span-3">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary" @click="limparFormulario">
            Novo Cliente
          </button>
        </div>

        <!-- RESULTADOS -->
        <div
          v-if="clientesEncontrados.length"
          class="form-group col-span-12"
        >
          <ul class="lista-busca">
            <li
              v-for="c in clientesEncontrados"
              :key="c.id"
              @click="selecionarCliente(c)"
            >
              {{ c.nome }} — {{ c.email || 'sem e-mail' }}
            </li>
          </ul>
        </div>
      </div>

      <form @submit.prevent="submitForm">
        <div class="form-grid">

          <!-- TIPO DE PESSOA -->
          <div class="form-group col-span-12">
            <label class="form-label">Tipo de Pessoa</label>
            <div class="toggle-group">
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: tipoPessoa === 'FISICA' }"
                @click="setPessoa('FISICA')"
              >Física</button>

              <button
                type="button"
                class="toggle-btn"
                :class="{ active: tipoPessoa === 'JURIDICA' }"
                @click="setPessoa('JURIDICA')"
              >Jurídica</button>
            </div>
          </div>

          <!-- DADOS PRINCIPAIS -->
          <div class="form-group col-span-6">
            <label class="form-label">Nome *</label>
            <input class="form-input" v-model="cliente.nome" required />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">E-mail</label>
            <input class="form-input" v-model="cliente.email" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Telefone</label>
            <input class="form-input" v-model="cliente.telefone" @input="onTelefone" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Indicação</label>
            <input class="form-input" v-model="cliente.indicacao" />
          </div>

          <!-- DOCUMENTOS -->
          <div class="form-group col-span-6">
            <label class="form-label">
              {{ tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ' }}
            </label>
            <input
              class="form-input"
              v-model="cliente.cpf_cnpj"
              @input="onCpfCnpj"
            />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">
              {{ tipoPessoa === 'FISICA' ? 'RG' : 'IE' }}
            </label>
            <input class="form-input" v-model="cliente.rg_ie" />
          </div>

          <!-- ENDEREÇO -->
          <div class="form-group col-span-4">
            <label class="form-label">CEP</label>
            <input class="form-input" v-model="cliente.cep" @input="onCep" />
          </div>

          <div class="form-group col-span-8">
            <label class="form-label">Endereço</label>
            <input class="form-input" v-model="cliente.endereco" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Número</label>
            <input class="form-input" v-model="cliente.numero" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Complemento</label>
            <input class="form-input" v-model="cliente.complemento" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Bairro</label>
            <input class="form-input" v-model="cliente.bairro" />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Cidade</label>
            <input class="form-input" v-model="cliente.cidade" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">UF</label>
            <input class="form-input" v-model="cliente.estado" maxlength="2" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Status</label>
            <select class="form-input form-select" v-model="cliente.status">
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Potencial">Potencial</option>
            </select>
          </div>

          <div class="form-group col-span-12">
            <label class="form-label">Observação</label>
            <textarea class="form-textarea" v-model="cliente.observacao" />
          </div>

        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" type="button" @click="cancelar">
            Cancelar
          </button>
          <button class="btn btn-primary" type="submit">
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
  maskCNPJ,
  maskTelefone,
  maskCEP,
  buscarCep
} from '@/utils/utils'

export default {
  name: 'ClientesCreate',

  data() {
    return {
      // BUSCA
      busca: '',
      clientesEncontrados: [],
      clienteId: null,

      // TIPO DE PESSOA
      tipoPessoa: 'FISICA',

      // FORM
      cliente: {
        nome: '',
        email: '',
        telefone: '',
        indicacao: '',
        cpf_cnpj: '',
        rg_ie: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        status: 'Ativo',
        observacao: '',
      },

      mensagemErro: '',
      mensagemSucesso: '',
    }
  },

  methods: {
    /* =====================
       BUSCAR CLIENTES
    ===================== */
    async buscarClientes() {
      if (!this.busca || this.busca.length < 3) {
        this.clientesEncontrados = []
        return
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/clientes?busca=${this.busca}`
        )
        this.clientesEncontrados = await res.json()
      } catch (e) {
        console.error(e)
      }
    },

    selecionarCliente(c) {
      this.clienteId = c.id
      this.cliente = { ...c }
      this.tipoPessoa =
        c.cpf_cnpj && c.cpf_cnpj.length > 14 ? 'JURIDICA' : 'FISICA'
      this.busca = c.nome
      this.clientesEncontrados = []
    },

    limparFormulario() {
      this.clienteId = null
      this.busca = ''
      this.clientesEncontrados = []
      Object.keys(this.cliente).forEach(k => (this.cliente[k] = ''))
      this.cliente.status = 'Ativo'
      this.tipoPessoa = 'FISICA'
    },

    /* =====================
       TIPO DE PESSOA
    ===================== */
    setPessoa(tipo) {
      this.tipoPessoa = tipo
      this.cliente.cpf_cnpj = ''
      this.cliente.rg_ie = ''
    },

    /* =====================
       MÁSCARAS
    ===================== */
    onCpfCnpj(e) {
      const v = e.target.value
      this.cliente.cpf_cnpj =
        this.tipoPessoa === 'FISICA'
          ? maskCPF(v)
          : maskCNPJ(v)
    },

    onTelefone(e) {
      this.cliente.telefone = maskTelefone(e.target.value)
    },

    async onCep(e) {
      this.cliente.cep = maskCEP(e.target.value)

      const data = await buscarCep(this.cliente.cep)
      if (!data) return

      this.cliente.endereco = data.logradouro
      this.cliente.bairro = data.bairro
      this.cliente.cidade = data.localidade
      this.cliente.estado = data.uf
    },

    /* =====================
       SUBMIT
    ===================== */
    async submitForm() {
      this.mensagemErro = ''

      const method = this.clienteId ? 'PUT' : 'POST'
      const endpoint = this.clienteId
        ? `${import.meta.env.VITE_API_URL}/clientes/${this.clienteId}`
        : `${import.meta.env.VITE_API_URL}/clientes`

      try {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cliente),
        })

        if (!res.ok) throw new Error()

        this.$router.push('/clientes')
      } catch (e) {
        this.mensagemErro = 'Erro ao salvar cliente'
      }
    },

    cancelar() {
      this.$router.push('/clientes')
    },
  },
}
</script>


