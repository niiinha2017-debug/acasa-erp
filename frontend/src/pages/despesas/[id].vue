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

        <form v-else class="space-y-6" @submit.prevent="salvar">
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
                placeholder="Ex: Aluguel, Salário, Venda"
                :forceUpper="false"
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
            <Button
              v-if="isEdit"
              type="button"
              variant="danger"
              label="Excluir"
              :disabled="loading"
              @click="excluir"
            />

            <Button
              class="min-w-[140px]"
              type="submit"
              variant="primary"
              :loading="loading"
              :label="isEdit ? 'Salvar' : 'Criar'"
            />
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>


<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FuncionarioService, DespesaService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import * as CONST from '@/constantes/index'

const route = useRoute()
const router = useRouter()

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
  status: 'EM_ABERTO', // ✅ alinhado com STATUS_FINANCEIRO
  data_vencimento: today(),
  data_pagamento: '',
  data_registro: today(),
})

const despesaId = computed(() => Number(route.params?.id) || null)
const isEdit = computed(() => !!despesaId.value)

const mapToOptions = (data) => {
  if (Array.isArray(data)) return data.map(i => ({ label: i.label, value: i.key }))
  if (data && typeof data === 'object') {
    const flat = Object.values(data).flat()
    return flat.map(i => ({ label: i.label, value: i.key }))
  }
  return []
}

const unidadesOptions = computed(() => mapToOptions(CONST.UNIDADES_OPERACIONAIS))
const formasPagamentoOptions = computed(() => mapToOptions(CONST.FORMAS_PAGAMENTO))
const statusOptions = computed(() => mapToOptions(CONST.STATUS_FINANCEIRO))

const categoriasOptions = computed(() => {
  // RECEITA
  if (form.tipo_movimento === 'ENTRADA') {
    return (CONST.RECEITA_OPERACIONAL || []).map(i => ({
      label: i.label,
      value: i.key,
      classificacaoKey: 'RECEITA_OPERACIONAL',
    }))
  }

  // DESPESA: depende da UNIDADE (FABRICA/LOJA)
  if (!form.unidade) return []

  const porUnidade = CONST.FINANCEIRO_CATEGORIAS?.[form.unidade]
  if (!porUnidade) return []

  const result = []

  Object.entries(porUnidade).forEach(([grupo, itens]) => {
    ;(itens || []).forEach(i => {
      result.push({
        label: i.label,          // só a categoria
        value: i.key,
        classificacaoKey: grupo, // CUSTO_FIXO / CUSTO_VARIAVEL / ...
      })
    })
  })

  return result
})

const classificacaoLabel = computed(() => {
  if (!form.classificacao) return ''
  return String(form.classificacao).replace(/_/g, ' ')
})


const categoriaSelecionada = computed(() =>
  categoriasOptions.value.find(o => o.value === form.categoria)
)

watch(() => form.categoria, () => {
  form.classificacao = categoriaSelecionada.value?.classificacaoKey ?? null
})

watch(() => form.tipo_movimento, () => {
  form.categoria = null
  form.classificacao = null
})

watch(() => form.status, (novo) => {
  if (novo !== 'PAGO') form.data_pagamento = ''
})

watch(() => form.unidade, () => {
  form.categoria = null
  form.classificacao = null
})


async function init() {
  loading.value = true
  try {
    const res = await FuncionarioService.listar()
    funcionariosOptions.value = (res?.data || []).map(f => ({
      label: f.nome || f.usuario,
      value: f.id,
    }))

    if (isEdit.value) {
      const { data: despesa } = await DespesaService.buscar(despesaId.value)

      Object.assign(form, {
        ...despesa,
        valor_total: Number(despesa.valor_total) || 0,
        quantidade_parcelas: Number(despesa.quantidade_parcelas) || 1,
        data_vencimento: despesa.data_vencimento ? String(despesa.data_vencimento).slice(0, 10) : '',
        data_pagamento: despesa.data_pagamento ? String(despesa.data_pagamento).slice(0, 10) : '',
        data_registro: despesa.data_registro ? String(despesa.data_registro).slice(0, 10) : form.data_registro,
      })
    }
  } catch (error) {
    notify.error('Erro ao carregar')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function salvar() {
  if (!form.categoria) return notify.warn('Selecione a categoria')
  if (!Number(form.valor_total) || Number(form.valor_total) <= 0) return notify.warn('Valor deve ser maior que zero')

  loading.value = true
  try {
    const dados = {
      ...form,
      valor_total: Number(form.valor_total),
      quantidade_parcelas: Number(form.quantidade_parcelas) || 1,
    }

    await DespesaService.salvar(despesaId.value, dados)

    notify.success(isEdit.value ? 'Salvo!' : 'Criado!')
    router.push('/despesas')
  } catch (error) {
    notify.error('Erro ao salvar')
    console.error(error)
  } finally {
    loading.value = false
  }
}


async function excluir() {
  const confirmado = await confirm.show('Excluir?', 'Não pode desfazer')
  if (!confirmado) return

  try {
    await DespesaService.remover(despesaId.value)
    notify.success('Excluído!')
    router.push('/despesas')
  } catch (error) {
    notify.error('Erro ao excluir')
    console.error(error)
  }
}

onMounted(init)
</script>
