<template>
  <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-none shadow-2xl shadow-slate-200/50">
    <PageHeader
      :title="isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'"
      :subtitle="isEdit ? `ID: #${fornecedorId}` : 'Cadastro de parceiros comerciais'"
      icon="pi pi-truck"
      :backTo="'/fornecedor'"
      class="bg-slate-50/50 border-b border-slate-100"
    />

    <div class="p-8 md:p-12 relative">
      <Loading v-if="loading" />

      <form v-else class="space-y-12">
        
        <section class="space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <i class="pi pi-id-card"></i>
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-800">01. Identificação Jurídica</h3>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Dados fiscais e registros oficiais</p>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-x-8 gap-y-6 p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100/50">
            <Input class="col-span-12 md:col-span-4" v-model="cnpjMask" label="CNPJ *" required @blur="tratarBuscaCnpj" />
            <Input class="col-span-12 md:col-span-8" v-model="form.razao_social" label="Razão Social *" required />
            <Input class="col-span-12 md:col-span-7" v-model="form.nome_fantasia" label="Nome Fantasia *" required />
            <Input class="col-span-12 md:col-span-5" v-model="ieMask" label="Inscrição Estadual" />
          </div>
        </section>

        <section class="space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <i class="pi pi-phone"></i>
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-800">02. Contato e Comercial</h3>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Canais de comunicação e acordos</p>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-x-8 gap-y-6 p-8 rounded-[2rem] border border-slate-100">
            <Input class="col-span-12 md:col-span-4" v-model="form.email" label="E-mail" placeholder="contato@empresa.com" />
            <Input class="col-span-12 md:col-span-4" v-model="telefoneMask" label="Telefone" />
            <Input class="col-span-12 md:col-span-4" v-model="whatsappMask" label="WhatsApp" />
            
            <div class="col-span-12 h-px bg-slate-100 my-2"></div>
            
            <Input class="col-span-12 md:col-span-8" v-model="form.forma_pagamento" label="Condição de Pagamento Padrão" placeholder="Ex: Boleto 30 dias" />
            <Input class="col-span-12 md:col-span-4" v-model.number="form.data_vencimento" type="number" label="Melhor Dia Vencimento" />
          </div>
        </section>

        <section class="space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i class="pi pi-map-marker"></i>
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-800">03. Localização</h3>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Endereço para faturamento e entregas</p>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-x-8 gap-y-6 p-8 rounded-[2rem] bg-slate-50/30 border border-slate-100/50">
            <Input class="col-span-12 md:col-span-3" v-model="cepMask" label="CEP" @blur="tratarBuscaCep" />
            <Input class="col-span-12 md:col-span-9" v-model="form.endereco" label="Logradouro (Rua/Av)" />
            <Input id="numero-input" class="col-span-12 md:col-span-3" v-model="form.numero" label="Nº" />
            <Input class="col-span-12 md:col-span-9" v-model="form.complemento" label="Complemento" />
            <Input class="col-span-12 md:col-span-5" v-model="form.bairro" label="Bairro" />
            <Input class="col-span-12 md:col-span-5" v-model="form.cidade" label="Cidade" />
            <Input class="col-span-12 md:col-span-2" v-model="form.estado" label="UF" maxlength="2" />
          </div>
        </section>

        <div class="pt-10 border-t border-slate-100 flex items-center justify-between">
          <Button 
            v-if="isEdit" 
            variant="danger" 
            type="button" 
            @click="excluir"
            class="!rounded-2xl !px-8 hover:bg-red-600 transition-all font-bold uppercase text-[10px] tracking-widest"
          >
            <i class="pi pi-trash mr-2"></i> Excluir Registro
          </Button>
          <div v-else></div>

          <div class="flex gap-4">
            <Button 
              variant="secondary" 
              type="button" 
              @click="router.push('/fornecedor')"
              class="!rounded-2xl !px-8 !bg-white !border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
            >
              Voltar
            </Button>
            <Button 
              variant="primary" 
              type="button" 
              @click="salvar" 
              class="!rounded-2xl !px-12 !h-14 shadow-2xl shadow-brand-primary/30 font-black uppercase text-[11px] tracking-[0.15em]"
            >
              <i class="pi pi-save mr-3"></i> 
              {{ isEdit ? 'Salvar Alterações' : 'Finalizar Cadastro' }}
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