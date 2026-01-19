<template>
  <Card :shadow="true">
    <PageHeader
      :title="isEdit ? `Editar Fornecedor #${fornecedorId}` : 'Novo Fornecedor'"
      subtitle="Cadastro / Fornecedor"
      icon="pi pi-truck"
      :backTo="'/fornecedor'"
    />

    <div class="p-8 relative">
      <Loading v-if="loading" />

      <form v-else class="space-y-10">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">01. Identificação</span>
          </div>

          <Input class="col-span-12 md:col-span-4" v-model="cnpjMask" label="CNPJ *" required @blur="tratarBuscaCnpj" />
          <Input class="col-span-12 md:col-span-8" v-model="form.razao_social" label="Razão Social *" required />
          <Input class="col-span-12 md:col-span-7" v-model="form.nome_fantasia" label="Nome Fantasia *" required />
          <Input class="col-span-12 md:col-span-5" v-model="ieMask" label="Inscrição Estadual" />
        </div>

        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">02. Contato e Comercial</span>
          </div>
          <Input class="col-span-12 md:col-span-4" v-model="form.email" label="E-mail" />
          <Input class="col-span-12 md:col-span-4" v-model="telefoneMask" label="Telefone" />
          <Input class="col-span-12 md:col-span-4" v-model="whatsappMask" label="WhatsApp" />
          <Input class="col-span-12 md:col-span-8" v-model="form.forma_pagamento" label="Forma de Pagamento" />
          <Input class="col-span-12 md:col-span-4" v-model.number="form.data_vencimento" type="number" label="Dia de Vencimento" />
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">03. Localização</span>
          </div>

          <Input class="col-span-12 md:col-span-3" v-model="cepMask" label="CEP" @blur="tratarBuscaCep" />

          <Input class="col-span-12 md:col-span-9" v-model="form.endereco" label="Logradouro (Rua/Av)" />

          <Input id="numero-input" class="col-span-12 md:col-span-3" v-model="form.numero" label="Nº" />

          <Input class="col-span-12 md:col-span-9" v-model="form.complemento" label="Complemento (Apto, Sala, Bloco...)" />

          <Input class="col-span-12 md:col-span-5" v-model="form.bairro" label="Bairro" />

          <Input class="col-span-12 md:col-span-5" v-model="form.cidade" label="Cidade" />

          <Input class="col-span-12 md:col-span-2" v-model="form.estado" label="UF" maxlength="2" />
        </div>

        <div class="flex items-center justify-between pt-8 border-t border-gray-100">
          <Button v-if="isEdit" variant="danger" type="button" @click="excluir">Excluir</Button>
          <div v-else></div>
          <div class="flex gap-3">
            <Button variant="secondary" type="button" @click="router.push('/fornecedor')">Cancelar</Button>
            <Button variant="primary" type="button" @click="salvar" class="!px-10 shadow-lg shadow-brand-primary/20">
              <i class="pi pi-save mr-2"></i> {{ isEdit ? 'Salvar Alterações' : 'Cadastrar Fornecedor' }}
            </Button>
          </div>
        </div>
      </form>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { maskCNPJ, maskTelefone, maskCEP, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.params.id && route.params.id !== 'novo')
const fornecedorId = computed(() => isEdit.value ? route.params.id : null)

const loading = ref(false)
const salvando = ref(false)

const form = ref({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  email: '',
  telefone: '',
  whatsapp: '',
  forma_pagamento: '',
  data_vencimento: null,
  cep: '',
  endereco: '',
  numero: '',
  complemento: '', // ✅ ADICIONADO
  bairro: '',
  cidade: '',
  estado: '',
})

// Masks (mesma lógica)
const cnpjMask = computed({ get: () => form.value.cnpj, set: (v) => (form.value.cnpj = maskCNPJ(v)) })
const ieMask = computed({ get: () => form.value.ie, set: (v) => (form.value.ie = maskIE(v)) })
const telefoneMask = computed({ get: () => form.value.telefone, set: (v) => (form.value.telefone = maskTelefone(v)) })
const whatsappMask = computed({ get: () => form.value.whatsapp, set: (v) => (form.value.whatsapp = maskTelefone(v)) })
const cepMask = computed({ get: () => form.value.cep, set: (v) => (form.value.cep = maskCEP(v)) })

async function tratarBuscaCnpj() {
  if (!form.value.cnpj || String(form.value.cnpj).length < 18) return
  loading.value = true
  try {
    const dados = await buscarCnpj(form.value.cnpj)
    if (dados) {
      Object.assign(form.value, {
        razao_social: dados.razao_social || form.value.razao_social,
        nome_fantasia: dados.nome_fantasia || form.value.nome_fantasia,
        telefone: dados.telefone ? maskTelefone(dados.telefone) : form.value.telefone,
        cep: dados.cep ? maskCEP(dados.cep) : form.value.cep,
        endereco: dados.endereco || form.value.endereco,
        numero: dados.numero || form.value.numero,
        bairro: dados.bairro || form.value.bairro,
        cidade: dados.cidade || form.value.cidade,
        estado: dados.estado || form.value.estado,
        ie: dados.ie || form.value.ie,
      })
      notify.success('Dados importados via CNPJ!')
    }
  } catch (e) {
    notify.error('Erro ao buscar CNPJ.')
  } finally { loading.value = false }
}

async function tratarBuscaCep() {
  if (!form.value.cep || String(form.value.cep).length < 9) return
  const dados = await buscarCep(form.value.cep)
  if (dados) {
    form.value.endereco = dados.logradouro || ''
    form.value.bairro = dados.bairro || ''
    form.value.cidade = dados.localidade || ''
    form.value.estado = dados.uf || ''
    document.getElementById('numero-input')?.focus()
  }
}

function payloadParaApi() {
  return {
    ...form.value,
    data_vencimento: form.value.data_vencimento ? Number(form.value.data_vencimento) : null,
  }
}

async function salvar() {
  salvando.value = true
  try {
    const payload = payloadParaApi()
    await FornecedorService.salvar(fornecedorId.value, payload)
    notify.success('Sucesso!')
    router.push('/fornecedor')
  } catch (e) {
    notify.error('Erro ao salvar.')
  } finally { salvando.value = false }
}

onMounted(async () => {
  if (isEdit.value) {
    loading.value = true
    try {
      const { data } = await FornecedorService.buscar(fornecedorId.value)
      form.value = { ...form.value, ...data }
    } finally { loading.value = false }
  }
})
</script>