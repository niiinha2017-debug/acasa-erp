<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <div class="flex flex-row flex-nowrap items-center gap-4 px-4 md:px-6 py-4 border-b border-border-ui">
        <h1 class="text-xl font-semibold text-text-main shrink-0 flex items-center gap-2">
          <i class="pi pi-list-check text-text-muted" />
          Fluxo de clientes
        </h1>
        <div class="flex flex-1 flex-nowrap items-center justify-end gap-3 min-w-0 ml-auto">
          <div class="min-w-0 w-48 sm:w-56 flex-shrink-0">
            <SearchInput
              v-model="filtro"
              placeholder="Nome, CPF, endereço, telefone, e-mail..."
            />
          </div>
          <div class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0" title="Data de">
            <i class="pi pi-calendar text-xs" />
            <input
              v-model="filtroDataInicio"
              type="date"
              class="h-10 w-[130px] rounded-lg border border-border-ui bg-bg-page pl-2 pr-2 text-sm font-medium text-text-main"
            />
          </div>
          <div class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0" title="Data até">
            <i class="pi pi-calendar text-xs" />
            <input
              v-model="filtroDataFim"
              type="date"
              class="h-10 w-[130px] rounded-lg border border-border-ui bg-bg-page pl-2 pr-2 text-sm font-medium text-text-main"
            />
          </div>
        </div>
      </div>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <!-- Lista de cards por cliente (uma linha/card por cliente) -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
        </div>

        <div v-else class="flex flex-col gap-4">
            <div
              v-for="row in rowsPaginated"
              :key="row.uniqueKey"
              class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 overflow-hidden transition-all duration-200"
            >
            <!-- Card Pai: cabeçalho fixo do cliente (Nome, Tel, Vendedor) -->
            <div
              class="flex flex-wrap items-center gap-3 md:gap-4 p-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              @click="toggleExpand(row.id)"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-text-main truncate">
                  {{ row.nome_exibicao }}
                </p>
                <p class="text-xs font-semibold text-text-muted truncate">
                  {{ row.telefone_exibicao || 'Sem telefone' }}
                </p>
                <p v-if="row.vendedorCadastroExibicao || row.responsavelExibicao || row.origemExibicao" class="text-[10px] font-medium text-text-muted mt-0.5">
                  <span v-if="row.vendedorCadastroExibicao || row.responsavelExibicao">Vendedor: {{ row.vendedorCadastroExibicao || row.responsavelExibicao }}</span><span v-if="(row.vendedorCadastroExibicao || row.responsavelExibicao) && row.origemExibicao"> · </span><span v-if="row.origemExibicao">Origem: {{ row.origemExibicao }}</span>
                </p>
              </div>
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-transform"
                :class="{ 'rotate-180': expandedIds.has(row.id) }"
                aria-label="Expandir blocos"
              >
                <i class="pi pi-chevron-down text-text-muted" />
              </button>
            </div>

            <!-- Blocos filhos: card por orçamento/venda (dados por ID do orçamento) -->
            <div
              v-show="expandedIds.has(row.id)"
              class="border-t border-border-ui bg-gray-50/50 dark:bg-slate-900/30 flex flex-col gap-4 p-4"
            >
              <article
                v-for="(bloco, blocoIdx) in (row.blocos || [])"
                :key="`${row.id}-${blocoIdx}-${bloco.orcDisplay?.id ?? 'cadastro'}`"
                :class="['rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden', getClasseTomCard(bloco.faseNum)]"
              >
                <div class="p-4 flex flex-col gap-4">
                  <!-- Foco nos dados: apenas ID do orçamento e valor total em negrito (dados exclusivos deste ID) -->
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="flex flex-col gap-0.5">
                      <p class="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                        {{ bloco.tipo === 'cadastro' ? 'Cadastro (sem orçamento)' : `Orçamento #${bloco.orcDisplay?.numero != null ? String(bloco.orcDisplay.numero) : String(blocoIdx + 1).padStart(2, '0')}` }}
                      </p>
                      <template v-if="bloco.orcDisplay">
                        <p class="text-lg font-bold text-gray-900 dark:text-slate-100 tabular-nums tracking-tight">
                          {{ bloco.orcDisplay.valorFormatado }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-slate-400">
                          {{ bloco.orcDisplay.dataExibicao }}
                        </p>
                      </template>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <Button
                        v-if="bloco.orcDisplay"
                        size="sm"
                        variant="primary"
                        class="text-[10px] font-bold min-w-0 px-3 rounded-lg"
                        @click.stop="abrirOrcamento(bloco.orcDisplay.id)"
                      >
                        <i class="pi pi-folder-open mr-1 text-[10px]" /> Abrir orçamento
                      </Button>
                      <Button
                        v-if="bloco.orcDisplay"
                        size="sm"
                        variant="secondary"
                        class="text-[10px] font-bold min-w-0 px-3 rounded-lg"
                        @click.stop="abrirPdf(bloco.orcDisplay.id)"
                      >
                        <i class="pi pi-file-pdf mr-1 text-[10px]" /> PDF
                      </Button>
                      <Button
                        v-if="bloco.tipo === 'cadastro'"
                        size="sm"
                        variant="primary"
                        class="text-[10px] font-bold rounded-lg"
                        @click.stop="novoOrcamento(row)"
                      >
                        <i class="pi pi-plus mr-1 text-[10px]" /> Novo orçamento
                      </Button>
                    </div>
                  </div>

                  <!-- Status + vermelho restrito ao selo FINANCEIRO PENDENTE (tom sóbrio, ícone discreto) -->
                  <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :value="bloco.etapa?.status_key ?? ''" :label="(bloco.etapa?.status_label ?? bloco.orcDisplay?.status_label) ?? ''" />
                    <span
                      v-if="bloco.pendencia_financeira"
                      class="inline-flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-[11px] font-semibold text-red-800 dark:text-red-200 border border-red-200/80 dark:border-red-900/60"
                    >
                      <i class="pi pi-minus-circle text-red-600 dark:text-red-300 text-[10px]" aria-hidden="true" />
                      Financeiro pendente
                    </span>
                    <span v-if="bloco.alertaVigencia === 'perto'" class="text-[11px] font-medium text-gray-600 dark:text-slate-400">
                      Contrato perto de expirar
                    </span>
                    <span v-if="bloco.vigenciaExpirada" class="text-[11px] font-medium text-gray-600 dark:text-slate-400">Vigência expirada</span>
                  </div>

                  <!-- Barra de progresso: 11 etapas, cor por etapa (pendente 500, em andamento 600+pulse, concluído slate-700) -->
                  <div class="flex flex-col gap-1.5 max-w-full overflow-x-auto">
                    <div class="grid grid-cols-11 gap-0 text-center text-[7px] font-medium uppercase tracking-wide min-w-[440px]">
                      <span v-for="step in 11" :key="step" class="flex flex-col items-center gap-0" :class="getClasseIconeEtapaBarra(step, bloco.faseNum)">
                        <i :class="['pi text-[10px]', getIconeEtapaBarra(step)]" aria-hidden="true" />
                        <span>{{ getLabelEtapaBarra(step) }}</span>
                      </span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden flex gap-px bg-gray-200 dark:bg-slate-600 min-w-[440px]">
                      <div
                        v-for="step in 11"
                        :key="step"
                        class="h-full flex-1 min-w-0 rounded-full transition-colors duration-200"
                        :class="getClasseSegmentoBarra(step, bloco.faseNum)"
                      />
                    </div>
                  </div>

                  <!-- Prazos (dados exclusivos deste orçamento) -->
                  <div class="flex flex-wrap items-center gap-2 text-[10px] text-gray-600 dark:text-slate-400">
                    <template v-if="bloco.vigenciaExibicao && !bloco.prazoEntregaExibicao">
                      <span>{{ bloco.vigenciaExibicao }}</span>
                      <span v-if="bloco.contadorTexto" :class="getPrazoTextClass(bloco.ehAtrasado)" class="font-semibold">{{ bloco.contadorTexto }}</span>
                    </template>
                    <template v-else-if="bloco.prazoEntregaExibicao">
                      <span>{{ bloco.prazoEntregaExibicao }}</span>
                      <span v-if="bloco.contadorTexto" :class="getPrazoTextClass(bloco.ehAtrasado)" class="font-semibold">{{ bloco.contadorTexto }}</span>
                    </template>
                    <template v-else-if="bloco.prazoLimite">
                      <span>Prazo: {{ formatarDataExibicao(bloco.prazoLimite) }}</span>
                      <span v-if="bloco.contadorTexto" :class="getPrazoTextClass(bloco.ehAtrasado)" class="font-semibold">{{ bloco.contadorTexto }}</span>
                    </template>
                    <p v-if="bloco.notaHistorica" class="text-[10px] italic w-full">{{ bloco.notaHistorica }}</p>
                  </div>

                  <!-- Contrato/Financeiro (vinculado a este orçamento – dados do banco) -->
                  <div v-if="bloco.contratoDisplay" class="rounded-md border border-gray-200 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/40 px-3 py-2">
                    <p class="text-[9px] font-medium uppercase text-gray-500 dark:text-slate-400 mb-1">Contrato</p>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="text-xs font-semibold text-brand-primary">{{ bloco.contratoDisplay.numero }}</span>
                      <span class="text-xs font-semibold tabular-nums text-brand-primary">{{ bloco.contratoDisplay.valorFormatado }}</span>
                      <span class="text-[10px] font-medium text-brand-primary">Vigência: {{ bloco.contratoDisplay.vigenciaAteExibicao }}</span>
                      <Button size="sm" variant="secondary" class="text-[10px] font-bold min-w-0 px-3 rounded-lg" :disabled="!bloco.contratoDisplay.tem_pdf" @click.stop="abrirPdfContrato(bloco.contratoDisplay.id)">
                        <i class="pi pi-file-pdf mr-0.5" /> PDF
                      </Button>
                    </div>
                  </div>
                  <p v-else-if="!bloco.tipo && bloco.etapa?.status_key" class="text-[10px] text-gray-500 dark:text-slate-400 italic">Sem contrato vinculado a este orçamento.</p>

                  <!-- Ação principal -->
                  <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-slate-600">
                    <Button
                      size="sm"
                      variant="primary"
                      class="text-[11px] font-bold rounded-lg"
                      :disabled="bloco.pendencia_financeira"
                      :title="bloco.pendencia_financeira ? 'Regularize Contas a Receber para liberar.' : getDestinoAcompanhar(row, bloco.etapa)?.label"
                      @click.stop="acompanharStatusCliente({ ...row, pendencia_financeira: bloco.pendencia_financeira, etapas: [bloco.etapa] }, bloco.etapa)"
                    >
                      <i class="pi pi-calendar mr-1 text-[10px]" /> {{ getDestinoAcompanhar(row, bloco.etapa)?.label || 'Acompanhar status' }}
                    </Button>
                  </div>
                </div>
              </article>

              <div class="px-4 py-2 border-t border-border-ui flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  class="text-[10px] font-bold"
                  :disabled="row.statusGlobalKey === 'MEDIDA_AGENDADA' || row.statusGlobalKey === 'MEDIDA_EM_ANDAMENTO'"
                  @click.stop="novoOrcamento(row)"
                >
                  <i class="pi pi-plus mr-1 text-[10px]" /> Novo orçamento
                </Button>
                <Button size="sm" variant="secondary" class="text-[10px] font-bold" @click.stop="abrirOrcamentoCliente(row)">
                  Ver orçamentos do cliente
                </Button>
                <Button size="sm" variant="secondary" class="text-[10px] font-bold" @click.stop="abrirCliente(row.id)">
                  Ficha do cliente
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="!loading && totalRows === 0" class="text-center text-text-muted py-8">
          Nenhum registro encontrado para os filtros.
        </p>

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
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PIPELINE_CLIENTE,
  normalizarStatusCliente,
  getStatusVendaOperacionalLabel,
  getStatusVendaFase5,
  getStatusVendaFase11,
  statusVendaEhOrcamento,
  statusVendaEhVenda,
  statusVendaEhAgenda,
  statusVendaEhProducaoPosVenda,
  statusVendaUsa45DiasAposMedidaFina,
  statusVendaEhMedidaFina,
} from '@/constantes'
import { INDICACAO_ORIGENS } from '@/constantes/indicacao'
import { addDiasUteis, PRAZO_POR_FASE, getPrazoAposMedidaFina, getPrazoAte, diasParaLimite, PRAZO_ALERTA_VIGENCIA_DIAS } from '@/constantes/pipeline-regras'
import { getPrazoTextClass } from '@/constantes'

