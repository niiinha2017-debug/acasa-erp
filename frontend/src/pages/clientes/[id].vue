<template>
  <Card class="login-font mt-4 mb-8 mx-2 lg:mx-4 rounded-3xl border border-border-ui bg-bg-card shadow-2xl overflow-hidden animate-page-in">
    <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>

    <PageHeader
      :title="isEdit ? `Editar Cliente #${clienteId}` : 'Novo Cliente'"
      subtitle="Gerenciamento de dados cadastrais e contato"
      icon="pi pi-user-plus"
      :showBack="false"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10 clientes-line-form" @submit.prevent="confirmarSalvarCliente" autocomplete="off">
        <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl">
          <div class="col-span-12 md:col-span-3 pb-2">
            <CustomCheckbox
              v-model="isJuridica"
              label="Pessoa Juridica"
            />
          </div>

          <div class="col-span-12 md:col-span-9">
            <SearchInput
              v-model="form.indicacao_id"
              mode="select"
              label="Quem indicou?"
              placeholder="Pesquisar cliente existente..."
              :options="clientesOptions"
              labelKey="label"
              valueKey="value"
            />
          </div>
        </div>

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
            :class="isJuridica ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-9'"
            v-model="form.nome_completo"
            :label="isJuridica ? 'Razao Social' : 'Nome Completo'"
            placeholder="Digite o nome principal..."
            required
            force-upper
          />

          <Input
            v-if="isJuridica"
            class="col-span-12 md:col-span-3"
            v-model="form.nome_fantasia"
            label="Nome Fantasia"
            placeholder="Opcional"
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.data_nascimento"
            :label="isJuridica ? 'Data de Abertura' : 'Data de Nascimento'"
            type="date"
          />
        </div>

        <div class="grid grid-cols-12 gap-6">
          <template v-if="!isJuridica">
            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.cpf"
              label="CPF"
              placeholder="000.000.000-00"
              @input="form.cpf = maskCPF(form.cpf)"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.rg"
              label="RG"
              placeholder="00.000.000-0"
              @input="form.rg = maskRG(form.rg)"
            />
          </template>

          <template v-else>
            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.cnpj"
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              @input="form.cnpj = maskCNPJ(form.cnpj)"
              @blur="onBlurCnpj"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.ie"
              label="IE"
              placeholder="Inscricao Estadual"
              @input="form.ie = maskIE(form.ie)"
            />
          </template>

          <div class="col-span-12 md:col-span-4">
            <Select
              v-model="form.status"
              label="Status"
              placeholder="Selecione o status"
              :options="opcoesStatus"
              force-upper
              required
            />
          </div>
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
            v-model="form.whatsapp"
            label="WhatsApp"
            placeholder="(00) 00000-0000"
            @input="form.whatsapp = maskTelefone(form.whatsapp)"
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.telefone"
            label="Fixo"
            placeholder="(00) 0000-0000"
            @input="form.telefone = maskTelefone(form.telefone)"
          />

          <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-border-ui">
            <CustomCheckbox
              v-model="form.enviar_aniversario_email"
              :label="'Aviso por E-mail'"
              :description="form.email ? 'Sera enviado para o e-mail cadastrado' : 'Cadastre um e-mail primeiro'"
              :disabled="!form.email"
            />
            <CustomCheckbox
              v-model="form.enviar_aniversario_whatsapp"
              :label="'Aviso por WhatsApp'"
              :description="form.whatsapp ? 'Sera enviado para o WhatsApp cadastrado' : 'Cadastre um WhatsApp primeiro'"
              :disabled="!form.whatsapp"
            />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Select
              v-model="form.estado_civil"
              label="Estado Civil"
              placeholder="Selecione o estado civil"
              :options="opcoesEstadoCivil"
              force-upper
            />
          </div>

          <div class="col-span-12 md:col-span-8">
            <Input
              v-if="form.estado_civil === 'CASADO'"
              v-model="form.nome_conjuge"
              label="Nome do Conjuge"
              placeholder="Digite o nome completo do conjuge"
              force-upper
            />
          </div>
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
            v-model="form.cep"
            label="CEP"
            placeholder="00000-000"
            @input="form.cep = maskCEP(form.cep)"
            @blur="onBlurCep"
          />
          <Input
            class="col-span-12 md:col-span-7"
            v-model="form.endereco"
            label="Logradouro"
            placeholder="Rua, Avenida, etc..."
            force-upper
          />
          <Input
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
            label="UF"
            placeholder="Ex: SP"
            force-upper
          />

          <Input
            class="col-span-12"
            v-model="form.complemento"
            label="Complemento / Referencia"
            placeholder="Apto, Bloco, Proximo a..."
            force-upper
          />
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <Button
              v-if="isEdit && can('clientes.excluir')"
              type="button"
              variant="danger"
              :loading="deleting"
              @click="excluir"
            >
              <i class="pi pi-trash mr-2 text-[12px]"></i>
              Excluir
            </Button>

            <div class="flex items-center gap-3">
              <Button
                variant="secondary"
                type="button"
                @click="router.push('/clientes')"
              >
                Cancelar
              </Button>

              <Button
                v-if="can(isEdit ? 'clientes.editar' : 'clientes.criar')"
                variant="primary"
                type="submit"
                :loading="saving"
              >
                <i class="pi pi-save mr-2 text-[12px]"></i>
                {{ isEdit ? 'Atualizar Cliente' : 'Cadastrar Cliente' }}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </Card>
