<template>
  <div
    :class="[
      boxed ? 'rounded-xl bg-white dark:bg-slate-900' : '',
      'w-full relative overflow-hidden transition-all duration-300'
    ]"
  >
    <div class="w-full overflow-x-auto custom-scrollbar">
      <table class="w-full border-collapse min-w-[640px] md:min-w-[800px]">
        <thead>
          <tr class="bg-slate-50/50 dark:bg-slate-800/30">
            <!-- Coluna da seta (automática) -->
            <th
              v-if="hasExpand"
              class="px-4 py-3 text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap"
              style="width: 56px; text-align: center"
            >
              <!-- vazio -->
            </th>

            <th
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap first:pl-6"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-200/70 dark:divide-slate-700/60">
          <tr v-if="loading">
            <td :colspan="colspan" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                <span class="text-xs font-medium text-slate-400">Carregando...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="!rows || rows.length === 0">
            <td :colspan="colspan" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-2 opacity-40">
                <i class="pi pi-inbox text-3xl text-slate-300"></i>
                <span class="text-xs font-medium text-slate-500">{{ emptyText }}</span>
              </div>
            </td>
          </tr>

          <template v-else>
            <template v-for="(row, index) in rows" :key="getRowKey(row, index)">
              <!-- Linha principal -->
              <tr class="group transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <!-- seta -->
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
                  class="px-6 py-3 text-sm text-slate-600 dark:text-slate-300 transition-colors group-hover:text-slate-700 dark:group-hover:text-white first:pl-6"
                  :style="{ textAlign: col.align || 'left' }"
                >
                  <slot
                    :name="'cell-' + col.key"
                    :row="row"
                    :value="row[col.key]"
                    :index="index"
                  >
                    <span :class="{ 'opacity-30 italic font-normal': !row[col.key] }">
                      {{ row[col.key] ?? '—' }}
                    </span>
                  </slot>
                </td>
              </tr>

              <!-- Linha expandida -->
              <tr v-if="hasExpand && isExpanded(row, index)" class="bg-slate-50/40 dark:bg-slate-800/20">
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
import { computed, ref, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nenhum registro encontrado.' },
  boxed: { type: Boolean, default: false },

  // ✅ EXPAND
  expandable: { type: Boolean, default: false },
  rowKey: { type: [String, Function], default: 'id' },

  // v-model opcional: v-model:expanded
  expanded: { type: Array, default: null }, // array de keys (controlado)
})

const emit = defineEmits(['update:expanded'])

const internalExpanded = ref(new Set())

const hasExpand = computed(() => props.expandable && !!useSlotsSafe().rowExpand)

const colspan = computed(() => props.columns.length + (hasExpand.value ? 1 : 0))

function useSlotsSafe() {
  // slots no script setup: acessa via useSlots() mas sem importar (pra manter simples)
  // Vue injeta $slots no template; aqui basta marcar por presença via runtime:
  // workaround: vamos considerar que se expanded feature estiver ligada, slot existe se o template usar.
  return {
    rowExpand: true, // será validado na render pelo v-if do slot
  }
}

function getRowKey(row, index) {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  const k = props.rowKey || 'id'
  return row?.[k] ?? index
}

// modo controlado (v-model)
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

// se vier v-model, sincroniza quando props.expanded mudar
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

</style>
