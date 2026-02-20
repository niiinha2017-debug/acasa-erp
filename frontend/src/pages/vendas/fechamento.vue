<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Venda"
        subtitle="Selecione um cliente e faça o fechamento da venda a partir dos orçamentos"
        icon="pi pi-shopping-cart"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-80 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar por nome do cliente..."
              />
            </div>
            <Button
              v-if="can('vendas.criar') && primeiroOrcamentoSemVenda"
              variant="primary"
              type="button"
              @click="irParaFechamento(primeiroOrcamentoSemVenda.id)"
            >
              <i class="pi pi-dollar text-sm mr-1" />
              Fechar venda
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-8">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft" />
        </div>

        <template v-else>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Orçamentos para venda"
              :value="orcamentos.length"
              icon="pi pi-file"
              color="slate"
            />
            <MetricCard
              label="Valor total listado"
              :value="format.currency(valorTotalGeral)"
              icon="pi pi-dollar"
              color="emerald"
            />
            <MetricCard
              label="Clientes"
              :value="grupos.length"
              icon="pi pi-users"
              color="blue"
            />
          </div>

          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">
              Clientes com orçamentos (para venda)
            </h2>
            <div
              v-if="gruposFiltrados.length > 0"
              class="rounded-xl border border-border-ui bg-bg-page/50 px-4 py-2 flex justify-between items-center"
            >
              <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">Valor total da lista</span>
              <span class="text-lg font-black text-text-main">{{ format.currency(valorTotalLista) }}</span>
            </div>
            <div
              v-if="gruposFiltrados.length === 0"
              class="rounded-xl border border-border-ui bg-bg-page py-12 text-center"
            >
              <p class="text-text-soft text-sm">
                {{ filtro ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente com orçamento para venda.' }}
              </p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="grupo in gruposFiltrados"
                :key="grupo.clienteId"
                class="rounded-xl border border-border-ui bg-bg-page px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-10 h-10 rounded-lg bg-bg-card border border-border-ui flex items-center justify-center text-text-main font-black text-sm flex-shrink-0"
                  >
                    {{ grupo.orcamentos.length }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black text-text-main uppercase tracking-tight truncate">
                      {{ grupo.clienteNome }}
                    </p>
                    <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                      {{ grupo.orcamentos.length }} orçamento(s) · {{ format.currency(grupo.total) }}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  class="flex-shrink-0 rounded-xl font-black uppercase tracking-wider text-[10px]"
                  @click="router.push(`/vendas/cliente/${grupo.clienteId}`)"
                >
                  <i class="pi pi-list mr-1" />
                  Abrir lista
                </Button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { OrcamentosService } from '@/services'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'vendas.criar' } })

const router = useRouter()
const loading = ref(false)
const orcamentos = ref([])
const filtro = ref('')

const grupos = computed(() => {
  const map = {}
  ;(orcamentos.value || []).forEach((orc) => {
    const cliId = orc.cliente_id ?? 'avulso'
    if (!map[cliId]) {
      map[cliId] = {
        clienteId: cliId,
        clienteNome:
          orc.cliente?.nome_completo || orc.cliente?.razao_social || orc.cliente_nome_snapshot || 'Cliente não identificado',
        orcamentos: [],
        total: 0,
      }
    }
    map[cliId].orcamentos.push(orc)
    map[cliId].total += Number(orc.total_itens ?? orc.valor_total ?? 0)
  })
  return Object.values(map).sort((a, b) => (b.orcamentos[0]?.id || 0) - (a.orcamentos[0]?.id || 0))
})

const gruposFiltrados = computed(() => {
  const termo = String(filtro.value || '').trim().toLowerCase()
  if (!termo) return grupos.value
  return grupos.value.filter((g) => (g.clienteNome || '').toLowerCase().includes(termo))
})

const valorTotalGeral = computed(() =>
  orcamentos.value.reduce((acc, r) => acc + Number(r.total_itens ?? r.valor_total ?? 0), 0)
)

const valorTotalLista = computed(() =>
  gruposFiltrados.value.reduce((acc, g) => acc + Number(g.total || 0), 0)
)

const primeiroOrcamentoSemVenda = computed(() => {
  const lista = orcamentos.value || []
  return lista.find((o) => !o.venda) ?? null
})

function irParaFechamento(id) {
  if (!id) return
  router.push({ path: '/vendas/nova-venda', query: { orcamentoId: String(id) } })
}

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

onMounted(carregar)
</script>
