<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Todos os orçamentos"
        subtitle="Lista de propostas por cliente"
        icon="pi pi-briefcase"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <RouterLink
              to="/orcamentos"
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <i class="pi pi-arrow-left text-xs"></i>
              Voltar
            </RouterLink>
            <div class="w-full sm:w-96 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar cliente, telefone ou ID..."
              />
            </div>
            <Button
              v-if="can('orcamentos.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="novoGeral"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Orçamento
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft"></i>
        </div>

        <div v-else-if="grupos.length === 0" class="text-center py-20 rounded-xl border border-border-ui bg-bg-page">
          <i class="pi pi-inbox text-4xl text-text-soft mb-2"></i>
          <p class="text-text-soft font-bold uppercase text-xs">Nenhum orçamento encontrado</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="grupo in grupos"
            :key="grupo.clienteId"
            class="rounded-xl border border-border-ui bg-bg-page overflow-hidden hover:shadow-md transition-all"
          >
            <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between bg-bg-page/50">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-bg-card border border-border-ui flex items-center justify-center text-text-main font-black text-xs">
                  {{ grupo.orcamentos.length }}
                </div>
                <div>
                  <h3 class="text-sm font-black text-text-main uppercase tracking-tight">{{ grupo.clienteNome }}</h3>
                  <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                    Propostas do cliente
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span class="block text-xs font-black text-text-main">{{ format.currency(grupo.total) }}</span>
              </div>
            </div>

            <div class="divide-y divide-border-ui">
              <div
                v-for="orc in grupo.orcamentos"
                :key="orc.id"
                class="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-xs font-bold text-text-main">#{{ orc.id }}</span>
                    <StatusBadge :value="orc.status" />
                    <span class="text-[10px] text-text-soft font-medium">{{ format.date(orc.created_at) }}</span>
                  </div>
                  <p v-if="orc.descricao_resumo" class="text-xs text-text-soft line-clamp-2">{{ orc.descricao_resumo }}</p>
                </div>

                <div class="flex items-center gap-4 flex-shrink-0">
                  <span class="text-sm font-black text-text-main">{{ format.currency(orc.total_itens ?? orc.valor_total ?? 0) }}</span>

                  <div class="flex gap-1.5">
                    <button
                      @click="editar(orc.id)"
                      class="w-7 h-7 rounded-lg bg-bg-page border border-border-ui text-text-main hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all flex items-center justify-center"
                      title="Editar"
                    >
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button
                      @click="gerarPdf(orc.id)"
                      class="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                      title="Gerar PDF"
                    >
                      <i class="pi pi-file-pdf text-[10px]"></i>
                    </button>
                    <button
                      v-if="can('orcamentos.excluir')"
                      @click="confirmarExcluir(orc.id)"
                      class="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-text-soft hover:text-rose-500 transition-all flex items-center justify-center"
                      title="Excluir"
                    >
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api'
import { format } from '@/utils/format'
import { OrcamentosService } from '@/services/index'

definePage({ meta: { perm: 'orcamentos.ver' } })

const router = useRouter()
const loading = ref(true)
const rows = ref([])
const filtro = ref('')

const grupos = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  const filtrados = rows.value.filter(o => {
    if (!termo) return true
    const cli = String(o.cliente?.nome_completo || o.cliente?.nome || '').toLowerCase()
    const tel = String(o.cliente?.telefone || '').toLowerCase()
    const id = String(o.id)
    return cli.includes(termo) || tel.includes(termo) || id.includes(termo)
  })
  const map = {}
  filtrados.forEach(orc => {
    const cliId = orc.cliente_id || 'avulso'
    if (!map[cliId]) {
      map[cliId] = {
        clienteId: cliId,
        clienteNome: orc.cliente?.nome_completo || orc.cliente?.nome || 'Cliente não identificado',
        orcamentos: [],
        total: 0
      }
    }
    map[cliId].orcamentos.push(orc)
    map[cliId].total += Number(orc.total_itens ?? orc.valor_total ?? 0)
  })
  return Object.values(map).sort((a, b) => b.orcamentos[0]?.id - a.orcamentos[0]?.id)
})

async function carregar() {
  if (!can('orcamentos.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/orcamentos')
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar orçamentos.')
  } finally {
    loading.value = false
  }
}

function novoGeral() {
  router.push('/orcamentos/novo')
}

function editar(id) {
  router.push(`/orcamentos/${id}`)
}

async function gerarPdf(id) {
  try {
    const { data } = await OrcamentosService.abrirPdf(id)
    const arquivoId = data?.arquivoId
    if (!arquivoId) {
      notify.error('Não foi possível gerar o PDF.')
      return
    }
    router.push({
      path: `/arquivos/${String(arquivoId).replace(/\D/g, '')}`,
      query: {
        name: `ORCAMENTO_${String(id).replace(/\D/g, '')}.pdf`,
        type: 'application/pdf',
      },
    })
  } catch (e) {
    notify.error('Erro ao gerar PDF.')
  }
}

async function confirmarExcluir(id) {
  if (!can('orcamentos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Orçamento', `Deseja excluir o orçamento #${id}?`)
  if (!ok) return
  try {
    await api.delete(`/orcamentos/${id}`)
    notify.success('Orçamento excluído')
    await carregar()
  } catch (e) {
    notify.error('Erro ao excluir')
  }
}

onMounted(carregar)
</script>
