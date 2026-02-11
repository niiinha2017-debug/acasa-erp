<template>
  <PageHeader
    title="Plano de Corte"
    subtitle="Kanban de etapas do fornecedor"
    icon="pi pi-box"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <Button variant="secondary" @click="carregar">
          <i class="pi pi-refresh mr-2"></i>
          Atualizar
        </Button>
        <Button
          v-if="can('plano_corte.criar')"
          variant="secondary"
          @click="router.push('/plano-corte/venda')"
        >
          <i class="pi pi-link mr-2"></i>
          Vincular Venda
        </Button>
        <Button
          v-if="can('plano_corte.criar')"
          variant="primary"
          @click="router.push('/plano-corte/novo')"
        >
          <i class="pi pi-plus mr-2"></i>
          Novo Plano
        </Button>
      </div>
    </template>
  </PageHeader>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <MetricCard
      label="Planos"
      :value="rows.length"
      icon="pi pi-cog"
      color="slate"
    />
    <MetricCard
      label="Em Producao"
      :value="rows.filter((r) => normalizeKey(r.status) === 'EM_PRODUCAO').length"
      icon="pi pi-cog"
      color="amber"
    />
    <MetricCard
      label="Finalizados"
      :value="rows.filter((r) => normalizeKey(r.status) === 'FINALIZADO').length"
      icon="pi pi-check"
      color="emerald"
    />
    <MetricCard
      label="Compensados"
      :value="rows.filter((r) => normalizeKey(r.status) === 'COMPENSADO').length"
      icon="pi pi-wallet"
      color="blue"
    />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
    <SearchInput
      v-model="busca"
      placeholder="Buscar fornecedor, status ou ID..."
    />
  </div>

  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex gap-4 overflow-x-auto pb-2">
      <section
        v-for="col in kanbanColumns"
        :key="col.key"
        class="min-w-[320px] max-w-[320px] rounded-2xl border border-slate-200 bg-slate-50"
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
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Plano #{{ item.id }}</div>
                <div class="text-sm font-black text-slate-800 truncate">
                  {{ fornecedorNome(item) }}
                </div>
              </div>
              <button
                type="button"
                class="h-7 w-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
                @click="router.push(`/plano-corte/${item.id}`)"
              >
                <i class="pi pi-external-link"></i>
              </button>
            </div>

            <div class="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>{{ format.date(item.data_venda || item.criado_em || item.created_at) }}</span>
              <span>{{ format.currency(item.valor_total || 0) }}</span>
            </div>

            <div class="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
              {{ statusLabel(item.status) }}
            </div>
          </article>

          <div
            v-if="!(cardsByColumn[col.key] && cardsByColumn[col.key].length)"
            class="h-24 rounded-xl border border-dashed border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center"
          >
            Sem planos
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlanoCorteService } from '@/services'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { PIPELINE_PLANO_CORTE } from '@/constantes'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const rows = ref([])
const busca = ref('')
const draggingId = ref(null)
const draggingFrom = ref('')

const kanbanColumns = [
  { key: 'EM_ABERTO', label: 'Em aberto' },
  { key: 'EM_PRODUCAO', label: 'Em producao' },
  { key: 'FINALIZADO', label: 'Finalizado' },
  { key: 'COMPENSADO', label: 'Compensado' },
]

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function statusLabel(status) {
  const key = normalizeKey(status)
  const match = (PIPELINE_PLANO_CORTE || []).find((p) => p.key === key)
  return match?.label || key || 'Sem status'
}

function fornecedorNome(plano) {
  return plano?.fornecedor?.nome_fantasia || plano?.fornecedor?.razao_social || 'Fornecedor'
}

const rowsFiltradas = computed(() => {
  const f = String(busca.value || '').toLowerCase().trim()
  if (!f) return rows.value

  return rows.value.filter((r) => {
    const nome = fornecedorNome(r).toLowerCase()
    const status = String(r.status || '').toLowerCase()
    const id = String(r.id || '').toLowerCase()
    return nome.includes(f) || status.includes(f) || id.includes(f)
  })
})

const cardsByColumn = computed(() => {
  const grouped = {}
  for (const col of kanbanColumns) grouped[col.key] = []

  for (const plano of rowsFiltradas.value) {
    const key = normalizeKey(plano.status)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(plano)
  }

  return grouped
})

async function carregar() {
  if (!can('plano_corte.ver')) {
    notify.error('Acesso negado.')
    return
  }

  try {
    const { data } = await PlanoCorteService.listar()
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar planos.')
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

  const planoId = draggingId.value
  const plano = rows.value.find((r) => r.id === planoId)
  if (!plano) {
    onDragEnd()
    return
  }

  if (!can('plano_corte.editar')) {
    notify.error('Sem permissao para mover etapas.')
    onDragEnd()
    return
  }

  const old = plano.status
  plano.status = targetStatus

  try {
    await PlanoCorteService.salvar(planoId, { status: targetStatus })
    notify.success(`Plano #${planoId} movido para ${statusLabel(targetStatus)}.`)
  } catch (e) {
    plano.status = old
    notify.error('Nao foi possivel mover o plano.')
  } finally {
    onDragEnd()
  }
}

onMounted(async () => {
  await carregar()
})
</script>

