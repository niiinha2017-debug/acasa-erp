<template>
  <PageShell :padded="false">
    <section class="totem-fabrica-page ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Totem Fábrica"
        subtitle="Fila operacional com foco nas próximas etapas da fábrica."
        icon="pi pi-building"
        variant="minimal"
      >
        <template #actions>
          <div class="totem-fabrica-page__actions ds-page-context__actions">
            <div class="totem-fabrica-page__date-range">
              <Input
                v-model="filtros.data_inicio"
                type="date"
                label="Data inicial"
                :force-upper="false"
              />
              <Input
                v-model="filtros.data_fim"
                type="date"
                label="Data final"
                :force-upper="false"
              />
            </div>

            <Button variant="secondary" class="!rounded-xl" @click="carregarTarefas">
              <i class="pi pi-refresh mr-2 text-xs"></i>
              Atualizar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="totem-fabrica-page__body ds-page-context__content">
        <section class="totem-fabrica-page__summary-strip" aria-label="Resumo da fila">
          <article v-for="card in cardsResumo" :key="card.id" class="totem-fabrica-page__summary-chip" :class="card.className">
            <span class="totem-fabrica-page__summary-chip-label">{{ card.label }}</span>
            <strong class="totem-fabrica-page__summary-chip-value">{{ card.valor }}</strong>
          </article>
        </section>

        <Loading v-if="loading && !tarefas.length" />

        <section v-else-if="!tarefas.length" class="totem-fabrica-page__empty ds-alert ds-alert--info">
          <i class="pi pi-inbox text-3xl text-text-soft/70"></i>
          <p class="totem-fabrica-page__empty-title">Nenhuma tarefa pendente ou em produção no período.</p>
          <p class="totem-fabrica-page__empty-copy">Ajuste o intervalo de datas para consultar outra janela operacional.</p>
        </section>

        <section v-else class="totem-fabrica-page__list">
          <article
            v-for="tarefa in tarefas"
            :key="`${tarefa.tipo}-${tarefa.id_para_play}`"
            class="totem-card"
            :class="[borderLeftClassTask(tarefa), inicioProducao(tarefa) ? 'totem-card--ativa' : '']"
          >
            <!-- ══ Layout horizontal: info ← | → ações ══ -->
            <div class="totem-card__inner">

              <!-- COLUNA ESQUERDA — identidade da tarefa -->
              <div class="totem-card__info">

                <!-- Linha topo: kicker + badge status -->
                <div class="totem-card__info-top">
                  <span class="totem-card__kicker">{{ origemTarefaLabel(tarefa) }}</span>
                  <span class="totem-card__status-badge" :class="statusBadgeClass(tarefa)">{{ statusLabel(tarefa) }}</span>
                </div>

                <!-- Título + cliente -->
                <h2 class="totem-card__title">{{ tituloTarefa(tarefa) }}</h2>
                <p class="totem-card__client">
                  <i class="pi pi-user totem-card__client-icon" />
                  {{ nomeCliente(tarefa) }}
                </p>

                <!-- Chips: etapa · data · tipo especial -->
                <div class="totem-card__chips">
                  <span class="totem-card__chip"><i class="pi pi-tag" />{{ etapaLabel(tarefa) }}</span>
                  <span class="totem-card__chip"><i class="pi pi-calendar" />{{ periodoPlanejadoLabel(tarefa) }}</span>
                  <span v-if="tarefa.tipo_medicao === 'MEDICAO_ORCAMENTO'" class="totem-card__chip totem-card__chip--amber">Orçamento</span>
                  <span v-else-if="tarefa.tipo_medicao === 'MEDICAO_FINA'" class="totem-card__chip totem-card__chip--blue">Produção</span>
                  <span v-else-if="tarefa.tipo_medicao === 'PROJETO_TECNICO'" class="totem-card__chip totem-card__chip--amber">Projeto técnico</span>
                  <span v-if="tarefa.is_medicao_externa" class="totem-card__chip totem-card__chip--amber">Medição externa</span>
                </div>

                <!-- Equipe -->
                <div v-if="funcionariosEtapa(tarefa).length" class="totem-card__team">
                  <div class="totem-card__avatars">
                    <span
                      v-for="(func, i) in funcionariosEtapa(tarefa).slice(0, 5)"
                      :key="func.id ?? func.nome"
                      class="totem-card__avatar"
                      :style="{ zIndex: 5 - i }"
                      :title="func.nome"
                    >{{ (func.nome || 'F').charAt(0) }}</span>
                  </div>
                  <span class="totem-card__team-names">
                    {{ funcionariosEtapa(tarefa).map(f => f.nome.split(' ')[0]).join(' · ') }}
                  </span>
                </div>
              </div>

              <!-- COLUNA DIREITA — cronômetro + ações -->
              <div class="totem-card__side">

                <!-- Cronômetro em destaque -->
                <div
                  v-if="inicioProducao(tarefa)"
                  class="totem-card__timer"
                  :class="{ 'totem-card__timer--paused': estaPausada(tarefa) }"
                >
                  <i class="totem-card__timer-dot" />
                  <div class="totem-card__timer-body">
                    <span class="totem-card__timer-value">{{ tempoDecorrido(tarefa) }}</span>
                    <span class="totem-card__timer-label">{{ estaPausada(tarefa) ? 'pausado' : 'em andamento' }}</span>
                  </div>
                </div>

                <!-- Botões de ação -->
                <div class="totem-card__actions">
                  <!-- INICIAR -->
                  <button
                    v-if="podePlay(tarefa)"
                    class="totem-card__btn totem-card__btn--primary"
                    :disabled="acionando === tarefa.id_para_play"
                    @click="playOuIrParaPagina(tarefa)"
                  >
                    <i class="pi pi-play" />Iniciar
                  </button>

                  <template v-if="podeCheck(tarefa)">
                    <!-- RETOMAR / PAUSAR -->
                    <button
                      v-if="estaPausada(tarefa)"
                      class="totem-card__btn totem-card__btn--primary"
                      :disabled="pausando === tarefa.id_para_play"
                      @click="retomarTarefa(tarefa)"
                    >
                      <i class="pi pi-play" />Retomar
                    </button>
                    <button
                      v-else
                      class="totem-card__btn totem-card__btn--pause"
                      :disabled="pausando === tarefa.id_para_play"
                      @click="pausarTarefa(tarefa)"
                    >
                      <i class="pi pi-pause" />Pausar
                    </button>

                    <!-- PREENCHER -->
                    <button
                      v-if="tarefa.tipo_medicao === 'PROJETO_TECNICO'"
                      class="totem-card__btn totem-card__btn--ghost"
                      @click="irParaProjetoTecnico(tarefa)"
                    >
                      <i class="pi pi-box" />Abrir projeto
                    </button>
                    <button
                      v-else-if="tarefa.tipo_medicao === 'MEDICAO_FINA'"
                      class="totem-card__btn totem-card__btn--ghost"
                      @click="irParaMedicaoFina(tarefa)"
                    >
                      <i class="pi pi-pencil" />Preencher
                    </button>
                    <button
                      v-else-if="tarefa.tipo_medicao === 'MEDICAO_ORCAMENTO'"
                      class="totem-card__btn totem-card__btn--ghost"
                      @click="irParaMedicaoVenda(tarefa)"
                    >
                      <i class="pi pi-pencil" />Preencher
                    </button>

                    <!-- CONCLUIR -->
                    <button
                      class="totem-card__btn totem-card__btn--success"
                      :disabled="acionando === tarefa.id_para_play"
                      @click="tarefa.is_medicao_externa ? confirmarCheckSemSobras(tarefa) : abrirModalSobras(tarefa)"
                    >
                      <i class="pi pi-check" />Concluir
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="modalSobrasOpen"
            class="totem-fabrica-page__modal-backdrop"
            @click.self="fecharModalSobras"
          >
            <div class="totem-fabrica-page__modal ds-shell-card">
              <div v-if="!modalPassoSobras" class="totem-fabrica-page__modal-step">
                <div class="totem-fabrica-page__modal-head">
                  <h3 class="totem-fabrica-page__modal-title">Sobra aproveitável</h3>
                  <p class="totem-fabrica-page__modal-copy">
                    Deseja cadastrar alguma sobra antes de concluir esta tarefa?
                  </p>
                </div>

                <div class="totem-fabrica-page__modal-actions totem-fabrica-page__modal-actions--center">
                  <Button variant="outline" class="!rounded-xl" @click="confirmarCheckSemSobras()">
                    Não
                  </Button>
                  <Button variant="primary" class="!rounded-xl" @click="modalPassoSobras = true">
                    Sim, cadastrar
                  </Button>
                </div>
              </div>

              <template v-else>
                <div class="totem-fabrica-page__modal-header-row">
                  <div>
                    <h3 class="totem-fabrica-page__modal-title">Cadastrar sobras</h3>
                    <p class="totem-fabrica-page__modal-copy">
                      Informe as peças aproveitáveis em milímetros. O sistema registra tudo como retalho.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="totem-fabrica-page__modal-close"
                    @click="fecharModalSobras"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>

                <div class="totem-fabrica-page__sobras-list">
                  <div
                    v-for="(row, idx) in sobrasRows"
                    :key="idx"
                    class="totem-fabrica-page__sobra-row"
                  >
                    <div class="totem-fabrica-page__sobra-field totem-fabrica-page__sobra-field--material">
                      <label class="totem-fabrica-page__sobra-label">Material</label>
                      <select v-model="row.produto_id" class="totem-fabrica-page__sobra-select">
                        <option :value="null">Selecione</option>
                        <option v-for="c in consumosTotem" :key="c.produto?.id" :value="c.produto_id">
                          {{ c.produto?.nome_produto }}{{ c.produto?.cor ? ` - ${c.produto.cor}` : '' }}
                        </option>
                      </select>
                    </div>

                    <div class="totem-fabrica-page__sobra-field">
                      <label class="totem-fabrica-page__sobra-label">Largura</label>
                      <input v-model.number="row.largura_mm" type="number" min="1" class="totem-fabrica-page__sobra-input" placeholder="1200" />
                    </div>

                    <div class="totem-fabrica-page__sobra-field">
                      <label class="totem-fabrica-page__sobra-label">Altura</label>
                      <input v-model.number="row.comprimento_mm" type="number" min="1" class="totem-fabrica-page__sobra-input" placeholder="500" />
                    </div>

                    <button type="button" class="totem-fabrica-page__sobra-remove" @click="removerSobraRow(idx)">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>

                  <Button variant="ghost" class="!rounded-xl w-full" @click="adicionarSobraRow">
                    <i class="pi pi-plus mr-2 text-xs"></i>
                    Adicionar sobra
                  </Button>
                </div>

                <div class="totem-fabrica-page__modal-actions">
                  <Button variant="outline" class="!rounded-xl" @click="modalPassoSobras = false">
                    Voltar
                  </Button>
                  <Button
                    variant="success"
                    class="!rounded-xl"
                    :loading="acionando === tarefaSobras?.id_para_play"
                    :disabled="acionando === tarefaSobras?.id_para_play"
                    @click="confirmarCheckComSobras"
                  >
                    <i class="pi pi-check mr-2 text-xs"></i>
                    Concluir
                  </Button>
                </div>
              </template>
            </div>
          </div>
        </Transition>
      </Teleport>

    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import Loading from '@/components/common/Loading.vue'
