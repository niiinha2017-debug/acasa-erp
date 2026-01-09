<template>
  <div class="page-container">
    <Card>
      <header class="card-header fornecedor-header header-between">
        <div>
          <h2 class="card-title">Editar Fornecedor</h2>
          <p class="form-label fornecedor-subtitle">
            Atualize os dados cadastrais do fornecedor.
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
            <div class="col-span-4 form-group">
  <Input 
    v-model="cnpjMask" 
    label="CNPJ *" 
    required 
    @blur="tratarBuscaCnpj" 
  />
</div>
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
<div class="col-span-12" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

import { maskCNPJ, maskTelefone, maskCEP } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils' // Importamos o buscarCnpj

const router = useRouter()
const route = useRoute()

const id = route.params.id
const salvando = ref(false)

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

/* MASKS CORRIGIDAS:
  O 'get' mostra com pontos/traços.
  O 'set' limpa e guarda no 'form' apenas os números (essencial p/ banco).
*/
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

/* BUSCAS AUTOMÁTICAS */
async function tratarBuscaCep() {
  const cepLimpo = String(form.value.cep || '').replace(/\D/g, '')
  if (cepLimpo.length !== 8) return

  const dados = await buscarCep(cepLimpo)
  if (!dados) return

  form.value.endereco = dados.logradouro || ''
  form.value.bairro = dados.bairro || ''
  form.value.cidade = dados.localidade || ''
  form.value.estado = dados.uf || ''

  document.getElementById('numero-input')?.focus()
}

// Nova função para buscar CNPJ se você digitar um novo
async function tratarBuscaCnpj() {
  const cnpjLimpo = String(form.value.cnpj || '').replace(/\D/g, '')
  if (cnpjLimpo.length !== 14) return

  const dados = await buscarCnpj(cnpjLimpo)
  if (!dados) return

  // Atualiza os campos mantendo o que já tinha se vier vazio
  form.value.razao_social = dados.razao_social || form.value.razao_social
  form.value.nome_fantasia = dados.nome_fantasia || form.value.nome_fantasia
  form.value.telefone = dados.telefone || form.value.telefone
  form.value.cep = dados.cep || form.value.cep
  form.value.endereco = dados.endereco || form.value.endereco
  form.value.numero = dados.numero || form.value.numero
  form.value.bairro = dados.bairro || form.value.bairro
  form.value.cidade = dados.cidade || form.value.cidade
  form.value.estado = dados.estado || form.value.estado
}

async function carregar() {
  if (!id) return
  try {
    const { data } = await api.get(`/fornecedores/${id}`)
    
    // Ao carregar do banco, garantimos que os valores fiquem sem máscara no estado
    form.value = {
      ...data,
      cnpj: String(data?.cnpj || '').replace(/\D/g, ''),
      telefone: String(data?.telefone || '').replace(/\D/g, ''),
      whatsapp: String(data?.whatsapp || '').replace(/\D/g, ''),
      cep: String(data?.cep || '').replace(/\D/g, ''),
    }
  } catch (err) {
    alert('Erro ao carregar fornecedor')
    router.push('/fornecedores')
  }
}

async function salvar() {
  salvando.value = true
  try {
    await api.patch(`/fornecedores/${id}`, form.value)
    alert('Fornecedor atualizado com sucesso!')
    router.push('/fornecedores')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>
