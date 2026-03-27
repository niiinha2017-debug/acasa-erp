<template>
  <PageShell :padded="false">
    <section class="ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        :title="resultado?.nome_cliente || 'Orçamentos'"
        subtitle="Compare as versões de orçamento e escolha qual usar no markup"
        icon="pi pi-file-edit"
      >
        <template #actions>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" @click="router.push('/comercial/orcamentos')">
              <i class="pi pi-arrow-left" />
              Voltar
            </Button>
            <Button variant="secondary" :loading="loading" @click="carregar">
              <i class="pi pi-refresh" />
              Recarregar
            </Button>
            <Button
              v-if="resultado?.versoes?.length"
              variant="primary"
              @click="irParaMarkup()"
            >
              <i class="pi pi-percentage" />
              Ir para Markup
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 md:px-8 pb-8 pt-5 space-y-6">

        <!-- Loading -->
        <div v-if="loading && !resultado" class="py-16 text-center text-text-muted font-semibold">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <p class="mt-2">Carregando orçamentos...</p>
        </div>

        <!-- Erro -->
        <div v-else-if="erro" class="ds-alert ds-alert--warning text-sm">{{ erro }}</div>

        <!-- Sem orçamentos -->
        <div v-else-if="resultado && !resultado.versoes?.length" class="py-16 text-center text-text-muted">
          <i class="pi pi-inbox text-3xl mb-3 opacity-40" />
          <p class="font-semibold">Nenhum orçamento encontrado</p>
          <p class="text-sm mt-1">Envie arquivos categorizados como ORÇAMENTO para este cliente.</p>
        </div>

        <!-- Conteúdo -->
        <template v-else-if="resultado">

          <!-- Resumo topo -->
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span class="text-text-muted">
              <strong class="text-text-main">{{ resultado.total_versoes }}</strong>
              {{ resultado.total_versoes === 1 ? 'versão encontrada' : 'versões encontradas' }}
            </span>
            <span v-if="versaoSelecionadaKey" class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-0.5 text-xs font-semibold">
              <i class="pi pi-check-circle text-xs" />
              Versão selecionada para markup
            </span>
          </div>

          <!-- Comparativo lado a lado (2+ versões) -->
          <div
            v-if="resultado.versoes.length >= 2"
            class="ds-card ds-card--default p-5 space-y-4"
          >
            <h2 class="text-sm font-black uppercase tracking-wider text-text-muted">Comparativo de valores</h2>
            <div class="overflow-x-auto rounded-lg border border-border-ui">
              <table class="min-w-full text-xs">
                <thead>
                  <tr class="bg-[var(--ds-color-surface-muted)] text-left text-text-muted">
                    <th class="px-3 py-2 font-bold">Versão</th>
                    <th class="px-3 py-2 font-bold text-right">Valor Total</th>
                    <th class="px-3 py-2 font-bold">Ambientes</th>
                    <th class="px-3 py-2 font-bold">Data</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="v in resultado.versoes"
                    :key="v.versao_key"
                    class="border-t border-border-ui"
                    :class="versaoSelecionadaKey === v.versao_key ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''"
                  >
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-text-main max-w-[16rem] truncate" :title="v.versao_label">
                          {{ nomeVersaoCompacto(v.versao_label) }}
                        </span>
                        <span v-if="v.is_mais_recente" class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          Mais recente
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums font-semibold">
                      {{ v.valor_total != null ? formatValor(v.valor_total) : '—' }}
                    </td>
                    <td class="px-3 py-2 text-text-muted">
                      {{ v.ambientes.length ? v.ambientes.map(a => a.nome).join(', ') : '—' }}
                    </td>
                    <td class="px-3 py-2 text-text-muted tabular-nums">
                      {{ formatData(v.criado_em) }}
                    </td>
                    <td class="px-3 py-2 text-right">
                      <button
                        v-if="versaoSelecionadaKey !== v.versao_key"
                        type="button"
                        class="text-xs font-semibold text-brand-primary hover:underline"
                        @click="selecionarVersao(v)"
                      >
                        Usar esta
                      </button>
                      <span v-else class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <i class="pi pi-check text-xs" /> Selecionada
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Diferença de valor entre mais recente e anterior -->
            <div v-if="diferencaValor !== null" class="text-xs text-text-muted">
              Diferença entre a versão mais recente e a anterior:
              <span :class="diferencaValor >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'" class="font-semibold">
                {{ diferencaValor >= 0 ? '+' : '' }}{{ formatValor(diferencaValor) }}
              </span>
            </div>
          </div>

          <!-- Cards de versão detalhada -->
          <div class="space-y-4">
            <div
              v-for="v in resultado.versoes"
              :key="v.versao_key"
              class="ds-card ds-card--default p-5 space-y-4"
              :class="versaoSelecionadaKey === v.versao_key ? 'border-l-4 border-l-emerald-500/80' : (v.is_mais_recente ? 'border-l-4 border-l-blue-500/60' : '')"
            >
              <!-- Cabeçalho do card -->
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-black text-text-main">{{ nomeVersaoCompacto(v.versao_label) }}</h3>
                    <span v-if="v.is_mais_recente" class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      Mais recente
                    </span>
                    <span v-if="versaoSelecionadaKey === v.versao_key" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      <i class="pi pi-check-circle text-[10px]" /> Selecionada
                    </span>
                  </div>
                  <p class="text-[11px] text-text-muted">
                    {{ v.arquivos.length }} arquivo(s) · Adicionado em {{ formatData(v.criado_em) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="versaoSelecionadaKey !== v.versao_key"
                    variant="secondary"
                    size="sm"
                    @click="selecionarVersao(v)"
                  >
                    Usar no markup
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    @click="irParaMarkup(v)"
                  >
                    <i class="pi pi-percentage" />
                    Markup
                  </Button>
                </div>
              </div>

              <!-- Valor e ambientes -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <div class="text-[10px] font-bold uppercase text-text-muted">Valor total</div>
                  <div class="text-2xl font-black tabular-nums text-text-main">
                    {{ v.valor_total != null ? formatValor(v.valor_total) : '—' }}
                  </div>
                </div>
                <div class="space-y-1" v-if="v.ambientes.length">
                  <div class="text-[10px] font-bold uppercase text-text-muted">Ambientes ({{ v.ambientes.length }})</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="amb in v.ambientes"
                      :key="amb.nome"
                      class="inline-flex items-center gap-1 rounded-lg bg-[var(--ds-color-surface-muted)] px-2 py-1 text-xs font-semibold text-text-main"
                    >
                      {{ amb.nome }}
                      <span v-if="amb.valor > 0" class="text-text-muted tabular-nums">· {{ formatValor(amb.valor) }}</span>
                    </span>
                  </div>
                </div>
                <div v-else class="space-y-1">
                  <div class="text-[10px] font-bold uppercase text-text-muted">Ambientes</div>
                  <div class="text-sm text-text-muted">Não identificados</div>
                </div>
              </div>

              <!-- Lista de arquivos -->
              <div class="border-t border-border-ui pt-3">
                <div class="text-[10px] font-bold uppercase text-text-muted mb-2">Arquivos desta versão</div>
                <div class="space-y-1">
                  <div
                    v-for="arq in v.arquivos"
                    :key="arq.id"
                    class="flex items-center gap-2 text-xs text-text-muted"
                  >
                    <i :class="iconArquivo(arq.mime_type)" class="text-xs w-4 flex-shrink-0" />
                    <span class="truncate">{{ arq.nome }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'

definePage({ meta: { perm: ['clientes.ver', 'arquivos.ver'] } })

const route = useRoute()
const router = useRouter()

const clienteId = computed(() => String(route.params.clienteId || '').replace(/\D/g, ''))

const loading = ref(false)
const resultado = ref(null)
const erro = ref('')
const versaoSelecionadaKey = ref(null)

function formatValor(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatData(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return String(iso)
  }
}

function nomeVersaoCompacto(label) {
  if (!label) return '—'
  // Remove extensão se ainda presente
  return label.replace(/\.(pdf|docx?)$/i, '').trim()
}

function iconArquivo(mime) {
  if (!mime) return 'pi pi-file'
  if (mime.includes('pdf')) return 'pi pi-file-pdf'
  if (mime.includes('word') || mime.includes('wordprocessingml')) return 'pi pi-file-word'
  return 'pi pi-file'
}

const diferencaValor = computed(() => {
  const versoes = resultado.value?.versoes
  if (!versoes || versoes.length < 2) return null
  const v1 = versoes[0]?.valor_total
  const v2 = versoes[1]?.valor_total
  if (v1 == null || v2 == null) return null
  return Number(v1) - Number(v2)
})

function selecionarVersao(versao) {
  versaoSelecionadaKey.value = versao.versao_key
  notify.success(`Versão "${nomeVersaoCompacto(versao.versao_label)}" selecionada para o markup.`)
}

function irParaMarkup(versao) {
  const id = clienteId.value
  if (!id) return
  // Se uma versão específica foi passada ou selecionada, passa os IDs dos arquivos como query param
  const v = versao || resultado.value?.versoes?.find(x => x.versao_key === versaoSelecionadaKey.value)
  if (v?.arquivos?.length) {
    const ids = v.arquivos.map(a => a.id).join(',')
    router.push(`/comercial/pos-venda-markup/${id}?orc_ids=${ids}`)
  } else {
    router.push(`/comercial/pos-venda-markup/${id}`)
  }
}

async function carregar() {
  const id = clienteId.value
  if (!id) {
    erro.value = 'Cliente inválido na URL.'
    return
  }
  loading.value = true
  erro.value = ''
  try {
    const { data } = await ArquivosService.listarOrcamentosCliente(id)
    resultado.value = data
    // Pré-seleciona a versão mais recente
    const maisRecente = data?.versoes?.find(v => v.is_mais_recente)
    if (maisRecente) versaoSelecionadaKey.value = maisRecente.versao_key
  } catch (e) {
    console.error(e)
    resultado.value = null
    const msg = e?.response?.data?.message
    erro.value = Array.isArray(msg) ? msg.join(' | ') : msg || 'Não foi possível carregar os orçamentos.'
    notify.error('Falha ao carregar orçamentos.')
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