</template>

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
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCPF, maskCNPJ, maskCEP, maskTelefone, maskRG, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'clientes.ver' } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isJuridica = ref(false)
const listaClientes = ref([])

const clienteId = computed(() => Number(route.params?.id))
const isEdit = computed(() => Number.isFinite(clienteId.value) && clienteId.value > 0)

const opcoesEstadoCivil = [
  { value: '', label: 'SELECIONE...' },
  { value: 'SOLTEIRO', label: 'SOLTEIRO' },
  { value: 'CASADO', label: 'CASADO' },
  { value: 'DIVORCIADO', label: 'DIVORCIADO' },
  { value: 'VIUVO', label: 'VIUVO(A)' },
]

const opcoesStatus = [
  { value: 'ATIVO', label: 'ATIVO' },
  { value: 'INATIVO', label: 'INATIVO' },
  { value: 'PENDENTE', label: 'PENDENTE' },
  { value: 'BLOQUEADO', label: 'BLOQUEADO' },
]

const form = reactive({
  indicacao_id: null,
  nome_completo: '',
  razao_social: '',
  nome_fantasia: '',
  data_nascimento: '',
  cpf: '',
  rg: '',
  cnpj: '',
  ie: '',
  telefone: '',
  whatsapp: '',
  estado_civil: '',
  nome_conjuge: '',
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
  status: 'ATIVO',
})

const clientesOptions = computed(() => {
  return listaClientes.value.filter((o) => !isEdit.value || Number(o.value) !== clienteId.value)
})

async function onBlurCep() {
  if (form.cep?.length < 9) return
  const data = await buscarCep(form.cep)
  if (data) {
    form.endereco = data.logradouro || form.endereco
    form.bairro = data.bairro || form.bairro
    form.cidade = data.localidade || form.cidade
    form.estado = data.uf || form.estado
  }
}

async function onBlurCnpj() {
  if (form.cnpj?.length < 18) return
  const data = await buscarCnpj(form.cnpj)
  if (data) {
    form.nome_completo = data.razao_social || data.nome || form.nome_completo
    form.nome_fantasia = data.nome_fantasia || data.fantasia || form.nome_fantasia
    form.email = data.email || form.email
    form.cep = data.cep || form.cep
    onBlurCep()
  }
}

