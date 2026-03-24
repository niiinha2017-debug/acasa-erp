<template>
  <PageShell :padded="false">
    <section class="projeto-tecnico-hub ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Projeto técnico"
        subtitle="Central de engenharia: abra por projeto, cliente ou tarefas da agenda nesta subetapa."
        icon="pi pi-box"
      >
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" class="!rounded-xl" type="button" @click="router.push('/totem-fabrica')">
              <i class="pi pi-building mr-2 text-xs" />
              Totem Fábrica
            </Button>
            <Button variant="ghost" size="sm" class="!rounded-xl" type="button" @click="voltarAgenda">
              <i class="pi pi-objects-column mr-2 text-xs" />
              Agenda geral
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="projeto-tecnico-hub__content ds-page-context__content">
        <section v-if="podeVerAgendaGeral" class="ds-linear-section ds-linear-section--tight projeto-tecnico-hub__block">
          <div class="ds-section-head ds-section-head--spread">
            <div>
              <p class="ds-kicker">Agenda</p>
              <h2 class="ds-section-title">Tarefas na subetapa Projeto técnico</h2>
            </div>
            <Button type="button" variant="secondary" class="!rounded-xl" :disabled="loadingAgenda" @click="carregarAgenda">
              <i class="pi pi-refresh mr-2 text-xs" :class="{ 'pi-spin': loadingAgenda }" />
              Atualizar
            </Button>
          </div>
          <p class="ds-supporting-copy max-w-3xl">
            Lista eventos não arquivados com subetapa <strong>PROJETO_TECNICO</strong>. Use <strong>Abrir</strong> quando houver projeto vinculado à tarefa.
          </p>

          <div v-if="loadingAgenda" class="py-10 flex justify-center text-text-soft text-sm">
            <i class="pi pi-spin pi-spinner mr-2" />
            Carregando…
          </div>
          <div v-else-if="erroAgenda" class="ds-supporting-copy ds-supporting-copy--danger">
            {{ erroAgenda }}
          </div>
          <div v-else-if="!eventosProjetoTecnico.length" class="ds-supporting-copy">
            Nenhuma tarefa em projeto técnico na operação atual.
          </div>
          <div v-else class="overflow-x-auto rounded-xl border border-border-ui bg-bg-page">
            <table class="min-w-full text-left text-sm">
              <thead class="border-b border-border-ui text-[10px] font-black uppercase tracking-wider text-text-soft">
                <tr>
                  <th class="px-4 py-3">Cliente</th>
                  <th class="px-4 py-3">Tarefa</th>
                  <th class="px-4 py-3">Execução</th>
                  <th class="px-4 py-3">Projeto</th>
                  <th class="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ev in eventosProjetoTecnico"
                  :key="`${ev._setor}-${ev.id}`"
                  class="border-b border-border-ui/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td class="px-4 py-3 text-text-main font-medium">
                    {{ nomeCliente(ev) }}
                  </td>
                  <td class="px-4 py-3 text-text-soft max-w-[14rem] truncate" :title="ev.titulo">
                    {{ ev.titulo || '—' }}
                  </td>
                  <td class="px-4 py-3 text-text-soft">
                    {{ getExecucaoEtapaLabel(ev.execucao_etapa) || ev.execucao_etapa || '—' }}
                  </td>
                  <td class="px-4 py-3 text-text-soft">
                    {{ ev.projeto_id ? `#${ev.projeto_id}` : '—' }}
                  </td>
                  <td class="px-4 py-3">
                    <Button
                      v-if="ev.projeto_id"
                      type="button"
                      size="sm"
                      class="!rounded-lg"
                      @click="abrirProjetoTecnico(ev.projeto_id)"
                    >
                      Abrir
                    </Button>
                    <span v-else class="text-[10px] text-text-soft uppercase">Sem projeto</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="ds-linear-section projeto-tecnico-hub__block">
          <div class="ds-section-head">
            <div>
              <p class="ds-kicker">Seleção direta</p>
              <h2 class="ds-section-title">Abrir por ID ou código do projeto</h2>
            </div>
          </div>
          <div class="ds-inline-row max-w-3xl">
            <input
              v-model="projetoIdInput"
              type="text"
              placeholder="ID ou código do projeto"
              class="ds-field-line"
              @keyup.enter="irParaProjeto"
            />
            <Button type="button" @click="irParaProjeto">
              Abrir
            </Button>
          </div>
        </section>

        <section class="ds-linear-section projeto-tecnico-hub__block">
          <div class="ds-section-head">
            <div>
              <p class="ds-kicker">Busca assistida</p>
              <h2 class="ds-section-title">Cliente e pedido (projeto)</h2>
            </div>
          </div>

          <div class="relative max-w-3xl">
            <input
              v-model="clienteSearch"
              type="text"
              placeholder="Buscar cliente..."
              class="ds-field-line"
              autocomplete="off"
              @focus="buscarClientes()"
              @input="buscarClientes()"
            />
            <ul
              v-if="clienteSuggestions.length > 0 && !clienteSelecionado"
              class="ds-suggestions"
            >
              <li
                v-for="c in clienteSuggestions"
                :key="c.value"
                class="ds-suggestion-item"
                @click="selecionarCliente(c)"
              >
                {{ c.label }}
              </li>
            </ul>
          </div>

          <template v-if="clienteSelecionado">
            <div class="ds-inline-row">
              <p class="ds-supporting-copy">
                Cliente: <strong>{{ clienteSelecionado.label }}</strong>
              </p>
              <button type="button" class="ds-link-danger" @click="limparCliente">trocar</button>
            </div>

            <div v-if="loadingProjetos" class="ds-supporting-copy">
              <i class="pi pi-spin pi-spinner" />
              Carregando pedidos…
            </div>
            <div v-else-if="projetosDoCliente.length === 0" class="ds-supporting-copy ds-supporting-copy--warning">
              Nenhum projeto encontrado para este cliente.
            </div>
            <template v-else>
              <select
                v-model="projetoSelecionadoId"
                class="ds-field-line ds-field-line--select mt-2 max-w-3xl"
                @change="abrirProjetoDoCliente"
              >
                <option :value="null">Selecione o pedido</option>
                <option v-for="p in projetosDoCliente" :key="p.id" :value="p.id">
                  {{ p.codigo }}{{ p.origem_resumo ? ` — ${p.origem_resumo}` : '' }}
                </option>
              </select>
            </template>
          </template>
        </section>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MedicaoFinaService, ClienteService, AgendaGeralService } from '@/services'
