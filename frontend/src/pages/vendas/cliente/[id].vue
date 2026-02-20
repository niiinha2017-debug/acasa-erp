<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="clienteNome"
        :subtitle="clienteTelefone ? `Orçamentos do cliente (para venda) · ${clienteTelefone}` : 'Orçamentos do cliente (para venda)'"
        icon="pi pi-shopping-cart"
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
              v-if="can('vendas.criar') && primeiroSemVenda"
              variant="primary"
              size="sm"
              @click="irParaFechamento(primeiroSemVenda.id)"
            >
              <i class="pi pi-dollar mr-1" />
              Fechar venda
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
            <template #cell-valor="{ row }">
              <span class="text-sm font-black text-text-main tabular-nums">
                {{ format.currency(row.total_itens ?? row.valor_total ?? 0) }}
              </span>
            </template>
            <template #cell-acoes="{ row }">
              <div class="flex flex-wrap justify-end items-center gap-2">
                <Button size="sm" variant="secondary" @click="irParaDetalhar(row)">
                  Detalhar
                </Button>
                <Button
                  v-if="row.venda && can('agendamentos.criar')"
                  size="sm"
                  variant="secondary"
                  @click="abrirModalEnviarProducao(row)"
                >
                  <i class="pi pi-send mr-1" />
                  Enviar para produção
                </Button>
                <Button
                  v-if="!row.venda"
                  size="sm"
                  variant="primary"
                  :disabled="!can('vendas.criar')"
                  @click="irParaFechamento(row.id)"
                >
                  Fechar venda
                </Button>
                <Button
                  v-if="row.venda"
                  size="sm"
                  variant="danger"
                  :disabled="!can('vendas.editar') && !can('vendas.excluir')"
                  @click="cancelarVenda(row)"
                >
                  Cancelar venda
                </Button>
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>

    <!-- Modal Enviar para Produção -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalEnviarProducao.aberto"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModalEnviarProducao"
        >
          <div class="w-full max-w-md rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden flex flex-col">
            <div class="h-1 w-full bg-brand-primary" />
            <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui">
              <div class="flex items-center gap-3">
                <i class="pi pi-send text-2xl text-text-soft"></i>
                <div>
                  <h3 class="text-lg font-semibold text-text-main">Enviar para Produção</h3>
                  <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    Cria agendamento na agenda para esta venda
                  </p>
                </div>
              </div>
              <button type="button" class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500" @click="fecharModalEnviarProducao">
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>
            <form class="p-6 space-y-4" @submit.prevent="confirmarEnviarProducao">
              <Input v-model="modalEnviarProducao.titulo" label="Título do agendamento *" placeholder="Ex: Produção Venda #..." required />
              <div class="grid grid-cols-2 gap-4">
                <Input v-model="modalEnviarProducao.inicio_em" label="Início *" type="datetime-local" required />
                <Input v-model="modalEnviarProducao.fim_em" label="Término *" type="datetime-local" required />
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
                <Button type="button" variant="ghost" @click="fecharModalEnviarProducao">Cancelar</Button>
                <Button type="submit" variant="primary" :loading="modalEnviarProducao.salvando">
                  <i class="pi pi-send mr-2"></i>
                  Enviar para Produção
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AgendaService, ClienteService, FuncionarioService, OrcamentosService, VendaService } from '@/services'
import { format } from '@/utils/format'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import Input from '@/components/ui/Input.vue'

definePage({ meta: { perm: 'vendas.criar' } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const rows = ref([])
const dadosClienteExtra = ref(null)

const clienteId = computed(() => Number(String(route.params.id || '').replace(/\D/g, '')))

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'data', label: 'Data', width: '140px' },
  { key: 'valor', label: 'Total', width: '140px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '280px', align: 'right' },
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
    console.error(e)
    notify.error('Erro ao carregar orçamentos.')
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
    const valor = format.currency(o.total_itens ?? o.valor_total ?? 0).toLowerCase()
    return id.includes(query) || dataFmt.includes(query) || valor.includes(query)
  })
})

