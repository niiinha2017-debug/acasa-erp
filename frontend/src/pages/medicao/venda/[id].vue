<template>
  <div class="medicao-venda-fullscreen flex flex-col w-full h-full overflow-hidden bg-slate-900">
    <!-- Aviso modo paisagem (tablet) -->
    <div
      v-if="mostrarAvisoPaisagem"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900/98 p-6"
    >
      <i class="pi pi-mobile text-6xl text-amber-400 rotate-90" />
      <p class="text-xl font-semibold text-white text-center">Gire o tablet para modo paisagem</p>
      <p class="text-slate-400 text-center text-sm">O desenho da planta baixa funciona melhor na horizontal.</p>
      <button
        type="button"
        class="px-6 py-3 rounded-xl bg-slate-600 text-slate-200 text-sm"
        @click="mostrarAvisoPaisagem = false"
      >
        Continuar mesmo assim
      </button>
    </div>

    <!-- Botão Voltar flutuante -->
    <router-link
      :to="{ path: '/totem-fabrica' }"
      class="absolute top-3 left-3 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/95 border border-slate-600 text-white text-sm font-medium shadow-lg touch-manipulation"
    >
      <i class="pi pi-arrow-left" />
      Voltar
    </router-link>

    <template v-if="erroCarregamento">
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="text-center text-slate-300">
          <p class="font-medium text-rose-400">{{ erroCarregamento }}</p>
          <router-link to="/totem-fabrica" class="inline-block mt-4 text-amber-400 font-medium">Voltar ao Totem</router-link>
        </div>
      </div>
    </template>

    <template v-else-if="!tarefa && !loading">
      <div class="flex-1 flex items-center justify-center text-slate-400">
        Tarefa não encontrada. <router-link to="/totem-fabrica" class="text-amber-400 ml-1">Voltar</router-link>
      </div>
    </template>

    <template v-else-if="loading">
      <div class="flex-1 flex items-center justify-center">
        <i class="pi pi-spin pi-spinner text-4xl text-amber-500" />
      </div>
    </template>

    <form v-else class="flex flex-col flex-1 min-h-0 overflow-hidden" @submit.prevent="salvar">
      <!-- Faixa: ambientes + tipo do ambiente atual -->
      <div class="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800/90 border-b border-slate-700 safe-area-pad">
        <div class="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
          <button
            v-for="(amb, idx) in ambientes"
            :key="amb._key"
            type="button"
            class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition"
            :class="ambienteAtualIndex === idx ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
            @click="ambienteAtualIndex = idx"
          >
            {{ idx + 1 }}
          </button>
          <button
            type="button"
            class="flex-shrink-0 px-4 py-2 rounded-lg border-2 border-dashed border-amber-500/60 text-amber-400 text-sm font-medium hover:bg-amber-500/10"
            @click="adicionarAmbiente(); ambienteAtualIndex = ambientes.length - 1"
          >
            +
          </button>
        </div>
        <template v-if="ambienteAtual">
          <select
            v-model="ambienteAtual.tipo_ambiente"
            class="flex-shrink-0 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm px-3 py-2 max-w-[140px]"
          >
            <option v-for="opt in opcoesAmbiente" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input
            v-if="ambienteAtual.tipo_ambiente === 'OUTRO'"
            v-model="ambienteAtual.nome_outro"
            type="text"
            class="flex-shrink-0 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm px-3 py-2 w-32"
            placeholder="Nome"
          />
        </template>
      </div>

      <!-- Área do croqui: sidebar fixa + canvas (sem scroll) -->
      <div v-if="ambienteAtual" class="flex-1 min-h-0 flex overflow-hidden touch-none">
        <CroquiAmbienteVenda
          :model-value="ambienteAtual.croquiData"
          full-screen
          class="flex-1 min-h-0 min-w-0"
          @update:model-value="(v) => (ambienteAtual.croquiData = v)"
        />
      </div>

      <!-- Rodapé: observações + Finalizar -->
      <div class="flex-shrink-0 px-4 py-3 bg-slate-800/95 border-t border-slate-700 flex flex-wrap items-center gap-3 safe-area-pad">
        <input
          v-model="observacoesGerais"
          type="text"
          class="flex-1 min-w-[120px] rounded-lg border border-slate-600 bg-slate-700 text-white text-sm px-3 py-2"
          placeholder="Observações (opcional)"
        />
        <button
          type="submit"
          class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 touch-manipulation"
          :disabled="enviando || ambientes.length === 0 || !podeFinalizar"
        >
          <i v-if="enviando" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-send" />
          {{ enviando ? 'Enviando...' : 'Finalizar e Enviar' }}
        </button>
        <p v-if="!podeFinalizar && ambientes.length" class="text-xs text-amber-300 w-full">
          Desenhe ou marque algo em cada ambiente para habilitar o envio.
        </p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { TotemFabricaService } from '@/services'
