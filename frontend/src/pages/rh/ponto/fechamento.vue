<template>
  <PageShell :padded="false">
    <section class="rh-fechamento ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Fechamento de Folha"
        subtitle="Revise o período, confira os valores por colaborador e gere o fechamento no Financeiro."
        icon="pi pi-wallet"
        :show-back="false"
      />

      <div class="rh-fechamento__body ds-page-context__content">
        <div class="rh-fechamento__filters">
          <div class="rh-fechamento__period">
            <MonthReferenceField
              v-model="mesReferencia"
              class="rh-fechamento__month-wrap"
              label="Mês de referência"
            />
          </div>

          <div class="rh-fechamento__metrics grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
            <div class="rh-fechamento__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Funcionários</p>
              <p class="mt-2 text-lg font-black text-text-main tabular-nums">{{ totalFuncionarios }}</p>
            </div>
            <div class="rh-fechamento__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Com valor devido</p>
              <p class="mt-2 text-lg font-black text-[color:var(--ds-color-primary)] tabular-nums">{{ totalComCusto }}</p>
            </div>
            <div class="rh-fechamento__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Valor total</p>
              <p class="mt-2 text-lg font-black text-text-main tabular-nums">{{ valorTotalCusto }}</p>
            </div>
          </div>
        </div>

        <div v-if="funcionariosSemCarga.length" class="rh-fechamento__warning">
          <p class="text-sm font-semibold flex items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            {{ funcionariosSemCarga.length }} funcionário<span v-if="funcionariosSemCarga.length > 1">s</span> sem carga horária cadastrada
          </p>
          <p class="text-xs mt-1">{{ funcionariosSemCarga.join(', ') }}</p>
          <p class="text-xs mt-2 opacity-90">Cadastre a carga horária em Cadastro de Funcionários para incluir essas pessoas no fechamento.</p>
        </div>

        <div v-if="loading && !linhas.length" class="rh-fechamento__loading py-12 flex items-center justify-center gap-2 text-text-soft">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Carregando fechamento...</span>
        </div>

        <template v-else-if="linhas.length">
          <div class="native-table-flush rh-fechamento__table border-y border-border-ui overflow-hidden">
            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft">Funcionário</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Horas trab.</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Diferença 44h</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Horas obrig.</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Horas extras</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Saldo devedor</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Feriados trab.</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Valor horas</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Adic. 50%</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Feriados R$</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Custo devido</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-center w-32">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in linhas"
                    :key="row.funcionario_id"
                    class="rh-fechamento__row"
                    :class="row.sem_carga ? 'rh-fechamento__row--warning' : ''"
                  >
                    <td class="px-4 py-3 font-semibold text-text-main">
                      {{ row.nome }}
                      <span v-if="row.sem_carga" class="ml-2 text-[10px] font-normal text-amber-700 dark:text-amber-400">(sem carga horária)</span>
                    </td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.horas_trabalhadas_hhmm }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.diferenca_obrigatoria_44h_hhmm || '00:00' }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.horas_obrigatorias_hhmm || '00:00' }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.horas_extras_hhmm }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.saldo_devedor_hhmm }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.feriados_trabalhados_qtd }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ formatarMoeda(row.valor_horas_extras_base) }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ formatarMoeda(row.adicional_hora_extra) }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ formatarMoeda(row.valor_feriados_trabalhados) }}</td>
                    <td class="px-4 py-3 font-bold text-text-main text-right tabular-nums">{{ formatarMoeda(row.custo_devido) }}</td>
                    <td class="px-4 py-3 text-center">
                      <Button
                        v-if="!row.sem_carga && Number(row.custo_devido) > 0"
                        variant="secondary"
                        size="sm"
                        class="!rounded-xl"
                        :loading="pagandoId === row.funcionario_id"
                        :disabled="pagandoId === row.funcionario_id"
                        @click="efetuarPagamento(row)"
                      >
                        <i class="pi pi-wallet mr-2 text-xs"></i>
                        Gerar no Financeiro
                      </Button>
                      <span v-else class="text-[10px] text-text-soft">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <div v-else class="rh-fechamento__empty py-12 text-center">
          <i class="pi pi-wallet text-4xl text-text-soft/70 mb-3 block"></i>
          <p class="text-sm font-medium text-text-main">Nenhum valor encontrado no período.</p>
          <p class="text-xs text-text-soft mt-1">Troque o mês de referência para verificar outro fechamento.</p>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'
