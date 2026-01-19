<template>
  <Card :shadow="true">
    <PageHeader
      :title="isEdit ? 'Editar Lançamento' : 'Novo Lançamento'"
      subtitle="Financeiro / Despesas"
      icon="pi pi-arrow-down-right"
      :backTo="'/despesas'"
    />

    <div class="p-8 relative">
      <Loading v-if="loading" />

      <form v-else @submit.prevent="salvar" class="space-y-8">
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          
          <div class="col-span-12 grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-3">
              <label class="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest ml-1">
                Movimentação
              </label>
              <select
                v-model="form.tipo_movimento"
                class="w-full h-11 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] font-bold text-[var(--text-main)] focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm uppercase tracking-tighter"
              >
                <option value="SAIDA">🔴 SAÍDA (Despesa)</option>
                <option value="ENTRADA">🟢 ENTRADA (Receita)</option>
              </select>
            </div>

            <SearchInput
              class="col-span-12 md:col-span-9"
              v-model="form.funcionario_id"
              mode="select"
              label="Vincular Funcionário (Opcional)"
              :options="funcionariosOptions"
              placeholder="PESQUISE O COLABORADOR..."
            />
          </div>

          <div class="col-span-12 h-px bg-[var(--border-ui)]"></div>

          <div class="col-span-12 md:col-span-6 space-y-6">
            <SearchInput
              v-model="form.categoria"
              mode="select"
              :options="categoriasOptions"
              label="O que está sendo pago? *"
              placeholder="SELECIONE A CATEGORIA..."
              required
            />

            <div class="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 flex items-center justify-between">
              <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classificação:</span>
              <span class="text-xs font-black text-brand-primary uppercase">
                {{ classificacaoLabel || '—' }}
              </span>
            </div>
          </div>

          <div class="col-span-12 md:col-span-6 grid grid-cols-2 gap-4">
            <div class="col-span-2 md:col-span-1">
              <label class="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest ml-1">
                Unidade
              </label>
              <select
                v-model="form.unidade"
                class="w-full h-11 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] font-bold text-[var(--text-main)] outline-none focus:border-brand-primary transition-all text-sm uppercase"
              >
                <option v-for="u in unidadesOptions" :key="u.value" :value="u.value">
                  {{ u.label }}
                </option>
              </select>
            </div>

            <Input
              v-model="form.local"
              label="Fornecedor / Destino *"
              placeholder="EX: CPFL, MERCADO..."
              class="col-span-2 md:col-span-1"
              required
            />

            <div class="col-span-2">
              <Input
                :model-value="numeroParaMoeda(form.valor_total)"
                @update:modelValue="onValorTotalChange"
                label="Valor Total (R$) *"
                placeholder="0,00"
                required
              >
                <template #prefix><span class="text-xs font-bold text-slate-400">R$</span></template>
              </Input>
            </div>
          </div>

          <div class="col-span-12 h-px bg-[var(--border-ui)]"></div>

          <div class="col-span-12 grid grid-cols-12 gap-5">
            <SearchInput
              v-model="form.forma_pagamento"
              mode="select"
              label="Meio de Pagamento *"
              :options="formasPagamentoOptions"
              class="col-span-12 md:col-span-5"
              required
            />

            <Input
              v-model.number="form.quantidade_parcelas"
              label="Parcelas"
              type="number"
              min="1"
              class="col-span-6 md:col-span-3"
            />

            <SearchInput
              v-model="form.status"
              mode="select"
              label="Situação *"
              :options="statusOptions"
              class="col-span-6 md:col-span-4"
              required
            />
          </div>

          <div class="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input v-model="form.data_vencimento" label="Data de Vencimento *" type="date" required />
            <Input v-model="form.data_pagamento" label="Data do Pagamento" type="date" />
            <Input v-model="form.data_registro" label="Competência *" type="date" required />
          </div>
        </div>

        <div class="pt-6 border-t border-[var(--border-ui)] flex justify-end">
          <FormActions
            :isEdit="isEdit"
            :loadingSave="loading"
            :loadingDelete="loadingDelete"
            :showDelete="isEdit"
            :showSave="true"
            @save="salvar"
            @delete="excluir"
          />
        </div>
      </form>
    </div>
  </Card>
