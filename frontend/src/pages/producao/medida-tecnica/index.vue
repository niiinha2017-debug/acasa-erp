<template>
  <PageShell :padded="false">
    <section class="medida-tecnica-hub ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Medida técnica"
        subtitle="Contexto único para medir por escrita, desenho em foto e planta 2D."
        icon="pi pi-compass"
      />

      <div class="medida-tecnica-hub__content ds-page-context__content">
        <div class="ds-shell-card p-4 md:p-6 space-y-5 max-w-3xl">
          <div class="space-y-2">
            <p class="text-sm font-semibold text-text-main">
              Buscar por cliente
            </p>
            <div class="relative">
              <input
                v-model="clienteSearch"
                type="text"
                placeholder="Digite o nome do cliente..."
                class="ds-field-line"
                autocomplete="off"
                @focus="buscarClientes"
                @input="buscarClientes"
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
          </div>

          <template v-if="clienteSelecionado">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm text-text-soft">
                Cliente selecionado: <strong class="text-text-main">{{ clienteSelecionado.label }}</strong>
              </p>
              <button type="button" class="ds-link-danger" @click="limparCliente">trocar</button>
            </div>

            <div v-if="loadingProjetos" class="text-sm text-text-soft">
              <i class="pi pi-spin pi-spinner mr-2" />
              Carregando projetos...
            </div>
            <div v-else-if="projetosDoCliente.length === 0" class="text-sm text-text-soft">
              Nenhum projeto encontrado para este cliente.
            </div>
            <div v-else class="flex flex-col sm:flex-row gap-3">
              <select
                v-model="projetoSelecionadoId"
                class="ds-field-line ds-field-line--select"
              >
                <option :value="null">Selecione o projeto</option>
                <option v-for="p in projetosDoCliente" :key="p.id" :value="p.id">
                  {{ p.codigo || `Projeto #${p.id}` }}{{ p.origem_resumo ? ` — ${p.origem_resumo}` : '' }}
                </option>
              </select>
              <Button type="button" class="!rounded-xl" @click="abrirProjetoSelecionado">
                Abrir projeto
              </Button>
            </div>
          </template>

          <div class="border-t border-border-ui/70 pt-4 space-y-3">
          <p class="text-sm text-text-soft">
            Ou abra por ID/código do projeto.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="projetoIdInput"
              type="text"
              placeholder="ID ou código do projeto (ex.: 12, PROJ-12)"
              class="ds-field-line"
              @keyup.enter="abrir"
            />
            <Button type="button" class="!rounded-xl" @click="abrir">
              Abrir
            </Button>
          </div>
          </div>
          <p v-if="erro" class="text-xs text-red-600 dark:text-red-400">{{ erro }}</p>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService, MedicaoFinaService } from '@/services'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'

definePage({ meta: { perm: ['agendamentos.vendas', 'agendamentos.producao'] } })

const router = useRouter()
const projetoIdInput = ref('')
const erro = ref('')
const clienteSearch = ref('')
const clienteSuggestions = ref([])
const clienteSelecionado = ref(null)
const projetosDoCliente = ref([])
const loadingProjetos = ref(false)
const projetoSelecionadoId = ref(null)
let clienteSearchTimeout = null

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
      clienteSuggestions.value = data
        .map((item) => ({
          label: item?.label || item?.nome_completo || item?.razao_social || item?.nome || '',
          value: item?.value ?? item?.id ?? item?.cliente_id ?? null,
        }))
        .filter((opt) => opt.value != null && opt.label)
    } catch {
      clienteSuggestions.value = []
    }
  }, 250)
}

function limparCliente() {
  clienteSelecionado.value = null
  clienteSearch.value = ''
  clienteSuggestions.value = []
  projetosDoCliente.value = []
  projetoSelecionadoId.value = null
}

async function selecionarCliente(c) {
  erro.value = ''
  clienteSelecionado.value = c
  clienteSuggestions.value = []
  clienteSearch.value = c.label
  projetosDoCliente.value = []
  projetoSelecionadoId.value = null
  loadingProjetos.value = true
  try {
    const res = await MedicaoFinaService.projetosPorCliente(c.value)
    const list = res?.data ?? res ?? []
    projetosDoCliente.value = Array.isArray(list) ? list : []
  } catch {
    projetosDoCliente.value = []
  } finally {
    loadingProjetos.value = false
  }
}

function abrirProjetoSelecionado() {
  const id = Number(projetoSelecionadoId.value || 0)
  if (!id) {
    erro.value = 'Selecione um projeto do cliente para abrir.'
    return
  }
  router.push(`/producao/medida-tecnica/${id}`)
}

async function abrir() {
  erro.value = ''
  const raw = String(projetoIdInput.value || '').trim()
  if (!raw) return

  const num = Number(raw.replace(/\D/g, ''))
  if (Number.isFinite(num) && num > 0) {
    router.push(`/producao/medida-tecnica/${num}`)
    return
  }

  try {
    const res = await MedicaoFinaService.resolverProjeto(raw)
    const data = res?.data ?? res ?? null
    const id = Number(data?.projeto_id || 0)
    if (id > 0) {
      router.push(`/producao/medida-tecnica/${id}`)
      return
    }
    erro.value = 'Projeto não encontrado para o código informado.'
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível localizar o projeto.'
  }
}
</script>

<style scoped>
.medida-tecnica-hub {
  min-height: 100%;
  background: var(--ds-color-surface);
}

.medida-tecnica-hub__content {
  padding: 0 1rem 1.5rem;
}

@media (min-width: 768px) {
  .medida-tecnica-hub__content { padding: 0 1.5rem 2rem; }
}
</style>
