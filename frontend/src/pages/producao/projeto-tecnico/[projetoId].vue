<template>
  <PageShell :padded="false">
    <section class="projeto-tecnico-detail ds-page-context animate-page-in">
      <PageHeader
        :title="pageTitle"
        :subtitle="pageSubtitle"
        icon="pi pi-box"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="statusProjetoLabel" class="ds-status-pill ds-status-pill--warning text-[10px]">
              {{ statusProjetoLabel }}
            </span>
            <Button variant="ghost" size="sm" class="!rounded-xl" type="button" @click="voltar">
              <i class="pi pi-arrow-left mr-2 text-xs" />
              {{ backLabel }}
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="projeto-tecnico-detail__body ds-page-context__content px-4 pb-6 md:px-6 lg:px-8 space-y-4">
        <div v-if="erro" class="ds-alert ds-alert--danger rounded-xl p-4 text-sm">
          {{ erro }}
        </div>
        <Loading v-else-if="loading" />

        <template v-else-if="projeto">
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" class="!rounded-xl" @click="arquivosOpen = true">
              <i class="pi pi-folder-open mr-2 text-xs" />
              Arquivos
            </Button>
          </div>

          <p class="text-xs text-text-soft max-w-3xl leading-relaxed">
            O avanço da subetapa no fluxo pode ser feito pela
            <router-link class="underline font-medium text-text-main" to="/agenda-geral">Agenda geral</router-link>
            ou pelo
            <router-link class="underline font-medium text-text-main" to="/totem-fabrica">Totem Fábrica</router-link>.
            Nesta tela mantemos apenas a visão consolidada do projeto técnico dentro das etapas e subetapas ativas.
          </p>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[360px]">
            <div class="ds-shell-card overflow-hidden min-h-[320px] flex flex-col">
              <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between">
                <h3 class="text-sm font-black text-text-main uppercase tracking-wide">Medição fina</h3>
              </div>
              <div class="flex-1 min-h-[280px] p-4">
                <div v-if="loadingMedidas" class="h-full min-h-[220px] flex items-center justify-center text-text-soft text-sm">
                  <i class="pi pi-spin pi-spinner mr-2" />
                  Carregando medidas...
                </div>
                <div v-else-if="erroMedidas" class="text-xs text-red-600 dark:text-red-400">
                  {{ erroMedidas }}
                </div>
                <div v-else-if="!medicoesResumo.length" class="h-full min-h-[220px] flex items-center justify-center text-text-soft text-sm text-center">
                  Nenhuma medição fina encontrada para este projeto.
                </div>
                <div v-else class="space-y-3 max-h-[420px] overflow-auto pr-1">
                  <article
                    v-for="item in medicoesResumo"
                    :key="item.ambiente"
                    class="rounded-xl border border-border-ui/80 p-3"
                  >
                    <p class="text-xs uppercase tracking-wider font-black text-text-soft">{{ item.ambiente }}</p>
                    <p class="text-sm font-semibold text-text-main mt-1">{{ item.resumo }}</p>
                  </article>
                </div>
              </div>
            </div>

            <div class="ds-shell-card p-4 space-y-3">
              <h3 class="text-sm font-black text-text-main uppercase tracking-wide">Projeto</h3>
              <dl class="grid grid-cols-1 gap-2 text-sm">
                <div class="flex justify-between gap-4 border-b border-border-ui/60 pb-2">
                  <dt class="text-text-soft">Código</dt>
                  <dd class="font-semibold text-text-main">{{ projeto.codigo || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4 border-b border-border-ui/60 pb-2">
                  <dt class="text-text-soft">Cliente</dt>
                  <dd class="font-medium text-text-main text-right">{{ clienteNome }}</dd>
                </div>
                <div class="flex justify-between gap-4 border-b border-border-ui/60 pb-2">
                  <dt class="text-text-soft">Status do projeto</dt>
                  <dd class="text-text-soft text-right">{{ projeto.status_atual || '—' }}</dd>
                </div>
              </dl>
            </div>
          </div>

        </template>
      </div>

      <ArquivosModal
        :open="arquivosOpen"
        :owner-type="arquivosOwnerType"
        :owner-id="arquivosOwnerId"
        :can-manage="canManageArquivos"
        @close="arquivosOpen = false"
        @updated="onArquivosUpdated"
      />
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MedicaoFinaService } from '@/services'
import { can } from '@/services/permissions'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import Loading from '@/components/common/Loading.vue'
import ArquivosModal from '@/components/modals/ArquivosModal.vue'

definePage({ meta: { perm: ['agendamentos.vendas', 'agendamentos.producao'] } })

const route = useRoute()
const router = useRouter()

const projetoId = computed(() => {
  const raw = route.params?.projetoId
  const n = Number(String(raw || '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})

const loading = ref(true)
const erro = ref('')
const projeto = ref(null)
const arquivosOpen = ref(false)
const loadingMedidas = ref(false)
const erroMedidas = ref('')
const medicoesResumo = ref([])

const backTo = computed(() => String(route.query?.back || '').trim() || '/agenda-geral')
const backLabel = computed(() => String(route.query?.backLabel || '').trim() || 'Voltar')

const clienteNome = computed(() => {
  const c = projeto.value?.cliente
  return c?.nome_completo || c?.razao_social || c?.nome || '—'
})

const pageTitle = computed(() => String(route.query?.pageTitle || '').trim() || 'Projeto técnico')
const pageSubtitle = computed(() => {
  const cod = projeto.value?.codigo
  if (cod) return `${clienteNome.value} · ${cod}`
  return clienteNome.value
})

const statusProjetoLabel = computed(() => {
  const s = String(projeto.value?.status_atual || '').trim()
  return s || ''
})

const arquivosOwner = computed(() => {
  const p = projeto.value
  if (!p) return { type: 'PROJETO', id: projetoId.value }
  if (p.venda_id) return { type: 'VENDA', id: p.venda_id }
  if (p.orcamento_id) return { type: 'ORCAMENTO', id: p.orcamento_id }
  return { type: 'PROJETO', id: p.id }
})

const arquivosOwnerType = computed(() => arquivosOwner.value.type)
const arquivosOwnerId = computed(() => arquivosOwner.value.id)

const canManageArquivos = computed(() => can('arquivos.criar'))

function extrairResumoAmbiente(medicao) {
  const largura = medicao?.largura_cm
  const altura = medicao?.altura_cm
  const profundidade = medicao?.profundidade_cm
  const medidasDiretas = [largura, altura, profundidade].some((v) => Number(v) > 0)
  if (medidasDiretas) {
    const l = Number(largura) > 0 ? `${Number(largura)}cm` : '—'
    const a = Number(altura) > 0 ? `${Number(altura)}cm` : '—'
    const p = Number(profundidade) > 0 ? `${Number(profundidade)}cm` : '—'
    return `L ${l} · A ${a} · P ${p}`
  }

  const pb = medicao?.planta_baixa_json
  const paredesDiretas = Array.isArray(pb?.paredes) ? pb.paredes.length : 0
  const paredesEmAmbientes = Array.isArray(pb?.ambientes)
    ? pb.ambientes.reduce((acc, amb) => acc + (Array.isArray(amb?.paredes) ? amb.paredes.length : 0), 0)
    : 0
  const totalParedes = paredesDiretas + paredesEmAmbientes
  if (totalParedes > 0) {
    return `${totalParedes} parede(s) registradas`
  }

  return 'Sem detalhe de medidas'
}

async function carregarMedidas() {
  const id = projetoId.value
  if (!id) return
  loadingMedidas.value = true
  erroMedidas.value = ''
  medicoesResumo.value = []
  try {
    const ambRes = await MedicaoFinaService.listarAmbientes(id)
    const ambientes = Array.isArray(ambRes?.data) ? ambRes.data : []
    const nomes = ambientes.map((a) => String(a || '').trim()).filter(Boolean)
    const detalhes = await Promise.all(
      nomes.map(async (ambiente) => {
        try {
          const res = await MedicaoFinaService.buscarPorProjetoAmbiente(id, ambiente)
          const medicao = res?.data ?? res ?? null
          return { ambiente, resumo: extrairResumoAmbiente(medicao) }
        } catch (_) {
          return { ambiente, resumo: 'Nao foi possivel carregar este ambiente' }
        }
      }),
    )
    medicoesResumo.value = detalhes
  } catch (e) {
    erroMedidas.value = e?.response?.data?.message || 'Nao foi possivel carregar as medidas da medicao fina.'
  } finally {
    loadingMedidas.value = false
  }
}

function voltar() {
  router.push(backTo.value)
}

function onArquivosUpdated() {
  carregarMedidas()
}

async function carregar() {
  erro.value = ''
  projeto.value = null
  const id = projetoId.value
  if (!id) {
    loading.value = false
    erro.value = 'ID do projeto inválido.'
    return
  }
  loading.value = true
  try {
    const res = await MedicaoFinaService.getProjetoDados(id)
    projeto.value = res?.data ?? res ?? null
    if (!projeto.value) erro.value = 'Projeto não encontrado.'
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível carregar o projeto.'
    projeto.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await carregar()
  await carregarMedidas()
})
</script>

<style scoped>
.projeto-tecnico-detail {
  min-height: 100%;
  background: var(--ds-color-surface);
}

.projeto-tecnico-detail__body {
  max-width: 100%;
}
</style>
