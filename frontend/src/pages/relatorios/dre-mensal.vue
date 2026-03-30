<template>
  <PageShell :padded="false">
    <section class="dre-mensal-page ds-page-context animate-page-in">
      <PageHeader
        title="DRE Mensal"
        subtitle="Demonstrativo do resultado por competência"
        icon="pi pi-chart-line"
      >
        <template #actions>
          <div class="flex flex-wrap items-end justify-end gap-3 w-full">
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Mês</label>
              <select
                v-model="mes"
                class="ds-field-line ds-field-line--select h-10 w-[100px] text-sm font-medium"
                @change="carregar"
              >
                <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Ano</label>
              <select
                v-model="ano"
                class="ds-field-line ds-field-line--select h-10 w-[90px] text-sm font-medium"
                @change="carregar"
              >
                <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
        </template>
      </PageHeader>

      <div class="dre-mensal-page__body ds-page-context__content pb-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
        </div>

        <div v-else class="ds-card ds-card--default overflow-hidden native-table-flush">
          <div class="native-table-flush-scroll overflow-x-auto">
          <table class="w-full text-sm min-w-[320px]">
            <tbody>
              <tr class="border-b border-border-ui">
                <td colspan="2" class="py-2 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                  Receita
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 font-medium text-text-main">Receita Bruta</td>
                <td class="py-3 px-4 text-right tabular-nums font-semibold text-text-main">
                  {{ formatarMoeda(dre.receitaBruta) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 text-text-muted">(−) Impostos</td>
                <td class="py-3 px-4 text-right tabular-nums text-text-muted">
                  {{ formatarMoeda(dre.impostos) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td colspan="2" class="py-2 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                  Custo variável
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 text-text-muted">(−) CPV (Materiais)</td>
                <td class="py-3 px-4 text-right tabular-nums text-text-muted">
                  {{ formatarMoeda(dre.cpvMateriais) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 text-text-muted">(−) Custo de Veículos / Rotas</td>
                <td class="py-3 px-4 text-right tabular-nums text-text-muted">
                  {{ formatarMoeda(dre.custoVeiculos) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/30">
                <td class="py-3 px-4 font-medium text-text-main">Margem de Contribuição</td>
                <td class="py-3 px-4 text-right tabular-nums font-semibold text-text-main">
                  {{ formatarMoeda(dre.margemContribuicao) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td colspan="2" class="py-2 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                  Despesas fixas
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 text-text-muted">(−) Despesas Fixas — Salários</td>
                <td class="py-3 px-4 text-right tabular-nums text-text-muted">
                  {{ formatarMoeda(dre.despesasFixasSalarios) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 text-text-muted">(−) Outras Despesas Fixas</td>
                <td class="py-3 px-4 text-right tabular-nums text-text-muted">
                  {{ formatarMoeda(dre.despesasFixasOutras) }}
                </td>
              </tr>
              <tr class="border-b border-border-ui">
                <td class="py-3 px-4 font-medium text-text-muted">Total Despesas Fixas</td>
                <td class="py-3 px-4 text-right tabular-nums font-medium text-text-muted">
                  {{ formatarMoeda(dre.despesasFixasTotal) }}
                </td>
              </tr>
              <tr v-if="dre.absorcaoProjetos != null && dre.absorcaoProjetos > 0" class="border-b border-border-ui bg-amber-50/30 dark:bg-amber-900/10">
                <td class="py-2 px-4 text-xs text-text-muted">
                  Absorção por projetos (horas Totem × taxa) — subdivisão da despesa fixa de salários
                </td>
                <td class="py-2 px-4 text-right tabular-nums text-xs text-text-muted">
                  {{ formatarMoeda(dre.absorcaoProjetos) }}
                </td>
              </tr>
              <tr class="bg-slate-100/60 dark:bg-slate-800/50">
                <td class="py-3 px-4 font-semibold text-text-main">Lucro Líquido</td>
                <td class="py-3 px-4 text-right tabular-nums font-bold" :class="lucroClasse">
                  {{ formatarMoeda(dre.lucroLiquido) }}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FinanceiroService } from '@/services/index'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'relatorios.dre_mensal.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '')
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const loading = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const dre = ref({
  receitaBruta: 0,
  impostos: 0,
  cpvMateriais: 0,
  custoVeiculos: 0,
  cpvTotal: 0,
  despesasFixasSalarios: 0,
  despesasFixasOutras: 0,
  despesasFixasTotal: 0,
  absorcaoProjetos: 0,
  margemContribuicao: 0,
  lucroLiquido: 0,
})

const lucroClasse = computed(() =>
  Number(dre.value.lucroLiquido ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
)

async function carregar() {
  loading.value = true
  try {
    const res = await FinanceiroService.getDreMensal({ mes: mes.value, ano: ano.value })
    const data = res?.data ?? res
    dre.value = {
      receitaBruta: data.receitaBruta ?? 0,
      impostos: data.impostos ?? 0,
      cpvMateriais: data.cpvMateriais ?? 0,
      custoVeiculos: data.custoVeiculos ?? 0,
      cpvTotal: data.cpvTotal ?? 0,
      despesasFixasSalarios: data.despesasFixasSalarios ?? 0,
      despesasFixasOutras: data.despesasFixasOutras ?? 0,
      despesasFixasTotal: data.despesasFixasTotal ?? 0,
      absorcaoProjetos: data.absorcaoProjetos ?? 0,
      margemContribuicao: data.margemContribuicao ?? 0,
      lucroLiquido: data.lucroLiquido ?? 0,
    }
  } catch (e) {
    console.error('Erro ao carregar DRE:', e)
    dre.value = {
      receitaBruta: 0,
      impostos: 0,
      cpvMateriais: 0,
      custoVeiculos: 0,
      cpvTotal: 0,
      despesasFixasSalarios: 0,
      despesasFixasOutras: 0,
      despesasFixasTotal: 0,
      absorcaoProjetos: 0,
      margemContribuicao: 0,
      lucroLiquido: 0,
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
