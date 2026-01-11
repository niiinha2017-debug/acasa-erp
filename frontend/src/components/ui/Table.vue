<template>
  <div
    :class="boxed
      ? 'w-full overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm'
      : 'w-full overflow-x-auto'"
  >
    <table class="w-full border-collapse min-w-[600px]">
      <thead>
        <tr class="bg-gray-50/50 border-b border-gray-100">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400"
            :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-50">
        <tr v-if="loading">
          <td :colspan="columns.length" class="py-20 text-center">
            <div class="flex flex-col items-center justify-center gap-3">
              <div class="w-8 h-8 border-4 border-gray-100 border-t-brand-primary rounded-full animate-spin"></div>
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Buscando dados...</span>
            </div>
          </td>
        </tr>

        <tr v-else-if="!rows?.length">
          <td :colspan="columns.length" class="py-20 text-center">
            <div class="flex flex-col items-center justify-center gap-2 opacity-40">
              <i class="pi pi-folder-open text-4xl text-gray-300"></i>
              <span class="text-sm font-semibold text-gray-500">{{ emptyText }}</span>
            </div>
          </td>
        </tr>

        <tr
          v-else
          v-for="(row, index) in rows"
          :key="row.id ?? index"
          class="group transition-colors hover:bg-brand-primary/[0.02]"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-4 text-sm font-semibold text-gray-600 transition-colors group-hover:text-brand-primary"
            :style="{ textAlign: col.align || 'left' }"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="index">
              {{ row[col.key] ?? '-' }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nenhum registro encontrado.' },
  boxed: { type: Boolean, default: false }, // ✅ novo
})
</script>
