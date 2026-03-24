<template>
  <div
    :class="[
      'ds-table',
      boxed ? 'ds-table-shell' : '',
      !boxed && flush ? 'ds-table--flush' : '',
    ]"
  >
    <div class="ds-table__scroll">
      <table class="ds-table__element">
        <thead class="ds-table__head">
          <tr class="ds-table-head-row ds-table__head-row">
            <th
              v-if="hasExpand"
              class="ds-table__head-cell ds-table__expand-head"
            ></th>

            <th
              v-for="col in columns"
              :key="col.key"
              class="ds-table__head-cell ds-table__head-cell--first"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="ds-table__body">
          <tr v-if="loading">
            <td :colspan="colspan" class="ds-table__state-cell">
              <div class="ds-table__state">
                <div class="ds-table__loader"></div>
                <span class="ds-table__state-text">Carregando...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="!rows || rows.length === 0">
            <td :colspan="colspan" class="ds-table__state-cell">
              <div class="ds-table__state ds-table__state--empty">
                <i class="pi pi-inbox ds-table__empty-icon"></i>
                <span class="ds-table__state-text">{{ emptyText }}</span>
              </div>
            </td>
          </tr>

          <template v-else>
            <template v-for="(row, index) in rows" :key="getRowKey(row, index)">
              <tr
                :class="[
                  'group ds-table-row ds-table__row',
                  typeof rowClass === 'function' ? rowClass(row, index) : (rowClass || '')
                ]"
              >
                <td
                  v-if="hasExpand"
                  class="ds-table__expand-cell"
                >
                  <button
                    type="button"
                    class="ds-table__expand-toggle"
                    @click="toggle(row, index)"
                    :aria-expanded="isExpanded(row, index)"
                  >
                    <i
                      class="pi pi-chevron-right ds-table__expand-icon"
                      :class="{ 'is-expanded': isExpanded(row, index) }"
                    ></i>
                  </button>
                </td>

                <td
                  v-for="col in columns"
                  :key="col.key"
                  class="ds-table__cell ds-table__cell--first"
                  :style="{ textAlign: col.align || 'left', verticalAlign: 'top' }"
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

              <tr v-if="hasExpand && isExpanded(row, index)" class="ds-table__expanded-row">
                <td :colspan="colspan" class="ds-table__expanded-cell">
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
  flush: { type: Boolean, default: false },
  expandable: { type: Boolean, default: false },
  rowKey: { type: [String, Function], default: 'id' },
  expanded: { type: Array, default: null },
  rowClass: { type: [Function, String], default: null },
})

const emit = defineEmits(['update:expanded'])
const slots = useSlots()
const internalExpanded = ref(new Set())
const rowClass = computed(() => props.rowClass)

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
