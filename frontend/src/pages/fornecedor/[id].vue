<template>
  <Card :shadow="false" class="login-font mt-4 mb-8 mx-2 lg:mx-4 rounded-3xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>
    <PageHeader
      :title="isEdit ? `Editar Fornecedor #${fornecedorId}` : 'Novo Fornecedor'"
      subtitle="Gerenciamento de dados cadastrais e contato"
      icon="pi pi-truck"
      :showBack="false"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10 clientes-line-form" @submit.prevent="confirmarSalvarFornecedor" autocomplete="off">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Principais
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-4"
            v-model="cnpjMask"
            label="CNPJ"
            required
            placeholder="00.000.000/0000-00"
            @blur="tratarBuscaCnpj"
          />
          <Input
            class="col-span-12 md:col-span-8"
            v-model="form.razao_social"
            label="Razao Social"
            required
            placeholder="Ex: CITYFER COMERCIO LTDA"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-7"
            v-model="form.nome_fantasia"
            label="Nome Fantasia"
            required
            placeholder="Ex: CITYFER"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-5"
            v-model="ieMask"
            label="IE"
            placeholder="Inscricao Estadual"
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Contato
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.email"
            label="E-mail"
            type="email"
            placeholder="ex: nome@dominio.com"
            :force-upper="false"
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="whatsappMask"
            label="WhatsApp"
            placeholder="(00) 00000-0000"
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="telefoneMask"
            label="Fixo"
            placeholder="(00) 0000-0000"
          />

          <Input
            class="col-span-12 md:col-span-8"
            v-model="form.forma_pagamento"
            label="Condicao de Pagamento Padrao"
            placeholder="Ex: BOLETO 30 DIAS"
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model.number="form.data_vencimento"
            type="number"
            label="Dia de Vencimento"
            placeholder="Ex: 10"
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Endereco
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-3"
            v-model="cepMask"
            label="CEP"
            placeholder="00000-000"
            @blur="tratarBuscaCep"
          />
          <Input
            class="col-span-12 md:col-span-7"
            v-model="form.endereco"
            label="Logradouro"
            placeholder="Rua, Avenida, etc..."
            force-upper
          />
          <Input
            id="numero-input"
            class="col-span-12 md:col-span-2"
            v-model="form.numero"
            label="N"
            placeholder="123"
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.bairro"
            label="Bairro"
            placeholder="Ex: Centro"
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-5"
            v-model="form.cidade"
            label="Cidade"
            placeholder="Ex: Sao Paulo"
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.estado"
            label="UF (Estado)"
            maxlength="2"
            placeholder="Ex: SP"
            force-upper
          />

          <Input
            class="col-span-12"
            v-model="form.complemento"
            label="Complemento / Referencia"
            placeholder="Apt, Bloco, Proximo a..."
            force-upper
          />
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <div></div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              :loading="saving"
              class="!rounded-xl px-8 py-3
                     bg-gradient-to-r from-brand-primary to-brand-primary/90
                     hover:from-brand-primary hover:to-brand-primary
                     hover:shadow-2xl hover:shadow-brand-primary/30
                     active:scale-[0.98]
                     transition-all duration-300
                     group relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] 
                          transition-transform duration-700"></div>

              <span class="relative flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                <i class="pi pi-save text-[14px] group-hover:rotate-12 transition-transform"></i>
                {{ isEdit ? 'ATUALIZAR FORNECEDOR' : 'CADASTRAR FORNECEDOR' }}
              </span>
            </Button>

            <Button
              v-if="isEdit && can('fornecedores.excluir')"
              type="button"
              variant="danger"
              size="lg"
              :loading="deleting"
              @click="confirmarExcluirFornecedor"
            >
              <i class="pi pi-trash mr-2 text-[12px]"></i>
              EXCLUIR
            </Button>

            <div v-if="!isEdit"></div>
          </div>
        </div>
      </form>
    </div>
  </Card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCNPJ, maskCEP, maskTelefone, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'fornecedores.ver' } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const fornecedorId = computed(() => Number(route.params?.id))
const isEdit = computed(() => !!fornecedorId.value)

const form = ref({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  telefone: '',
  whatsapp: '',
  email: '',
  forma_pagamento: '',
  data_vencimento: null,
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
})