import { ApontamentoProducaoService, TotemFabricaService } from '@/services'
import { getCategoriaVisualOperacionalPorSubetapa, getExecucaoEtapaLabel, getProcessColorByStatus, getSubetapaLabel } from '@/constantes'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'agendamentos.producao' } })

const router = useRouter()

const tarefas = ref([])
const loading = ref(false)
const acionando = ref(null)

/** YYYY-MM-DD no fuso local (toISOString é UTC e pode “trocar o dia” no BR). */
function formatYmdLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const hoje = () => formatYmdLocal(new Date())

const filtros = ref({
  data_inicio: hoje(),
  data_fim: formatYmdLocal(new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)),
})

const cardsResumo = computed(() => {
  const total = tarefas.value.length
  const medicaoExterna = tarefas.value.filter((tarefa) => tarefa.is_medicao_externa).length
  const medicaoFina = tarefas.value.filter((tarefa) => tarefa.tipo_medicao === 'MEDICAO_FINA').length
  const projetoTecnico = tarefas.value.filter((tarefa) => tarefa.tipo_medicao === 'PROJETO_TECNICO').length
  const emProducao = tarefas.value.filter((tarefa) => String(tarefa?.status || '').toUpperCase() === 'EM_PRODUCAO').length

  return [
    {
      id: 'total',
      label: 'Fila operacional',
      valor: String(total),
      className: 'totem-fabrica-page__summary-chip--neutral',
    },
    {
      id: 'externa',
      label: 'Medições externas',
      valor: String(medicaoExterna),
      className: 'totem-fabrica-page__summary-chip--warning',
    },
    {
      id: 'fina',
      label: 'Medições finas',
      valor: String(medicaoFina),
      className: 'totem-fabrica-page__summary-chip--success',
    },
    {
      id: 'projeto-tecnico',
      label: 'Projeto técnico',
      valor: String(projetoTecnico),
      className: 'totem-fabrica-page__summary-chip--warning',
    },
    {
      id: 'producao',
      label: 'Em produção',
      valor: String(emProducao),
      className: 'totem-fabrica-page__summary-chip--info',
    },
  ]
})