/** Tom sutil do card inteiro conforme a etapa atual (sombra da cor da etapa). 11 etapas. */
const CARD_TOM_BG = [
  'bg-white dark:bg-slate-800/90 border-l-4 border-slate-300 dark:border-slate-600',
  'bg-blue-50/90 dark:bg-slate-800/90 border-l-4 border-blue-200 dark:border-blue-700/60',
  'bg-amber-50/90 dark:bg-slate-800/90 border-l-4 border-amber-200 dark:border-amber-700/60',
  'bg-indigo-50/90 dark:bg-slate-800/90 border-l-4 border-indigo-200 dark:border-indigo-700/60',
  'bg-emerald-50/90 dark:bg-slate-800/90 border-l-4 border-emerald-200 dark:border-emerald-700/60',
  'bg-lime-50/90 dark:bg-slate-800/90 border-l-4 border-lime-200 dark:border-lime-700/60',
  'bg-purple-50/90 dark:bg-slate-800/90 border-l-4 border-purple-200 dark:border-purple-700/60',
  'bg-pink-50/90 dark:bg-slate-800/90 border-l-4 border-pink-200 dark:border-pink-700/60',
  'bg-orange-50/90 dark:bg-slate-800/90 border-l-4 border-orange-200 dark:border-orange-700/60',
  'bg-cyan-50/90 dark:bg-slate-800/90 border-l-4 border-cyan-200 dark:border-cyan-700/60',
  'bg-fuchsia-50/90 dark:bg-slate-800/90 border-l-4 border-fuchsia-200 dark:border-fuchsia-700/60',
]
function getClasseTomCard(faseNum) {
  const idx = Math.min(11, Math.max(1, faseNum ?? 1)) - 1
  return CARD_TOM_BG[idx] || CARD_TOM_BG[0]
}

/** Ícones e labels das 11 etapas para a barra. */
const BARRA_11_ICONES = ['pi-user', 'pi-sliders-h', 'pi-dollar', 'pi-file', 'pi-check', 'pi-calendar', 'pi-ruler', 'pi-pencil', 'pi-cog', 'pi-truck', 'pi-heart']
const BARRA_11_LABELS = ['Cad.', 'Med.', 'Orç.', 'Apres.', 'Fechar', 'Agend.', 'Med.Fina', 'Proj.Téc.', 'Prod.', 'Mont.', 'Pós-Venda']
function getIconeEtapaBarra(step) {
  return BARRA_11_ICONES[step - 1] || 'pi-circle'
}
function getLabelEtapaBarra(step) {
  return BARRA_11_LABELS[step - 1] || ''
}

/** Segmento barra: 11 etapas. Concluído=slate-700, Em andamento=600+pulse, Pendente=500. */
const BARRA_11_PENDENTE = ['bg-slate-500', 'bg-blue-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-lime-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-cyan-500', 'bg-fuchsia-500']
const BARRA_11_EM_ANDAMENTO = ['bg-slate-600', 'bg-blue-600', 'bg-amber-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-lime-600', 'bg-purple-600', 'bg-pink-600', 'bg-orange-600', 'bg-cyan-600', 'bg-fuchsia-600']
function getClasseSegmentoBarra(step, faseAtual) {
  const current = Math.min(11, Math.max(1, faseAtual ?? 1))
  if (step < current) return 'bg-slate-700'
  if (step === current) return (BARRA_11_EM_ANDAMENTO[step - 1] || 'bg-slate-600') + ' animate-pulse'
  return BARRA_11_PENDENTE[step - 1] || 'bg-slate-500'
}

/** Ícone/label barra: 11 etapas. Concluído=slate-700, Em andamento=600, Pendente=500. */
const BARRA_11_ICONE_EM_ANDAMENTO = ['text-slate-600 dark:text-slate-300', 'text-blue-600 dark:text-blue-300', 'text-amber-600 dark:text-amber-300', 'text-indigo-600 dark:text-indigo-300', 'text-emerald-600 dark:text-emerald-300', 'text-lime-600 dark:text-lime-300', 'text-purple-600 dark:text-purple-300', 'text-pink-600 dark:text-pink-300', 'text-orange-600 dark:text-orange-300', 'text-cyan-600 dark:text-cyan-300', 'text-fuchsia-600 dark:text-fuchsia-300']
const BARRA_11_ICONE_PENDENTE = ['text-slate-500 dark:text-slate-400', 'text-blue-500 dark:text-blue-400', 'text-amber-500 dark:text-amber-400', 'text-indigo-500 dark:text-indigo-400', 'text-emerald-500 dark:text-emerald-400', 'text-lime-500 dark:text-lime-400', 'text-purple-500 dark:text-purple-400', 'text-pink-500 dark:text-pink-400', 'text-orange-500 dark:text-orange-400', 'text-cyan-500 dark:text-cyan-400', 'text-fuchsia-500 dark:text-fuchsia-400']
function getClasseIconeEtapaBarra(step, faseAtual) {
  const current = Math.min(11, Math.max(1, faseAtual ?? 1))
  if (step < current) return 'text-slate-700 dark:text-slate-300'
  if (step === current) return (BARRA_11_ICONE_EM_ANDAMENTO[step - 1] || BARRA_11_ICONE_EM_ANDAMENTO[0]) + ' font-semibold'
  return BARRA_11_ICONE_PENDENTE[step - 1] || BARRA_11_ICONE_PENDENTE[0]
}
import { AgendaLojaService, AgendaFabricaService, ClienteService, OrcamentosService, ApontamentoProducaoService, ContratosService } from '@/services/index'
import { useAuth } from '@/services/useauth'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { onlyNumbers } from '@/utils/masks'

definePage({ meta: { perm: 'relatorios.acompanhamento_status.ver' } })

const router = useRouter()
const { usuarioLogado } = useAuth()

const loading = ref(false)
const filtro = ref('')
const statusFiltro = ref('')

