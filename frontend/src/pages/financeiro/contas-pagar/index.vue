<template>
  <Card :shadow="true">
    <PageHeader
      title="Contas a Pagar"
      subtitle="Consolidado: despesas, compras e fechamentos (plano de corte abate compras)."
      icon="pi pi-arrow-down-right"
      :backTo="null"
    />

    <div class="p-6 relative space-y-6">
      <Loading v-if="loading" />

      <template v-else>
        <!-- FILTROS -->
        <div class="grid grid-cols-12 gap-4">
          <Input
            class="col-span-12 md:col-span-3"
            label="Mês"
            type="number"
            :forceUpper="false"
            v-model="filtroMes"
            placeholder="1-12"
          />
          <Input
            class="col-span-12 md:col-span-3"
            label="Ano"
            type="number"
            :forceUpper="false"
            v-model="filtroAno"
            placeholder="2026"
          />

          <SearchInput
            class="col-span-12 md:col-span-6"
            v-model="filtroTexto"
            mode="search"
            label="Buscar"
            placeholder="Buscar por fornecedor, origem, status..."
          />

          <SearchInput
            class="col-span-12 md:col-span-4"
            v-model="filtroStatus"
            mode="select"
            label="Status"
            placeholder="Selecione..."
            :options="STATUS_OPTIONS"
          />

          <SearchInput
            class="col-span-12 md:col-span-8"
            v-model="filtroFornecedorId"
            mode="select"
            label="Fornecedor (opcional)"
            placeholder="Selecione..."
            :options="fornecedoresOptions"
          />
        </div>

        <!-- RESUMO STATUS -->
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-red-400">Vencidos</div>
            <div class="text-lg font-black text-red-700">{{ format.currency(totais.vencido) }}</div>
            <div class="text-xs font-bold text-red-500">{{ contagens.vencido }} itens</div>
          </div>

          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-amber-500">Em aberto</div>
            <div class="text-lg font-black text-amber-700">{{ format.currency(totais.em_aberto) }}</div>
            <div class="text-xs font-bold text-amber-600">{{ contagens.em_aberto }} itens</div>
          </div>

          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-green-500">Pagos</div>
            <div class="text-lg font-black text-green-700">{{ format.currency(totais.pago) }}</div>
            <div class="text-xs font-bold text-green-600">{{ contagens.pago }} itens</div>
          </div>
        </div>

        <!-- TABELA -->
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="false"
          emptyText="Nenhum lançamento encontrado."
          :boxed="true"
        >
          <template #cell-origem="{ row }">
            <div class="font-black text-gray-900">{{ row.origem }}</div>
            <div class="text-xs font-bold text-gray-400">#{{ row.id }}</div>
          </template>

          <template #cell-fornecedor="{ row }">
            <button
              type="button"
              class="text-left w-full"
              :disabled="!row.fornecedor_id"
              @click="abrirModalFechamento(row)"
            >
              <div class="font-black text-gray-900">
                {{ row.fornecedor_nome || '—' }}
                <span v-if="!row.fornecedor_id" class="text-xs font-bold text-gray-400">(sem fornecedor)</span>
              </div>
              <div class="text-xs font-bold text-gray-400">
                {{ row.descricao || '—' }}
              </div>
            </button>
          </template>

          <template #cell-vencimento="{ row }">
            <div class="text-xs font-black text-gray-900">{{ format.date(row.vencimento_em) }}</div>
          </template>

          <template #cell-compensado="{ row }">
            <div class="font-black text-gray-900 text-right">
              {{ format.currency(Number(row.valor_compensado || 0)) }}
            </div>
            <div v-if="Number(row.valor_compensado || 0) > 0" class="text-[10px] font-black text-gray-400 uppercase text-right">
              abatimento (plano/extra)
            </div>
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
                variant="ghost"
                size="sm"
                label="Fechar mês"
                v-if="row.fornecedor_id"
                @click="abrirModalFechamento(row)"
              />
            </div>
          </template>
        </Table>
      </template>
    </div>

    <!-- ✅ AQUI: modal importado (sem duplicar HTML) -->
    <FechamentoFornecedorModal
      :open="modalOpen"
      :fornecedorId="modalFornecedorId"
      :fornecedorNome="modalFornecedorNome"
      :mes="Number(filtroMes)"
      :ano="Number(filtroAno)"
      @close="modalOpen = false"
      @saved="onModalSaved"
    />
  </Card>
