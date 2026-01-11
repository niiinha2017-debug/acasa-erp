<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? 'Editar Cliente' : 'Novo Cliente' }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          {{ isEdit ? 'Altere os dados abaixo e salve as alterações.' : 'Cadastre um novo cliente.' }}
        </p>
      </div>

      <Button variant="secondary" size="sm" type="button" @click="router.push('/clientes')">
        <i class="pi pi-arrow-left mr-2 text-xs"></i>
        Voltar
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <div v-if="loading" class="flex items-center justify-center py-10">
        <div class="flex items-center gap-3 text-sm font-bold text-gray-400">
          <i class="pi pi-spin pi-spinner"></i>
          Carregando...
        </div>
      </div>

      <form v-else class="space-y-8" @submit.prevent="salvar">
        <!-- TIPO PESSOA -->
        <div class="rounded-2xl border border-gray-100 bg-white p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div class="text-xs font-black uppercase text-gray-400">Tipo de Pessoa</div>

              <div class="mt-2 inline-flex items-center gap-2">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
                  :class="tipoPessoa === 'FISICA'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'"
                >
                  Pessoa {{ tipoPessoa === 'FISICA' ? 'Física' : 'Jurídica' }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Button
                :variant="tipoPessoa === 'FISICA' ? 'primary' : 'outline'"
                size="sm"
                type="button"
                @click="setTipo('FISICA')"
              >
                Física
              </Button>
              <Button
                :variant="tipoPessoa === 'JURIDICA' ? 'primary' : 'outline'"
                size="sm"
                type="button"
                @click="setTipo('JURIDICA')"
              >
                Jurídica
              </Button>
            </div>
          </div>
        </div>

        <!-- INDICAÇÃO -->
        <div class="grid grid-cols-12 gap-5">
          <div class="col-span-12 relative">
            <Input
              v-model="indicacaoBusca"
              label="Indicação"
              placeholder="Buscar cliente..."
              @focus="abrirSugestoes = true"
              @blur="fecharSugestoesComDelay"
            />

            <div
              v-if="abrirSugestoes && sugestoesIndicacao.length"
              class="absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden"
            >
              <button
                v-for="c in sugestoesIndicacao"
                :key="c.id"
                type="button"
                class="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                @mousedown.prevent="selecionarIndicacao(c)"
              >
                <div class="text-sm font-black text-gray-900">
                  {{ c.nome_completo || c.nome || 'Cliente' }}
                </div>
                <div class="text-xs font-semibold text-gray-400 mt-0.5">
                  {{ c.cpf_cnpj || c.cpf || c.cnpj || c.email || '' }}
                </div>
              </button>
            </div>

            <div
              v-if="abrirSugestoes && indicacaoBusca && !sugestoesIndicacao.length"
              class="absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-400 shadow-xl"
            >
              Nenhum cliente encontrado.
            </div>
          </div>
        </div>

        <div class="h-px w-full bg-gray-100"></div>

        <!-- DADOS PRINCIPAIS -->
        <div class="grid grid-cols-12 gap-5">
          <div class="col-span-12 md:col-span-8">
            <Input
              v-model="form.nome_completo"
              :label="tipoPessoa === 'FISICA' ? 'Nome Completo *' : 'Nome Fantasia *'"
              required
            />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input
              v-model="dataBase"
              type="date"
              :label="`Data ${tipoPessoa === 'FISICA' ? 'Nascimento' : 'Abertura'} *`"
              required
            />
          </div>

          <template v-if="tipoPessoa === 'FISICA'">
            <div class="col-span-12 md:col-span-6">
              <Input v-model="cpfMask" label="CPF" />
            </div>
            <div class="col-span-12 md:col-span-6">
              <Input v-model="rgMask" label="RG" />
            </div>
          </template>

          <template v-else>
            <div class="col-span-12">
              <Input v-model="form.razao_social" label="Razão Social" />
            </div>
            <div class="col-span-12 md:col-span-6">
              <Input v-model="cnpjMask" label="CNPJ" />
            </div>
            <div class="col-span-12 md:col-span-6">
              <Input v-model="form.ie" label="IE" />
            </div>
          </template>
        </div>

        <div class="h-px w-full bg-gray-100"></div>

        <!-- ENDEREÇO -->
        <div>
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 class="text-sm font-black tracking-tight text-gray-900 uppercase">Endereço</h3>
              <p class="text-xs font-semibold text-gray-400 mt-1">Preencha o endereço do cliente.</p>
            </div>
          </div>
<div class="grid grid-cols-12 gap-5">
  <div class="col-span-12 md:col-span-3">
    <Input v-model="cepMask" label="CEP" @blur="tratarBuscaCep" />
  </div>

  <div class="col-span-12 md:col-span-6">
    <Input v-model="form.endereco" label="Logradouro" />
  </div>

  <div class="col-span-12 md:col-span-3">
    <Input v-model="form.numero" id="numero-input" label="Nº" />
  </div>

  <div class="col-span-12 md:col-span-6">
    <Input v-model="form.complemento" label="Complemento" />
  </div>

  <div class="col-span-12 md:col-span-6">
    <Input v-model="form.bairro" label="Bairro" />
  </div>

  <div class="col-span-12 md:col-span-5">
    <Input v-model="form.cidade" label="Cidade" />
  </div>

  <div class="col-span-12 md:col-span-2">
    <Input v-model="form.estado" label="UF" maxlength="2" />
  </div>
</div>

        </div>
      </form>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-end gap-2 p-6 border-t border-gray-100">
      <Button variant="secondary" type="button" @click="router.push('/clientes')" :disabled="loading">
        Cancelar
      </Button>
      <Button variant="primary" type="button" :loading="saving" :disabled="loading" @click="salvar">
        {{ isEdit ? 'Salvar Alterações' : 'Criar Cliente' }}
      </Button>
    </footer>
  </Card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

import { maskCPF, maskCNPJ, maskTelefone, maskCEP, maskRG } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'

const router = useRouter()
const route = useRoute()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const clienteId = computed(() => {
  if (!isEdit.value) return null
  const n = Number(rawId.value)
  return Number.isFinite(n) ? n : null
})

const loading = ref(false)
const saving = ref(false)

const tipoPessoa = ref('FISICA')

const todosClientes = ref([])
const abrirSugestoes = ref(false)
const indicacaoBusca = ref('')
const dataBase = ref('')

const form = ref({
  indicacao_id: null,
  nome_completo: '',
  razao_social: '',
  data_nascimento: '',
  cpf: '',
  rg: '',
  cnpj: '',
  ie: '',
  telefone: '',
  whatsapp: '',
  email: '',
  enviar_aniversario_email: true,
  enviar_aniversario_whatsapp: false,
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
})

const cpfMask = computed({
  get: () => form.value.cpf,
  set: (v) => (form.value.cpf = maskCPF(v)),
})

const rgMask = computed({
  get: () => form.value.rg,
  set: (v) => (form.value.rg = maskRG(v)),
})

const cnpjMask = computed({
  get: () => form.value.cnpj,
  set: (v) => (form.value.cnpj = maskCNPJ(v)),
})

computed({
  get: () => form.value.telefone,
  set: (v) => (form.value.telefone = maskTelefone(v)),
})

computed({
  get: () => form.value.whatsapp,
  set: (v) => (form.value.whatsapp = maskTelefone(v)),
})

const cepMask = computed({
  get: () => form.value.cep,
  set: (v) => (form.value.cep = maskCEP(v)),
})

const sugestoesIndicacao = computed(() => {
  const q = String(indicacaoBusca.value || '').trim().toLowerCase()
  if (!q) return []

  return (Array.isArray(todosClientes.value) ? todosClientes.value : [])
    .filter(c => String(c.id) !== String(clienteId.value || ''))
    .filter(c => {
      const nome = String(c.nome_completo || c.nome || '').toLowerCase()
      const doc = String(c.cpf_cnpj || c.cpf || c.cnpj || '').toLowerCase()
      const email = String(c.email || '').toLowerCase()
      return nome.includes(q) || doc.includes(q) || email.includes(q)
    })
    .slice(0, 8)
})

function fecharSugestoesComDelay() {
  setTimeout(() => (abrirSugestoes.value = false), 120)
}

function selecionarIndicacao(c) {
  form.value.indicacao_id = c.id
  indicacaoBusca.value = c.nome_completo || c.nome || `Cliente #${c.id}`
  abrirSugestoes.value = false
}

function setTipo(tipo) {
  tipoPessoa.value = tipo

  if (tipo === 'FISICA') {
    form.value.cnpj = ''
    form.value.ie = ''
    form.value.razao_social = ''
  } else {
    form.value.cpf = ''
    form.value.rg = ''
  }
}

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

async function carregarTodosClientes() {
  const res = await api.get('/clientes')
  todosClientes.value = Array.isArray(res.data) ? res.data : []
}

async function carregarCliente() {
  if (!isEdit.value || !clienteId.value) return

  const { data } = await api.get(`/clientes/${clienteId.value}`)
  form.value = { ...form.value, ...(data || {}) }

  tipoPessoa.value = form.value.cnpj ? 'JURIDICA' : 'FISICA'

  const dt = form.value.data_nascimento
  if (dt) dataBase.value = String(dt).split('T')[0]

  if (form.value.indicacao_id && Array.isArray(todosClientes.value)) {
    const ind = todosClientes.value.find(c => String(c.id) === String(form.value.indicacao_id))
    if (ind) indicacaoBusca.value = ind.nome_completo || ind.nome || `Cliente #${ind.id}`
  }
}

async function salvar() {
  saving.value = true
  try {
    if (dataBase.value) {
      form.value.data_nascimento = new Date(`${dataBase.value}T00:00:00`).toISOString()
    }

    if (isEdit.value && clienteId.value) {
      await api.put(`/clientes/${clienteId.value}`, form.value)
    } else {
      await api.post('/clientes', form.value)
    }

    router.push('/clientes')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar cliente.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await carregarTodosClientes()
    await carregarCliente()
  } catch (e) {
    alert('Erro ao carregar dados do cliente.')
  } finally {
    loading.value = false
  }
})
</script>