function funcionariosEtapa(tarefa) {
  const origem = Array.isArray(tarefa?.funcionarios_etapa) && tarefa.funcionarios_etapa.length
    ? tarefa.funcionarios_etapa
    : [
        ...((Array.isArray(tarefa?.equipe) ? tarefa.equipe : []).map((item) => item?.funcionario || {
          id: item?.funcionario_id ?? null,
          nome: item?.funcionario?.nome ?? null,
        })),
        ...((Array.isArray(tarefa?.apontamentos_producao) ? tarefa.apontamentos_producao : []).map((item) => item?.funcionario || {
          id: item?.funcionario_id ?? null,
          nome: item?.funcionario?.nome ?? null,
        })),
      ]

  const unicos = new Map()
  for (const funcionario of origem) {
    const nome = String(funcionario?.nome || '').trim()
    if (!nome) continue
    const chave = funcionario?.id != null ? `id:${funcionario.id}` : `nome:${nome.toLowerCase()}`
    if (!unicos.has(chave)) {
      unicos.set(chave, { id: funcionario?.id ?? null, nome })
    }
  }
  return [...unicos.values()]
}

function etapaLabel(tarefa) {
  return getSubetapaLabel(tarefa?.subetapa)
    || getExecucaoEtapaLabel(tarefa?.execucao_etapa)
    || tarefa?.categoria
    || 'Etapa operacional'
}

