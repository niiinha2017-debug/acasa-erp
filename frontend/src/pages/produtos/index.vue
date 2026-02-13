<template>
  <div class="login-font produtos-line-list w-full max-w-[1700px] mx-auto">
    <div class="relative overflow-hidden rounded-3xl border border-border-ui bg-bg-card shadow-2xl">
      <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>

      <PageHeader
        title="Insumos e Materiais"
        subtitle="Catalogo de materiais e controle de insumos"
        icon="pi pi-box"
        :showBack="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="w-full sm:w-64">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar material, referencia, marca ou fornecedor..."
                :bordered="true"
              />
            </div>

            <Button
              v-if="can('produtos.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="router.push('/produtos/novo')"
            >
              <i class="pi pi-plus mr-2 text-xs"></i>
              Novo Produto
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum produto encontrado."
        >
          <template #cell-nome_produto="{ row }">
            <div class="flex items-center gap-3 py-0.5">
              <div class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-xs">
                <img
                  v-if="String(row.imagem_url || '').trim()"
                  :src="row.imagem_url"
                  class="w-full h-full object-cover"
                  alt="Produto"
                />
                <span v-else>{{ String(row.nome_produto || '').substring(0, 2).toUpperCase() }}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {{ row.nome_produto || '-' }}
                </span>
                <span class="text-xs font-normal text-slate-500 truncate mt-0.5">
                  Ref {{ String(row.id || 0).padStart(4, '0') }} • {{ row.marca || 'Sem marca' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-valor_unitario="{ row }">
            <span class="text-sm text-slate-700 dark:text-slate-300 tabular-nums">
              {{ format.currency(row.valor_unitario) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'INATIVO'" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="w-full flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="produtos.editar"
                perm-delete="produtos.excluir"
                @edit="(id) => router.push(`/produtos/${id}`)"
                @delete="() => confirmarExcluirProduto(row)"
              />
            </div>
          </template>
        </Table>
      </div>
    </div>
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

import PageHeader from '@/components/ui/PageHeader.vue'
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
  { key: 'valor_unitario', label: 'VLR UNIT', width: '14%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '10%', align: 'center' },
  { key: 'acoes', label: 'ACOES', align: 'center', width: '220px' },
]

const filtrados = computed(() => {
  const f = String(filtro.value || '').trim().toUpperCase()
  if (!f) return produtos.value || []

  return (produtos.value || []).filter((p) => {
    const alvo = [
      p.nome_produto,
      p.fornecedor?.razao_social,
      p.fornecedor?.nome_fantasia,
      p.cor,
      p.medida,
      p.marca,
      p.id,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase()

    return alvo.includes(f)
  })
})

const rows = computed(() =>
  filtrados.value.map((p) => ({
    ...p,
    fornecedor_nome: p.fornecedor?.razao_social || p.fornecedor?.nome_fantasia || '-',
    valor_unitario: Number(p.valor_unitario || 0),
    status: String(p.status || 'INATIVO').toUpperCase(),
  })),
)

async function buscarDadosDoBanco(page = 1) {
  loading.value = true
  try {
    const resp = await api.get('/produtos', { params: { page, pageSize: 20 } })
    const payload = resp.data
    const arr = payload?.data ?? payload
    produtos.value = Array.isArray(arr) ? arr : []
    meta.value =
      payload?.meta || {
        page: 1,
        pageSize: 20,
        total: Array.isArray(arr) ? arr.length : 0,
        totalPages: 1,
      }
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
    `Deseja excluir o produto "${row?.nome_produto}"? Esta acao nao pode ser desfeita.`,
  )
  if (!ok) return

  try {
    await api.delete(`/produtos/${row.id}`)
    produtos.value = produtos.value.filter((p) => p.id !== row.id)
    notify.success('Produto excluido!')
  } catch (err) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (!can('produtos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }

  await buscarDadosDoBanco(meta.value.page)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.produtos-line-list :deep(.search-container input.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.produtos-line-list :deep(.search-container input.w-full:focus) {
  box-shadow: none;
}
</style>
