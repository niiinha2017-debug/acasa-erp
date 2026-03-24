<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="clienteNome"
        :subtitle="clienteTelefone ? `Contratos do cliente · ${clienteTelefone}` : 'Contratos do cliente'"
        icon="pi pi-file"
        variant="minimal"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              class="order-2 sm:order-none"
              @click="router.push('/contratos')"
            >
              <i class="pi pi-arrow-left mr-1" />
              Voltar
            </Button>
            <div class="w-full sm:w-80 order-1 sm:order-none">
              <SearchInput
                v-model="filtro"
                placeholder="Filtrar por número, status ou valor..."
              />
            </div>
            <Button
              v-if="can('contratos.criar')"
              variant="primary"
              type="button"
              class="order-3 flex-shrink-0"
              @click="router.push({ path: '/contratos/novo', query: { cliente_id: clienteId } })"
            >
              <i class="pi pi-plus mr-2" />
              Novo contrato
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="ds-editor-body space-y-4">
        <!-- Visualização do PDF (substitui a lista enquanto aberto) -->
        <div v-if="pdfModalOpen" class="flex min-h-[400px] flex-col h-[calc(100vh-12rem)]">
          <div class="mb-3 flex flex-shrink-0 items-center justify-between gap-3">
            <Button variant="secondary" size="sm" type="button" @click="fecharPdfModal">
              <i class="pi pi-arrow-left mr-2" />
              Voltar para a lista
            </Button>
            <span class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-soft">
              <i class="pi pi-file-pdf text-rose-500" />
              {{ pdfModalTitulo || 'PDF do contrato' }}
            </span>
          </div>
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]">
            <div
              v-if="pdfModalLoading"
              class="flex flex-1 items-center justify-center text-xs font-semibold uppercase tracking-wider text-text-soft"
            >
              Carregando PDF...
            </div>
            <div
              v-else-if="pdfModalError"
              class="flex flex-1 items-center justify-center px-6 text-center text-xs font-semibold uppercase tracking-wider text-rose-600"
            >
              {{ pdfModalError }}
            </div>
            <iframe
              v-else-if="pdfBlobUrl"
              :src="pdfBlobUrl"
              class="min-h-0 w-full flex-1 border-0"
              title="PDF do contrato"
            />
          </div>
        </div>

        <template v-else>
          <div
            v-if="filtrados.length > 0"
            class="ds-card ds-card--default flex items-center justify-center gap-2 px-4 py-2"
          >
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-soft">Valor total</span>
            <span class="text-lg font-black tabular-nums text-text-main">{{ format.currency(valorTotalFiltrado) }}</span>
          </div>

          <div class="native-table-flush overflow-visible">
            <Table
              :columns="columns"
              :rows="filtrados"
              :loading="loading"
              empty-text="Nenhum contrato para este cliente."
              :boxed="false"
              :flush="true"
            >
              <template #cell-id="{ row }">
                <span
                  class="inline-flex items-center justify-center rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-1 text-[10px] font-black text-text-main"
                >
                  #{{ row.id }}
                </span>
              </template>
              <template #cell-numero="{ row }">
                <span class="text-xs font-bold text-text-main">{{ row.numero || '-' }}</span>
              </template>
              <template #cell-status="{ row }">
                <div v-if="can('contratos.editar')" class="min-w-[130px]">
                  <select
                    :value="String(row.status || 'RASCUNHO').toUpperCase()"
                    class="h-8 w-full max-w-[130px] rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-2 text-[11px] font-medium text-text-main focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    @change="(ev) => alterarStatus(row, ev.target.value)"
                  >
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="VIGENTE">Vigente</option>
                    <option value="ENCERRADO">Encerrado</option>
                  </select>
                </div>
                <StatusBadge v-else :value="row.status" />
              </template>
              <template #cell-valor="{ row }">
                <span class="text-sm font-black tabular-nums text-text-main">
                  {{ format.currency(row.valor) }}
                </span>
              </template>
              <template #cell-data_inicio="{ row }">
                <span class="text-xs font-medium text-text-main">
                  {{ row.data_inicio ? format.date(row.data_inicio) : '-' }}
                </span>
              </template>
              <template #cell-data_fim="{ row }">
                <span class="text-xs font-medium text-text-main">
                  {{ row.data_fim ? format.date(row.data_fim) : '-' }}
                </span>
              </template>
              <template #cell-acoes="{ row }">
                <div class="inline-flex flex-nowrap items-center justify-end gap-1.5">
                  <button
                    v-if="can('contratos.ver') && row.tem_pdf && row.pdf_arquivo_id"
                    type="button"
                    class="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-medium text-text-soft transition-colors hover:bg-sky-500/10 hover:text-sky-600"
                    title="Abrir PDF do contrato"
                    @click.stop="abrirPdfModal(row)"
                  >
                    <i class="pi pi-file-pdf text-[12px]" />
                    Ver contrato
                  </button>
                  <TableActions
                    :id="row.id"
                    perm-edit="contratos.editar"
                    perm-delete="contratos.excluir"
                    @edit="router.push(`/contratos/${row.id}`)"
                    @delete="confirmarExcluir(row.id)"
                  />
                </div>
              </template>
            </Table>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ContratosService, ClienteService } from '@/services'
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'contratos.ver' } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const rows = ref([])
const dadosClienteExtra = ref(null)