function periodoPlanejadoLabel(tarefa) {
  const data = tarefa?.inicio_em ? new Date(tarefa.inicio_em) : null
  if (!data || Number.isNaN(data.getTime())) return 'Sem agenda definida'
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function nomeCliente(tarefa) {
  const c = tarefa?.cliente
  if (!c) return 'Cliente não identificado'
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
  if (s === 'EM_PRODUCAO' || s === 'EM_ANDAMENTO') return 'Em produção'
  return tarefa?.status || '—'
}

function statusBadgeClass(tarefa) {
  const categoriaVisual = getCategoriaVisualOperacionalPorSubetapa(tarefa?.subetapa)
    || String(tarefa?.categoria || tarefa?.status || '').toUpperCase()
  return getProcessColorByStatus(categoriaVisual, tarefa?.status).badgeClass
}

function borderLeftClassTask(tarefa) {
  const categoriaVisual = getCategoriaVisualOperacionalPorSubetapa(tarefa?.subetapa)
    || String(tarefa?.categoria || tarefa?.status || '').toUpperCase()
  return getProcessColorByStatus(categoriaVisual, tarefa?.status).borderLeftClass
}

function origemTarefaLabel(tarefa) {
  if (tarefa?.is_medicao_externa) return 'Totem • medição externa'
  if (tarefa?.tipo === 'agenda_loja') return 'Agenda da loja'
  return 'Agenda da fábrica'
}

function temCronometroAberto(tarefa) {
  const aps = tarefa?.apontamentos_producao || []
  return aps.some((ap) => {
    if (!ap?.inicio_em || !ap?.fim_em) return false
    const diff = new Date(ap.fim_em).getTime() - new Date(ap.inicio_em).getTime()
    return diff >= 0 && diff < 3000
  })
}

function apontamentosAtivos(tarefa) {
  return (tarefa?.apontamentos_producao || []).filter((ap) => {
    if (!ap?.inicio_em) return false
    if (ap.fim_em) {
      const diff = new Date(ap.fim_em).getTime() - new Date(ap.inicio_em).getTime()
      return diff >= 0 && diff < 3000
    }
    return true
  })
}

function estaPausada(tarefa) {
  const ativos = apontamentosAtivos(tarefa)
  return ativos.length > 0 && ativos.some((ap) => ap.pausa_inicio_em && !ap.pausa_fim_em)
}

function podePlay(tarefa) {
  const s = String(tarefa?.status || '').toUpperCase()
  if (s === 'CONCLUIDO' || s === 'CANCELADO') return false
  if (s === 'EM_PRODUCAO' || s === 'EM_ANDAMENTO') return false
  return s === 'PENDENTE' || !temCronometroAberto(tarefa)
}

function podeCheck(tarefa) {
  const s = String(tarefa?.status || '').toUpperCase()
  if (s === 'CONCLUIDO' || s === 'CANCELADO') return false
  return s === 'EM_PRODUCAO' || s === 'EM_ANDAMENTO' || temCronometroAberto(tarefa)
}

const pausando = ref(null)

async function pausarTarefa(tarefa) {
  const ativos = apontamentosAtivos(tarefa).filter((ap) => !ap.pausa_inicio_em || ap.pausa_fim_em)
  if (!ativos.length) { notify.error('Nenhum cronômetro ativo para pausar.'); return }
  pausando.value = tarefa.id_para_play
  try {
    await Promise.all(ativos.map((ap) => ApontamentoProducaoService.pauseCronometro(ap.id)))
    notify.success('Produção pausada.')
    await carregarTarefas()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível pausar.')
  } finally {
    pausando.value = null
  }
}

async function retomarTarefa(tarefa) {
  const pausados = apontamentosAtivos(tarefa).filter((ap) => ap.pausa_inicio_em && !ap.pausa_fim_em)
  if (!pausados.length) { notify.error('Nenhum cronômetro pausado para retomar.'); return }
  pausando.value = tarefa.id_para_play
  try {
    await Promise.all(pausados.map((ap) => ApontamentoProducaoService.resumeCronometro(ap.id)))
    notify.success('Produção retomada.')
    await carregarTarefas()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível retomar.')
  } finally {
    pausando.value = null
  }
}

async function carregarTarefas() {
  loading.value = true
  try {
    const { data } = await TotemFabricaService.getTarefas({
      data_inicio: filtros.value.data_inicio,
      data_fim: filtros.value.data_fim,
    })
    tarefas.value = data?.tarefas ?? []
  } catch {
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

async function playOuIrParaPagina(tarefa) {
  const tipoPlay = tarefa.tipo === 'agenda_loja' ? 'agenda_loja' : 'agenda_fabrica'
  const temTipoMedicao = ['MEDICAO_ORCAMENTO', 'MEDICAO_FINA', 'PROJETO_TECNICO'].includes(tarefa.tipo_medicao)

  if (temTipoMedicao) {
    acionando.value = tarefa.id_para_play
    try {
      await TotemFabricaService.play(tarefa.id_para_play, { tipo: tipoPlay })
      notify.success('Produção iniciada.')
      irParaPreencher(tarefa)
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Não foi possível iniciar.')
    } finally {
      acionando.value = null
    }
    return
  }
  await play(tarefa)
}

function irParaPreencher(tarefa) {
  router.push({
    path: '/totem-fabrica-preencher',
    query: {
      agendaId: String(tarefa.id_para_play),
      tipo: tarefa.tipo === 'agenda_loja' ? 'agenda_loja' : 'agenda_fabrica',
      tipoMedicao: tarefa.tipo_medicao || undefined,
      projetoId: tarefa?.projeto_id ? String(tarefa.projeto_id) : undefined,
    },
  })
}

function irParaMedicaoVenda(tarefa) { irParaPreencher(tarefa) }
function irParaMedicaoFina(tarefa) { irParaPreencher(tarefa) }
function irParaProjetoTecnico(tarefa) { irParaPreencher(tarefa) }

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
      // sem plano de corte vinculado
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
  const t =
    tarefaFromButton != null && tarefaFromButton.id_para_play != null
      ? tarefaFromButton
      : tarefaSobras.value
  const idPlay = t?.id_para_play ?? t?.id
  if (idPlay == null || Number.isNaN(Number(idPlay))) {
    notify.error('Não foi possível identificar a tarefa. Feche o modal e tente de novo.')
    return
  }
  acionando.value = idPlay
  try {
    await TotemFabricaService.check(idPlay, { tipo: t.tipo })
    notify.success('Tarefa concluída — removida da fila do totem.')
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
    .filter((row) => row.produto_id && row.largura_mm && row.comprimento_mm)
    .map((row) => ({
      produto_id: Number(row.produto_id),
      largura_mm: Number(row.largura_mm),
      comprimento_mm: Number(row.comprimento_mm),
    }))

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

// ─── Cronômetro ───
const tickNow = ref(Date.now())
let tickInterval = null

function startTick() {
  if (tickInterval) return
  tickInterval = setInterval(() => { tickNow.value = Date.now() }, 1000)
}

function stopTick() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
}

function inicioProducao(tarefa) {
  const s = String(tarefa?.status || '').toUpperCase()
  if (s !== 'EM_PRODUCAO' && s !== 'EM_ANDAMENTO') return null
  const aps = tarefa?.apontamentos_producao || []
  // pega o mais antigo inicio_em entre todos os apontamentos (momento real em que o operador clicou "Iniciar")
  let mais_antigo = null
  for (const ap of aps) {
    if (!ap?.inicio_em) continue
    const dt = new Date(ap.inicio_em)
    if (Number.isNaN(dt.getTime())) continue
    if (!mais_antigo || dt < mais_antigo) mais_antigo = dt
  }
  return mais_antigo
}

function tempoDecorrido(tarefa) {
  const inicio = inicioProducao(tarefa)
  if (!inicio) return '00:00:00'

  const ativos = apontamentosAtivos(tarefa)
  let pausaTotalSeg = 0
  let pausaAtualSeg = 0

  for (const ap of ativos) {
    pausaTotalSeg += Number(ap.pausa_total_segundos ?? 0)
    if (ap.pausa_inicio_em && !ap.pausa_fim_em) {
      pausaAtualSeg = Math.max(pausaAtualSeg, Math.floor((tickNow.value - new Date(ap.pausa_inicio_em).getTime()) / 1000))
    }
  }

  const bruto = Math.floor((tickNow.value - inicio.getTime()) / 1000)
  const diff = Math.max(0, bruto - Math.floor(pausaTotalSeg) - pausaAtualSeg)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

onMounted(() => {
  carregarTarefas()
  startTick()
})

onUnmounted(() => stopTick())

watch([() => filtros.value.data_inicio, () => filtros.value.data_fim], () => carregarTarefas())
</script>

<style scoped>
/* ══════════════════════════════════════════
   PAGE SHELL
══════════════════════════════════════════ */
.totem-fabrica-page__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.25rem;
}

.totem-fabrica-page__actions {
  display: grid;
  grid-template-columns: minmax(0, 27rem) auto;
  align-items: end;
  gap: 0.75rem;
  width: 100%;
}

.totem-fabrica-page__date-range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.totem-fabrica-page__date-range :deep(.ds-field) { min-width: 0; }
.totem-fabrica-page__actions :deep(.ds-btn) { align-self: end; }

/* ══════════════════════════════════════════
   SUMMARY STRIP
══════════════════════════════════════════ */
.totem-fabrica-page__summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.totem-fabrica-page__summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 9px;
  background: var(--ds-color-bg);
}

.totem-fabrica-page__summary-chip-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ds-color-text-soft);
}

