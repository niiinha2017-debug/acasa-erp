<template>
  <PageShell :padded="false">
    <section class="preencher-page ds-page-context animate-page-in">
      <PageHeader
        :title="pageTitle"
        :subtitle="pageSubtitle"
        icon="pi pi-ruler"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="voltar">
            <i class="pi pi-arrow-left mr-2 text-xs" />
            Voltar ao totem
          </Button>
        </template>
      </PageHeader>

      <div class="preencher-page__body ds-page-context__content">
        <Loading v-if="loading" />

        <div v-else-if="erro" class="preencher-page__state ds-alert ds-alert--danger">
          <p class="font-bold text-sm">{{ erro }}</p>
          <Button variant="ghost" size="sm" class="!rounded-xl mt-2" @click="voltar">Voltar ao totem</Button>
        </div>

        <template v-else>
          <!-- Stage stepper -->
          <nav class="preencher-page__stepper" aria-label="Etapa do cliente">
            <div
              v-for="(step, idx) in stages"
              :key="step.id"
              class="preencher-page__step"
              :class="{
                'preencher-page__step--active': step.id === tipoMedicao,
                'preencher-page__step--done': stageIndex(step.id) < stageIndex(tipoMedicao),
              }"
            >
              <span class="preencher-page__step-number">
                <i v-if="stageIndex(step.id) < stageIndex(tipoMedicao)" class="pi pi-check text-[10px]" />
                <template v-else>{{ idx + 1 }}</template>
              </span>
              <span class="preencher-page__step-label">{{ step.label }}</span>
              <span v-if="idx < stages.length - 1" class="preencher-page__step-line" />
            </div>
          </nav>

          <!-- Contexto do cliente -->
          <div class="preencher-page__context">
            <div class="preencher-page__context-row">
              <i class="pi pi-user text-xs" />
              <span class="preencher-page__context-value">{{ clienteNome }}</span>
            </div>
            <div v-if="etapaLabel" class="preencher-page__context-row">
              <i class="pi pi-tag text-xs" />
              <span class="preencher-page__context-value">{{ etapaLabel }}</span>
            </div>
            <div v-if="projetoLabel" class="preencher-page__context-row">
              <i class="pi pi-briefcase text-xs" />
              <span class="preencher-page__context-value">{{ projetoLabel }}</span>
            </div>
          </div>

          <!-- Conteúdo por tipo -->

          <!-- MEDICAO_ORCAMENTO: redireciona automaticamente para editor de ambientes -->
          <div v-if="tipoMedicao === 'MEDICAO_ORCAMENTO'" class="preencher-page__cta-card ds-shell-card">
            <div class="preencher-page__cta-icon-wrap preencher-page__cta-icon-wrap--green">
              <i class="pi pi-ruler text-2xl" />
            </div>
            <h3 class="preencher-page__cta-title">Medição para Orçamento</h3>
            <p class="preencher-page__cta-desc">
              Registre os ambientes da residência — cozinha, sala, quartos — com largura, pé-direito e paredes.
              O vendedor usará essas medidas para gerar o orçamento.
            </p>
            <Button
              variant="primary"
              class="!rounded-xl preencher-page__cta-btn"
              @click="abrirMedicaoOrcamento"
            >
              <i class="pi pi-ruler mr-2" />
              Iniciar Medição
            </Button>
          </div>

          <!-- MEDICAO_FINA: CTA para o editor de croqui -->
          <div v-else-if="tipoMedicao === 'MEDICAO_FINA'" class="preencher-page__cta-card ds-shell-card">
            <div class="preencher-page__cta-icon-wrap preencher-page__cta-icon-wrap--blue">
              <i class="pi pi-pencil text-2xl" />
            </div>
            <h3 class="preencher-page__cta-title">Medição Fina</h3>
            <p class="preencher-page__cta-desc">
              Abra o editor de croqui para desenhar a planta baixa, registrar medidas detalhadas
              por ambiente e gerar a visualização 3D.
            </p>
            <Button
              variant="primary"
              class="!rounded-xl preencher-page__cta-btn"
              @click="abrirMedicaoFina"
            >
              <i class="pi pi-pencil mr-2" />
              Abrir Editor de Croqui
            </Button>
          </div>

          <!-- PROJETO_TECNICO: CTA para o projeto técnico -->
          <div v-else-if="tipoMedicao === 'PROJETO_TECNICO'" class="preencher-page__cta-card ds-shell-card">
            <div class="preencher-page__cta-icon-wrap preencher-page__cta-icon-wrap--orange">
              <i class="pi pi-box text-2xl" />
            </div>
            <h3 class="preencher-page__cta-title">Projeto Técnico</h3>
            <p class="preencher-page__cta-desc">
              Acesse o painel do projeto técnico para visualizar as medidas consolidadas,
              importar arquivos Promob e acompanhar os materiais.
            </p>
            <Button
              variant="primary"
              class="!rounded-xl preencher-page__cta-btn"
              @click="abrirProjetoTecnico"
            >
              <i class="pi pi-box mr-2" />
              Abrir Projeto Técnico
            </Button>
          </div>

          <!-- Fallback genérico -->
          <div v-else class="preencher-page__cta-card ds-shell-card">
            <div class="preencher-page__cta-icon-wrap">
              <i class="pi pi-info-circle text-2xl" />
            </div>
            <h3 class="preencher-page__cta-title">Tarefa em andamento</h3>
            <p class="preencher-page__cta-desc">
              Esta tarefa está em produção. Conclua pelo totem quando estiver pronta.
            </p>
            <Button variant="secondary" class="!rounded-xl preencher-page__cta-btn" @click="voltar">
              <i class="pi pi-arrow-left mr-2" />
              Voltar ao totem
            </Button>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import Loading from '@/components/common/Loading.vue'
