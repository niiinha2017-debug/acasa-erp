<template>
  <div class="w-full min-h-full bg-slate-50 dark:bg-slate-900/50 font-sans antialiased text-slate-900 dark:text-slate-100">
    <div class="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div class="h-1 w-full bg-amber-500 rounded-t-2xl" aria-hidden />

        <div class="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
              Medição — Venda
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {{ tarefa?.titulo || `Tarefa #${id}` }}
            </p>
            <p v-if="tarefa?.cliente" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ tarefa.cliente.nome_completo || tarefa.cliente.razao_social || 'Cliente' }}
            </p>
          </div>
          <router-link
            :to="{ path: '/totem-fabrica' }"
            class="shrink-0 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition touch-manipulation flex items-center gap-2"
          >
            <i class="pi pi-arrow-left" />
            Voltar ao Totem
          </router-link>
        </div>

        <div v-if="erroCarregamento" class="p-6 text-center">
          <p class="text-rose-600 dark:text-rose-400 font-medium">{{ erroCarregamento }}</p>
          <router-link to="/totem-fabrica" class="inline-block mt-4 text-amber-600 dark:text-amber-400 font-medium">
            Voltar ao Totem
          </router-link>
        </div>

        <form v-else-if="tarefa" class="p-4 md:p-6 space-y-6" @submit.prevent="salvar">
          <!-- Resumo visual: tabela/cards do que já foi adicionado -->
          <section v-if="ambientes.length > 0" class="space-y-3">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Resumo dos ambientes
            </h2>
            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
              <table class="w-full text-sm min-w-[320px]">
                <thead>
                  <tr class="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    <th class="text-left py-2.5 px-3 font-semibold">#</th>
                    <th class="text-left py-2.5 px-3 font-semibold">Ambiente</th>
                    <th class="text-right py-2.5 px-2 font-semibold">Larg. (m)</th>
                    <th class="text-right py-2.5 px-2 font-semibold">Pé-dir. (m)</th>
                    <th class="text-right py-2.5 px-2 font-semibold">Prof. (m)</th>
                    <th class="text-center py-2.5 px-2 font-semibold">Fotos</th>
                    <th class="w-10" />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(amb, idx) in ambientes"
                    :key="amb._key"
                    class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
                  >
                    <td class="py-2 px-3 font-medium text-slate-500">{{ idx + 1 }}</td>
                    <td class="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {{ amb.nome_ambiente || '—' }}
                    </td>
                    <td class="py-2 px-2 text-right">{{ formatNum(amb.largura_m) }}</td>
                    <td class="py-2 px-2 text-right">{{ formatNum(amb.pe_direito_m) }}</td>
                    <td class="py-2 px-2 text-right">{{ formatNum(amb.profundidade_m) }}</td>
                    <td class="py-2 px-2 text-center">
                      <span v-if="amb.fotos && amb.fotos.length" class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <i class="pi pi-image" />
                        {{ amb.fotos.length }}
                      </span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                    <td class="py-2 px-2">
                      <button
                        type="button"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title="Remover ambiente"
                        @click="removerAmbiente(idx)"
                      >
                        <i class="pi pi-trash text-sm" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Lista de ambientes: cards editáveis -->
          <section class="space-y-4">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Lista de ambientes
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Adicione um ambiente por vez (ex.: Cozinha, Suíte Master). Preencha medidas em metros e fotos específicas de cada um.
            </p>

            <div
              v-for="(amb, idx) in ambientes"
              :key="amb._key"
              class="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4 md:p-5 space-y-4"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Ambiente {{ idx + 1 }}
                </span>
                <button
                  v-if="ambientes.length > 1"
                  type="button"
                  class="text-slate-400 hover:text-rose-600 text-sm"
                  @click="removerAmbiente(idx)"
                >
                  Remover
                </button>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do ambiente</label>
                <input
                  v-model="amb.nome_ambiente"
                  type="text"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: Cozinha, Suíte Master"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Largura (m)</label>
                  <input
                    v-model.number="amb.largura_m"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 3,20"
                    class="w-full text-lg font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Pé-direito (m)</label>
                  <input
                    v-model.number="amb.pe_direito_m"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 2,70"
                    class="w-full text-lg font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Profundidade (m)</label>
                  <input
                    v-model.number="amb.profundidade_m"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 1,50"
                    class="w-full text-lg font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Fotos deste ambiente</label>
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
                  class="w-full min-h-[120px] rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-900/20 flex flex-col items-center justify-center gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 hover:border-amber-500 dark:hover:border-amber-400 transition-all touch-manipulation active:scale-[0.98]"
                  @click="dispararCaptura(idx)"
                >
                  <i class="pi pi-camera text-5xl md:text-6xl" />
                  <span class="text-sm font-semibold">Tirar foto</span>
                  <span class="text-xs opacity-90">Toque para abrir a câmera · No celular usa a câmera traseira</span>
                </button>
                <p v-if="amb.fotos && amb.fotos.length" class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Toque de novo no botão para adicionar mais fotos ao mesmo ambiente.
                </p>
                <!-- Preview instantâneo: miniaturas abaixo do ambiente -->
                <div v-if="amb.fotosPreview && amb.fotosPreview.length" class="flex flex-wrap gap-2 mt-3">
                  <div
                    v-for="(url, i) in amb.fotosPreview"
                    :key="i"
                    class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm flex-shrink-0"
                  >
                    <img :src="url" alt="Foto" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      class="absolute top-0.5 right-0.5 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center touch-manipulation"
                      aria-label="Remover foto"
                      @click="removerFotoAmbiente(idx, i)"
                    >
                      <i class="pi pi-times text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full min-h-[52px] py-3 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition touch-manipulation"
              @click="adicionarAmbiente"
            >
              <i class="pi pi-plus text-lg" />
              Adicionar outro ambiente
            </button>
          </section>

          <!-- Observações gerais (opcional) -->
          <section class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">Observações gerais do local</label>
            <textarea
              v-model="observacoesGerais"
              rows="2"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y min-h-[60px]"
              placeholder="Ex.: Pontos de água e luz; rodapé; interferências."
            />
          </section>

          <div class="pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
            <router-link
              :to="{ path: '/totem-fabrica' }"
              class="min-h-[48px] px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancelar
            </router-link>
            <button
              type="submit"
              class="min-h-[48px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition touch-manipulation"
              :disabled="enviando || ambientes.length === 0"
            >
              <i v-if="enviando" class="pi pi-spin pi-spinner" />
              <i v-else class="pi pi-check" />
              {{ enviando ? 'Enviando...' : 'Concluir e enviar para orçamento' }}
            </button>
          </div>
        </form>

        <div v-else-if="!loading" class="p-6 text-center text-slate-500">
          Tarefa não encontrada.
          <router-link to="/totem-fabrica" class="block mt-2 text-amber-600 dark:text-amber-400 font-medium">Voltar ao Totem</router-link>
        </div>

        <div v-else class="flex items-center justify-center py-16">
          <i class="pi pi-spin pi-spinner text-3xl text-amber-500" />
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

