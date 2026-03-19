<template>
  <div class="w-full h-full font-sans antialiased text-slate-900 dark:text-slate-100">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" aria-hidden />
      <PageHeader
        title="Totem Fábrica"
        subtitle="Medições externas e ordens de produção — toque para iniciar ou concluir. Medições criadas na Agenda aparecem aqui automaticamente."
        icon="pi pi-play"
      />
      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui bg-slate-100/90 dark:bg-bg-page">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <div class="flex gap-2 flex-1 min-w-0">
            <input
              v-model="filtros.data_inicio"
              type="date"
              class="flex-1 min-w-0 rounded-lg border border-border-ui bg-bg-page text-text-main px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
            <input
              v-model="filtros.data_fim"
              type="date"
              class="flex-1 min-w-0 rounded-lg border border-border-ui bg-bg-page text-text-main px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-lg border border-border-ui bg-bg-page hover:bg-slate-100 dark:hover:bg-slate-800 text-text-main text-sm font-medium transition-colors"
            @click="carregarTarefas"
          >
            Atualizar
          </button>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-16">
          <i class="pi pi-spin pi-spinner text-3xl text-brand-primary" />
        </div>

        <div v-else-if="!tarefas.length" class="py-16 text-center text-text-muted text-sm">
          Nenhuma tarefa pendente ou em produção no período.
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="tarefa in tarefas"
            :key="`${tarefa.tipo}-${tarefa.id_para_play}`"
            class="rounded-xl border border-border-ui bg-white dark:bg-slate-800/80 p-4 md:p-5 shadow-sm"
          >
            <div class="flex flex-col gap-4">
              <div>
                <h2 class="text-base md:text-lg font-semibold text-text-main line-clamp-2">
                  {{ tituloTarefa(tarefa) }}
                </h2>
                <p class="text-sm text-text-muted mt-1">
                  {{ nomeCliente(tarefa) }}
                </p>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    v-if="tarefa.tipo_medicao === 'MEDICAO_ORCAMENTO'"
                    class="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-400 dark:border-amber-600"
                    title="Medição da Agenda da Venda — formulário simples (medidas gerais e fotos). Vinculada ao cliente ou orçamento."
                  >
                    ORÇAMENTO
                  </span>
                  <span
                    v-else-if="tarefa.tipo_medicao === 'MEDICAO_FINA'"
                    class="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-400 dark:border-blue-600"
                    title="Medição da Agenda da Produção — exige projeto/venda fechada. Formulário técnico: pé-direito exato, pontos técnicos e Promob."
                  >
                    PRODUÇÃO
                  </span>
                  <span
                    v-else-if="tarefa.is_medicao_externa"
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                  >
                    MEDIÇÃO EXTERNA
                  </span>
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                    :class="statusBadgeClass(tarefa)"
                  >
                    {{ statusLabel(tarefa) }}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap gap-3 justify-end">
                <button
                  v-if="podePlay(tarefa)"
                  type="button"
                  class="w-fit min-w-[7rem] py-2 px-6 rounded-full bg-brand-primary hover:opacity-90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity touch-manipulation disabled:opacity-60"
                  :disabled="acionando === tarefa.id_para_play"
                  @click="playOuIrParaPagina(tarefa)"
                >
                  <i class="pi pi-play" />
                  <span>Iniciar</span>
                </button>
                <button
                  v-if="podeCheck(tarefa) && tarefa.tipo_medicao === 'MEDICAO_FINA' && tarefa.projeto_id"
                  type="button"
                  class="w-fit min-w-[7rem] py-2 px-6 rounded-full border border-blue-600 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors touch-manipulation disabled:opacity-60"
                  @click="irParaMedicaoFina(tarefa)"
                >
                  <i class="pi pi-pencil" />
                  <span>Preencher</span>
                </button>
                <button
                  v-else-if="podeCheck(tarefa) && tarefa.tipo_medicao === 'MEDICAO_FINA' && !tarefa.projeto_id"
                  type="button"
                  class="w-fit min-w-[7rem] py-2 px-6 rounded-full border border-slate-300 bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 font-medium text-sm cursor-not-allowed"
                  title="Vincule um projeto à tarefa na Agenda para concluir a medição fina."
                >
                  <i class="pi pi-pencil" />
                  <span>Preencher</span>
                </button>
                <button
                  v-else-if="podeCheck(tarefa) && tarefa.tipo_medicao === 'MEDICAO_ORCAMENTO'"
                  type="button"
                  class="w-fit min-w-[7rem] py-2 px-6 rounded-full border border-amber-500 bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors touch-manipulation disabled:opacity-60"
                  @click="irParaMedicaoVenda(tarefa)"
                >
                  <i class="pi pi-pencil" />
                  <span>Preencher</span>
                </button>
                <button
                  v-else-if="podeCheck(tarefa)"
                  type="button"
                  class="w-fit min-w-[7rem] py-2 px-6 rounded-full border border-emerald-600 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors touch-manipulation disabled:opacity-60"
                  :disabled="acionando === tarefa.id_para_play"
                  @click="tarefa.is_medicao_externa ? confirmarCheckSemSobras(tarefa) : abrirModalSobras(tarefa)"
                >
                  <i class="pi pi-check" />
                  <span>Concluir</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- Modal: Deseja cadastrar sobra? (minimalista, botões grandes para luvas/mão suja) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalSobrasOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="fecharModalSobras"
        >
          <div class="bg-bg-card rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col border border-border-ui totem-modal">
            <!-- Passo 1: Deseja cadastrar sobra? -->
            <template v-if="!modalPassoSobras">
              <div class="px-6 py-6 text-center">
                <p class="text-lg font-semibold text-text-main mb-6">
                  Deseja cadastrar alguma sobra aproveitável?
                </p>
                <p class="text-sm text-text-muted mb-8">
                  Se sim, informe largura e altura em mm. O sistema criará um registro no estoque como <strong>Tipo: Retalho</strong>, vinculado ao material original.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    class="min-h-[56px] px-8 py-4 rounded-2xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-text-main font-semibold text-base transition-colors touch-manipulation"
                    @click="confirmarCheckSemSobras"
                  >
                    NÃO
                  </button>
                  <button
                    type="button"
                    class="min-h-[56px] px-8 py-4 rounded-2xl bg-brand-primary hover:opacity-90 text-white font-semibold text-base transition-colors touch-manipulation"
                    @click="modalPassoSobras = true"
                  >
                    SIM
                  </button>
                </div>
              </div>
            </template>
            <!-- Passo 2: Formulário Largura / Altura (mm) -->
            <template v-else>
              <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between">
                <h3 class="text-base font-semibold text-text-main">Sobra aproveitável</h3>
                <button type="button" class="min-w-[48px] min-h-[48px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-text-muted flex items-center justify-center touch-manipulation" @click="fecharModalSobras">
                  <i class="pi pi-times text-lg" />
                </button>
              </div>
              <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <p class="text-sm text-text-muted">Largura (mm) e Altura (mm). Registro entra no estoque como <strong>Retalho</strong>.</p>
                <div
                  v-for="(row, idx) in sobrasRows"
                  :key="idx"
                  class="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-ui"
                >
                  <div class="flex-1 min-w-[160px]">
                    <label class="text-xs font-semibold text-text-muted uppercase block mb-2">Material</label>
                    <select
                      v-model="row.produto_id"
                      class="w-full min-h-[48px] rounded-xl border border-border-ui bg-bg-page text-text-main text-base px-4 touch-manipulation"
                    >
                      <option :value="null">Selecione</option>
                      <option v-for="c in consumosTotem" :key="c.produto?.id" :value="c.produto_id">
                        {{ c.produto?.nome_produto }} {{ c.produto?.cor ? `– ${c.produto.cor}` : '' }}
                      </option>
                    </select>
                  </div>
                  <div class="w-28">
                    <label class="text-xs font-semibold text-text-muted uppercase block mb-2">Largura (mm)</label>
                    <input v-model.number="row.largura_mm" type="number" min="1" class="w-full min-h-[48px] rounded-xl border border-border-ui bg-bg-page text-text-main text-base px-3 touch-manipulation" placeholder="1200" />
                  </div>
                  <div class="w-28">
                    <label class="text-xs font-semibold text-text-muted uppercase block mb-2">Altura (mm)</label>
                    <input v-model.number="row.comprimento_mm" type="number" min="1" class="w-full min-h-[48px] rounded-xl border border-border-ui bg-bg-page text-text-main text-base px-3 touch-manipulation" placeholder="500" />
                  </div>
                  <button type="button" class="min-w-[48px] min-h-[48px] rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center touch-manipulation" @click="removerSobraRow(idx)">
                    <i class="pi pi-trash text-lg" />
                  </button>
                </div>
                <button
                  type="button"
                  class="w-full min-h-[48px] py-3 rounded-xl border-2 border-dashed border-border-ui text-text-muted text-base font-medium hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center gap-2 touch-manipulation"
                  @click="adicionarSobraRow"
                >
                  <i class="pi pi-plus" />
                  Adicionar sobra
                </button>
              </div>
              <div class="px-4 py-4 border-t border-border-ui flex gap-3 justify-end">
                <button type="button" class="min-h-[48px] px-5 py-3 rounded-xl border border-border-ui text-text-main text-base font-medium hover:bg-slate-100 dark:hover:bg-slate-700 touch-manipulation" @click="modalPassoSobras = false">
                  Voltar
                </button>
                <button
                  type="button"
                  class="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-semibold flex items-center gap-2 disabled:opacity-50 touch-manipulation"
                  :disabled="acionando === tarefaSobras?.id"
                  @click="confirmarCheckComSobras"
                >
                  <i class="pi pi-check" />
                  Concluir {{ sobrasRows.filter(r => r.produto_id && r.largura_mm && r.comprimento_mm).length ? 'com sobras' : '' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>

    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import { TotemFabricaService } from '@/services'
import { getCategoriaVisualOperacionalPorSubetapa, getExecucaoEtapaLabel, getProcessColorByStatus, getSubetapaLabel } from '@/constantes'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'agendamentos.producao' } })

