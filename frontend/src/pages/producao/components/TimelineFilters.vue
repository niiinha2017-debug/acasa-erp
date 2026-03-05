<template>
  <div
    class="rounded-[2rem] border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 shadow-sm dark:shadow-none p-4 md:p-5 mb-6"
  >
    <div class="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-4">
      <div class="flex items-center gap-2 shrink-0">
        <i class="pi pi-stopwatch text-slate-400" aria-hidden />
        <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {{ visao === 'vendas' ? 'Vendas' : 'Produção' }}
        </span>
      </div>

      <div
        class="inline-flex p-1 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-100/90 dark:bg-slate-800/60 shrink-0"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          :class="
            visao === 'vendas'
              ? 'bg-slate-100 dark:bg-slate-700 text-blue-900 dark:text-blue-300 border border-slate-300 dark:border-slate-600 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          "
          @click="$emit('update:visao', 'vendas')"
        >
          Vendas ({{ totalVendas }})
        </button>
        <button
          type="button"
          role="tab"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          :class="
            visao === 'producao'
              ? 'bg-slate-100 dark:bg-slate-700 text-blue-900 dark:text-blue-300 border border-slate-300 dark:border-slate-600 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          "
          @click="$emit('update:visao', 'producao')"
        >
          Produção ({{ totalProducao }})
        </button>
      </div>

      <div class="flex items-center gap-2 shrink-0" title="Data de">
        <i class="pi pi-calendar text-xs text-slate-400" aria-hidden />
        <input
          :value="dataInicio"
          type="date"
          class="input-timeline h-10 w-[130px] rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 pl-2 pr-2 text-sm font-medium text-slate-800 dark:text-slate-200"
          @input="$emit('update:dataInicio', $event.target.value)"
          @change="$emit('change-dates')"
        />
      </div>
      <div class="flex items-center gap-2 shrink-0" title="Data até">
        <i class="pi pi-calendar text-xs text-slate-400" aria-hidden />
        <input
          :value="dataFim"
          type="date"
          class="input-timeline h-10 w-[130px] rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 pl-2 pr-2 text-sm font-medium text-slate-800 dark:text-slate-200"
          @input="$emit('update:dataFim', $event.target.value)"
          @change="$emit('change-dates')"
        />
      </div>

      <div class="min-w-0 flex-1 md:max-w-[200px]">
        <input
          :value="buscaCliente"
          type="text"
          placeholder="Buscar cliente"
          class="input-timeline h-10 w-full px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          @input="$emit('update:buscaCliente', $event.target.value)"
        />
      </div>

      <RouterLink
        v-if="linkVerNaAgenda"
        :to="linkVerNaAgenda"
        class="shrink-0 inline-flex items-center justify-center h-10 px-4 text-[11px] font-bold tracking-widest uppercase rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-900 dark:hover:border-blue-400 hover:text-blue-900 dark:hover:text-blue-400 transition-all"
      >
        Ver na agenda
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'TimelineFilters' })

defineProps({
  visao: { type: String, default: 'vendas' },
  totalVendas: { type: Number, default: 0 },
  totalProducao: { type: Number, default: 0 },
  dataInicio: { type: String, default: '' },
  dataFim: { type: String, default: '' },
  buscaCliente: { type: String, default: '' },
  linkVerNaAgenda: { type: String, default: '' },
})

defineEmits([
  'update:visao',
  'update:dataInicio',
  'update:dataFim',
  'update:buscaCliente',
  'change-dates',
])
</script>
