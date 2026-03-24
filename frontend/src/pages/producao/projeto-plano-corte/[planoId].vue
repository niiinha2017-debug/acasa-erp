<template>
  <PageShell :padded="false">
    <section class="projeto-plano-corte-detail ds-page-context animate-page-in">
      <PageHeader
        :title="tituloPagina"
        :subtitle="subtituloPagina"
        icon="pi pi-sitemap"
      >
        <template #actions>
          <Button variant="ghost" size="sm" type="button" @click="router.push('/producao/projeto-plano-corte')">
            <i class="pi pi-arrow-left mr-2 text-xs" />
            Voltar
          </Button>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 pb-6 md:px-6 lg:px-8">
        <div v-if="loading" class="text-sm text-text-soft py-8">
          <i class="pi pi-spin pi-spinner mr-2" />
          Carregando projeto...
        </div>
        <div v-else-if="erro" class="ds-alert ds-alert--danger rounded-xl p-4 text-sm">
          {{ erro }}
        </div>
        <template v-else-if="plano">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div class="ds-shell-card p-4 space-y-2">
              <h3 class="text-sm font-black text-text-main uppercase tracking-wide">Resumo do projeto</h3>
              <p class="text-sm text-text-soft">Fornecedor: <strong class="text-text-main">{{ fornecedorNome }}</strong></p>
              <p class="text-sm text-text-soft">Status: <strong class="text-text-main">{{ plano.status || 'EM_PROCESSO' }}</strong></p>
              <p class="text-sm text-text-soft">Criado em: <strong class="text-text-main">{{ criadoEmFormatado }}</strong></p>
              <p class="text-sm text-text-soft">Valor total: <strong class="text-text-main">{{ valorTotalFormatado }}</strong></p>
            </div>
            <div class="ds-shell-card p-4 space-y-3">
              <h3 class="text-sm font-black text-text-main uppercase tracking-wide">Acoes</h3>
              <div class="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" @click="router.push(`/plano-corte/${plano.id}`)">
                  Abrir no legado
                </Button>
                <Button type="button" variant="secondary" @click="router.push('/plano-corte/venda')">
                  Criar novo
                </Button>
              </div>
              <p class="text-xs text-text-soft">
                Este projeto pertence ao novo hub de producao. O fluxo legado continua isolado em <code>/plano-corte</code>.
              </p>
            </div>
          </div>

          <div class="ds-shell-card p-4">
            <h3 class="text-sm font-black text-text-main uppercase tracking-wide mb-3">Itens do plano</h3>
            <Table
              :columns="columns"
              :rows="itens"
              empty-text="Nenhum item registrado neste plano."
              :boxed="false"
              :flush="false"
            >
              <template #cell-produto="{ row }">
                <span class="text-sm font-medium text-text-main">{{ row.item?.nome_produto || '-' }}</span>
              </template>
              <template #cell-quantidade="{ row }">
                <span class="text-sm text-text-main">{{ row.quantidade ?? 0 }}</span>
              </template>
              <template #cell-valor_total="{ row }">
                <span class="text-sm font-semibold text-text-main">{{ formatarMoeda(row.valor_total || 0) }}</span>
              </template>
            </Table>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlanoCorteService } from '@/services'

definePage({ meta: { perm: 'plano_corte.ver' } })

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const erro = ref('')
const plano = ref(null)

const planoId = computed(() => {
  const raw = String(route.params?.planoId || '')
  const clean = Number(raw.replace(/\D/g, ''))
  return Number.isFinite(clean) && clean > 0 ? clean : null
})

const itens = computed(() => {
  const list = plano.value?.produtos
  return Array.isArray(list) ? list : []
})

const fornecedorNome = computed(() => plano.value?.fornecedor?.nome_fantasia || 'Interno')
const tituloPagina = computed(() => `Projeto Plano de Corte #${planoId.value || '-'}`)
const subtituloPagina = computed(() => fornecedorNome.value)
const criadoEmFormatado = computed(() => formatarData(plano.value?.criado_em || plano.value?.created_at))
const valorTotalFormatado = computed(() => formatarMoeda(plano.value?.valor_total || 0))

const columns = [
  { key: 'produto', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd', width: '120px', align: 'center' },
  { key: 'valor_total', label: 'Total', width: '180px', align: 'right' },
]

function formatarData(valor) {
  if (!valor) return '-'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0))
}

async function carregar() {
  erro.value = ''
  loading.value = true
  try {
    if (!planoId.value) throw new Error('ID invalido.')
    const res = await PlanoCorteService.buscar(planoId.value)
    plano.value = res?.data ?? null
    if (!plano.value) throw new Error('Projeto nao encontrado.')
  } catch (e) {
    plano.value = null
    erro.value = e?.response?.data?.message || e?.message || 'Nao foi possivel carregar o projeto.'
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
