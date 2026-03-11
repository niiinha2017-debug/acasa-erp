<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <div class="flex flex-row flex-nowrap items-center gap-4 px-4 md:px-6 py-4 border-b border-border-ui">
        <h1 class="text-xl font-semibold text-text-main shrink-0 flex items-center gap-2">
          <i class="pi pi-percentage text-text-muted" />
          Comissão de Produção
        </h1>
        <div class="flex flex-1 flex-nowrap items-center justify-end gap-3 min-w-0 ml-auto">
          <div class="flex items-center gap-2 shrink-0">
            <label class="text-xs font-medium text-text-muted">Mês</label>
            <select
              v-model="mes"
              class="h-10 w-[72px] rounded-lg border border-border-ui bg-bg-page pl-2 pr-2 text-sm text-text-main"
              @change="carregar"
            >
              <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <label class="text-xs font-medium text-text-muted">Ano</label>
            <select
              v-model="ano"
              class="h-10 w-[80px] rounded-lg border border-border-ui bg-bg-page pl-2 pr-2 text-sm text-text-main"
              @change="carregar"
            >
              <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 space-y-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
        </div>

        <template v-else>
          <!-- Resumo do mês -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
              <p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Total de Lucro Gerado</p>
              <p class="mt-1 text-xl font-bold tabular-nums text-text-main">
                {{ formatarMoeda(resumo.total_lucro_gerado) }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">Projetos com montagem concluída (lucro líquido após custos)</p>
            </div>
            <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
              <p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Total Comissão Disponível</p>
              <p class="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {{ formatarMoeda(resumo.total_comissao_disponivel) }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">50% do lucro para distribuição à equipe da fábrica</p>
            </div>
          </div>

          <!-- Lista de projetos -->
          <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 overflow-hidden">
            <div class="px-4 py-3 border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/30">
              <h2 class="text-sm font-semibold text-text-main">Projetos finalizados (contribuição ao fundo)</h2>
              <p class="text-xs text-text-muted mt-0.5">Somente projetos com status Montagem Concluída e lucro positivo</p>
            </div>
            <div v-if="resumo.projetos.length === 0" class="p-6 text-center text-text-muted text-sm">
              Nenhum projeto com montagem concluída e lucro positivo neste mês.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm min-w-[400px]">
                <thead>
                  <tr class="border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/30">
                    <th class="text-left py-2.5 px-4 font-semibold text-text-muted">Projeto</th>
                    <th class="text-left py-2.5 px-4 font-semibold text-text-muted">Cliente</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">Lucro Líquido</th>
                    <th class="text-right py-2.5 px-4 font-semibold text-text-muted">Contrib. Fundo (50%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in resumo.projetos"
                    :key="p.projeto_id"
                    class="border-b border-border-ui hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <td class="py-2.5 px-4 font-medium text-text-main">{{ p.codigo }}</td>
                    <td class="py-2.5 px-4 text-text-main">{{ p.cliente_nome }}</td>
                    <td class="py-2.5 px-4 text-right tabular-nums text-text-main">
                      {{ formatarMoeda(p.lucro_liquido) }}
                    </td>
                    <td class="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ formatarMoeda(p.contribuicao_fundo) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ComissaoProducaoService } from '@/services/index'

definePage({ meta: { perm: 'comissao_producao.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '')
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const loading = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const resumo = ref({
  total_lucro_gerado: 0,
  total_comissao_disponivel: 0,
  projetos: [],
})

async function carregar() {
  loading.value = true
  try {
    const res = await ComissaoProducaoService.getResumo({ mes: mes.value, ano: ano.value })
    const data = res?.data ?? res
    resumo.value = {
      total_lucro_gerado: data?.total_lucro_gerado ?? 0,
      total_comissao_disponivel: data?.total_comissao_disponivel ?? 0,
      projetos: Array.isArray(data?.projetos) ? data.projetos : [],
    }
  } catch (e) {
    resumo.value = { total_lucro_gerado: 0, total_comissao_disponivel: 0, projetos: [] }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
