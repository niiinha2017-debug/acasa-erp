<template>
  <div class="croqui-tecnico-page fixed inset-0 w-full h-full overflow-hidden bg-slate-900 flex flex-col">
    <!-- Barra de ferramentas flutuante -->
    <div class="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/95 border border-slate-600 shadow-xl">
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium touch-manipulation"
        @click="voltar"
      >
        <i class="pi pi-arrow-left" />
        Voltar
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium touch-manipulation"
        @click="novoAmbiente"
      >
        <i class="pi pi-plus" />
        Novo Ambiente
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold touch-manipulation"
        :disabled="salvando"
        @click="salvar"
      >
        <i v-if="salvando" class="pi pi-spin pi-spinner" />
        <i v-else class="pi pi-check" />
        {{ salvando ? 'Salvando...' : 'Salvar' }}
      </button>
      <!-- Alternar modo: Ponto técnico / Cota -->
      <div class="flex rounded-xl overflow-hidden border border-slate-600">
        <button
          type="button"
          class="px-3 py-2 text-sm font-medium touch-manipulation"
          :class="modo === 'ponto' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          @click="modo = 'ponto'"
        >
          Ponto
        </button>
        <button
          type="button"
          class="px-3 py-2 text-sm font-medium touch-manipulation"
          :class="modo === 'cota' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          @click="modo = 'cota'"
        >
          Cota
        </button>
      </div>
    </div>

    <!-- Conteúdo principal: 100% da tela -->
    <div class="flex-1 min-h-0 flex flex-col pt-14">
      <template v-if="erroCarregamento">
        <div class="flex-1 flex items-center justify-center p-6">
          <div class="text-center">
            <p class="text-rose-400 font-medium">{{ erroCarregamento }}</p>
            <p v-if="!tarefa?.projeto_id" class="text-sm text-slate-400 mt-2">Vincule um projeto à tarefa na Agenda da Produção.</p>
            <router-link to="/totem-fabrica" class="inline-block mt-4 text-blue-400 font-medium">Voltar ao Totem</router-link>
          </div>
        </div>
      </template>

      <template v-else-if="!tarefa && !loading">
        <div class="flex-1 flex items-center justify-center p-6 text-slate-400">
          Tarefa não encontrada. <router-link to="/totem-fabrica" class="text-blue-400 ml-1">Voltar ao Totem</router-link>
        </div>
      </template>

      <template v-else-if="loading || loadingMedicao">
        <div class="flex-1 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-4xl text-slate-400" />
        </div>
      </template>

      <template v-else>
        <!-- Indicador de ambiente atual (quando há vários) -->
        <div v-if="ambientes.length > 1" class="flex-shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto bg-slate-800/80">
          <button
            v-for="(amb, idx) in ambientes"
            :key="idx"
            type="button"
            class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition"
            :class="ambienteAtualIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
            @click="ambienteAtualIndex = idx"
          >
            Ambiente {{ idx + 1 }}
          </button>
        </div>

        <!-- Editor de croqui: 100% do espaço restante (altura mínima para o canvas aparecer) -->
        <div class="flex-1 min-h-0" style="min-height: 60vh;">
          <CroquiTecnicoEditor
            ref="editorRef"
            :model-value="dadosAmbienteAtual"
            :modo="modo"
            @update:model-value="atualizarAmbienteAtual"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TotemFabricaService, MedicaoFinaService } from '@/services'
import { notify } from '@/services/notify'
import CroquiTecnicoEditor from '@/components/croqui-tecnico/CroquiTecnicoEditor.vue'

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)

const loading = ref(true)
const loadingMedicao = ref(false)
const erroCarregamento = ref('')
const tarefa = ref(null)
const medicaoId = ref(null)
const ambientePadrao = ref('')
const salvando = ref(false)
const editorRef = ref(null)

/** Lista de ambientes (cada um = um croqui com foto + pontos + símbolos + cotas) */
const ambientes = ref([{}])
const ambienteAtualIndex = ref(0)