.totem-fabrica-page__summary-chip-value {
  font-size: 0.92rem;
  font-weight: 900;
  color: var(--ds-color-text);
}

.totem-fabrica-page__summary-chip--warning  { border-color: rgba(245,158,11,.3);  background: rgba(245,158,11,.06); }
.totem-fabrica-page__summary-chip--success  { border-color: rgba(22,163,74,.3);   background: rgba(22,163,74,.06); }
.totem-fabrica-page__summary-chip--info     { border-color: rgba(37,99,235,.25);  background: rgba(37,99,235,.05); }

/* ══════════════════════════════════════════
   EMPTY
══════════════════════════════════════════ */
.totem-fabrica-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 14rem;
  text-align: center;
  border: 1.5px dashed var(--ds-color-border);
  border-radius: 14px;
  padding: 2rem;
}

.totem-fabrica-page__empty-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ds-color-text);
}

.totem-fabrica-page__empty-copy {
  margin: 0;
  font-size: 0.78rem;
  color: var(--ds-color-text-soft);
}

/* ══════════════════════════════════════════
   LISTA DE CARDS
══════════════════════════════════════════ */
.totem-fabrica-page__list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

/* ══════════════════════════════════════════
   TOTEM CARD
══════════════════════════════════════════ */
.totem-card {
  border: 1px solid var(--ds-color-border);
  border-radius: 14px;
  background: var(--ds-color-bg);
  overflow: hidden;
  transition: box-shadow 0.18s, transform 0.18s;
}

