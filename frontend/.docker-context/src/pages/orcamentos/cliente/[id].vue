<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="clienteNome"
        :subtitle="clienteTelefone ? `Orçamentos do cliente · ${clienteTelefone}` : 'Orçamentos do cliente'"
        icon="pi pi-file-edit"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-80 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Filtrar por ID, data ou valor..."
              />
            </div>
            <Button
              v-if="can('orcamentos.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="novoParaCliente"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Orçamento
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-4">
        <div v-if="filtrados.length > 0" class="rounded-xl border border-border-ui bg-bg-page/50 px-4 py-2 flex justify-center items-center gap-2">
          <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">Valor total</span>
          <span class="text-lg font-black text-text-main">{{ format.currency(valorTotalFiltrado) }}</span>
        </div>

        <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden">
          <Table
            :columns="columns"
            :rows="filtrados"
            :loading="loading"
            empty-text="Nenhum orçamento para este cliente."
            :boxed="false"
          >
            <template #cell-id="{ row }">
              <span class="inline-flex items-center justify-center bg-bg-card border border-border-ui px-3 py-1 rounded-lg text-[10px] font-black text-text-main">
                #{{ row.id }}
              </span>
            </template>

            <template #cell-data="{ row }">
              <span class="text-xs font-bold text-text-main">
                {{ format.date(row.criado_em || row.data) }}
              </span>
            </template>

            <template #cell-total="{ row }">
              <span class="text-sm font-black text-text-main tabular-nums">
                {{ format.currency(row.total_itens || row.valor_total || 0) }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end items-center gap-1.5">
                <Button
                  v-if="can('orcamentos.editar')"
                  variant="primary"
                  size="sm"
                  class="!rounded-lg font-black uppercase text-[10px]"
                  @click="abrir(row.id)"
                >
                  Gerenciar
                </Button>
                <button
                  v-if="can('orcamentos.ver')"
                  type="button"
                  class="w-7 h-7 rounded-lg bg-bg-page border border-border-ui text-text-main hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all flex items-center justify-center"
                  title="Arquivos"
                  @click="openArquivos(row.id)"
                >
                  <i class="pi pi-paperclip text-[10px]"></i>
                </button>
                <button
                  v-if="can('orcamentos.ver')"
                  type="button"
                  class="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                  title="PDF"
                  @click="abrirPdf(row.id)"
                >
                  <i class="pi pi-file-pdf text-[10px]"></i>
                </button>
                <button
                  v-if="can('orcamentos.excluir')"
                  type="button"
                  class="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-text-soft hover:text-rose-500 transition-all flex items-center justify-center"
                  title="Excluir"
                  @click="confirmarExcluirOrcamento(row.id)"
                >
                  <i class="pi pi-trash text-[10px]"></i>
                </button>
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>

    <ArquivosModal
      v-if="arquivosOpen && orcamentoSelecionado"
      :open="arquivosOpen"
      ownerType="ORCAMENTO"
      :ownerId="orcamentoSelecionado"
      categoria="ANEXO"
      :canManage="can('orcamentos.editar')"
      @close="arquivosOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, ClienteService } from '@/services/index'
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'orcamentos.ver' } })

const route = useRoute()
const router = useRouter()

const arquivosOpen = ref(false)
const orcamentoSelecionado = ref(null)
const loading = ref(false)
const filtro = ref('')
const rows = ref([])
const dadosClienteExtra = ref(null)

const clienteId = computed(() => Number(String(route.params.id || '').replace(/\D/g, '')))

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'data', label: 'Data', width: '140px' },
  { key: 'total', label: 'Total', width: '140px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '240px', align: 'right' },
]

async function carregar() {
  if (!clienteId.value) return
  loading.value = true
  try {
    const [resOrcs, resCliente] = await Promise.allSettled([
      OrcamentosService.listar(),
      ClienteService.buscar(clienteId.value),
    ])

    const all = resOrcs.status === 'fulfilled' ? resOrcs.value.data : []
    rows.value = (Array.isArray(all) ? all : [])
      .filter((o) => Number(o.cliente_id) === clienteId.value)
      .sort((a, b) => {
        const da = new Date(a.criado_em || a.data || 0).getTime()
        const db = new Date(b.criado_em || b.data || 0).getTime()
        return db - da
      })

    if (resCliente.status === 'fulfilled') {
      dadosClienteExtra.value = resCliente.value.data
    }
  } catch (e) {
    console.error('Erro ao carregar orçamentos:', e)
    notify.error('Erro ao sincronizar dados.')
  } finally {
    loading.value = false
  }
}

const filtrados = computed(() => {
  const query = filtro.value?.trim().toLowerCase()
  if (!query) return rows.value
  return rows.value.filter((o) => {
    const id = String(o.id || '').toLowerCase()
    const dataFmt = format.date(o.criado_em || o.data || '').toLowerCase()
    const valor = format.currency(o.total_itens || o.valor_total || 0).toLowerCase()
    return id.includes(query) || dataFmt.includes(query) || valor.includes(query)
  })
})

const valorTotalFiltrado = computed(() =>
  filtrados.value.reduce((acc, o) => acc + Number(o.total_itens || o.valor_total || 0), 0)
)

const clienteNome = computed(() => {
  if (dadosClienteExtra.value) return dadosClienteExtra.value.nome_completo || dadosClienteExtra.value.razao_social
  const o = rows.value?.[0]
  return o?.cliente_nome_snapshot || o?.cliente?.nome_completo || 'Cliente'
})

const clienteTelefone = computed(() => {
  const cli = dadosClienteExtra.value || rows.value?.[0]?.cliente || {}
  return cli.whatsapp || cli.telefone || cli.celular || ''
})

function abrir(id) {
  if (!can('orcamentos.editar')) return notify.error('Acesso negado.')
  router.push(`/orcamentos/${id}`)
}

function openArquivos(id) {
  orcamentoSelecionado.value = id
  arquivosOpen.value = true
}

async function abrirPdf(id) {
  try {
    const { data } = await OrcamentosService.abrirPdf(id)
    const arquivoId = data?.arquivoId || data?.id
    if (!arquivoId) throw new Error()
    router.push({
      path: `/arquivos/${arquivoId}`,
      query: { name: `ORC_${id}.pdf`, type: 'application/pdf' },
    })
  } catch {
    notify.error('Documento PDF não disponível no momento.')
  }
}

async function confirmarExcluirOrcamento(id) {
  const ok = await confirm.show('Excluir?', `Deseja remover o orçamento #${id}?`)
  if (!ok) return
  try {
    await OrcamentosService.remover(id)
    notify.success('Removido com sucesso')
    await carregar()
  } catch {
    notify.error('Erro ao excluir.')
  }
}

function novoParaCliente() {
  router.push({
    path: '/orcamentos/novo',
    query: { cliente_id: clienteId.value },
  })
}

onMounted(carregar)
</script>
