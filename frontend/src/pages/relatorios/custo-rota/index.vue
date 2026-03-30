<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

definePage({ meta: { title: 'Relatório de Custo de Rota' } })

const loading = ref(false)
const relatorio = ref(null)
const funcionarios = ref([])
const automoveis = ref([])

const filtros = ref({
  data_inicio: primeiroDiaMes(),
  data_fim: hoje(),
  funcionario_id: '',
  automovel_id: '',
})

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function primeiroDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function formatMoeda(v) {
  return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatKm(v) {
  return Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km'
}

function formatData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function buscar() {
  loading.value = true
  try {
    const params = {}
    if (filtros.value.data_inicio) params.data_inicio = filtros.value.data_inicio
    if (filtros.value.data_fim) params.data_fim = filtros.value.data_fim
    if (filtros.value.funcionario_id) params.funcionario_id = filtros.value.funcionario_id
    if (filtros.value.automovel_id) params.automovel_id = filtros.value.automovel_id

    const { data } = await api.get('/rota-custo-viagem/relatorio', { params })
    relatorio.value = data
  } finally {
    loading.value = false
  }
}

async function carregarFiltros() {
  const [f, a] = await Promise.all([
    api.get('/funcionarios').catch(() => ({ data: [] })),
    api.get('/automoveis').catch(() => ({ data: [] })),
  ])
  funcionarios.value = f.data
  automoveis.value = a.data
}

const columnsResumo = [
  { key: 'nome', label: 'Funcionário' },
  { key: 'viagens', label: 'Viagens', width: '90px' },
  { key: 'km_total', label: 'KM Total', width: '110px' },
  { key: 'custo_total', label: 'Custo Total', width: '130px' },
]

const columnsDetalhe = [
  { key: 'data', label: 'Data', width: '160px' },
  { key: 'funcionario', label: 'Funcionário', width: '180px' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'agenda', label: 'Agenda', width: '160px' },
  { key: 'automovel', label: 'Veículo', width: '160px' },
  { key: 'km_ida', label: 'Ida', width: '80px' },
  { key: 'km_volta', label: 'Volta', width: '80px' },
  { key: 'km_total', label: 'Total KM', width: '90px' },
  { key: 'custo_total', label: 'Custo', width: '100px' },
  { key: 'origem', label: 'Origem', width: '90px' },
]

onMounted(async () => {
  await carregarFiltros()
  await buscar()
})
</script>

<template>
  <PageShell :padded="false">
    <section class="custo-rota-page animate-page-in">
      <PageHeader
        title="Relatório de Custo de Rota"
        subtitle="Quilômetros rodados e custo de viagem por funcionário e medida fina"
        icon="pi pi-map"
      />

      <!-- Filtros -->
      <div class="custo-rota-page__filters">
        <div class="filtro-campo">
          <label class="filtro-campo__label">De</label>
          <input v-model="filtros.data_inicio" type="date" class="input input--sm" />
        </div>
        <div class="filtro-campo">
          <label class="filtro-campo__label">Até</label>
          <input v-model="filtros.data_fim" type="date" class="input input--sm" />
        </div>
        <div class="filtro-campo">
          <label class="filtro-campo__label">Funcionário</label>
          <select v-model="filtros.funcionario_id" class="input input--sm">
            <option value="">Todos</option>
            <option v-for="f in funcionarios" :key="f.id" :value="f.id">{{ f.nome }}</option>
          </select>
        </div>
        <div class="filtro-campo">
          <label class="filtro-campo__label">Veículo</label>
          <select v-model="filtros.automovel_id" class="input input--sm">
            <option value="">Todos</option>
            <option v-for="a in automoveis" :key="a.id" :value="a.id">{{ a.placa }} – {{ a.descricao }}</option>
          </select>
        </div>
        <Button variant="primary" :loading="loading" @click="buscar">
          <i class="pi pi-search"></i>
          Buscar
        </Button>
      </div>

      <!-- Cards resumo -->
      <template v-if="relatorio">
        <div class="custo-rota-page__cards">
          <div class="metric-card">
            <span class="metric-card__value">{{ relatorio.totais.viagens }}</span>
            <span class="metric-card__label">Viagens</span>
          </div>
          <div class="metric-card metric-card--blue">
            <span class="metric-card__value">{{ formatKm(relatorio.totais.km_total) }}</span>
            <span class="metric-card__label">KM Total</span>
          </div>
          <div class="metric-card metric-card--green">
            <span class="metric-card__value">{{ formatMoeda(relatorio.totais.custo_total) }}</span>
            <span class="metric-card__label">Custo Total</span>
          </div>
        </div>

        <!-- Resumo por funcionário -->
        <div class="custo-rota-page__section">
          <h3 class="section-title">Resumo por Funcionário</h3>
          <Table
            :columns="columnsResumo"
            :rows="relatorio.por_funcionario"
            :loading="loading"
            empty-text="Nenhuma rota no período."
            :boxed="false"
            :flush="false"
          >
            <template #cell-km_total="{ row }">{{ formatKm(row.km_total) }}</template>
            <template #cell-custo_total="{ row }">{{ formatMoeda(row.custo_total) }}</template>
          </Table>
        </div>

        <!-- Detalhamento completo -->
        <div class="custo-rota-page__section">
          <h3 class="section-title">Detalhamento de Viagens</h3>
          <Table
            :columns="columnsDetalhe"
            :rows="relatorio.rotas"
            :loading="loading"
            empty-text="Nenhuma viagem registrada no período."
            :boxed="false"
            :flush="false"
          >
            <template #cell-data="{ row }">{{ formatData(row.registrado_em) }}</template>
            <template #cell-funcionario="{ row }">{{ row.funcionario?.nome ?? '—' }}</template>
            <template #cell-cliente="{ row }">{{ row.cliente?.nome_completo ?? row.agenda_loja?.cliente?.nome_completo ?? '—' }}</template>
            <template #cell-agenda="{ row }">
              <span class="text-sm">{{ row.agenda_loja?.titulo ?? '—' }}</span>
            </template>
            <template #cell-automovel="{ row }">
              <span v-if="row.automovel" class="text-sm">
                <span class="placa-mini">{{ row.automovel.placa }}</span>
                <span class="text-muted"> {{ row.automovel.descricao }}</span>
              </span>
              <span v-else class="text-muted">—</span>
            </template>
            <template #cell-km_ida="{ row }">{{ row.km_ida ? formatKm(row.km_ida) : '—' }}</template>
            <template #cell-km_volta="{ row }">{{ row.km_volta ? formatKm(row.km_volta) : '—' }}</template>
            <template #cell-km_total="{ row }">
              <strong>{{ row.km_total ? formatKm(row.km_total) : '—' }}</strong>
            </template>
            <template #cell-custo_total="{ row }">
              <strong>{{ row.custo_total ? formatMoeda(row.custo_total) : '—' }}</strong>
            </template>
            <template #cell-origem="{ row }">
              <span :class="['origin-badge', row.origem_registro === 'TOTEM' ? 'origin-badge--totem' : 'origin-badge--manual']">
                {{ row.origem_registro === 'TOTEM' ? 'Totem' : 'Manual' }}
              </span>
            </template>
          </Table>
        </div>
      </template>

      <div v-else-if="!loading" class="custo-rota-page__empty">
        <i class="pi pi-map" style="font-size: 2.5rem; opacity: 0.25"></i>
        <p>Selecione o período e clique em <strong>Buscar</strong> para ver os dados.</p>
      </div>
    </section>
  </PageShell>
</template>

<style scoped>
.custo-rota-page {
  min-height: 100%;
}

.custo-rota-page__filters {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  padding: 1rem 1.5rem;
  flex-wrap: wrap;
}

.input--sm { max-width: 160px; }

.filtro-campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filtro-campo__label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-muted);
  letter-spacing: 0.03em;
}

.custo-rota-page__cards {
  display: flex;
  gap: 1rem;
  padding: 0 1.5rem 1rem;
  flex-wrap: wrap;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  min-width: 140px;
}

.metric-card--blue  { border-color: var(--color-info); }
.metric-card--green { border-color: var(--color-success); }

.metric-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.metric-card__label {
  font-size: 0.75rem;
  color: var(--color-muted);
  margin-top: 0.25rem;
}

.custo-rota-page__section {
  padding: 0 0 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1.5rem 0.5rem;
}

.custo-rota-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  color: var(--color-muted);
}

.placa-mini {
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--surface-subtle);
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.text-sm   { font-size: 0.85rem; }
.text-muted { color: var(--color-muted); }

.origin-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.origin-badge--totem  { background: var(--color-info-light); color: var(--color-info-dark); }
.origin-badge--manual { background: var(--surface-subtle); color: var(--color-muted); }
</style>
