<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="clienteNome"
        :subtitle="clienteTelefone ? `Contratos do cliente · ${clienteTelefone}` : 'Contratos do cliente'"
        icon="pi pi-file"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-80 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Filtrar por número, status ou valor..."
              />
            </div>
            <Button
              v-if="can('contratos.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="router.push({ path: '/contratos/novo', query: { cliente_id: clienteId } })"
            >
              <i class="pi pi-plus mr-2" />
              Novo Contrato
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-4">
        <!-- Visualização do PDF na tela embaixo do menu (substitui a lista) -->
        <div v-if="pdfModalOpen" class="flex flex-col h-[calc(100vh-12rem)] min-h-[400px]">
          <div class="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              class="rounded-xl font-black uppercase tracking-wider text-[10px]"
              @click="fecharPdfModal"
            >
              <i class="pi pi-arrow-left mr-2" />
              Voltar para a lista
            </Button>
            <span class="text-xs font-black uppercase tracking-wider text-text-soft flex items-center gap-2">
              <i class="pi pi-file-pdf text-rose-500" />
              {{ pdfModalTitulo || 'PDF do contrato' }}
            </span>
          </div>
          <div class="flex-1 min-h-0 rounded-xl border border-border-ui bg-bg-page overflow-hidden flex flex-col">
            <div
              v-if="pdfModalLoading"
              class="flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-slate-400"
            >
              Carregando PDF...
            </div>
            <div
              v-else-if="pdfModalError"
              class="flex-1 flex items-center justify-center px-6 text-center text-[11px] font-black uppercase tracking-widest text-rose-600"
            >
              {{ pdfModalError }}
            </div>
            <iframe
              v-else-if="pdfBlobUrl"
              :src="pdfBlobUrl"
              class="w-full h-full border-0 flex-1 min-h-0"
              title="PDF do contrato"
            />
          </div>
        </div>

        <!-- Lista de contratos (quando não está vendo PDF) -->
        <template v-else>
        <div v-if="filtrados.length > 0" class="rounded-xl border border-border-ui bg-bg-page/50 px-4 py-2 flex justify-center items-center gap-2">
          <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">Valor total</span>
          <span class="text-lg font-black text-text-main">{{ format.currency(valorTotalFiltrado) }}</span>
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
              <span class="inline-flex items-center justify-center bg-bg-card border border-border-ui px-3 py-1 rounded-lg text-[10px] font-black text-text-main">
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
                  class="w-full max-w-[130px] h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
              <span class="text-sm font-black text-text-main tabular-nums">
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
              <div class="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                <button
                  v-if="can('contratos.ver') && row.tem_pdf && row.pdf_arquivo_id"
                  type="button"
                  class="h-8 px-2.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-500/10 flex items-center gap-1.5 transition-colors text-[11px] font-medium whitespace-nowrap shrink-0 inline-flex items-center"
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
    </div>
  </div>
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
  filtrados.value.reduce((acc, c) => acc + Number(c.valor || 0), 0)
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

// Limpa o filtro ao trocar de cliente (ex.: navegação entre clientes)
watch(clienteId, () => {
  filtro.value = ''
})

onBeforeUnmount(() => {
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
})
</script>
