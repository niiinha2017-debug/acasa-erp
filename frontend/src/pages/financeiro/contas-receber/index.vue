<!-- src/pages/financeiro/contas-receber/index.vue -->
<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Contas a Receber"
        subtitle="Receitas previstas e recebidas (cliente ou fornecedor)."
        icon="pi pi-arrow-up-right"
        :backTo="null"
      />

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6 relative">
        <Loading v-if="loading" />

        <template v-else>
          <!-- FILTROS -->
          <div class="grid grid-cols-12 gap-4">
            <SearchInput
              class="col-span-12 md:col-span-7"
              v-model="filtroTexto"
              mode="search"
              label="Buscar"
              placeholder="Buscar por descrição, origem, status..."
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
              <div class="text-xs font-bold text-gray-500">{{ contagens.total }} registros</div>
            </div>

            <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
              <div class="text-[9px] font-black uppercase tracking-[0.22em] text-green-500">Recebidos</div>
              <div class="text-lg font-black text-green-700">{{ format.currency(totais.recebido) }}</div>
              <div class="text-xs font-bold text-green-600">{{ contagens.recebido }} registros</div>
            </div>

            <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
              <div class="text-[9px] font-black uppercase tracking-[0.22em] text-amber-500">Em aberto</div>
              <div class="text-lg font-black text-amber-700">{{ format.currency(totais.aberto) }}</div>
              <div class="text-xs font-bold text-amber-600">{{ contagens.aberto }} registros</div>
            </div>
          </div>

          <!-- TABELA -->
          <Table
            :columns="columns"
            :rows="rowsFiltrados"
            :loading="false"
            empty-text="Nenhuma conta a receber encontrada."
            :boxed="true"
          >
            <template #cell-partes="{ row }">
              <div class="font-black text-gray-900">
                <template v-if="row.cliente_id">Cliente #{{ row.cliente_id }}</template>
                <template v-else-if="row.fornecedor_id">Fornecedor #{{ row.fornecedor_id }}</template>
                <template v-else>—</template>
              </div>
              <div class="text-xs font-bold text-gray-400">
                <template v-if="row.descricao">{{ row.descricao }}</template>
                <template v-else>Sem descrição</template>
              </div>
            </template>

            <template #cell-origem="{ row }">
              <div class="font-black text-gray-900">{{ row.origem_tipo || '—' }}</div>
              <div class="text-xs font-bold text-gray-400">
                <template v-if="row.origem_id">#{{ row.origem_id }}</template>
                <template v-else>—</template>
              </div>
            </template>

            <template #cell-vencimento="{ row }">
              <div class="text-xs font-black text-gray-900">{{ format.date(row.vencimento_em) }}</div>
            </template>

            <template #cell-valor="{ row }">
              <div class="font-black text-gray-900 text-right">
                {{ format.currency(Number(row.valor_original || 0)) }}
              </div>
              <div class="text-xs font-bold text-gray-400 text-right">
                Comp.: {{ format.currency(Number(row.valor_compensado || 0)) }}
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
                  @click="abrirReceber(row)"
                >
                  Receber
                </Button>
              </div>
            </template>
          </Table>
        </template>

        <!-- MODAL: RECEBER -->
        <transition name="fade-slide">
          <div
            v-if="receberModal.open"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            @mousedown.self="fecharReceber"
          >
            <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

            <div class="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
              <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
                <div class="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Receber</div>
                <div class="text-lg font-black text-gray-900">
                  Conta a Receber #{{ receberModal.id }}
                </div>
              </div>

              <div class="p-6 space-y-6">
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="receberModal.parteLabel" label="Parte" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="receberModal.origemLabel" label="Origem" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="format.currency(Number(receberModal.valor_original || 0))" label="Valor" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="format.date(receberModal.vencimento_em)" label="Vencimento" readonly />
                  </div>
                </div>

                <div class="h-px bg-slate-100"></div>

                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6">
                    <SearchInput
                      v-model="receberModal.forma_recebimento_chave"
                      mode="search"
                      label="Forma de recebimento (chave)"
                      placeholder="Ex: PIX, DINHEIRO, CARTAO..."
                    />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <label class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                      Data de recebimento
                    </label>
                    <input
                      type="datetime-local"
                      class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bolding text-gray-700 font-bold"
                      v-model="receberModal.recebido_em_input"
                    />
                  </div>

                  <div class="col-span-12">
                    <SearchInput
                      v-model="receberModal.observacao"
                      mode="search"
                      label="Observação"
                      placeholder="Opcional..."
                    />
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end gap-3">
                <Button variant="secondary" type="button" :disabled="receberModal.saving" @click="fecharReceber">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  :loading="receberModal.saving"
                  :disabled="!podeConfirmarRecebimento"
                  @click="confirmarRecebimento"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { FinanceiroService } from '@/services/index'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'contas_receber.ver' } })

// ✅ sem importar componentes (já estão no main.js)

const loading = ref(true)
const rows = ref([])

const filtroTexto = ref('')
const filtroStatus = ref(null)

const acaoLoadingId = ref(null)