import { getExecucaoEtapaLabel } from '@/constantes'
import { can } from '@/services/permissions'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'

definePage({ meta: { perm: ['agendamentos.vendas', 'agendamentos.producao'] } })

const router = useRouter()

const projetoIdInput = ref('')
const clienteSearch = ref('')
const clienteSuggestions = ref([])
const clienteSelecionado = ref(null)
const projetosDoCliente = ref([])
const loadingProjetos = ref(false)
const projetoSelecionadoId = ref(null)
let clienteSearchTimeout = null

const podeVerAgendaGeral = computed(() => can('agendamentos.ver'))
const loadingAgenda = ref(false)
const erroAgenda = ref('')
const eventosAgenda = ref([])

const eventosProjetoTecnico = computed(() =>
  eventosAgenda.value.filter((ev) => String(ev?.subetapa || '').toUpperCase() === 'PROJETO_TECNICO'),
)

function nomeCliente(ev) {
  const c = ev?.cliente
  return c?.nome_completo || c?.razao_social || c?.nome || '—'
}

function voltarAgenda() {
  router.push('/agenda-geral')
}

function abrirProjetoTecnico(projetoId) {
  const id = Number(String(projetoId || '').replace(/\D/g, ''))
  if (!id) return
  router.push({
    path: `/producao/projeto-tecnico/${id}`,
    query: {
      back: '/producao/projeto-tecnico',
      backLabel: 'Voltar para projeto técnico',
    },
  })
}

async function irParaProjeto() {
  const raw = String(projetoIdInput.value || '').trim()
  if (!raw) return
  const num = Number(raw.replace(/\D/g, ''))
  let id = num > 0 ? num : null
  if (!id) {
    try {
      const res = await MedicaoFinaService.resolverProjeto(raw)
      const data = res?.data ?? res
      id = data?.projeto_id
    } catch (_) {}
  }
  if (id) abrirProjetoTecnico(id)
}

async function buscarClientes() {
  if (clienteSearchTimeout) clearTimeout(clienteSearchTimeout)
  const q = String(clienteSearch.value || '').trim()
  if (q.length < 2) {
    clienteSuggestions.value = []
    return
  }
  clienteSearchTimeout = setTimeout(async () => {
    try {
      const res = await ClienteService.select(q)
      const data = Array.isArray(res?.data) ? res.data : []
      clienteSuggestions.value = data.map((item) => ({
        label: item?.label || item?.nome_completo || item?.razao_social || item?.nome || '',
        value: item?.value ?? item?.id ?? item?.cliente_id ?? null,
      })).filter((opt) => opt.value != null && opt.label)
    } catch {
      clienteSuggestions.value = []
    }
  }, 300)
}

function selecionarCliente(c) {
  clienteSelecionado.value = c
  clienteSuggestions.value = []
  clienteSearch.value = c.label
  loadingProjetos.value = true
  projetosDoCliente.value = []
  projetoSelecionadoId.value = null
  MedicaoFinaService.projetosPorCliente(c.value).then((res) => {
    const list = res?.data ?? res ?? []
    projetosDoCliente.value = Array.isArray(list) ? list : []
  }).catch(() => {
    projetosDoCliente.value = []
  }).finally(() => {
    loadingProjetos.value = false
  })
}

function limparCliente() {
  clienteSelecionado.value = null
  clienteSearch.value = ''
  projetosDoCliente.value = []
  projetoSelecionadoId.value = null
}

function abrirProjetoDoCliente() {
  const id = projetoSelecionadoId.value
  if (!id) return
  abrirProjetoTecnico(id)
}

async function carregarAgenda() {
  if (!podeVerAgendaGeral.value) return
  erroAgenda.value = ''
  loadingAgenda.value = true
  try {
    const { data } = await AgendaGeralService.listar({
      subetapa: 'PROJETO_TECNICO',
    })
    const ev = data?.eventos
    eventosAgenda.value = Array.isArray(ev) ? ev : []
  } catch (e) {
    erroAgenda.value = e?.response?.data?.message || 'Não foi possível carregar a agenda.'
    eventosAgenda.value = []
  } finally {
    loadingAgenda.value = false
  }
}

onMounted(() => {
  if (podeVerAgendaGeral.value) carregarAgenda()
})
</script>

<style scoped>
.projeto-tecnico-hub {
  min-height: 100%;
  background: var(--ds-color-surface);
}

.projeto-tecnico-hub__content {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 1rem 1.5rem;
}

.projeto-tecnico-hub__block {
  padding-top: 1rem;
  padding-bottom: 0.5rem;
}

@media (min-width: 768px) {
  .projeto-tecnico-hub__content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .projeto-tecnico-hub__content {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
