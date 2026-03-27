<template>
  <PageShell :padded="false">
    <section class="rel-cr ds-page-context animate-page-in">
      <PageHeader
        title="Relatório de Contas a Receber"
        subtitle="Visão analítica consolidada por competência"
        icon="pi pi-file-check"
        variant="minimal"
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
              <label class="ds-field-label text-xs">Cliente</label>
              <select
                v-model="clienteId"
                class="ds-field-line ds-field-line--select h-10 w-[200px] text-sm font-medium"
              >
                <option value="">Todos</option>
                <option v-for="c in clienteOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Forma receb.</label>
              <select
                v-model="formaRecebimento"
                class="ds-field-line ds-field-line--select h-10 w-[150px] text-sm font-medium"
              >
                <option value="">Todas</option>
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="CARTAO">Cartão</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Status</label>
              <select
                v-model="statusFiltro"
                class="ds-field-line ds-field-line--select h-10 w-[140px] text-sm font-medium"
              >
                <option value="">Todos</option>
                <option value="EM_ABERTO">Em aberto</option>
                <option value="VENCIDO">Vencido</option>
                <option value="PAGO">Recebido</option>
                <option value="RECEBIDO">Recebido</option>
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

      <div class="rel-cr__body ds-page-context__content pb-6">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
        </div>

        <template v-else-if="relatorio">
          <!-- Total Geral -->
          <div class="rel-cr__total">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-extrabold uppercase tracking-widest text-text-muted">Total Geral</p>
                <p class="text-2xl font-bold tabular-nums text-text-main mt-1">{{ formatarMoeda(relatorio.totalGeral) }}</p>
              </div>
              <span class="ds-status-pill ds-status-pill--info text-xs px-3">
                {{ relatorio.totalLancamentos }} lançamentos
              </span>
            </div>
          </div>

          <!-- Seções agrupadas -->
          <div class="rel-cr__sections">
            <!-- Por Origem -->
            <div class="rel-cr__section">
              <h4 class="rel-cr__section-title">Por Origem</h4>
                <div class="rel-cr__bars">
                  <div v-for="item in relatorio.porOrigem" :key="item.origem" class="rel-cr__bar-row">
                    <span class="rel-cr__bar-label">{{ origemLabel(item.origem) }}</span>
                    <div class="rel-cr__bar-track">
                      <div class="rel-cr__bar-fill rel-cr__bar-fill--blue" :style="{ width: barPct(item.total) }"></div>
                    </div>
                    <span class="rel-cr__bar-value">{{ formatarMoeda(item.total) }}</span>
                    <span class="rel-cr__bar-count">{{ item.qtd }}</span>
                  </div>
                </div>
            </div>

            <!-- Por Status -->
            <div class="rel-cr__section">
              <h4 class="rel-cr__section-title">Por Status</h4>
                <div class="rel-cr__bars">
                  <div v-for="item in relatorio.porStatus" :key="item.status" class="rel-cr__bar-row">
                    <span class="rel-cr__bar-label">{{ statusLabelFn(item.status) }}</span>
                    <div class="rel-cr__bar-track">
                      <div class="rel-cr__bar-fill" :class="statusBarClass(item.status)" :style="{ width: barPct(item.total) }"></div>
                    </div>
                    <span class="rel-cr__bar-value">{{ formatarMoeda(item.total) }}</span>
                    <span class="rel-cr__bar-count">{{ item.qtd }}</span>
                  </div>
                </div>
            </div>

            <!-- Por Forma de Recebimento -->
            <div class="rel-cr__section">
              <h4 class="rel-cr__section-title">Por Forma de Recebimento</h4>
                <div class="rel-cr__bars">
                  <div v-for="item in relatorio.porFormaRecebimento" :key="item.forma" class="rel-cr__bar-row">
                    <span class="rel-cr__bar-label">{{ item.forma }}</span>
                    <div class="rel-cr__bar-track">
                      <div class="rel-cr__bar-fill rel-cr__bar-fill--teal" :style="{ width: barPct(item.total) }"></div>
                    </div>
                    <span class="rel-cr__bar-value">{{ formatarMoeda(item.total) }}</span>
                    <span class="rel-cr__bar-count">{{ item.qtd }}</span>
                  </div>
                </div>
            </div>

            <!-- Por Cliente -->
            <div class="rel-cr__section">
              <h4 class="rel-cr__section-title">Por Cliente</h4>
                <div class="rel-cr__bars">
                  <div v-for="item in relatorio.porCliente" :key="item.nome" class="rel-cr__bar-row">
                    <span class="rel-cr__bar-label">{{ item.nome }}</span>
                    <div class="rel-cr__bar-track">
                      <div class="rel-cr__bar-fill rel-cr__bar-fill--indigo" :style="{ width: barPct(item.total) }"></div>
                    </div>
                    <span class="rel-cr__bar-value">{{ formatarMoeda(item.total) }}</span>
                    <span class="rel-cr__bar-count">{{ item.qtd }}</span>
                  </div>
                </div>
            </div>
          </div>

          <!-- Tabela de detalhamento -->
          <div class="rel-cr__detail">
            <h4 class="rel-cr__section-title">Detalhamento dos Lançamentos</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[600px]">
                <thead>
                  <tr class="border-b border-border-ui bg-slate-50 dark:bg-slate-800/50">
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Origem</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Vencimento</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Cliente / Titular</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Forma</th>
                    <th class="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                    <th class="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, idx) in relatorio.lancamentos"
                    :key="'rel-' + idx"
                    class="border-b border-border-ui hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td class="py-3 px-4 text-text-main font-medium">{{ origemLabel(row.origem) }}</td>
                    <td class="py-3 px-4 tabular-nums text-text-muted">{{ formatarData(row.vencimento_em) }}</td>
                    <td class="py-3 px-4 text-text-main">{{ row.cliente_nome || 'Não identificado' }}</td>
                    <td class="py-3 px-4">
                      <span
                        v-if="row.forma_recebimento_chave"
                        class="ds-status-pill ds-status-pill--neutral text-[0.6rem] px-2"
                      >
                        {{ row.forma_recebimento_chave }}
                      </span>
                      <span v-else class="text-text-muted">—</span>
                    </td>
                    <td class="py-3 px-4 text-text-muted">{{ statusLabelFn(row.status) }}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-semibold text-text-main">{{ formatarMoeda(row.valor) }}</td>
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
import { FinanceiroService, ClienteService } from '@/services/index'
import { notify } from '@/services/notify'
import { saveBlobNativeOrBrowser } from '@/utils/native-download'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'contas_receber.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '')
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'

