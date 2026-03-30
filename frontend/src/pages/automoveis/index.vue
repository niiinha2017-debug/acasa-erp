<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

definePage({ meta: { title: 'Automóveis', perm: 'automoveis.read' } })

const router = useRouter()
const loading = ref(false)
const filtro = ref('')
const resumo = ref({
  totais: { total: 0, ativos: 0, inativos: 0, manutencao: 0 },
  veiculos: [],
})

async function carregarResumo() {
  loading.value = true
  try {
    const { data } = await api.get('/automoveis/patrimonio')
    resumo.value = {
      totais: data?.totais ?? { total: 0, ativos: 0, inativos: 0, manutencao: 0 },
      veiculos: data?.veiculos ?? [],
    }
  } finally {
    loading.value = false
  }
}

const filtrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return resumo.value.veiculos

  return resumo.value.veiculos.filter((veiculo) => {
    const texto = [
      veiculo.placa,
      veiculo.descricao,
      veiculo.marca,
      veiculo.modelo,
      veiculo.cor,
      veiculo.combustivel,
      veiculo.status,
      veiculo.renavam,
      veiculo.chassi,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return texto.includes(termo)
  })
})

const rows = computed(() => filtrados.value.map((veiculo) => ({
  ...veiculo,
  marca_modelo: [veiculo.marca, veiculo.modelo].filter(Boolean).join(' ') || '—',
  combustivel_exibicao: veiculo.combustivel || '—',
  custo_km_exibicao: veiculo.custo_km
    ? Number(veiculo.custo_km).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : '—',
  status_exibicao: veiculo.status === 'MANUTENCAO' ? 'MANUTENÇÃO' : (veiculo.status || '—'),
})))

const columns = [
  { key: 'placa', label: 'Placa', width: '120px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'marca_modelo', label: 'Marca / Modelo', width: '220px' },
  { key: 'combustivel', label: 'Combustível', width: '140px' },
  { key: 'custo_km', label: 'Custo R$/km', width: '130px' },
  { key: 'status', label: 'Status', width: '130px' },
  { key: 'acoes', label: 'Ações', width: '120px' },
]

function editarAutomovel(id) {
  router.push(`/automoveis/cadastro?id=${id}`)
}

async function excluirAutomovel(row) {
  if (!can('automoveis.write')) return
  const ok = await confirm.show(
    'Excluir automóvel',
    `Deseja excluir o veículo ${row?.placa || ''}${row?.descricao ? ` - ${row.descricao}` : ''}?`,
  )
  if (!ok) return

  try {
    await api.delete(`/automoveis/${row.id}`)
    notify.success('Automóvel removido com sucesso.')
    await carregarResumo()
  } catch (error) {
    console.error(error)
    notify.error(error?.response?.data?.message || 'Não foi possível remover o automóvel.')
  }
}

onMounted(carregarResumo)
watch(filtro, () => {})
</script>

<template>
  <PageShell :padded="false" variant="minimal">
    <section class="automoveis-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Automóveis"
        subtitle="Listagem da frota com status, combustível e custo por quilômetro"
        icon="pi pi-car"
        variant="minimal"
      >
        <template #actions>
          <div class="automoveis-list__actions ds-page-context__actions">
            <div class="automoveis-list__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar placa, descrição, marca, modelo ou combustível..."
              />
            </div>

            <Button
              v-if="can('automoveis.write')"
              variant="primary"
              @click="router.push('/automoveis/cadastro')"
            >
              <i class="pi pi-plus" />
              Cadastrar Veículo
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="automoveis-list__content ds-page-context__content">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum veículo cadastrado."
          :boxed="false"
          :flush="false"
        >
          <template #cell-placa="{ row }">
            <span class="placa-pill">{{ row.placa }}</span>
          </template>
          <template #cell-descricao="{ row }">
            <div class="automoveis-list__identity">
              <span class="automoveis-list__primary">{{ row.descricao }}</span>
              <span class="automoveis-list__secondary">
                {{ row.renavam || 'Sem RENAVAM' }}
                <span v-if="row.chassi" class="automoveis-list__secondary-detail">{{ row.chassi }}</span>
              </span>
            </div>
          </template>
          <template #cell-marca_modelo="{ row }">
            <div class="automoveis-list__stack">
              <span class="automoveis-list__primary">{{ row.marca_modelo }}</span>
              <span class="automoveis-list__secondary">{{ row.cor || 'Sem cor' }}</span>
            </div>
          </template>
          <template #cell-combustivel="{ row }">
            <span class="automoveis-list__primary">{{ row.combustivel_exibicao }}</span>
          </template>
          <template #cell-custo_km="{ row }">
            <span class="automoveis-list__amount">{{ row.custo_km_exibicao }}</span>
          </template>
          <template #cell-status="{ row }">
            <span class="status-pill" :class="`status-pill--${String(row.status || '').toLowerCase()}`">
              {{ row.status_exibicao }}
            </span>
          </template>
          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                v-if="can('automoveis.write')"
                :id="row.id"
                @edit="(id) => editarAutomovel(id)"
                @delete="() => excluirAutomovel(row)"
              />
              <span v-else class="text-text-soft">—</span>
            </div>
          </template>
        </Table>
      </div>
    </section>
  </PageShell>
</template>

<style scoped>
.automoveis-list__actions {
  width: 100%;
}

.automoveis-list__search {
  min-width: min(420px, 100%);
}

.automoveis-list__identity,
.automoveis-list__stack {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.25rem 0;
}

.automoveis-list__primary {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ds-color-text, #162033);
}

.automoveis-list__secondary,
.automoveis-list__secondary-detail {
  font-size: 0.78rem;
  color: var(--ds-color-text-soft, #5f6f86);
}

.automoveis-list__secondary-detail::before {
  content: '•';
  margin: 0 0.35rem;
}

.automoveis-list__amount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ds-color-text, #162033);
}

.placa-pill {
  font-family: monospace;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--ds-color-border-ui);
  background: var(--ds-color-surface-muted);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}

.status-pill--ativo {
  background: color-mix(in srgb, var(--ds-color-success) 15%, white 85%);
  color: var(--ds-color-success);
}

.status-pill--inativo {
  background: color-mix(in srgb, var(--ds-color-text-soft) 14%, white 86%);
  color: var(--ds-color-text-soft);
}

.status-pill--manutencao {
  background: color-mix(in srgb, var(--ds-color-warning) 18%, white 82%);
  color: var(--ds-color-warning);
}

@media (max-width: 900px) {
  .automoveis-list__search {
    min-width: 100%;
  }
}
</style>
