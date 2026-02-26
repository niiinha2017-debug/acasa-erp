<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Acompanhamento de Status"
        subtitle="Em qual etapa cada cliente está no pipeline"
        icon="pi pi-list-check"
        :show-back="false"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-72">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar nome, telefone, endereço, status ou agendamento..."
              />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex flex-col gap-0.5">
                <label class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Data início</label>
                <input
                  v-model="filtroDataInicio"
                  type="date"
                  class="h-10 min-w-[140px] rounded-xl border border-border-ui bg-bg-page px-3 text-sm font-semibold text-text-main"
                />
              </div>
              <div class="flex flex-col gap-0.5">
                <label class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Data fim</label>
                <input
                  v-model="filtroDataFim"
                  type="date"
                  class="h-10 min-w-[140px] rounded-xl border border-border-ui bg-bg-page px-3 text-sm font-semibold text-text-main"
                />
              </div>
            </div>
            <select
              v-model="statusFiltro"
              class="h-11 rounded-xl border border-border-ui bg-bg-page px-3 text-sm font-semibold text-text-main"
            >
              <option value="">Todos os status</option>
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <Table
          :columns="columns"
          :rows="rowsPaginated"
          :row-key="'uniqueKey'"
          :loading="loading"
          :boxed="false"
          empty-text="Nenhum registro encontrado para os filtros."
        >
          <template #cell-cliente="{ row }">
            <div class="flex flex-col py-1 min-w-0 gap-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-bold text-text-main truncate">
                  {{ row.nome_exibicao }}
                </span>
                <div class="flex flex-wrap items-center gap-1.5">
                  <Button
                    v-for="(etapa, idx) in row.etapas"
                    :key="idx"
                    size="sm"
                    variant="secondary"
                    class="h-7 px-2.5 rounded-lg text-[10px] font-black uppercase shrink-0"
                    :title="getDestinoAcompanhar(row, etapa).label"
                    @click="acompanharStatusCliente(row, etapa)"
                  >
                    {{ row.etapas.length > 1 && etapa.orcamento_numero != null ? `Orç. #${etapa.orcamento_numero}` : 'Acompanhar status' }}
                  </Button>
                </div>
              </div>
              <span class="text-[10px] font-semibold text-text-muted truncate">
                {{ row.telefone_exibicao || row.documento || 'Sem telefone' }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <div class="flex flex-col gap-2">
              <div
                v-for="(etapa, idx) in row.etapas"
                :key="idx"
                class="flex flex-col gap-0.5"
              >
                <span v-if="etapa.orcamento_numero != null" class="text-[9px] font-bold text-brand-primary uppercase">
                  Orç. #{{ etapa.orcamento_numero }}
                </span>
                <StatusBadge :value="etapa.status_key" :label="etapa.status_label" />
                <span
                  v-if="etapa.etapa_numero != null && row.etapa_total != null"
                  class="text-[10px] font-semibold text-text-muted"
                >
                  Etapa {{ etapa.etapa_numero }} de {{ row.etapa_total }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-agendamento="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-text-main">
                {{ row.agendamento_data || '-' }}
              </span>
              <span class="text-[10px] font-medium text-text-muted">
                {{ row.agendamento_hora || '' }}
              </span>
              <span v-if="row.agendamento_descricao" class="text-[10px] font-semibold text-text-muted truncate">
                {{ row.agendamento_descricao }}
              </span>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-text-main leading-tight">{{ row.endereco_resumo }}</span>
              <span class="text-[10px] font-semibold text-text-muted tracking-tight">
                {{ [row.cidade, row.estado].filter(Boolean).join(' / ') || '-' }}
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                v-if="row.acoes.some((a) => a.action === 'orcamento')"
                size="sm"
                variant="primary"
                class="h-8 px-3 rounded-lg text-[10px] font-black uppercase"
                @click="abrirOrcamentoCliente(row)"
              >
                Orçamento
              </Button>
              <Button
                size="sm"
                variant="secondary"
                class="h-8 px-3 rounded-lg text-[10px] font-black uppercase"
                @click="abrirCliente(row.id)"
              >
                Cliente
              </Button>
            </div>
          </template>
        </Table>

        <div
          v-if="!loading && totalRows > 0"
          class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-ui pt-4"
        >
          <span class="text-xs font-semibold text-text-muted">
            {{ paginationLabel }}
          </span>
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              :disabled="currentPage <= 1"
              @click="currentPage = Math.max(1, currentPage - 1)"
            >
              Anterior
            </Button>
            <span class="text-xs font-semibold text-text-main min-w-[4rem] text-center">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <Button
              size="sm"
              variant="secondary"
              :disabled="currentPage >= totalPages"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PIPELINE_CLIENTE } from '@/constantes'
import { AgendaService, ClienteService, OrcamentosService } from '@/services/index'
import { notify } from '@/services/notify'
import { onlyNumbers } from '@/utils/masks'

definePage({ meta: { perm: 'relatorios.acompanhamento_status.ver' } })

const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const statusFiltro = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 25

const clientes = ref([])
const agendamentos = ref([])
const orcamentos = ref([])

const columns = [
  { key: 'cliente', label: 'CLIENTE', width: '26%' },
  { key: 'status', label: 'STATUS ATUAL', width: '18%' },
  { key: 'agendamento', label: 'AGENDAMENTO', width: '20%' },
  { key: 'contato', label: 'ENDEREÇO', width: '22%' },
  { key: 'acoes', label: 'AÇÕES', align: 'center', width: '14%' },
]

const statusLabelMap = computed(() => {
  const map = new Map()
  for (const item of PIPELINE_CLIENTE || []) {
    const key = String(item?.key || '').toUpperCase()
    if (!key) continue
    map.set(key, String(item?.label || key))
  }
  return map
})

const statusOptions = computed(() =>
  (PIPELINE_CLIENTE || []).map((item) => ({
    value: String(item?.key || '').toUpperCase(),
    label: String(item?.label || item?.key || ''),
  })),
)

/** Número total de etapas (fases) do pipeline, ex.: 8 */
const totalEtapasPipeline = computed(() => {
  const ordens = (PIPELINE_CLIENTE || []).map((i) => Number(i?.ordem ?? 0))
  if (!ordens.length) return 8
  const maxOrdem = Math.max(...ordens)
  return Math.max(1, Math.floor(maxOrdem / 100))
})

/** Para um status_key, retorna a etapa atual (1 a totalEtapas) com base na ordem do pipeline */
function etapaNumeroPorStatus(statusKey) {
  const key = String(statusKey || '').toUpperCase()
  const item = (PIPELINE_CLIENTE || []).find((i) => String(i?.key || '').toUpperCase() === key)
  if (!item || item.ordem == null) return null
  return Math.max(1, Math.floor(Number(item.ordem) / 100))
}

const STATUS_ORCAMENTO = new Set([
  'CRIAR_ORCAMENTO',
  'AGENDAR_APRESENTACAO',
  'APRESENTACAO_AGENDADA',
  'ORCAMENTO_APRESENTADO',
  'ORCAMENTO_APROVADO',
  'ORCAMENTO_REPROVADO',
])

/** Status que indicam venda (redireciona para página da venda) */
const STATUS_VENDA = new Set([
  'VENDA_FECHADA',
  'CONTRATO_GERADO',
  'CONTRATO_ASSINADO',
])

/** Status que indicam etapa de agendamento (redireciona para agenda) */
const STATUS_AGENDA = new Set([
  'AGENDAR_MEDIDA',
  'MEDIDA_AGENDADA',
  'MEDIDA_REALIZADA',
  'AGENDAR_MEDIDA_FINA',
  'MEDIDA_FINA_AGENDADA',
  'MEDIDA_FINA_REALIZADA',
  'PRODUCAO_AGENDADA',
  'AGENDAR_MONTAGEM',
  'MONTAGEM_AGENDADA',
])

/** Status de produção/montagem (venda já existe) */
const STATUS_PRODUCAO_POSVENDA = new Set([
  'PROJETO_TECNICO_EM_ANDAMENTO',
  'PROJETO_TECNICO_APROVADO',
  'EM_PRODUCAO',
  'PRODUCAO_FINALIZADA',
  'EM_MONTAGEM',
  'MONTAGEM_FINALIZADA',
  'GARANTIA',
  'ASSISTENCIA',
  'MANUTENCAO',
  'ENCERRADO',
])

/**
 * Retorna o destino (path + label) para o botão "Acompanhar status" com base na etapa atual.
 * Orçamento em andamento → página do orçamento; Venda → página da venda; Contrato → página do contrato;
 * Agendamento → agenda; Cliente cadastrado → ficha do cliente.
 */
function getDestinoAcompanhar(row, etapa) {
  const et = etapa ?? row?.etapas?.[0]
  const clienteId = row?.id
  if (!et) return { path: `/clientes/${clienteId}`, label: 'Ver cliente' }
  const statusKey = String(et?.status_key || '').toUpperCase()
  const vendaId = et?.venda_id
  const contratoId = et?.contrato_id
  const orcamentoId = et?.orcamento_id

  if (statusKey === 'CONTRATO_ASSINADO') {
    if (contratoId) return { path: `/contratos/${contratoId}`, label: 'Abrir contrato' }
    if (vendaId) return { path: `/vendas/venda/${vendaId}`, label: 'Abrir venda' }
    return { path: '/contratos', label: 'Contratos' }
  }
  if (STATUS_VENDA.has(statusKey) && vendaId) {
    return { path: `/vendas/venda/${vendaId}`, label: 'Abrir venda' }
  }
  if (STATUS_PRODUCAO_POSVENDA.has(statusKey) && vendaId) {
    return { path: `/vendas/venda/${vendaId}`, label: 'Abrir venda' }
  }
  if (STATUS_ORCAMENTO.has(statusKey) || statusKey === 'ORCAMENTO_EM_ANDAMENTO' || statusKey === 'ORCAMENTO_ENVIADO' || statusKey === 'ORCAMENTO_EM_NEGOCIACAO') {
    if (orcamentoId) return { path: `/orcamentos/${orcamentoId}`, label: 'Abrir orçamento' }
    return { path: `/orcamentos/cliente/${clienteId}`, label: 'Orçamentos do cliente' }
  }
  if (STATUS_AGENDA.has(statusKey)) {
    return { path: '/agendamentos/loja', label: 'Abrir agenda' }
  }
  if (statusKey === 'CLIENTE_CADASTRADO') {
    return { path: `/clientes/${clienteId}`, label: 'Ver cliente' }
  }
  if (vendaId) return { path: `/vendas/venda/${vendaId}`, label: 'Abrir venda' }
  if (orcamentoId) return { path: `/orcamentos/${orcamentoId}`, label: 'Abrir orçamento' }
  return { path: `/clientes/${clienteId}`, label: 'Ver cliente' }
}

function formatarDataHoraAgendamento(valor) {
  if (!valor) return { data: '', hora: '' }
  const dt = new Date(valor)
  if (Number.isNaN(dt.getTime())) return { data: '', hora: '' }
  return {
    data: dt.toLocaleDateString('pt-BR'),
    hora: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function selecionarAgendamentoDoCliente(clienteId) {
  const agora = Date.now()
  const lista = (agendamentos.value || [])
    .filter((a) => Number(a?.cliente_id) === Number(clienteId))
    .sort((a, b) => new Date(a.inicio_em).getTime() - new Date(b.inicio_em).getTime())

  if (!lista.length) return null

  const proximo = lista.find((a) => new Date(a.inicio_em).getTime() >= agora)
  if (proximo) return proximo
  return lista[lista.length - 1]
}

/** Agendamento vinculado ao orçamento do cliente; se orcamentoId for null, usa o agendamento “principal” do cliente */
function agendamentoParaEtapa(clienteId, orcamentoId) {
  const lista = (agendamentos.value || [])
    .filter((a) => Number(a?.cliente_id) === Number(clienteId))
    .sort((a, b) => new Date(a.inicio_em).getTime() - new Date(b.inicio_em).getTime())

  if (!lista.length) return null
  if (orcamentoId != null) {
    const doOrcamento = lista.find((a) => Number(a?.orcamento_id) === Number(orcamentoId))
    if (doOrcamento) return doOrcamento
  }
  const agora = Date.now()
  const proximo = lista.find((a) => new Date(a.inicio_em).getTime() >= agora)
  if (proximo) return proximo
  return lista[lista.length - 1]
}

function montarAcoesPorStatus(row) {
  const primeiraEtapa = row.etapas?.[0]
  const statusKey = primeiraEtapa?.status_key ?? row.status_key
  if (statusKey === 'CLIENTE_CADASTRADO') {
    return [{ label: 'Cliente', action: 'cliente', variant: 'secondary' }]
  }

  if (STATUS_ORCAMENTO.has(statusKey)) {
    return [
      { label: 'Orçamento', action: 'orcamento', variant: 'primary' },
      { label: 'Acompanhar status', action: 'acompanhar', variant: 'secondary' },
    ]
  }

  return [
    { label: 'Acompanhar status', action: 'acompanhar', variant: 'secondary' },
    { label: 'Cliente', action: 'cliente', variant: 'secondary' },
  ]
}

const rows = computed(() => {
  const termo = String(filtro.value || '').trim().toLowerCase()
  const termoDigits = onlyNumbers(termo)
  const statusSelecionado = String(statusFiltro.value || '').toUpperCase()

  const orcamentosPorCliente = new Map()
  for (const o of orcamentos.value || []) {
    const cid = Number(o?.cliente_id)
    if (!cid) continue
    if (!orcamentosPorCliente.has(cid)) orcamentosPorCliente.set(cid, [])
    orcamentosPorCliente.get(cid).push(o)
  }

  const totalEtapas = totalEtapasPipeline.value

  const listaRows = []
  for (const c of clientes.value || []) {
    const clienteId = Number(c?.id)
    const orcs = orcamentosPorCliente.get(clienteId) || []

    const etapas = []
    if (orcs.length === 0) {
      const statusKey = String(c?.status || 'INATIVO').toUpperCase()
      const ag = agendamentoParaEtapa(clienteId, null)
      const agFmtEtapa = formatarDataHoraAgendamento(ag?.inicio_em)
      etapas.push({
        orcamento_id: null,
        orcamento_numero: null,
        status_key: statusKey,
        status_label: statusLabelMap.value.get(statusKey) || statusKey,
        etapa_numero: etapaNumeroPorStatus(statusKey),
        agendamento_data: agFmtEtapa?.data ?? null,
        agendamento_hora: agFmtEtapa?.hora ?? null,
        agendamento_inicio_em: ag?.inicio_em ? new Date(ag.inicio_em).getTime() : null,
      })
    } else {
      orcs.forEach((orc, idx) => {
        const statusKey = String(orc?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO').toUpperCase()
        const ag = agendamentoParaEtapa(clienteId, orc?.id)
        const agFmtEtapa = formatarDataHoraAgendamento(ag?.inicio_em)
        const contratoId = orc?.venda?.contratos?.[0]?.id ? Number(orc.venda.contratos[0].id) : null
        etapas.push({
          orcamento_id: orc?.id,
          orcamento_numero: idx + 1,
          venda_id: orc?.venda?.id ? Number(orc.venda.id) : null,
          contrato_id: contratoId,
          status_key: statusKey,
          status_label: statusLabelMap.value.get(statusKey) || statusKey,
          etapa_numero: etapaNumeroPorStatus(statusKey),
          agendamento_data: agFmtEtapa?.data ?? null,
          agendamento_hora: agFmtEtapa?.hora ?? null,
          agendamento_inicio_em: ag?.inicio_em ? new Date(ag.inicio_em).getTime() : null,
        })
      })
    }

    const ag = selecionarAgendamentoDoCliente(clienteId)
    const agFmt = formatarDataHoraAgendamento(ag?.inicio_em)

    listaRows.push({
      id: clienteId,
      uniqueKey: `cliente-${clienteId}`,
      nome_exibicao: c?.nome_completo || c?.razao_social || '-',
      documento: c?.cpf || c?.cnpj || '',
      telefone_exibicao: c?.whatsapp || c?.telefone || '',
      email: c?.email || '',
      endereco_resumo: [c?.endereco, c?.numero, c?.bairro].filter(Boolean).join(', ') || '-',
      cidade: c?.cidade || '',
      estado: c?.estado || '',
      etapas,
      etapa_total: totalEtapas,
      status_key: etapas[0]?.status_key,
      agendamento_data: agFmt?.data ?? '-',
      agendamento_hora: agFmt?.hora ?? '',
      agendamento_descricao: String(ag?.titulo || ag?.categoria || '').trim(),
      acoes: [],
    })
  }

  return listaRows
    .map((row) => ({
      ...row,
      acoes: montarAcoesPorStatus(row),
    }))
    .filter((row) => {
      const dataInicio = String(filtroDataInicio.value || '').trim()
      const dataFim = String(filtroDataFim.value || '').trim()
      if (dataInicio || dataFim) {
        const timestamps = (row.etapas || [])
          .map((e) => e.agendamento_inicio_em)
          .filter((t) => t != null)
        if (!timestamps.length) return false
        const dayStart = (d) => {
          const x = new Date(d)
          x.setHours(0, 0, 0, 0)
          return x.getTime()
        }
        const dayEnd = (d) => {
          const x = new Date(d)
          x.setHours(23, 59, 59, 999)
          return x.getTime()
        }
        if (dataInicio) {
          const minT = dayStart(dataInicio)
          if (timestamps.every((t) => t < minT)) return false
        }
        if (dataFim) {
          const maxT = dayEnd(dataFim)
          if (timestamps.every((t) => t > maxT)) return false
        }
      }

      if (statusSelecionado) {
        const bateFiltroStatus = row.etapas?.some((e) => e.status_key === statusSelecionado)
        if (!bateFiltroStatus) return false
      }
      if (!termo) return true

      const texto = [
        row.nome_exibicao,
        row.documento,
        row.telefone_exibicao,
        row.email,
        row.endereco_resumo,
        row.cidade,
        row.estado,
        ...(row.etapas || []).map((e) => `${e.status_key} ${e.status_label} Orçamento ${e.orcamento_numero}`),
        row.agendamento_data,
        row.agendamento_hora,
        row.agendamento_descricao,
      ]
        .filter(Boolean)
        .join(' ')
      const textoNormalizado = normalizarTextoBusca(texto)
      const termoNormalizado = normalizarTextoBusca(termo)

      if (textoNormalizado.includes(termoNormalizado)) return true
      if (!termoDigits) return false
      return (
        onlyNumbers(String(row.documento || '')).includes(termoDigits) ||
        onlyNumbers(String(row.telefone_exibicao || '')).includes(termoDigits) ||
        onlyNumbers(String(row.agendamento_data || '')).includes(termoDigits) ||
        onlyNumbers(String(row.agendamento_hora || '')).includes(termoDigits)
      )
    })
})

const totalRows = computed(() => rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / PAGE_SIZE)))
const rowsPaginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return rows.value.slice(start, start + PAGE_SIZE)
})

