<template>
  <PageShell :padded="false">
    <section class="rel-sc ds-page-context animate-page-in">
      <PageHeader
        title="Relatório de Serviço de Corte"
        subtitle="Visão consolidada dos planos de corte por competência"
        icon="pi pi-box"
      >
        <template #actions>
          <div class="flex flex-wrap items-end justify-end gap-3 w-full">
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Mês</label>
              <select
                v-model="mes"
                class="ds-field-line ds-field-line--select h-10 w-[100px] text-sm font-medium"
              >
                <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Ano</label>
              <select
                v-model="ano"
                class="ds-field-line ds-field-line--select h-10 w-[90px] text-sm font-medium"
              >
                <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Fornecedor</label>
              <select
                v-model="fornecedorId"
                class="ds-field-line ds-field-line--select h-10 w-[200px] text-sm font-medium"
              >
                <option value="">Todos</option>
                <option v-for="f in fornecedorOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Status</label>
              <select
                v-model="statusFiltro"
                class="ds-field-line ds-field-line--select h-10 w-[180px] text-sm font-medium"
              >
                <option value="">Todos</option>
                <option value="PRODUCAO_RECEBIDA">Produção Recebida</option>
                <option value="CORTE">Corte / Usinagem</option>
                <option value="PRODUCAO_FINALIZADA">Produção Finalizada</option>
                <option value="COMPENSADO">Compensado</option>
              </select>
            </div>
            <Button @click="carregar" variant="secondary" class="shrink-0">
              <i class="pi pi-search"></i>
              Gerar
            </Button>
            <Button @click="exportarPdf" variant="primary" :disabled="exportandoPdf || !relatorio" class="shrink-0">
              <i class="pi pi-file-pdf"></i>
              Exportar PDF
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="rel-sc__body ds-page-context__content pb-6">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
        </div>

        <template v-else-if="relatorio">
          <!-- Card Total Geral -->
          <div class="rel-sc__total-card ds-card ds-card--default">
            <div class="flex items-center justify-between gap-4 p-4">
              <div>
                <p class="text-xs font-extrabold uppercase tracking-widest text-text-muted">Total Geral</p>
                <p class="text-2xl font-bold tabular-nums text-text-main mt-1">{{ formatarMoeda(relatorio.totalGeral) }}</p>
              </div>
              <span class="ds-status-pill ds-status-pill--info text-xs px-3">
                {{ relatorio.totalLancamentos }} planos
              </span>
            </div>
          </div>

          <!-- Seções agrupadas -->
          <div class="rel-sc__sections">
            <!-- Por Status -->
            <div class="rel-sc__section ds-card ds-card--default">
              <div class="p-4">
                <h4 class="rel-sc__section-title">Por Status</h4>
                <div class="rel-sc__bars">
                  <div v-for="item in relatorio.porStatus" :key="item.status" class="rel-sc__bar-row">
                    <span class="rel-sc__bar-label">{{ statusLabelFn(item.status) }}</span>
                    <div class="rel-sc__bar-track">
                      <div class="rel-sc__bar-fill" :class="statusBarClass(item.status)" :style="{ width: barPct(item.total) }"></div>
                    </div>
                    <span class="rel-sc__bar-value">{{ formatarMoeda(item.total) }}</span>
                    <span class="rel-sc__bar-count">{{ item.qtd }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Por Fornecedor -->
            <div class="rel-sc__section ds-card ds-card--default">
              <div class="p-4">
                <h4 class="rel-sc__section-title">Por Fornecedor</h4>
                <div class="rel-sc__bars">
                  <div v-for="item in relatorio.porFornecedor" :key="item.nome" class="rel-sc__bar-row">
                    <span class="rel-sc__bar-label">{{ item.nome }}</span>
                    <div class="rel-sc__bar-track">
                      <div class="rel-sc__bar-fill rel-sc__bar-fill--indigo" :style="{ width: barPct(item.total) }"></div>
                    </div>
                    <span class="rel-sc__bar-value">{{ formatarMoeda(item.total) }}</span>
                    <span class="rel-sc__bar-count">{{ item.qtd }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabela de detalhamento -->
          <div class="ds-card ds-card--default overflow-hidden native-table-flush mt-4">
            <div class="p-4 border-b border-border-ui">
              <h4 class="rel-sc__section-title">Detalhamento dos Planos</h4>
            </div>
            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-sm min-w-[600px]">
                <thead>
                  <tr class="border-b border-border-ui bg-slate-50 dark:bg-slate-800/50">
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">#</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Data Venda</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Fornecedor</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                    <th class="py-2 px-4 text-center text-xs font-semibold text-text-muted uppercase tracking-wide">Itens</th>
                    <th class="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, idx) in relatorio.lancamentos"
                    :key="'rel-' + idx"
                    class="border-b border-border-ui hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td class="py-3 px-4 tabular-nums text-text-muted">{{ row.id }}</td>
                    <td class="py-3 px-4 tabular-nums text-text-muted">{{ formatarData(row.data_venda) }}</td>
                    <td class="py-3 px-4 text-text-main font-medium">{{ row.fornecedor_nome }}</td>
                    <td class="py-3 px-4">
                      <span class="ds-status-pill ds-status-pill--neutral text-[0.6rem] px-2">
                        {{ statusLabelFn(row.status) }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center tabular-nums text-text-muted">{{ row.qtd_produtos }}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-semibold text-text-main">{{ formatarMoeda(row.valor_total) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-slate-100/60 dark:bg-slate-800/50">
                    <td colspan="5" class="py-3 px-4 text-right font-bold text-text-main">Total</td>
                    <td class="py-3 px-4 text-right tabular-nums font-bold text-text-main">{{ formatarMoeda(relatorio.totalGeral) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </template>

        <div v-else class="flex items-center justify-center py-12 text-text-muted text-sm">
          Selecione os filtros e clique em "Gerar" para visualizar o relatório.
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { saveBlobNativeOrBrowser } from '@/utils/native-download'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'plano_corte.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '')
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'

const loading = ref(false)
const exportandoPdf = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())
const fornecedorId = ref('')
const statusFiltro = ref('')
const relatorio = ref(null)
const fornecedorOptions = ref([])

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

function statusLabelFn(status) {
  const map = {
    PRODUCAO_RECEBIDA: 'Produção Recebida',
    CORTE: 'Corte / Usinagem',
    PRODUCAO_FINALIZADA: 'Produção Finalizada',
    COMPENSADO: 'Compensado',
    EM_ABERTO: 'Em aberto',
    AGUARDANDO_APROVACAO: 'Aguardando aprovação',
    CONFERENCIA_TECNICA: 'Conferência técnica',
    LIBERADO_PARA_CORTE: 'Liberado para corte',
    NA_FILA_DE_CORTE: 'Na fila de corte',
    EM_EXECUCAO: 'Em execução',
    AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  }
  return map[status] || status || '—'
}

function statusBarClass(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'COMPENSADO') return 'rel-sc__bar-fill--green'
  if (s === 'PRODUCAO_FINALIZADA') return 'rel-sc__bar-fill--teal'
  if (s === 'CORTE') return 'rel-sc__bar-fill--amber'
  return 'rel-sc__bar-fill--blue'
}

function barPct(valor) {
  const total = relatorio.value?.totalGeral
  if (!total || total <= 0) return '0%'
  return `${Math.min(Math.max((Number(valor) / Number(total)) * 100, 0), 100)}%`
}

function getParams() {
  return {
    mes: mes.value || undefined,
    ano: ano.value || undefined,
    fornecedor_id: fornecedorId.value || undefined,
    status: statusFiltro.value || undefined,
  }
}

async function carregar() {
  loading.value = true
  try {
    const res = await FinanceiroService.getRelatorioServicosCorte(getParams())
    relatorio.value = res?.data ?? res
  } catch (e) {
    notify.error('Erro ao carregar relatório')
    console.error('[Relatório SC] Erro:', e)
  } finally {
    loading.value = false
  }
}

async function exportarPdf() {
  exportandoPdf.value = true
  try {
    const res = await FinanceiroService.getRelatorioServicosCortePdf(getParams())
    const blob = res?.data instanceof Blob ? res.data : res
    const mesStr = String(mes.value).padStart(2, '0')
    await saveBlobNativeOrBrowser(blob, `relatorio-servico-corte-${mesStr}-${ano.value}.pdf`)
    notify.success('PDF exportado com sucesso')
  } catch (e) {
    notify.error('Erro ao exportar PDF')
    console.error('[PDF] Erro:', e)
  } finally {
    exportandoPdf.value = false
  }
}

onMounted(async () => {
  try {
    const res = await FornecedorService.listar()
    const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    fornecedorOptions.value = lista.map((f) => ({
      label: f.nome_fantasia || f.razao_social || String(f.id),
      value: f.id,
    }))
  } catch (e) {
    console.error('Erro ao carregar fornecedores:', e)
  }
  await carregar()
})
</script>

<style scoped>
.rel-sc__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-inline: 1rem;
}

.rel-sc__total-card {
  overflow: hidden;
}

.rel-sc__sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1rem;
}

.rel-sc__section-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft, #64748b);
  margin-bottom: 0.6rem;
}

.rel-sc__bars {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.rel-sc__bar-row {
  display: grid;
  grid-template-columns: 7rem 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
}

.rel-sc__bar-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ds-color-text-soft, #64748b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-sc__bar-track {
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(214, 224, 234, 0.4);
  overflow: hidden;
}

.rel-sc__bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.rel-sc__bar-fill--blue { background: rgba(59, 130, 246, 0.7); }
.rel-sc__bar-fill--green { background: rgba(34, 197, 94, 0.7); }
.rel-sc__bar-fill--amber { background: rgba(245, 158, 11, 0.7); }
.rel-sc__bar-fill--teal { background: rgba(20, 184, 166, 0.7); }
.rel-sc__bar-fill--indigo { background: rgba(99, 102, 241, 0.7); }

.rel-sc__bar-value {
  font-size: 0.7rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text, #1e293b);
  text-align: right;
  min-width: 5rem;
}

.rel-sc__bar-count {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--ds-color-text-faint, #94a3b8);
  min-width: 1.6rem;
  text-align: center;
}

@media (min-width: 768px) {
  .rel-sc__body { padding-inline: 1.5rem; }
}
@media (min-width: 1024px) {
  .rel-sc__body { padding-inline: 2rem; }
}
</style>
