<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    <PageHeader
      title="Contratos"
      subtitle="Gestão de contratos comerciais"
      icon="pi pi-file"
    >
      <template #actions>
        <Button
          v-if="can('contratos.criar')"
          variant="primary"
          @click="router.push('/contratos/novo')"
        >
          <i class="pi pi-plus mr-2"></i>
          Novo Contrato
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total de Contratos"
        :value="contratos.length"
        icon="pi pi-file"
        color="slate"
      />
      <MetricCard
        label="Valor Total"
        :value="format.currency(valorTotal)"
        icon="pi pi-dollar"
        color="emerald"
      />
      <MetricCard
        label="Vigentes"
        :value="contratos.filter((c) => String(c.status).toUpperCase() === 'VIGENTE').length"
        icon="pi pi-check-circle"
        color="blue"
      />
      <MetricCard
        label="Encerrados"
        :value="contratos.filter((c) => String(c.status).toUpperCase() === 'ENCERRADO').length"
        icon="pi pi-lock"
        color="amber"
      />
    </div>

    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por número, cliente ou status..."
        />
      </div>

      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          :boxed="false"
        >
          <template #cell-cliente="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">
                {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome || '-' }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {{ row.cliente?.cpf || row.cliente?.cnpj || '' }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" />
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-slate-800 tabular-nums">
              {{ format.currency(row.valor) }}
            </span>
          </template>

          <template #cell-data_inicio="{ row }">
            <span class="text-xs font-medium text-slate-700">
              {{ row.data_inicio ? format.date(row.data_inicio) : '-' }}
            </span>
          </template>

          <template #cell-data_fim="{ row }">
            <span class="text-xs font-medium text-slate-700">
              {{ row.data_fim ? format.date(row.data_fim) : '-' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <TableActions
              :can-edit="can('contratos.editar')"
              :can-delete="can('contratos.excluir')"
              @edit="router.push(`/contratos/${row.id}`)"
              @delete="confirmarExcluir(row.id)"
            />
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { ContratosService } from '@/services/index'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'contratos.ver' } })

const router = useRouter()
const loading = ref(false)
const contratos = ref([])
const filtro = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'numero', label: 'NÚMERO', width: '140px' },
  { key: 'cliente', label: 'CLIENTE', width: '30%' },
  { key: 'status', label: 'STATUS', width: '120px', align: 'center' },
  { key: 'valor', label: 'VALOR', width: '120px', align: 'right' },
  { key: 'data_inicio', label: 'INÍCIO', width: '100px' },
  { key: 'data_fim', label: 'FIM', width: '100px' },
  { key: 'acoes', label: '', width: '100px', align: 'right' },
]

const valorTotal = computed(() =>
  contratos.value.reduce((acc, c) => acc + Number(c.valor || 0), 0)
)

const filtradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return contratos.value
  return contratos.value.filter((c) => {
    const cli = c?.cliente || {}
    const nome = String(cli.nome_completo || cli.razao_social || cli.nome || '').toLowerCase()
    const numero = String(c?.numero || '').toLowerCase()
    const status = String(c?.status || '').toLowerCase()
    const id = String(c?.id || '')
    return nome.includes(f) || numero.includes(f) || status.includes(f) || id.includes(f)
  })
})

async function carregar() {
  if (!can('contratos.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await ContratosService.listar()
    contratos.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar contratos.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluir(id) {
  if (!can('contratos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir contrato', `Deseja excluir o contrato #${id}?`)
  if (!ok) return
  try {
    await ContratosService.remover(id)
    notify.success('Contrato excluído.')
    await carregar()
  } catch (e) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (!can('contratos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregar()
})
</script>
