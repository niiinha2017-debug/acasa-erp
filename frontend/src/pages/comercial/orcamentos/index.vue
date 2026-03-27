<template>
  <PageShell :padded="false">
    <section class="ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Orçamentos"
        subtitle="Selecione um cliente para visualizar e comparar as versões de orçamento"
        icon="pi pi-file-edit"
      >
        <template #actions>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <SearchInput v-model="filtro" placeholder="Buscar cliente, documento, cidade..." class="min-w-[14rem]" />
            <Button variant="secondary" :loading="loading" @click="carregarClientes">
              <i class="pi pi-refresh" />
              Recarregar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 md:px-8 pb-8">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum cliente encontrado."
          :boxed="false"
          :flush="true"
        >
          <template #cell-cliente="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-[var(--ds-color-surface-muted)] flex items-center justify-center text-xs font-black text-text-muted">
                {{ String(row.nome_exibicao || '?').substring(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-semibold text-text-main truncate">{{ row.nome_exibicao }}</div>
                <div class="text-[11px] text-text-muted truncate">{{ row.documento || 'Sem documento' }}</div>
              </div>
            </div>
          </template>
          <template #cell-contato="{ row }">
            <div class="text-sm text-text-main">{{ row.contato_principal }}</div>
            <div class="text-[11px] text-text-muted">{{ row.email || '—' }}</div>
          </template>
          <template #cell-local="{ row }">
            <div class="text-sm text-text-main">{{ row.local_resumo }}</div>
          </template>
          <template #cell-acoes="{ row }">
            <button
              type="button"
              class="ds-table-action inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-semibold text-brand-primary hover:bg-[var(--ds-color-surface-muted)]"
              @click="abrirOrcamentos(row.id)"
            >
              <i class="pi pi-file-edit" />
              Ver orçamentos
            </button>
          </template>
        </Table>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService } from '@/services'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'clientes.ver' } })

const route = useRoute()
const router = useRouter()

const filtro = ref(String(route.query.q || ''))
const loading = ref(false)
const clientes = ref([])

const columns = [
  { key: 'cliente', label: 'CLIENTE' },
  { key: 'contato', label: 'CONTATO' },
  { key: 'local', label: 'LOCAL' },
  { key: 'acoes', label: '', align: 'right' },
]

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function getClienteNome(cliente) {
  return cliente?.nome_completo || cliente?.razao_social || cliente?.nome_fantasia || 'Cliente'
}

const filteredClients = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return clientes.value
  const digits = onlyDigits(termo)
  return clientes.value.filter((c) => {
    const texto = [getClienteNome(c), c.email, c.whatsapp, c.telefone, c.endereco, c.cidade, c.estado]
      .filter(Boolean).join(' ').toLowerCase()
    if (texto.includes(termo)) return true
    if (!digits) return false
    return [c.cpf, c.cnpj, c.whatsapp, c.telefone].map(onlyDigits).some((v) => v.includes(digits))
  })
})

const rows = computed(() =>
  filteredClients.value.map((c) => ({
    ...c,
    nome_exibicao: getClienteNome(c),
    documento: c.cpf || c.cnpj || '',
    contato_principal: c.whatsapp || c.telefone || 'Sem telefone',
    email: c.email || '',
    local_resumo: [c.cidade, c.estado].filter(Boolean).join(' / ') || '—',
  })),
)

async function carregarClientes() {
  loading.value = true
  try {
    const { data } = await ClienteService.listar()
    clientes.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    notify.error('Falha ao carregar clientes.')
    clientes.value = []
  } finally {
    loading.value = false
  }
}

function abrirOrcamentos(clienteId) {
  const id = Number(clienteId)
  if (!id) return
  router.push(`/comercial/orcamentos/${id}`)
}

watch(filtro, (value) => {
  router.replace({ query: { ...route.query, q: value || undefined } })
})

onMounted(carregarClientes)
</script>
