<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border-ui w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" @click.stop>
      
        <header class="flex justify-between items-center p-6 border-b bg-slate-50 shrink-0">
          <div>
            <h2 class="text-xl font-black text-slate-800 uppercase italic">Fechamento Mensal — Baixa de Pagamento</h2>
            <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">
              {{ fornecedorNome }} | REF: {{ form.mes }}/{{ form.ano }}
            </p>
            <p v-if="periodoLegenda" class="text-[10px] text-slate-400 mt-1">
              Relatório mensal (1º ao último dia do mês): {{ periodoLegenda }}
            </p>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-rose-500 transition-colors">
            <i class="pi pi-times text-xl"></i>
          </button>
        </header>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <!-- Histórico: Compras + Planos de Corte -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-2">
              <h3 class="text-sm font-black text-rose-600 uppercase flex items-center gap-2">
                <i class="pi pi-shopping-cart"></i> Histórico de Compras (por data de compra)
              </h3>
              <p class="text-[10px] text-slate-500">Relatório mensal — 1º ao último dia do mês</p>
              <div class="bg-rose-50/50 border border-rose-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table class="w-full text-xs">
                  <thead class="bg-rose-100 sticky top-0">
                    <tr>
                      <th class="text-left py-2 px-3 font-black">Data</th>
                      <th class="text-left py-2 px-3 font-black">Tipo</th>
                      <th class="text-right py-2 px-3 font-black">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in (preview.historico_compras || [])" :key="c.id" class="border-t border-rose-100">
                      <td class="py-1.5 px-3">{{ fmtData(c.data_compra) }}</td>
                      <td class="py-1.5 px-3">{{ c.tipo_compra || '—' }}</td>
                      <td class="py-1.5 px-3 text-right font-bold">{{ fmtMoeda(c.valor_total) }}</td>
                    </tr>
                    <tr v-if="!(preview.historico_compras || []).length" class="border-t border-rose-100">
                      <td colspan="3" class="py-3 px-3 text-slate-500 text-center">Nenhuma compra no período</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs font-black text-rose-700">Total compras: {{ fmtMoeda(preview.total_compras || 0) }}</p>
            </div>

            <div class="space-y-2">
              <h3 class="text-sm font-black text-emerald-600 uppercase flex items-center gap-2">
                <i class="pi pi-list"></i> Histórico Vendas Plano de Corte (por data de venda)
              </h3>
              <p class="text-[10px] text-slate-500">Relatório mensal — 1º ao último dia do mês</p>
              <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table class="w-full text-xs">
                  <thead class="bg-emerald-100 sticky top-0">
                    <tr>
                      <th class="text-left py-2 px-3 font-black">Data</th>
                      <th class="text-right py-2 px-3 font-black">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in (preview.historico_planos || [])" :key="p.id" class="border-t border-emerald-100">
                      <td class="py-1.5 px-3">{{ fmtData(p.data_venda) }}</td>
                      <td class="py-1.5 px-3 text-right font-bold">{{ fmtMoeda(p.valor_total) }}</td>
                    </tr>
                    <tr v-if="!(preview.historico_planos || []).length" class="border-t border-emerald-100">
                      <td colspan="2" class="py-3 px-3 text-slate-500 text-center">Nenhum plano no período</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs font-black text-emerald-700">Total planos (crédito/abatimento): {{ fmtMoeda(preview.total_planos || 0) }}</p>
            </div>
          </div>

          <!-- Débitos e Créditos manuais -->
          <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 lg:col-span-6 space-y-4">
              <h3 class="text-sm font-black text-rose-600 uppercase flex items-center gap-2">
                <i class="pi pi-arrow-circle-up"></i> Débitos (Saídas)
              </h3>
              <div class="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600 font-bold uppercase">Compras do período:</span>
                  <span class="font-black text-slate-800 italic">R$ {{ (preview.total_compras || 0).toLocaleString('pt-BR') }}</span>
                </div>
                <hr class="border-rose-200/50">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-rose-500 uppercase italic">Ajuste Débito (R$) — valor que soma ao que você deve</label>
                  <input 
                    v-model.number="form.valor_dever" 
                    type="number" 
                    step="0.01"
                    class="w-full bg-white border-2 border-rose-200 rounded-lg p-2 font-black text-lg focus:border-rose-500 outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6 space-y-4">
              <h3 class="text-sm font-black text-emerald-600 uppercase flex items-center gap-2">
                <i class="pi pi-arrow-circle-down"></i> Créditos (Abatimentos) — desconto do fornecedor
              </h3>
              <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600 font-bold uppercase">Planos de Corte (crédito):</span>
                  <span class="font-black text-slate-800 italic">R$ {{ (preview.total_planos || 0).toLocaleString('pt-BR') }}</span>
                </div>
                <hr class="border-emerald-200/50">
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-black text-emerald-500 uppercase italic">Crédito Manual (R$)</label>
                    <input 
                      v-model.number="form.valor_creditar" 
                      type="number" 
                      step="0.01"
                      class="w-full bg-white border-2 border-emerald-200 rounded-lg p-2 font-black text-lg focus:border-emerald-500 outline-none transition-all"
                      placeholder="0,00"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-black text-emerald-500 uppercase italic">Liberar %</label>
                    <input 
                      v-model.number="form.percentual_liberado" 
                      type="number" 
                      min="0"
                      max="100"
                      class="w-full bg-white border-2 border-emerald-200 rounded-lg p-2 font-black text-lg focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fornecedor cobrador (ex: paga na Rimad, abate na Cityfer) -->
          <div v-if="fornecedorCobradorOptions.length" class="border-t pt-4">
            <label class="text-[10px] font-black text-slate-500 uppercase block mb-2">Fornecedor cobrador (opcional) — ex: pagar na Rimad e abater neste fornecedor</label>
            <select 
              v-model="form.fornecedor_cobrador_id" 
              class="w-full max-w-xs h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">Nenhum (pagamento direto ao fornecedor)</option>
              <option v-for="f in fornecedorCobradorOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <!-- Forma de pagamento (mesma tabela da despesa geral) -->
          <div class="border-t pt-6">
            <h3 class="text-sm font-black text-slate-700 uppercase mb-3">Forma de pagamento</h3>
            <select 
              v-model="form.forma_pagamento_chave" 
              class="w-full max-w-xs h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option v-for="fp in formasPagamentoOptions" :key="fp.value" :value="fp.value">{{ fp.label }}</option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">Use a mesma forma que em Despesas Gerais (cheque, cartão 6x, PIX, etc.)</p>
          </div>

          <!-- Parcelas (cheque / cartão em 6x) -->
          <div v-if="precisaParcelas" class="border-t pt-6">
            <h3 class="text-sm font-black text-slate-700 uppercase mb-3">Parcelas (cheque ou cartão)</h3>
            <div class="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div v-for="(p, idx) in form.parcelas" :key="idx" class="flex gap-2 mb-2 items-center">
                <span class="w-10 text-center text-xs font-black text-slate-500">{{ p.parcela }}ª</span>
                <input v-model="p.vencimento_em" type="date" class="flex-1 rounded-lg border border-slate-200 p-2 text-xs font-bold">
                <input v-model.number="p.valor" type="number" step="0.01" class="w-28 rounded-lg border border-slate-200 p-2 text-xs font-black text-right" placeholder="0,00">
              </div>
              <button type="button" @click="adicionarParcela" class="text-[10px] font-black text-indigo-600 uppercase p-2 hover:underline">
                + Adicionar parcela
              </button>
            </div>
          </div>
        </div>

        <footer class="p-6 bg-slate-900 flex flex-wrap justify-between items-center gap-4 rounded-b-xl shadow-2xl shrink-0">
          <div class="flex flex-wrap gap-6">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Abatimento consolidado</span>
              <span class="text-xl font-black text-emerald-400">R$ {{ totalCompensado.toLocaleString('pt-BR') }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Saldo final a pagar</span>
              <span class="text-2xl font-black text-white">R$ {{ totalFinal.toLocaleString('pt-BR') }}</span>
            </div>
            <div v-if="creditoProximoMes > 0" class="flex flex-col">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Crédito para o próximo mês</span>
              <span class="text-xl font-black text-amber-400">R$ {{ creditoProximoMes.toLocaleString('pt-BR') }}</span>
            </div>
          </div>
          <button 
            type="button"
            @click="confirmarFechamento"
            class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
          >
            Confirmar Fechamento
          </button>
        </footer>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { FORMAS_PAGAMENTO } from '@/constantes'

const props = defineProps({
  open: Boolean,
  preview: { type: Object, default: () => ({}) },
  fornecedorNome: { type: String, default: '' },
  fornecedorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const form = reactive({
  fornecedor_id: null,
  mes: null,
  ano: null,
  valor_dever: 0,
  valor_creditar: 0,
  percentual_liberado: 100,
  desconto_percentual: 0,
  forma_pagamento_chave: 'CHEQUE',
  fornecedor_cobrador_id: '',
  parcelas: [{ parcela: 1, valor: 0, vencimento_em: '' }],
})

watch(() => props.preview, (p) => {
  if (!p) return
  form.fornecedor_id = p.fornecedor_id
  form.mes = p.mes
  form.ano = p.ano
  form.valor_dever = 0
  form.valor_creditar = 0
  form.percentual_liberado = 100
  form.desconto_percentual = 0
  const saldo = Number(p.saldo_a_pagar_auto ?? p.total_compras - p.total_planos ?? 0)
  if (saldo > 0) {
    form.parcelas = [{ parcela: 1, valor: saldo, vencimento_em: '' }]
  } else {
    form.parcelas = [{ parcela: 1, valor: 0, vencimento_em: '' }]
  }
}, { immediate: true, deep: true })

const formasPagamentoOptions = (FORMAS_PAGAMENTO || []).map((x) => ({ label: x.label, value: x.key }))

const fornecedorCobradorOptions = computed(() => {
  const list = props.fornecedorOptions || []
  const currentId = props.preview?.fornecedor_id
  if (!currentId) return list
  return list.filter((f) => Number(f.value) !== Number(currentId))
})

const periodoLegenda = computed(() => {
  const ini = props.preview?.periodo_inicio
  const fim = props.preview?.periodo_fim
  if (!ini || !fim) return ''
  const d1 = new Date(ini + 'T12:00:00')
  const d2 = new Date(fim + 'T12:00:00')
  return `${d1.toLocaleDateString('pt-BR')} a ${d2.toLocaleDateString('pt-BR')}`
})

const precisaParcelas = computed(() => {
  const f = (form.forma_pagamento_chave || '').toUpperCase()
  return f === 'CHEQUE' || f === 'CREDITO' || f === 'CARTAO'
})

const fmtData = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('pt-BR')
}
const fmtMoeda = (v) => (Number(v) ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const totalCompensado = computed(() => {
  const debitoBase = Number(props.preview?.total_compras ?? 0) + Number(form.valor_dever || 0)
  const creditoExtra = (Number(form.valor_creditar || 0) * Number(form.percentual_liberado || 100)) / 100
  const creditoTotal = Number(props.preview?.total_planos ?? 0) + creditoExtra
  return Math.min(debitoBase, creditoTotal)
})

const totalFinal = computed(() => {
  const debitoBase = Number(props.preview?.total_compras ?? 0) + Number(form.valor_dever || 0)
  const creditoExtra = (Number(form.valor_creditar || 0) * Number(form.percentual_liberado || 100)) / 100
  const creditoTotal = Number(props.preview?.total_planos ?? 0) + creditoExtra
  const subtotal = Math.max(debitoBase - creditoTotal, 0)
  const desconto = (subtotal * Number(form.desconto_percentual || 0)) / 100
  return Math.max(subtotal - desconto, 0)
})

// Crédito que sobra após abater os débitos (435 - 350 = 85 para o próximo mês)
const creditoProximoMes = computed(() => {
  const debitoBase = Number(props.preview?.total_compras ?? 0) + Number(form.valor_dever || 0)
  const creditoExtra = (Number(form.valor_creditar || 0) * Number(form.percentual_liberado || 100)) / 100
  const creditoTotal = Number(props.preview?.total_planos ?? 0) + creditoExtra
  const usado = totalCompensado.value
  return Math.max(creditoTotal - usado, 0)
})

function adicionarParcela() {
  form.parcelas.push({
    parcela: form.parcelas.length + 1,
    valor: 0,
    vencimento_em: '',
  })
}

function confirmarFechamento() {
  const forma = (form.forma_pagamento_chave || 'CHEQUE').toUpperCase()
  const precisaParcelas = forma === 'CHEQUE' || forma === 'CREDITO' || forma === 'CARTAO'
  const total = totalFinal.value
  const vencPadrao = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })()
  let parcelas = [...form.parcelas]
  if (!parcelas.length || !precisaParcelas) {
    parcelas = [{ parcela: 1, valor: total, vencimento_em: vencPadrao }]
  } else {
    parcelas = parcelas.map((p) => ({
      ...p,
      vencimento_em: p.vencimento_em || vencPadrao,
    }))
  }
  const payload = {
    ...form,
    fornecedor_cobrador_id: form.fornecedor_cobrador_id || undefined,
    forma_pagamento_chave: forma === 'CREDITO' ? 'CARTAO' : forma,
    parcelas,
  }
  emit('confirm', payload)
}
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
</style>