const STATUS_OPTIONS = [
  { label: 'EM_ABERTO', value: 'EM_ABERTO' },
  { label: 'VENCIDO', value: 'VENCIDO' },
  { label: 'RECEBIDO', value: 'RECEBIDO' },
  { label: 'CANCELADO', value: 'CANCELADO' },
]

// colunas
const columns = [
  { key: 'partes', label: 'Parte / Descrição' },
  { key: 'origem', label: 'Origem', width: '180px' },
  { key: 'vencimento', label: 'Vencimento', width: '160px' },
  { key: 'valor', label: 'Valor', width: '200px', align: 'right' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'acoes', label: 'Ações', width: '160px', align: 'right' },
]

// filtros em memória
const rowsFiltrados = computed(() => {
  const txt = String(filtroTexto.value || '').trim().toLowerCase()
  const st = filtroStatus.value ? String(filtroStatus.value).trim() : null

  return (rows.value || []).filter((r) => {
    if (st && String(r.status || '').trim() !== st) return false
    if (!txt) return true

    const hay = [
      r.descricao,
      r.observacao,
      r.origem_tipo,
      r.origem_id,
      r.status,
      r.forma_recebimento_chave,
      r.cliente_id,
      r.fornecedor_id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return hay.includes(txt)
  })
})

const contagens = computed(() => {
  const base = rowsFiltrados.value || []
  const c = { total: base.length, recebido: 0, aberto: 0 }
  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    if (s === 'RECEBIDO') c.recebido += 1
    else c.aberto += 1
  }
  return c
})

const totais = computed(() => {
  const base = rowsFiltrados.value || []
  const t = { total: 0, recebido: 0, aberto: 0 }

  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    const v = Number(r.valor_original || 0)
    t.total += v
    if (s === 'RECEBIDO') t.recebido += v
    else t.aberto += v
  }
  return t
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await FinanceiroService.listarReceber({})
    rows.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

// =======================
// MODAL RECEBER
// =======================
const receberModal = reactive({
  open: false,
  saving: false,

  id: null,

  cliente_id: null,
  fornecedor_id: null,

  origem_tipo: null,
  origem_id: null,

  descricao: '',
  observacao: '',

  valor_original: 0,
  valor_compensado: 0,

  vencimento_em: null,

  forma_recebimento_chave: '',
  recebido_em_input: '',
})

function toInputDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${hh}:${mm}`
}
function inputToISO(v) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

const podeConfirmarRecebimento = computed(() => {
  if (receberModal.saving) return false
  if (!receberModal.id) return false
  // data de recebimento pode ser agora se vazio, mas vou exigir preenchido pra não inventar
  if (!String(receberModal.recebido_em_input || '').trim()) return false
  // forma_recebimento é opcional no model, então não obrigo
  return true
})

function abrirReceber(row) {
  receberModal.open = true
  receberModal.saving = false

  receberModal.id = row.id

  receberModal.cliente_id = row.cliente_id ?? null
  receberModal.fornecedor_id = row.fornecedor_id ?? null

  receberModal.origem_tipo = row.origem_tipo ?? null
  receberModal.origem_id = row.origem_id ?? null

  receberModal.descricao = row.descricao ?? ''
  receberModal.observacao = row.observacao ?? ''

  receberModal.valor_original = Number(row.valor_original || 0)
  receberModal.valor_compensado = Number(row.valor_compensado || 0)

  receberModal.vencimento_em = row.vencimento_em ?? null

  receberModal.forma_recebimento_chave = row.forma_recebimento_chave ?? ''
  receberModal.recebido_em_input = toInputDateTime(new Date().toISOString())
}

function fecharReceber() {
  receberModal.open = false
}

const parteLabel = computed(() => {
  if (receberModal.cliente_id) return `Cliente #${receberModal.cliente_id}`
  if (receberModal.fornecedor_id) return `Fornecedor #${receberModal.fornecedor_id}`
  return '—'
})
const origemLabel = computed(() => {
  const t = receberModal.origem_tipo ? String(receberModal.origem_tipo) : ''
  const id = receberModal.origem_id ? `#${receberModal.origem_id}` : '—'
  return t ? `${t} ${id}` : '—'
})

Object.defineProperty(receberModal, 'parteLabel', { get: () => parteLabel.value })
Object.defineProperty(receberModal, 'origemLabel', { get: () => origemLabel.value })

async function confirmarRecebimento() {
  if (!podeConfirmarRecebimento.value) return
  acaoLoadingId.value = receberModal.id
  receberModal.saving = true

  try {
    const payload = {
      status: 'RECEBIDO',
      recebido_em: inputToISO(receberModal.recebido_em_input),
      forma_recebimento_chave: receberModal.forma_recebimento_chave
        ? String(receberModal.forma_recebimento_chave).trim()
        : null,
      observacao: receberModal.observacao ? String(receberModal.observacao).trim() : null,
    }

    await FinanceiroService.receber(receberModal.id, payload)
    fecharReceber()
    await carregar()
  } finally {
    receberModal.saving = false
    acaoLoadingId.value = null
  }
}

onMounted(carregar)
</script>

<style scoped>
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
