<template>
    <PageHeader 
      title="Plano de Corte"
      subtitle="Industrialização e controle de produção"
      icon="pi pi-box"
    >
      <template #actions>
        <div class="flex gap-2">
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
            @click="novo()"
            >
            <i class="pi pi-plus mr-2"></i>
            Novo Plano
            </Button>
        </div>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Planos Ativos"
        :value="rows.length"
        icon="pi pi-cog"
        color="slate"
      />
      
      <MetricCard
        label="Vínculados a Vendas"
        :value="rows.filter(r => r.venda_id).length"
        icon="pi pi-shopping-cart"
        color="blue"
      />
      
      <MetricCard
        label="Avg. Chapas/Plano"
        :value="mediaChapas"
        icon="pi pi-th-large"
        color="emerald"
      />

       <MetricCard
        label="Finalizados"
        :value="rows.filter(r => r.status === 'FINALIZADO').length"
        icon="pi pi-check"
        color="amber"
      />
    </div>

    <div class="space-y-4">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="w-full md:w-96">
            <SearchInput
            v-model="busca"
            placeholder="Buscar fornecedor ou lote..."
            />
        </div>
        <div class="w-full md:w-48">
             <input
                v-model="mesFiltro"
                type="month"
                class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all text-slate-600 uppercase"
            />
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhum plano de corte encontrado."
          :boxed="false"
        >
          <template #cell-fornecedor="{ row }">
             <div class="flex flex-col py-1">
               <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">
                 {{ row.fornecedor?.nome_fantasia || 'Interno' }}
               </span>
               <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider" v-if="row.venda_id">
                 Venda #{{ row.venda_id }}
               </span>
             </div>
          </template>

          <template #cell-chapas="{ row }">
            <span class="text-sm font-black text-slate-800 tabular-nums">{{ row.chapas_qtd || 0 }}</span>
          </template>

          <template #cell-data="{ row }">
            <span class="text-xs font-bold text-slate-700">{{ format.date(row.created_at) }}</span>
          </template>

          <template #cell-status="{ row }">
             <StatusBadge :value="row.status || 'EM_PROCESSO'" />
          </template>

          <template #cell-acoes="{ row }">
             <TableActions
                :can-edit="can('plano_corte.editar')"
                :can-delete="can('plano_corte.excluir')"
                @edit="router.push(`/plano-corte/${row.id}`)"
                @delete="confirmarExcluir(row)"
              />
          </template>
        </Table>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { can } from '@/services/permissions' 
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import api from '@/services/api'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const busca = ref('')
const mesFiltro = ref('')

// Inicia com mês atual
const hoje = new Date()
const mes = String(hoje.getMonth() + 1).padStart(2, '0')
const ano = hoje.getFullYear()
mesFiltro.value = `${ano}-${mes}`

const columns = [
  { key: 'fornecedor', label: 'FORNECEDOR / ORIGEM', width: '40%' },
  { key: 'chapas', label: 'CHAPAS', width: '15%', align: 'center' },
  { key: 'data', label: 'DATA', width: '15%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '15%' }
]

const filtradas = computed(() => {
  const f = String(busca.value || '').toLowerCase().trim()
  
  return rows.value.filter(r => {
    // Filtro mês (básico)
    const dataRow = r.created_at ? r.created_at.substring(0, 7) : ''
    if (mesFiltro.value && dataRow !== mesFiltro.value) return false

    if (!f) return true
    
    const forn = String(r.fornecedor?.nome_fantasia || '').toLowerCase()
    const lote = String(r.lote || '').toLowerCase()
    return forn.includes(f) || lote.includes(f)
  })
})

const mediaChapas = computed(() => {
    if (rows.value.length === 0) return 0
    const total = rows.value.reduce((a, b) => a + Number(b.chapas_qtd || 0), 0)
    return Math.round(total / rows.value.length)
})

async function carregar() {
  if (!can('plano_corte.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/plano-corte')
    rows.value = Array.isArray(data) ? data : []
  } catch(e) {
    notify.error('Erro ao listar planos de corte.')
  } finally {
    loading.value = false
  }
}

function novo() {
    router.push('/plano-corte/novo')
}

async function confirmarExcluir(row) {
    if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')
    const ok = await confirm.show('Excluir Plano', 'Deseja remover este plano de corte?')
    if (ok) {
        try {
            await api.delete(`/plano-corte/${row.id}`)
            notify.success('Plano removido.')
            carregar()
        } catch {
            notify.error('Erro ao remover.')
        }
    }
}

onMounted(carregar)
</script>