const paginationLabel = computed(() => {
  const total = totalRows.value
  if (total === 0) return 'Nenhum registro'
  const start = (currentPage.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage.value * PAGE_SIZE, total)
  if (start === end) return `${total} registro${total !== 1 ? 's' : ''}`
  return `Mostrando ${start}–${end} de ${total}`
})

watch([filtro, statusFiltro, filtroDataInicio, filtroDataFim], () => {
  currentPage.value = 1
})

function abrirCliente(id) {
  if (!id) return
  router.push(`/clientes/${id}`)
}

function abrirOrcamentoCliente(row) {
  const id = row?.id
  if (!id) return
  router.push(`/orcamentos/cliente/${id}`)
}

function acompanharStatusCliente(row, etapa) {
  const destino = getDestinoAcompanhar(row, etapa)
  if (destino?.path) router.push(destino.path)
}

async function carregarClientes() {
  loading.value = true
  try {
    const [resClientes, resAgendas, resOrcamentos] = await Promise.all([
      ClienteService.listar(),
      AgendaService.listarTodos(undefined, undefined, { incluir_cancelados: false }),
      OrcamentosService.listar(),
    ])

    const payloadClientes = resClientes?.data
    clientes.value = Array.isArray(payloadClientes)
      ? payloadClientes
      : Array.isArray(payloadClientes?.data)
        ? payloadClientes.data
        : []

    const payloadAgendas = resAgendas?.data
    agendamentos.value = Array.isArray(payloadAgendas)
      ? payloadAgendas
      : Array.isArray(payloadAgendas?.data)
        ? payloadAgendas.data
        : []

    const payloadOrcamentos = resOrcamentos?.data
    orcamentos.value = Array.isArray(payloadOrcamentos)
      ? payloadOrcamentos
      : Array.isArray(payloadOrcamentos?.data)
        ? payloadOrcamentos.data
        : []
  } catch (error) {
    clientes.value = []
    agendamentos.value = []
    orcamentos.value = []
    notify.error('Falha ao carregar acompanhamento de status.')
  } finally {
    loading.value = false
  }
}

onMounted(carregarClientes)
</script>
