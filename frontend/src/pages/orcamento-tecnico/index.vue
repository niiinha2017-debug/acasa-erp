<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
      <PageHeader
        title="Orçamento Técnico"
        subtitle="Criação direta com ambientes, medições e itens"
        icon="pi pi-file-edit"
        class="border-b border-border-ui"
      >
        <template #actions>
          <Button variant="primary" size="sm" class="!rounded-xl" @click="abrirNovo = true">
            <i class="pi pi-plus mr-2" />
            Novo Orçamento
          </Button>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push('/orcamento-tecnico/marcenaria-rapido')">
            <i class="pi pi-bolt mr-2" />
            Orcamento Rapido
          </Button>
          <Button variant="ghost" size="sm" class="!rounded-xl" :disabled="loading" @click="carregar">
            <i class="pi pi-refresh mr-2" :class="{ 'animate-spin': loading }" />
            Recarregar
          </Button>
        </template>
      </PageHeader>
      <div class="p-6 md:p-8 border-t border-border-ui bg-bg-page space-y-8">
        <p v-if="erro" class="text-rose-500 text-sm mb-4">{{ erro }}</p>
        <section v-if="lista.length > 0">
          <h2 class="text-sm font-bold uppercase tracking-wider text-text-soft mb-3">Orçamentos técnicos salvos</h2>
          <div class="rounded-xl border border-border-ui bg-bg-card overflow-hidden">
            <ul class="divide-y divide-border-ui">
              <li
                v-for="ot in lista"
                :key="ot.id"
                class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div class="min-w-0">
                  <span class="font-medium text-text-main">#{{ ot.id }}</span>
                  <span class="text-text-soft mx-2">·</span>
                  <span class="text-text-main">{{ ot.agenda_loja?.titulo || 'Orçamento direto' }}</span>
                  <span v-if="ot.agenda_loja?.cliente?.nome_completo" class="text-text-soft text-sm ml-2">
                    — {{ ot.agenda_loja.cliente.nome_completo }}
                  </span>
                  <span class="text-text-soft text-xs ml-2">{{ format.date(ot.criado_em) }}</span>
                </div>
                <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push(`/orcamento-tecnico/${ot.id}`)">
                  Ver itens
                </Button>
              </li>
            </ul>
          </div>
        </section>
        <Loading v-else-if="loading" />
        <p v-else class="text-text-soft text-sm">Nenhum orçamento técnico salvo ainda.</p>
      </div>
    </div>

    <div v-if="abrirNovo" class="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center">
      <div class="w-full max-w-2xl rounded-2xl border border-border-ui bg-bg-card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-text-main">[+] Novo Orçamento</h3>
          <button class="text-text-soft hover:text-text-main" @click="fecharNovo">
            <i class="pi pi-times" />
          </button>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-text-soft">Cliente existente</label>
          <div class="flex gap-2">
            <input
              v-model="clienteBusca"
              type="text"
              class="flex-1 rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm"
              placeholder="Digite para buscar cliente"
              @input="buscarClientes"
            />
            <Button variant="ghost" size="sm" class="!rounded-xl" @click="buscarClientes">Buscar</Button>
          </div>
          <div class="max-h-36 overflow-auto rounded-xl border border-border-ui bg-white">
            <button
              v-for="c in clientesEncontrados"
              :key="c.id"
              type="button"
              class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              @click="selecionarCliente(c)"
            >
              {{ c.nome_completo || c.label }}
              <span class="text-text-soft text-xs">#{{ c.id }}</span>
            </button>
            <p v-if="!clientesEncontrados.length" class="px-3 py-2 text-xs text-text-soft">Nenhum cliente listado.</p>
          </div>
          <p v-if="clienteSelecionado" class="text-xs text-emerald-700">
            Cliente selecionado: <strong>{{ clienteSelecionado.nome_completo || clienteSelecionado.label }}</strong>
          </p>
        </div>

        <div class="pt-2 border-t border-border-ui space-y-2">
          <label class="inline-flex items-center gap-2 text-sm text-text-main">
            <input v-model="usarCadastroRapido" type="checkbox" />
            Cadastrar cliente rápido nesta tela
          </label>
          <div v-if="usarCadastroRapido" class="grid gap-2 md:grid-cols-2">
            <input v-model="clienteRapido.nome_completo" class="rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm" placeholder="Nome completo*" />
            <input v-model="clienteRapido.telefone" class="rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm" placeholder="Telefone" />
            <input v-model="clienteRapido.whatsapp" class="rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm" placeholder="WhatsApp" />
            <input v-model="clienteRapido.email" class="rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm" placeholder="E-mail" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-border-ui">
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="fecharNovo">Cancelar</Button>
          <Button variant="primary" size="sm" class="!rounded-xl" :loading="criando" @click="criarNovoDireto">
            Criar e Abrir
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService, OrcamentoTecnicoService } from '@/services'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const router = useRouter()
const loading = ref(true)
const erro = ref('')
const lista = ref([])
const abrirNovo = ref(false)
const criando = ref(false)
const clienteBusca = ref('')
const clientesEncontrados = ref([])
const clienteSelecionado = ref(null)
const usarCadastroRapido = ref(false)
const clienteRapido = ref({ nome_completo: '', telefone: '', whatsapp: '', email: '' })

