<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    
    <PageHeader 
      title="Vendas"
      subtitle="Gestão comercial e acompanhamento de pedidos"
      icon="pi pi-shopping-cart"
    >
      <template #actions>
        <Button 
          v-if="can('vendas.criar')"
          variant="primary" 
          @click="router.push('/vendas/novo')"
        >
          <i class="pi pi-plus mr-2"></i>
          Nova Venda
        </Button>
      </template>
    </PageHeader>

    <!-- Métricas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total de Vendas"
        :value="vendas.length"
        icon="pi pi-shopping-bag"
        color="slate"
      />
      
      <MetricCard
        label="Faturamento Total"
        :value="format.currency(vendas.reduce((acc, v) => acc + Number(v.valor_vendido || 0), 0))"
        icon="pi pi-dollar"
        color="emerald"
      />

      <MetricCard
        label="Ticket Médio"
        :value="format.currency(vendas.length ? (vendas.reduce((acc, v) => acc + Number(v.valor_vendido || 0), 0) / vendas.length) : 0)"
        icon="pi pi-chart-line"
        color="blue"
      />

      <MetricCard
        label="Em Produção"
        :value="vendas.filter(v => String(v.status).toUpperCase().includes('PRODU')).length"
        icon="pi pi-cog"
        color="amber"
      />
    </div>

    <!-- Filtros e Tabela -->
    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar cliente, status ou ID..."
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
                {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome || 'Consumidor' }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {{ row.cliente?.cpf || row.cliente?.cnpj || 'Sem documento' }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" />
          </template>

          <template #cell-valor_total="{ row }">
            <div class="flex flex-col items-end">
              <span class="text-sm font-black text-slate-800 tabular-nums">
                {{ format.currency(row.valor_total) }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Valor Final</span>
            </div>
          </template>

          <template #cell-data_venda="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-700">
                {{ format.date(row.data_venda) }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Data Venda</span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <TableActions
              :can-edit="can('vendas.editar')"
              :can-delete="can('vendas.excluir')"
              @edit="router.push(`/vendas/${row.id}`)"
              @delete="confirmarExcluirVenda(row.id)"
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
import api from '@/services/api'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'vendas.ver' } })

const router = useRouter()
const loading = ref(false)
const deletandoId = ref(null)
const vendas = ref([])
const filtro = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'cliente', label: 'CLIENTE', width: '35%' },
  { key: 'status', label: 'SITUAÇÃO', width: '15%', align: 'center' },
  { key: 'forma_pagamento_chave', label: 'PAGAMENTO', width: '15%' },
  { key: 'data_venda', label: 'DATA', width: '15%' },
  { key: 'valor_total', label: 'TOTAL', align: 'right', width: '15%' },
  { key: 'acoes', label: '', width: '100px', align: 'right' },
]

const filtradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return vendas.value

  return vendas.value.filter((v) => {
    const cli = v?.cliente || {}
    const cliente = String(cli.nome_completo || cli.razao_social || cli.nome || '').toLowerCase()
    const status = String(v?.status || '').toLowerCase()
    const pag = String(v?.forma_pagamento_chave || '').toLowerCase()
    const id = String(v?.id || '').toLowerCase()

    return cliente.includes(f) || status.includes(f) || pag.includes(f) || id.includes(f)
  })
})

async function carregar() {
  if (!can('vendas.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/vendas')
    vendas.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar vendas.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluirVenda(id) {
  if (!can('vendas.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir Venda',
    `Deseja excluir a Venda #${id}? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  await excluir(id)
}

async function excluir(id) {
  if (!can('vendas.excluir')) return notify.error('Acesso negado.')
  deletandoId.value = id
  try {
    await api.delete(`/vendas/${id}`)
    await carregar()
    notify.success('Venda removida.')
  } catch (e) {
    notify.error('Erro ao excluir.')
  } finally {
    deletandoId.value = null
  }
}

onMounted(async () => {
  if (!can('vendas.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregar()
})
</script>