</template>


<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { FuncionarioService, DespesaService } from '@/services/index'
import { notify } from '@/services/notify'
import { maskMoneyBR } from '@/utils/masks'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'


import {
  FINANCEIRO_CATEGORIAS,
  FORMAS_PAGAMENTO,
  STATUS_FINANCEIRO,
  UNIDADES_OPERACIONAIS,
  RECEITA_OPERACIONAL,
} from '@/constantes/index'

const route = useRoute()
const router = useRouter()

const despesaId = computed(() => Number(route.params?.id || 0) || null)
const isEdit = computed(() => !!despesaId.value)

const loading = ref(false)
const loadingDelete = ref(false)

const funcionariosOptions = ref([])

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
  status: null,

  data_vencimento: '',
  data_pagamento: '',
  data_registro: '',
})

// -----------------------------
// OPTIONS (Selects)
// -----------------------------
const unidadesOptions = computed(() => {
  const base = Array.isArray(UNIDADES_OPERACIONAIS)
    ? UNIDADES_OPERACIONAIS
    : Object.values(UNIDADES_OPERACIONAIS || {}).flat()

  return (base || []).map((u) => ({
    label: u.label,
    value: u.key,
  }))
})

const formasPagamentoOptions = computed(() => {
  const base = Array.isArray(FORMAS_PAGAMENTO)
    ? FORMAS_PAGAMENTO
    : Object.values(FORMAS_PAGAMENTO || {}).flat()

  return (base || []).map((f) => ({
    label: f.label,
    value: f.key,
  }))
})

const statusOptions = computed(() => {
  const base = Array.isArray(STATUS_FINANCEIRO)
    ? STATUS_FINANCEIRO
    : Object.values(STATUS_FINANCEIRO || {}).flat()

  return (base || []).map((s) => ({
    label: s.label,
    value: s.key,
  }))
})

