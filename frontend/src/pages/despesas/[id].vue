<template>
  <div class="page-container">
    <Card :shadow="true" class="overflow-hidden border-none">
      <PageHeader
        :title="isEdit ? `Editar Lançamento #${despesaId}` : 'Novo Lançamento'"
        subtitle="Despesa / Receita operacional"
        icon="pi pi-wallet"
        :backTo="'/despesas'"
        class="bg-slate-50/50 border-b border-slate-100"
      />

      <div class="p-6 relative">
        <Loading v-if="loading" />

        <template v-else>
          <form class="space-y-6" @submit.prevent="salvar">
          <!-- ===================================================== -->
          <!-- TIPO MOVIMENTO -->
          <!-- ===================================================== -->
          <section class="space-y-2">
            <div class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Tipo de movimento
            </div>

            <div class="inline-flex w-full md:w-[420px] rounded-2xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                @click="form.tipo_movimento = 'SAIDA'"
                :class="[
                  'flex-1 h-9 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition',
                  form.tipo_movimento === 'SAIDA'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                ]"
              >
                Despesa
              </button>

              <button
                type="button"
                @click="form.tipo_movimento = 'ENTRADA'"
                :class="[
                  'flex-1 h-9 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition',
                  form.tipo_movimento === 'ENTRADA'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                ]"
              >
                Receita
              </button>
            </div>
          </section>

          <div class="h-px bg-slate-100"></div>

          <!-- ===================================================== -->
          <!-- DADOS -->
          <!-- ===================================================== -->
          <section class="space-y-5">
            <div class="grid grid-cols-12 gap-4 items-end">
              <!-- Descrição -->
<Input
  class="col-span-12"
  v-model="form.local"
  label="Descrição"
  placeholder="Ex: ALUGUEL, SALÁRIO, VENDA"
/>


              <!-- Categoria / Classificação / Unidade -->
<!-- Unidade / Categoria / Classificação -->
<SearchInput
  class="col-span-12 md:col-span-4"
  v-model="form.unidade"
  mode="select"
  label="Unidade"
  placeholder="Selecione"
  :options="unidadesOptions"
  labelKey="label"
  valueKey="value"
  :readonly="isEdit"
/>

<SearchInput
  class="col-span-12 md:col-span-4"
  v-model="form.categoria"
  mode="select"
  label="Categoria *"
  placeholder="Selecione"
  :options="categoriasOptions"
  labelKey="label"
  valueKey="value"
/>

<div class="col-span-12 md:col-span-4">
  <div class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
    Classificação
  </div>

  <div
    class="h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50
           flex items-center text-slate-700 font-black uppercase tracking-[0.15em]"
  >
    {{ classificacaoLabel || '-' }}
  </div>
</div>


              <!-- Valor / Forma / Parcelas -->
              <div class="col-span-12 md:col-span-4">
                <label class="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Valor *
                </label>

                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                    R$
                  </span>

                  <input
                    :value="numeroParaMoeda(form.valor_total)"
                    @input="form.valor_total = moedaParaNumero($event.target.value)"
                    type="text"
                    inputmode="numeric"
                    placeholder="0,00"
                    class="w-full h-11 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white
                           text-base font-black text-slate-800
                           focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/60"
                  />
                </div>
              </div>

              <SearchInput
                class="col-span-12 md:col-span-4"
                v-model="form.forma_pagamento"
                mode="select"
                label="Forma de pagamento"
                placeholder="Selecione"
                :options="formasPagamentoOptions"
                labelKey="label"
                valueKey="value"
              />

              <!-- PIX: Banco + Tipo -->
<SearchInput
  v-if="precisaBanco"
  class="col-span-12 md:col-span-4"
  v-model="form.conta_bancaria_key"
  mode="select"
  label="Banco/Conta *"
  placeholder="Selecione"
  :options="contasBancariasOptions"
  labelKey="label"
  valueKey="value"
/>

<SearchInput
  v-if="precisaBanco"

  class="col-span-12 md:col-span-4"
  v-model="form.conta_bancaria_tipo_key"
  mode="select"
  label="Tipo da conta *"
  placeholder="Selecione"
  :options="tiposContasBancariasOptions"
  labelKey="label"
  valueKey="value"
/>

<!-- Cartão: Qual cartão -->
<SearchInput
  v-if="precisaCartao"
  class="col-span-12 md:col-span-4"
  v-model="form.cartao_credito_key"
  mode="select"
  label="Cartão de crédito *"
  placeholder="Selecione"
  :options="cartoesCreditoOptions"
  labelKey="label"
  valueKey="value"
