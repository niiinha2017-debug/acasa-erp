<template>
  <PageShell :padded="false">
    <section class="plano-corte-itens-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Produtos Serviço de Corte"
        subtitle="Cadastro de itens por fornecedor"
        icon="pi pi-box"
        :show-back="false"
      >
        <template #actions>
          <div class="plano-corte-itens-list__actions ds-page-context__actions">
            <div class="plano-corte-itens-list__search ds-page-context__search">
              <SearchInput
                v-model="busca"
                mode="search"
                placeholder="Buscar nome, marca, cor ou medida..."
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              :loading="loading"
              @click="carregarItens"
            >
              Atualizar
            </Button>
            <Button
              v-if="can('plano_corte.criar')"
              variant="primary"
              @click="router.push('/plano-corte/itens/novo')"
            >
              <i class="pi pi-plus"></i>
              Cadastrar Item
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="plano-corte-itens-list__content ds-page-context__content">
        <Table
          :columns="columns"
          :rows="rowsFiltradas"
          :loading="loading"
          empty-text="Nenhum item encontrado."
          :boxed="false"
          :flush="false"
        >
          <template #cell-nome_produto="{ row }">
            <div class="flex items-center gap-3 py-1">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-text-muted text-xs bg-bg-page border border-border-ui overflow-hidden">
                <span>{{ String(row.nome_produto || '').substring(0, 2).toUpperCase() }}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-bold text-text-main uppercase tracking-tight truncate">
                  {{ row.nome_produto || '-' }}
                </span>
                <span class="text-[10px] font-medium text-text-muted truncate">
                  Ref {{ String(row.id || 0).padStart(4, '0') }} • {{ row.marca || 'Sem marca' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-unidade="{ row }">
            <span class="text-sm text-text-main">{{ row.unidade || '-' }}</span>
          </template>

          <template #cell-preco_m2="{ row }">
            <span class="text-sm text-text-main tabular-nums">
              {{ format.currency(row.preco_m2) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'INATIVO'" />
          </template>

          <template #cell-quantidade="{ row }">
            <span class="text-sm text-text-main tabular-nums">{{ row.quantidade ?? 0 }}</span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="plano_corte.editar"
                perm-delete="plano_corte.excluir"
                @edit="() => router.push(`/plano-corte/itens/${row.id}`)"
                @delete="() => excluir(row)"
              />
            </div>
          </template>
        </Table>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlanoCorteService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const busca = ref('')
const loading = ref(false)
const itens = ref([])
const deletingId = ref(null)

const columns = [
  { key: 'nome_produto', label: 'PRODUTO / REF', width: '24%' },
  { key: 'marca', label: 'MARCA', width: '12%' },
  { key: 'cor', label: 'COR', width: '10%' },
  { key: 'medida', label: 'MEDIDA', width: '10%' },
  { key: 'unidade', label: 'UN', width: '6%', align: 'center' },
  { key: 'quantidade', label: 'QTD. CORTE', width: '8%', align: 'center' },
  { key: 'preco_m2', label: 'PREÇO M²', width: '10%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '8%', align: 'center' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '120px' },
]

const rowsFiltradas = computed(() => {
  const q = String(busca.value || '').trim().toUpperCase()
  if (!q) return itens.value
  return itens.value.filter((r) => {
    const s = `${r.nome_produto || ''} ${r.marca || ''} ${r.cor || ''} ${r.medida || ''}`.toUpperCase()
    return s.includes(q)
  })
})

async function carregarItens() {
  if (!can('plano_corte.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await PlanoCorteService.itens.listar()
    itens.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao carregar itens.')
  } finally {
    loading.value = false
  }
}

async function excluir(row) {
  if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Item', 'Deseja excluir este item?')
  if (!ok) return
  deletingId.value = row.id
  try {
    await PlanoCorteService.itens.remover(row.id)
    notify.success('Item removido!')
    await carregarItens()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao remover.')
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  carregarItens()
})
</script>
