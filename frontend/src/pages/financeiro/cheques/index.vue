<!-- src/pages/financeiro/cheques/index.vue -->
<template>
  <Card :shadow="true">
    <PageHeader
      title="Cheques"
      subtitle="Controle de cheques: status, banco e vencimento."
      icon="pi pi-credit-card"
      :backTo="null"
    />

    <div class="p-6 relative space-y-6">
      <Loading v-if="loading" />

      <template v-else>
        <!-- FILTROS -->
        <div class="grid grid-cols-12 gap-4">
          <SearchInput
            class="col-span-12 md:col-span-7"
            v-model="filtroTexto"
            mode="search"
            label="Buscar"
            placeholder="Buscar por número, banco, emitente..."
          />

          <SearchInput
            class="col-span-12 md:col-span-5"
            v-model="filtroStatus"
            mode="select"
            label="Status"
            placeholder="Selecione..."
            :options="STATUS_OPTIONS"
          />
        </div>

        <!-- RESUMO -->
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">Total</div>
            <div class="text-lg font-black text-gray-900">{{ format.currency(totais.total) }}</div>
            <div class="text-xs font-bold text-gray-500">{{ contagens.total }} cheques</div>
          </div>

          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-green-500">Compensados</div>
            <div class="text-lg font-black text-green-700">{{ format.currency(totais.compensado) }}</div>
            <div class="text-xs font-bold text-green-600">{{ contagens.compensado }} cheques</div>
          </div>

          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-amber-500">Em aberto</div>
            <div class="text-lg font-black text-amber-700">{{ format.currency(totais.aberto) }}</div>
            <div class="text-xs font-bold text-amber-600">{{ contagens.aberto }} cheques</div>
          </div>
        </div>

        <!-- TABELA -->
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="false"
          emptyText="Nenhum cheque encontrado."
          :boxed="true"
        >
          <template #cell-numero="{ row }">
            <div class="font-black text-gray-900">{{ row.numero }}</div>
            <div class="text-xs font-bold text-gray-400">{{ row.banco }}</div>
          </template>

          <template #cell-emitente="{ row }">
            <div class="font-black text-gray-900">
              {{ row.emitente_nome || '—' }}
            </div>
            <div class="text-xs font-bold text-gray-400">
              <template v-if="row.conta_pagar_id">Conta Pagar: #{{ row.conta_pagar_id }}</template>
              <template v-else>Sem vínculo</template>
            </div>
          </template>

          <template #cell-vencimento="{ row }">
            <div class="text-xs font-black text-gray-900">{{ format.date(row.data_vencimento) }}</div>
          </template>

          <template #cell-valor="{ row }">
            <div class="font-black text-gray-900 text-right">
              {{ format.currency(Number(row.valor || 0)) }}
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                :disabled="acaoLoadingId === row.id"
                @click="abrirStatus(row)"
              >
                Status
              </Button>

              <Button
                variant="success"
                size="sm"
                type="button"
                :disabled="acaoLoadingId === row.id || String(row.status || '').toUpperCase() === 'COMPENSADO'"
                @click="marcar(row, 'COMPENSADO')"
              >
                Compensar
              </Button>

              <Button
                variant="danger"
                size="sm"
                type="button"
                :disabled="acaoLoadingId === row.id || String(row.status || '').toUpperCase() === 'DEVOLVIDO'"
                @click="marcar(row, 'DEVOLVIDO')"
              >
                Devolver
              </Button>
            </div>
          </template>
        </Table>
      </template>

      <!-- MODAL: STATUS -->
      <transition name="fade-slide">
        <div
          v-if="statusModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @mousedown.self="fecharStatus"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

          <div class="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
              <div class="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Alterar status</div>
              <div class="text-lg font-black text-gray-900">Cheque #{{ statusModal.numero }}</div>
            </div>

            <div class="p-6 space-y-4">
              <SearchInput
                v-model="statusModal.status"
                mode="select"
                label="Status"
                placeholder="Selecione..."
                :options="STATUS_OPTIONS"
              />

              <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                  <Input :modelValue="statusModal.banco" label="Banco" readonly />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <Input :modelValue="format.currency(Number(statusModal.valor || 0))" label="Valor" readonly />
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end gap-3">
              <Button variant="secondary" type="button" :disabled="statusModal.saving" @click="fecharStatus">
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="button"
                :loading="statusModal.saving"
                :disabled="!podeSalvarStatus"
                @click="salvarStatus"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { FinanceiroService } from '@/services/index'
