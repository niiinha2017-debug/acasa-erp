<template>
  <div class="space-y-4">
    <!-- ══ Header reativo do projeto ══════════════════════════════════════════ -->
    <div class="sticky top-0 z-20 rounded-xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-white to-emerald-50 p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Totalizadores -->
        <div class="flex flex-wrap items-center gap-4">
          <div class="text-center min-w-[90px]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft">Total do projeto</p>
            <p class="text-xl font-black tabular-nums text-emerald-700">{{ formatCurrency(store.totalProjeto) }}</p>
          </div>
          <div class="w-px h-8 bg-border-ui hidden sm:block" />
          <div class="text-center min-w-[70px]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft">Custo fábrica</p>
            <p class="text-base font-bold tabular-nums text-slate-700">{{ formatCurrency(store.totalCustoProducao) }}</p>
          </div>
          <div class="w-px h-8 bg-border-ui hidden sm:block" />
          <div class="text-center min-w-[60px]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft">Margem</p>
            <p
              class="text-base font-bold tabular-nums"
              :class="store.margemProjeto >= 30 ? 'text-emerald-600' : store.margemProjeto >= 15 ? 'text-amber-600' : 'text-rose-600'"
            >
              {{ store.margemProjeto.toFixed(1) }}%
            </p>
          </div>
        </div>

        <!-- Contadores rápidos -->
        <div class="flex items-center gap-3 text-xs text-text-soft">
          <span class="flex items-center gap-1">
            <i class="pi pi-box text-brand-primary" />
            {{ store.totalAmbientes }} ambiente(s)
          </span>
          <span class="flex items-center gap-1">
            <i class="pi pi-list text-brand-primary" />
            {{ store.totalItens }} item(s)
          </span>
        </div>
      </div>
    </div>

    <!-- ══ Cards de ambientes ═════════════════════════════════════════════════ -->
    <div v-if="store.ambientes.length > 0" class="space-y-3">
      <AmbienteCard
        v-for="amb in store.ambientes"
        :key="amb.id"
        :ambiente="amb"
        :custo-config="custoConfig"
      />
    </div>

    <!-- Nenhum ambiente -->
    <div
      v-else
      class="rounded-xl border-2 border-dashed border-border-ui bg-bg-page py-10 text-center"
    >
      <i class="pi pi-box text-3xl text-text-soft mb-2 block" />
      <p class="text-text-soft text-sm">Nenhum ambiente carregado.</p>
      <p class="text-text-soft text-xs mt-1">Adicione ambientes manualmente ou eles serão importados com o arquivo Promob.</p>
    </div>

    <!-- ── Botão adicionar ambiente ──────────────────────────────────────────── -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-primary/50 bg-brand-primary/5 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 transition"
        @click="adicionarAmbiente"
      >
        <i class="pi pi-plus text-xs" />
        Adicionar ambiente
      </button>
      <span v-if="store.ambientes.length > 0" class="text-xs text-text-soft">
        Clique no card para expandir/recolher
      </span>
    </div>
  </div>
</template>

<script setup>
import { useProjetoStore } from '@/stores/useProjetoStore'
import AmbienteCard from './AmbienteCard.vue'

defineProps({
  /** Configuração de custo (hora_homem_value, custo_fixo_fabrica_value, acrescimo_pct) */
  custoConfig: { type: Object, default: () => ({}) },
})

const store = useProjetoStore()

function adicionarAmbiente() {
  store.adicionarAmbiente({ nome: `Ambiente ${store.totalAmbientes + 1}` })
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
</script>