import { FinanceiroService, PontoRelatorioService } from '@/services/index'
import { notify } from '@/services/notify'
import { numeroParaMoeda } from '@/utils/number'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'

definePage({ meta: { perm: 'despesas.ver' } })

const loading = ref(false)
const linhas = ref([])
const funcionariosSemCarga = ref([])
const dataIni = ref('')
const dataFim = ref('')
const pagandoId = ref(null)

const totalFuncionarios = computed(() => linhas.value.length)
const totalComCusto = computed(() => linhas.value.filter((row) => Number(row.custo_devido) > 0 && !row.sem_carga).length)
const valorTotalCusto = computed(() => formatarMoeda(linhas.value.reduce((acc, row) => acc + (Number(row.custo_devido) || 0), 0)))
const mesReferencia = computed({
  get: () => String(dataIni.value || primeiroDiaMes()).slice(0, 7),
  set: (valor) => {
    const [anoStr, mesStr] = String(valor || '').split('-')
    const ano = Number(anoStr)
    const mes = Number(mesStr)
    if (!ano || !mes) return
    aplicarMesReferencia(ano, mes - 1)
  },
})

function primeiroDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function formatarMoeda(val) {
  return numeroParaMoeda(Number(val) || 0)
}

function aplicarMesReferencia(ano, mes) {
  dataIni.value = new Date(ano, mes, 1).toISOString().slice(0, 10)
  dataFim.value = new Date(ano, mes + 1, 0).toISOString().slice(0, 10)
  buscar()
}

async function buscar() {
  const ini = dataIni.value || primeiroDiaMes()
  const fim = dataFim.value || ultimoDiaMes()
  if (!ini || !fim) return
  loading.value = true
  linhas.value = []
  funcionariosSemCarga.value = []
  try {
    const { data } = await PontoRelatorioService.fechamentoFolha({
      data_ini: ini,
      data_fim: fim,
      apenas_ativos: true,
    })
    linhas.value = data?.linhas ?? []
    funcionariosSemCarga.value = data?.funcionarios_sem_carga ?? []
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao carregar fechamento.')
    linhas.value = []
    funcionariosSemCarga.value = []
  } finally {
    loading.value = false
  }
}

function refMesAnoFromDataFim() {
  const s = (dataFim.value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date()
    return { ref_mes: d.getMonth() + 1, ref_ano: d.getFullYear() }
  }
  const [y, m] = s.split('-').map(Number)
  return { ref_mes: m, ref_ano: y }
}

async function efetuarPagamento(row) {
  const { ref_mes, ref_ano } = refMesAnoFromDataFim()
  pagandoId.value = row.funcionario_id
  try {
    await FinanceiroService.fecharMesFuncionario({
      funcionario_id: row.funcionario_id,
      mes: ref_mes,
      ano: ref_ano,
      horas_extras_valor: Number(row.custo_devido) || 0,
      observacao: `Fechamento gerado pela tela de RH/Ponto. Valor horas: ${formatarMoeda(row.valor_horas_extras_base)}. Adicional 50%: ${formatarMoeda(row.adicional_hora_extra)}. Feriados: ${formatarMoeda(row.valor_feriados_trabalhados)}. Total do periodo ${dataIni.value || ''} a ${dataFim.value || ''}.`,
    })
    notify.success('Fechamento criado no Financeiro. A conta a pagar do funcionário foi gerada com sucesso.')
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao fechar mês do funcionário.')
  } finally {
    pagandoId.value = null
  }
}

onMounted(() => {
  const d = new Date()
  aplicarMesReferencia(d.getFullYear(), d.getMonth())
})
</script>

<style scoped>
.rh-fechamento__body {
  width: min(100%, 1380px);
  margin: 0 auto;
  padding: 0.85rem 1rem 1.5rem;
}

