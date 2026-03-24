<template>
  <PageShell :padded="false">
    <section class="clientes-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Clientes"
        subtitle="Gestão de relacionamento e base de contatos"
        icon="pi pi-users"
      >
        <template #actions>
          <div class="clientes-list__actions ds-page-context__actions">
            <div class="clientes-list__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar cliente, documento, email ou endereço..."
              />
            </div>

            <Button
              v-if="can('clientes.criar')"
              variant="primary"
              @click="router.push('/clientes/novo')"
            >
              <i class="pi pi-plus"></i>
              Novo Cliente
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="clientes-list__content ds-page-context__content">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum cliente encontrado."
          :boxed="false"
          :flush="false"
        >
          <template #cell-nome_completo="{ row }">
            <div class="clientes-list__identity">
              <div class="clientes-list__initials">
                {{ String(row.nome_exibicao || '?').substring(0, 2).toUpperCase() }}
              </div>
              <div class="clientes-list__identity-copy">
                <span class="clientes-list__primary">
                  {{ row.nome_exibicao }}
                </span>
                <span class="clientes-list__secondary">
                  {{ row.documento || 'Sem documento' }}
                  <span v-if="row.email" class="clientes-list__secondary-detail">{{ row.email }}</span>
                </span>
              </div>
            </div>
          </template>

          <template #cell-endereco="{ row }">
            <div class="clientes-list__stack">
              <span class="clientes-list__primary">{{ row.endereco_resumo }}</span>
              <span class="clientes-list__secondary">
                {{ [row.cidade, row.estado].filter(Boolean).join(' / ') || '-' }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span
              class="ds-status-pill"
              :class="row.fluxo_comercial_class"
            >
              {{ row.fluxo_comercial || 'Cadastro' }}
            </span>
          </template>

          <template #cell-situacao="{ row }">
            <StatusBadge :value="row.situacao || 'INATIVO'" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="clientes.editar"
                perm-delete="clientes.excluir"
                @edit="(id) => editarCliente(id)"
                @delete="() => excluirCliente(row)"
              />
            </div>
          </template>
        </Table>
        <TablePagination
          v-if="total > 0"
          :page="page"
          :page-size="pageSize"
          :total="total"
          @update:page="setPage"
        />
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { onlyNumbers } from '@/utils/masks'
import { usePagination } from '@/composables/usePagination'
import { getStatusVendaOperacionalLabel, getStatusVendaSubetapa } from '@/constantes'

definePage({ meta: { perm: 'clientes.ver' } })

const router = useRouter()
const filtro = ref('')
const loading = ref(false)
const clientes = ref([])

const columns = [
  { key: 'nome_completo', label: 'Cliente', width: '36%' },
  { key: 'endereco', label: 'Endereco', width: '23%' },
  { key: 'status', label: 'Fluxo comercial', width: '16%' },
  { key: 'situacao', label: 'Situacao', width: '13%' },
  { key: 'acoes', label: 'Acoes', align: 'center', width: '12%' },
]

const filtrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return clientes.value || []

  const termoDigits = onlyNumbers(termo)

  return (clientes.value || []).filter((c) => {
    const fluxoComercial = getStatusVendaOperacionalLabel(c.status || 'CLIENTE_CADASTRADO') || 'Cadastro'
    const texto = [
      c.nome_completo,
      c.razao_social,
      c.email,
      c.whatsapp,
      c.endereco,
      c.numero,
      c.bairro,
      c.cidade,
      c.estado,
      c.status,
      fluxoComercial,
      c.situacao,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const cpfDigits = onlyNumbers(String(c.cpf || ''))
    const cnpjDigits = onlyNumbers(String(c.cnpj || ''))
    const whatsappDigits = onlyNumbers(String(c.whatsapp || ''))

    return (
      texto.includes(termo) ||
      (termoDigits
        ? (
            cpfDigits.includes(termoDigits) ||
            cnpjDigits.includes(termoDigits) ||
            whatsappDigits.includes(termoDigits)
          )
        : false)
    )
  })
})

const { page, setPage, total, totalPages, pageSize, rowsToShow } = usePagination(
  computed(() => filtrados.value),
  { pageSize: 15 },
)
watch(filtro, () => setPage(1))