async function carregar() {
  loading.value = true
  erro.value = ''
  try {
    const res = await OrcamentoTecnicoService.listar()
    const raw = res?.data ?? res
    lista.value = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
  } catch (e) {
    lista.value = []
    const status = e?.response?.status
    erro.value = status === 401
      ? 'Faça login novamente para carregar a lista.'
      : (e?.response?.data?.message || 'Erro ao carregar a lista. Tente novamente.')
  } finally {
    loading.value = false
  }
}

function fecharNovo() {
  abrirNovo.value = false
  criando.value = false
  clienteBusca.value = ''
  clientesEncontrados.value = []
  clienteSelecionado.value = null
  usarCadastroRapido.value = false
  clienteRapido.value = { nome_completo: '', telefone: '', whatsapp: '', email: '' }
}

function selecionarCliente(cliente) {
  clienteSelecionado.value = cliente
  usarCadastroRapido.value = false
}

async function buscarClientes() {
  try {
    const res = await ClienteService.select(clienteBusca.value || '')
    const raw = res?.data ?? []
    const lista = Array.isArray(raw) ? raw : []
    clientesEncontrados.value = lista
      .map((item) => {
        const id = Number(item?.id ?? item?.value ?? item?.cliente_id ?? 0)
        const nome = String(item?.nome_completo || item?.razao_social || item?.label || '').trim()
        if (!id || !nome) return null
        return {
          id,
          label: nome,
          nome_completo: nome,
        }
      })
      .filter(Boolean)
  } catch {
    clientesEncontrados.value = []
  }
}

async function criarNovoDireto() {
  const payload = {}
  if (usarCadastroRapido.value) {
    if (!String(clienteRapido.value.nome_completo || '').trim()) {
      notify.error('Informe o nome no cadastro rápido.')
      return
    }
    payload.cliente_rapido = { ...clienteRapido.value }
  } else if (clienteSelecionado.value?.id) {
    payload.cliente_id = Number(clienteSelecionado.value.id)
  } else {
    notify.error('Selecione um cliente existente ou use o cadastro rápido.')
    return
  }

  criando.value = true
  try {
    const res = await OrcamentoTecnicoService.criarDireto(payload)
    const created = res?.data ?? res
    if (!created?.id) throw new Error('Não foi possível criar o orçamento técnico.')
    notify.success('Orçamento técnico criado com sucesso.')
    fecharNovo()
    router.push(`/orcamento-tecnico/${created.id}`)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao criar orçamento técnico.')
  } finally {
    criando.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
