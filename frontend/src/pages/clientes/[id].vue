<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font cliente-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Cliente #${clienteId}` : 'Novo Cliente'"
        subtitle="Gerenciamento de dados cadastrais e contato"
        icon="pi pi-user-plus"
        variant="minimal"
      />

    <div class="cliente-body ds-editor-body">
      <Loading v-if="loading" />

      <form v-else class="cliente-form ds-editor-form space-y-12" @submit.prevent="confirmarSalvarCliente" autocomplete="off">
        <div class="cliente-form__lead-grid ds-editor-lead-grid grid grid-cols-12 gap-8 items-end pb-4">
          <div class="col-span-12 md:col-span-2 pb-2">
            <CustomCheckbox
              v-model="isJuridica"
              label="Pessoa Juridica"
            />
          </div>

          <div class="cliente-form__lead-search col-span-12 md:col-span-6">
            <SearchInput
              v-model="form.indicacao_id"
              mode="select"
              variant="line"
              hide-search-icon
              label="Indicacao de cliente"
              placeholder="Pesquisar cliente existente..."
              :options="clientesOptions"
              labelKey="label"
              valueKey="value"
            />
          </div>

          <div class="cliente-form__lead-select col-span-12 md:col-span-4">
            <SearchInput
              v-model="form.indicacao_origem"
              mode="select"
              variant="line"
              hide-search-icon
              label="Indicacao de rede social"
              placeholder="Selecione a origem"
              :options="indicacaoOrigens"
              labelKey="label"
              valueKey="value"
            />
          </div>

        </div>

        <div class="section-divider ds-section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Principais
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-7">
          <Input
            variant="line"
            :class="isJuridica ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-9'"
            v-model="form.nome_completo"
            :label="isJuridica ? 'Razao Social' : 'Nome Completo'"
            placeholder="Digite o nome principal..."
            required
            force-upper
          />

          <Input
            variant="line"
            v-if="isJuridica"
            class="col-span-12 md:col-span-3"
            v-model="form.nome_fantasia"
            label="Nome Fantasia"
            placeholder="Opcional"
            force-upper
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-3"
            v-model="form.data_nascimento"
            :label="isJuridica ? 'Data de Abertura' : 'Data de Nascimento'"
            type="date"
          />
        </div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-7">
          <template v-if="!isJuridica">
            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.cpf"
              label="CPF"
              placeholder="000.000.000-00"
              @input="form.cpf = maskCPF(form.cpf)"
            />

            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.rg"
              label="RG"
              placeholder="00.000.000-0"
              @input="form.rg = maskRG(form.rg)"
            />
          </template>

          <template v-else>
            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.cnpj"
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              @input="form.cnpj = maskCNPJ(form.cnpj)"
              @blur="onBlurCnpj"
            />

            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.ie"
              label="IE"
              placeholder="Inscricao Estadual"
              @input="form.ie = maskIE(form.ie)"
            />
          </template>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="form.situacao"
              mode="select"
              variant="line"
              hide-search-icon
              label="Situação do cadastro"
              placeholder="Selecione a situação"
              :options="opcoesSituacao"
              labelKey="label"
              valueKey="value"
            />
          </div>
        </div>

        <div class="section-divider ds-section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Contato
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="form.email"
            label="E-mail"
            type="email"
            placeholder="ex: nome@dominio.com"
            :force-upper="false"
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="form.whatsapp"
            label="WhatsApp"
            placeholder="(00) 00000-0000"
            @input="form.whatsapp = maskTelefone(form.whatsapp)"
          />

          <Input
            variant="line"
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
            <SearchInput
              v-model="form.estado_civil"
              mode="select"
              variant="line"
              hide-search-icon
              label="Estado Civil"
              placeholder="Selecione o estado civil"
              :options="opcoesEstadoCivil"
              labelKey="label"
              valueKey="value"
            />
          </div>

          <div class="col-span-12 md:col-span-8">
            <Input
              variant="line"
              v-if="form.estado_civil === 'CASADO'"
              v-model="form.nome_conjuge"
              label="Nome do Conjuge"
              placeholder="Digite o nome completo do conjuge"
              force-upper
            />
          </div>
        </div>

        <div class="section-divider ds-section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Endereco
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-7">
          <!-- CEP com busca automática -->
          <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
            <div class="flex items-end gap-2">
              <Input
                variant="line"
                class="flex-1"
                v-model="form.cep"
                label="CEP"
                placeholder="00000-000"
                @input="form.cep = maskCEP(form.cep)"
                @blur="onBlurCep"
              />
              <button
                type="button"
                class="cep-btn"
                :class="{ 'cep-btn--loading': cepCarregando }"
                :disabled="cepCarregando"
                title="Buscar CEP"
                @click="onBlurCep"
              >
                <svg v-if="!cepCarregando" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              </button>
            </div>
          </div>
          <Input
            variant="line"
            class="col-span-12 md:col-span-7"
            v-model="form.endereco"
            label="Logradouro"
            placeholder="Rua, Avenida, etc..."
            force-upper
          />
          <Input
            variant="line"
            class="col-span-12 md:col-span-2"
            v-model="form.numero"
            label="N"
            placeholder="123"
            force-upper
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="form.bairro"
            label="Bairro"
            placeholder="Ex: Centro"
            force-upper
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-5"
            v-model="form.cidade"
            label="Cidade"
            placeholder="Ex: Sao Paulo"
            force-upper
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-3"
            v-model="form.estado"
            label="UF"
            placeholder="Ex: SP"
            force-upper
          />

          <div class="col-span-12 flex flex-col gap-1">
            <Input
              variant="line"
              v-model="form.complemento"
              label="Complemento / Referencia"
              placeholder="Apto, Bloco, Proximo a..."
              force-upper
            />
          </div>

          <!-- Botão Google Maps -->
          <div v-if="enderecoCompleto" class="col-span-12">
            <a
              :href="linkGoogleMaps"
              target="_blank"
              rel="noopener noreferrer"
              class="maps-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Ver no Google Maps
            </a>
          </div>
        </div>

        <template v-if="isEdit">
          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Arquivos do cliente
              </span>
            </div>
          </div>

          <div class="cliente-files">
            <div class="cliente-files__header">
              <span class="cliente-files__eyebrow">Anexos vinculados ao cadastro</span>
              <button
                type="button"
                class="cliente-files__link"
                @click="abrirArquivosCliente"
              >
                Abrir tela de arquivos
              </button>
            </div>

            <div v-if="loadingArquivos" class="cliente-files__state">
              Carregando arquivos...
            </div>

            <div v-else-if="arquivosDoCliente.length === 0" class="cliente-files__state cliente-files__state--empty">
              Nenhum arquivo vinculado a este cliente.
            </div>

            <ul v-else class="cliente-files__list">
              <li
                v-for="arquivo in arquivosDoCliente"
                :key="arquivo.id"
                class="cliente-files__item"
              >
                <div class="cliente-files__meta">
                  <span class="cliente-files__name">{{ arquivo.nome || arquivo.filename || `Arquivo #${arquivo.id}` }}</span>
                  <span class="cliente-files__info">
                    {{ formatFileType(arquivo.mime_type) }}<span v-if="arquivo.categoria"> • {{ arquivo.categoria }}</span>
                  </span>
                </div>

                <div class="cliente-files__actions">
                  <button
                    type="button"
                    class="cliente-files__action"
                    :disabled="!arquivoPodeVisualizar(arquivo)"
                    @click="abrirArquivoCliente(arquivo)"
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    class="cliente-files__action"
                    @click="baixarArquivoCliente(arquivo)"
                  >
                    Baixar
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </template>

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
                    class="ds-status-pill px-2 py-0.5 text-[10px]"
                    :class="{
                      'ds-status-pill--neutral': ['RASCUNHO', 'ENCERRADO'].includes((c.status || '').toUpperCase()),
                      'ds-status-pill--success': (c.status || '').toUpperCase() === 'VIGENTE',
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
          <div
            class="cliente-form__actions ds-editor-actions flex items-center gap-4"
            :class="isEdit && can('clientes.excluir') ? 'justify-between' : 'justify-end'"
          >
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

            <div class="cliente-form__actions-main ds-editor-actions-main flex items-center gap-3 justify-end">
              <Button
                v-if="isEdit"
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
  </section>
  </PageShell>
