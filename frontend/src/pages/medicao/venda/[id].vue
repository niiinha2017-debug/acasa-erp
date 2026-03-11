<template>
  <div class="w-full min-h-full bg-slate-100 dark:bg-slate-900/50 font-sans antialiased text-slate-900 dark:text-slate-100">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 py-6 md:py-8">
      <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
        <div class="h-1.5 w-full bg-amber-500 rounded-t-2xl" aria-hidden />

        <header class="px-5 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="min-w-0">
              <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                Medição para Orçamento
              </h1>
              <p class="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 truncate">
                {{ tarefa?.titulo || `Tarefa #${id}` }}
              </p>
              <p v-if="tarefa?.cliente" class="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {{ tarefa.cliente.nome_completo || tarefa.cliente.razao_social || 'Cliente' }}
              </p>
            </div>
            <router-link
              :to="{ path: '/totem-fabrica' }"
              class="shrink-0 min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition touch-manipulation flex items-center justify-center gap-2"
            >
              <i class="pi pi-arrow-left" />
              Voltar ao Totem
            </router-link>
          </div>
        </header>

        <div v-if="erroCarregamento" class="p-8 text-center">
          <p class="text-rose-600 dark:text-rose-400 font-medium">{{ erroCarregamento }}</p>
          <router-link to="/totem-fabrica" class="inline-block mt-4 text-amber-600 dark:text-amber-400 font-medium">
            Voltar ao Totem
          </router-link>
        </div>

        <form v-else-if="tarefa" class="flex flex-col" @submit.prevent="salvar">
          <div class="flex-1 px-5 md:px-8 py-6 md:py-8 space-y-8">
            <!-- Lista de ambientes: cards -->
            <section class="space-y-6">
              <h2 class="text-base font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Lista de ambientes
              </h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Adicione cada ambiente, informe as medidas em milímetros e tire as fotos no local.
              </p>

            <div
              v-for="(amb, idx) in ambientes"
              :key="amb._key"
              class="rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/60 p-5 md:p-6 space-y-5"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Ambiente {{ idx + 1 }}
                </span>
                <button
                  v-if="ambientes.length > 1"
                  type="button"
                  class="text-slate-400 hover:text-rose-600 text-sm font-medium"
                  @click="removerAmbiente(idx)"
                >
                  Remover
                </button>
              </div>

              <!-- Seletor de ambiente -->
              <div>
                <label class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Tipo de ambiente</label>
                <select
                  v-model="amb.tipo_ambiente"
                  class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option v-for="opt in opcoesAmbiente" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
                <input
                  v-if="amb.tipo_ambiente === 'OUTRO'"
                  v-model="amb.nome_outro"
                  type="text"
                  class="mt-2 w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-base focus:ring-2 focus:ring-amber-500"
                  placeholder="Nome do ambiente"
                />
              </div>

              <!-- Área de croqui: desenhar planta (paredes + cotas) ou foto com marcações (Tomada, Água, Gás, Porta, Janela, Pilastra) -->
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-600 dark:text-slate-400">Desenho do ambiente</label>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Desenhe o cômodo com o dedo (paredes e cotas) ou tire uma foto e marque pontos (⚡ Tomada, 💧 Água, 🔥 Gás) e arraste Porta, Janela, Pilastra.
                </p>
                <CroquiAmbienteVenda
                  :model-value="amb.croquiData"
                  @update:model-value="amb.croquiData = $event"
                />
              </div>
            </div>

            <button
              type="button"
              class="w-full min-h-[56px] py-4 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition touch-manipulation"
              @click="adicionarAmbiente"
            >
              <i class="pi pi-plus text-xl" />
              Adicionar outro ambiente
            </button>
            </section>
          </div>

          <!-- Observações gerais -->
          <div class="px-5 md:px-8 pb-6">
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Observações do local</label>
            <textarea
              v-model="observacoesGerais"
              rows="2"
              class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm px-4 py-3 focus:ring-2 focus:ring-amber-500 resize-y min-h-[72px]"
              placeholder="Ex.: Pontos de água e luz; rodapé; interferências."
            />
          </div>

          <!-- Rodapé: botão Finalizar só após desenho/marcação por ambiente -->
          <footer class="px-5 md:px-8 py-6 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            <div class="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-5 md:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {{ ambientes.length }} {{ ambientes.length === 1 ? 'ambiente' : 'ambientes' }}
                  </p>
                  <p v-if="!podeFinalizar" class="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Salve pelo menos um desenho ou marcação em cada ambiente para habilitar o envio.
                  </p>
                  <p v-else class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Os dados serão salvos e vinculados ao orçamento. A equipe será notificada para precificar.
                  </p>
                </div>
                <div class="flex gap-3 flex-shrink-0">
                  <router-link
                    :to="{ path: '/totem-fabrica' }"
                    class="min-h-[52px] px-5 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Cancelar
                  </router-link>
                  <button
                    type="submit"
                    class="min-h-[52px] px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-base font-bold flex items-center gap-2 disabled:opacity-50 transition touch-manipulation shadow-lg shadow-amber-500/25"
                    :disabled="enviando || ambientes.length === 0 || !podeFinalizar"
                  >
                    <i v-if="enviando" class="pi pi-spin pi-spinner text-lg" />
                    <i v-else class="pi pi-send text-lg" />
                    {{ enviando ? 'Enviando...' : 'Finalizar e Enviar para Orçamento' }}
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </form>

        <div v-else-if="!loading" class="p-8 text-center text-slate-500">
          Tarefa não encontrada.
          <router-link to="/totem-fabrica" class="block mt-3 text-amber-600 dark:text-amber-400 font-medium">Voltar ao Totem</router-link>
        </div>

        <div v-else class="flex items-center justify-center py-24">
          <i class="pi pi-spin pi-spinner text-4xl text-amber-500" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { TotemFabricaService } from '@/services'
import { notify } from '@/services/notify'
import CroquiAmbienteVenda from '@/components/croqui-tecnico/CroquiAmbienteVenda.vue'

definePage({ meta: { perm: 'agendamentos.producao' } })

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

function nomeAmbienteParaApi(amb) {
  if (amb.tipo_ambiente === 'OUTRO' && (amb.nome_outro || '').trim()) {
    return (amb.nome_outro || '').trim()
  }
  const opt = opcoesAmbiente.find((o) => o.value === amb.tipo_ambiente)
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

function removerAmbiente(idx) {
  ambientes.value.splice(idx, 1)
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

onMounted(() => carregar())
</script>

<style scoped>
.custom-scroll {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
</style>