// transforma "CUSTO_FIXO" => "Custo fixo"
function labelGrupo(grupoKey) {
  return String(grupoKey || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

// ✅ monta categorias já com classificacao (grupo)
const categoriasOptions = computed(() => {
  // ENTRADA (Receita)
  if (form.tipo_movimento === 'ENTRADA') {
    return (RECEITA_OPERACIONAL || []).map((i) => ({
      label: i.label,
      value: i.key,
      classificacaoKey: 'RECEITA_OPERACIONAL',
      classificacaoLabel: 'Receita operacional',
    }))
  }

  // SAIDA (Despesa/Custo) -> classificação é o grupo do FINANCEIRO_CATEGORIAS
  const out = []
  const grupos = FINANCEIRO_CATEGORIAS || {}

  Object.entries(grupos).forEach(([grupoKey, itens]) => {
    ;(itens || []).forEach((i) => {
      out.push({
        label: i.label,
        value: i.key,
        classificacaoKey: grupoKey,
        classificacaoLabel: labelGrupo(grupoKey),
      })
    })
  })

  return out
})
function onValorTotalChange(valor) {
  form.valor_total = moedaParaNumero(valor)
}

const categoriaSelecionada = computed(() => {
  return categoriasOptions.value.find((o) => o.value === form.categoria) || null
})

const classificacaoLabel = computed(() => {
  return categoriaSelecionada.value?.classificacaoLabel || null
})

watch(
  () => form.categoria,
  () => {
    form.classificacao = categoriaSelecionada.value?.classificacaoKey || null
  }
)

watch(
  () => form.tipo_movimento,
  () => {
    form.categoria = null
    form.classificacao = null
  }
)

// -----------------------------
// VALOR (máscara)
// -----------------------------
const valorTotalMask = computed({
  get() {
    return maskMoneyBR(form.valor_total || 0)
  },
  set(v) {
    const raw = String(v || '')
    const limpo = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
    const num = Number(limpo || 0)
    form.valor_total = Number.isFinite(num) ? num : 0
  },
})

// -----------------------------
// LOADERS
// -----------------------------
async function carregarFuncionarios() {
  try {
    const res = await FuncionarioService.listar?.()
    const rows = res?.data || []
    funcionariosOptions.value = rows.map((f) => ({
      label: f.nome || f.usuario || `#${f.id}`,
      value: f.id,
    }))
  } catch (err) {
    notify.error?.('Erro ao carregar funcionários')
  }
}

async function carregarDespesa() {
  if (!isEdit.value) return

  loading.value = true
  try {
    const res = await DespesaService.buscar(despesaId.value)
    const d = res?.data

    form.tipo_movimento = d?.tipo_movimento ?? 'SAIDA'
    form.funcionario_id = d?.funcionario_id ?? null

    form.categoria = d?.categoria ?? null
    form.classificacao = d?.classificacao ?? null

    form.unidade = d?.unidade ?? null
    form.local = d?.local ?? ''

    form.valor_total = Number(d?.valor_total ?? 0) || 0
    form.forma_pagamento = d?.forma_pagamento ?? null

    form.quantidade_parcelas = Number(d?.quantidade_parcelas ?? 1) || 1
    form.status = d?.status ?? null

    form.data_vencimento = (d?.data_vencimento || '').slice(0, 10)
    form.data_pagamento = (d?.data_pagamento || '').slice(0, 10)
    form.data_registro = (d?.data_registro || '').slice(0, 10)
  } catch (err) {
    notify.error?.('Erro ao carregar lançamento')
  } finally {
    loading.value = false
  }
}

// -----------------------------
// ACTIONS
// -----------------------------
function validar() {
  if (!form.tipo_movimento) return 'Selecione a movimentação.'
  if (!form.categoria) return 'Selecione a categoria.'
  if (!form.unidade) return 'Selecione a unidade.'
  if (!form.local?.trim()) return 'Informe o fornecedor/destino.'
  if (!form.valor_total || Number(form.valor_total) <= 0) return 'Informe o valor total.'
  if (!form.forma_pagamento) return 'Selecione o meio de pagamento.'
  if (!form.status) return 'Selecione a situação.'
  if (!form.data_vencimento) return 'Informe a data de vencimento.'
  if (!form.data_registro) return 'Informe a competência (mês/ref).'
  return null
}

async function salvar() {
  const erro = validar()
  if (erro) {
    notify.warn?.(erro)
    return
  }

  loading.value = true
  try {
    const payload = {
      ...form,
      quantidade_parcelas: Number(form.quantidade_parcelas || 1),
      valor_total: Number(form.valor_total || 0),
      funcionario_id: form.funcionario_id ? Number(form.funcionario_id) : null,
    }

    await DespesaService.salvar(despesaId.value, payload)
    notify.success?.(isEdit.value ? 'Lançamento atualizado.' : 'Lançamento criado.')
    router.push('/despesas')
  } catch (err) {
    notify.error?.('Erro ao salvar lançamento')
  } finally {
    loading.value = false
  }
}

async function excluir() {
  if (!isEdit.value) return

  loadingDelete.value = true
  try {
    await DespesaService.remover(despesaId.value)
    notify.success?.('Lançamento removido.')
    router.push('/despesas')
  } catch (err) {
    notify.error?.('Erro ao remover lançamento')
  } finally {
    loadingDelete.value = false
  }
}

onMounted(async () => {
  await carregarFuncionarios()
  await carregarDespesa()

  if (!form.unidade && unidadesOptions.value?.length) form.unidade = unidadesOptions.value[0].value
  if (!form.status && statusOptions.value?.length) form.status = statusOptions.value[0].value
  if (!form.forma_pagamento && formasPagamentoOptions.value?.length) form.forma_pagamento = formasPagamentoOptions.value[0].value
})
</script>
