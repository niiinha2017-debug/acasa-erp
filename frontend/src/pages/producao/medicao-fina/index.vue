<template>
  <PageShell :padded="false">
    <section class="medicao-fina-hub ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="pageTitle"
        :subtitle="pageSubtitle"
        icon="pi pi-ruler"
      >
        <template v-if="projetoId" #actions>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            class="medicao-fina-hub__back"
            @click="voltar"
          >
            <i class="pi pi-arrow-left mr-1" />
            Voltar
          </Button>
        </template>
      </PageHeader>

      <div class="medicao-fina-hub__content ds-page-context__content">
        <div class="medicao-fina-hub__modebar">
          <div class="ds-segmented" role="tablist" aria-label="Etapa da medição">
        <button
          type="button"
          class="ds-segmented__button"
          :class="
            etapaFluxo === 'pre'
              ? 'ds-segmented__button--active'
              : ''
          "
          @click="etapaFluxo = 'pre'"
        >
          <i class="pi pi-search mr-1.5" />
          Central pré-orçamento
        </button>
        <button
          type="button"
          class="ds-segmented__button"
          :class="
            etapaFluxo === 'pos'
              ? 'ds-segmented__button--active'
              : ''
          "
          @click="etapaFluxo = 'pos'"
        >
          <i class="pi pi-sliders-h mr-1.5" />
          Central pós-contrato
        </button>
          </div>
        </div>

        <template v-if="etapaFluxo === 'pos'">
        <div class="medicao-fina-hub__finder ds-linear-layout">
          <section class="ds-linear-section ds-linear-section--tight">
            <div class="ds-section-head">
              <div>
                <p class="ds-kicker">Seleção direta</p>
                <h2 class="ds-section-title">Abrir por ID ou código do projeto</h2>
              </div>
            </div>
            <div class="ds-inline-row">
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

          <section class="ds-linear-section">
            <div class="ds-section-head">
              <div>
                <p class="ds-kicker">Busca assistida</p>
                <h2 class="ds-section-title">Selecionar cliente e projeto</h2>
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
                Carregando pedidos do cliente...
              </div>
              <div v-else-if="projetosDoCliente.length === 0" class="ds-supporting-copy ds-supporting-copy--warning">
                Nenhuma ficha de pedido (venda/orçamento) encontrada para este cliente.
              </div>
              <template v-else>
                <p class="ds-supporting-copy text-xs opacity-90 max-w-xl">
                  “Projeto” aqui é só o registro interno que liga o cliente ao orçamento ou à venda — escolha pela origem (venda nº / proposta nº).
                </p>
                <select
                  v-model="projetoSelecionadoId"
                  class="ds-field-line ds-field-line--select mt-2"
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

          <section v-if="projetoId" class="ds-linear-section">
            <div class="ds-section-head ds-section-head--spread">
              <div>
                <p class="ds-kicker">Ação</p>
                <h2 class="ds-section-title">Tela operacional pronta</h2>
              </div>
              <span class="ds-inline-status">Projeto {{ projetoId }}</span>
            </div>
            <p class="ds-supporting-copy">
              Abrir a mesma tela operacional usada no agendamento da produção, sem caixas intermediárias.
            </p>
            <div class="ds-inline-row">
              <Button type="button" @click="abrirRotaPosVenda(projetoId)">
                <i class="pi pi-external-link mr-1.5" />
                Abrir tela operacional
              </Button>
              <Button type="button" variant="ghost" @click="limparProjetoPos">
                Limpar
              </Button>
            </div>
          </section>
        </div>
    </template>

    <template v-else>
      <div class="medicao-fina-hub__main-area ds-linear-layout">
        <section class="ds-linear-section">
          <div class="ds-section-head">
            <div>
              <p class="ds-kicker">Pré-medição</p>
              <h2 class="ds-section-title">Buscar cliente</h2>
            </div>
          </div>

          <div class="ds-linear-block">
            <section class="ds-linear-subsection">
              <div class="relative max-w-xl">
                <input
                  v-model="clienteSearchPre"
                  type="text"
                  placeholder="Buscar cliente..."
                  class="ds-field-line"
                  autocomplete="off"
                  @focus="buscarClientesPre()"
                  @input="buscarClientesPre()"
                />
                <ul
                  v-if="clienteSuggestionsPre.length > 0 && !clienteSelecionadoPre"
                  class="ds-suggestions"
                >
                  <li
                    v-for="c in clienteSuggestionsPre"
                    :key="c.value"
                    class="ds-suggestion-item"
                    @click="selecionarClientePre(c)"
                  >
                    {{ c.label }}
                  </li>
                </ul>
              </div>

              <div v-if="clienteSelecionadoPre" class="ds-inline-row">
                <p class="ds-supporting-copy">
                  Cliente: <strong>{{ clienteSelecionadoPre.label }}</strong>
                </p>
                <button type="button" class="ds-link-danger" @click="limparClientePre">trocar</button>
              </div>

              <p v-if="preMensagem" class="ds-supporting-copy" :class="preMensagemErro ? 'ds-supporting-copy--danger' : 'ds-supporting-copy--success'">
                {{ preMensagem }}
              </p>
            </section>

            <section v-if="preMedicao" class="ds-linear-subsection">
              <div class="ds-inline-row">
                <span class="ds-inline-status">{{ preMedicao.status || 'RASCUNHO' }}</span>
              </div>
              <div class="ds-inline-row">
                <Button type="button" :disabled="abrindoTelaTotem" @click="abrirTelaLivrePreMedicao">
                  <i class="pi" :class="abrindoTelaTotem ? 'pi-spin pi-spinner' : 'pi-external-link'" />
                  <span class="ml-1">Abrir tela operacional</span>
                </Button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MedicaoFinaService, ClienteService, TotemFabricaService } from '@/services'