/** Primeiro e último dia do mês atual (YYYY-MM-DD) para preenchimento automático dos filtros de data. */
function getMesAtualInicioFim() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate()
  return {
    inicio: `${ano}-${mes}-01`,
    fim: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`,
  }
}
const { inicio: mesAtualInicio, fim: mesAtualFim } = getMesAtualInicioFim()
const filtroDataInicio = ref(mesAtualInicio)
const filtroDataFim = ref(mesAtualFim)
const currentPage = ref(1)
const PAGE_SIZE = 25

/** IDs dos clientes com card expandido (exibir orçamentos) */
const expandedIds = ref(new Set())

function toggleExpand(clienteId) {
  const next = new Set(expandedIds.value)
  if (next.has(clienteId)) next.delete(clienteId)
  else next.add(clienteId)
  expandedIds.value = next
}

const clientes = ref([])
const agendamentos = ref([])
const orcamentos = ref([])
/** Contratos de todos os clientes (cliente_id -> lista ordenada do mais novo ao mais antigo) */
const contratosPorCliente = ref(new Map())
/** Medições em andamento (Timeline): cliente_id -> { funcionario_nome, inicio_em, pausa_total_segundos, pausa_inicio_em } */
const medicaoEmAndamentoMap = ref(new Map())
/** Venda_ids com AGENDAR_MEDIDA_FINA e parcela vencida no Contas a Receber (alerta e bloqueio apenas no bloco daquela venda). */
const vendaIdsComPendenciaFinanceira = ref(new Set())
/** Atualizado a cada 1s para tempo decorrido em tempo real (MEDIÇÃO EM ANDAMENTO). */
const nowForTimer = ref(Date.now())

function getStatusDisplayLabel(statusKey) {
  const key = String(statusKey || '').toUpperCase()
  if (!key) return ''
  if (key === 'MEDIDA_EM_ANDAMENTO') return 'Medida em andamento'
  if (key === 'MEDIDA_AGENDADA' || key === 'MEDICAO_VENDA') return 'Medida'
  return getStatusVendaOperacionalLabel(key)
}

const statusLabelMap = computed(() => {
  const map = new Map()
  for (const item of PIPELINE_CLIENTE || []) {
    const key = String(item?.key || '').toUpperCase()
    if (!key) continue
    map.set(key, getStatusDisplayLabel(key) || String(item?.label || key))
  }
  return map
})

const statusOptions = computed(() =>
  (PIPELINE_CLIENTE || []).map((item) => ({
    value: String(item?.key || '').toUpperCase(),
    label: getStatusDisplayLabel(item?.key) || String(item?.label || item?.key || ''),
  })),
)

function statusKeyParaFase(statusKey) {
  const key = String(statusKey || '').toUpperCase()
  const fase = getStatusVendaFase5(key)
  if (fase != null) return fase
  const item = (PIPELINE_CLIENTE || []).find((i) => String(i?.key || '').toUpperCase() === key)
  if (item?.ordem != null) return Math.min(5, Math.max(1, Math.floor(Number(item.ordem))))
  return 1
}

/** Retorna a etapa atual no fluxo de 11 (1–11) para a barra e o tom do card. */
function statusKeyParaFase11(statusKey) {
  const key = String(statusKey || '').toUpperCase()
  const fase = getStatusVendaFase11(key)
  if (fase != null) return fase
  const item = (PIPELINE_CLIENTE || []).find((i) => String(i?.key || '').toUpperCase() === key)
  if (item?.ordem != null) return Math.min(11, Math.max(1, Math.floor(Number(item.ordem))))
  return 1
}

/** Número total de etapas (fases) do pipeline: 5 (Cadastro → Produção/Montagem). */
const totalEtapasPipeline = computed(() => {
  const ordens = (PIPELINE_CLIENTE || []).map((i) => Number(i?.ordem ?? 0))
  if (!ordens.length) return 5
  const maxOrdem = Math.max(...ordens)
  return Math.max(1, maxOrdem)
})

/** Retorna a label da próxima ação no pipeline (para exibir no prazo). */
function getProximaAcao(statusKey) {
  const key = String(statusKey || '').toUpperCase()
  if (key === 'CLIENTE_CADASTRADO' || key === 'CADASTRO') return 'avançar para Medida ou Orçamento'
  const arr = PIPELINE_CLIENTE || []
  const idx = arr.findIndex((i) => String(i?.key || '').toUpperCase() === key)
  if (idx < 0 || idx >= arr.length - 1) return null
  const proximo = arr[idx + 1]
  return getStatusDisplayLabel(proximo?.key) || proximo?.label || null
}

/** Categorias de agenda que indicam "medida da venda" (conclusão = entrada na fase orçamento). */
const CATEGORIAS_MEDIDA_VENDA = new Set(['MEDIDA', 'AGENDAR_MEDIDA_VENDA', 'MEDIDA_AGENDADA', 'MEDIDA_REALIZADA'])

/** Categorias de agenda "agendar medida" (Agenda de Venda): ao criar/editar, status do cliente vai para Medição. */
const CATEGORIAS_AGENDA_MEDIDA = new Set(['MEDIDA', 'AGENDAR_MEDIDA', 'MEDIDA_AGENDADA'])

/** Categorias de agenda "apresentação do orçamento": quando o vendedor agenda, +7 dias de prazo a partir da data do agendamento. */
const CATEGORIAS_APRESENTACAO_ORCAMENTO = new Set(['APRESENTACAO', 'AGENDAR_APRESENTACAO', 'APRESENTACAO_AGENDADA'])

/** Categorias de agenda "agendar fechar venda": quando agenda para fechar a venda, +7 dias a partir da data do agendamento. */
const CATEGORIAS_AGENDA_FECHAR_VENDA = new Set(['CONTRATO', 'CONTRATO_GERADO'])

/**
 * Filtra agenda por cliente e, se informado, por orçamento (para dados por ID no bloco).
 */
function filtrarAgendaPorClienteEOrcamento(clienteId, orcamentoId) {
  let ags = (agendamentos.value || []).filter((a) => Number(a?.cliente_id) === Number(clienteId))
  if (orcamentoId != null && orcamentoId > 0) {
    ags = ags.filter((a) => Number(a?.orcamento_id) === Number(orcamentoId))
  }
  return ags
}

/**
 * Data base para a etapa ORÇAMENTO: ao agendar AGENDAR_MEDIDA ou AGENDAR_APRESENTACAO, prazo de 7 dias úteis.
 * Considera: conclusão da medida, início do orçamento, agendamento da apresentação ou agendamento da medida (o mais recente).
 * Se orcamentoId for informado, usa apenas eventos de agenda vinculados a esse orçamento (dados por ID).
 */
function getDataBasePrazoOrcamento(clienteId, orcs, orcamentoId) {
  const ags = filtrarAgendaPorClienteEOrcamento(clienteId, orcamentoId)

  const listaMedida = ags.filter(
    (a) =>
      a?.status === 'CONCLUIDO' &&
      CATEGORIAS_MEDIDA_VENDA.has(String(a?.categoria || '').toUpperCase())
  )
  const dataMedidaConcluida =
    listaMedida.length > 0
      ? listaMedida.reduce((max, a) => {
          const t = a?.alterado_em ? new Date(a.alterado_em).getTime() : 0
          return t > max ? t : max
        }, 0)
      : null

  const dataPrimeiroOrcamento =
    orcs?.length > 0
      ? Math.min(...orcs.map((o) => (o?.criado_em ? new Date(o.criado_em).getTime() : Infinity)))
      : null

  const listaApresentacao = ags.filter((a) =>
    CATEGORIAS_APRESENTACAO_ORCAMENTO.has(String(a?.categoria || '').toUpperCase()),
  )
  const dataAgendamentoApresentacao =
    listaApresentacao.length > 0
      ? listaApresentacao.reduce((max, a) => {
          const t = a?.inicio_em ? new Date(a.inicio_em).getTime() : 0
          return t > max ? t : max
        }, 0)
      : null

  const listaAgendaMedida = ags.filter((a) =>
    CATEGORIAS_AGENDA_MEDIDA.has(String(a?.categoria || '').toUpperCase()),
  )
  const dataAgendamentoMedida =
    listaAgendaMedida.length > 0
      ? listaAgendaMedida.reduce((max, a) => {
          const t = a?.inicio_em ? new Date(a.inicio_em).getTime() : 0
          return t > max ? t : max
        }, 0)
      : null

  const candidatos = [dataMedidaConcluida, dataPrimeiroOrcamento, dataAgendamentoApresentacao, dataAgendamentoMedida].filter((t) => t != null)
  if (candidatos.length === 0) return null
  return new Date(Math.max(...candidatos))
}

/** Data base considerando transição de status (ex.: cliente.atualizado_em ao passar para ORÇAMENTO) para zerar o contador de dias. */
function getDataBasePrazoOrcamentoComTransicao(clienteId, orcs, dataTransicaoCliente, orcamentoId) {
  const base = getDataBasePrazoOrcamento(clienteId, orcs, orcamentoId)
  const tsTransicao = dataTransicaoCliente ? new Date(dataTransicaoCliente).getTime() : null
  if (!tsTransicao) return base
  if (!base) return new Date(tsTransicao)
  return new Date(Math.max(base.getTime(), tsTransicao))
}

/**
 * Data em que a medida fina foi concluída (agenda produção: evento MEDIDA_FINA/AGENDAR_MEDIDA_FINA com status CONCLUIDO).
 * Se orcamentoId for informado, considera apenas o evento vinculado a esse orçamento (dados por ID no bloco).
 */
function getDataConclusaoMedidaFina(clienteId, orcamentoId) {
  const ags = filtrarAgendaPorClienteEOrcamento(clienteId, orcamentoId).filter(
    (a) =>
      String(a?.execucao_etapa || a?.status || '').toUpperCase() === 'CONCLUIDO' &&
      (String(a?.subetapa || '').toUpperCase() === 'MEDIDA_FINA' ||
        String(a?.categoria || '').toUpperCase() === 'MEDIDA_FINA' ||
        String(a?.categoria || '').toUpperCase() === 'AGENDAR_MEDIDA_FINA'),
  )
  if (!ags.length) return null
  const maxAlterado = ags.reduce((max, a) => {
    const t = a?.alterado_em ? new Date(a.alterado_em).getTime() : 0
    return t > max ? t : max
  }, 0)
  return maxAlterado ? new Date(maxAlterado) : null
}

/** Retorna texto "DD/MM às HH:mm" do agendamento de medida (visita/medida) do cliente, ou null. */
function getAgendamentoMedicaoExibicao(clienteId) {
  const ags = (agendamentos.value || []).filter(
    (a) =>
      Number(a?.cliente_id) === Number(clienteId) &&
      CATEGORIAS_AGENDA_MEDIDA.has(String(a?.categoria || '').toUpperCase()) &&
      a?.status !== 'CANCELADO'
  )
  if (!ags.length) return null
  const ordenados = [...ags].sort((a, b) => new Date(a.inicio_em || 0).getTime() - new Date(b.inicio_em || 0).getTime())
  const proximo = ordenados.find((a) => new Date(a.inicio_em || 0).getTime() >= Date.now()) || ordenados[ordenados.length - 1]
  const dt = proximo?.inicio_em ? new Date(proximo.inicio_em) : null
  if (!dt || Number.isNaN(dt.getTime())) return null
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} às ${hh}:${min}`
}

