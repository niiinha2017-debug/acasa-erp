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

              <!-- Medidas: Largura (mm) e Pé-direito (mm) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Largura (mm)</label>
                  <input
                    v-model.number="amb.largura_mm"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ex: 3200"
                    class="w-full text-xl font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Pé-direito (mm)</label>
                  <input
                    v-model.number="amb.pe_direito_mm"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ex: 2700"
                    class="w-full text-xl font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <!-- Área de fotos: botão câmera grande + galeria horizontal -->
              <div>
                <label class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Fotos deste ambiente</label>
                <input
                  :ref="(el) => setInputFotosRef(el, idx)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  class="hidden"
                  @change="(ev) => onFotosChange(ev, idx)"
                />
                <button
                  type="button"
                  class="w-full min-h-[140px] rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500 bg-amber-50/90 dark:bg-amber-900/20 flex flex-col items-center justify-center gap-3 text-amber-600 dark:text-amber-400 hover:bg-amber-100/90 dark:hover:bg-amber-900/30 hover:border-amber-500 dark:hover:border-amber-400 transition-all touch-manipulation active:scale-[0.99]"
                  @click="dispararCaptura(idx)"
                >
                  <i class="pi pi-camera text-6xl md:text-7xl" />
                  <span class="text-base font-semibold">Tirar foto</span>
                  <span class="text-xs opacity-90">Toque para abrir a câmera · Celular usa câmera traseira</span>
                </button>
                <p v-if="amb.fotos && amb.fotos.length" class="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Toque de novo no botão para adicionar mais fotos.
                </p>

                <!-- Galeria horizontal de miniaturas 100x100px -->
                <div
                  v-if="amb.fotosPreview && amb.fotosPreview.length"
                  class="flex flex-nowrap gap-3 mt-4 overflow-x-auto pb-2 custom-scroll"
                >
                  <div
                    v-for="(url, i) in amb.fotosPreview"
                    :key="i"
                    class="relative flex-shrink-0 w-[100px] h-[100px] rounded-xl border-2 border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm"
                  >
                    <img :src="url" alt="Foto" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      class="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center touch-manipulation"
                      aria-label="Remover foto"
                      @click="removerFotoAmbiente(idx, i)"
                    >
                      <i class="pi pi-times text-sm" />
                    </button>
                  </div>
                </div>
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

          <!-- Rodapé: card de resumo + botão principal -->
          <footer class="px-5 md:px-8 py-6 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            <div class="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-5 md:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {{ ambientes.length }} {{ ambientes.length === 1 ? 'ambiente medido' : 'ambientes medidos' }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Os dados e fotos serão salvos e vinculados ao orçamento. A equipe administrativa será notificada para precificar.
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
                    :disabled="enviando || ambientes.length === 0"
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
import { TotemFabricaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'

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
const inputFotosRefs = ref({})

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
    largura_mm: null,
    pe_direito_mm: null,
    fotos: [],
    fotosPreview: [],
  }
}

function adicionarAmbiente() {
  ambientes.value.push(novoAmbiente())
}

function removerAmbiente(idx) {
  const amb = ambientes.value[idx]
  if (amb?.fotosPreview?.length) {
    amb.fotosPreview.forEach((url) => URL.revokeObjectURL(url))
  }
  ambientes.value.splice(idx, 1)
}

function setInputFotosRef(el, idx) {
  if (el) inputFotosRefs.value[idx] = el
}

function dispararCaptura(idx) {
  const input = inputFotosRefs.value[idx]
  if (input && typeof input.click === 'function') input.click()
}

function onFotosChange(ev, idx) {
  const files = ev.target?.files ? Array.from(ev.target.files) : []
  const amb = ambientes.value[idx]
  if (!amb) return
  if (files.length === 0) return
  const novasUrls = files.map((f) => URL.createObjectURL(f))
  amb.fotos = [...(amb.fotos || []), ...files]
  amb.fotosPreview = [...(amb.fotosPreview || []), ...novasUrls]
  ev.target.value = ''
}

function removerFotoAmbiente(ambIdx, fotoIdx) {
  const amb = ambientes.value[ambIdx]
  if (!amb?.fotosPreview?.[fotoIdx]) return
  URL.revokeObjectURL(amb.fotosPreview[fotoIdx])
  amb.fotosPreview.splice(fotoIdx, 1)
  amb.fotos.splice(fotoIdx, 1)
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
      ambientes: ambientes.value.map((a) => ({
        nome_ambiente: nomeAmbienteParaApi(a),
        largura_m: a.largura_mm != null && a.largura_mm !== '' ? Number(a.largura_mm) / 1000 : undefined,
        pe_direito_m: a.pe_direito_mm != null && a.pe_direito_mm !== '' ? Number(a.pe_direito_mm) / 1000 : undefined,
        profundidade_m: undefined,
      })),
    }
    const { data } = await TotemFabricaService.concluirMedicaoOrcamento(id.value, payload)
    const ambientesCriados = data?.ambientes ?? []
    for (let i = 0; i < ambientes.value.length; i++) {
      const amb = ambientes.value[i]
      const fotos = amb.fotos || []
      const ambienteId = ambientesCriados[i]?.id
      if (ambienteId && fotos.length) {
        for (const file of fotos) {
          try {
            await ArquivosService.upload({
              ownerType: 'MEDICAO_ORCAMENTO_AMBIENTE',
              ownerId: ambienteId,
              file,
              categoria: 'FOTO',
            })
          } catch {
            // falha em um anexo não bloqueia
          }
        }
      }
    }
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