import { TotemFabricaService } from '@/services'
import { notify } from '@/services/notify'
import { getSubetapaLabel } from '@/constantes'

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()
const router = useRouter()

const agendaId = computed(() => Number(String(route.query?.agendaId || '').replace(/\D/g, '')) || null)
const tipoAgenda = computed(() => route.query?.tipo === 'agenda_loja' ? 'agenda_loja' : 'agenda_fabrica')

const loading = ref(true)
const erro = ref('')
const tarefa = ref(null)

const stages = [
  { id: 'MEDICAO_ORCAMENTO', label: 'Medição Inicial' },
  { id: 'MEDICAO_FINA', label: 'Medição Fina' },
  { id: 'PROJETO_TECNICO', label: 'Projeto Técnico' },
]

function stageIndex(id) {
  const idx = stages.findIndex((s) => s.id === id)
  return idx >= 0 ? idx : -1
}

const tipoMedicao = computed(() => tarefa.value?.tipo_medicao || route.query?.tipoMedicao || null)
const projetoId = computed(() => Number(tarefa.value?.projeto_id || route.query?.projetoId || 0) || null)

const clienteNome = computed(() => {
  const c = tarefa.value?.cliente
  return c?.nome_completo || c?.razao_social || 'Cliente não identificado'
})

const etapaLabel = computed(() => getSubetapaLabel(tarefa.value?.subetapa) || tarefa.value?.categoria || '')

const projetoLabel = computed(() => {
  if (projetoId.value) return `Projeto #${projetoId.value}`
  return ''
})

const pageTitle = computed(() => {
  const stage = stages.find((s) => s.id === tipoMedicao.value)
  return stage?.label || 'Preencher'
})

const pageSubtitle = computed(() => clienteNome.value)

async function carregar() {
  if (!agendaId.value) {
    erro.value = 'Tarefa não informada na URL.'
    loading.value = false
    return
  }
  loading.value = true
  erro.value = ''
  try {
    const { data } = await TotemFabricaService.getTarefa(agendaId.value, tipoAgenda.value)
    tarefa.value = data
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível carregar a tarefa.'
  } finally {
    loading.value = false
  }
}

function voltar() {
  router.push('/totem-fabrica')
}

