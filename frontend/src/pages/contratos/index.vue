<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Contratos"
        subtitle="Gestão de contratos comerciais"
        icon="pi pi-file"
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
              v-if="can('contratos.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="router.push('/contratos/novo')"
            >
              <i class="pi pi-plus mr-2" />
              Novo Contrato
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-8">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft" />
        </div>

        <template v-else>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total de Contratos"
              :value="contratos.length"
              icon="pi pi-file"
              color="slate"
            />
            <MetricCard
              label="Valor Total"
              :value="format.currency(valorTotalGeral)"
              icon="pi pi-dollar"
              color="emerald"
            />
            <MetricCard
              label="Vigentes"
              :value="contratos.filter((c) => String(c.status).toUpperCase() === 'VIGENTE').length"
              icon="pi pi-check-circle"
              color="blue"
            />
            <MetricCard
              label="Encerrados"
              :value="contratos.filter((c) => String(c.status).toUpperCase() === 'ENCERRADO').length"
              icon="pi pi-lock"
              color="amber"
            />
          </div>

          <div class="space-y-3">
            <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">
              Clientes com contratos
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
                {{ filtro ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente com contrato.' }}
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
                    {{ grupo.contratos.length }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black text-text-main uppercase tracking-tight truncate">
                      {{ grupo.clienteNome }}
                    </p>
                    <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                      {{ grupo.contratos.length }} contrato(s) · {{ format.currency(grupo.total) }}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  class="flex-shrink-0 rounded-xl font-black uppercase tracking-wider text-[10px]"
                  @click="router.push(`/contratos/cliente/${grupo.clienteId}`)"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { ContratosService } from '@/services/index'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'contratos.ver' } })

const router = useRouter()
const loading = ref(false)
const contratos = ref([])
const filtro = ref('')

const grupos = computed(() => {
  const map = {}
  ;(contratos.value || []).forEach((c) => {
    const cliId = c.cliente_id ?? 'avulso'
    if (!map[cliId]) {
      map[cliId] = {
        clienteId: cliId,
        clienteNome:
          c.cliente?.nome_completo || c.cliente?.razao_social || c.cliente?.nome || 'Cliente não identificado',
        contratos: [],
        total: 0,
      }
    }
    map[cliId].contratos.push(c)
    map[cliId].total += Number(c.valor || 0)
  })
  return Object.values(map).sort((a, b) => (b.contratos[0]?.id || 0) - (a.contratos[0]?.id || 0))
})

const gruposFiltrados = computed(() => {
  const termo = String(filtro.value || '').trim().toLowerCase()
  if (!termo) return grupos.value
  return grupos.value.filter((g) => (g.clienteNome || '').toLowerCase().includes(termo))
})

const valorTotalGeral = computed(() =>
  contratos.value.reduce((acc, c) => acc + Number(c.valor || 0), 0)
)

const valorTotalLista = computed(() =>
  gruposFiltrados.value.reduce((acc, g) => acc + Number(g.total || 0), 0)
)

async function carregar() {
  if (!can('contratos.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await ContratosService.listar()
    contratos.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar contratos.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!can('contratos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregar()
})
</script>
