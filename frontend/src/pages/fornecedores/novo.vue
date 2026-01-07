<template>
  <div class="page-container">
    <Card>
      <header class="card-header fornecedor-header header-between">
        <div>
          <h2 class="card-title">Novo Fornecedor</h2>
          <p class="form-label fornecedor-subtitle">
            Criar os dados cadastrais do fornecedor.
          </p>
        </div>

        <Button variant="secondary" @click="router.push('/fornecedores')">
          Voltar
        </Button>
      </header>

      <div class="card-body">
        <form @submit.prevent="salvar" class="form-grid">
          <!-- IDENTIFICAÇÃO -->
          <div class="col-span-8 form-group">
            <Input v-model="form.razao_social" label="Razão Social *" required />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.nome_fantasia" label="Nome Fantasia *" required />
          </div>

          <!-- DOCUMENTOS / CONTATO -->
          <div class="col-span-4 form-group">
            <Input 
  v-model="cnpjMask" 
  label="CNPJ *" 
  required 
  @blur="tratarBuscaCnpj" 
/>
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.ie" label="Inscrição Estadual" />
          </div>

          <div class="col-span-4 form-group">
            <Input
              v-model="form.email"
              label="E-mail"
              type="email"
              placeholder="contato@empresa.com.br"
            />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="telefoneMask" label="Telefone" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="whatsappMask" label="WhatsApp" />
          </div>

          <div class="col-span-4 form-group">
            <!-- reservado (mantém grid alinhado) -->
          </div>

          <!-- PAGAMENTO -->
          <div class="col-span-8 form-group">
            <Input
              v-model="form.forma_pagamento"
              label="Forma de Pagamento"
              placeholder="(vem das constantes depois)"
            />
          </div>

          <div class="col-span-4 form-group">
            <Input
              v-model="dataVencimentoMask"
              label="Dia do Vencimento"
              placeholder="Ex: 10"
            />
          </div>

          <!-- ENDEREÇO -->
          <div class="col-span-12 section-divider">
            <h3 class="card-title">Endereço</h3>
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="cepMask" label="CEP" @blur="tratarBuscaCep" />
          </div>

          <div class="col-span-6 form-group">
            <Input v-model="form.endereco" label="Logradouro" placeholder="Rua/Av" />
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="form.numero" id="numero-input" label="Nº" />
          </div>

          <div class="col-span-5 form-group">
            <Input v-model="form.bairro" label="Bairro" />
          </div>

          <div class="col-span-5 form-group">
            <Input v-model="form.cidade" label="Cidade" />
          </div>

          <div class="col-span-2 form-group">
            <Input v-model="form.estado" label="UF" />
          </div>

          <!-- AÇÕES -->
          <div class="col-span-12 form-actions">
            <Button
              variant="secondary"
              type="button"
              @click="router.push('/fornecedores')"
            >
              Cancelar
            </Button>

            <Button variant="primary" type="submit" :loading="salvando">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

import { maskCNPJ, maskTelefone, maskCEP } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'

const router = useRouter()
const salvando = ref(false)

// Estado inicial limpo para um NOVO cadastro
const form = ref({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  telefone: '',
  whatsapp: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  forma_pagamento: '',
  data_vencimento: null,
})

/* MASKS: Get (mostra formatado) / Set (salva só números no form) */
const cnpjMask = computed({
  get: () => maskCNPJ(form.value.cnpj || ''),
  set: (v) => (form.value.cnpj = String(v || '').replace(/\D/g, '')),
})

const telefoneMask = computed({
  get: () => maskTelefone(form.value.telefone || ''),
  set: (v) => (form.value.telefone = String(v || '').replace(/\D/g, '')),
})

const whatsappMask = computed({
  get: () => maskTelefone(form.value.whatsapp || ''),
  set: (v) => (form.value.whatsapp = String(v || '').replace(/\D/g, '')),
})

const cepMask = computed({
  get: () => maskCEP(form.value.cep || ''),
  set: (v) => (form.value.cep = String(v || '').replace(/\D/g, '')),
})

const dataVencimentoMask = computed({
  get: () => (form.value.data_vencimento == null ? '' : String(form.value.data_vencimento)),
  set: (v) => {
    const only = String(v || '').replace(/\D/g, '').slice(0, 2)
    form.value.data_vencimento = only ? Number(only) : null
  },
})

/* BUSCA DE CNPJ (Para carregar os dados automaticamente) */
async function tratarBuscaCnpj() {
  const cnpjLimpo = form.value.cnpj // Já está limpo pelo set da computed
  if (cnpjLimpo.length !== 14) return

  try {
    const dados = await buscarCnpj(cnpjLimpo)
    if (!dados) return

    // Preenche os campos automaticamente
    form.value.razao_social = dados.razao_social || ''
    form.value.nome_fantasia = dados.nome_fantasia || ''
    form.value.telefone = dados.telefone || ''
    form.value.cep = dados.cep || ''
    form.value.endereco = dados.endereco || ''
    form.value.numero = dados.numero || ''
    form.value.bairro = dados.bairro || ''
    form.value.cidade = dados.cidade || ''
    form.value.estado = dados.estado || ''

    // Foca no próximo campo lógico
    document.getElementById('numero-input')?.focus()
  } catch (err) {
    console.error("Erro ao buscar CNPJ:", err)
  }
}

/* BUSCA DE CEP */
async function tratarBuscaCep() {
  const cepLimpo = form.value.cep
  if (cepLimpo.length !== 8) return

  try {
    const dados = await buscarCep(cepLimpo)
    if (!dados) return

    form.value.endereco = dados.logradouro || ''
    form.value.bairro = dados.bairro || ''
    form.value.cidade = dados.localidade || ''
    form.value.estado = dados.uf || ''

    document.getElementById('numero-input')?.focus()
  } catch (err) {
    console.error("Erro ao buscar CEP:", err)
  }
}

async function salvar() {
  salvando.value = true
  try {
    // No formulário de NOVO, usamos POST e não enviamos ID
    await api.post('/fornecedores', form.value)
    alert('Fornecedor cadastrado com sucesso!')
    router.push('/fornecedores')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar novo fornecedor')
  } finally {
    salvando.value = false
  }
}
</script>