function abrirMedicaoOrcamento() {
  const id = agendaId.value
  router.push({
    path: `/medicao/orcamento/${id}`,
    query: {
      back: '/totem-fabrica',
      backLabel: 'Voltar ao Totem',
      clienteNome: clienteNome.value || undefined,
    },
  })
}

function abrirMedicaoFina() {
  const id = agendaId.value
  router.push({
    path: `/medicao-fina/${id}`,
    query: { back: '/totem-fabrica', backLabel: 'Voltar ao Totem' },
  })
}

function abrirProjetoTecnico() {
  const pid = projetoId.value
  if (!pid) {
    notify.error('Sem projeto vinculado. Ajuste na Agenda Geral.')
    return
  }
  router.push({
    path: `/producao/projeto-tecnico/${pid}`,
    query: { back: '/totem-fabrica', backLabel: 'Voltar ao Totem' },
  })
}

onMounted(() => carregar())
</script>

<style scoped>
.preencher-page__body {
  width: min(100%, 960px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

/* ── Stage stepper ── */
.preencher-page__stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0.75rem 0;
}

.preencher-page__step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.preencher-page__step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--ds-color-text-soft);
  flex-shrink: 0;
  transition: all 0.2s;
}

.preencher-page__step-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--ds-color-text-soft);
  white-space: nowrap;
  transition: color 0.2s;
}

.preencher-page__step-line {
  display: block;
  width: 2.5rem;
  height: 2px;
  margin: 0 0.5rem;
  background: var(--ds-color-border);
  flex-shrink: 0;
  transition: background 0.2s;
}

.preencher-page__step--done .preencher-page__step-number {
  background: var(--ds-color-success);
  border-color: var(--ds-color-success);
  color: white;
}

.preencher-page__step--done .preencher-page__step-label {
  color: var(--ds-color-success);
}

.preencher-page__step--done .preencher-page__step-line {
  background: var(--ds-color-success);
}

.preencher-page__step--active .preencher-page__step-number {
  background: var(--ds-color-primary);
  border-color: var(--ds-color-primary);
  color: white;
  box-shadow: 0 0 0 4px rgba(var(--ds-color-primary-rgb, 37, 99, 235), 0.15);
}

.preencher-page__step--active .preencher-page__step-label {
  color: var(--ds-color-text);
  font-weight: 800;
}

/* ── Contexto do cliente ── */
.preencher-page__context {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.preencher-page__context-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  font-size: 0.78rem;
  color: var(--ds-color-text-soft);
}

.preencher-page__context-value {
  font-weight: 600;
  color: var(--ds-color-text);
}

/* ── CTA card (medição fina / projeto técnico) ── */
.preencher-page__cta-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2.5rem 1.5rem;
  border-radius: 1.2rem;
}

.preencher-page__cta-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  background: rgba(100, 116, 139, 0.08);
  color: var(--ds-color-text-soft);
}

.preencher-page__cta-icon-wrap--blue {
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}

.preencher-page__cta-icon-wrap--orange {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
}

.preencher-page__cta-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--ds-color-text);
}

.preencher-page__cta-desc {
  margin: 0;
  max-width: 36rem;
  font-size: 0.84rem;
  line-height: 1.6;
  color: var(--ds-color-text-soft);
}

.preencher-page__cta-btn {
  min-height: 3rem;
  min-width: 14rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.preencher-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
}

/* ── Tablet ── */
@media (max-width: 1024px) {
  .preencher-page__stepper {
    padding: 0.5rem 0.25rem;
    gap: 0;
  }

  .preencher-page__step-line { width: 1.5rem; margin: 0 0.25rem; }
  .preencher-page__step-label { font-size: 0.68rem; }
  .preencher-page__step-number { width: 1.75rem; height: 1.75rem; font-size: 0.65rem; }

  .preencher-page__cta-btn {
    min-height: 3.2rem;
    width: 100%;
    max-width: 24rem;
  }
}

@media (max-width: 640px) {
  .preencher-page__step-label { display: none; }
  .preencher-page__step-line { width: 2rem; }
}
</style>