const pdfModalOpen = ref(false)
const pdfBlobUrl = ref('')
const pdfModalLoading = ref(false)
const pdfModalError = ref('')
const pdfModalTitulo = ref('')

const clienteId = computed(() => Number(String(route.params.id || '').replace(/\D/g, '')))

const columns = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'numero', label: 'Número', width: '140px' },
  { key: 'status', label: 'Status', width: '140px', align: 'center' },
  { key: 'valor', label: 'Valor', width: '120px', align: 'right' },
  { key: 'data_inicio', label: 'Início', width: '100px' },
  { key: 'data_fim', label: 'Fim', width: '100px' },
  { key: 'acoes', label: 'Ações', width: '180px', align: 'right' },
]

async function carregar() {
  if (!clienteId.value) return
  loading.value = true
  try {
    const [resContratos, resCliente] = await Promise.allSettled([
      ContratosService.listar(),
      ClienteService.buscar(clienteId.value),
    ])

    const all = resContratos.status === 'fulfilled' ? resContratos.value.data : []
    rows.value = (Array.isArray(all) ? all : [])
      .filter((c) => Number(c.cliente_id) === clienteId.value)
      .sort((a, b) => (b.id || 0) - (a.id || 0))

    if (resCliente.status === 'fulfilled') {
      dadosClienteExtra.value = resCliente.value.data
    }
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar contratos.')
  } finally {
    loading.value = false
  }
}

const filtrados = computed(() => {
  const query = filtro.value?.trim().toLowerCase()
  if (!query) return rows.value
  return rows.value.filter((c) => {
    const numero = String(c.numero || '').toLowerCase()
    const status = String(c.status || '').toLowerCase()
    const valor = format.currency(c.valor || 0).toLowerCase()
    const id = String(c.id || '')
    return numero.includes(query) || status.includes(query) || valor.includes(query) || id.includes(query)
  })
})

const valorTotalFiltrado = computed(() =>
  filtrados.value.reduce((acc, c) => acc + Number(c.valor || 0), 0),
)

const clienteNome = computed(() => {
  if (dadosClienteExtra.value) return dadosClienteExtra.value.nome_completo || dadosClienteExtra.value.razao_social
  const c = rows.value?.[0]
  return c?.cliente?.nome_completo || c?.cliente?.razao_social || c?.cliente?.nome || 'Cliente'
})

const clienteTelefone = computed(() => {
  const cli = dadosClienteExtra.value || rows.value?.[0]?.cliente || {}
  return cli.whatsapp || cli.telefone || cli.celular || ''
})

async function abrirPdfModal(row) {
  if (!row?.id || !can('contratos.ver')) return
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
  pdfBlobUrl.value = ''
  pdfModalError.value = ''
  pdfModalTitulo.value = `${row.numero || 'Contrato'} #${row.id}`
  pdfModalOpen.value = true
  pdfModalLoading.value = true
  try {
    const res = await ContratosService.verPdf(row.id)
    const data = res?.data
    if (!data || !(data instanceof Blob) || data.size === 0) {
      pdfModalError.value = 'PDF não disponível.'
      return
    }
    pdfBlobUrl.value = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
  } catch (e) {
    console.error(e)
    pdfModalError.value = 'Não foi possível carregar o PDF.'
    notify.error('Erro ao abrir o PDF.')
  } finally {
    pdfModalLoading.value = false
  }
}

function fecharPdfModal() {
  pdfModalOpen.value = false
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
    pdfBlobUrl.value = ''
  }
  pdfModalError.value = ''
  pdfModalTitulo.value = ''
}

async function confirmarExcluir(id) {
  if (!can('contratos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir contrato', `Deseja excluir o contrato #${id}?`)
  if (!ok) return
  try {
    await ContratosService.remover(id)
    notify.success('Contrato excluído.')
    await carregar()
  } catch (e) {
    notify.error('Erro ao excluir.')
  }
}

async function alterarStatus(row, novoStatus) {
  if (!can('contratos.editar') || !novoStatus) return
  try {
    await ContratosService.salvar(row.id, { status: novoStatus })
    row.status = novoStatus
    notify.success('Status atualizado.')
  } catch (e) {
    notify.error('Erro ao atualizar status.')
  }
}

onMounted(carregar)

watch(clienteId, () => {
  filtro.value = ''
  carregar()
})

onBeforeUnmount(() => {
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
})
</script>
