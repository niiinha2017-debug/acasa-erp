<template>
  <div class="login-font cliente-editor w-full h-full rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

    <PageHeader
      :title="isEdit ? `Editar Cliente #${clienteId}` : 'Novo Cliente'"
      subtitle="Gerenciamento de dados cadastrais e contato"
      icon="pi pi-user-plus"
      :showBack="false"
      class="border-b border-border-ui"
    />

    <div class="cliente-body px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <Loading v-if="loading" />

      <form v-else class="cliente-form space-y-12 clientes-line-form" @submit.prevent="confirmarSalvarCliente" autocomplete="off">
        <div class="grid grid-cols-12 gap-8 items-end pb-4">
          <div class="col-span-12 md:col-span-3 pb-2">
            <CustomCheckbox
              v-model="isJuridica"
              label="Pessoa Juridica"
            />
          </div>

          <div class="col-span-12 md:col-span-5">
            <SearchInput
              v-model="form.indicacao_id"
              mode="select"
              label="Indicacao de cliente"
              placeholder="Pesquisar cliente existente..."
              :options="clientesOptions"
              labelKey="label"
              valueKey="value"
            />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Select
              v-model="form.indicacao_origem"
              label="Indicacao de rede social"
              placeholder="Selecione a origem"
              :options="indicacaoOrigens"
              force-upper
            />
          </div>

        </div>

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Principais
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-7">
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

        <div class="grid grid-cols-12 gap-x-6 gap-y-7">
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
              v-model="form.situacao"
              label="Status"
              placeholder="Selecione o status"
              :options="opcoesSituacao"
              force-upper
            />
          </div>
        </div>

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
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

          <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 mt-1 border-t border-border-ui/70">
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

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Endereco
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-7">
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

        <!-- Progresso do cliente (contratos) – apenas na edição -->
        <template v-if="isEdit && can('contratos.ver')">
          <div class="relative mt-10">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Progresso do cliente
              </span>
            </div>
          </div>

          <div class="mt-6 rounded-xl border border-border-ui/70 overflow-hidden">
            <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between gap-3 flex-wrap">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contratos</span>
              <RouterLink
                :to="`/contratos/cliente/${clienteId}`"
                class="text-xs font-semibold text-brand-primary hover:underline"
              >
                Ver todos os contratos
              </RouterLink>
            </div>
            <div v-if="loadingContratos" class="px-4 py-8 text-center text-slate-500 text-sm">
              Carregando contratos...
            </div>
            <div v-else-if="contratosDoCliente.length === 0" class="px-4 py-6 text-center text-slate-400 text-sm">
              Nenhum contrato para este cliente.
            </div>
            <ul v-else class="divide-y divide-border-ui/70">
              <li
                v-for="c in contratosDoCliente"
                :key="c.id"
                class="px-4 py-3 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-sm font-semibold text-slate-800 dark:text-white">{{ c.numero || `#${c.id}` }}</span>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                    :class="{
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300': (c.status || '').toUpperCase() === 'RASCUNHO',
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300': (c.status || '').toUpperCase() === 'VIGENTE',
                      'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200': (c.status || '').toUpperCase() === 'ENCERRADO',
                    }"
                  >
                    {{ c.status === 'VIGENTE' ? 'Em obra' : c.status === 'ENCERRADO' ? 'Encerrado' : 'Rascunho' }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{{ format.currency(c.valor) }}</span>
                  <RouterLink
                    :to="`/contratos/${c.id}`"
                    class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    title="Abrir contrato"
                  >
                    <i class="pi pi-eye text-sm" />
                  </RouterLink>
                </div>
              </li>
            </ul>
          </div>
        </template>

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
  </div>
</template>

<style scoped>
.login-font {
  font-family: 'Segoe UI Variable', 'Segoe UI', Tahoma, Arial, sans-serif;
}

.cliente-form {
  max-width: 1160px;
  margin: 0 auto;
}

.cliente-form > * + * {
  margin-top: 3.1rem !important;
}

.section-divider {
  margin-top: 0.9rem;
}

.section-title {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: rgb(148 163 184);
}

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.clientes-line-form :deep(.search-container > label) {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgb(100 116 139);
}

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > .relative.group > input),
.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > .relative.group > select),
.clientes-line-form :deep(.search-container > .relative.group > input) {
  min-height: 46px !important;
  height: 46px !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.55rem !important;
  font-size: 15px !important;
  font-weight: 400 !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-bottom-width: 2px !important;
  border-bottom-style: solid !important;
  border-bottom-color: rgba(148, 163, 184, 0.65) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > .relative.group > input:focus),
.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > .relative.group > select:focus),
.clientes-line-form :deep(.search-container > .relative.group > input:focus) {
  border-bottom-color: rgba(2, 132, 199, 0.9) !important;
  box-shadow: none !important;
  outline: none !important;
}

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > .relative.group > input::placeholder),
.clientes-line-form :deep(.search-container > .relative.group > input::placeholder) {
  color: rgb(148 163 184);
}
</style>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService, ContratosService } from '@/services/index'
import { format } from '@/utils/format'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCPF, maskCNPJ, maskCEP, maskTelefone, maskRG, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { can } from '@/services/permissions'
import { closeTabAndGo } from '@/utils/tabs'
import storage from '@/utils/storage'
import { INDICACAO_ORIGENS } from '@/constantes'

