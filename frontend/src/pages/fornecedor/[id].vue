<template>
  <PageShell :padded="false">
    <section class="login-font fornecedor-page animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Fornecedor #${fornecedorId}` : 'Novo Fornecedor'"
        subtitle="Gerenciamento de dados cadastrais e contato"
        icon="pi pi-truck"
      />

      <div class="fornecedor-page__body">
        <Loading v-if="loading" />

        <form v-else class="fornecedor-form ds-stack-8" @submit.prevent="confirmarSalvarFornecedor" autocomplete="off">
          <section class="ds-stack-6">
            <div class="ds-divider">
              <span class="ds-divider-label">Dados Principais</span>
            </div>

            <div class="ds-form-grid">
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
          <Input
            class="col-span-12 md:col-span-8"
            v-model="form.ramo_atividade"
            label="Ramo de Atividade"
            placeholder="Ex: Confecção, Tecidos, Aviação"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model.number="form.prazo_entrega_dias"
            type="number"
            label="Prazo de Entrega (Dias)"
            placeholder="Ex: 15"
          />
            </div>
          </section>

          <section class="ds-stack-6">
            <div class="ds-divider">
              <span class="ds-divider-label">Contato</span>
            </div>

            <div class="ds-form-grid">
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

            </div>
          </section>

          <section class="ds-stack-6">
            <div class="ds-divider">
              <span class="ds-divider-label">Politica Financeira</span>
            </div>

            <div class="ds-form-grid">
          <SearchInput
            class="col-span-12 md:col-span-5"
            v-model="form.regime_financeiro_padrao"
            mode="select"
            variant="line"
            hide-search-icon
            label="Regime Financeiro Padrao"
            placeholder="Selecione o regime"
            :options="regimeFinanceiroOptions"
            required
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model.number="form.dia_fechamento_padrao"
            type="number"
            label="Dia de Fechamento"
            placeholder="Ex: 10"
          />

          <div class="col-span-12 md:col-span-4 fornecedor-page__checkbox-row">
            <CustomCheckbox
              v-model="form.permite_multiplas_formas"
            >
              Permite multiplas formas no fechamento
            </CustomCheckbox>
          </div>

          <div class="col-span-12">
            <p class="ds-field-label fornecedor-page__subsection-label">Formas de Pagamento Habilitadas</p>
            <div class="ds-form-grid fornecedor-page__payment-grid">
              <div
                v-for="item in formasPagamentoOptions"
                :key="item.key"
                class="col-span-12 md:col-span-6 lg:col-span-4 fornecedor-page__payment-card"
              >
                <CustomCheckbox
                  :model-value="hasFormaPagamento(item.key)"
                  @update:model-value="toggleFormaPagamento(item.key, $event)"
                >
                  {{ item.label }}
                </CustomCheckbox>

                <div v-if="hasFormaPagamento(item.key)" class="fornecedor-page__payment-detail">
                  <Input
                    v-model.number="getFormaPagamento(item.key).parcelas_padrao"
                    type="number"
                    label="Parcelas Padrao"
                    placeholder="Ex: 6"
                  />
                </div>
              </div>
            </div>
          </div>
            </div>
          </section>

          <section class="ds-stack-6">
            <div class="ds-divider">
              <span class="ds-divider-label">Endereco</span>
            </div>

            <div class="ds-form-grid">
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
          </section>

          <FormActions
            :is-edit="isEdit"
            :loading-save="saving"
            :loading-delete="deleting"
            :show-delete="isEdit && can('fornecedores.excluir')"
            perm-create="fornecedores.criar"
            perm-edit="fornecedores.editar"
            perm-delete="fornecedores.excluir"
            label-create="Cadastrar Fornecedor"
            @save="confirmarSalvarFornecedor"
            @delete="confirmarExcluirFornecedor"
          />
        </form>
      </div>
    </section>
  </PageShell>
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
import { closeTabAndGo } from '@/utils/tabs'

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
  ramo_atividade: '',
  prazo_entrega_dias: null,
  telefone: '',
  whatsapp: '',
  email: '',
  forma_pagamento: '',
  regime_financeiro_padrao: 'FECHAMENTO_MENSAL',
  dia_fechamento_padrao: null,
  permite_multiplas_formas: false,
  formas_pagamento_habilitadas: [],
  data_vencimento: null,
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
})

const formasPagamentoOptions = [
  { key: 'CHEQUE', label: 'Cheque' },
  { key: 'BOLETO', label: 'Boleto' },
  { key: 'CARTAO', label: 'Cartao' },
  { key: 'PIX', label: 'Pix' },
  { key: 'TRANSFERENCIA', label: 'Transferencia' },
]

