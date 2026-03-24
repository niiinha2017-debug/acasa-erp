<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font despesa-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar lançamento #${despesaId}` : 'Novo lançamento'"
        subtitle="Despesa ou receita operacional com dados financeiros e vencimento"
        icon="pi pi-wallet"
        variant="minimal"
      />

      <div class="despesa-body ds-editor-body">
        <Loading v-if="loading" />

        <form v-else class="despesa-form ds-editor-form space-y-12" @submit.prevent="salvar" autocomplete="off">
          <div class="despesa-form__lead-grid ds-editor-lead-grid grid grid-cols-12 gap-6 items-end pb-4">
            <div class="col-span-12 md:col-span-4">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-2">
                Tipo de lançamento
              </label>

              <div class="inline-flex w-full rounded-2xl border border-border-ui bg-transparent p-1 gap-1">
                <button
                  type="button"
                  class="flex-1 h-11 rounded-[14px] text-sm font-semibold transition-all duration-200"
                  :class="form.tipo_movimento === 'SAIDA'
                    ? 'bg-slate-100 dark:bg-slate-800 text-rose-600'
                    : 'text-text-soft hover:text-text-main hover:bg-slate-50 dark:hover:bg-slate-900/60'"
                  @click="form.tipo_movimento = 'SAIDA'"
                >
                  Despesa
                </button>
                <button
                  type="button"
                  class="flex-1 h-11 rounded-[14px] text-sm font-semibold transition-all duration-200"
                  :class="form.tipo_movimento === 'ENTRADA'
                    ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600'
                    : 'text-text-soft hover:text-text-main hover:bg-slate-50 dark:hover:bg-slate-900/60'"
                  @click="form.tipo_movimento = 'ENTRADA'"
                >
                  Receita
                </button>
              </div>
            </div>

            <div class="col-span-12 md:col-span-4">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-1.5">Valor</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-soft">R$</span>
                <input
                  :value="numeroParaMoeda(form.valor_total)"
                  @input="form.valor_total = moedaParaNumero($event.target.value)"
                  type="text"
                  inputmode="numeric"
                  placeholder="0,00"
                  class="w-full h-11 pl-9 pr-3 rounded-2xl border border-border-ui bg-transparent text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
            </div>

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.status"
              mode="select"
              variant="line"
              label="Status"
              placeholder="Selecione o status"
              :options="statusOptions"
              labelKey="label"
              valueKey="value"
            />
          </div>

          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Dados do lançamento
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-x-6 gap-y-7">
            <Input
              variant="line"
              class="col-span-12"
              v-model="form.local"
              label="Descrição"
              placeholder="Ex: aluguel da fábrica, salário, venda avulsa"
            />

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.unidade"
              mode="select"
              variant="line"
              label="Unidade"
              placeholder="Selecione a unidade"
              :options="unidadesOptions"
              labelKey="label"
              valueKey="value"
              :readonly="isEdit"
            />

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.categoria"
              mode="select"
              variant="line"
              label="Categoria"
              placeholder="Selecione a categoria"
              :options="categoriasOptions"
              labelKey="label"
              valueKey="value"
            />

            <div class="col-span-12 md:col-span-4">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-1.5">Classificação</label>
              <div class="h-11 rounded-2xl border border-border-ui bg-transparent px-3 flex items-center text-sm text-text-main">
                {{ classificacaoLabel || '–' }}
              </div>
            </div>

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.forma_pagamento"
              mode="select"
              variant="line"
              label="Forma de pagamento"
              placeholder="Selecione a forma"
              :options="formasPagamentoOptions"
              labelKey="label"
              valueKey="value"
            />

            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model.number="form.quantidade_parcelas"
              type="number"
              label="Parcelas"
              placeholder="1"
              :forceUpper="false"
              min="1"
              max="60"
            />

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.funcionario_id"
              mode="select"
              variant="line"
              label="Responsável"
              placeholder="Selecione o responsável"
              :options="funcionariosOptions"
              labelKey="label"
              valueKey="value"
            />

            <SearchInput
              v-if="precisaBanco"
              class="col-span-12 md:col-span-6"
              v-model="form.conta_bancaria_key"
              mode="select"
              variant="line"
              label="Banco/Conta"
              placeholder="Selecione a conta"
              :options="contasBancariasOptions"
              labelKey="label"
              valueKey="value"
            />

            <SearchInput
              v-if="precisaBanco"
              class="col-span-12 md:col-span-6"
              v-model="form.conta_bancaria_tipo_key"
              mode="select"
              variant="line"
              label="Tipo da conta"
              placeholder="Selecione o tipo"
              :options="tiposContasBancariasOptions"
              labelKey="label"
              valueKey="value"
            />

            <SearchInput
              v-if="precisaCartao"
              class="col-span-12 md:col-span-6"
              v-model="form.cartao_credito_key"
              mode="select"
              variant="line"
              label="Cartão de crédito"
              placeholder="Selecione o cartão"
              :options="cartoesCreditoOptions"
              labelKey="label"
              valueKey="value"
            />
          </div>

          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Datas
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-x-6 gap-y-7">
            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.data_registro"
              type="date"
              label="Data do registro"
              :forceUpper="false"
            />

            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.data_vencimento"
              type="date"
              label="Vencimento"
              :forceUpper="false"
            />

            <Input
              variant="line"
              class="col-span-12 md:col-span-4"
              v-model="form.data_pagamento"
              type="date"
              label="Pagamento"
              :forceUpper="false"
              :disabled="form.status !== 'PAGO'"
            />
          </div>

          <FormActions
            :is-edit="isEdit"
            :loading-save="actionLoading"
            :loading-delete="actionLoading"
            :show-delete="isEdit"
            perm-create="despesas.criar"
            perm-edit="despesas.editar"
            perm-delete="despesas.excluir"
            label-create="Criar lançamento"
            @save="salvar"
            @delete="excluir"
          />
        </form>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FuncionarioService, DespesaService } from '@/services/index'