/>


              <Input
                class="col-span-12 md:col-span-4"
                v-model.number="form.quantidade_parcelas"
                type="number"
                label="Parcelas"
                placeholder="1"
                :forceUpper="false"
                min="1"
                max="60"
              />

<!-- Status + Responsável (mesma linha no desktop) -->
<SearchInput
  class="col-span-12 md:col-span-4"
  v-model="form.status"
  mode="select"
  label="Status"
  placeholder="Selecione"
  :options="statusOptions"
  labelKey="label"
  valueKey="value"
/>

<SearchInput
  class="col-span-12 md:col-span-8"
  v-model="form.funcionario_id"
  mode="select"
  label="Responsável"
  placeholder="Selecione"
  :options="funcionariosOptions"
  labelKey="label"
  valueKey="value"
/>

              <!-- Datas -->
              <Input
                class="col-span-12 md:col-span-4"
                v-model="form.data_registro"
                type="date"
                label="Data do registro"
                :forceUpper="false"
              />

              <Input
                class="col-span-12 md:col-span-4"
                v-model="form.data_vencimento"
                type="date"
                label="Data do vencimento"
                :forceUpper="false"
              />

              <Input
                class="col-span-12 md:col-span-4"
                v-model="form.data_pagamento"
                type="date"
                label="Data do pagamento"
                :forceUpper="false"
                :disabled="form.status !== 'PAGO'"
              />
            </div>
          </section>

          <div class="h-px bg-slate-100"></div>

          <!-- ===================================================== -->
          <!-- AÇÕES -->
          <!-- ===================================================== -->
          <div class="flex items-center justify-end gap-3">
<button
  v-if="isEdit && can('despesas.excluir')"
  type="button"
  @click.stop.prevent="excluir"
  class="bg-red-600 text-white h-11 px-6 rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-red-700 transition"
>
  Excluir
</button>



<Button
  v-if="can(isEdit ? 'despesas.editar' : 'despesas.criar')"
  class="min-w-[140px]"
  type="submit"
  variant="primary"
  :loading="loading"
  :label="isEdit ? 'Salvar' : 'Criar'"
/>

          </div>
        </form>
        </template>
      </div>
    </Card>
  </div>
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

console.log('[DESPESAS] ⭐ ARQUIVO CARREGADO')

definePage({ meta: { perm: 'despesas.ver' } })



const route = useRoute()
const router = useRouter()

const hidratando = ref(false)
const loading = ref(false)
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


// Utilitários
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
  if (!form.classificacao) return '-'
  return String(form.classificacao).replace(/_/g, ' ')
})

// Watchers
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
  if (fp !== 'CREDITO') {
    form.cartao_credito_key = null
  }
})

function isoToBR(iso) {
  if (!iso) return ''
  // iso esperado: YYYY-MM-DD
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}


// Ações
async function init() {
  console.log('[DESPESAS] === INICIANDO INIT ===')
  loading.value = true
  try {
    console.log('[DESPESAS] Carregando funcionários...')
    const res = await FuncionarioService.select()
    funcionariosOptions.value = Array.isArray(res?.data) ? res.data : []
    console.log('[DESPESAS] Funcionários carregados:', funcionariosOptions.value.length)

    if (isEdit.value) {
      console.log('[DESPESAS] Modo EDITAR, buscando despesa ID =', despesaId.value)
      const { data: despesa } = await DespesaService.buscar(despesaId.value)
      console.log('[DESPESAS] Despesa encontrada:', despesa)
      hidratando.value = true

      Object.assign(form, {
        ...despesa,
        valor_total: Number(despesa.valor_total) || 0,
        quantidade_parcelas: Number(despesa.quantidade_parcelas) || 1,
        data_vencimento: despesa.data_vencimento?.slice(0, 10) || '',
        data_pagamento: despesa.data_pagamento?.slice(0, 10) || '',
        data_registro: despesa.data_registro?.slice(0, 10) || today(),
      })

      console.log('[DESPESAS] Form hidratado:', form)
      setTimeout(() => { hidratando.value = false }, 150)
    } else {
      console.log('[DESPESAS] Modo CRIAR')
    }
  } catch (e) {
    console.log('[DESPESAS] ❌ ERRO init:', e)
    const apiMsg = e?.response?.data?.message
    const msg = Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Erro ao carregar dados')
    notify.error(msg)
  } finally {
    loading.value = false
    console.log('[DESPESAS] === INIT CONCLUÍDO ===')
  }
}


