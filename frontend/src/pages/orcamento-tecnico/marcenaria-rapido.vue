<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <div class="border-b border-border-ui px-4 md:px-6 py-4 bg-bg-card">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 class="text-lg md:text-xl font-black text-text-main">Orcamento Tecnico de Marcenaria</h1>
            <p class="text-sm text-text-soft">Fluxo rapido para vendedor: escolhe modulo e cor, sistema calcula automaticamente.</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm font-semibold text-text-main hover:bg-slate-50"
              @click="adicionarItem"
            >
              <i class="pi pi-plus text-xs" />
              Adicionar modulo
            </button>
          </div>
        </div>
      </div>

      <div class="p-4 md:p-6 bg-bg-page">
        <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div class="space-y-4">
            <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-text-soft">1. Dados do cliente</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-text-soft mb-1">Nome</label>
                  <input v-model="cliente.nome" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" placeholder="Nome do cliente" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-text-soft mb-1">Telefone</label>
                  <input v-model="cliente.telefone" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-text-soft mb-1">Ambiente</label>
                  <input v-model="cliente.ambiente" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" placeholder="Cozinha, quarto, sala..." />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-text-soft mb-1">Data</label>
                  <input v-model="cliente.data" type="date" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
                </div>
              </div>
            </section>

            <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <h2 class="text-xs font-bold uppercase tracking-wider text-text-soft">2. Itens do orcamento</h2>
                <p class="text-xs text-text-soft">Estrutura interna fixa: MDF Branco</p>
              </div>

              <div class="overflow-auto rounded-xl border border-border-ui">
                <table class="w-full min-w-[980px] text-sm">
                  <thead class="bg-slate-50 border-b border-border-ui">
                    <tr>
                      <th class="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-500">Modulo</th>
                      <th class="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-500">Largura (cm)</th>
                      <th class="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-500">Altura (cm)</th>
                      <th class="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-500">Cor MDF</th>
                      <th class="px-3 py-2 text-right text-[11px] uppercase tracking-wide text-slate-500">Area (m2)</th>
                      <th class="px-3 py-2 text-right text-[11px] uppercase tracking-wide text-slate-500">Valor</th>
                      <th class="px-3 py-2 text-center text-[11px] uppercase tracking-wide text-slate-500">Acao</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-ui bg-white">
                    <tr v-for="(item, idx) in itensComCalculo" :key="item.id">
                      <td class="px-3 py-2">
                        <select
                          v-model="itens[idx].tipoModulo"
                          class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm"
                        >
                          <option v-for="tipo in MODULE_TYPES" :key="tipo" :value="tipo">{{ tipo }}</option>
                        </select>
                      </td>
                      <td class="px-3 py-2">
                        <input
                          v-model.number="itens[idx].larguraCm"
                          type="number"
                          min="0"
                          step="1"
                          class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td class="px-3 py-2">
                        <input
                          v-model.number="itens[idx].alturaCm"
                          type="number"
                          min="0"
                          step="1"
                          class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td class="px-3 py-2">
                        <select
                          v-model="itens[idx].corId"
                          class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm"
                        >
                          <option v-for="cor in MDF_COLORS" :key="cor.id" :value="cor.id">{{ cor.nome }}</option>
                        </select>
                      </td>
                      <td class="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">{{ item.areaTotalM2.toFixed(3) }}</td>
                      <td class="px-3 py-2 text-right tabular-nums font-black text-emerald-700">{{ currencyBRL(item.precoVenda) }}</td>
                      <td class="px-3 py-2 text-center">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50"
                          @click="removerItem(item.id)"
                          :disabled="itens.length <= 1"
                          title="Remover item"
                        >
                          <i class="pi pi-trash text-xs" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-primary/50 bg-brand-primary/5 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10"
                  @click="adicionarItem"
                >
                  <i class="pi pi-plus text-xs" />
                  Novo modulo
                </button>
                <p class="text-xs text-text-soft">Sem selecao de categoria: vendedor escolhe somente a cor.</p>
              </div>
            </section>
          </div>

          <aside class="space-y-4 xl:sticky xl:top-4 self-start">
            <section class="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-700">3. Resumo financeiro</h2>

              <div>
                <label class="block text-[11px] font-semibold text-emerald-700 mb-1">Markup</label>
                <input
                  v-model.number="markup"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div class="rounded-lg border border-emerald-200 bg-white p-3 space-y-1.5 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">Subtotal</span>
                  <strong class="tabular-nums text-text-main">{{ currencyBRL(subtotal) }}</strong>
                </div>
                <div class="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <label class="block text-[11px] font-semibold text-text-soft mb-1">Desconto</label>
                    <input
                      v-model.number="descontoValor"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm"
                    />
                  </div>
                  <select v-model="descontoTipo" class="rounded-lg border border-border-ui px-2 py-1.5 text-sm">
                    <option value="percent">%</option>
                    <option value="value">R$</option>
                  </select>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">Desconto aplicado</span>
                  <strong class="tabular-nums text-rose-600">- {{ currencyBRL(descontoAplicado) }}</strong>
                </div>
                <div class="pt-2 border-t border-emerald-100 flex items-center justify-between">
                  <span class="font-bold text-emerald-700">Total final</span>
                  <strong class="text-lg font-black tabular-nums text-emerald-700">{{ currencyBRL(totalFinal) }}</strong>
                </div>
              </div>
            </section>

            <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-text-soft">4. Condicoes de pagamento</h2>

              <div>
                <label class="block text-[11px] font-semibold text-text-soft mb-1">Entrada (%)</label>
                <input
                  v-model.number="pagamento.entradaPct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-text-soft mb-1">Parcelamento</label>
                <input
                  v-model="pagamento.parcelamento"
                  type="text"
                  class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm"
                  placeholder="Ex: 10x no cartao"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-text-soft mb-1">Prazo de producao</label>
                <input
                  v-model="pagamento.prazoProducao"
                  type="text"
                  class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm"
                  placeholder="Ex: 25 dias uteis"
                />
              </div>

              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">Valor de entrada</span>
                  <strong class="tabular-nums">{{ currencyBRL(valorEntrada) }}</strong>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">Saldo</span>
                  <strong class="tabular-nums">{{ currencyBRL(saldoRestante) }}</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  MODULE_TYPES,
  MDF_COLORS,
  DEFAULT_MARKUP,
  calcCustoItem,
  calcPrecoVenda,
  currencyBRL,
} from '@/utils/orcamentoMarcenariaCalc'

