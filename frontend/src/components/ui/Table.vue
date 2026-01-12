<template>
  <div
    :class="[
      boxed ? 'rounded-2xl border border-gray-100 bg-white shadow-sm' : '',
      'w-full relative' 
    ]"
    style="overflow: visible;" 
  >
    <div class="w-full overflow-x-auto custom-scrollbar">
      <table class="w-full border-collapse min-w-[800px]">
        <thead>
          <tr class="bg-gray-50/50 border-b border-gray-100">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 whitespace-nowrap"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

<tbody class="divide-y divide-gray-50">
  <tr v-if="loading">
    <td :colspan="columns.length">...</td>
  </tr>

  <tr v-else-if="!rows || rows.length === 0">
    <td :colspan="columns.length">...</td>
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
      class="px-6 py-4 text-sm font-semibold text-gray-600"
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