import { notify } from '@/services/notify'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import * as CONST from '@/constantes/index'
import { upper } from '@/utils/text'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { closeTabAndGo } from '@/utils/tabs'
import FormActions from '@/components/ui/FormActions.vue'

definePage({ meta: { perm: 'despesas.ver' } })

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const actionLoading = ref(false)
const hidratando = ref(false)
const funcionariosOptions = ref([])

const today = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  tipo_movimento: 'SAIDA',
  funcionario_id: null,
  categoria: null,
  classificacao: null,
  unidade: null,
  local: '',
  valor_total: 0,
  forma_pagamento: null,
  quantidade_parcelas: 1,
  status: 'EM_ABERTO',
  data_vencimento: today(),
  data_pagamento: '',
  data_registro: today(),
  conta_bancaria_key: null,
  conta_bancaria_tipo_key: null,
  cartao_credito_key: null,
})

const despesaId = computed(() => {
  const id = route.params?.id
  return id ? Number(id) : null
})

const isEdit = computed(() => !!despesaId.value)

const formasQuePrecisamBanco = ['PIX', 'TRANSFERENCIA', 'CHEQUE', 'BOLETO']
const precisaBanco = computed(() => formasQuePrecisamBanco.includes(form.forma_pagamento))
const precisaCartao = computed(() => form.forma_pagamento === 'CREDITO')

const mapToOptions = (data) => {
  if (Array.isArray(data)) return data.map(i => ({ label: i.label, value: i.key }))
  if (data && typeof data === 'object') {
    return Object.values(data).flat().map(i => ({ label: i.label, value: i.key }))
  }
  return []
}

const unidadesOptions = computed(() => mapToOptions(CONST.UNIDADES_OPERACIONAIS))
const formasPagamentoOptions = computed(() => mapToOptions(CONST.FORMAS_PAGAMENTO))
const statusOptions = computed(() => mapToOptions(CONST.STATUS_FINANCEIRO))
const contasBancariasOptions = computed(() => mapToOptions(CONST.CONTAS_BANCARIAS))
const tiposContasBancariasOptions = computed(() => mapToOptions(CONST.TIPOS_CONTAS_BANCARIAS))
const cartoesCreditoOptions = computed(() => mapToOptions(CONST.CARTOES_CREDITO))

const categoriasOptions = computed(() => {
  if (form.tipo_movimento === 'ENTRADA') {
    return (CONST.RECEITA_OPERACIONAL || []).map(i => ({
      label: i.label,
      value: i.key,
      classificacaoKey: 'RECEITA_OPERACIONAL',
    }))
  }
  if (!form.unidade) return []
  const porUnidade = CONST.FINANCEIRO_CATEGORIAS?.[form.unidade]
  if (!porUnidade) return []
  const result = []
  Object.entries(porUnidade).forEach(([grupo, itens]) => {
    ;(itens || []).forEach(i => {
      result.push({ label: i.label, value: i.key, classificacaoKey: grupo })
    })
  })
  return result
})

const classificacaoLabel = computed(() => {
  if (!form.classificacao) return '–'
  return String(form.classificacao).replace(/_/g, ' ')
})