const dadosAmbienteAtual = computed(() => ambientes.value[ambienteAtualIndex.value] ?? {})

function atualizarAmbienteAtual(data) {
  const idx = ambienteAtualIndex.value
  const next = [...ambientes.value]
  next[idx] = { ...(next[idx] || {}), ...data }
  ambientes.value = next
}

function novoAmbiente() {
  const current = dadosAmbienteAtual.value
  if (current && (current.backgroundImage || (current.pontos && current.pontos.length) || (current.simbolos && current.simbolos.length) || (current.cotas && current.cotas.length))) {
    ambientes.value = [...ambientes.value, {}]
    ambienteAtualIndex.value = ambientes.value.length - 1
    notify.success('Novo ambiente adicionado. Tire ou carregue a foto da parede.')
  } else {
    notify.info('Adicione uma foto e desenhe no ambiente atual antes de criar outro.')
  }
}

function dadosParaSalvar() {
  return {
    ambientes: ambientes.value.map((a) => ({
      backgroundImage: a.backgroundImage ?? null,
      scaleMmPerPx: a.scaleMmPerPx ?? 10,
      pontos: (a.pontos || []).map((p) => ({ x: p.x, y: p.y, alturaMm: p.alturaMm })),
      simbolos: (a.simbolos || []).map((s) => ({ tipo: s.tipo, x: s.x, y: s.y })),
      cotas: (a.cotas || []).map((c) => ({ x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, lengthMm: c.lengthMm })),
    })),
  }
}

async function salvar() {
  if (!tarefa.value?.projeto_id || !id.value) {
    notify.error('Dados da tarefa incompletos.')
    return
  }
  salvando.value = true
  try {
    const payload = dadosParaSalvar()
    if (medicaoId.value) {
      await MedicaoFinaService.atualizar(medicaoId.value, { planta_baixa_json: payload })
    }
    notify.success('Croqui salvo.')
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data?.error || 'Não foi possível salvar.'
    notify.error(msg)
  } finally {
    salvando.value = false
  }
}

function voltar() {
  router.push('/totem-fabrica')
}

async function carregarTarefa() {
  if (!id.value) {
    erroCarregamento.value = 'ID da tarefa não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const { data } = await TotemFabricaService.getTarefa(id.value, 'agenda_fabrica')
    tarefa.value = data
    if (!data?.projeto_id) {
      erroCarregamento.value = 'Esta tarefa não está vinculada a um projeto. Vincule um projeto na Agenda da Produção.'
      return
    }
    await carregarMedicao()
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a tarefa.'
    tarefa.value = null
  } finally {
    loading.value = false
  }
}

async function carregarMedicao() {
  const projetoId = tarefa.value?.projeto_id
  if (!projetoId) return
  loadingMedicao.value = true
  try {
    const [ambientesRes] = await Promise.all([
      MedicaoFinaService.listarAmbientes(projetoId),
    ])
    const listaAmbientes = Array.isArray(ambientesRes?.data) ? ambientesRes.data : []
    ambientePadrao.value = listaAmbientes[0] || 'Ambiente'
    const primeiroAmbiente = ambientePadrao.value
    const medicaoRes = await MedicaoFinaService.buscarPorProjetoAmbiente(projetoId, primeiroAmbiente)
    const medicao = medicaoRes?.data ?? medicaoRes
    medicaoId.value = medicao?.id ?? null
    const pb = medicao?.planta_baixa_json
    if (pb && Array.isArray(pb.ambientes) && pb.ambientes.length) {
      ambientes.value = pb.ambientes.map((a) => ({ ...a }))
      ambienteAtualIndex.value = 0
    } else {
      ambientes.value = [{}]
      ambienteAtualIndex.value = 0
    }
  } catch (e) {
    console.error(e)
    ambientes.value = [{}]
    ambienteAtualIndex.value = 0
  } finally {
    loadingMedicao.value = false
  }
}

const modo = ref('ponto')

onMounted(() => carregarTarefa())
</script>