definePage({ meta: { perm: 'agendamentos.vendas' } })

function uid() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function novoItem() {
  return {
    id: uid(),
    tipoModulo: MODULE_TYPES[0],
    larguraCm: 120,
    alturaCm: 80,
    corId: 'branco',
  }
}

const cliente = reactive({
  nome: '',
  telefone: '',
  ambiente: '',
  data: new Date().toISOString().slice(0, 10),
})

const pagamento = reactive({
  entradaPct: 30,
  parcelamento: '10x sem juros',
  prazoProducao: '25 dias uteis',
})

const markup = ref(DEFAULT_MARKUP)
const descontoTipo = ref('percent')
const descontoValor = ref(0)

const itens = ref([novoItem()])

const corPorId = computed(() => {
  return Object.fromEntries(MDF_COLORS.map((c) => [c.id, c]))
})

const custoM2Branco = computed(() => corPorId.value.branco?.custo_m2 || 66.9)

const itensComCalculo = computed(() => {
  return itens.value.map((item) => {
    const cor = corPorId.value[item.corId] || corPorId.value.branco
    const custo = calcCustoItem({
      larguraCm: item.larguraCm,
      alturaCm: item.alturaCm,
      custoM2Branco: custoM2Branco.value,
      custoM2Cor: cor?.custo_m2 || 0,
    })

    const precoVenda = calcPrecoVenda(custo.custoTotal, markup.value)

    return {
      ...item,
      corNome: cor?.nome || 'Branco',
      areaTotalM2: custo.areaTotalM2,
      areaFrenteM2: custo.areaFrenteM2,
      custoTotal: custo.custoTotal,
      precoVenda,
    }
  })
})

const subtotal = computed(() => {
  return itensComCalculo.value.reduce((acc, item) => acc + Number(item.precoVenda || 0), 0)
})

const descontoAplicado = computed(() => {
  const base = Number(subtotal.value || 0)
  if (base <= 0) return 0

  if (descontoTipo.value === 'percent') {
    return Math.min(base, (base * Number(descontoValor.value || 0)) / 100)
  }

  return Math.min(base, Number(descontoValor.value || 0))
})

const totalFinal = computed(() => {
  return Math.max(0, Number(subtotal.value || 0) - Number(descontoAplicado.value || 0))
})

const valorEntrada = computed(() => {
  return (Number(totalFinal.value || 0) * Number(pagamento.entradaPct || 0)) / 100
})

const saldoRestante = computed(() => {
  return Math.max(0, Number(totalFinal.value || 0) - Number(valorEntrada.value || 0))
})

function adicionarItem() {
  itens.value = [...itens.value, novoItem()]
}

function removerItem(id) {
  if (itens.value.length <= 1) return
  itens.value = itens.value.filter((item) => item.id !== id)
}
</script>