</template>

<style scoped>
.cliente-editor {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.cliente-form__lead-search,
.cliente-form__lead-select {
  min-width: 0;
}

.cliente-form :deep(.ds-checkbox) {
  padding-left: 0;
  padding-right: 0;
  border-radius: 0;
  gap: 0.55rem;
}

.cliente-form :deep(.ds-checkbox:hover) {
  background: transparent;
  border-color: transparent;
}

.cliente-form :deep(.ds-checkbox__box) {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
}

.cliente-form :deep(.ds-checkbox__label) {
  font-size: 0.84rem;
  font-weight: 450;
}

.cliente-form :deep(.ds-checkbox__description) {
  font-size: 0.72rem;
}

.cliente-files {
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.dark .cliente-files {
  border-top-color: rgba(51, 71, 102, 0.55);
  border-bottom-color: rgba(51, 71, 102, 0.55);
}

.cliente-files__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.95rem 0;
}

.cliente-files__eyebrow {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}

.cliente-files__link {
  color: var(--ds-color-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.cliente-files__state {
  padding: 1rem 0 1.25rem;
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
}

.cliente-files__state--empty {
  color: var(--ds-color-text-faint);
}

.cliente-files__list {
  display: flex;
  flex-direction: column;
}

.cliente-files__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid rgba(214, 224, 234, 0.42);
}

.dark .cliente-files__item {
  border-top-color: rgba(51, 71, 102, 0.42);
}

.cliente-files__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cliente-files__name {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.35;
}

.cliente-files__info {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
}

.cliente-files__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.cliente-files__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.9rem;
  padding: 0 0.65rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 0.7rem;
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 600;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.cliente-files__action:hover {
  border-color: rgba(44, 111, 163, 0.24);
  color: var(--ds-color-primary);
  background: rgba(44, 111, 163, 0.05);
}
</style>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService, ContratosService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { getApiBaseUrl } from '@/services/api'
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
const loadingArquivos = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isJuridica = ref(false)
const listaClientes = ref([])
const contratosDoCliente = ref([])
const arquivosDoCliente = ref([])
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
  return (listaClientes.value || [])
    .map((item) => {
      const value = item?.value ?? item?.id ?? null
      const label = item?.label || item?.nome_completo || item?.razao_social || item?.nome_fantasia || (value != null ? `CLIENTE #${value}` : '')
      return {
        value,
        label,
      }
    })
    .filter((item) => item.value != null && item.label)
    .filter((item) => !isEdit.value || Number(item.value) !== clienteId.value)
})