async function salvar() {
  console.log('[DESPESAS] === INICIANDO SALVAR ===')
  console.log('[DESPESAS] isEdit =', isEdit.value)
  console.log('[DESPESAS] form =', JSON.stringify(form, null, 2))
  
  const perm = isEdit.value ? 'despesas.editar' : 'despesas.criar'
  console.log('[DESPESAS] permissão necessária =', perm)
  console.log('[DESPESAS] can(perm) =', can(perm))
  
  if (!can(perm)) {
    console.log('[DESPESAS] BLOQUEADO: Acesso negado')
    return notify.error('Acesso negado.')
  }

  // ✅ valida descrição ANTES de ligar loading
  const localFinal = upper(String(form.local || '').trim())
  console.log('[DESPESAS] localFinal =', localFinal)
  
  if (!form.categoria) {
    console.log('[DESPESAS] BLOQUEADO: Categoria vazia')
    return notify.info('Selecione a categoria')
  }

  if (!form.data_vencimento) {
    console.log('[DESPESAS] BLOQUEADO: Data vencimento vazia')
    return notify.info('Preencha a data de vencimento')
  }

  if (formasQuePrecisamBanco.includes(form.forma_pagamento)) {
    if (!form.conta_bancaria_key) {
      console.log('[DESPESAS] BLOQUEADO: Banco vazio')
      return notify.info('Selecione o banco/conta')
    }
    if (!form.conta_bancaria_tipo_key) {
      console.log('[DESPESAS] BLOQUEADO: Tipo conta vazio')
      return notify.info('Selecione o tipo da conta')
    }
  }

  if (form.forma_pagamento === 'CREDITO') {
    if (!form.cartao_credito_key) {
      console.log('[DESPESAS] BLOQUEADO: Cartão vazio')
      return notify.info('Selecione o cartão de crédito')
    }
  }

  console.log('[DESPESAS] ✅ PASSOU TODAS VALIDAÇÕES')
  loading.value = true
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

    // ✅ loga ANTES do request
    console.log('[DESPESAS] PAYLOAD COMPLETO =>', JSON.stringify(payload, null, 2))
    console.log('[DESPESAS] ENVIANDO POST/PUT para ID:', despesaId.value)

    await DespesaService.salvar(despesaId.value, payload)

    console.log('[DESPESAS] ✅✅✅ SALVO COM SUCESSO!')
    notify.success(isEdit.value ? 'Atualizado com sucesso!' : 'Lançamento criado!')
    router.push('/despesas')
  } catch (e) {
    console.log('[DESPESAS] ❌ ERRO CAPTURADO NO CATCH')
    console.log('[DESPESAS] status =>', e?.response?.status)
    console.log('[DESPESAS] data =>', e?.response?.data)

    const apiMsg = e?.response?.data?.message
    console.log('[DESPESAS] message[] =>', apiMsg)
    
    // Se é array, loga cada item
    if (Array.isArray(apiMsg)) {
      apiMsg.forEach((msg, idx) => {
        console.log(`[DESPESAS] message[${idx}] = ${msg}`)
      })
    } else {
      console.log('[DESPESAS] message (string) =>', apiMsg)
    }

    const msg = Array.isArray(apiMsg)
      ? apiMsg.join(' | ')
      : (apiMsg || e?.message || 'Erro ao salvar lançamento')

    notify.error(msg)
  } finally {
    loading.value = false
  }
}


async function excluir(event) {
  if (!can('despesas.excluir')) return notify.error('Acesso negado.')
  
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  if (!despesaId.value) return

const confirmado = await confirm.show('Excluir Lançamento?', 'Esta ação não pode ser desfeita.')
if (!confirmado) return



  loading.value = true
  try {
    await DespesaService.remover(Number(despesaId.value))
    notify.success('Registro excluído!')
    router.push('/despesas')
} catch (e) {
  console.log('[DELETE] erro bruto:', e)
  const apiMsg = e?.response?.data?.message
  const msg = Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || e?.message || 'Erro ao excluir')
  notify.error(msg)
} finally {


    loading.value = false
  }
}

onMounted(async () => {
  console.log('[DESPESAS] === onMounted DISPARADO ===')
  const perm = isEdit.value ? 'despesas.editar' : 'despesas.criar'
  console.log('[DESPESAS] onMounted - perm:', perm)
  console.log('[DESPESAS] onMounted - can(perm):', can(perm))
  
  if (!can(perm)) {
    console.log('[DESPESAS] onMounted - ACESSO NEGADO')
    notify.error('Acesso negado.')
    router.push('/despesas')
    return
  }
  console.log('[DESPESAS] onMounted - INICIANDO init()')
  await init()
  console.log('[DESPESAS] === onMounted CONCLUÍDO ===')
})

</script>
