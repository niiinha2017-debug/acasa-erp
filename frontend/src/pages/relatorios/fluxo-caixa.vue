<template>
  <PageShell :padded="false">
    <section class="fluxo-caixa-page ds-page-context animate-page-in">
      <PageHeader
        title="Fluxo de Caixa"
        subtitle="Entradas × Saídas realizadas e pendentes + meta de vendas"
        icon="pi pi-arrows-h"
      >
        <template #actions>
          <div class="flex flex-wrap items-end justify-end gap-3 w-full">
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Mês de referência</label>
              <select
                v-model="mes"
                class="ds-field-line ds-field-line--select h-10 w-[110px] text-sm font-medium"
              >
                <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Ano</label>
              <select
                v-model="ano"
                class="ds-field-line ds-field-line--select h-10 w-[95px] text-sm font-medium"
              >
                <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <button
              class="ds-btn ds-btn--primary h-10 px-5 shrink-0"
              :disabled="loading"
              @click="carregar"
            >
              <i class="pi pi-search mr-1" />
              Gerar
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
      </div>

      <div v-else-if="dados" class="fluxo-caixa-page__body ds-page-context__content pb-8 space-y-5">

        <!-- ── CARDS RESUMO ───────────────────────────────────────── -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 px-4 pt-4">
          <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
            <span class="text-xs text-text-muted uppercase tracking-wide font-semibold">Entradas realizadas</span>
            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {{ fmt(dados.entradas.realizadas.total) }}
            </span>
            <span class="text-xs text-text-muted">recebimentos do mês</span>
          </div>
          <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
            <span class="text-xs text-text-muted uppercase tracking-wide font-semibold">Saídas realizadas</span>
            <span class="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">
              {{ fmt(dados.saidas.realizadas.total) }}
            </span>
            <span class="text-xs text-text-muted">pagamentos do mês</span>
          </div>
          <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
            <span class="text-xs text-text-muted uppercase tracking-wide font-semibold">Saldo do mês</span>
            <span class="text-xl font-bold tabular-nums" :class="dados.saldo.realizado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
              {{ fmt(dados.saldo.realizado) }}
            </span>
            <span class="text-xs text-text-muted">entradas − saídas realizadas</span>
          </div>
          <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
            <span class="text-xs text-text-muted uppercase tracking-wide font-semibold">Saldo projetado</span>
            <span class="text-xl font-bold tabular-nums" :class="dados.saldo.projetado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
              {{ fmt(dados.saldo.projetado) }}
            </span>
            <span class="text-xs text-text-muted">considerando pendentes</span>
          </div>
        </div>

        <!-- ── META DE VENDAS ────────────────────────────────────── -->
        <div class="mx-4">
          <div
            class="ds-card ds-card--default overflow-hidden"
            :class="dados.meta_vendas.situacao === 'DEFICIT' ? 'border-l-4 border-amber-500' : 'border-l-4 border-emerald-500'"
          >
            <div class="px-5 py-4 border-b border-border-ui">
              <h2 class="text-sm font-semibold text-text-main flex items-center gap-2">
                <i class="pi pi-bullseye text-[var(--ds-color-primary)]" />
                Meta de Vendas — Quanto preciso vender?
              </h2>
            </div>
            <div class="grid grid-cols-2 gap-0 sm:grid-cols-4 divide-x divide-border-ui text-sm">
              <div class="px-5 py-4 flex flex-col gap-1">
                <span class="text-xs text-text-muted uppercase tracking-wide">Total comprometido</span>
                <span class="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {{ fmt(dados.meta_vendas.total_comprometido) }}
                </span>
                <span class="text-xs text-text-muted">saídas realizadas + pendentes</span>
              </div>
              <div class="px-5 py-4 flex flex-col gap-1">
                <span class="text-xs text-text-muted uppercase tracking-wide">Total coberto</span>
                <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {{ fmt(dados.meta_vendas.total_coberto) }}
                </span>
                <span class="text-xs text-text-muted">entradas realizadas + pendentes</span>
              </div>
              <div class="px-5 py-4 flex flex-col gap-1">
                <span class="text-xs text-text-muted uppercase tracking-wide">Déficit a cobrir</span>
                <span
                  class="text-lg font-bold tabular-nums"
                  :class="dados.meta_vendas.deficit_bruto > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'"
                >
                  {{ dados.meta_vendas.deficit_bruto > 0 ? fmt(dados.meta_vendas.deficit_bruto) : '✓ Coberto' }}
                </span>
                <span class="text-xs text-text-muted">comprometido − coberto</span>
              </div>
              <div class="px-5 py-4 flex flex-col gap-1">
                <span class="text-xs text-text-muted uppercase tracking-wide">Vendas necessárias</span>
                <span
                  class="text-lg font-bold tabular-nums"
                  :class="dados.meta_vendas.vendas_necessarias > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400'"
                >
                  {{ dados.meta_vendas.vendas_necessarias > 0 ? fmt(dados.meta_vendas.vendas_necessarias) : '✓ OK' }}
                </span>
                <span class="text-xs text-text-muted">
                  com margem bruta de {{ dados.meta_vendas.margem_bruta_pct }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── ENTRADAS ──────────────────────────────────────────── -->
        <div class="mx-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

          <!-- Entradas Realizadas -->
          <div class="ds-card ds-card--default overflow-hidden">
            <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between">
              <h3 class="text-sm font-semibold text-text-main flex items-center gap-2">
                <i class="pi pi-arrow-down text-emerald-600" />
                Entradas Realizadas
              </h3>
              <span class="text-sm font-bold text-emerald-600 tabular-nums">{{ fmt(dados.entradas.realizadas.total) }}</span>
            </div>

            <!-- Por forma -->
            <div v-if="dados.entradas.realizadas.por_forma.length" class="border-b border-border-ui">
              <div
                v-for="f in dados.entradas.realizadas.por_forma"
                :key="f.forma"
                class="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span class="flex items-center gap-2 text-text-main">
                  <span class="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  {{ f.forma }}
                  <span class="text-xs text-text-muted">({{ f.qtd }})</span>
                </span>
                <span class="tabular-nums font-medium text-emerald-700 dark:text-emerald-300">{{ fmt(f.total) }}</span>
              </div>
            </div>

            <!-- Pendentes -->
            <div class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20">
              <p class="text-xs text-text-muted mb-2 font-semibold uppercase tracking-wide">A receber (pendentes)</p>
              <div class="flex gap-4 text-sm">
                <div class="flex flex-col">
                  <span class="text-text-muted text-xs">Vencido</span>
                  <span class="font-semibold text-red-500 tabular-nums">{{ fmt(dados.entradas.pendentes.vencido) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-text-muted text-xs">A vencer</span>
                  <span class="font-semibold text-amber-500 tabular-nums">{{ fmt(dados.entradas.pendentes.a_vencer) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-text-muted text-xs">Total pendente</span>
                  <span class="font-bold text-text-main tabular-nums">{{ fmt(dados.entradas.pendentes.total) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Saídas Realizadas -->
          <div class="ds-card ds-card--default overflow-hidden">
            <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between">
              <h3 class="text-sm font-semibold text-text-main flex items-center gap-2">
                <i class="pi pi-arrow-up text-red-500" />
                Saídas Realizadas
              </h3>
              <span class="text-sm font-bold text-red-600 tabular-nums">{{ fmt(dados.saidas.realizadas.total) }}</span>
            </div>

            <!-- Por categoria -->
            <div v-if="dados.saidas.realizadas.por_categoria.length" class="border-b border-border-ui max-h-48 overflow-y-auto">
              <div
                v-for="c in dados.saidas.realizadas.por_categoria"
                :key="c.categoria"
                class="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span class="flex items-center gap-2 text-text-main">
                  <span class="inline-block w-2 h-2 rounded-full bg-red-400" />
                  {{ c.categoria }}
                  <span class="text-xs text-text-muted">({{ c.qtd }})</span>
                </span>
                <span class="tabular-nums font-medium text-red-700 dark:text-red-300">{{ fmt(c.total) }}</span>
              </div>
            </div>
            <div v-else class="px-4 py-3 text-sm text-text-muted italic">Nenhuma saída registrada no mês</div>

            <!-- Pendentes -->
            <div class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20">
              <p class="text-xs text-text-muted mb-2 font-semibold uppercase tracking-wide">A pagar (pendentes)</p>
              <div class="flex gap-4 text-sm">
                <div class="flex flex-col">
                  <span class="text-text-muted text-xs">Vencido</span>
                  <span class="font-semibold text-red-500 tabular-nums">{{ fmt(dados.saidas.pendentes.vencido) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-text-muted text-xs">A vencer</span>
                  <span class="font-semibold text-amber-500 tabular-nums">{{ fmt(dados.saidas.pendentes.a_vencer) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-text-muted text-xs">Total pendente</span>
                  <span class="font-bold text-text-main tabular-nums">{{ fmt(dados.saidas.pendentes.total) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── TABELA DE LANÇAMENTOS DETALHADOS ──────────────────── -->
        <div class="mx-4">
          <div class="ds-card ds-card--default overflow-hidden native-table-flush">
            <div class="px-4 py-3 border-b border-border-ui flex items-center gap-3">
              <h3 class="text-sm font-semibold text-text-main flex-1">Lançamentos do mês</h3>
              <div class="flex gap-2">
                <button
                  class="text-xs px-3 py-1 rounded-full border transition-colors shrink-0"
                  :class="tabLancamentos === 'entradas' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border-ui text-text-muted hover:bg-slate-50'"
                  @click="tabLancamentos = 'entradas'"
                >
                  Entradas ({{ dados.entradas.realizadas.itens.length }})
                </button>
                <button
                  class="text-xs px-3 py-1 rounded-full border transition-colors shrink-0"
                  :class="tabLancamentos === 'saidas' ? 'bg-red-600 text-white border-red-600' : 'border-border-ui text-text-muted hover:bg-slate-50'"
                  @click="tabLancamentos = 'saidas'"
                >
                  Saídas ({{ dados.saidas.realizadas.itens.length }})
                </button>
              </div>
            </div>

            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-sm min-w-[500px]">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th class="py-2 px-4 text-left font-semibold">Data</th>
                    <th class="py-2 px-4 text-left font-semibold">Descrição</th>
                    <th class="py-2 px-4 text-left font-semibold">Categoria / Origem</th>
                    <th class="py-2 px-4 text-left font-semibold">Forma</th>
                    <th class="py-2 px-4 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="tabLancamentos === 'entradas'">
                    <tr
                      v-for="item in dados.entradas.realizadas.itens"
                      :key="'e-' + item.id"
                      class="border-t border-border-ui hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td class="py-2.5 px-4 text-text-muted text-xs tabular-nums whitespace-nowrap">
                        {{ item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '—' }}
                      </td>
                      <td class="py-2.5 px-4 text-text-main max-w-[200px] truncate">
                        {{ item.descricao }}
                        <span v-if="item.cliente" class="ml-1 text-xs text-text-muted">({{ item.cliente }})</span>
                      </td>
                      <td class="py-2.5 px-4 text-text-muted text-xs">{{ item.origem_tipo || '—' }}</td>
                      <td class="py-2.5 px-4 text-text-muted text-xs">{{ item.forma }}</td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {{ fmt(item.valor) }}
                      </td>
                    </tr>
                    <tr v-if="!dados.entradas.realizadas.itens.length">
                      <td colspan="5" class="py-6 px-4 text-center text-text-muted italic text-sm">Nenhum recebimento registrado no mês</td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr
                      v-for="item in dados.saidas.realizadas.itens"
                      :key="'s-' + item.id + '-' + item.origem_tipo"
                      class="border-t border-border-ui hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td class="py-2.5 px-4 text-text-muted text-xs tabular-nums whitespace-nowrap">
                        {{ item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '—' }}
                      </td>
                      <td class="py-2.5 px-4 text-text-main max-w-[200px] truncate">
                        {{ item.descricao }}
                        <span v-if="item.fornecedor" class="ml-1 text-xs text-text-muted">({{ item.fornecedor }})</span>
                      </td>
                      <td class="py-2.5 px-4 text-text-muted text-xs">{{ item.categoria }}</td>
                      <td class="py-2.5 px-4 text-text-muted text-xs">{{ item.forma }}</td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {{ fmt(item.valor) }}
                      </td>
                    </tr>
                    <tr v-if="!dados.saidas.realizadas.itens.length">
                      <td colspan="5" class="py-6 px-4 text-center text-text-muted italic text-sm">Nenhum pagamento registrado no mês</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ── PENDENTES POR CATEGORIA ────────────────────────────── -->
        <div v-if="dados.saidas.pendentes.por_categoria.length" class="mx-4">
          <div class="ds-card ds-card--default overflow-hidden">
            <div class="px-4 py-3 border-b border-border-ui">
              <h3 class="text-sm font-semibold text-text-main flex items-center gap-2">
                <i class="pi pi-clock text-amber-500" />
                Saídas pendentes por categoria
                <span class="ml-auto text-sm font-bold text-red-600 tabular-nums">{{ fmt(dados.saidas.pendentes.total) }}</span>
              </h3>
            </div>
            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th class="py-2 px-4 text-left font-semibold">Categoria</th>
                    <th class="py-2 px-4 text-right font-semibold">Qtd</th>
                    <th class="py-2 px-4 text-right font-semibold">Total</th>
                    <th class="py-2 px-4 text-right font-semibold">% do total pendente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="c in dados.saidas.pendentes.por_categoria"
                    :key="c.categoria"
                    class="border-t border-border-ui hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td class="py-2.5 px-4 font-medium text-text-main">{{ c.categoria }}</td>
                    <td class="py-2.5 px-4 text-right text-text-muted">{{ c.qtd }}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">{{ fmt(c.total) }}</td>
                    <td class="py-2.5 px-4 text-right text-text-muted text-xs">
                      {{ dados.saidas.pendentes.total > 0 ? ((c.total / dados.saidas.pendentes.total) * 100).toFixed(1) + '%' : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- Estado vazio -->
      <div v-else-if="!loading" class="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
        <i class="pi pi-arrows-h text-4xl opacity-30" />
        <p class="text-sm">Selecione mês e ano e clique em <strong>Gerar</strong></p>
      </div>

    </section>
  </PageShell>
</template>

<script setup>
import { ref } from 'vue'
import { FinanceiroService } from '@/services/index.js'

definePage({ meta: { title: 'Fluxo de Caixa' } })

const anoAtual = new Date().getFullYear()
const mesAtual = new Date().getMonth() + 1
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const mes = ref(mesAtual)
const ano = ref(anoAtual)
const loading = ref(false)
const dados = ref(null)
const tabLancamentos = ref('entradas')

const LOCALE_BR = { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }
function fmt(v) {
  return Number(v ?? 0).toLocaleString('pt-BR', LOCALE_BR)
}

async function carregar() {
  loading.value = true
  dados.value = null
  try {
    const res = await FinanceiroService.getFluxoCaixa({ mes: mes.value, ano: ano.value })
    dados.value = res?.data ?? res
    tabLancamentos.value = 'entradas'
  } catch (e) {
    console.error('Erro ao carregar fluxo de caixa:', e)
  } finally {
    loading.value = false
  }
}

// Carrega automaticamente ao montar
carregar()
</script>
