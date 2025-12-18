<template>
  <div class="main-container clientes-form">

    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Cadastro de Cliente</h1>
      </div>

      <form @submit.prevent="submitForm">

        <div class="form-grid">

          <!-- ========================= -->
          <!-- TIPO DE PESSOA -->
          <!-- ========================= -->
          <div class="form-group col-span-12">
            <label class="form-label">Tipo de Pessoa</label>
            <div class="toggle-group">
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: tipoPessoa === 'FISICA' }"
                @click="setPessoa('FISICA')"
              >
                Física
              </button>

              <button
                type="button"
                class="toggle-btn"
                :class="{ active: tipoPessoa === 'JURIDICA' }"
                @click="setPessoa('JURIDICA')"
              >
                Jurídica
              </button>
            </div>
          </div>

          <!-- ========================= -->
          <!-- DADOS PRINCIPAIS -->
          <!-- ========================= -->
          <div class="form-group col-span-6">
            <label class="form-label">Nome *</label>
            <input class="form-input" v-model="cliente.nome" required />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">E-mail</label>
            <input class="form-input" v-model="cliente.email" />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Telefone</label>
            <input
              class="form-input"
              v-model="cliente.telefone"
              @input="onTelefone"
            />
          </div>

          <div class="form-group col-span-4">
            <label class="form-label">Data de Nascimento</label>
            <input
              type="date"
              class="form-input"
              v-model="cliente.data_nascimento"
            />
          </div>

          <!-- ========================= -->
          <!-- INDICAÇÃO (CLIENTE → CLIENTE) -->
          <!-- ========================= -->
          <div class="form-group col-span-4">
            <label class="form-label">Indicação</label>
            <input
              class="form-input"
              v-model="buscaIndicacao"
              placeholder="Buscar cliente indicador"
              @input="buscarIndicacao"
            />

            <ul
              v-if="indicacoesEncontradas.length"
              class="lista-busca"
            >
              <li
                v-for="i in indicacoesEncontradas"
                :key="i.id"
                @click="selecionarIndicacao(i)"
              >
                {{ i.nome }}
              </li>
            </ul>
          </div>

          <!-- ========================= -->
          <!-- DOCUMENTOS -->
          <!-- ========================= -->
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

          <!-- ========================= -->
          <!-- ENDEREÇO -->
          <!-- ========================= -->
          <div class="form-group col-span-3">
            <label class="form-label">CEP</label>
            <input
              class="form-input"
              v-model="cliente.cep"
              @input="onCep"
            />
          </div>

          <div class="form-group col-span-9">
            <label class="form-label">Endereço</label>
            <input class="form-input" v-model="cliente.endereco" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Número</label>
            <input class="form-input" v-model="cliente.numero" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Complemento</label>
            <input class="form-input" v-model="cliente.complemento" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">Bairro</label>
            <input class="form-input" v-model="cliente.bairro" />
          </div>

          <div class="form-group col-span-3">
            <label class="form-label">UF</label>
            <input
              class="form-input"
              v-model="cliente.estado"
              maxlength="2"
            />
          </div>

          <div class="form-group col-span-6">
            <label class="form-label">Cidade</label>
            <input class="form-input" v-model="cliente.cidade" />
          </div>

          <!-- ========================= -->
          <!-- STATUS / OBSERVAÇÃO -->
          <!-- ========================= -->
          <div class="form-group col-span-6">
            <label class="form-label">Status</label>
            <select class="form-input form-select" v-model="cliente.status">
              <option value="ATIVO">Ativo</option>
              <option value="POTENCIAL">Potencial</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>

          <div class="form-group col-span-12">
            <label class="form-label">Observação</label>
            <textarea
              class="form-textarea"
              v-model="cliente.observacao"
            ></textarea>
          </div>

        </div>

        <!-- ========================= -->
        <!-- AÇÕES -->
        <!-- ========================= -->
        <div class="form-actions">
          <button
            class="btn btn-secondary"
            type="button"
            @click="limparFormulario"
          >
            Novo
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
import api from '@/services/api'

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
      /* =====================
         TIPO DE PESSOA
      ===================== */
      tipoPessoa: 'FISICA',

      /* =====================
         INDICAÇÃO (CLIENTE → CLIENTE)
      ===================== */
      buscaIndicacao: '',
      indicacoesEncontradas: [],

      /* =====================
         FORM
      ===================== */
      clienteId: null,
      cliente: {
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        indicacao_id: null,

        cpf_cnpj: '',
        rg_ie: '',

        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',

        status: 'ATIVO',
        observacao: '',
      },

      mensagemErro: '',
    }
  },

  methods: {
    /* =====================
       INDICAÇÃO
    ===================== */
    async buscarIndicacao() {
      if (!this.buscaIndicacao || this.buscaIndicacao.length < 3) {
        this.indicacoesEncontradas = []
        return
      }

      try {
        const { data } = await api.get('/clientes', {
          params: { busca: this.buscaIndicacao }
        })

        this.indicacoesEncontradas = data
      } catch (e) {
        console.error(e)
        this.indicacoesEncontradas = []
      }
    },

    selecionarIndicacao(cliente) {
      if (!cliente || !cliente.id) return

      this.cliente.indicacao_id = cliente.id
      this.buscaIndicacao = cliente.nome
      this.indicacoesEncontradas = []
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
       FORM
    ===================== */
    limparFormulario() {
      Object.keys(this.cliente).forEach(k => (this.cliente[k] = ''))
      this.cliente.status = 'ATIVO'
      this.cliente.indicacao_id = null
      this.buscaIndicacao = ''
      this.indicacoesEncontradas = []
      this.tipoPessoa = 'FISICA'
      this.clienteId = null
    },

    /* =====================
       SUBMIT
    ===================== */
    async submitForm() {
      this.mensagemErro = ''

      try {
        if (this.clienteId) {
          await api.put(`/clientes/${this.clienteId}`, this.cliente)
        } else {
          await api.post('/clientes', this.cliente)
        }

        this.$router.push('/clientes')
      } catch (e) {
        console.error(e)
        this.mensagemErro = 'Erro ao salvar cliente'
      }
    },

    cancelar() {
      this.$router.push('/clientes')
    },
  },
}
</script>



