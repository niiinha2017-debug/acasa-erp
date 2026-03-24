<template>
  <div class="flex flex-col px-4 py-3 gap-4">

    <!-- ── Formas de pagamento ─────────────────────────────────── -->
    <div class="flex flex-col gap-0">
      <div class="flex items-center gap-2 py-1 border-b border-border-ui text-[10px] font-bold uppercase tracking-widest text-text-faint">
        <span class="flex-1">Forma</span>
        <span class="w-24 shrink-0 text-center">Parcelas</span>
        <span class="w-28 shrink-0 text-right">Valor (R$)</span>
        <span class="w-24 shrink-0 text-right">Taxa máquina</span>
        <span class="w-6 shrink-0" />
      </div>

      <div v-for="(row, rowIdx) in pagamentos" :key="`PAG_${rowIdx}`"
        class="flex items-center gap-2 py-1.5 border-b border-border-ui/50 last:border-b-0">
        <select v-model="row.forma_pagamento_chave"
          class="flex-1 h-7 px-2 text-[12px] rounded border border-border-ui bg-bg-card text-text-main focus:outline-none focus:border-brand-primary"
          @change="$emit('normalizar-linha', row, rowIdx)">
          <option value="">Selecione</option>
          <option v-for="opt in getOpcoesForRow(rowIdx)" :key="`FP_${rowIdx}_${opt.value}`" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <select v-model.number="row.parcelas"
          class="w-24 shrink-0 h-7 px-2 text-[12px] rounded border border-border-ui bg-bg-card text-text-main focus:outline-none focus:border-brand-primary"
          @change="$emit('normalizar-linha', row, rowIdx)">
          <option v-for="p in getParcelasForRow(row.forma_pagamento_chave)" :key="`PARC_${rowIdx}_${p}`" :value="p">
            {{ p }}x
          </option>
        </select>

        <input v-model.number="row.valor" type="number" min="0" step="0.01"
          class="w-28 shrink-0 h-7 px-2 text-right text-[12px] tabular-nums rounded border border-border-ui bg-bg-card text-text-main focus:outline-none focus:border-brand-primary"
          @change="$emit('normalizar-linha', row, rowIdx)" />

        <span class="w-24 shrink-0 text-right text-[11px] tabular-nums"
          :class="taxaCartaoPctFn(row.forma_pagamento_chave, row.parcelas) > 0 ? 'text-amber-600 font-semibold' : 'text-text-faint'">
          {{ taxaCartaoPctFn(row.forma_pagamento_chave, row.parcelas) > 0
            ? `${taxaCartaoPctFn(row.forma_pagamento_chave, row.parcelas)}%`
            : '—' }}
        </span>

        <button type="button"
          class="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded text-text-faint hover:bg-red-50 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          :disabled="pagamentos.length <= 1"
          @click="$emit('remover', rowIdx)">
          <i class="pi pi-trash text-[11px]" />
        </button>
      </div>

      <div class="flex items-center pt-2">
        <button type="button"
          class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-primary hover:opacity-70 transition-opacity"
          @click="$emit('add')">
          <i class="pi pi-plus text-[10px]" />Forma de pagamento
        </button>
        <span class="ml-auto text-[12px] text-text-soft">
          Informado: <strong class="tabular-nums text-text-main">{{ formatCurrency(totalInformado) }}</strong>
        </span>
      </div>
    </div>

    <!-- ── Nota Fiscal ─────────────────────────────────────────── -->
    <div class="flex items-center gap-3 py-2 border-t border-border-ui/60">
      <label class="inline-flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" :checked="comNotaFiscal" class="w-4 h-4 accent-brand-primary"
          @change="$emit('update:com-nota-fiscal', $event.target.checked)" />
        <span class="text-[13px] font-semibold text-text-soft">Nota Fiscal</span>
      </label>
      <span v-if="comNotaFiscal" class="ml-auto text-[12px] tabular-nums text-amber-600 font-semibold">
        + {{ formatCurrency(taxaNfReais) }}
      </span>
    </div>

    <!-- ── Comissões ───────────────────────────────────────────── -->
    <div class="flex flex-col gap-2 border-t border-border-ui/60 pt-2">
      <span class="text-[10px] font-bold uppercase tracking-widest text-text-faint">Comissões</span>
      <div v-for="(com, idx) in comissoes" :key="com.tipo"
        class="flex items-center gap-3">
        <label class="inline-flex items-center gap-2 cursor-pointer select-none w-36 shrink-0">
          <input type="checkbox" :checked="com.ativo" class="w-4 h-4 accent-brand-primary"
            @change="$emit('update:comissao-ativo', { idx, val: $event.target.checked })" />
          <span class="text-[12px] font-semibold text-text-soft">{{ com.label }}</span>
        </label>
        <input v-if="com.ativo"
          :value="com.nome"
          type="text"
          placeholder="Nome do responsável"
          class="flex-1 h-7 px-2 text-[12px] rounded border border-border-ui bg-bg-card text-text-main focus:outline-none focus:border-brand-primary"
          @input="$emit('update:comissao-nome', { idx, val: $event.target.value })" />
        <span v-if="com.ativo" class="w-24 shrink-0 text-right text-[12px] tabular-nums text-amber-600 font-semibold">
          {{ formatCurrency(precoVenda * com.percentual / 100) }}
        </span>
      </div>
    </div>

    <!-- ── Saldo ──────────────────────────────────────────────── -->
    <div class="flex justify-between items-center text-[13px] font-bold border-t border-border-ui pt-3"
      :class="Math.abs(saldo) < 0.01 ? 'text-green-600' : 'text-amber-500'">
      <span>Saldo</span>
      <span class="tabular-nums">{{ formatCurrency(saldo) }}</span>
    </div>

  </div>
</template>

<script setup>
defineProps({
  pagamentos: { type: Array, required: true },
  totalInformado: { type: Number, default: 0 },
  saldo: { type: Number, default: 0 },
  precoVenda: { type: Number, default: 0 },
  precoFinalComTaxas: { type: Number, default: 0 },
  taxaCartaoReais: { type: Number, default: 0 },
  taxaNfReais: { type: Number, default: 0 },
  totalComissoesReais: { type: Number, default: 0 },
  taxaNotaFiscal: { type: Object, default: null },
  comNotaFiscal: { type: Boolean, default: false },
  comissoes: { type: Array, default: () => [] },
  getOpcoesForRow: { type: Function, required: true },
  getParcelasForRow: { type: Function, required: true },
  taxaCartaoPctFn: { type: Function, required: true },
})

defineEmits([
  'normalizar-linha', 'remover', 'add',
  'update:com-nota-fiscal',
  'update:comissao-ativo',
  'update:comissao-nome',
])

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
</script>