const cnpjMask = computed({
  get: () => form.value.cnpj,
  set: (v) => { form.value.cnpj = maskCNPJ(v) }
})

const ieMask = computed({
  get: () => form.value.ie,
  set: (v) => { form.value.ie = maskIE(v) }
})

const telefoneMask = computed({
  get: () => form.value.telefone,
  set: (v) => { form.value.telefone = maskTelefone(v) }
})

const whatsappMask = computed({
  get: () => form.value.whatsapp,
  set: (v) => { form.value.whatsapp = maskTelefone(v) }
})

const cepMask = computed({
  get: () => form.value.cep,
  set: (v) => { form.value.cep = maskCEP(v) }
})

async function tratarBuscaCep() {
  if (!form.value.cep || String(form.value.cep).length < 9) return

  const data = await buscarCep(form.value.cep)
  if (!data) return

  form.value.endereco = data.logradouro || form.value.endereco
  form.value.bairro = data.bairro || form.value.bairro
  form.value.cidade = data.localidade || form.value.cidade
  form.value.estado = data.uf || form.value.estado
}

async function tratarBuscaCnpj() {
  if (!form.value.cnpj || String(form.value.cnpj).length < 18) return

  try {
    loading.value = true
    const data = await buscarCnpj(form.value.cnpj)
    if (!data) return

    form.value.razao_social = data.razao_social || data.nome || form.value.razao_social
    form.value.nome_fantasia = data.nome_fantasia || data.fantasia || form.value.nome_fantasia
    form.value.email = data.email || form.value.email
    form.value.cep = data.cep ? maskCEP(data.cep) : form.value.cep
    form.value.telefone = data.telefone ? maskTelefone(data.telefone) : form.value.telefone
    form.value.ie = data.ie || form.value.ie

    await tratarBuscaCep()
  } catch (e) {
    notify.error('Erro ao buscar CNPJ.')
  } finally {
    loading.value = false
  }
}

function payloadParaApi() {
  return {
    ...form.value,
    email: form.value.email ? String(form.value.email).toLowerCase().trim() : null,
    data_vencimento: form.value.data_vencimento ? Number(form.value.data_vencimento) : null,
  }
}

async function salvar() {
  if (saving.value) return

  const perm = isEdit.value ? 'fornecedores.editar' : 'fornecedores.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    return
  }

  saving.value = true
  try {
    await FornecedorService.salvar(isEdit.value ? Number(fornecedorId.value) : null, payloadParaApi())
    notify.success(isEdit.value ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!')
    await router.replace('/fornecedor')
  } catch (e) {
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao salvar.'))
  } finally {
    saving.value = false
  }
}

async function confirmarSalvarFornecedor() {
  const perm = isEdit.value ? 'fornecedores.editar' : 'fornecedores.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    isEdit.value ? 'Salvar alteracoes' : 'Finalizar cadastro',
    isEdit.value
      ? `Deseja salvar as alteracoes do Fornecedor #${fornecedorId.value}?`
      : 'Deseja finalizar o cadastro deste fornecedor?'
  )

  if (!ok) return
  await salvar()
}

async function confirmarExcluirFornecedor() {
  if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show('Excluir Fornecedor?', 'Esta acao nao pode ser desfeita.')
  if (!ok) return

  deleting.value = true
  try {
    await FornecedorService.remover(Number(fornecedorId.value))
    notify.success('Fornecedor removido!')
    await router.replace('/fornecedor')
  } catch (e) {
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao excluir.'))
  } finally {
    deleting.value = false
  }
}

async function carregarDados() {
  if (!isEdit.value) return

  loading.value = true
  try {
    const res = await FornecedorService.buscar(Number(fornecedorId.value))
    const data = res?.data || res || {}

    form.value = {
      ...form.value,
      ...data,
      data_vencimento: data?.data_vencimento ?? null,
    }
  } catch (e) {
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao carregar dados.'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const perm = isEdit.value ? 'fornecedores.editar' : 'fornecedores.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/fornecedor')
    return
  }

  await carregarDados()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.clientes-line-form :deep(.search-container > label) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgb(100 116 139);
}

.clientes-line-form :deep(input.w-full),
.clientes-line-form :deep(select.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.clientes-line-form :deep(input.w-full:focus),
.clientes-line-form :deep(select.w-full:focus) {
  box-shadow: none;
}
</style>
