<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Venda"
        subtitle="Selecione um orçamento e faça o fechamento da venda"
        icon="pi pi-shopping-cart"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-80 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar por cliente, ID do orçamento..."
              />
            </div>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft"></i>
        </div>

        <template v-else>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Orçamentos para venda"
              :value="orcamentosFiltrados.length"
              icon="pi pi-file"
              color="slate"
            />
            <MetricCard
              label="Valor total listado"
              :value="format.currency(totalLista)"
              icon="pi pi-dollar"
              color="emerald"
            />
            <MetricCard
              label="Clientes"
              :value="totalClientes"
              icon="pi pi-users"
              color="blue"
            />
          </div>

          <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden">
            <Table
              :columns="columns"
              :rows="orcamentosFiltrados"
              :loading="loading"
              empty-text="Nenhum orçamento encontrado."
              :boxed="false"
            >
              <template #cell-cliente="{ row }">
                <div class="flex flex-col py-1">
                  <span class="text-sm font-bold text-text-main uppercase tracking-tight leading-tight">
                    {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente_nome_snapshot || 'Cliente' }}
                  </span>
                  <span class="text-[10px] font-bold text-text-soft tracking-wider uppercase">
                    Orçamento #{{ row.id }}
                  </span>
                </div>
              </template>

              <template #cell-valor="{ row }">
                <span class="text-sm font-black text-text-main tabular-nums">
                  {{ format.currency(row.total_itens ?? row.valor_total ?? 0) }}
                </span>
              </template>

              <template #cell-acoes="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    @click="router.push(`/orcamentos/${row.id}`)"
                  >
                    Detalhar
                  </Button>
                  <Button
                    v-if="!row.venda"
                    size="sm"
                    variant="primary"
                    type="button"
                    :disabled="!can('vendas.criar')"
                    @click="irParaFechamento(row.id)"
                  >
                    Fechar venda
                  </Button>
                  <Button
                    v-else
                    size="sm"
                    variant="danger"
                    type="button"
                    :disabled="!can('vendas.editar') && !can('vendas.excluir')"
                    @click="cancelarVenda(row)"
                  >
                    Cancelar venda
                  </Button>
                </div>
              </template>
            </Table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { OrcamentosService, VendaService } from '@/services'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'vendas.criar' } })

const router = useRouter()
const loading = ref(false)
const orcamentos = ref([])
const filtro = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'cliente', label: 'CLIENTE', width: '40%' },
  { key: 'valor', label: 'VALOR ORÇADO', width: '20%', align: 'right' },
  { key: 'acoes', label: '', width: '160px', align: 'right' },
]

const orcamentosFiltrados = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return orcamentos.value

  return (orcamentos.value || []).filter((o) => {
    const cli = o.cliente || {}
    const nome = String(
      cli.nome_completo || cli.razao_social || o.cliente_nome_snapshot || '',
    ).toLowerCase()
    const id = String(o.id || '')
    return nome.includes(f) || id.includes(f)
  })
})

const totalLista = computed(() =>
  (orcamentosFiltrados.value || []).reduce(
    (acc, o) => acc + Number(o.total_itens ?? o.valor_total ?? 0),
    0,
  ),
)

const totalClientes = computed(() => {
  const set = new Set()
  for (const o of orcamentosFiltrados.value || []) {
    if (o.cliente_id) set.add(o.cliente_id)
  }
  return set.size
})

async function carregar() {
  if (!can('vendas.criar')) {
    notify.error('Acesso negado.')
    return
  }
  loading.value = true
  try {
    const { data } = await OrcamentosService.listar()
    orcamentos.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamentos.')
  } finally {
    loading.value = false
  }
}

function irParaFechamento(id) {
  if (!id) return
  router.push({ path: '/vendas/nova-venda', query: { orcamentoId: String(id) } })
}

async function cancelarVenda(row) {
  if (!row?.venda?.id) return
  if (!can('vendas.editar') && !can('vendas.excluir')) {
    return notify.error('Acesso negado.')
  }

  const vendaId = row.venda.id
  const ok = window.confirm(
    `Você tem certeza que deseja cancelar/excluir a Venda #${vendaId} deste orçamento?`,
  )
  if (!ok) return

  try {
    // Exclui a venda para liberar o orçamento novamente
    await VendaService.remover(vendaId)
    notify.success('Venda cancelada/excluída.')
    await carregar()
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao cancelar venda.'
    notify.error(msg)
  }
}

onMounted(carregar)
</script>