/** Cliente tem agendamento de medida (medida agendada) → status mínimo Medição. */
function clienteTemAgendamentoMedida(clienteId) {
  return (agendamentos.value || []).some(
    (a) =>
      Number(a?.cliente_id) === Number(clienteId) &&
      CATEGORIAS_AGENDA_MEDIDA.has(String(a?.categoria || '').toUpperCase()) &&
      a?.status !== 'CANCELADO'
  )
}

/**
 * Data base para etapa "agendar fechar venda": data do agendamento (inicio_em) quando o vendedor agenda para fechar a venda.
 * Se orcamentoId for informado, considera apenas agendamentos vinculados a esse orçamento (dados por ID no bloco).
 */
function getDataBasePrazoFecharVenda(clienteId, orcamentoId) {
  const ags = filtrarAgendaPorClienteEOrcamento(clienteId, orcamentoId).filter((a) =>
    CATEGORIAS_AGENDA_FECHAR_VENDA.has(String(a?.categoria || '').toUpperCase()),
  )
  if (!ags.length) return null
  const maxInicio = ags.reduce((max, a) => {
    const t = a?.inicio_em ? new Date(a.inicio_em).getTime() : 0
    return t > max ? t : max
  }, 0)
  return maxInicio ? new Date(maxInicio) : null
}