</template>



<script setup>
import { ref, computed, onMounted } from 'vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { format } from '@/utils/format'

const STATUS_OPTIONS = [
  { label: 'Em aberto', value: 'EM_ABERTO' },
  { label: 'Vencido', value: 'VENCIDO' },
  { label: 'Pago', value: 'PAGO' },
  { label: 'Cancelado', value: 'CANCELADO' },
]

const loading = ref(true)
const rows = ref([])

const filtroMes = ref(new Date().getMonth() + 1)
const filtroAno = ref(new Date().getFullYear())
const filtroTexto = ref('')
const filtroStatus = ref(null)
const filtroFornecedorId = ref(null)

const fornecedoresOptions = ref([])

const columns = [
  { key: 'origem', label: 'Origem', width: '160px' },
  { key: 'fornecedor', label: 'Fornecedor / Descrição' },
  { key: 'vencimento', label: 'Vencimento', width: '160px' },
  { key: 'compensado', label: 'Compensado', width: '180px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'acoes', label: '', width: '160px', align: 'right' },
]

// ⚠️ igual você já tinha: compras filtrando por vencimento_em por enquanto
function matchMesAno(row, mes, ano) {
  const m = Number(mes)
  const a = Number(ano)
  if (!m || !a) return true

  if (row.origem === 'FECHAMENTO') {
    return Number(row.mes_referencia) === m && Number(row.ano_referencia) === a
  }

  const d = row.vencimento_em ? new Date(row.vencimento_em) : null
  if (!d || Number.isNaN(d.getTime())) return false
  return d.getMonth() + 1 === m && d.getFullYear() === a
}

const rowsFiltrados = computed(() => {
  const txt = String(filtroTexto.value || '').trim().toLowerCase()
  const st = filtroStatus.value ? String(filtroStatus.value).trim() : null
  const fornecedorId = filtroFornecedorId.value ? Number(filtroFornecedorId.value) : null

  return (rows.value || []).filter((r) => {
    if (!matchMesAno(r, filtroMes.value, filtroAno.value)) return false
    if (st && String(r.status || '').trim() !== st) return false
    if (fornecedorId && Number(r.fornecedor_id || 0) !== fornecedorId) return false

    if (!txt) return true
    const hay = [r.origem, r.status, r.fornecedor_nome, r.descricao, r.observacao]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(txt)
  })
})

const contagens = computed(() => {
  const base = rowsFiltrados.value || []
  const c = { vencido: 0, em_aberto: 0, pago: 0 }
  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    if (s === 'VENCIDO') c.vencido++
    else if (s === 'EM_ABERTO') c.em_aberto++
    else if (s === 'PAGO') c.pago++
  }
  return c
})

const totais = computed(() => {
  const base = rowsFiltrados.value || []
  const t = { vencido: 0, em_aberto: 0, pago: 0 }
  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    const v = Number(r.valor || 0)
    if (s === 'VENCIDO') t.vencido += v
    else if (s === 'EM_ABERTO') t.em_aberto += v
    else if (s === 'PAGO') t.pago += v
  }
  return t
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await FinanceiroService.listarPagarConsolidado({
      fornecedor_id: filtroFornecedorId.value || undefined,
      status: filtroStatus.value || undefined,
    })
    rows.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

async function carregarFornecedores() {
  try {
    const { data } = await FornecedorService.listar({})
    const list = Array.isArray(data) ? data : []
    fornecedoresOptions.value = list.map((f) => ({
      label: f.nome_fantasia || f.nome || `#${f.id}`,
      value: f.id,
    }))
  } catch {}
}

onMounted(async () => {
  await carregarFornecedores()
  await carregar()
})

// ===== modal (importado) =====
const modalOpen = ref(false)
const modalFornecedorId = ref(null)
const modalFornecedorNome = ref('')

function abrirModalFechamento(row) {
  if (!row?.fornecedor_id) return
  modalFornecedorId.value = Number(row.fornecedor_id)
  modalFornecedorNome.value = row.fornecedor_nome || ''
  modalOpen.value = true
}

async function onModalSaved() {
  modalOpen.value = false
  await carregar()
}
</script>
