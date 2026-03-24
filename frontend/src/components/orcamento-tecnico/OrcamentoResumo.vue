<template>
  <div class="flex flex-col px-4 pb-6">

    <!-- Alerta Promob -->
    <div v-if="isPromob && temMateriaisPendentes"
      class="flex items-center gap-2 px-3 py-2 mt-3 rounded-lg bg-red-50 text-red-700 text-[13px] font-semibold">
      <i class="pi pi-exclamation-triangle text-[12px]" />
      {{ totalMateriaisPendentes }} material(is) não encontrado(s) — selecione o MDF para liberar.
    </div>

    <!-- KPIs em linha -->
    <div class="flex flex-wrap border-b border-border-ui">
      <div class="flex flex-col gap-0.5 py-2.5 px-4 flex-1 min-w-[100px] border-r border-border-ui last:border-r-0">
        <span class="text-[10px] font-bold uppercase tracking-widest text-text-faint">MDF + Ferragens</span>
        <span class="text-[16px] font-extrabold text-text-main tabular-nums">{{ formatCurrency(totalCustoBase) }}</span>
      </div>
      <div class="flex flex-col gap-0.5 py-2.5 px-4 flex-1 min-w-[100px] border-r border-border-ui last:border-r-0">
        <span class="text-[10px] font-bold uppercase tracking-widest text-text-faint">Custos fixos</span>
        <span class="text-[16px] font-extrabold text-text-main tabular-nums">{{ formatCurrency(totalCustosFixos) }}</span>
      </div>
      <div class="flex flex-col gap-0.5 py-2.5 px-4 flex-1 min-w-[100px] bg-brand-primary/5">
        <span class="text-[10px] font-bold uppercase tracking-widest text-text-faint">Total</span>
        <span class="text-[18px] font-extrabold text-brand-primary tabular-nums">{{ formatCurrency(precoVenda) }}</span>
      </div>
    </div>

    <!-- Tabela de ambientes -->
    <div class="border-b border-border-ui">
      <div class="flex gap-2 px-2 py-1.5 bg-bg-page text-[10px] font-bold uppercase tracking-widest text-text-faint">
        <span class="flex-1">Ambiente</span>
        <span class="w-16 text-right">m²</span>
        <span class="w-20 text-right">MDF</span>
        <span class="w-20 text-right">Ferragens</span>
        <span class="w-20 text-right">Rateio</span>
      </div>
      <div v-for="row in resumoAmbientes" :key="row.id"
        class="flex gap-2 px-2 py-1.5 border-t border-border-ui text-[12px] hover:bg-bg-page transition-colors">
        <span class="flex-1 truncate font-medium text-text-main">{{ row.nome }}</span>
        <span class="w-16 text-right tabular-nums text-text-soft">{{ Number(row.mdfM2).toFixed(2) }}</span>
        <span class="w-20 text-right tabular-nums text-text-main">{{ formatCurrency(row.custoMdf) }}</span>
        <span class="w-20 text-right tabular-nums text-text-main">{{ formatCurrency(row.custoFerragens) }}</span>
        <span class="w-20 text-right tabular-nums text-text-soft">{{ formatCurrency(row.rateio) }}</span>
      </div>
      <div v-if="!resumoAmbientes.length" class="px-2 py-3 text-[12px] text-text-faint italic">Sem ambientes.</div>
    </div>

    <!-- Finalizar -->
    <div class="flex justify-end pt-4">
      <button type="button"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed btn-primary-tw"
        :disabled="!podeFinalizarOrcamento"
        @click="$emit('finalizar')">
        <i class="pi pi-check text-[12px]" />
        {{ finalizando ? 'Finalizando...' : 'Finalizar Orçamento' }}
      </button>
    </div>

  </div>
</template>

<script setup>
defineProps({
  totalCustosFixos: { type: Number, default: 0 },
  totalCustoBase: { type: Number, default: 0 },
  precoVenda: { type: Number, default: 0 },
  resumoAmbientes: { type: Array, default: () => [] },
  podeFinalizarOrcamento: { type: Boolean, default: false },
  finalizando: { type: Boolean, default: false },
  isPromob: { type: Boolean, default: false },
  temMateriaisPendentes: { type: Boolean, default: false },
  totalMateriaisPendentes: { type: Number, default: 0 },
})

defineEmits(['finalizar'])

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
</script>