function fluxoComercialClass(status) {
  const subetapa = getStatusVendaSubetapa(status || 'CLIENTE_CADASTRADO')
  const mapa = {
    CADASTRO: 'ds-status-pill--neutral',
    MEDIDA: 'ds-status-pill--warning',
    ORCAMENTO: 'ds-status-pill--warning',
    APRESENTACAO: 'ds-status-pill--warning',
    FECHAMENTO: 'ds-status-pill--success',
    MEDIDA_FINA: 'ds-status-pill--warning',
    PROJETO_TECNICO: 'ds-status-pill--warning',
    PRODUCAO: 'ds-status-pill--warning',
    MONTAGEM: 'ds-status-pill--warning',
    GARANTIA: 'ds-status-pill--warning',
    ASSISTENCIA: 'ds-status-pill--warning',
    MANUTENCAO: 'ds-status-pill--danger',
  }
  if (String(status || '').toUpperCase() === 'ENCERRADO') {
    return 'ds-status-pill--neutral'
  }
  return mapa[subetapa] || 'ds-status-pill--warning'
}

const rows = computed(() =>
  rowsToShow.value.map((c) => ({
    ...c,
    nome_exibicao: c.nome_completo || c.razao_social || '-',
    documento: c.cpf || c.cnpj || '',
    endereco_resumo: [c.endereco, c.numero, c.bairro].filter(Boolean).join(', ') || '-',
    status: String(c.status || '').toUpperCase(),
    fluxo_comercial: getStatusVendaOperacionalLabel(c.status || 'CLIENTE_CADASTRADO') || 'Cadastro',
    fluxo_comercial_class: fluxoComercialClass(c.status),
    situacao: String(c.situacao || 'INATIVO').toUpperCase(),
  })),
)

function editarCliente(id) {
  if (!can('clientes.editar')) return notify.error('Acesso negado.')
  router.push(`/clientes/${id}`)
}

async function carregarClientes() {
  loading.value = true
  try {
    const res = await ClienteService.listar()
    const payload = res?.data
    clientes.value = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []
  } catch (error) {
    console.error('Erro ao carregar clientes:', error)
    notify.error('Falha ao carregar clientes.')
    clientes.value = []
  } finally {
    loading.value = false
  }
}

async function excluirCliente(row) {
  if (!can('clientes.excluir')) return notify.error('Acesso negado.')

  const nome = row?.nome_exibicao || 'cliente'
  const ok = await confirm.show(
    'Excluir Cliente',
    `Deseja excluir o cliente "${nome}"? Esta acao nao pode ser desfeita.`,
  )
  if (!ok) return

  const cleanId = Number(row?.id)
  try {
    await ClienteService.remover(cleanId)
    clientes.value = clientes.value.filter((c) => Number(c.id) !== cleanId)
    notify.success('Cliente removido com sucesso.')
  } catch (e) {
    console.error('Erro ao excluir cliente:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(
      Array.isArray(apiMsg)
        ? apiMsg.join(' | ')
        : apiMsg || 'Nao foi possivel excluir o cliente.',
    )
  }
}

onMounted(async () => {
  if (!can('clientes.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }

  await carregarClientes()
})
</script>

<style scoped>
.clientes-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.clientes-list__identity {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.clientes-list__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.9);
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.dark .clientes-list__initials {
  background: rgba(18, 30, 49, 0.62);
  border-color: rgba(51, 71, 102, 0.76);
}

.clientes-list__identity-copy,
.clientes-list__stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.clientes-list__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.4;
  text-transform: none;
  letter-spacing: -0.01em;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clientes-list__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  text-transform: none;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clientes-list__secondary-detail {
  margin-left: 0.5rem;
}

.clientes-list :deep(.ds-status-pill) {
  max-width: 100%;
  justify-content: center;
  padding-inline: 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

@media (max-width: 1100px) {
  .clientes-list__primary {
    font-size: 0.88rem;
  }

  .clientes-list__secondary {
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .clientes-list__identity {
    gap: 0.48rem;
  }

  .clientes-list__initials {
    width: 1.9rem;
    height: 1.9rem;
  }
}
</style>