definePage({ meta: { perm: 'clientes.ver' } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const loadingContratos = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isJuridica = ref(false)
const listaClientes = ref([])
const contratosDoCliente = ref([])
const indicacaoOrigens = INDICACAO_ORIGENS.map((item) => ({
  value: item.key,
  label: item.label,
}))

const clienteId = computed(() => Number(route.params?.id))
const isEdit = computed(() => Number.isFinite(clienteId.value) && clienteId.value > 0)

const opcoesEstadoCivil = [
  { value: 'SOLTEIRO', label: 'SOLTEIRO' },
  { value: 'CASADO', label: 'CASADO' },
  { value: 'DIVORCIADO', label: 'DIVORCIADO' },
  { value: 'VIUVO', label: 'VIUVO(A)' },
]

const opcoesSituacao = [
  { value: 'ATIVO', label: 'ATIVO' },
  { value: 'INATIVO', label: 'INATIVO' },
  { value: 'PENDENTE', label: 'PENDENTE' },
]

const form = reactive({
  indicacao_id: null,
  indicacao_origem: '',
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
  situacao: 'ATIVO',
  vendedor_responsavel_id: null,
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
  } else {
    notify.warn('CEP não encontrado.')
  }
}

async function onBlurCnpj() {
  if (form.cnpj?.length < 18) return
  const data = await buscarCnpj(form.cnpj)
  if (data) {
    form.nome_completo = data.razao_social || data.nome || form.nome_completo
    form.nome_fantasia = data.nome_fantasia || data.fantasia || form.nome_fantasia
    form.email = data.email || form.email
    form.ie = data.ie || form.ie
    form.telefone = data.telefone ? maskTelefone(data.telefone) : form.telefone
    form.cep = data.cep ? maskCEP(data.cep) : form.cep
    form.endereco = data.endereco || form.endereco
    form.numero = data.numero || form.numero
    form.bairro = data.bairro || form.bairro
    form.cidade = data.cidade || form.cidade
    form.estado = data.estado || form.estado
    await onBlurCep()
  } else {
    notify.warn('CNPJ não encontrado.')
  }
}

async function carregarDados() {
  try {
    loading.value = true

    try {
      const resClientes = await ClienteService.select()
      listaClientes.value = Array.isArray(resClientes?.data) ? resClientes.data : []
    } catch {
      const resLista = await ClienteService.listar()
      const rows = Array.isArray(resLista?.data) ? resLista.data : []
      listaClientes.value = rows.map((c) => ({
        value: c.id,
        label: c.nome_completo || c.razao_social || c.nome_fantasia || `CLIENTE #${c.id}`,
      }))
    }

    if (!isEdit.value) {
      const usuarioLogado = storage.getUser()
      const funcId = usuarioLogado?.funcionario_id ?? null
      form.vendedor_responsavel_id = funcId ? Number(funcId) : null
      form.situacao = form.situacao || 'ATIVO'
    }

    if (isEdit.value) {
      const resUnico = await ClienteService.buscar(clienteId.value)

      if (resUnico?.data) {
        const c = resUnico.data

        Object.assign(form, {
          indicacao_id: c.indicacao_id || null,
          indicacao_origem: c.indicacao_origem || '',
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
          situacao: c.situacao || 'ATIVO',
          vendedor_responsavel_id: c.vendedor_responsavel_id ?? null,
        })

        isJuridica.value = !!c.cnpj
      }
    }

    if (isEdit.value && can('contratos.ver')) {
      loadingContratos.value = true
      try {
        const resContratos = await ContratosService.listar()
        const all = Array.isArray(resContratos?.data) ? resContratos.data : []
        contratosDoCliente.value = all
          .filter((c) => Number(c.cliente_id) === clienteId.value)
          .sort((a, b) => (b.id || 0) - (a.id || 0))
      } catch {
        contratosDoCliente.value = []
      } finally {
        loadingContratos.value = false
      }
    } else {
      contratosDoCliente.value = []
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
    const textoOuNulo = (v) => {
      const s = String(v ?? '').trim()
      return s ? s : null
    }

    const payload = {
      nome_completo: String(form.nome_completo || '').trim(),
      indicacao_origem: textoOuNulo(form.indicacao_origem),
      data_nascimento: form.data_nascimento ? form.data_nascimento : null,
      cpf: textoOuNulo(form.cpf),
      rg: textoOuNulo(form.rg),
      cnpj: textoOuNulo(form.cnpj),
      ie: textoOuNulo(form.ie),
      telefone: textoOuNulo(form.telefone),
      whatsapp: textoOuNulo(form.whatsapp),
      estado_civil: textoOuNulo(form.estado_civil),
      nome_conjuge: form.estado_civil === 'CASADO' ? textoOuNulo(form.nome_conjuge) : null,
      email: form.email ? String(form.email).toLowerCase().trim() : null,
      cep: textoOuNulo(form.cep),
      endereco: textoOuNulo(form.endereco),
      numero: textoOuNulo(form.numero),
      complemento: textoOuNulo(form.complemento),
      bairro: textoOuNulo(form.bairro),
      cidade: textoOuNulo(form.cidade),
      estado: textoOuNulo(form.estado),
      situacao: textoOuNulo(form.situacao) || 'ATIVO',
      razao_social: isJuridica.value ? form.nome_completo : null,
      enviar_aniversario_email: form.email ? !!form.enviar_aniversario_email : false,
      enviar_aniversario_whatsapp: form.whatsapp ? !!form.enviar_aniversario_whatsapp : false,
      indicacao_id: form.indicacao_id ? Number(form.indicacao_id) : null,
      vendedor_responsavel_id: form.vendedor_responsavel_id ? Number(form.vendedor_responsavel_id) : null,
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
    closeTabAndGo('/clientes')
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
    closeTabAndGo('/clientes')
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
