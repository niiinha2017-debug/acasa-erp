<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Insumos e Materiais"
        subtitle="Catálogo de materiais e controle de insumos"
        icon="pi pi-box"
        :show-back="false"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end [&>*]:min-h-10 [&>*]:sm:h-10">
            <!-- Barra de busca sempre livre -->
            <div class="w-full sm:w-64 order-1 sm:order-0 flex items-center">
              <SearchInput
                v-model="filtro"
                mode="search"
                placeholder="Buscar material, referência, marca ou fornecedor..."
              />
            </div>
            <!-- Aviso informativo (altura fixa para alinhar com busca/select/botão) -->
            <div class="hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 order-2 shrink-0">
              <i class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-sm flex-shrink-0"></i>
              <span class="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider whitespace-nowrap">
                Selecione o fornecedor para cadastrar produto
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
            <!-- Novo Produto (só habilita com fornecedor) -->
            <Button
              v-if="can('produtos.criar')"
              variant="primary"
              class="order-4 h-10 min-h-10 px-4"
              :disabled="!fornecedorSelecionado"
              @click="abrirNovoProduto"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Produto
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <!-- Aviso no mobile -->
        <div class="sm:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
          <i class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-sm flex-shrink-0"></i>
          <span class="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
            Selecione o fornecedor para cadastrar produto
          </span>
        </div>
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum produto encontrado."
          :boxed="false"
        >
          <template #cell-nome_produto="{ row }">
            <div class="flex items-center gap-3 py-1">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-text-muted text-xs bg-bg-page border border-border-ui overflow-hidden">
                <img
                  v-if="String(row.imagem_url || '').trim()"
                  :src="row.imagem_url"
                  class="w-full h-full object-cover"
                  alt="Produto"
                />
                <span v-else>{{ String(row.nome_produto || '').substring(0, 2).toUpperCase() }}</span>
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

          <template #cell-valor_unitario="{ row }">
            <span class="text-sm text-text-main tabular-nums">
              {{ format.currency(row.valor_unitario) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'INATIVO'" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
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
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { can } from '@/services/permissions'
import { FornecedorService } from '@/services/index'

definePage({ meta: { perm: 'produtos.ver' } })

const produtos = ref([])
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const loading = ref(false)
const router = useRouter()
const filtro = ref('')

const fornecedores = ref([])
const fornecedorSelecionado = ref(null)
const fornecedorOptions = computed(() =>
  (fornecedores.value || []).map((f) => ({ label: f.razao_social, value: f.id })),
)

function abrirNovoProduto() {
  if (!fornecedorSelecionado.value) return
  router.push(`/produtos/novo?fornecedor=${fornecedorSelecionado.value}`)
}

const columns = [
  { key: 'nome_produto', label: 'PRODUTO / REF', width: '34%' },
  { key: 'fornecedor_nome', label: 'FORNECEDOR', width: '24%' },
  { key: 'unidade', label: 'UN', width: '8%', align: 'center' },
  { key: 'valor_unitario', label: 'VLR UNIT', width: '14%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '10%', align: 'center' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '220px' },
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
    const params = { page, pageSize: 20 }
    if (fornecedorSelecionado.value) params.fornecedor_id = fornecedorSelecionado.value
    const resp = await api.get('/produtos', { params })
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
    `Deseja excluir o produto "${row?.nome_produto}"? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  try {
    await api.delete(`/produtos/${row.id}`)
    produtos.value = produtos.value.filter((p) => p.id !== row.id)
    notify.success('Produto excluído!')
  } catch (err) {
    notify.error('Erro ao excluir.')
  }
}

async function carregarFornecedores() {
  try {
    const res = await FornecedorService.listar()
    const data = res?.data ?? res
    fornecedores.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erro ao carregar fornecedores:', err)
  }
}

watch(fornecedorSelecionado, () => {
  buscarDadosDoBanco(1)
})

onMounted(async () => {
  if (!can('produtos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregarFornecedores()
  buscarDadosDoBanco(1)
})
</script>