import Button from '@/components/ui/Button.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const route = useRoute()
const router = useRouter()
const etapaFluxo = ref(route.query?.etapa === 'pre' ? 'pre' : 'pos')

const projetoIdInput = ref('')
const projetoId = ref(Number(String(route.query?.projetoId || '').replace(/\D/g, '')) || null)

// Busca por cliente
const clienteSearch = ref('')
const clienteSuggestions = ref([])
const clienteSelecionado = ref(null)
const projetosDoCliente = ref([])
const loadingProjetos = ref(false)
const projetoSelecionadoId = ref(null)
let clienteSearchTimeout = null

// Pré-orçamento (manual, sem totem)
const clienteSearchPre = ref('')
const clienteSuggestionsPre = ref([])
const clienteSelecionadoPre = ref(null)
const preMedicao = ref(null)
const preMensagem = ref('')
const preMensagemErro = ref(false)
const abrindoTelaTotem = ref(false)
let clienteSearchTimeoutPre = null

const pageTitle = computed(() => (etapaFluxo.value === 'pre' ? 'Central de Medição Inicial' : 'Central de Medição Fina'))
const pageSubtitle = computed(() => (
  etapaFluxo.value === 'pre'
    ? 'Selecione o cliente e abra a tela operacional'
    : 'Selecione o projeto e abra a tela operacional'
))
const redirecionandoPos = ref(false)

function voltar() {
  router.push('/agenda-geral')
}

function abrirRotaPosVenda(id) {
  const projeto = Number(String(id || '').replace(/\D/g, '')) || null
  if (!projeto || redirecionandoPos.value) return
  redirecionandoPos.value = true
  router.push({
    path: `/medicao-fina/${projeto}`,
    query: {
      source: 'projeto',
      back: '/producao/medicao-fina?etapa=pos',
      backLabel: 'Voltar para medição fina',
      pageTitle: 'Medição Fina',
      subtitle: 'Dados reais do ambiente antes da produção',
    },
  }).finally(() => {
    redirecionandoPos.value = false
  })
}

function limparProjetoPos() {
  projetoId.value = null
  projetoIdInput.value = ''
  router.replace({
    path: '/producao/medicao-fina',
    query: {
      ...route.query,
      projetoId: undefined,
      etapa: 'pos',
    },
  })
}

async function buscarClientesPre() {
  if (clienteSearchTimeoutPre) clearTimeout(clienteSearchTimeoutPre)
  const q = String(clienteSearchPre.value || '').trim()
  if (q.length < 2) {
    clienteSuggestionsPre.value = []
    return
  }
  clienteSearchTimeoutPre = setTimeout(async () => {
    try {
      const res = await ClienteService.select(q)
      const data = Array.isArray(res?.data) ? res.data : []
      clienteSuggestionsPre.value = data.map((item) => ({
        label: item?.label || item?.nome_completo || item?.razao_social || item?.nome || '',
        value: item?.value ?? item?.id ?? item?.cliente_id ?? null,
      })).filter((opt) => opt.value != null && opt.label)
    } catch {
      clienteSuggestionsPre.value = []
    }
  }, 300)
}