watch(() => form.categoria, (newVal) => {
  if (!newVal) return
  const selecionada = categoriasOptions.value.find(o => o.value === newVal)
  if (selecionada) form.classificacao = selecionada.classificacaoKey
}, { immediate: true })

watch([() => form.tipo_movimento, () => form.unidade], () => {
  if (hidratando.value) return
  form.categoria = null
  form.classificacao = null
})

watch(() => form.status, (novo) => {
  if (novo !== 'PAGO') form.data_pagamento = ''
})

watch(() => form.forma_pagamento, (fp) => {
  if (!formasQuePrecisamBanco.includes(fp)) {
    form.conta_bancaria_key = null
    form.conta_bancaria_tipo_key = null
  }
  if (fp !== 'CREDITO') form.cartao_credito_key = null
})

function isoToBR(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

async function init() {
  loading.value = true
  try {
    const res = await FuncionarioService.select()
    funcionariosOptions.value = Array.isArray(res?.data) ? res.data : []

    if (isEdit.value) {
      const { data: despesa } = await DespesaService.buscar(despesaId.value)
      hidratando.value = true
      Object.assign(form, {
        ...despesa,
        valor_total: Number(despesa.valor_total) || 0,
        quantidade_parcelas: Number(despesa.quantidade_parcelas) || 1,
        data_vencimento: despesa.data_vencimento?.slice(0, 10) || '',
        data_pagamento: despesa.data_pagamento?.slice(0, 10) || '',
        data_registro: despesa.data_registro?.slice(0, 10) || today(),
      })
      setTimeout(() => { hidratando.value = false }, 150)
    }
  } catch (e) {
    const apiMsg = e?.response?.data?.message
    const msg = Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao carregar dados')
    notify.error(msg)
  } finally {
    loading.value = false
  }
}

async function salvar() {
  if (!can(isEdit.value ? 'despesas.editar' : 'despesas.criar')) {
    return notify.error('Acesso negado.')
  }

  const localFinal = upper(String(form.local || '').trim())
  if (!form.categoria) return notify.info('Selecione a categoria')
  if (!form.data_vencimento) return notify.info('Preencha a data de vencimento')
  if (formasQuePrecisamBanco.includes(form.forma_pagamento)) {
    if (!form.conta_bancaria_key) return notify.info('Selecione o banco/conta')
    if (!form.conta_bancaria_tipo_key) return notify.info('Selecione o tipo da conta')
  }
  if (form.forma_pagamento === 'CREDITO' && !form.cartao_credito_key) {
    return notify.info('Selecione o cartão de crédito')
  }

  actionLoading.value = true
  try {
    const payload = {
      ...JSON.parse(JSON.stringify(form)),
      local: localFinal || 'SEM DESCRIÇÃO',
      valor_total: String(form.valor_total),
      quantidade_parcelas: Number(form.quantidade_parcelas || 1),
      data_registro: form.data_registro ? isoToBR(form.data_registro) : undefined,
      data_vencimento: form.data_vencimento ? isoToBR(form.data_vencimento) : undefined,
      data_pagamento:
        form.status === 'PAGO' && form.data_pagamento
          ? isoToBR(form.data_pagamento)
          : undefined,
    }
    await DespesaService.salvar(despesaId.value, payload)
    notify.success(isEdit.value ? 'Atualizado com sucesso.' : 'Lançamento criado.')
    closeTabAndGo('/despesas')
  } catch (e) {
    const apiMsg = e?.response?.data?.message
    const msg = Array.isArray(apiMsg)
      ? apiMsg.join(' | ')
      : (apiMsg || e?.message || 'Erro ao salvar lançamento')
    notify.error(msg)
  } finally {
    actionLoading.value = false
  }
}

async function excluir() {
  if (!can('despesas.excluir')) return notify.error('Acesso negado.')
  if (!despesaId.value) return
  const confirmado = await confirm.show('Excluir lançamento?', 'Esta ação não pode ser desfeita.')
  if (!confirmado) return

  actionLoading.value = true
  try {
    await DespesaService.remover(Number(despesaId.value))
    notify.success('Registro excluído.')
    closeTabAndGo('/despesas')
  } catch (e) {
    const apiMsg = e?.response?.data?.message
    const msg = Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || e?.message || 'Erro ao excluir')
    notify.error(msg)
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  if (!can(isEdit.value ? 'despesas.editar' : 'despesas.criar')) {
    notify.error('Acesso negado.')
    router.push('/despesas')
    return
  }
  await init()
})
</script>

<style scoped>
.login-font {
  font-family: var(--ds-font-sans);
}
</style>
