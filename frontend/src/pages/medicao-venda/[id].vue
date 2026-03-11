<template>
  <div class="w-full min-h-full bg-slate-50 dark:bg-slate-900/50 font-sans antialiased text-slate-900 dark:text-slate-100">
    <div class="mx-auto max-w-2xl px-4 py-6 md:py-8">
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
          <!-- Medidas Brutas — inputs numéricos claros -->
          <section class="space-y-4">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Medidas brutas
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Preencha as dimensões do ambiente em metros (ex.: 2,70 = pé-direito 2,70 m).
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Largura (m)
                </label>
                <input
                  v-model.number="form.largura_m"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 3,20"
                  class="w-full text-xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div class="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Pé-direito (m)
                </label>
                <input
                  v-model.number="form.pe_direito_m"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 2,70"
                  class="w-full text-xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div class="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Profundidade (m)
                </label>
                <input
                  v-model.number="form.profundidade_m"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 1,50"
                  class="w-full text-xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Medidas gerais / observações do local</label>
              <textarea
                v-model="form.observacoes"
                rows="3"
                class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y min-h-[80px]"
                placeholder="Ex.: Pontos de água e luz no local; rodapé 10 cm; interferências."
              />
            </div>
          </section>

          <!-- Galeria de fotos -->
          <section class="space-y-3">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Fotos da obra
            </h2>
            <input
              ref="inputFotos"
              type="file"
              accept="image/*"
              multiple
              class="w-full text-sm text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-amber-700 file:text-sm dark:file:bg-amber-900/50 dark:file:text-amber-200"
              @change="onFotosChange"
            />
            <div v-if="fotosPreview.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div
                v-for="(url, idx) in fotosPreview"
                :key="idx"
                class="relative aspect-square rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800"
              >
                <img :src="url" alt="Foto" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center text-sm"
                  aria-label="Remover foto"
                  @click="removerFoto(idx)"
                >
                  <i class="pi pi-times" />
                </button>
              </div>
            </div>
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
              :disabled="enviando"
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
const form = ref({
  largura_m: null,
  pe_direito_m: null,
  profundidade_m: null,
  observacoes: '',
})
const fotos = ref([])
const fotosPreview = ref([])
const inputFotos = ref(null)

function buildMedidasGerais() {
  const parts = []
  if (form.value.largura_m != null && form.value.largura_m !== '') parts.push(`Largura: ${form.value.largura_m} m`)
  if (form.value.pe_direito_m != null && form.value.pe_direito_m !== '') parts.push(`Pé-direito: ${form.value.pe_direito_m} m`)
  if (form.value.profundidade_m != null && form.value.profundidade_m !== '') parts.push(`Profundidade: ${form.value.profundidade_m} m`)
  const base = parts.length ? parts.join('; ') + '.' : ''
  const obs = (form.value.observacoes || '').trim()
  return obs ? (base ? base + ' ' + obs : obs) : base || null
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
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a tarefa.'
    tarefa.value = null
  } finally {
    loading.value = false
  }
}

function onFotosChange(ev) {
  const files = ev.target?.files ? Array.from(ev.target.files) : []
  fotos.value = files
  fotosPreview.value = files.map((f) => URL.createObjectURL(f))
  if (inputFotos.value) inputFotos.value.value = ''
}

function removerFoto(idx) {
  fotos.value.splice(idx, 1)
  if (fotosPreview.value[idx]) URL.revokeObjectURL(fotosPreview.value[idx])
  fotosPreview.value.splice(idx, 1)
}

async function salvar() {
  if (!id.value) return
  enviando.value = true
  try {
    const medidasGerais = buildMedidasGerais() || ''
    const { data } = await TotemFabricaService.concluirMedicaoOrcamento(id.value, {
      medidas_gerais: medidasGerais,
      observacoes: (form.value.observacoes || '').trim(),
    })
    const medicaoId = data?.medicao_orcamento_id
    if (medicaoId && fotos.value.length) {
      for (const file of fotos.value) {
        try {
          await ArquivosService.upload({
            ownerType: 'MEDICAO_ORCAMENTO',
            ownerId: medicaoId,
            file,
            categoria: 'FOTO',
          })
        } catch {
          // falha em um anexo não bloqueia
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