async function selecionarClientePre(cliente) {
  clienteSelecionadoPre.value = cliente
  clienteSuggestionsPre.value = []
  clienteSearchPre.value = cliente.label
  preMensagem.value = ''
  preMensagemErro.value = false
  try {
    const res = await TotemFabricaService.getOuCriarPreMedicao(cliente.value)
    preMedicao.value = res?.data ?? res
  } catch (e) {
    preMedicao.value = null
    preMensagemErro.value = true
    preMensagem.value = e?.response?.data?.message || 'Não foi possível abrir a medição inicial deste cliente.'
  }
}

function limparClientePre() {
  clienteSelecionadoPre.value = null
  clienteSearchPre.value = ''
  clienteSuggestionsPre.value = []
  preMedicao.value = null
  preMensagem.value = ''
  preMensagemErro.value = false
}

async function abrirTelaLivrePreMedicao() {
  const preId = preMedicao.value?.id
  if (!preId) {
    preMensagemErro.value = true
    preMensagem.value = 'Selecione um cliente para abrir a tela de medição.'
    return
  }

  abrindoTelaTotem.value = true
  preMensagem.value = ''
  preMensagemErro.value = false
  try {
    router.push({
      path: `/medicao/pre/${preId}`,
      query: {
        source: 'pre-medicao',
        clienteNome: clienteSelecionadoPre.value?.label || '',
        back: '/producao/medicao-fina?etapa=pre',
        backLabel: 'Voltar para central de medição',
      },
    })
  } catch (e) {
    preMensagemErro.value = true
    preMensagem.value = e?.response?.data?.message || 'Não foi possível abrir a mesma tela do agendamento.'
  } finally {
    abrindoTelaTotem.value = false
  }
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
  abrirRotaPosVenda(id)
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
  if (id) {
    abrirRotaPosVenda(id)
  }
}

watch(() => route.query?.projetoId, (id) => {
  const n = Number(String(id || '').replace(/\D/g, ''))
  if (n) {
    projetoId.value = n
    if (etapaFluxo.value === 'pos') abrirRotaPosVenda(n)
  }
}, { immediate: true })

watch(() => route.query?.etapa, (etapa) => {
  etapaFluxo.value = etapa === 'pre' ? 'pre' : 'pos'
}, { immediate: true })

watch(etapaFluxo, (etapa) => {
  const etapaAtual = route.query?.etapa === 'pre' ? 'pre' : 'pos'
  if (etapaAtual === etapa) return
  router.replace({
    path: '/producao/medicao-fina',
    query: {
      ...route.query,
      etapa,
    },
  })
})
</script>

<style scoped>
.medicao-fina-hub {
  min-height: 100%;
  background: var(--ds-color-surface);
}

.medicao-fina-hub__content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0;
}

.medicao-fina-hub__back {
  border-radius: 0.9rem;
}

.medicao-fina-hub__modebar {
  padding: 0 1rem 0.85rem;
  border-top: 1px solid rgba(214, 224, 234, 0.68);
}

.medicao-fina-hub__finder,
.medicao-fina-hub__main-area {
  padding: 0 1rem 1.25rem;
}

.dark .medicao-fina-hub__modebar {
  border-top-color: rgba(51, 71, 102, 0.72);
}

@media (min-width: 768px) {
  .medicao-fina-hub__content,
  .medicao-fina-hub__modebar,
  .medicao-fina-hub__finder,
  .medicao-fina-hub__main-area {
    margin-left: 0;
    margin-right: 0;
  }

  .medicao-fina-hub__modebar,
  .medicao-fina-hub__finder,
  .medicao-fina-hub__main-area {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .medicao-fina-hub__modebar,
  .medicao-fina-hub__finder,
  .medicao-fina-hub__main-area {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (max-width: 767px) {
  .ds-segmented {
    width: 100%;
    flex-direction: column;
  }
}
</style>