const cepCarregando = ref(false)

const enderecoCompleto = computed(() => {
  const partes = [form.endereco, form.numero, form.bairro, form.cidade, form.estado].filter(Boolean)
  return partes.length >= 2 ? partes.join(', ') : ''
})

const linkGoogleMaps = computed(() => {
  if (!enderecoCompleto.value) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto.value)}`
})

async function onBlurCep() {
  if (form.cep?.length < 9) return
  cepCarregando.value = true
  const data = await buscarCep(form.cep)
  cepCarregando.value = false
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

    if (isEdit.value && can('arquivos.ver')) {
      loadingArquivos.value = true
      try {
        const resArquivos = await ArquivosService.listar({
          ownerType: 'CLIENTE',
          ownerId: clienteId.value,
        })
        const payload = resArquivos?.data
        const rows = Array.isArray(payload) ? payload : (payload?.data || [])
        arquivosDoCliente.value = rows.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
      } catch {
        arquivosDoCliente.value = []
      } finally {
        loadingArquivos.value = false
      }
    } else {
      arquivosDoCliente.value = []
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    notify.error('Erro ao carregar dados.')
  } finally {
    loading.value = false
  }
}

function formatFileType(mimeType) {
  const raw = String(mimeType || '').toLowerCase()
  if (!raw) return 'Arquivo'
  if (raw.includes('pdf')) return 'PDF'
  if (raw.includes('image')) return 'Imagem'
  if (raw.includes('sheet') || raw.includes('excel') || raw.includes('spreadsheet')) return 'Planilha'
  if (raw.includes('word') || raw.includes('document')) return 'Documento'
  return raw.split('/')[1] || 'Arquivo'
}

function abrirArquivosCliente() {
  if (!clienteId.value) return
  router.push({
    path: '/arquivos',
    query: {
      owner_type: 'CLIENTE',
      owner_id: String(clienteId.value),
      ownerType: 'CLIENTE',
      ownerId: String(clienteId.value),
    },
  })
}

function abrirArquivoCliente(arquivo) {
  if (!arquivo?.id) return
  const nome = arquivo.nome || arquivo.filename || `ARQUIVO_${arquivo.id}`
  const type = arquivo.mime_type || ''
  const from = `/arquivos?owner_type=CLIENTE&owner_id=${encodeURIComponent(String(clienteId.value))}`
  const path = String(type).toLowerCase().includes('pdf') ? `/arquivos/pdf/${arquivo.id}` : `/arquivos/${arquivo.id}`
  router.push({
    path,
    query: { name: nome, type, from },
  })
}

function arquivoPodeVisualizar(arquivo) {
  const mime = String(arquivo?.mime_type || '').toLowerCase()
  const nome = String(arquivo?.nome || arquivo?.filename || '').toLowerCase()
  const ext = nome.includes('.') ? nome.split('.').pop() : ''
  if (mime.includes('pdf') || mime.startsWith('image/')) return true
  if (mime.includes('wordprocessingml') || mime.includes('msword')) return true
  return ext === 'pdf' || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp' || ext === 'gif' || ext === 'doc' || ext === 'docx'
}

async function baixarArquivoCliente(arquivo) {
  if (!arquivo?.id) return
  try {
    const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)
    if (isTauri) {
      try {
        const nomeOriginal = arquivo.nome || arquivo.filename || `ARQUIVO_${arquivo.id}`
        const nomeSeguro = String(nomeOriginal)
          .replace(/[\\/:*?"<>|]+/g, '_')
          .replace(/\s+/g, ' ')
          .trim() || `ARQUIVO_${arquivo.id}`
        const { save } = await import('@tauri-apps/plugin-dialog')
        const { writeFile } = await import('@tauri-apps/plugin-fs')
        const resBlob = await ArquivosService.baixarBlob(arquivo.id)
        const blob = resBlob?.data
        if (blob) {
          const targetPath = await save({
            defaultPath: nomeSeguro,
            title: 'Salvar arquivo',
          })
          if (targetPath) {
            const bytes = new Uint8Array(await blob.arrayBuffer())
            await writeFile(targetPath, bytes)
            notify.success('Arquivo salvo com sucesso.')
            return
          }
          return
        }
      } catch (nativeErr) {
        console.warn('[Download nativo Tauri fallback->url/blob]', nativeErr)
      }

      try {
        const tk = await ArquivosService.downloadToken(arquivo.id)
        const relativeUrl = String(tk?.data?.url || '')
        if (relativeUrl) {
          const base = String(getApiBaseUrl() || '').replace(/\/+$/, '')
          const root = /^https?:\/\//i.test(base)
            ? base.replace(/\/api$/i, '')
            : String(import.meta.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '')
          const absoluteUrl = relativeUrl.startsWith('http')
            ? relativeUrl
            : `${root}${relativeUrl}`
          const openerMod = await import('@tauri-apps/plugin-opener').catch(() => null)
          const openUrlFn = openerMod?.openUrl ?? openerMod?.default?.openUrl
          if (typeof openUrlFn === 'function') {
            await openUrlFn(absoluteUrl)
            notify.success('Download aberto no sistema.')
            return
          }
        }
      } catch (tauriErr) {
        console.warn('[Download Tauri URL fallback->blob]', tauriErr)
      }
    }

    const res = await ArquivosService.baixarBlob(arquivo.id)
    const blob = res?.data
    if (!blob) {
      notify.error('Não foi possível baixar o arquivo.')
      return
    }
    const nomeOriginal = arquivo.nome || arquivo.filename || `ARQUIVO_${arquivo.id}`
    const nome = String(nomeOriginal)
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim() || `ARQUIVO_${arquivo.id}`
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()

    // Em alguns WebViews (ex.: Tauri/Windows), o atributo download pode falhar.
    // Fallback: abre o blob em nova aba/janela.
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(url)
      } catch {}
    }, 2000)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao baixar arquivo.')
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

<style scoped>
/* Botão buscar CEP */
.cep-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--ds-color-border, #e2e8f0);
  background: var(--ds-color-surface-raised, #fff);
  color: var(--ds-color-text-secondary, #64748b);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  margin-bottom: 1px;
}
.cep-btn:hover:not(:disabled) {
  background: var(--ds-color-primary, #3b82f6);
  color: #fff;
  border-color: var(--ds-color-primary, #3b82f6);
}
.cep-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.cep-btn--loading svg {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Botão Google Maps */
.maps-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #1a73e8;
  text-decoration: none;
  padding: 0.3rem 0.7rem;
  border: 1px solid #1a73e8;
  border-radius: 6px;
  background: transparent;
  transition: background 0.15s, color 0.15s;
}
.maps-btn:hover {
  background: #1a73e8;
  color: #fff;
}
</style>
