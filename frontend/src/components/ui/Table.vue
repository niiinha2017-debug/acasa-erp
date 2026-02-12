<template>
  <div
    :class="[
      boxed ? 'rounded-2xl border border-border-ui bg-bg-card' : '',
      'w-full relative overflow-hidden transition-all duration-300'
    ]"
  >
    <div class="w-full overflow-x-auto custom-scrollbar">
      <table class="w-full border-collapse min-w-[640px] md:min-w-[800px]">
        <thead>
          <tr class="bg-slate-50/70 dark:bg-slate-800/40 border-b border-border-ui">
            <th
              v-if="hasExpand"
              class="px-4 py-3 text-[11px] font-semibold text-text-soft whitespace-nowrap uppercase tracking-wide"
              style="width: 56px; text-align: center"
            ></th>

            <th
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-3 text-[11px] font-semibold text-text-soft whitespace-nowrap first:pl-6 uppercase tracking-wide"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-border-ui/70">
          <tr v-if="loading">
            <td :colspan="colspan" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                <span class="text-xs font-medium text-text-soft">Carregando...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="!rows || rows.length === 0">
            <td :colspan="colspan" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-2 opacity-40">
                <i class="pi pi-inbox text-3xl text-slate-300"></i>
                <span class="text-xs font-medium text-text-soft">{{ emptyText }}</span>
              </div>
            </td>
          </tr>

          <template v-else>
            <template v-for="(row, index) in rows" :key="getRowKey(row, index)">
              <tr class="group transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/45">
                <td
                  v-if="hasExpand"
                  class="px-4 py-3"
                  style="text-align:center"
                >
                  <button
                    type="button"
                    class="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition"
                    @click="toggle(row, index)"
                    :aria-expanded="isExpanded(row, index)"
                  >
                    <i
                      class="pi pi-chevron-right text-[10px] transition-transform duration-200"
                      :class="isExpanded(row, index) ? 'rotate-90' : ''"
                    ></i>
                  </button>
                </td>

                <td
                  v-for="col in columns"
                  :key="col.key"
                  class="px-6 py-3 text-sm text-text-main transition-colors first:pl-6"
                  :style="{ textAlign: col.align || 'left' }"
                >
                  <slot
                    :name="'cell-' + col.key"
                    :row="row"
                    :value="row[col.key]"
                    :index="index"
                  >
                    <span :class="{ 'opacity-30 italic font-normal': !row[col.key] }">
                      {{ row[col.key] ?? '-' }}
                    </span>
                  </slot>
                </td>
              </tr>

              <tr v-if="hasExpand && isExpanded(row, index)" class="bg-slate-50/50 dark:bg-slate-800/30">
                <td :colspan="colspan" class="px-6 py-5">
                  <slot name="row-expand" :row="row" :index="index" />
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, useSlots } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nenhum registro encontrado.' },
  boxed: { type: Boolean, default: true },
  expandable: { type: Boolean, default: false },
  rowKey: { type: [String, Function], default: 'id' },
  expanded: { type: Array, default: null },
})

const emit = defineEmits(['update:expanded'])
const slots = useSlots()
const internalExpanded = ref(new Set())

const hasExpand = computed(() => props.expandable && !!slots['row-expand'])
const colspan = computed(() => props.columns.length + (hasExpand.value ? 1 : 0))

function getRowKey(row, index) {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  const k = props.rowKey || 'id'
  return row?.[k] ?? index
}

function getSet() {
  if (Array.isArray(props.expanded)) return new Set(props.expanded.map(String))
  return internalExpanded.value
}

function setSet(next) {
  if (Array.isArray(props.expanded)) {
    emit('update:expanded', Array.from(next))
  } else {
    internalExpanded.value = next
  }
}

function isExpanded(row, index) {
  const key = String(getRowKey(row, index))
  return getSet().has(key)
}

function toggle(row, index) {
  const key = String(getRowKey(row, index))
  const s = new Set(getSet())
  if (s.has(key)) s.delete(key)
  else s.add(key)
  setSet(s)
}

watch(
  () => props.expanded,
  (val) => {
    if (Array.isArray(val)) {
      internalExpanded.value = new Set(val.map(String))
    }
  },
)
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

tr:hover td:first-child {
  box-shadow: inset 3px 0 0 0 var(--color-brand-primary, #3b82f6);
}
</style>
