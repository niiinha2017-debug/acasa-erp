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

<style scoped>
/* =====================================================
   CONTAINER
===================================================== */
.table-container {
  background: var(--bg-card);
  border-radius: var(--card-radius);
  border: 1px solid var(--border-soft);
  overflow: hidden;
}

/* =====================================================
   TABLE
===================================================== */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-md);
}

.table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  background: var(--bg-input);
  border-bottom: 1px solid var(--border-soft);
  white-space: nowrap;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-main);
}

/* =====================================================
   STRIPED / HOVER
===================================================== */
.is-striped tbody tr:nth-child(even) {
  background: var(--gray-50);
}

.is-hoverable tbody tr:hover {
  background: var(--bg-hover);
  cursor: pointer;
}

/* =====================================================
   STATES
===================================================== */
.table-state {
  padding: 48px !important;
}

.table-loading,
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 28px;
}

/* =====================================================
   SPINNER
===================================================== */
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border-soft);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* =====================================================
   FOOTER
===================================================== */
.table-footer {
  padding: 12px 16px;
  background: var(--bg-input);
  border-top: 1px solid var(--border-soft);
}

/* =====================================================
   ALIGNMENT HELPERS
===================================================== */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