const regimeFinanceiroOptions = [
  { value: 'FECHAMENTO_MENSAL', label: 'FECHAMENTO_MENSAL' },
  { value: 'TITULO_NA_COMPRA', label: 'TITULO_NA_COMPRA' },
  { value: 'HIBRIDO', label: 'HIBRIDO' },
]

function hasFormaPagamento(key) {
  return form.value.formas_pagamento_habilitadas.some(
    (item) => String(item.forma_pagamento_chave || '').toUpperCase() === String(key).toUpperCase(),
  )
}

function getFormaPagamento(key) {
  let found = form.value.formas_pagamento_habilitadas.find(
    (item) => String(item.forma_pagamento_chave || '').toUpperCase() === String(key).toUpperCase(),
  )
  if (!found) {
    found = { forma_pagamento_chave: String(key).toUpperCase(), parcelas_padrao: null }
    form.value.formas_pagamento_habilitadas.push(found)
  }
  return found
}

function toggleFormaPagamento(key, checked) {
  const normalized = String(key || '').toUpperCase()
  if (checked) {
    getFormaPagamento(normalized)
    return
  }
  form.value.formas_pagamento_habilitadas = form.value.formas_pagamento_habilitadas.filter(
    (item) => String(item.forma_pagamento_chave || '').toUpperCase() !== normalized,
  )
}

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
  if (!data) {
    notify.warn('CEP não encontrado.')
    return
  }

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
    if (!data) {
      notify.warn('CNPJ não encontrado.')
      return
    }

    form.value.razao_social = data.razao_social || data.nome || form.value.razao_social
    form.value.nome_fantasia = data.nome_fantasia || data.fantasia || form.value.nome_fantasia
    form.value.email = data.email || form.value.email
    form.value.cep = data.cep ? maskCEP(data.cep) : form.value.cep
    form.value.telefone = data.telefone ? maskTelefone(data.telefone) : form.value.telefone
    form.value.ie = data.ie || form.value.ie
    form.value.endereco = data.endereco || form.value.endereco
    form.value.numero = data.numero || form.value.numero
    form.value.bairro = data.bairro || form.value.bairro
    form.value.cidade = data.cidade || form.value.cidade
    form.value.estado = data.estado || form.value.estado

    await tratarBuscaCep()
  } catch (e) {
    notify.error('Erro ao buscar CNPJ.')
  } finally {
    loading.value = false
  }
}