/** Data base para cálculo do prazo: por fase. Quando orcAtivo está definido (bloco por orçamento), usa apenas dados daquele ID. */
function getDataBasePrazo(c, { statusAtual, orcs, clienteId, orcAtivo } = {}) {
  const key = String(statusAtual || '').toUpperCase()
  const id = clienteId ?? c?.id
  const orcamentoId = orcAtivo?.id ?? null
  const orcsParaPrazo = orcAtivo ? [orcAtivo] : orcs

  const ehFaseFecharVenda = key === 'VENDA_FECHADA' || key === 'CONTRATO_GERADO'
  if (ehFaseFecharVenda && id != null) {
    const base = getDataBasePrazoFecharVenda(id, orcamentoId)
    if (base) return base
  }

  const ehFaseOrcamento =
    statusVendaEhOrcamento(key) ||
    key === 'ORCAMENTO_EM_ANDAMENTO' ||
    key === 'ORCAMENTO_ENVIADO' ||
    key === 'ORCAMENTO_EM_NEGOCIACAO'
  if (ehFaseOrcamento && (orcsParaPrazo?.length > 0 || id != null)) {
    const tsCliente = c?.atualizado_em ? new Date(c.atualizado_em).getTime() : null
    const tsVenda = orcAtivo?.venda?.alterado_em ? new Date(orcAtivo.venda.alterado_em).getTime() : null
    const dataTransicao = [tsCliente, tsVenda].filter(Boolean).length
      ? new Date(Math.max(tsCliente || 0, tsVenda || 0))
      : c?.atualizado_em
    const base = getDataBasePrazoOrcamentoComTransicao(id, orcsParaPrazo, dataTransicao, orcamentoId)
    if (base) return base
  }
  if (!c?.criado_em) return null
  const d = new Date(c.criado_em)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Formata data para exibição (pt-BR). Corrige fuso: datas só-dia (YYYY-MM-DD) são tratadas
 * como meio-dia UTC para exibir o dia correto no Brasil; demais usam America/Sao_Paulo.
 */
function formatarDataExibicao(date) {
  if (!date) return ''
  let d
  if (date instanceof Date) {
    d = date
  } else {
    const str = String(date).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      d = new Date(str + 'T12:00:00.000Z')
    } else {
      d = new Date(date)
    }
  }
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/** Para um status_key, retorna a etapa atual (1 a 11) no fluxo completo. Usado na barra de progresso e tom do card. */
function etapaNumeroPorStatus(statusKey) {
  const fase = statusKeyParaFase11(statusKey)
  return fase == null ? 1 : Math.min(11, Math.max(1, fase))
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

/** Status que usam o prazo de 45 dias corridos após conclusão da medida fina (projeto técnico + produção + montagem). */
const STATUS_45_DIAS_APOS_MEDIDA_FINA = new Set([
  'AGUARDANDO_PRECIFICACAO',
  'AGUARDANDO_PROJETO_TECNICO',
  'PROJETO_TECNICO_EM_ANDAMENTO',
  'PROJETO_TECNICO_CONCLUIDO',
  'PROJETO_TECNICO_APROVADO',
  'PRODUCAO_AGENDADA',
  'EM_PRODUCAO',
  'PRODUCAO_FINALIZADA',
  'AGENDAR_MONTAGEM',
  'MONTAGEM_AGENDADA',
  'EM_MONTAGEM',
])

/**
 * Calcula prazo, vigência e contrato para um único orçamento (bloco) – usado na linha do tempo por orçamento.
 */
function computeBlocoData(c, orc, clienteId, etapa, orcs) {
  const statusAtual = etapa?.status_key
  const key = String(statusAtual || '').toUpperCase()
  const ehMedidaFina = statusVendaEhMedidaFina(key)
  const contrato = orc?.venda?.contratos?.[0] ?? null
  let dataBase = getDataBasePrazo(c, { statusAtual, orcs, clienteId, orcAtivo: orc })
  let prazoAte = null
  let prazoLabel = getProximaAcao(statusAtual) || ''

  if (ehMedidaFina && contrato?.data_inicio != null && contrato?.data_fim != null) {
    dataBase = contrato.data_inicio instanceof Date ? contrato.data_inicio : new Date(contrato.data_inicio)
    prazoAte = contrato.data_fim instanceof Date ? contrato.data_fim : new Date(contrato.data_fim)
    prazoLabel = 'Data para marcar a medida fina'
  } else if (statusVendaUsa45DiasAposMedidaFina(key)) {
    const dataConclusaoMedidaFina = getDataConclusaoMedidaFina(clienteId, orc?.id)
    if (dataConclusaoMedidaFina) {
      dataBase = dataConclusaoMedidaFina
      prazoAte = getPrazoAposMedidaFina(dataConclusaoMedidaFina)
      prazoLabel = 'Projeto técnico / produção / montagem (45 dias corridos)'
    }
  } else {
    const faseParaPrazo =
      key === 'CLIENTE_CADASTRADO' || key === 'CADASTRO'
        ? 'CADASTRO'
        : statusVendaEhOrcamento(key) ||
            key === 'ORCAMENTO_EM_ANDAMENTO' ||
            key === 'ORCAMENTO_ENVIADO' ||
            key === 'ORCAMENTO_EM_NEGOCIACAO'
          ? 'ORCAMENTO'
          : key === 'VENDA_FECHADA' || key === 'CONTRATO_GERADO'
            ? 'FECHAR_VENDA'
            : null
    if (faseParaPrazo === 'FECHAR_VENDA' && !dataBase) faseParaPrazo = null
    prazoAte = faseParaPrazo ? getPrazoAte(dataBase, faseParaPrazo) : null
  }

  const temContratoVigente = contrato?.status === 'VIGENTE'
  const dataConclusaoMedidaFina = getDataConclusaoMedidaFina(clienteId, orc?.id)
  const medidaFinaRealizada = !!dataConclusaoMedidaFina
  const dataVigenciaFim = temContratoVigente && contrato?.data_fim ? (contrato.data_fim instanceof Date ? contrato.data_fim : new Date(contrato.data_fim)) : null
  const prazoEntrega45 = dataConclusaoMedidaFina ? getPrazoAposMedidaFina(dataConclusaoMedidaFina) : null

  let prazoLimite = prazoAte
  if (temContratoVigente && medidaFinaRealizada && prazoEntrega45) prazoLimite = prazoEntrega45
  else if (temContratoVigente && dataVigenciaFim) prazoLimite = dataVigenciaFim

  const diasContador = prazoLimite != null ? diasParaLimite(prazoLimite) : null
  const contadorTexto = diasContador != null
    ? (diasContador > 0 ? `(Faltam ${diasContador} dias)` : diasContador < 0 ? `(Atrasado ${Math.abs(diasContador)} dias)` : '(Vence hoje)')
    : ''
  const ehAtrasado = prazoLimite != null && diasContador != null && diasContador < 0

  let vigenciaExibicao = null
  let prazoEntregaExibicao = null
  let alertaVigencia = 'ok'
  let vigenciaExpirada = false
  if (temContratoVigente && dataVigenciaFim) {
    const diasVigencia = diasParaLimite(dataVigenciaFim)
    if (diasVigencia != null && diasVigencia < 0) {
      alertaVigencia = 'expirada'
      vigenciaExpirada = true
    } else if (diasVigencia != null && diasVigencia <= PRAZO_ALERTA_VIGENCIA_DIAS && !medidaFinaRealizada) alertaVigencia = 'perto'
    if (!medidaFinaRealizada) {
      const meses = diasVigencia != null && diasVigencia > 0 ? Math.floor(diasVigencia / 30) : 0
      const diasRest = diasVigencia != null && diasVigencia > 0 ? diasVigencia % 30 : 0
      const parte = (meses > 0 ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : '') + (meses > 0 && diasRest > 0 ? ' e ' : '') + (diasRest > 0 ? `${diasRest} dias` : '')
      vigenciaExibicao = `⏳ Vigência: ${formatarDataExibicao(dataVigenciaFim)} (Faltam ${parte || '0 dias'})`
    } else if (prazoEntrega45) prazoEntregaExibicao = `Prazo de Entrega: ${formatarDataExibicao(prazoEntrega45)}`
  }

  const dataAssinaturaContrato = temContratoVigente && contrato?.data_assinatura ? (contrato.data_assinatura instanceof Date ? contrato.data_assinatura : new Date(contrato.data_assinatura)) : null
  const notaHistorica = (dataAssinaturaContrato || medidaFinaRealizada)
    ? [
        dataAssinaturaContrato ? `Contrato assinado em ${formatarDataExibicao(dataAssinaturaContrato)}` : null,
        dataConclusaoMedidaFina ? `Medida Fina realizada em ${formatarDataExibicao(dataConclusaoMedidaFina)}` : null,
      ].filter(Boolean).join(' | ')
    : null

  const valorContrato = Number(contrato?.valor || 0)
  const valorExibir = valorContrato > 0 ? valorContrato : Number(orc?.venda?.valor_vendido ?? orc?.venda?.valor_total ?? 0)
  const contratoDisplay = contrato
    ? {
        id: contrato.id,
        numero: (contrato.numero || '').trim() || '—',
        valor: valorExibir,
        valorFormatado: valorExibir > 0 ? format.currency(valorExibir) : '—',
        dataEmissaoExibicao: (contrato.data_assinatura || contrato.criado_em) ? formatarDataExibicao(new Date(contrato.data_assinatura || contrato.criado_em)) : '—',
        vigenciaAteExibicao: contrato.data_fim ? formatarDataExibicao(new Date(contrato.data_fim)) : '—',
        tem_pdf: !!contrato.tem_pdf,
      }
    : null

  const pendencia_financeira = key === 'AGENDAR_MEDIDA_FINA' && orc?.venda?.id != null && vendaIdsComPendenciaFinanceira.value.has(Number(orc.venda.id))
  const faseAtual = etapa?.etapa_numero ?? statusKeyParaFase11(key)
  const faseNum = typeof faseAtual === 'number' ? Math.min(11, Math.max(1, faseAtual)) : statusKeyParaFase11(key)

  return {
    prazoLimite,
    contadorTexto,
    ehAtrasado,
    vigenciaExibicao,
    prazoEntregaExibicao,
    alertaVigencia,
    vigenciaExpirada,
    contratoDisplay,
    notaHistorica,
    pendencia_financeira,
    faseNum,
  }
}

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
  if (statusVendaEhVenda(statusKey) && vendaId) {
    return { path: `/vendas/venda/${vendaId}`, label: 'Abrir venda' }
  }
  if (statusVendaEhProducaoPosVenda(statusKey) && vendaId) {
    return { path: `/vendas/venda/${vendaId}`, label: 'Abrir venda' }
  }
  if (statusVendaEhOrcamento(statusKey) || statusKey === 'ORCAMENTO_EM_ANDAMENTO' || statusKey === 'ORCAMENTO_ENVIADO' || statusKey === 'ORCAMENTO_EM_NEGOCIACAO') {
    if (orcamentoId) return { path: `/orcamentos/${orcamentoId}`, label: 'Abrir orçamento' }
    return { path: `/orcamentos/cliente/${clienteId}`, label: 'Orçamentos do cliente' }
  }
  if (statusVendaEhAgenda(statusKey)) {
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

/** Nomes da equipe (responsáveis) do agendamento para exibir na coluna Agendamento */
function formatarResponsaveisAgendamento(ag) {
  if (!ag?.equipe?.length) return ''
  const nomes = ag.equipe.map((e) => e?.funcionario?.nome).filter(Boolean)
  return nomes.length ? nomes.join(', ') : ''
}

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Retorna { inicio, fim } do mês atual em timestamp (fuso America/Sao_Paulo para consistência). */
function getMesAtualLimites() {
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth()
  const inicio = new Date(ano, mes, 1, 0, 0, 0, 0)
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999)
  return { inicio: inicio.getTime(), fim: fim.getTime() }
}

/** Verifica se o timestamp (ou Date) cai dentro do mês atual (local). */
function estaNoMesAtual(ts) {
  if (ts == null) return false
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime()
  const { inicio, fim } = getMesAtualLimites()
  return t >= inicio && t <= fim
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

  if (statusVendaEhOrcamento(statusKey)) {
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
      const statusKey = normalizarStatusCliente(c?.status || 'INATIVO')
      const ag = agendamentoParaEtapa(clienteId, null)
      const agFmtEtapa = formatarDataHoraAgendamento(ag?.inicio_em)
      etapas.push({
        orcamento_id: null,
        orcamento_numero: null,
        status_key: statusKey,
        status_label: getStatusDisplayLabel(statusKey) || statusKey,
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
          status_label: getStatusDisplayLabel(statusKey) || statusKey,
          etapa_numero: etapaNumeroPorStatus(statusKey),
          agendamento_data: agFmtEtapa?.data ?? null,
          agendamento_hora: agFmtEtapa?.hora ?? null,
          agendamento_inicio_em: ag?.inicio_em ? new Date(ag.inicio_em).getTime() : null,
        })
      })
    }

    const ag = selecionarAgendamentoDoCliente(clienteId)
    const agFmt = formatarDataHoraAgendamento(ag?.inicio_em)
    const responsaveis = formatarResponsaveisAgendamento(ag)

    const statusAtual = etapas[0]?.status_key
    const etapaNum = etapaNumeroPorStatus(statusAtual)
    const key = String(statusAtual || '').toUpperCase()
    const ehMedidaFina = statusVendaEhMedidaFina(key)
    const contrato = orcs?.[0]?.venda?.contratos?.[0]
    const orcAtivo = orcs?.length
      ? orcs.reduce((best, o) => {
          const f = statusKeyParaFase(String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO'))
          if (!best) return o
          const bestF = statusKeyParaFase(String(best?.venda?.status || ''))
          if (f > bestF) return o
          if (f < bestF) return best
          const ts = (x) => new Date(x?.venda?.alterado_em || x?.alterado_em || 0).getTime()
          return ts(o) >= ts(best) ? o : best
        }, null)
      : null

    let dataBase = getDataBasePrazo(c, { statusAtual, orcs, clienteId, orcAtivo })
    let prazoAte = null
    let prazoLabel = getProximaAcao(statusAtual) || ''

    if (ehMedidaFina && contrato?.data_inicio != null && contrato?.data_fim != null) {
      dataBase = contrato.data_inicio instanceof Date ? contrato.data_inicio : new Date(contrato.data_inicio)
      prazoAte = contrato.data_fim instanceof Date ? contrato.data_fim : new Date(contrato.data_fim)
      prazoLabel = 'Data para marcar a medida fina'
    } else if (statusVendaUsa45DiasAposMedidaFina(key)) {
      const dataConclusaoMedidaFina = getDataConclusaoMedidaFina(clienteId)
      if (dataConclusaoMedidaFina) {
        dataBase = dataConclusaoMedidaFina
        prazoAte = getPrazoAposMedidaFina(dataConclusaoMedidaFina)
        prazoLabel = 'Projeto técnico / produção / montagem (45 dias corridos)'
      }
    } else {
      let faseParaPrazo =
        key === 'CLIENTE_CADASTRADO' || key === 'CADASTRO'
          ? 'CADASTRO'
            : statusVendaEhOrcamento(key) ||
              key === 'ORCAMENTO_EM_ANDAMENTO' ||
              key === 'ORCAMENTO_ENVIADO' ||
              key === 'ORCAMENTO_EM_NEGOCIACAO'
            ? 'ORCAMENTO'
            : key === 'VENDA_FECHADA' || key === 'CONTRATO_GERADO'
              ? 'FECHAR_VENDA'
              : null
      if (faseParaPrazo === 'FECHAR_VENDA' && !dataBase) faseParaPrazo = null
      prazoAte = faseParaPrazo ? getPrazoAte(dataBase, faseParaPrazo) : null
      prazoLabel =
        faseParaPrazo === 'ORCAMENTO'
          ? 'prazo para concluir Orçamento ou avançar para Apresentação'
          : faseParaPrazo === 'FECHAR_VENDA'
            ? 'prazo para concluir Fechamento'
            : prazoLabel
    }

    const temContratoVigente = contrato?.status === 'VIGENTE'
    const dataConclusaoMedidaFina = getDataConclusaoMedidaFina(clienteId)
    const medidaFinaRealizada = !!dataConclusaoMedidaFina
    const dataVigenciaFim = temContratoVigente && contrato?.data_fim ? (contrato.data_fim instanceof Date ? contrato.data_fim : new Date(contrato.data_fim)) : null
    const prazoEntrega45 = dataConclusaoMedidaFina ? getPrazoAposMedidaFina(dataConclusaoMedidaFina) : null

    let prazoLimite = prazoAte
    if (temContratoVigente && medidaFinaRealizada && prazoEntrega45) {
      prazoLimite = prazoEntrega45
    } else if (temContratoVigente && dataVigenciaFim) {
      prazoLimite = dataVigenciaFim
    }

    const diasContador = prazoLimite != null ? diasParaLimite(prazoLimite) : null
    const contadorTexto = diasContador != null
      ? (diasContador > 0 ? `(Faltam ${diasContador} dias)` : diasContador < 0 ? `(Atrasado ${Math.abs(diasContador)} dias)` : '(Vence hoje)')
      : ''
    const ehAtrasado = prazoLimite != null && diasContador != null && diasContador < 0

    let vigenciaExibicao = null
    let prazoEntregaExibicao = null
    let alertaVigencia = 'ok'
    let vigenciaExpirada = false
    if (temContratoVigente && dataVigenciaFim) {
      const diasVigencia = diasParaLimite(dataVigenciaFim)
      if (diasVigencia != null && diasVigencia < 0) {
        alertaVigencia = 'expirada'
        vigenciaExpirada = true
      } else if (diasVigencia != null && diasVigencia <= PRAZO_ALERTA_VIGENCIA_DIAS && !medidaFinaRealizada) {
        alertaVigencia = 'perto'
      }
      if (!medidaFinaRealizada) {
        const meses = diasVigencia != null && diasVigencia > 0 ? Math.floor(diasVigencia / 30) : 0
        const diasRest = diasVigencia != null && diasVigencia > 0 ? diasVigencia % 30 : 0
        const parte = (meses > 0 ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : '') + (meses > 0 && diasRest > 0 ? ' e ' : '') + (diasRest > 0 ? `${diasRest} dias` : '')
        vigenciaExibicao = `⏳ Vigência: ${formatarDataExibicao(dataVigenciaFim)} (Faltam ${parte || '0 dias'})`
      } else if (prazoEntrega45) {
        prazoEntregaExibicao = `Prazo de Entrega: ${formatarDataExibicao(prazoEntrega45)}`
      }
    }

    const dataAssinaturaContrato = temContratoVigente && contrato?.data_assinatura ? (contrato.data_assinatura instanceof Date ? contrato.data_assinatura : new Date(contrato.data_assinatura)) : null
    const notaHistorica = (dataAssinaturaContrato || medidaFinaRealizada)
      ? [
          dataAssinaturaContrato ? `Contrato assinado em ${formatarDataExibicao(dataAssinaturaContrato)}` : null,
          dataConclusaoMedidaFina ? `Medida Fina realizada em ${formatarDataExibicao(dataConclusaoMedidaFina)}` : null,
        ].filter(Boolean).join(' | ')
      : null

    listaRows.push({
      id: clienteId,
      uniqueKey: `cliente-${clienteId}`,
      nome_exibicao: c?.nome_completo || c?.razao_social || '-',
      nome_completo: c?.nome_completo || '',
      razao_social: c?.razao_social || '',
      nome_fantasia: c?.nome_fantasia || '',
      documento: c?.cpf || c?.cnpj || '',
      telefone_exibicao: c?.whatsapp || c?.telefone || '',
      email: c?.email || '',
      endereco_resumo: [c?.endereco, c?.numero, c?.bairro].filter(Boolean).join(', ') || '-',
      endereco: c?.endereco || '',
      numero: c?.numero || '',
      bairro: c?.bairro || '',
      complemento: c?.complemento || '',
      cidade: c?.cidade || '',
      estado: c?.estado || '',
      etapas,
      etapa_total: totalEtapas,
      etapa_numero: etapaNum,
      status_key: statusAtual,
      criado_em_exibicao: dataBase ? formatarDataExibicao(dataBase) : '',
      prazo_ate_exibicao: prazoAte && prazoLabel ? formatarDataExibicao(prazoAte) : '',
      prazo_label: prazoLabel,
      prazoLimite,
      contadorTexto,
      ehAtrasado,
      vigenciaExibicao,
      prazoEntregaExibicao,
      alertaVigencia,
      vigenciaExpirada,
      notaHistorica,
      agendamento_data: agFmt?.data ?? '-',
      agendamento_hora: agFmt?.hora ?? '',
      agendamento_descricao: String(ag?.titulo || ag?.categoria || '').trim(),
      agendamento_responsaveis: responsaveis,
      acoes: [],

      /** Vendedor que criou/está no cadastro do cliente (vendedor_responsavel). Sempre exibido no fluxo quando existir. */
      vendedorCadastroExibicao: (c?.vendedor_responsavel?.nome ?? '').trim() || '',
      /** Origem do cliente (Instagram, E-mail, Loja Física, etc.) para exibir ao lado do responsável. */
      origemExibicao: (() => {
        const key = String(c?.indicacao_origem || '').toUpperCase().trim()
        if (!key) return ''
        const item = (INDICACAO_ORIGENS || []).find((o) => String(o?.key || '').toUpperCase() === key)
        return item?.label || key || ''
      })(),

      // ---- Card com blocos por orçamento (linha do tempo independente por orçamento) ----
      orcamentosList: (() => {
        const list = orcs.map((orc, idx) => {
          const statusKey = String(orc?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO').toUpperCase()
          const fase = statusKeyParaFase(statusKey)
          const contrato = orc?.venda?.contratos?.[0]
          const contratoVigente = contrato?.status === 'VIGENTE'
          const valor = Number(orc?.venda?.valor_vendido ?? orc?.total_itens ?? orc?.valor_total ?? 0)
          const dataOrc = orc?.alterado_em || orc?.criado_em
          const ehAprovadoOuContrato =
            statusKey === 'ORCAMENTO_APROVADO' ||
            statusVendaEhVenda(statusKey) ||
            statusKeyParaFase(statusKey) === 4
          return {
            id: orc?.id,
            numero: idx + 1,
            valor,
            valorFormatado: format.currency(valor),
            dataExibicao: dataOrc ? formatarDataExibicao(new Date(dataOrc)) : '—',
            status_key: statusKey,
            status_label: getStatusDisplayLabel(statusKey) || statusKey,
            fase,
            contratoVigente,
            ehAprovadoOuContrato,
          }
        })
        const orcToTs = (orc) => (orc?.alterado_em || orc?.criado_em) ? new Date(orc.alterado_em || orc.criado_em).getTime() : 0
        const comFase = list.map((o) => ({ ...o, _ts: orcToTs(orcs.find((x) => x.id === o.id)) }))
        comFase.sort((a, b) => {
          if (b._ts !== a._ts) return b._ts - a._ts
          if (b.fase !== a.fase) return b.fase - a.fase
          return (b.id || 0) - (a.id || 0)
        })
        const idAtivo = comFase[0]?.id
        return list.map((o) => ({ ...o, ehAtivo: o.id === idAtivo }))
      })(),
      blocos: (() => {
        const list = orcs.map((orc, idx) => {
          const statusKey = String(orc?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO').toUpperCase()
          const fase = statusKeyParaFase(statusKey)
          const valor = Number(orc?.venda?.valor_vendido ?? orc?.total_itens ?? orc?.valor_total ?? 0)
          const dataOrc = orc?.alterado_em || orc?.criado_em
          const orcDisplay = {
            id: orc?.id,
            /** Número do orçamento no banco (ID) para exibição correta por bloco. */
            numero: orc?.id ?? idx + 1,
            valor,
            valorFormatado: format.currency(valor),
            dataExibicao: dataOrc ? formatarDataExibicao(new Date(dataOrc)) : '—',
            status_key: statusKey,
            status_label: getStatusDisplayLabel(statusKey) || statusKey,
          }
          const etapa = etapas[idx]
          const blocoData = computeBlocoData(c, orc, clienteId, etapa, orcs)
          return { orcDisplay, etapa, ...blocoData }
        })
        const orcToTs = (o) => (o?.alterado_em || o?.criado_em) ? new Date(o.alterado_em || o.criado_em).getTime() : 0
        list.sort((a, b) => orcToTs(orcs.find((x) => x.id === b.orcDisplay?.id)) - orcToTs(orcs.find((x) => x.id === a.orcDisplay?.id)))
        if (list.length) return list
        return [{
          tipo: 'cadastro',
          orcDisplay: null,
          etapa: etapas[0],
          faseNum: etapaNumeroPorStatus(etapas[0]?.status_key) ?? 1,
          prazoLimite: null,
          contadorTexto: '',
          ehAtrasado: false,
          vigenciaExibicao: null,
          prazoEntregaExibicao: null,
          alertaVigencia: 'ok',
          vigenciaExpirada: false,
          contratoDisplay: null,
          notaHistorica: null,
          pendencia_financeira: false,
        }]
      })(),
      statusGlobalKey: (() => {
        if (orcs.length > 0) {
          const comFase = orcs.map((o) => ({
            statusKey: String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO').toUpperCase(),
            fase: statusKeyParaFase(String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO')),
          }))
          comFase.sort((a, b) => b.fase - a.fase)
          return comFase[0]?.statusKey || 'CLIENTE_CADASTRADO'
        }
        const key = normalizarStatusCliente(c?.status || 'CLIENTE_CADASTRADO')
        const fase = statusKeyParaFase(key)
        if (clienteTemAgendamentoMedida(clienteId) && fase < 2) return 'MEDIDA_AGENDADA'
        return key
      })(),
      statusGlobalLabel: (() => {
        let key =
          orcs.length > 0
            ? (() => {
                const comFase = orcs.map((o) => ({
                  statusKey: String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO').toUpperCase(),
                  fase: statusKeyParaFase(String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO')),
                }))
                comFase.sort((a, b) => b.fase - a.fase)
                return comFase[0]?.statusKey || 'CLIENTE_CADASTRADO'
              })()
            : normalizarStatusCliente(c?.status || 'CLIENTE_CADASTRADO')
        if (orcs.length === 0 && clienteTemAgendamentoMedida(clienteId) && statusKeyParaFase(key) < 2) key = 'MEDIDA_AGENDADA'
        if (key === 'MEDIDA_EM_ANDAMENTO') return 'MEDIÇÃO EM ANDAMENTO ⏱️'
        return getStatusDisplayLabel(key) || statusLabelMap.value.get(key) || key
      })(),
      faseAtual: (() => {
        let key =
          orcs.length > 0
            ? (() => {
                const comFase = orcs.map((o) => ({
                  statusKey: String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO').toUpperCase(),
                  fase: statusKeyParaFase(String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO')),
                }))
                comFase.sort((a, b) => b.fase - a.fase)
                return comFase[0]?.statusKey || 'CLIENTE_CADASTRADO'
              })()
            : normalizarStatusCliente(c?.status || 'CLIENTE_CADASTRADO')
        if (orcs.length === 0 && clienteTemAgendamentoMedida(clienteId) && statusKeyParaFase(key) < 2) key = 'MEDIDA_AGENDADA'
        let fase = statusKeyParaFase(key)
        if (orcs.length > 0 && fase < 3) fase = 3
        if (medidaFinaRealizada && fase >= 4) return 5
        return fase
      })(),
      ultimaAtualizacao: (() => {
        const datas = [c?.alterado_em || c?.criado_em].filter(Boolean)
        orcs.forEach((o) => {
          if (o?.alterado_em) datas.push(o.alterado_em)
          if (o?.venda?.alterado_em) datas.push(o.venda.alterado_em)
        })
        if (!datas.length) return ''
        const max = new Date(Math.max(...datas.map((d) => new Date(d).getTime())))
        return formatarDataExibicao(max)
      })(),
      /** Timestamp da última atualização (para filtro por mês vigente). */
      ultimaAtualizacaoTs: (() => {
        const datas = [c?.alterado_em || c?.criado_em].filter(Boolean)
        orcs.forEach((o) => {
          if (o?.alterado_em) datas.push(o.alterado_em)
          if (o?.venda?.alterado_em) datas.push(o.venda.alterado_em)
        })
        if (!datas.length) return null
        return Math.max(...datas.map((d) => new Date(d).getTime()))
      })(),
      prazoFinalExibicao: (() => {
        const key = statusAtual ? String(statusAtual).toUpperCase() : ''
        const orcAtivo = orcs.length
          ? (() => {
              const comFase = orcs.map((o) => ({
                orc: o,
                fase: statusKeyParaFase(String(o?.venda?.status || 'ORCAMENTO_EM_ANDAMENTO')),
              }))
              comFase.sort((a, b) => b.fase - a.fase)
              return comFase[0]?.orc
            })()
          : null
        const contrato = orcAtivo?.venda?.contratos?.[0]
        const temContratoVigente = contrato?.status === 'VIGENTE'
        if (temContratoVigente && (key === 'MEDIDA_FINA_REALIZADA' || statusVendaUsa45DiasAposMedidaFina(key))) {
          const dataConclusaoMedidaFina = getDataConclusaoMedidaFina(clienteId)
          if (dataConclusaoMedidaFina) {
            const prazo45 = getPrazoAposMedidaFina(dataConclusaoMedidaFina)
            return formatarDataExibicao(prazo45) ? `${formatarDataExibicao(prazo45)} (45 dias)` : ''
          }
        }
        // Prazo com base na validade do orçamento ativo (quando em fase orçamento); considera transição de status para zerar contador
        if (orcs.length > 0 && orcAtivo) {
          const baseOrcAtivo = getDataBasePrazoOrcamentoComTransicao(clienteId, [orcAtivo], c?.atualizado_em)
          if (baseOrcAtivo) {
            const prazoValidade = getPrazoAte(baseOrcAtivo, 'ORCAMENTO')
            if (prazoValidade) return formatarDataExibicao(prazoValidade)
          }
        }
        if (prazoAte && prazoLabel) return formatarDataExibicao(prazoAte)
        return ''
      })(),
      agendamentoMedicaoExibicao: getAgendamentoMedicaoExibicao(clienteId),
      responsavelExibicao: (() => {
        const vendedorCadastro = c?.vendedor_responsavel?.nome || ''
        const statusAtualKey = etapas[0]?.status_key ?? normalizarStatusCliente(c?.status ?? '')
        if (medidaFinaRealizada) {
          const agsFabrica = (agendamentos.value || []).filter(
            (a) =>
              Number(a?.cliente_id) === Number(clienteId) &&
              (String(a?.categoria || '').toUpperCase().includes('MONTAGEM') ||
                String(a?.categoria || '').toUpperCase().includes('PRODUCAO') ||
                String(a?.categoria || '').toUpperCase().includes('PROJETO_TECNICO'))
          )
          const ag = agsFabrica.find((a) => a?.equipe?.length) || agsFabrica[0]
          const nomes = (ag?.equipe || []).map((e) => e?.funcionario?.nome).filter(Boolean)
          return nomes.length ? nomes.join(', ') : vendedorCadastro
        }
        if (statusAtualKey === 'MEDIDA_EM_ANDAMENTO') {
          const emAndamento = medicaoEmAndamentoMap.value.get(clienteId)
          if (emAndamento?.funcionario_nome) return emAndamento.funcionario_nome
        }
        if (statusAtualKey === 'CRIAR_ORCAMENTO' && orcs.length === 0) {
          const ag = selecionarAgendamentoDoCliente(clienteId)
          const nome = ag?.criado_por_usuario?.nome || ag?.criado_por?.nome
          return nome || vendedorCadastro
        }
        if (orcs.length > 0) {
          const criadoPor = orcs[0]?.criado_por_usuario?.nome || orcs[0]?.venda?.criado_por_usuario?.nome
          return criadoPor || vendedorCadastro
        }
        if (clienteTemAgendamentoMedida(clienteId)) {
          const ags = (agendamentos.value || []).filter((a) => Number(a?.cliente_id) === Number(clienteId) && CATEGORIAS_AGENDA_MEDIDA.has(String(a?.categoria || '').toUpperCase()))
          const ag = ags[0]
          const nomes = (ag?.equipe || []).map((e) => e?.funcionario?.nome).filter(Boolean)
          return nomes.length ? nomes.join(', ') : vendedorCadastro
        }
        return vendedorCadastro
      })(),
      tempoDecorridoExibicao: null,
      contratosList: (() => {
        const list = (contratosPorCliente.value.get(clienteId) || []).map((ct) => {
          const dataEmissao = ct.data_assinatura || ct.criado_em
          const vigenciaAte = ct.data_fim
          return {
            id: ct.id,
            numero: ct.numero,
            valor: Number(ct.valor || 0),
            valorFormatado: format.currency(Number(ct.valor || 0)),
            dataEmissaoExibicao: dataEmissao ? formatarDataExibicao(new Date(dataEmissao)) : '—',
            vigenciaAteExibicao: vigenciaAte ? formatarDataExibicao(new Date(vigenciaAte)) : '—',
            tem_pdf: !!ct.tem_pdf,
          }
        })
        return list
      })(),
      prontoParaOrcamento: orcs.length === 0 && String(c?.status || '').toUpperCase() === 'CRIAR_ORCAMENTO',

      /** AGENDAR_MEDIDA_FINA + parcela vencida no Contas a Receber: exibir alerta e bloquear abertura da agenda. */
      pendencia_financeira: (etapas || []).some((e) => e?.venda_id != null && vendaIdsComPendenciaFinanceira.value.has(Number(e.venda_id))),

      // IDs de responsáveis (para filtro "Acesso Global de Clientes": sem a permissão, só vê onde é responsável)
      responsavelUsuarioIds: (() => {
        const ids = new Set()
        orcs.forEach((orc) => {
          const uid = orc?.venda?.representante_venda_usuario_id ?? orc?.venda?.representante_venda_usuario?.id
          if (uid) ids.add(Number(uid))
        })
        const agCriadoPor = ag?.criado_por_usuario_id ?? ag?.criado_por_usuario?.id
        if (agCriadoPor) ids.add(Number(agCriadoPor))
        return Array.from(ids)
      })(),
      responsavelFuncionarioIds: (() => {
        const ids = new Set()
        const vendedorRespId = c?.vendedor_responsavel_id ?? c?.vendedor_responsavel?.id
        if (vendedorRespId) ids.add(Number(vendedorRespId))
        orcs.forEach((orc) => {
          const fid = orc?.venda?.representante_venda_funcionario_id ?? orc?.venda?.representante_venda_funcionario?.id
          if (fid) ids.add(Number(fid))
        })
        const emAndamento = medicaoEmAndamentoMap.value.get(clienteId)
        if (emAndamento?.funcionario_id) ids.add(Number(emAndamento.funcionario_id))
        return Array.from(ids)
      })(),
    })
  }

  return listaRows
    .map((row) => ({
      ...row,
      acoes: montarAcoesPorStatus(row),
    }))
    .filter((row) => {
      // Sem permissão "Acesso Global de Clientes": exibe só registros onde o usuário é o Responsável
      if (!can('clientes.acesso_global')) {
        const meuUsuarioId = Number(usuarioLogado.value?.id ?? 0)
        const meuFuncionarioId = Number(usuarioLogado.value?.funcionario_id ?? 0)
        const ehResponsavel =
          (row.responsavelUsuarioIds && row.responsavelUsuarioIds.includes(meuUsuarioId)) ||
          (row.responsavelFuncionarioIds && row.responsavelFuncionarioIds.includes(meuFuncionarioId))
        if (!ehResponsavel) return false
      }

      const dataInicio = String(filtroDataInicio.value || '').trim()
      const dataFim = String(filtroDataFim.value || '').trim()
      if (dataInicio || dataFim) {
        let timestamps = (row.etapas || [])
          .map((e) => e.agendamento_inicio_em)
          .filter((t) => t != null)
        // Cliente só em cadastro (sem agendamentos): usa data de criação/atualização para o filtro
        if (!timestamps.length && row.ultimaAtualizacaoTs != null) {
          timestamps = [row.ultimaAtualizacaoTs]
        }
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
        row.nome_completo,
        row.razao_social,
        row.nome_fantasia,
        row.documento,
        row.telefone_exibicao,
        row.email,
        row.endereco_resumo,
        row.endereco,
        row.numero,
        row.bairro,
        row.complemento,
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

function abrirOrcamento(id) {
  if (!id) return
  router.push(`/orcamentos/${id}`)
}

function abrirOrcamentoParaAprovar(id) {
  if (!id) return
  router.push(`/orcamentos/${id}`)
}

/** Orçamento pode ser aprovado se ainda não está na fase de contrato e não está aprovado. */
function podeAprovarOrcamento(orc) {
  const key = String(orc?.status_key || '').toUpperCase()
  if (key === 'ORCAMENTO_APROVADO') return false
  if (statusKeyParaFase(key) >= 4) return false
  return true
}

function abrirOrcamentoCliente(row) {
  const id = row?.id
  if (!id) return
  router.push(`/orcamentos/cliente/${id}`)
}

async function abrirPdf(orcamentoId) {
  if (!orcamentoId) return
  try {
    const { data } = await OrcamentosService.abrirPdf(orcamentoId)
    const arquivoId = data?.arquivoId
    if (!arquivoId) {
      notify.error('Não foi possível gerar o PDF.')
      return
    }
    router.push({
      path: `/arquivos/${String(arquivoId).replace(/\D/g, '')}`,
      query: { name: `ORCAMENTO_${orcamentoId}.pdf`, type: 'application/pdf' },
    })
  } catch (e) {
    notify.error('Erro ao abrir PDF do orçamento.')
  }
}

async function abrirPdfContrato(contratoId) {
  if (!contratoId) return
  try {
    const res = await ContratosService.verPdf(contratoId)
    const data = res?.data
    if (!data || !(data instanceof Blob) || data.size === 0) {
      notify.error('PDF do contrato não disponível.')
      return
    }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao abrir PDF do contrato.')
  }
}

function novoOrcamento(row) {
  const clienteId = row?.id
  if (!clienteId) return
  router.push({ path: '/orcamentos/novo', query: { cliente_id: String(clienteId) } })
}

function acompanharStatusCliente(row, etapa) {
  if (row?.pendencia_financeira && (row?.statusGlobalKey === 'AGENDAR_MEDIDA_FINA' || row?.etapas?.[0]?.status_key === 'AGENDAR_MEDIDA_FINA')) {
    const destino = getDestinoAcompanhar(row, etapa)
    if (destino?.path && (destino.path.includes('agendamento') || destino.label === 'Abrir agenda')) {
      notify.error('⚠️ FINANCEIRO PENDENTE - AGENDAMENTO BLOQUEADO. Regularize o Contas a Receber (parcela vencida) para liberar o agendamento.')
      return
    }
  }
  const destino = getDestinoAcompanhar(row, etapa)
  if (destino?.path) router.push(destino.path)
}

async function carregarClientes() {
  loading.value = true
  try {
    const [resClientes, resAgendaLoja, resAgendaFabrica, resOrcamentos, resContratos, resMedicaoEmAndamento] = await Promise.all([
      ClienteService.listar(),
      AgendaLojaService.listarTodos(undefined, undefined, { incluir_cancelados: false }),
      AgendaFabricaService.listarTodos(undefined, undefined, { incluir_cancelados: false }),
      OrcamentosService.listar(),
      ContratosService.listar().catch(() => ({ data: [] })),
      ApontamentoProducaoService.getMedicaoEmAndamento().catch(() => ({ data: [] })),
    ])

    const payloadClientes = resClientes?.data
    clientes.value = Array.isArray(payloadClientes)
      ? payloadClientes
      : Array.isArray(payloadClientes?.data)
        ? payloadClientes.data
        : []

    const loja = Array.isArray(resAgendaLoja?.data) ? resAgendaLoja.data : []
    const fabrica = Array.isArray(resAgendaFabrica?.data) ? resAgendaFabrica.data : []
    agendamentos.value = [...loja, ...fabrica].sort(
      (a, b) => new Date(a.inicio_em || 0).getTime() - new Date(b.inicio_em || 0).getTime()
    )

    const payloadOrcamentos = resOrcamentos?.data
    orcamentos.value = Array.isArray(payloadOrcamentos)
      ? payloadOrcamentos
      : Array.isArray(payloadOrcamentos?.data)
        ? payloadOrcamentos.data
        : []

    const listaContratos = Array.isArray(resContratos?.data) ? resContratos.data : []
    const mapContratos = new Map()
    for (const contrato of listaContratos) {
      const cid = Number(contrato?.cliente_id)
      if (!cid) continue
      if (!mapContratos.has(cid)) mapContratos.set(cid, [])
      mapContratos.get(cid).push(contrato)
    }
    for (const arr of mapContratos.values()) {
      arr.sort((a, b) => (b.id || 0) - (a.id || 0))
    }
    contratosPorCliente.value = mapContratos

    const listaMedicao = Array.isArray(resMedicaoEmAndamento?.data) ? resMedicaoEmAndamento.data : []
    const map = new Map()
    for (const item of listaMedicao) {
      const cid = Number(item?.cliente_id)
      if (cid && !map.has(cid)) map.set(cid, item)
    }
    medicaoEmAndamentoMap.value = map

    const resPendencias = await ClienteService.pendenciasAgendamento().catch(() => ({ data: { venda_ids: [] } }))
    const idsPendencia = Array.isArray(resPendencias?.data?.venda_ids) ? resPendencias.data.venda_ids : []
    vendaIdsComPendenciaFinanceira.value = new Set(idsPendencia.map((id) => Number(id)).filter((id) => id > 0))
  } catch (error) {
    clientes.value = []
    agendamentos.value = []
    orcamentos.value = []
    contratosPorCliente.value = new Map()
    medicaoEmAndamentoMap.value = new Map()
    vendaIdsComPendenciaFinanceira.value = new Set()
    notify.error('Falha ao carregar acompanhamento de status.')
  } finally {
    loading.value = false
  }
}

let timerInterval = null
function onVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    carregarClientes()
  }
}
onMounted(() => {
  carregarClientes()
  timerInterval = setInterval(() => {
    nowForTimer.value = Date.now()
  }, 1000)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
})
onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
})
</script>