.totem-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.07);
  transform: translateY(-1px);
}

/* Tarefa ativa ganha fundo levemente verde */
.totem-card--ativa {
  background: color-mix(in srgb, #f0fdf4 94%, var(--ds-color-bg) 6%);
}

/* ══ Layout interno: 2 colunas ══ */
.totem-card__inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0;
  min-height: 0;
}

/* ── COLUNA INFO ── */
.totem-card__info {
  padding: 1rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
  border-right: 1px solid var(--ds-color-border);
}

/* Linha topo: kicker + badge */
.totem-card__info-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.totem-card__kicker {
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft);
  opacity: 0.65;
}

.totem-card__status-badge {
  display: inline-flex;
  align-items: center;
  height: 1.5rem;
  padding: 0 0.55rem;
  border-radius: 6px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Título */
.totem-card__title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--ds-color-text);
  line-height: 1.2;
  margin: 0;
}

/* Cliente */
.totem-card__client {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--ds-color-text-soft);
  margin: 0;
}

.totem-card__client-icon {
  font-size: 0.7rem;
  opacity: 0.6;
}

/* Chips */
.totem-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
}

.totem-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 1.65rem;
  padding: 0 0.6rem;
  border-radius: 6px;
  background: var(--ds-color-bg-subtle, #f1f5f9);
  border: 1px solid var(--ds-color-border);
  font-size: 0.63rem;
  font-weight: 700;
  color: var(--ds-color-text-soft);
  white-space: nowrap;
}