import { notify } from '@/services/notify'
import CroquiAmbienteVenda from '@/components/croqui-tecnico/CroquiAmbienteVenda.vue'

definePage({ meta: { perm: 'agendamentos.producao', layout: 'fullscreen' } })

const route = useRoute()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)

const opcoesAmbiente = [
  { value: 'COZINHA', label: 'Cozinha' },
  { value: 'DORMITORIO', label: 'Dormitório' },
  { value: 'BANHEIRO', label: 'Banheiro' },
  { value: 'SALA', label: 'Sala' },
  { value: 'SUITE', label: 'Suíte' },
  { value: 'AREA_SERVICO', label: 'Área de Serviço' },
  { value: 'VARANDA', label: 'Varanda' },
  { value: 'ESCRITORIO', label: 'Escritório' },
  { value: 'OUTRO', label: 'Outro' },
]

const loading = ref(true)
const erroCarregamento = ref('')
const tarefa = ref(null)
const enviando = ref(false)
const observacoesGerais = ref('')
const ambientes = ref([])
const ambienteAtualIndex = ref(0)
const mostrarAvisoPaisagem = ref(false)

const ambienteAtual = computed(() => ambientes.value[ambienteAtualIndex.value] ?? null)

function nomeAmbienteParaApi(amb) {
  if (amb?.tipo_ambiente === 'OUTRO' && (amb?.nome_outro || '').trim()) return (amb.nome_outro || '').trim()
  const opt = opcoesAmbiente.find((o) => o.value === amb?.tipo_ambiente)
  return opt ? opt.label : 'Ambiente'
}

function novoAmbiente() {
  return {
    _key: `amb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo_ambiente: 'COZINHA',
    nome_outro: '',
    croquiData: null,
  }
}

function temDesenhoOuMarcacao(amb) {
  const d = amb?.croquiData
  if (!d) return false
  const temCotas = d.cotas && d.cotas.length > 0
  const temPontos = d.pontos && d.pontos.length > 0
  const temSimbolos = d.simbolos && d.simbolos.length > 0
  const temFoto = !!d.backgroundImage
  return temCotas || temPontos || temSimbolos || (temFoto && (temPontos || temSimbolos))
}

const podeFinalizar = computed(() => {
  if (!ambientes.value.length) return false
  return ambientes.value.every((a) => temDesenhoOuMarcacao(a))
})

function adicionarAmbiente() {
  ambientes.value.push(novoAmbiente())
}

async function carregar() {
  if (!id.value) {
    erroCarregamento.value = 'ID da tarefa não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const { data } = await TotemFabricaService.getTarefa(id.value, 'agenda_loja')
    tarefa.value = data
    if (ambientes.value.length === 0) {
      ambientes.value.push(novoAmbiente())
    }
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a tarefa.'
    tarefa.value = null
  } finally {
    loading.value = false
  }
}

async function salvar() {
  if (!id.value) return
  if (ambientes.value.length === 0) {
    notify.warning('Adicione pelo menos um ambiente.')
    return
  }
  enviando.value = true
  try {
    const payload = {
      observacoes: observacoesGerais.value?.trim() || '',
      ambientes: ambientes.value.map((a) => {
        const c = a.croquiData
        const primeiraCota = c?.cotas?.[0]?.lengthMm
        return {
          nome_ambiente: nomeAmbienteParaApi(a),
          largura_m: primeiraCota != null ? Number(primeiraCota) / 1000 : undefined,
          pe_direito_m: c?.cotas?.[1]?.lengthMm != null ? Number(c.cotas[1].lengthMm) / 1000 : undefined,
          profundidade_m: undefined,
        }
      }),
    }
    await TotemFabricaService.concluirMedicaoOrcamento(id.value, payload)
    notify.success('Medição enviada. A equipe será notificada para precificar o orçamento.')
    await new Promise((r) => setTimeout(r, 800))
    window.location.href = '/totem-fabrica'
  } catch (e) {
    const msg = e?.response?.data?.message || 'Não foi possível concluir a medição.'
    notify.error(msg)
  } finally {
    enviando.value = false
  }
}

function checkLandscape() {
  if (typeof window === 'undefined') return
  const w = window.innerWidth
  const h = window.innerHeight
  const portrait = h > w
  if (portrait && !mostrarAvisoPaisagem.value) {
    mostrarAvisoPaisagem.value = true
  }
}

onMounted(() => {
  carregar()
  checkLandscape()
  window.addEventListener('resize', checkLandscape)
  document.body.classList.add('overflow-hidden')
})
onUnmounted(() => {
  window.removeEventListener('resize', checkLandscape)
  document.body.classList.remove('overflow-hidden')
})
</script>

<style scoped>
.safe-area-pad {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
</style>