.rh-fechamento__filters {
  padding: 0 0 1.1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--ds-color-primary) 6%, transparent),
      color-mix(in srgb, var(--ds-color-success) 4%, transparent) 46%,
      transparent 82%
    );
}

.rh-fechamento__period {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rh-fechamento__month-wrap {
  min-width: 0;
  max-width: 320px;
}

.rh-fechamento__month-caption {
  margin-bottom: 0.35rem;
  letter-spacing: 0.14em;
  padding-left: 0.15rem;
}

.rh-fechamento__month-control {
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rh-fechamento__month-nav {
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 12%, var(--ds-color-border) 88%);
  background: transparent;
  color: color-mix(in srgb, var(--ds-color-primary-strong) 86%, var(--ds-color-text) 14%);
  transition: border-color 180ms ease, color 180ms ease, background-color 180ms ease;
}

.rh-fechamento__month-nav:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 24%, var(--ds-color-border) 76%);
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.rh-fechamento__month-label {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border) 82%);
  background: transparent;
  color: var(--ds-color-text);
  text-align: center;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  outline: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rh-fechamento__refresh {
  align-self: end;
}

.rh-fechamento__metrics {
  gap: 0.75rem;
  max-width: 980px;
}

.rh-fechamento__metric {
  padding: 0.95rem 0 0.25rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
}

.rh-fechamento__warning {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem 0;
  border-top: 1px solid rgba(245, 158, 11, 0.35);
  border-bottom: 1px solid rgba(245, 158, 11, 0.25);
  color: rgb(146 64 14);
}

.rh-fechamento__table thead tr {
  background: linear-gradient(90deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface) 92%), color-mix(in srgb, var(--ds-color-page) 70%, transparent));
  border-bottom: 1px solid var(--ds-color-border);
}

.rh-fechamento__row {
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 86%, transparent);
  transition: background-color 180ms ease;
}

.rh-fechamento__row:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 5%, transparent);
}

.rh-fechamento__row--warning {
  background: rgba(245, 158, 11, 0.06);
}

.rh-fechamento__empty,
.rh-fechamento__loading {
  border-top: 1px dashed color-mix(in srgb, var(--ds-color-primary) 16%, var(--ds-color-border) 84%);
  border-bottom: 1px dashed color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
}

.rh-fechamento :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rh-fechamento :deep(.ds-header-block) {
  padding-left: 1rem;
  padding-right: 1rem;
}

.dark .rh-fechamento__filters,
.dark .rh-fechamento__metric,
.dark .rh-fechamento__empty,
.dark .rh-fechamento__loading {
  border-color: color-mix(in srgb, var(--ds-color-primary) 20%, var(--ds-color-border) 80%);
}

.dark .rh-fechamento__filters {
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--ds-color-primary) 12%, transparent),
      color-mix(in srgb, var(--ds-color-success) 8%, transparent) 46%,
      transparent 82%
    );
}

.dark .rh-fechamento__month-nav {
  border-color: color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border) 82%);
  color: rgb(191 219 254);
}

.dark .rh-fechamento__month-label {
  border-bottom-color: rgba(148, 163, 184, 0.18);
  color: rgb(241 245 249);
}

.dark .rh-fechamento__warning {
  color: rgb(253 224 71);
}

.dark .rh-fechamento__row {
  border-bottom-color: color-mix(in srgb, var(--ds-color-border) 76%, transparent);
}

@media (max-width: 767px) {
  .rh-fechamento__month-wrap {
    max-width: 100%;
  }

  .rh-fechamento__month-control {
    gap: 0.5rem;
  }

  .rh-fechamento__month-nav {
    width: 2.25rem;
    height: 2.25rem;
  }

  .rh-fechamento__month-label {
    min-width: 0;
    height: 2.5rem;
    font-size: 0.76rem;
    letter-spacing: 0.1em;
  }

  .rh-fechamento__warning {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
}

@media (min-width: 768px) {
  .rh-fechamento__body {
    padding: 1rem 1.5rem 1.75rem;
  }

  .rh-fechamento :deep(.ds-header-block) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .rh-fechamento__body {
    padding: 1rem 2rem 2rem;
  }

  .rh-fechamento :deep(.ds-header-block) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