.totem-card__chip .pi { font-size: 0.55rem; opacity: 0.6; }

.totem-card__chip--amber {
  background: rgba(245,158,11,.1);
  border-color: rgba(245,158,11,.3);
  color: #92400e;
}

.totem-card__chip--blue {
  background: rgba(37,99,235,.08);
  border-color: rgba(37,99,235,.22);
  color: #1e40af;
}

/* Equipe */
.totem-card__team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.totem-card__avatars {
  display: flex;
}

.totem-card__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--ds-color-primary);
  border: 2px solid var(--ds-color-bg);
  font-size: 9px;
  font-weight: 800;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  margin-left: -6px;
}

.totem-card__avatars .totem-card__avatar:first-child { margin-left: 0; }

.totem-card__team-names {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--ds-color-text-soft);
}

/* ── COLUNA LATERAL ── */
.totem-card__side {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  width: 200px;
  flex-shrink: 0;
}

/* ── Cronômetro ── */
.totem-card__timer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  background: rgba(22,163,74,.06);
  border-bottom: 1px solid rgba(22,163,74,.18);
  transition: background 0.2s;
}

.totem-card__timer--paused {
  background: rgba(245,158,11,.07);
  border-bottom-color: rgba(245,158,11,.2);
}

.totem-card__timer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  flex-shrink: 0;
  animation: totem-pulse 1.6s ease-in-out infinite;
}

.totem-card__timer--paused .totem-card__timer-dot {
  background: #f59e0b;
  animation: none;
}

.totem-card__timer-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.totem-card__timer-value {
  font-size: 1.15rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
  color: var(--ds-color-text);
  line-height: 1;
}

.totem-card__timer-label {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #16a34a;
}

.totem-card__timer--paused .totem-card__timer-label { color: #f59e0b; }

/* ── Botões ── */
.totem-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0.65rem 0.75rem;
  gap: 0.4rem;
}

.totem-card__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  height: 2.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  transition: opacity 0.15s, background 0.15s, transform 0.1s;
}

.totem-card__btn:active:not(:disabled) { transform: scale(0.97); }
.totem-card__btn:disabled { opacity: 0.4; cursor: not-allowed; }

.totem-card__btn--primary {
  background: var(--ds-color-primary);
  color: #fff;
}
.totem-card__btn--primary:hover:not(:disabled) { opacity: 0.88; }

.totem-card__btn--pause {
  background: rgba(245,158,11,.1);
  border: 1px solid rgba(245,158,11,.35);
  color: #92400e;
}
.totem-card__btn--pause:hover:not(:disabled) { background: rgba(245,158,11,.2); }

.totem-card__btn--ghost {
  background: transparent;
  border: 1px solid var(--ds-color-border);
  color: var(--ds-color-text-soft);
}
.totem-card__btn--ghost:hover:not(:disabled) { background: var(--ds-color-bg-subtle); color: var(--ds-color-text); }

.totem-card__btn--success {
  background: #16a34a;
  color: #fff;
}
.totem-card__btn--success:hover:not(:disabled) { background: #15803d; }

@keyframes totem-pulse {
  0%, 100% { opacity: 1;    transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.85); }
}

/* ══════════════════════════════════════════
   MODAIS (inalterado em estrutura)
══════════════════════════════════════════ */
.totem-fabrica-page__modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15,23,42,.48);
  backdrop-filter: blur(6px);
}

.totem-fabrica-page__modal {
  width: min(100%, 44rem);
  border-radius: 1.2rem;
  overflow: hidden;
}

.totem-fabrica-page__modal--wide {
  width: min(100%, 36rem);
  max-height: min(92vh, 640px);
  overflow-y: auto;
}

.totem-fabrica-page__projeto-pick-list {
  list-style: none;
  margin: 0;
  padding: 0 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.totem-fabrica-page__projeto-pick-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--ds-radius-md, 0.5rem);
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-muted);
}

