<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="`Venda #${vendaId}`"
        subtitle="Detalhe da venda. Use «Editar venda» para alterar itens, parcelas e comissões."
        icon="pi pi-shopping-cart"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              @click="router.push('/vendas/fechamento')"
            >
              <i class="pi pi-arrow-left mr-1" />
              Voltar
            </Button>
            <Button
              v-if="can('contratos.criar')"
              variant="secondary"
              size="sm"
              type="button"
              @click="irParaContrato"
            >
              <i class="pi pi-file mr-1" />
              Gerar contrato
            </Button>
            <Button
              v-if="contratoAssinado && can('agendamentos.criar')"
              variant="secondary"
              size="sm"
              type="button"
              @click="abrirModalEnviarProducao"
            >
              <i class="pi pi-send mr-1" />
              Enviar para produção
            </Button>
            <Button
              v-if="can('vendas.editar')"
              variant="primary"
              size="sm"
              type="button"
              @click="irParaEdicao"
            >
              <i class="pi pi-pencil mr-1" />
              Editar venda
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 border-t border-border-ui space-y-6">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft" />
        </div>

        <template v-else-if="venda">
          <section class="rounded-2xl border border-border-ui bg-bg-page p-4 space-y-3">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Dados da venda
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Cliente</p>
                <p class="font-bold text-text-main">
                  {{ venda.cliente?.nome_completo || venda.cliente?.razao_social || '-' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Orçamento</p>
                <p class="font-bold text-text-main">#{{ venda.orcamento_id ?? '-' }}</p>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Data da venda</p>
                <p class="font-bold text-text-main">
                  {{ venda.data_venda ? formatarDataExibicao(venda.data_venda) : '-' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Valor vendido</p>
                <p class="font-black text-brand-primary">
                  {{ format.currency(venda.valor_vendido ?? 0) }}
                </p>
              </div>
            </div>
          </section>

          <section v-if="(venda.itens || []).length" class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden">
            <div class="px-4 py-3 border-b border-border-ui text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Itens da venda
            </div>
            <Table :columns="columnsItens" :rows="rowsItens" :boxed="false">
              <template #cell-descricao="{ row }">
                <div class="whitespace-pre-line text-sm">{{ row.descricao || '-' }}</div>
              </template>
              <template #cell-valor_unitario="{ row }">
                <span class="font-bold">{{ format.currency(row.valor_unitario ?? 0) }}</span>
              </template>
              <template #cell-valor_total="{ row }">
                <span class="font-bold">{{ format.currency((row.valor_unitario ?? 0) * (row.quantidade ?? 1)) }}</span>
              </template>
            </Table>
          </section>

          <section v-if="pagamentosParaExibir.length" class="rounded-2xl border border-border-ui bg-bg-page p-4 space-y-3">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Pagamentos
            </div>
            <div class="space-y-2">
              <div
                v-for="(p, i) in pagamentosParaExibir"
                :key="i"
                class="flex flex-wrap items-center gap-2 text-sm"
              >
                <span class="font-bold text-text-main">{{ labelForma(p.forma_pagamento_chave) }}</span>
                <span class="text-text-soft">—</span>
                <span>{{ p.agrupado ? p.resumo : format.currency(p.valor ?? 0) }}</span>
                <span v-if="!p.agrupado && p.data_recebimento" class="text-text-soft">
                  ({{ formatarDataExibicao(p.data_recebimento) }})
                </span>
              </div>
            </div>
          </section>

          <section v-if="can('contratos.ver') && contratos.length" class="rounded-2xl border border-border-ui bg-bg-page p-4 space-y-3">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Contratos desta venda
            </div>
            <div class="space-y-2">
              <div
                v-for="c in contratos"
                :key="c.id"
                class="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border-ui last:border-0"
              >
                <span class="font-semibold text-text-main">#{{ c.numero || c.id }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="{
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200': String(c.status || '').toUpperCase() === 'RASCUNHO',
                    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200': String(c.status || '').toUpperCase() === 'VIGENTE',
                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300': !['RASCUNHO','VIGENTE'].includes(String(c.status || '').toUpperCase())
                  }"
                >
                  {{ c.status || '-' }}
                </span>
                <RouterLink
                  :to="`/contratos/${c.id}`"
                  class="text-sm font-medium text-brand-primary hover:underline"
                >
                  Abrir contrato
                </RouterLink>
              </div>
            </div>
            <p class="text-xs text-text-soft">
              Abra o contrato para enviar o link de assinatura (WhatsApp/e-mail) pelo subdomínio.
            </p>
          </section>
        </template>

        <div v-else class="text-center py-10 text-text-soft">
          Venda não encontrada.
        </div>
      </div>
    </div>

    <!-- Modal Enviar para Produção (só após contrato assinado) -->
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
import { AgendaService, ContratosService, FuncionarioService, VendaService } from '@/services'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'
import { FORMAS_PAGAMENTO } from '@/constantes'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

definePage({ meta: { perm: 'vendas.criar' } })

const route = useRoute()
const router = useRouter()

const vendaId = computed(() => String(route.params?.id || '').replace(/\D/g, '') || null)
const loading = ref(false)
const venda = ref(null)
const contratos = ref([])

const contratoAssinado = computed(() =>
  (contratos.value || []).some((c) => String(c.status || '').toUpperCase() === 'VIGENTE'),
)

const modalEnviarProducao = ref({
  aberto: false,
  titulo: '',
  inicio_em: '',
  fim_em: '',
  funcionarioSelecionado: null,
  equipe_ids: [],
  salvando: false,
})
const funcionariosOptionsEnviarProducao = ref([])

const columnsItens = [
  { key: 'nome_ambiente', label: 'Item / Ambiente' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'quantidade', label: 'Qtd', width: '80px', align: 'right' },
  { key: 'valor_unitario', label: 'Valor unit.', width: '120px', align: 'right' },
  { key: 'valor_total', label: 'Total', width: '120px', align: 'right' },
]

const rowsItens = computed(() =>
  (venda.value?.itens || []).map((it) => ({
    ...it,
    quantidade: Number(it.quantidade ?? 1),
    valor_unitario: Number(it.valor_unitario ?? 0),
  })),
)

function labelForma(key) {
  const found = (FORMAS_PAGAMENTO || []).find((x) => x.key === key)
  return found?.label || key || '-'
}

// Exibe data sem mudar dia por fuso: YYYY-MM-DD ou ISO meia-noite UTC = dia literal; senão fuso local
function formatarDataExibicao(s) {
  if (!s) return ''
  const str = String(s).trim()
  const datePart = str.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    if (str.length === 10) return `${datePart.slice(8, 10)}/${datePart.slice(5, 7)}/${datePart.slice(0, 4)}`
    const d = new Date(s)
    if (!Number.isNaN(d.getTime()) && d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return `${datePart.slice(8, 10)}/${datePart.slice(5, 7)}/${datePart.slice(0, 4)}`
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return datePart
  return d.toLocaleDateString('pt-BR')
}

// No detalhe: várias parcelas do mesmo tipo mostram "18x de R$ 3.000,00"; o detalhe por data fica no contas a receber
const pagamentosParaExibir = computed(() => {
  const list = venda.value?.pagamentos || []
  if (list.length === 0) return []
  const forma = list[0].forma_pagamento_chave
  const todasMesmaForma = list.every((p) => p.forma_pagamento_chave === forma)
  const total = list.reduce((acc, p) => acc + Number(p.valor ?? 0), 0)
  if (list.length > 1 && todasMesmaForma) {
    return [
      {
        forma_pagamento_chave: forma,
        resumo: `${list.length}x de ${format.currency(total)}`,
        valor: total,
        agrupado: true,
      },
    ]
  }
  return list.map((p) => ({ ...p, agrupado: false }))
})

function irParaEdicao() {
  const id = vendaId.value
  if (!id) return
  // Mesma tela do Nova venda (Fechamento da Venda), em modo edição
  router.replace({ path: '/vendas/nova-venda', query: { vendaId: String(id) } })
}

/** Abre a tela de novo contrato vinculado a esta venda (para gerar/atualizar o contrato após editar a venda). */
function irParaContrato() {
  const id = vendaId.value
  if (!id) return
  router.push({ path: '/contratos/novo', query: { vendaId: String(id) } })
}

async function carregar() {
  const id = vendaId.value
  if (!id) return
  loading.value = true
  try {
    const [vendaRes, contratosRes] = await Promise.all([
      VendaService.buscar(id),
      can('contratos.ver') ? ContratosService.listar({ venda_id: id }) : Promise.resolve({ data: [] }),
    ])
    venda.value = vendaRes.data
    contratos.value = Array.isArray(contratosRes?.data) ? contratosRes.data : []
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar venda.')
    venda.value = null
    contratos.value = []
  } finally {
    loading.value = false
  }
}

function fecharModalEnviarProducao() {
  modalEnviarProducao.value.aberto = false
  modalEnviarProducao.value.titulo = ''
  modalEnviarProducao.value.inicio_em = ''
  modalEnviarProducao.value.fim_em = ''
  modalEnviarProducao.value.funcionarioSelecionado = null
  modalEnviarProducao.value.equipe_ids = []
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
async function abrirModalEnviarProducao() {
  const id = vendaId.value
  if (!id || !venda.value?.cliente_id) {
    notify.error('Venda ou cliente não carregado.')
    return
  }
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
  modalEnviarProducao.value.titulo = `Produção Venda #${id}`
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
  const cid = venda.value?.cliente_id
  if (!cid) return notify.error('Cliente não informado.')
  modalEnviarProducao.value.salvando = true
  try {
    await AgendaService.criar({
      titulo: modalEnviarProducao.value.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: cid,
      venda_id: vendaId.value,
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

onMounted(carregar)
</script>