const valorTotalFiltrado = computed(() =>
  filtrados.value.reduce((acc, o) => acc + Number(o.total_itens ?? o.valor_total ?? 0), 0)
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

const primeiroSemVenda = computed(() => filtrados.value.find((o) => !o.venda) ?? null)

const modalEnviarProducao = ref({
  aberto: false,
  titulo: '',
  inicio_em: '',
  fim_em: '',
  funcionarioSelecionado: null,
  equipe_ids: [],
  salvando: false,
})
const vendaIdEnviarProducao = ref(null)
const funcionariosOptionsEnviarProducao = ref([])

function fecharModalEnviarProducao() {
  modalEnviarProducao.value.aberto = false
  modalEnviarProducao.value.titulo = ''
  modalEnviarProducao.value.inicio_em = ''
  modalEnviarProducao.value.fim_em = ''
  modalEnviarProducao.value.funcionarioSelecionado = null
  modalEnviarProducao.value.equipe_ids = []
  vendaIdEnviarProducao.value = null
}
function adicionarEquipeEnviarProducao(id) {
  if (!id) return
  if (!modalEnviarProducao.value.equipe_ids.includes(id)) modalEnviarProducao.value.equipe_ids.push(id)
  modalEnviarProducao.value.funcionarioSelecionado = null
}
function removerEquipeEnviarProducao(id) {
  modalEnviarProducao.value.equipe_ids = modalEnviarProducao.value.equipe_ids.filter((f) => String(f) !== String(id))
}
function funcionarioNomeByIdEnviarProducao(id) {
  const opt = funcionariosOptionsEnviarProducao.value.find((o) => (o.value ?? o.id) === id)
  return opt?.label ?? opt?.nome ?? `#${id}`
}
async function abrirModalEnviarProducao(row) {
  const vendaId = row?.venda?.id
  if (!vendaId || !clienteId.value) {
    notify.error('Venda ou cliente não encontrado.')
    return
  }
  vendaIdEnviarProducao.value = vendaId
  try {
    const res = await FuncionarioService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    funcionariosOptionsEnviarProducao.value = lista
      .map((item) => ({ label: item?.label || item?.nome || '', value: item?.value ?? item?.id ?? null }))
      .filter((opt) => opt.value != null)
  } catch (e) {
    funcionariosOptionsEnviarProducao.value = []
  }
  const now = new Date()
  const fim = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  modalEnviarProducao.value.titulo = `Produção Venda #${vendaId}`
  modalEnviarProducao.value.inicio_em = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  modalEnviarProducao.value.fim_em = `${fim.getFullYear()}-${pad(fim.getMonth() + 1)}-${pad(fim.getDate())}T${pad(fim.getHours())}:${pad(fim.getMinutes())}`
  modalEnviarProducao.value.equipe_ids = []
  modalEnviarProducao.value.aberto = true
}
async function confirmarEnviarProducao() {
  const inicio = new Date(modalEnviarProducao.value.inicio_em)
  const fim = new Date(modalEnviarProducao.value.fim_em)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return notify.error('Data de início e término inválidas.')
  if (fim <= inicio) return notify.error('Término deve ser depois do início.')
  const vid = vendaIdEnviarProducao.value
  if (!vid || !clienteId.value) return notify.error('Venda ou cliente não informado.')
  modalEnviarProducao.value.salvando = true
  try {
    await AgendaService.criar({
      titulo: modalEnviarProducao.value.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: clienteId.value,
      venda_id: vid,
      equipe_ids: [],
      categoria: 'PRODUCAO',
    })
    notify.success('Venda enviada para produção!')
    fecharModalEnviarProducao()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao enviar para produção.')
  } finally {
    modalEnviarProducao.value.salvando = false
  }
}

function irParaFechamento(id) {
  if (!id) return
  router.push({ path: '/vendas/nova-venda', query: { orcamentoId: String(id) } })
}

function irParaDetalhar(row) {
  if (!row) return
  if (row.venda?.id) {
    router.push(`/vendas/venda/${row.venda.id}`)
  } else {
    router.push(`/orcamentos/${row.id}`)
  }
}

async function cancelarVenda(row) {
  if (!row?.venda?.id) return
  if (!can('vendas.editar') && !can('vendas.excluir')) return notify.error('Acesso negado.')
  const ok = window.confirm(`Cancelar/excluir a Venda #${row.venda.id} deste orçamento?`)
  if (!ok) return
  try {
    await VendaService.remover(row.venda.id)
    notify.success('Venda cancelada/excluída.')
    await carregar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao cancelar venda.')
  }
}

onMounted(carregar)
</script>