const loading = ref(false)
const exportandoPdf = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())
const clienteId = ref('')
const formaRecebimento = ref('')
const statusFiltro = ref('')
const relatorio = ref(null)
const clienteOptions = ref([])

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

function origemLabel(origem) {
  const map = {
    VENDA: 'Venda',
    POS_VENDA: 'Pós-venda',
    IMPORTACAO_LEITURA: 'Importação/Leitura',
    SERVICO_CORTE: 'Serviço de Corte',
  }
  return map[origem] || origem || '—'
}

function statusLabelFn(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'EM_ABERTO') return 'Em aberto'
  if (s === 'PAGO' || s === 'RECEBIDO') return 'Recebido'
  if (s === 'VENCIDO') return 'Vencido'
  if (s === 'COMPENSADO') return 'Compensado'
  if (s === 'CANCELADO') return 'Cancelado'
  if (s === 'PRODUCAO_RECEBIDA') return 'Produção Recebida'
  if (s === 'CORTE') return 'Corte / Usinagem'
  if (s === 'PRODUCAO_FINALIZADA') return 'Produção Finalizada'
  return status || '—'
}

function statusBarClass(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'PAGO' || s === 'RECEBIDO') return 'rel-cr__bar-fill--green'
  if (s === 'VENCIDO') return 'rel-cr__bar-fill--red'
  if (s === 'COMPENSADO') return 'rel-cr__bar-fill--teal'
  return 'rel-cr__bar-fill--amber'
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
    cliente_id: clienteId.value || undefined,
    forma_recebimento: formaRecebimento.value || undefined,
    status: statusFiltro.value || undefined,
  }
}

async function carregar() {
  loading.value = true
  try {
    const res = await FinanceiroService.getRelatorioContasReceber(getParams())
    relatorio.value = res?.data ?? res
  } catch (e) {
    notify.error('Erro ao carregar relatório')
    console.error('[Relatório CR] Erro:', e)
  } finally {
    loading.value = false
  }
}

async function exportarPdf() {
  exportandoPdf.value = true
  try {
    const res = await FinanceiroService.getRelatorioContasReceberPdf(getParams())
    const blob = res?.data instanceof Blob ? res.data : res
    const mesStr = String(mes.value).padStart(2, '0')
    await saveBlobNativeOrBrowser(blob, `relatorio-contas-receber-${mesStr}-${ano.value}.pdf`)
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
    const res = await ClienteService.listar()
    const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    clienteOptions.value = lista.map((c) => ({
      label: c.nome_completo || c.razao_social || String(c.id),
      value: c.id,
    }))
  } catch (e) {
    console.error('Erro ao carregar clientes:', e)
  }
  await carregar()
})
</script>

<style scoped>
.rel-cr__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-inline: 1rem;
}

.rel-cr__total {
  padding-bottom: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border, #e2e8f0) 60%, transparent);
}

.rel-cr__sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1rem;
  padding-top: 0.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border, #e2e8f0) 60%, transparent);
  padding-bottom: 1rem;
}

.rel-cr__detail {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.rel-cr__section-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft, #64748b);
  margin-bottom: 0.6rem;
}

.rel-cr__bars {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.rel-cr__bar-row {
  display: grid;
  grid-template-columns: 7rem 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
}

.rel-cr__bar-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ds-color-text-soft, #64748b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-cr__bar-track {
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(214, 224, 234, 0.4);
  overflow: hidden;
}

.rel-cr__bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.rel-cr__bar-fill--blue { background: rgba(59, 130, 246, 0.7); }
.rel-cr__bar-fill--green { background: rgba(34, 197, 94, 0.7); }
.rel-cr__bar-fill--red { background: rgba(239, 68, 68, 0.7); }
.rel-cr__bar-fill--amber { background: rgba(245, 158, 11, 0.7); }
.rel-cr__bar-fill--teal { background: rgba(20, 184, 166, 0.7); }
.rel-cr__bar-fill--indigo { background: rgba(99, 102, 241, 0.7); }

.rel-cr__bar-value {
  font-size: 0.7rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text, #1e293b);
  text-align: right;
  min-width: 5rem;
}

.rel-cr__bar-count {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--ds-color-text-faint, #94a3b8);
  min-width: 1.6rem;
  text-align: center;
}

@media (min-width: 768px) {
  .rel-cr__body { padding-inline: 1.5rem; }
}
@media (min-width: 1024px) {
  .rel-cr__body { padding-inline: 2rem; }
}
</style>