import { format } from '@/utils/format'

// ✅ sem importar componentes (já estão no main.js)

const loading = ref(true)
const rows = ref([])

const filtroTexto = ref('')
const filtroStatus = ref(null)

const acaoLoadingId = ref(null)

const STATUS_OPTIONS = [
  { label: 'EM_MAO', value: 'EM_MAO' },
  { label: 'REPASSADO', value: 'REPASSADO' },
  { label: 'COMPENSADO', value: 'COMPENSADO' },
  { label: 'DEVOLVIDO', value: 'DEVOLVIDO' },
]

// colunas
const columns = [
  { key: 'numero', label: 'Cheque', width: '220px' },
  { key: 'emitente', label: 'Emitente / Vínculo' },
  { key: 'vencimento', label: 'Vencimento', width: '160px' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'acoes', label: 'Ações', width: '320px', align: 'right' },
]

// filtros em memória (operacional)
const rowsFiltrados = computed(() => {
  const txt = String(filtroTexto.value || '').trim().toLowerCase()
  const st = filtroStatus.value ? String(filtroStatus.value).trim() : null

  return (rows.value || []).filter((r) => {
    if (st && String(r.status || '').trim() !== st) return false
    if (!txt) return true

    const hay = [
      r.numero,
      r.banco,
      r.emitente_nome,
      r.status,
      r.conta_pagar_id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return hay.includes(txt)
  })
})

// contagens + totais
const contagens = computed(() => {
  const base = rowsFiltrados.value || []
  const c = { total: base.length, compensado: 0, aberto: 0 }

  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    if (s === 'COMPENSADO') c.compensado += 1
    else c.aberto += 1
  }
  return c
})

const totais = computed(() => {
  const base = rowsFiltrados.value || []
  const t = { total: 0, compensado: 0, aberto: 0 }

  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    const v = Number(r.valor || 0)
    t.total += v
    if (s === 'COMPENSADO') t.compensado += v
    else t.aberto += v
  }
  return t
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await FinanceiroService.listarCheques({})
    rows.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

// ações rápidas
async function marcar(row, status) {
  if (!row?.id) return
  acaoLoadingId.value = row.id
  try {
    await FinanceiroService.atualizarStatusCheque(row.id, { status })
    await carregar()
  } finally {
    acaoLoadingId.value = null
  }
}

// modal status (manual)
const statusModal = reactive({
  open: false,
  id: null,
  numero: '',
  banco: '',
  valor: 0,
  status: null,
  saving: false,
})

function abrirStatus(row) {
  statusModal.open = true
  statusModal.id = row.id
  statusModal.numero = row.numero || ''
  statusModal.banco = row.banco || ''
  statusModal.valor = Number(row.valor || 0)
  statusModal.status = String(row.status || '').trim() || null
}

function fecharStatus() {
  statusModal.open = false
}

const podeSalvarStatus = computed(() => {
  if (statusModal.saving) return false
  if (!statusModal.id) return false
  if (!statusModal.status) return false
  return true
})

async function salvarStatus() {
  if (!podeSalvarStatus.value) return
  statusModal.saving = true
  try {
    await FinanceiroService.atualizarStatusCheque(statusModal.id, { status: statusModal.status })
    fecharStatus()
    await carregar()
  } finally {
    statusModal.saving = false
  }
}

onMounted(carregar)
</script>

<style scoped>
/* animação padrão do SearchInput/NavMenu */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.16s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