async function carregarDados() {
  try {
    loading.value = true

    const resClientes = await ClienteService.select()
    listaClientes.value = Array.isArray(resClientes?.data) ? resClientes.data : []

    if (isEdit.value) {
      const resUnico = await ClienteService.buscar(clienteId.value)

      if (resUnico?.data) {
        const c = resUnico.data

        Object.assign(form, {
          indicacao_id: c.indicacao_id || null,
          nome_completo: c.nome_completo || '',
          razao_social: c.razao_social || '',
          nome_fantasia: c.nome_fantasia || '',
          data_nascimento: c.data_nascimento?.split('T')[0] || '',
          cpf: c.cpf || '',
          rg: c.rg || '',
          cnpj: c.cnpj || '',
          ie: c.ie || '',
          telefone: c.telefone || '',
          whatsapp: c.whatsapp || '',
          estado_civil: c.estado_civil || '',
          nome_conjuge: c.nome_conjuge || '',
          email: c.email || '',
          enviar_aniversario_email: !!c.enviar_aniversario_email,
          enviar_aniversario_whatsapp: !!c.enviar_aniversario_whatsapp,
          cep: c.cep || '',
          endereco: c.endereco || '',
          numero: c.numero || '',
          complemento: c.complemento || '',
          bairro: c.bairro || '',
          cidade: c.cidade || '',
          estado: c.estado || '',
          status: c.status || 'ATIVO',
        })

        isJuridica.value = !!c.cnpj
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    notify.error('Erro ao carregar dados.')
  } finally {
    loading.value = false
  }
}

watch(isJuridica, (val) => {
  if (val) {
    form.cpf = ''
    form.rg = ''
  } else {
    form.cnpj = ''
    form.ie = ''
    form.nome_fantasia = ''
  }
})

watch(() => form.email, (v) => {
  form.email = String(v || '').toLowerCase().trim()
  if (!form.email) form.enviar_aniversario_email = false
})

watch(() => form.whatsapp, (v) => {
  if (!v) form.enviar_aniversario_whatsapp = false
})

watch(() => form.estado_civil, (v) => {
  if (v !== 'CASADO') form.nome_conjuge = ''
})

async function confirmarSalvarCliente() {
  const perm = isEdit.value ? 'clientes.editar' : 'clientes.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    return
  }

  const nome = String(form.nome_completo || '').trim() || 'cliente'
  const ok = await confirm.show('Salvar Registro', `Deseja salvar o registro de "${nome}"?`)
  if (!ok) return

  await salvar()
}

async function salvar() {
  if (saving.value) return

  const perm = isEdit.value ? 'clientes.editar' : 'clientes.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    return
  }

  saving.value = true

  try {
    const payload = {
      ...form,
      data_nascimento: form.data_nascimento ? form.data_nascimento : null,

      razao_social: isJuridica.value ? form.nome_completo : null,
      email: form.email ? String(form.email).toLowerCase().trim() : null,
      nome_conjuge: form.estado_civil === 'CASADO' ? (form.nome_conjuge || null) : null,
      enviar_aniversario_email: form.email ? !!form.enviar_aniversario_email : false,
      enviar_aniversario_whatsapp: form.whatsapp ? !!form.enviar_aniversario_whatsapp : false,
      indicacao_id: form.indicacao_id ? Number(form.indicacao_id) : null,
    }

    if (!isJuridica.value) {
      delete payload.cnpj
      delete payload.ie
      delete payload.razao_social
    } else {
      delete payload.cpf
      delete payload.rg
    }

    await ClienteService.salvar(isEdit.value ? Number(clienteId.value) : null, payload)

    notify.success(isEdit.value ? 'Cliente atualizado!' : 'Cliente cadastrado!')
    await router.push('/clientes')
  } catch (err) {
    const apiMsg = err?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao salvar.'))
  } finally {
    saving.value = false
  }
}

async function excluir() {
  const ok = await confirm.show('Excluir Cliente?', 'Esta acao nao pode ser desfeita.')
  if (!ok) return

  deleting.value = true
  try {
    await ClienteService.remover(Number(clienteId.value))
    notify.success('Cliente removido!')
    router.push('/clientes')
  } catch (err) {
    console.error('Erro ao excluir:', err)
    const apiMsg = err?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao excluir.'))
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  const perm = isEdit.value ? 'clientes.editar' : 'clientes.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/clientes')
    return
  }

  await carregarDados()
})
</script>
