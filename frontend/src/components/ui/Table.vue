<template>
  <div class="table-container" :class="{ 'striped': striped, 'hoverable': hoverable }">
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
        
        <tr v-if="loading">
          <td :colspan="columns.length" class="loading-cell">
            <div class="table-loading">
              <div class="loading-spinner"></div>
              <span>Carregando dados...</span>
            </div>
          </td>
        </tr>
        
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length" class="empty-cell">
            <div class="table-empty">
              <span class="empty-icon">📄</span>
              <span>{{ emptyText }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    
    <!-- Pagination slot -->
    <div v-if="$slots.footer" class="table-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  },
  striped: {
    type: Boolean,
    default: true
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  loading: Boolean,
  emptyText: {
    type: String,
    default: 'Nenhum dado encontrado'
  }
})

defineEmits(['row-click'])
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

/* Striped rows */
.table-container.striped tbody tr:nth-child(even) {
  background: #f8fafc;
}

/* Hover effect */
.table-container.hoverable tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
  cursor: pointer;
}

/* Alignment classes */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Loading state */
.loading-cell {
  padding: 48px !important;
}

.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-radius: 50%;
  border-top-color: #667eea;
  animation: spin 1s linear infinite;
}

/* Empty state */
.empty-cell {
  padding: 48px !important;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 32px;
}

/* Footer */
.table-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>