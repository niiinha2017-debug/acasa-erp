<template>
  <div class="table-wrapper">
    <table class="custom-table">
      <thead>
        <tr>
          <th 
            v-for="col in columns" 
            :key="col.key" 
            :style="{ 
              width: col.width || 'auto',
              textAlign: col.align || 'left' 
            }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td class="table-state" :colspan="columns.length">
            <div class="table-loading">
              <div class="spinner"></div>
              <span>Carregando dados...</span>
            </div>
          </td>
        </tr>

        <tr v-else-if="!rows?.length">
          <td class="table-state" :colspan="columns.length">
            <div class="table-empty">
              <span class="empty-icon">📄</span>
              <span>{{ emptyText }}</span>
            </div>
          </td>
        </tr>

        <tr v-else v-for="(row, index) in rows" :key="row.id ?? index">
          <td 
            v-for="col in columns" 
            :key="col.key"
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
})
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.custom-table thead tr {
  background-color: var(--bg-page); /* Ou um cinza bem claro #f9fafb */
  border-bottom: 2px solid var(--border-soft);
}

.custom-table th {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--text-main);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.custom-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-main);
  vertical-align: middle;
}

.custom-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.table-state {
  padding: 40px !important;
  text-align: center;
}

.table-loading, .table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-soft);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}
</style>