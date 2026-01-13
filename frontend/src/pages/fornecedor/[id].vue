<template>
  <Card :shadow="true">
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? `Editar Fornecedor #${fornecedorId}` : 'Novo Fornecedor' }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          {{ isEdit ? 'Atualize os dados cadastrais do fornecedor.' : 'Cadastre um novo fornecedor no sistema.' }}
        </p>
      </div>

      <Button variant="secondary" size="sm" type="button" @click="router.push('/fornecedor')">
        <i class="pi pi-arrow-left mr-2 text-xs"></i>
        Voltar
      </Button>
    </header>

    <div class="p-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-sm font-bold text-gray-400">
          <i class="pi pi-spin pi-spinner"></i>
          Carregando...
        </div>
      </div>

      <form v-else class="space-y-8" @submit.prevent="salvar">
        <section class="space-y-4">
          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 md:col-span-8">
              <Input v-model="form.razao_social" label="Razão Social *" required />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.nome_fantasia" label="Nome Fantasia *" required />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="cnpjMask" label="CNPJ *" required @blur="tratarBuscaCnpj" />
            </div>

<div class="col-span-12 md:col-span-4">
  <Input 
    v-model="ieMask" 
    label="Inscrição Estadual" 
    placeholder="000.000.000.000"
  />
</div>

            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="form.email"
                label="E-mail"
                type="email"
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="telefoneMask" label="Telefone" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="whatsappMask" label="WhatsApp" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <div class="h-11"></div>
            </div>
          </div>
        </section>

        <div class="h-px w-full bg-gray-100"></div>

        <section class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-sm font-black tracking-tight text-gray-900 uppercase">Pagamento</h3>
              <p class="text-xs font-semibold text-gray-400 mt-1">
                Informações comerciais e vencimento.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 md:col-span-8">
              <Input
                v-model="form.forma_pagamento"
                label="Forma de Pagamento"
                placeholder="(vem das constantes depois)"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="dataVencimentoMask"
                label="Dia do Vencimento"
                placeholder="Ex: 10"
              />
            </div>
          </div>
        </section>

        <div class="h-px w-full bg-gray-100"></div>

        <section class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-sm font-black tracking-tight text-gray-900 uppercase">Endereço</h3>
              <p class="text-xs font-semibold text-gray-400 mt-1">
                Preencha o CEP para buscar automaticamente.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 md:col-span-3">
              <Input v-model="cepMask" label="CEP" @blur="tratarBuscaCep" />
            </div>

            <div class="col-span-12 md:col-span-6">
              <Input v-model="form.endereco" label="Logradouro" placeholder="Rua/Av" />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input v-model="form.numero" id="numero-input" label="Nº" />
            </div>

            <div class="col-span-12 md:col-span-5">
              <Input v-model="form.bairro" label="Bairro" />
            </div>

            <div class="col-span-12 md:col-span-5">
              <Input v-model="form.cidade" label="Cidade" />
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input v-model="form.estado" label="UF" maxlength="2" />
            </div>

            <div class="col-span-12">
              <Input v-model="form.complemento" label="Complemento" placeholder="Apto, bloco, referência..." />
            </div>
          </div>
        </section>
      </form>
    </div>

    <footer class="flex items-center justify-between gap-4 p-6 border-t border-gray-100">
      <div>
        <Button
          v-if="isEdit"
          variant="danger"
          :loading="excluindo"
          type="button"
          @click="excluir"
        >
          <i class="pi pi-trash mr-2 text-xs"></i>
          Excluir fornecedor
        </Button>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" type="button" @click="router.push('/fornecedor')">
          Cancelar
        </Button>

        <Button variant="primary" size="md" :loading="salvando" type="button" @click="salvar">
          {{ isEdit ? 'Salvar Alterações' : 'Criar Fornecedor' }}
        </Button>
      </div>
    </footer>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

import { maskCNPJ, maskTelefone, maskCEP, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'

const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')

const fornecedorId = computed(() => {
  if (!isEdit.value) return null
  const n = Number(rawId.value)
  return Number.isFinite(n) ? n : null
})

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)

const form = ref({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  email: '',
  telefone: '',
  whatsapp: '',
  forma_pagamento: '',
  dia_vencimento: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  complemento: '',
})

const cnpjMask = computed({
  get: () => form.value.cnpj,
  set: (v) => (form.value.cnpj = maskCNPJ(v)),
})

const ieMask = computed({
  get: () => form.value.ie,
  set: (v) => (form.value.ie = maskIE(v)),
})

const telefoneMask = computed({
  get: () => form.value.telefone,
  set: (v) => (form.value.telefone = maskTelefone(v)),
})

const whatsappMask = computed({
  get: () => form.value.whatsapp,
  set: (v) => (form.value.whatsapp = maskTelefone(v)),
})

const cepMask = computed({
  get: () => form.value.cep,
  set: (v) => (form.value.cep = maskCEP(v)),
})

const dataVencimentoMask = computed({
  get: () => (form.value.dia_vencimento ? String(form.value.dia_vencimento) : ''),
  set: (v) => {
    const n = String(v || '').replace(/\D/g, '')
    form.value.dia_vencimento = n ? Number(n) : ''
  },
})

async function tratarBuscaCep() {
  const dados = await buscarCep(form.value.cep)
  if (!dados) return

  form.value.endereco = dados.logradouro || form.value.endereco
  form.value.bairro = dados.bairro || form.value.bairro
  form.value.cidade = dados.localidade || form.value.cidade
  form.value.estado = dados.uf || form.value.estado

  document.getElementById('numero-input')?.focus()
}



async function tratarBuscaCnpj() {
  const dados = await buscarCnpj(form.value.cnpj)
  if (!dados) return

  form.value.razao_social = dados.razao_social || form.value.razao_social
  form.value.nome_fantasia = dados.nome_fantasia || form.value.nome_fantasia

  form.value.telefone = dados.telefone ? maskTelefone(dados.telefone) : form.value.telefone
  form.value.cep = dados.cep ? maskCEP(dados.cep) : form.value.cep

  form.value.endereco = dados.endereco || form.value.endereco
  form.value.numero = dados.numero || form.value.numero
  form.value.bairro = dados.bairro || form.value.bairro
  form.value.cidade = dados.cidade || form.value.cidade
  form.value.estado = dados.estado || form.value.estado
  form.value.ie = dados.ie || form.value.ie
}


async function carregarFornecedor() {
  if (!isEdit.value || !fornecedorId.value) return
  const { data } = await api.get(`/fornecedor/${fornecedorId.value}`)
  form.value = { ...form.value, ...(data || {}) }
}

async function salvar() {
  salvando.value = true
  try {
    if (isEdit.value) {
      await api.put(`/fornecedor/${fornecedorId.value}`, form.value)
    } else {
      await api.post('/fornecedor', form.value)
    }
    router.push('/fornecedor')
  } catch (e) {
    alert('Erro ao salvar fornecedor. Verifique os dados.')
  } finally {
    salvando.value = false
  }
}

async function excluir() {
  if (!isEdit.value || !fornecedorId.value) return
  if (!confirm('Deseja excluir este fornecedor?')) return

  excluindo.value = true
  try {
    await api.delete(`/fornecedor/${fornecedorId.value}`)
    router.push('/fornecedor')
  } finally {
    excluindo.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await carregarFornecedor()
  } finally {
    loading.value = false
  }
})
</script>

