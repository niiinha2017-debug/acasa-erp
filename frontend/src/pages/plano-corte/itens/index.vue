<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Produtos Plano de Corte"
        subtitle="Cadastro de itens por fornecedor"
        icon="pi pi-box"
        :show-back="false"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end [&>*]:min-h-10 [&>*]:sm:h-10">
            <!-- Barra de busca sempre livre -->
            <div class="w-full sm:w-64 order-1 sm:order-0 flex items-center">
              <SearchInput
                v-model="busca"
                mode="search"
                placeholder="Buscar nome, marca ou cor..."
              />
            </div>
            <!-- Aviso informativo (altura fixa para alinhar com busca/select/botão) -->
            <div class="hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 order-2 shrink-0">
              <i class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-sm flex-shrink-0"></i>
              <span class="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider whitespace-nowrap">
                Selecione o fornecedor para listar e cadastrar itens
              </span>
            </div>
            <!-- Fornecedor (informativo) -->
            <div class="w-full sm:w-52 order-3 flex items-center">
              <SearchInput
                v-model="fornecedorSelecionado"
                mode="select"
                class="w-full"
                :options="fornecedorOptions"
                placeholder="Selecione o fornecedor"
              />
            </div>
            <!-- Cadastrar item (abre mesma tela de cadastro de produtos) -->
            <Button
              v-if="can('plano_corte.criar')"
              variant="primary"
              class="order-4 h-10 min-h-10 px-4"
              :disabled="!fornecedorSelecionado"
              @click="router.push(`/plano-corte/itens/novo?fornecedor=${fornecedorSelecionado}`)"
            >
              <i class="pi pi-plus mr-2"></i>
              Cadastrar item
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <!-- Aviso no mobile (no desktop já está no header) -->
        <div class="sm:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
          <i class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-sm flex-shrink-0"></i>
          <span class="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
            Selecione o fornecedor para listar e cadastrar itens
          </span>
        </div>

        <div class="flex items-center justify-between gap-4 mb-4">
          <span class="text-xs font-bold text-text-muted uppercase tracking-wider">
            Itens cadastrados
            <span v-if="fornecedorSelecionado"> (fornecedor selecionado)</span>
          </span>
          <Button
            v-if="fornecedorSelecionado"
            variant="ghost"
            size="sm"
            :loading="loading"
            @click="carregarItens"
          >
            Atualizar
          </Button>
        </div>

        <Table
          :columns="columns"
          :rows="rowsFiltradas"
          :loading="loading"
          empty-text="Nenhum item encontrado. Selecione um fornecedor e clique em Novo Item ou Atualizar."
          :boxed="false"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PlanoCorteService, FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const fornecedor = ref([])
const fornecedorSelecionado = ref(null)
const fornecedorOptions = computed(() =>
  fornecedor.value.map((f) => ({ label: f.razao_social || f.nome_fantasia, value: f.id }))
)
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
    const fornecedorId = fornecedorSelecionado.value ? Number(fornecedorSelecionado.value) : undefined
    const { data } = await PlanoCorteService.itens.listar(fornecedorId)
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

watch(fornecedorSelecionado, () => {
  carregarItens()
})

onMounted(async () => {
  const { data } = await FornecedorService.listar()
  fornecedor.value = data || []
  carregarItens()
})
</script>
