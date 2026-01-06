<template>
  <div
    class="table-container"
    :class="{ 'is-striped': striped, 'is-hoverable': hoverable }"
  >
    <table class="table">
      <thead>
        <tr>
          <th
            v-for="(column, index) in columns"
            :key="index"
            :class="[column.align, column.class]"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
          @click="$emit('row-click', row)"
        >
          <td
            v-for="(column, colIndex) in columns"
            :key="colIndex"
            :class="[column.align, column.class]"
          >
            <slot
              :name="`cell-${column.field}`"
              :value="row[column.field]"
              :row="row"
              :column="column"
            >
              {{ row[column.field] }}
            </slot>
          </td>
        </tr>

        <!-- Loading -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="table-state">
            <div class="table-loading">
              <span class="spinner"></span>
              <span>Carregando dados…</span>
            </div>
          </td>
        </tr>

        <!-- Empty -->
        <tr v-else-if="!data.length">
          <td :colspan="columns.length" class="table-state">
            <div class="table-empty">
              <span class="empty-icon">📄</span>
              <span>{{ emptyText }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="$slots.footer" class="table-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  striped: { type: Boolean, default: true },
  hoverable: { type: Boolean, default: true },
  loading: Boolean,
  emptyText: {
    type: String,
    default: 'Nenhum dado encontrado'
  }
})

defineEmits(['row-click'])
</script>