const loading = ref(true)
const erroCarregamento = ref('')
const tarefa = ref(null)
const enviando = ref(false)
const observacoesGerais = ref('')

/** Lista de ambientes: cada item tem nome, medidas, fotos e preview. */
const ambientes = ref([])
const inputFotosRefs = ref({})

function novoAmbiente() {
  return {
    _key: `amb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nome_ambiente: '',
    largura_m: null,
    pe_direito_m: null,
    profundidade_m: null,
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
  const novesUrls = files.map((f) => URL.createObjectURL(f))
  amb.fotos = [...(amb.fotos || []), ...files]
  amb.fotosPreview = [...(amb.fotosPreview || []), ...novesUrls]
  ev.target.value = ''
}

function removerFotoAmbiente(ambIdx, fotoIdx) {
  const amb = ambientes.value[ambIdx]
  if (!amb?.fotosPreview?.[fotoIdx]) return
  URL.revokeObjectURL(amb.fotosPreview[fotoIdx])
  amb.fotosPreview.splice(fotoIdx, 1)
  amb.fotos.splice(fotoIdx, 1)
}

function formatNum(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n : '—'
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
        nome_ambiente: (a.nome_ambiente || '').trim() || 'Ambiente',
        largura_m: a.largura_m != null && a.largura_m !== '' ? Number(a.largura_m) : undefined,
        pe_direito_m: a.pe_direito_m != null && a.pe_direito_m !== '' ? Number(a.pe_direito_m) : undefined,
        profundidade_m: a.profundidade_m != null && a.profundidade_m !== '' ? Number(a.profundidade_m) : undefined,
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
    notify.success(data?.mensagem || 'Medição concluída. Cliente pronto para orçamento.')
    await new Promise((r) => setTimeout(r, 600))
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
