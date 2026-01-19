<template>
  <div
    :class="[
      boxed ? 'rounded-[2.5rem] border border-[var(--border-ui)] bg-[var(--bg-card)] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)]' : '',
      'w-full relative overflow-visible transition-all duration-300'
    ]"
  >
    <div class="w-full overflow-x-auto custom-scrollbar rounded-[2.5rem]">
      <table class="w-full border-collapse min-w-[800px]">
        <thead>
          <tr class="bg-slate-500/5 border-b border-[var(--border-ui)]">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 whitespace-nowrap"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-[var(--border-ui)]">
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-8 py-24 text-center">
              <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary animate-pulse">Sincronizando...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="!rows || rows.length === 0">
            <td :colspan="columns.length" class="px-8 py-24 text-center">
              <div class="flex flex-col items-center gap-3 opacity-30">
                <i class="pi pi-database text-4xl text-slate-400"></i>
                <span class="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">{{ emptyText }}</span>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="(row, index) in rows"
            :key="row.id ?? index"
            class="group transition-all duration-300 hover:bg-brand-primary/[0.03] dark:hover:bg-brand-primary/[0.05]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-8 py-5 text-[13px] font-bold text-[var(--text-main)] opacity-80 transition-all group-hover:opacity-100 group-hover:text-brand-primary"
              :style="{ textAlign: col.align || 'left' }"
            >
              <slot
                :name="'cell-' + col.key"
                :row="row"
                :value="row[col.key]"
                :index="index"
              >
                <span :class="{'opacity-20 font-normal italic': !row[col.key]}">
                  {{ row[col.key] ?? 'n/a' }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: var(--border-ui); 
  border-radius: 10px; 
}

/* Indicador lateral de linha ativa (Glow Effect) */
tr:hover td:first-child {
  box-shadow: inset 4px 0 0 0 var(--color-brand-primary);
}

/* Ajuste de arredondamento para a primeira e última célula do body para não quebrar o layout boxed */
tr:last-child td:first-child { border-bottom-left-radius: 2.5rem; }
tr:last-child td:last-child { border-bottom-right-radius: 2.5rem; }
</style>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nenhum registro encontrado.' },
  boxed: { type: Boolean, default: true }
})
</script>