function payloadParaApi() {
  const formas = Array.isArray(form.value.formas_pagamento_habilitadas)
    ? form.value.formas_pagamento_habilitadas
        .map((item) => ({
          forma_pagamento_chave: String(item?.forma_pagamento_chave || '').trim().toUpperCase(),
          parcelas_padrao:
            item?.parcelas_padrao != null && item?.parcelas_padrao !== ''
              ? Number(item.parcelas_padrao)
              : null,
        }))
        .filter((item) => !!item.forma_pagamento_chave)
    : []

  return {
    ...form.value,
    email: form.value.email ? String(form.value.email).toLowerCase().trim() : null,
    regime_financeiro_padrao:
      String(form.value.regime_financeiro_padrao || '').trim() || 'FECHAMENTO_MENSAL',
    dia_fechamento_padrao:
      form.value.dia_fechamento_padrao ? Number(form.value.dia_fechamento_padrao) : null,
    permite_multiplas_formas: !!form.value.permite_multiplas_formas,
    formas_pagamento_habilitadas: formas,
    data_vencimento: form.value.data_vencimento ? Number(form.value.data_vencimento) : null,
    prazo_entrega_dias: form.value.prazo_entrega_dias != null && form.value.prazo_entrega_dias !== '' ? Number(form.value.prazo_entrega_dias) : null,
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
    closeTabAndGo('/fornecedor')
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
    closeTabAndGo('/fornecedor')
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
      regime_financeiro_padrao:
        String(data?.regime_financeiro_padrao || '').trim() || 'FECHAMENTO_MENSAL',
      dia_fechamento_padrao: data?.dia_fechamento_padrao ?? null,
      permite_multiplas_formas: !!data?.permite_multiplas_formas,
      formas_pagamento_habilitadas: Array.isArray(data?.formas_pagamento_habilitadas)
        ? data.formas_pagamento_habilitadas.map((item) => ({
            forma_pagamento_chave: String(item?.forma_pagamento_chave || '').toUpperCase(),
            parcelas_padrao:
              item?.parcelas_padrao != null && item?.parcelas_padrao !== ''
                ? Number(item.parcelas_padrao)
                : null,
          }))
        : [],
      data_vencimento: data?.data_vencimento ?? null,
      prazo_entrega_dias: data?.prazo_entrega_dias ?? null,
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
.fornecedor-page {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dark .fornecedor-page {
  background: var(--ds-color-surface);
}

.fornecedor-page :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  backdrop-filter: none;
}

.fornecedor-page :deep(.ds-header-block) {
  padding-top: 1rem;
  padding-bottom: 0.8rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .fornecedor-page :deep(.ds-header-block) {
    padding-top: 1.25rem;
    padding-bottom: 1rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .fornecedor-page :deep(.ds-header-block) {
    padding-top: 1.4rem;
    padding-bottom: 1rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.fornecedor-page :deep(.ds-header-title) {
  font-size: clamp(1.35rem, 1.08rem + 0.45vw, 1.8rem);
  font-weight: 620;
  letter-spacing: -0.03em;
}

.fornecedor-page :deep(.ds-header-subtitle) {
  max-width: 38rem;
  color: var(--ds-color-text-faint);
  font-size: 0.78rem;
  font-weight: 430;
}

.fornecedor-page :deep(.ds-header-icon) {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  border-color: rgba(214, 224, 234, 0.72);
  background: transparent;
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  box-shadow: none;
}

.dark .fornecedor-page :deep(.ds-header-icon) {
  border-color: rgba(51, 71, 102, 0.72);
  background: transparent;
}

.fornecedor-page__body {
  padding: 1.1rem 1rem 1.5rem;
}

@media (min-width: 768px) {
  .fornecedor-page__body {
    padding: 1.35rem 1.5rem 1.75rem;
  }
}

@media (min-width: 1024px) {
.fornecedor-page__body {
  padding: 1.5rem 2rem 2rem;
  }
}

.fornecedor-page :deep(.ds-divider) {
  margin: 0 0 1.35rem;
}

.fornecedor-page :deep(.ds-divider::before) {
  border-top-color: rgba(214, 224, 234, 0.62);
}

.dark .fornecedor-page :deep(.ds-divider::before) {
  border-top-color: rgba(51, 71, 102, 0.62);
}

.fornecedor-page :deep(.ds-divider-label) {
  background: var(--ds-color-surface);
  display: block;
  width: fit-content;
  margin: 0 auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0;
  text-align: center;
  text-transform: none;
}

.fornecedor-page__checkbox-row {
  display: flex;
  align-items: center;
  padding-top: 1.8rem;
}

.fornecedor-page__subsection-label {
  margin-bottom: 0.9rem;
}

.fornecedor-page__payment-grid {
  gap: 0.2rem 1rem;
}

.fornecedor-page__payment-card {
  padding: 0.15rem 0 0.4rem;
  border-bottom: 0;
}

.dark .fornecedor-page__payment-card {
  border-bottom-color: transparent;
}

.fornecedor-page__payment-detail {
  margin-top: 0.4rem;
  padding-left: 1.85rem;
  max-width: 16rem;
}

.fornecedor-page :deep(.ds-control-input) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 1px;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  border-bottom-color: rgba(188, 203, 221, 0.75);
  font-size: 0.88rem;
  font-weight: 430;
  line-height: 1.45;
}

.fornecedor-page :deep(.ds-control-input::placeholder) {
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 400;
  opacity: 1;
}

.fornecedor-page :deep(.ds-control-input:focus) {
  box-shadow: none;
  border-bottom-color: var(--ds-color-primary);
}

.fornecedor-page :deep(.ds-field-label) {
  width: auto;
  justify-content: flex-start;
  margin-left: 0;
  margin-bottom: 0.6rem;
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: none;
}

.fornecedor-page :deep(.ds-control-message) {
  margin-left: 0;
}

.fornecedor-page :deep(.ds-checkbox) {
  padding-left: 0;
  padding-right: 0;
  border-radius: 0;
  gap: 0.55rem;
}

.fornecedor-page :deep(.ds-checkbox:hover) {
  background: transparent;
  border-color: transparent;
}

.fornecedor-page :deep(.ds-checkbox__box) {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
}

.fornecedor-page :deep(.ds-checkbox__label) {
  font-size: 0.84rem;
  font-weight: 450;
}

.fornecedor-page :deep(.ds-checkbox__description) {
  font-size: 0.72rem;
}

.fornecedor-page :deep(.ds-form-actions) {
  margin-top: 1.4rem;
  padding-top: 1.4rem;
}

.fornecedor-page :deep(.ds-btn--primary),
.fornecedor-page :deep(.ds-btn--danger) {
  min-height: 2.4rem;
  border-radius: 0.8rem;
  box-shadow: none;
  font-size: 0.78rem;
  font-weight: 600;
}

.fornecedor-page :deep(.ds-control-input--with-prefix) {
  padding-left: 2.25rem;
}

.fornecedor-page :deep(.ds-control-input--with-suffix) {
  padding-right: 2.25rem;
}
</style>