const router = useRouter()

const tarefas = ref([])
const loading = ref(false)
const acionando = ref(null)

const hoje = () => {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const filtros = ref({
  data_inicio: hoje(),
  data_fim: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
})

function nomeCliente(tarefa) {
  const c = tarefa?.cliente
  if (!c) return '—'
  return c.nome_completo || c.razao_social || 'Cliente'
}

function tituloTarefa(tarefa) {
  return getSubetapaLabel(tarefa?.subetapa) || tarefa?.titulo || `Tarefa #${tarefa?.id ?? tarefa?.id_para_play ?? ''}`
}

function statusLabel(tarefa) {
  const execucao = getExecucaoEtapaLabel(tarefa?.execucao_etapa)
  if (execucao) return execucao
  const s = String(tarefa?.status || '').toUpperCase()
  const statusPadrao = getExecucaoEtapaLabel(s)
  if (statusPadrao) return statusPadrao
  if (s === 'EM_PRODUCAO') return 'Em produção'
  return tarefa?.status || '—'
}

function statusBadgeClass(tarefa) {
  const categoriaVisual = getCategoriaVisualOperacionalPorSubetapa(tarefa?.subetapa)
    || String(tarefa?.categoria || tarefa?.status || '').toUpperCase()
  return getProcessColorByStatus(categoriaVisual, tarefa?.status).badgeClass
}

function temCronometroAberto(tarefa) {
  const aps = tarefa?.apontamentos_producao || []
  return aps.some((ap) => {
    if (!ap?.inicio_em || !ap?.fim_em) return false
    const diff = new Date(ap.fim_em).getTime() - new Date(ap.inicio_em).getTime()
    return diff >= 0 && diff < 3000
  })
}

function podePlay(tarefa) {
  const s = String(tarefa?.status || '').toUpperCase()
  if (s === 'CONCLUIDO' || s === 'CANCELADO') return false
  return s === 'PENDENTE' || !temCronometroAberto(tarefa)
}

function podeCheck(tarefa) {
  const s = String(tarefa?.status || '').toUpperCase()
  if (s === 'CONCLUIDO' || s === 'CANCELADO') return false
  return s === 'EM_PRODUCAO' || temCronometroAberto(tarefa)
}

async function carregarTarefas() {
  loading.value = true
  try {
    const { data } = await TotemFabricaService.getTarefas({
      data_inicio: filtros.value.data_inicio,
      data_fim: filtros.value.data_fim,
    })
    tarefas.value = data?.tarefas ?? []
  } catch (e) {
    notify.error('Não foi possível carregar as tarefas.')
    tarefas.value = []
  } finally {
    loading.value = false
  }
}

async function play(tarefa) {
  acionando.value = tarefa.id_para_play
  try {
    await TotemFabricaService.play(tarefa.id_para_play, { tipo: tarefa.tipo })
    notify.success('Produção iniciada.')
    await carregarTarefas()
  } catch (e) {
    const msg = e?.response?.data?.message || 'Não foi possível iniciar.'
    notify.error(msg)
  } finally {
    acionando.value = null
  }
}

/** Iniciar: para medição redireciona para a página dedicada; caso contrário apenas dá play. */
async function playOuIrParaPagina(tarefa) {
  if (tarefa.tipo_medicao === 'MEDICAO_ORCAMENTO') {
    acionando.value = tarefa.id_para_play
    try {
      await TotemFabricaService.play(tarefa.id_para_play, { tipo: 'agenda_loja' })
      notify.success('Medição iniciada.')
      router.push(`/medicao/venda/${tarefa.id_para_play}`)
    } catch (e) {
      const msg = e?.response?.data?.message || 'Não foi possível iniciar.'
      notify.error(msg)
    } finally {
      acionando.value = null
    }
    return
  }
  if (tarefa.tipo_medicao === 'MEDICAO_FINA') {
    acionando.value = tarefa.id_para_play
    try {
      await TotemFabricaService.play(tarefa.id_para_play, { tipo: 'agenda_fabrica' })
      notify.success('Medição iniciada.')
      router.push(`/medicao-fina/${tarefa.id_para_play}`)
    } catch (e) {
      const msg = e?.response?.data?.message || 'Não foi possível iniciar.'
      notify.error(msg)
    } finally {
      acionando.value = null
    }
    return
  }
  await play(tarefa)
}

function irParaMedicaoVenda(tarefa) {
  router.push(`/medicao/venda/${tarefa.id_para_play}`)
}

function irParaMedicaoFina(tarefa) {
  router.push(`/medicao-fina/${tarefa.id_para_play}`)
}

const modalSobrasOpen = ref(false)
const modalPassoSobras = ref(false)
const tarefaSobras = ref(null)
const consumosTotem = ref([])
const sobrasRows = ref([{ produto_id: null, largura_mm: null, comprimento_mm: null }])

async function abrirModalSobras(tarefa) {
  tarefaSobras.value = tarefa
  modalPassoSobras.value = false
  sobrasRows.value = [{ produto_id: null, largura_mm: null, comprimento_mm: null }]
  consumosTotem.value = []
  if (!tarefa.is_medicao_externa) {
    try {
      const { data } = await TotemFabricaService.getConsumos(tarefa.id_para_play)
      consumosTotem.value = data?.consumos ?? []
      if (consumosTotem.value.length && sobrasRows.value[0]) {
        sobrasRows.value[0].produto_id = consumosTotem.value[0].produto_id
      }
    } catch {
      // sem plano de corte
    }
  }
  modalSobrasOpen.value = true
}

function fecharModalSobras() {
  modalSobrasOpen.value = false
  modalPassoSobras.value = false
  tarefaSobras.value = null
}

async function confirmarCheckSemSobras(tarefaFromButton) {
  const t = tarefaFromButton || tarefaSobras.value
  if (!t) return
  acionando.value = t.id_para_play
  try {
    await TotemFabricaService.check(t.id_para_play, { tipo: t.tipo })
    notify.success('Tarefa concluída.')
    fecharModalSobras()
    await carregarTarefas()
  } catch (e) {
    const msg = e?.response?.data?.message || 'Não foi possível concluir.'
    notify.error(msg)
  } finally {
    acionando.value = null
  }
}

function adicionarSobraRow() {
  sobrasRows.value.push({ produto_id: consumosTotem.value[0]?.produto_id ?? null, largura_mm: null, comprimento_mm: null })
}

function removerSobraRow(idx) {
  sobrasRows.value.splice(idx, 1)
  if (!sobrasRows.value.length) sobrasRows.value = [{ produto_id: null, largura_mm: null, comprimento_mm: null }]
}

async function confirmarCheckComSobras() {
  if (!tarefaSobras.value) return
  const sobras = sobrasRows.value
    .filter(r => r.produto_id && r.largura_mm && r.comprimento_mm)
    .map(r => ({ produto_id: Number(r.produto_id), largura_mm: Number(r.largura_mm), comprimento_mm: Number(r.comprimento_mm) }))
  acionando.value = tarefaSobras.value.id_para_play
  try {
    await TotemFabricaService.check(tarefaSobras.value.id_para_play, { tipo: tarefaSobras.value.tipo, sobras })
    notify.success(sobras.length ? 'Tarefa concluída e sobras registradas.' : 'Tarefa concluída.')
    fecharModalSobras()
    await carregarTarefas()
  } catch (e) {
    const msg = e?.response?.data?.message || 'Não foi possível concluir.'
    notify.error(msg)
  } finally {
    acionando.value = null
  }
}

onMounted(() => carregarTarefas())

watch([() => filtros.value.data_inicio, () => filtros.value.data_fim], () => carregarTarefas())
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