.totem-fabrica-page__projeto-pick-body { min-width: 0; flex: 1; }

.totem-fabrica-page__projeto-pick-code {
  margin: 0;
  font-weight: 700;
  font-size: 0.92rem;
}

.totem-fabrica-page__projeto-pick-origem {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--ds-color-text);
}

.totem-fabrica-page__projeto-pick-meta {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: var(--ds-color-text-soft);
}

.totem-fabrica-page__modal-step,
.totem-fabrica-page__modal-header-row,
.totem-fabrica-page__sobras-list,
.totem-fabrica-page__modal-actions { padding-inline: 1.2rem; }

.totem-fabrica-page__modal-step { padding-block: 1.35rem; }

.totem-fabrica-page__modal-head {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.totem-fabrica-page__modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--ds-color-text);
}

.totem-fabrica-page__modal-copy {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--ds-color-text-soft);
}

.totem-fabrica-page__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding-top: 1rem;
  padding-bottom: 1.2rem;
  border-top: 1px solid var(--ds-color-border);
}

.totem-fabrica-page__modal-actions--center {
  justify-content: center;
  border-top: 0;
  padding-inline: 0;
  padding-bottom: 0;
}

.totem-fabrica-page__modal-header-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ds-color-border);
}

.totem-fabrica-page__modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 0.8rem;
  background: transparent;
  color: var(--ds-color-text-soft);
}

.totem-fabrica-page__sobras-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.totem-fabrica-page__sobra-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(2, minmax(0, 0.8fr)) auto;
  gap: 0.75rem;
  align-items: end;
  padding: 0.95rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ds-color-surface) 82%, white 18%);
}

.totem-fabrica-page__sobra-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.totem-fabrica-page__sobra-label {
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft);
}

.totem-fabrica-page__sobra-select,
.totem-fabrica-page__sobra-input {
  min-height: 2.75rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 0.9rem;
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  padding: 0.7rem 0.9rem;
  outline: none;
}

.totem-fabrica-page__sobra-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgba(196,73,73,.18);
  border-radius: 0.9rem;
  background: rgba(196,73,73,.06);
  color: var(--ds-color-danger);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

/* ══════════════════════════════════════════
   RESPONSIVO — Tablet 2 colunas (≤1280px)
══════════════════════════════════════════ */
@media (max-width: 1280px) {
  .totem-fabrica-page__list {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }

  .totem-card__side { width: 175px; }
  .totem-card__info { padding: 0.85rem 1rem; gap: 0.45rem; }
  .totem-card__title { font-size: 0.92rem; }
  .totem-card__client { font-size: 0.78rem; }
  .totem-card__timer-value { font-size: 1.05rem; }
  .totem-card__actions { padding: 0.5rem 0.6rem; gap: 0.35rem; }
  .totem-card__btn { height: 2.35rem; font-size: 0.76rem; }
}

/* ══════════════════════════════════════════
   RESPONSIVO — Tablet retrato 1 coluna (≤960px)
══════════════════════════════════════════ */
@media (max-width: 960px) {
  .totem-fabrica-page__list { grid-template-columns: 1fr; }

  .totem-card__side { width: 195px; }
  .totem-card__title { font-size: 1rem; }
  .totem-card__btn { height: 2.6rem; font-size: 0.82rem; }
}

/* ══════════════════════════════════════════
   RESPONSIVO — Mobile (≤768px)
══════════════════════════════════════════ */
@media (max-width: 768px) {
  .totem-fabrica-page__actions { grid-template-columns: 1fr; }
  .totem-fabrica-page__date-range { grid-template-columns: 1fr; }

  /* Em mobile o layout vira vertical */
  .totem-card__inner { grid-template-columns: 1fr; }
  .totem-card__info  { border-right: none; border-bottom: 1px solid var(--ds-color-border); }
  .totem-card__side  { width: 100%; flex-direction: row; }
  .totem-card__timer { flex: 1; border-bottom: none; border-right: 1px solid rgba(22,163,74,.18); }
  .totem-card__timer--paused { border-right-color: rgba(245,158,11,.2); }
  .totem-card__actions { flex: 1; flex-direction: column; padding: 0.65rem; }
  .totem-card__btn { height: 3rem; font-size: 0.85rem; }

  .totem-fabrica-page__sobra-row { grid-template-columns: 1fr; }

  .totem-fabrica-page__modal-header-row,
  .totem-fabrica-page__modal-actions { flex-direction: column; }
}
</style>
