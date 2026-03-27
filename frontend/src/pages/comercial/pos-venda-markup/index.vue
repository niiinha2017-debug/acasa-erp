<template>
  <PageShell :padded="false">
    <section class="pos-venda-markup-index ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Markup pós-venda"
        subtitle="Selecione um cliente para ver parcelas do contrato, comissão, taxas, NF e valor líquido"
        icon="pi pi-percentage"
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

      <div class="pos-venda-markup-index__content ds-page-context__content">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum cliente encontrado."
          :boxed="false"
          :flush="true"
        >
          <template #cell-cliente="{ row }">
            <div class="pos-venda-markup-index__identity">
              <div class="pos-venda-markup-index__initials">
                {{ String(row.nome_exibicao || '?').substring(0, 2).toUpperCase() }}
              </div>
              <div class="pos-venda-markup-index__identity-copy">
                <div class="pos-venda-markup-index__primary">{{ row.nome_exibicao }}</div>
                <div class="pos-venda-markup-index__secondary">{{ row.documento || 'Sem documento' }}</div>
              </div>
            </div>
          </template>
          <template #cell-contato="{ row }">
            <div class="pos-venda-markup-index__stack">
              <div class="pos-venda-markup-index__primary">{{ row.contato_principal }}</div>
              <div class="pos-venda-markup-index__secondary">{{ row.email || '—' }}</div>
            </div>
          </template>
          <template #cell-local="{ row }">
            <div class="pos-venda-markup-index__stack">
              <div class="pos-venda-markup-index__primary">{{ row.local_resumo }}</div>
              <div class="pos-venda-markup-index__secondary pos-venda-markup-index__secondary--clamp">{{ row.endereco_resumo }}</div>
            </div>
          </template>
          <template #cell-status="{ row }">
            <span class="ds-status-pill" :class="row.status_class">{{ row.status_label }}</span>
          </template>
          <template #cell-acoes="{ row }">
            <div class="ds-table-actions pos-venda-markup-index__actions-cell">
              <button
                type="button"
                class="ds-table-action pos-venda-markup-index__open-action"
                @click="abrirMarkup(row.id)"
              >
                <i class="pi pi-percentage ds-table-action__icon" />
                Abrir markup
              </button>
            </div>
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
import { getStatusVendaOperacionalLabel } from '@/constantes'
import { normalizarStatusCliente } from '@/constantes/pipeline-cliente'

definePage({ meta: { perm: 'clientes.ver' } })

const route = useRoute()
const router = useRouter()

const filtro = ref(String(route.query.q || ''))
const loading = ref(false)
const clientes = ref([])

const columns = [
  { key: 'cliente', label: 'CLIENTE', width: '34%' },
  { key: 'contato', label: 'CONTATO', width: '20%' },
  { key: 'local', label: 'LOCAL', width: '25%' },
  { key: 'status', label: 'STATUS', width: '11%' },
  { key: 'acoes', label: '', align: 'right', width: '10%' },
]

const filteredClients = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return clientes.value

  const digits = onlyDigits(termo)
  return clientes.value.filter((cliente) => {
    const texto = [
      getClienteNome(cliente),
      cliente.email,
      cliente.whatsapp,
      cliente.telefone,
      cliente.endereco,
      cliente.cidade,
      cliente.estado,
      getStatusLabel(cliente.status),
      normalizeStatusKey(cliente.status),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (texto.includes(termo)) return true
    if (!digits) return false
    return [cliente.cpf, cliente.cnpj, cliente.whatsapp, cliente.telefone]
      .map(onlyDigits)
      .some((valor) => valor.includes(digits))
  })
})

const rows = computed(() =>
  filteredClients.value.map((cliente) => ({
    ...cliente,
    nome_exibicao: getClienteNome(cliente),
    documento: cliente.cpf || cliente.cnpj || '',
    contato_principal: cliente.whatsapp || cliente.telefone || 'Sem telefone',
    email: cliente.email || '',
    local_resumo: [cliente.cidade, cliente.estado].filter(Boolean).join(' / ') || '—',
    endereco_resumo: [cliente.endereco, cliente.numero, cliente.bairro].filter(Boolean).join(', ') || '—',
    status_label: getStatusLabel(cliente.status),
    status_class: getFluxoClass(cliente.status),
  })),
)

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeStatusKey(value) {
  try {
    return String(normalizarStatusCliente(value || '') || '').toUpperCase()
  } catch {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
  }
}

function getClienteNome(cliente) {
  return cliente?.nome_completo || cliente?.razao_social || cliente?.nome_fantasia || 'Cliente'
}

function getStatusLabel(status) {
  return getStatusVendaOperacionalLabel(normalizeStatusKey(status)) || 'Sem status'
}

function getFluxoClass(status) {
  const key = normalizeStatusKey(status)
  const mapa = {
    CLIENTE_CADASTRADO: 'ds-status-pill--neutral',
    MEDIDA_AGENDADA: 'ds-status-pill--warning',
    ORCAMENTO_APROVADO: 'ds-status-pill--success',
    VENDA_FECHADA: 'ds-status-pill--success',
    EM_PRODUCAO: 'ds-status-pill--warning',
    EM_MONTAGEM: 'ds-status-pill--warning',
  }
  return mapa[key] || 'ds-status-pill--neutral'
}

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

function abrirMarkup(clienteId) {
  const id = Number(clienteId)
  if (!id) return
  router.push(`/comercial/pos-venda-markup/${id}`)
}

watch(filtro, (value) => {
  router.replace({ query: { ...route.query, q: value || undefined } })
})

onMounted(carregarClientes)
</script>

<style scoped>
.pos-venda-markup-index__content {
  padding: 0 2rem 2rem;
}

.pos-venda-markup-index__identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.pos-venda-markup-index__initials {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.85rem;
  background: var(--ds-color-surface-muted);
  color: var(--ds-color-text-soft);
  font-size: 0.74rem;
  font-weight: 800;
}

.pos-venda-markup-index__identity-copy,
.pos-venda-markup-index__stack {
  min-width: 0;
}

.pos-venda-markup-index__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-venda-markup-index__secondary {
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  line-height: 1.45;
}

.pos-venda-markup-index__secondary--clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pos-venda-markup-index__actions-cell {
  width: 100%;
  justify-content: flex-end;
}

.pos-venda-markup-index__open-action {
  color: var(--ds-color-primary);
  font-size: 0.78rem;
  font-weight: 700;
}

.pos-venda-markup-index__open-action:hover {
  background: rgba(44, 111, 163, 0.08);
}

@media (max-width: 767px) {
  .pos-venda-markup-index__content {
    padding: 0 1rem 1.5rem;
  }
}
</style>
