<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Comissão de Produção"
        subtitle="Relatório de produção por cliente × ambiente — lucro, custos, etapas e participação da equipe."
        icon="pi pi-percentage"
        variant="minimal"
      >
        <template #actions>
          <div class="flex flex-nowrap items-center justify-end gap-3 min-w-0">
            <div class="flex items-center gap-2 shrink-0">
              <label class="text-xs font-medium text-text-muted">Mês</label>
              <select
                v-model="mes"
                class="h-10 w-[72px] rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-2 pr-2 text-sm text-text-main"
                @change="carregar"
              >
                <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="text-xs font-medium text-text-muted">Ano</label>
              <select
                v-model="ano"
                class="h-10 w-[80px] rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-2 pr-2 text-sm text-text-main"
                @change="carregar"
              >
                <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 md:px-6 pb-5 md:pb-6 pt-4 space-y-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
        </div>

        <template v-else>
          <!-- Cards resumo -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="ds-card ds-card--default p-4">
              <p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Total de Lucro Gerado</p>
              <p class="mt-1 text-xl font-bold tabular-nums text-text-main">
                {{ formatarMoeda(resumo.total_lucro_gerado) }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">Projetos com montagem concluída</p>
            </div>
            <div class="ds-card ds-card--default p-4">
              <p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Total Comissão Disponível</p>
              <p class="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {{ formatarMoeda(resumo.total_comissao_disponivel) }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">50% do lucro para distribuição</p>
            </div>
            <div class="ds-card ds-card--default p-4">
              <p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Total Horas Produção</p>
              <p class="mt-1 text-xl font-bold tabular-nums text-text-main">
                {{ Number(resumo.total_horas_producao ?? 0).toFixed(1) }}h
              </p>
              <p class="text-xs text-text-muted mt-0.5">Horas apontadas nos projetos concluídos</p>
            </div>
          </div>

          <!-- Participação da equipe no fundo de comissão -->
          <div v-if="resumo.participacao_funcionarios?.length" class="ds-card ds-card--default overflow-hidden">
            <div class="px-4 py-3 border-b border-[color:var(--ds-color-border-ui)] bg-[var(--ds-color-surface-muted)]">
              <h2 class="text-sm font-semibold text-text-main">Participação da Equipe no Fundo de Comissão</h2>
              <p class="text-xs text-text-muted mt-0.5">Distribuição proporcional às horas trabalhadas nos projetos com lucro positivo</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[500px]">
                <thead>
                  <tr class="border-b border-[color:var(--ds-color-border-ui)] bg-[var(--ds-color-surface-muted)]">
                    <th class="text-left py-2.5 px-4 font-semibold text-text-muted">Funcionário</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">Horas</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">R$/h</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">Custo</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">Projetos</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">% Cadastrado</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">% Efetivo</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-emerald-700 dark:text-emerald-300">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="f in resumo.participacao_funcionarios"
                    :key="f.funcionario_id"
                    class="border-b border-[color:var(--ds-color-border-ui)] hover:bg-[var(--ds-color-surface-muted)]/60"
                  >
                    <td class="py-2.5 px-4 font-medium text-text-main">{{ f.funcionario_nome }}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-muted">{{ f.horas?.toFixed(1) }}h</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-muted">{{ formatarMoeda(f.custo_hora) }}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-main">{{ formatarMoeda(f.custo) }}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-muted">{{ f.projetos_count }}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-main font-medium">{{ f.percentual_cadastrado?.toFixed(1) ?? '0.0' }}%</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-main">{{ f.percentual_participacao?.toFixed(1) }}%</td>
                    <td class="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ formatarMoeda(f.valor_comissao) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Lista de projetos com drill-down -->
          <div class="ds-card ds-card--default overflow-hidden">
            <div class="px-4 py-3 border-b border-[color:var(--ds-color-border-ui)] bg-[var(--ds-color-surface-muted)]">
              <h2 class="text-sm font-semibold text-text-main">Projetos finalizados — Detalhamento por ambiente</h2>
              <p class="text-xs text-text-muted mt-0.5">Clique num projeto para ver os ambientes, etapas, compras e despesas</p>
            </div>
            <div v-if="resumo.projetos.length === 0" class="p-6 text-center text-text-muted text-sm">
              Nenhum projeto com montagem concluída e lucro positivo neste mês.
            </div>
            <div v-else class="divide-y divide-[color:var(--ds-color-border-ui)]">
              <div v-for="p in resumo.projetos" :key="p.projeto_id">
                <!-- Linha do projeto (clicável) -->
                <button
                  type="button"
                  class="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-[var(--ds-color-surface-muted)]/60 transition-colors"
                  @click="toggleProjeto(p.projeto_id)"
                >
                  <i
                    class="pi text-xs text-text-muted transition-transform"
                    :class="projetoExpandido === p.projeto_id ? 'pi-chevron-down' : 'pi-chevron-right'"
                  />
                  <span class="text-sm font-semibold text-text-main min-w-[90px]">{{ p.codigo }}</span>
                  <span class="text-sm text-text-main flex-1">{{ p.cliente_nome }}</span>
                  <span class="text-sm tabular-nums text-text-main">{{ formatarMoeda(p.lucro_liquido) }}</span>
                  <span class="text-sm tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 min-w-[100px] text-right">
                    {{ formatarMoeda(p.contribuicao_fundo) }}
                  </span>
                </button>

                <!-- Drill-down: ambientes do projeto -->
                <div v-if="projetoExpandido === p.projeto_id" class="bg-slate-50/50 dark:bg-slate-800/20 px-4 pb-4 space-y-4">
                  <div
                    v-for="(amb, idx) in p.ambientes"
                    :key="idx"
                    class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 overflow-hidden"
                  >
                    <div class="px-4 py-2.5 border-b border-border-ui bg-slate-50/80 dark:bg-slate-800/30 flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-text-main">{{ amb.nome_ambiente }}</h4>
                      <span
                        class="text-sm tabular-nums font-bold"
                        :class="amb.lucro_liquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
                      >
                        Lucro: {{ formatarMoeda(amb.lucro_liquido) }}
                      </span>
                    </div>
                    <div class="p-4 space-y-3">
                      <!-- Resumo DRE do ambiente -->
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                        <div><span class="text-text-muted">Contrato:</span> <strong class="tabular-nums">{{ formatarMoeda(amb.valor_contrato) }}</strong></div>
                        <div><span class="text-text-muted">Materiais:</span> <strong class="tabular-nums">{{ formatarMoeda(amb.materiais_diretos) }}</strong></div>
                        <div><span class="text-text-muted">Mão de Obra:</span> <strong class="tabular-nums">{{ formatarMoeda(amb.custo_mao_de_obra) }}</strong></div>
                        <div><span class="text-text-muted">Estrutura:</span> <strong class="tabular-nums">{{ formatarMoeda(amb.custo_estrutura) }}</strong></div>
                        <div><span class="text-text-muted">Rateio Desp.:</span> <strong class="tabular-nums">{{ formatarMoeda(amb.rateio_despesas_fixas) }}</strong></div>
                      </div>

                      <!-- Custo por etapa -->
                      <div v-if="amb.custo_por_etapa?.length" class="pt-2 border-t border-border-ui">
                        <p class="text-xs font-medium text-text-muted mb-1.5">Custo por etapa de produção</p>
                        <div v-for="etapa in amb.custo_por_etapa" :key="etapa.etapa" class="mb-2 last:mb-0">
                          <div class="flex items-center gap-3 mb-1">
                            <span class="text-xs font-semibold text-text-main uppercase tracking-wide">{{ etapa.etapa }}</span>
                            <span class="text-xs text-text-muted tabular-nums">{{ etapa.horas?.toFixed(2) }}h</span>
                            <span class="text-xs text-text-main tabular-nums font-medium">{{ formatarMoeda(etapa.custo) }}</span>
                            <span class="text-[10px] text-text-muted">({{ formatarMoeda(etapa.custo_hora) }}/h)</span>
                          </div>
                          <table v-if="etapa.funcionarios?.length" class="w-full text-xs border border-border-ui rounded overflow-hidden">
                            <thead>
                              <tr class="bg-slate-50 dark:bg-slate-800/50">
                                <th class="text-left py-1 px-2 font-medium text-text-muted">Funcionário</th>
                                <th class="text-right py-1 px-2 font-medium text-text-muted">Horas</th>
                                <th class="text-right py-1 px-2 font-medium text-text-muted">R$/h</th>
                                <th class="text-right py-1 px-2 font-medium text-text-muted">Custo</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="f in etapa.funcionarios" :key="f.funcionario_id" class="border-t border-border-ui">
                                <td class="py-1 px-2 text-text-main">{{ f.funcionario_nome }}</td>
                                <td class="py-1 px-2 text-right tabular-nums text-text-muted">{{ f.horas?.toFixed(2) }}</td>
                                <td class="py-1 px-2 text-right tabular-nums text-text-muted">{{ formatarMoeda(f.custo_hora) }}</td>
                                <td class="py-1 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(f.custo) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- Compras do mês -->
                      <div v-if="amb.detalhamento_compras?.length" class="pt-2 border-t border-border-ui">
                        <p class="text-xs font-medium text-text-muted mb-1.5">Compras (mês)</p>
                        <table class="w-full text-xs border border-border-ui rounded overflow-hidden">
                          <thead>
                            <tr class="bg-slate-50 dark:bg-slate-800/50">
                              <th class="text-left py-1 px-2 font-medium text-text-muted">Fornecedor</th>
                              <th class="text-left py-1 px-2 font-medium text-text-muted">Tipo</th>
                              <th class="text-right py-1 px-2 font-medium text-text-muted">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(c, ci) in amb.detalhamento_compras" :key="ci" class="border-t border-border-ui">
                              <td class="py-1 px-2 text-text-main">{{ c.fornecedor_nome }}</td>
                              <td class="py-1 px-2 text-text-muted">{{ c.tipo_compra }}</td>
                              <td class="py-1 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(c.valor) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- Compras acumuladas do projeto -->
                      <div v-if="amb.compras_acumuladas_projeto?.total > 0" class="pt-2 border-t border-border-ui">
                        <p class="text-xs font-medium text-text-muted mb-1">
                          Compras acumuladas (todo o projeto):
                          <strong class="tabular-nums text-text-main">{{ formatarMoeda(amb.compras_acumuladas_projeto.total) }}</strong>
                        </p>
                      </div>

                      <!-- Despesas rateadas -->
                      <div v-if="amb.detalhamento_despesas?.length" class="pt-2 border-t border-border-ui">
                        <p class="text-xs font-medium text-text-muted mb-1.5">Rateio de despesas por categoria</p>
                        <table class="w-full text-xs border border-border-ui rounded overflow-hidden">
                          <thead>
                            <tr class="bg-slate-50 dark:bg-slate-800/50">
                              <th class="text-left py-1 px-2 font-medium text-text-muted">Categoria</th>
                              <th class="text-right py-1 px-2 font-medium text-text-muted">Valor Rateado</th>
                              <th class="text-right py-1 px-2 font-medium text-text-muted">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(d, di) in amb.detalhamento_despesas" :key="di" class="border-t border-border-ui">
                              <td class="py-1 px-2 text-text-main">{{ d.categoria }}</td>
                              <td class="py-1 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(d.valor_total) }}</td>
                              <td class="py-1 px-2 text-right tabular-nums text-text-muted">{{ d.percentual?.toFixed(1) }}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
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
import { ref, onMounted } from 'vue'
import { ComissaoProducaoService } from '@/services/index'

definePage({ meta: { perm: 'comissao_producao.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '' && Number.isFinite(Number(v)))
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const loading = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())
const projetoExpandido = ref(null)

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const resumo = ref({
  total_lucro_gerado: 0,
  total_comissao_disponivel: 0,
  total_horas_producao: 0,
  projetos: [],
  participacao_funcionarios: [],
})

function toggleProjeto(id) {
  projetoExpandido.value = projetoExpandido.value === id ? null : id
}

async function carregar() {
  loading.value = true
  try {
    const res = await ComissaoProducaoService.getResumo({ mes: mes.value, ano: ano.value })
    const data = res?.data ?? res
    resumo.value = {
      total_lucro_gerado: data?.total_lucro_gerado ?? 0,
      total_comissao_disponivel: data?.total_comissao_disponivel ?? 0,
      total_horas_producao: data?.total_horas_producao ?? 0,
      projetos: Array.isArray(data?.projetos) ? data.projetos : [],
      participacao_funcionarios: Array.isArray(data?.participacao_funcionarios) ? data.participacao_funcionarios : [],
    }
  } catch (e) {
    resumo.value = { total_lucro_gerado: 0, total_comissao_disponivel: 0, total_horas_producao: 0, projetos: [], participacao_funcionarios: [] }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
