<template>
  <div class="w-full max-w-[1700px] mx-auto space-y-6">

    <PageHeader 
      title="Insumos & Materiais" 
      subtitle="Catálogo de materiais e controle de insumos"
      icon="pi pi-box"
    >
      <template #actions>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-full sm:w-72">
            <SearchInput
              v-model="filtro"
              placeholder="Buscar material, referência ou marca..."
              :bordered="true"
            />
          </div>
          
          <Button
            v-if="can('produtos.criar')"
            variant="primary"
            class="flex-shrink-0"
            @click="router.push('/produtos/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Produto
          </Button>
        </div>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        label="Total de Itens"
        :value="totalItens"
        icon="pi pi-list"
        color="slate"
      />
      <MetricCard
        label="Produtos Ativos"
        :value="totalAtivos"
        icon="pi pi-check-circle"
        color="blue"
      />
    </div>

    <Table
      :columns="columns"
      :rows="rows"
      :loading="loading"
      empty-text="Nenhum produto encontrado."
    >
      <template #cell-nome_produto="{ row }">
        <div class="flex items-center gap-3 py-0.5">
          <div class="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img
              v-if="String(row.imagem_url || '').trim()"
              :src="row.imagem_url"
              class="w-full h-full object-cover"
              alt="Prod"
            />
            <span v-else class="font-bold text-slate-300 text-xs uppercase">
              {{ String(row.nome_produto || '').substring(0, 2) }}
            </span>
          </div>

          <div class="flex flex-col min-w-0">
            <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ row.nome_produto }}
            </span>
            <span class="text-xs font-medium text-slate-500 truncate mt-0.5">
              Ref: {{ String(row.id || 0).padStart(4, '0') }} • {{ row.marca || 'S/ Marca' }}
            </span>
          </div>
        </div>
      </template>

      <!-- ✅ Valor Unitário -->
      <template #cell-valor_unitario="{ row }">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
          {{ format.currency(row.valor_unitario) }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge
          :value="row.status || 'INATIVO'"
        />
      </template>

      <template #cell-acoes="{ row }">
        <TableActions
          :id="row.id"
          perm-edit="produtos.editar"
          perm-delete="produtos.excluir"
          @edit="(id) => router.push(`/produtos/${id}`)"
          @delete="() => confirmarExcluirProduto(row)"
        />
      </template>
    </Table>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { can } from '@/services/permissions'

// UI Components
import PageHeader from '@/components/ui/PageHeader.vue'
import MetricCard from '@/components/ui/MetricCard.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import TableActions from '@/components/ui/TableActions.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

definePage({ meta: { perm: 'produtos.ver' } })


const produtos = ref([])
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const loading = ref(false)
const router = useRouter()
const filtro = ref('')

const columns = [
  { key: 'nome_produto', label: 'PRODUTO / REF', width: '34%' },
  { key: 'fornecedor_nome', label: 'FORNECEDOR', width: '24%' },
  { key: 'unidade', label: 'UN', width: '8%', align: 'center' },

  // ✅ só valor unitário
  { key: 'valor_unitario', label: 'VLR UNIT', width: '14%', align: 'right' },

  { key: 'status', label: 'STATUS', width: '10%', align: 'center' },
  { key: 'acoes', label: '', width: '10%', align: 'right' }
]

const filtrados = computed(() => {
  const f = String(filtro.value || '').trim().toUpperCase()
  if (!f) return produtos.value || []

  return (produtos.value || []).filter((p) => {
    const nome = String(p.nome_produto || '').toUpperCase()
    const fornecedor = String(p.fornecedor?.razao_social || p.fornecedor?.nome_fantasia || '').toUpperCase()
    const cor = String(p.cor || '').toUpperCase()
    const medida = String(p.medida || '').toUpperCase() // “metragem”/medida
    const marca = String(p.marca || '').toUpperCase()   // opcional, mas ajuda
    const id = String(p.id || '').toUpperCase()

    const alvo = `${nome} ${fornecedor} ${cor} ${medida} ${marca} ${id}`

    return alvo.includes(f)
  })
})


const rows = computed(() => {
  return filtrados.value.map((p) => ({
    ...p,
    fornecedor_nome: p.fornecedor?.razao_social || p.fornecedor?.nome_fantasia || '-',
    valor_unitario: Number(p.valor_unitario || 0),
  }))
})

const totalItens = computed(() => filtrados.value.length)
const totalAtivos = computed(() => filtrados.value.filter(p => p.status === 'ATIVO').length)

async function buscarDadosDoBanco(page = 1) {
  loading.value = true
  try {
    const resp = await api.get('/produtos', { params: { page, pageSize: 20 } })
    const payload = resp.data
    const arr = payload?.data ?? payload
    produtos.value = Array.isArray(arr) ? arr : []
    meta.value = payload?.meta || { page: 1, pageSize: 20, total: Array.isArray(arr) ? arr.length : 0, totalPages: 1 }
  } catch (err) {
    console.error('Erro ao buscar produtos:', err?.response || err)
    notify.error('Erro ao carregar produtos.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluirProduto(row) {
  if (!can('produtos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Produto',
    `Deseja excluir o produto "${row?.nome_produto}"? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return

  try {
    await api.delete(`/produtos/${row.id}`)
    produtos.value = produtos.value.filter(p => p.id !== row.id)
    notify.success('Produto excluído!')
  } catch (err) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (!can('produtos.ver')) {
    notify.error('Acesso negado.')
    router.push('/') // ou '/produtos' se preferir voltar pra lista, mas aqui é a própria
    return
  }

  await buscarDadosDoBanco(meta.value.page)
})

async function goToPage(p) {
  if (!p || p < 1 || p > meta.value.totalPages) return
  await buscarDadosDoBanco(p)
}

</script>
