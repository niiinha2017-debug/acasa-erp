<template>
  <PageHeader
    title="Pós-venda"
    subtitle="Kanban do fluxo após fechamento da venda"
    icon="pi pi-shopping-cart"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <Button variant="secondary" @click="carregar">
          <i class="pi pi-refresh mr-2"></i>
          Atualizar
        </Button>
      </div>
    </template>
  </PageHeader>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <MetricCard
      label="Total"
      :value="vendas.length"
      icon="pi pi-shopping-bag"
      color="slate"
    />
    <MetricCard
      label="Faturamento"
      :value="format.currency(vendas.reduce((acc, v) => acc + Number(v.valor_vendido || 0), 0))"
      icon="pi pi-dollar"
      color="emerald"
    />
    <MetricCard
      label="Em Producao"
      :value="vendas.filter((v) => normalizeKey(v.status).includes('PRODUCAO') || normalizeKey(v.status) === 'EM_PRODUCAO').length"
      icon="pi pi-cog"
      color="amber"
    />
    <MetricCard
      label="Finalizadas"
      :value="vendas.filter((v) => normalizeKey(v.status) === 'MONTAGEM_FINALIZADA' || normalizeKey(v.status) === 'ENCERRADO').length"
      icon="pi pi-check"
      color="blue"
    />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
    <SearchInput
      v-model="filtro"
      placeholder="Buscar cliente, ID, status..."
    />
  </div>

  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex gap-4 overflow-x-auto pb-2">
      <section
        v-for="col in kanbanColumns"
        :key="col.key"
        class="min-w-[300px] max-w-[300px] rounded-2xl border border-slate-200 bg-slate-50"
        @dragover.prevent
        @drop="onDrop(col.key)"
      >
        <header class="px-3 py-3 border-b border-slate-200 bg-white rounded-t-2xl">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-[11px] font-black uppercase tracking-widest text-slate-600">{{ col.label }}</h3>
            <span class="h-6 min-w-6 px-2 rounded-full bg-slate-900 text-white text-[10px] font-black inline-flex items-center justify-center">
              {{ cardsByColumn[col.key]?.length || 0 }}
            </span>
          </div>
        </header>

        <div class="p-3 space-y-2 min-h-[420px]">
          <article
            v-for="item in cardsByColumn[col.key]"
            :key="item.id"
            draggable="true"
            class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing"
            :class="draggingId === item.id ? 'opacity-60' : ''"
            @dragstart="onDragStart(item)"
            @dragend="onDragEnd"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Venda #{{ item.id }}</div>
                <div class="text-sm font-black text-slate-800 truncate">
                  {{ clienteNome(item) }}
                </div>
              </div>
              <button
                type="button"
                class="h-7 w-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
                @click="router.push(`/vendas/${item.id}`)"
              >
                <i class="pi pi-external-link"></i>
              </button>
            </div>

            <div class="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>{{ format.date(item.data_venda) }}</span>
              <span>{{ format.currency(item.valor_vendido || 0) }}</span>
            </div>

            <div class="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
              {{ statusLabel(item.status) }}
            </div>
          </article>

          <div
            v-if="!(cardsByColumn[col.key] && cardsByColumn[col.key].length)"
            class="h-24 rounded-xl border border-dashed border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center"
          >
            Sem vendas
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { VendaService } from '@/services'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { PIPELINE_CLIENTE } from '@/constantes'

definePage({ meta: { perm: 'posvenda.ver' } })

const router = useRouter()
const loading = ref(false)
const vendas = ref([])
const filtro = ref('')
const draggingId = ref(null)
const draggingFrom = ref('')

const kanbanColumns = [
  { key: 'ORCAMENTO_APROVADO', label: 'Orcamento aprovado' },
  { key: 'VENDA_FECHADA', label: 'Venda fechada' },
  { key: 'MEDIDA_FINA_AGENDADA', label: 'Medida fina' },
  { key: 'PRODUCAO_AGENDADA', label: 'Producao agendada' },
  { key: 'EM_PRODUCAO', label: 'Em producao' },
  { key: 'MONTAGEM_AGENDADA', label: 'Montagem agendada' },
  { key: 'EM_MONTAGEM', label: 'Em montagem' },
  { key: 'MONTAGEM_FINALIZADA', label: 'Finalizada' },
]

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function statusLabel(status) {
  const key = normalizeKey(status)
  const match = (PIPELINE_CLIENTE || []).find((p) => p.key === key)
  return match?.label || key || 'Sem status'
}

function clienteNome(venda) {
  return venda?.cliente?.nome_completo || venda?.cliente?.razao_social || venda?.cliente?.nome || 'Cliente'
}

const vendasFiltradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return vendas.value

  return vendas.value.filter((v) => {
    const nome = clienteNome(v).toLowerCase()
    const status = String(v.status || '').toLowerCase()
    const id = String(v.id || '').toLowerCase()
    return nome.includes(f) || status.includes(f) || id.includes(f)
  })
})

const cardsByColumn = computed(() => {
  const grouped = {}
  for (const col of kanbanColumns) grouped[col.key] = []

  for (const venda of vendasFiltradas.value) {
    const key = normalizeKey(venda.status)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(venda)
  }

  return grouped
})

async function carregar() {
  if (!can('posvenda.ver')) {
    notify.error('Acesso negado.')
    return
  }

  loading.value = true
  try {
    const { data } = await VendaService.listar()
    vendas.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar vendas.')
  } finally {
    loading.value = false
  }
}

function onDragStart(item) {
  draggingId.value = item.id
  draggingFrom.value = normalizeKey(item.status)
}

function onDragEnd() {
  draggingId.value = null
  draggingFrom.value = ''
}

async function onDrop(targetStatus) {
  if (!draggingId.value) return
  if (draggingFrom.value === targetStatus) {
    onDragEnd()
    return
  }

  const vendaId = draggingId.value
  const venda = vendas.value.find((v) => v.id === vendaId)
  if (!venda) {
    onDragEnd()
    return
  }

  if (!can('vendas.editar')) {
    notify.error('Sem permissao para mover etapas.')
    onDragEnd()
    return
  }

  const old = venda.status
  venda.status = targetStatus

  try {
    await VendaService.atualizarStatus(vendaId, targetStatus)
    notify.success(`Venda #${vendaId} movida para ${statusLabel(targetStatus)}.`)
  } catch (e) {
    venda.status = old
    notify.error('Nao foi possivel mover a venda.')
  } finally {
    onDragEnd()
  }
}

onMounted(async () => {
  if (!can('posvenda.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregar()
})
</script>

