<template>
  <div 
    :class="[
      boxed ? 'rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm' : '',
      'w-full relative overflow-hidden transition-all duration-300'
    ]"
  >
    <div class="w-full overflow-x-auto custom-scrollbar">
      <table class="w-full border-collapse min-w-[800px]">
        <thead>
          <tr class="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-3 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Processando dados...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="!rows || rows.length === 0">
            <td :colspan="columns.length" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-2 opacity-40">
                <i class="pi pi-inbox text-3xl text-slate-300"></i>
                <span class="text-xs font-medium text-slate-500">{{ emptyText }}</span>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="(row, index) in rows"
            :key="row.id ?? index"
            class="group transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors group-hover:text-slate-900 dark:group-hover:text-white"
              :style="{ textAlign: col.align || 'left' }"
            >
              <slot
                :name="'cell-' + col.key"
                :row="row"
                :value="row[col.key]"
                :index="index"
              >
                <span :class="{'opacity-30 font-normal italic': !row[col.key]}">
                  {{ row[col.key] ?? '—' }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nenhum registro encontrado.' },
  boxed: { type: Boolean, default: true }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: #e2e8f0; 
  border-radius: 10px; 
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb { 
  background: #334155; 
}

/* Indicador lateral discreto */
tr:hover td:first-child {
  box-shadow: inset 3px 0 0 0 var(--color-brand-primary, #3b82f6);
}
</style>