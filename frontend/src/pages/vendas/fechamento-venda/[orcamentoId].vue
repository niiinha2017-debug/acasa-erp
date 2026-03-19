<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="clienteTitulo"
        subtitle="Fechamento de Venda"
        icon="pi pi-wallet"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Em Negociacao
            </span>
            <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push('/vendas/fechamento')">
              <i class="pi pi-arrow-left mr-2" />
              Voltar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="p-4 md:p-6 border-t border-border-ui bg-bg-page space-y-6">
        <Loading v-if="loading" />

        <template v-else>
          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-4">
            <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Calculadora de Margem</h2>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Preco de Venda (R$)</label>
                <input
                  v-model.number="precoVenda"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Desconto (R$)</label>
                <input
                  v-model.number="desconto"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Impostos (%)</label>
                <input
                  v-model.number="aliquotaImpostos"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Custo Base (R$)</label>
                <input
                  v-model.number="custoBase"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">Custo Total + Impostos</p>
                <p class="text-lg font-black text-slate-900 tabular-nums">{{ formatCurrency(custoMaisImpostos) }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">Preco Liquido (com desconto)</p>
                <p class="text-lg font-black text-slate-900 tabular-nums">{{ formatCurrency(precoLiquido) }}</p>
              </div>
              <div
                class="rounded-lg p-3 border"
                :class="margemPct < 20 ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'"
              >
                <p class="text-xs" :class="margemPct < 20 ? 'text-rose-700' : 'text-emerald-700'">Margem</p>
                <p
                  class="text-lg font-black tabular-nums"
                  :class="margemPct < 20 ? 'text-rose-700' : 'text-emerald-700'"
                >
                  {{ margemPct.toFixed(2) }}%
                </p>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Tabela de Edicao (Itens Extras)</h2>
              <Button variant="secondary" size="sm" class="!rounded-xl" @click="adicionarExtra">
                <i class="pi pi-plus mr-2" />
                Adicionar item extra
              </Button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[860px] text-sm rounded-lg overflow-hidden border border-border-ui">
                <thead class="bg-slate-50 border-b border-border-ui">
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Descricao</th>
                    <th class="px-3 py-2 text-left font-semibold">Tipo</th>
                    <th class="px-3 py-2 text-right font-semibold">Qtd</th>
                    <th class="px-3 py-2 text-right font-semibold">Custo Unit.</th>
                    <th class="px-3 py-2 text-right font-semibold">Venda Unit.</th>
                    <th class="px-3 py-2 text-right font-semibold">Subtotal</th>
                    <th class="px-3 py-2 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-ui bg-white">
                  <tr v-for="(item, idx) in extras" :key="item._key">
                    <td class="px-3 py-2">
                      <input v-model="item.descricao" type="text" class="w-full rounded-lg border border-border-ui px-2 py-1.5" placeholder="Ex: Kit de iluminacao LED" />
                    </td>
                    <td class="px-3 py-2">
                      <select v-model="item.tipo" class="w-full rounded-lg border border-border-ui px-2 py-1.5">
                        <option value="FERRAGEM">Ferragem</option>
                        <option value="CHAPA">Chapa</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.quantidade" type="number" min="1" step="1" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-right" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.custo_unitario" type="number" min="0" step="0.01" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-right" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.venda_unitaria" type="number" min="0" step="0.01" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-right" />
                    </td>
                    <td class="px-3 py-2 text-right font-semibold tabular-nums">{{ formatCurrency(totalLinha(item)) }}</td>
                    <td class="px-3 py-2 text-right">
                      <Button variant="danger" size="sm" class="!rounded-lg" @click="removerExtra(idx)">
                        <i class="pi pi-trash" />
                      </Button>
                    </td>
                  </tr>
                  <tr v-if="extras.length === 0">
                    <td colspan="7" class="px-3 py-6 text-center text-text-soft">Nenhum item extra adicionado.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Lista de Compras</h2>
              <div class="flex items-center gap-2">
                <select v-model.number="planoSelecionadoId" class="rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm min-w-[220px]">
                  <option :value="0">Selecione um plano de corte</option>
                  <option v-for="p in planos" :key="p.id" :value="p.id">Plano #{{ p.id }} · {{ p.fornecedor?.razao_social || 'Fornecedor' }}</option>
                </select>
                <Button variant="primary" size="sm" class="!rounded-xl" :disabled="!itensCompraAgrupados.length" @click="gerarListaCompras">
                  <i class="pi pi-download mr-2" />
                  Gerar Lista de Compras
                </Button>
              </div>
            </div>

            <div class="rounded-lg border border-border-ui overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b border-border-ui">
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Grupo</th>
                    <th class="px-3 py-2 text-left font-semibold">Item</th>
                    <th class="px-3 py-2 text-right font-semibold">Quantidade</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-ui bg-white">
                  <tr v-for="row in itensCompraAgrupados" :key="row.key">
                    <td class="px-3 py-2">{{ row.grupo }}</td>
                    <td class="px-3 py-2">{{ row.item }}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{{ row.quantidade.toFixed(2).replace(/\.00$/, '') }}</td>
                  </tr>
                  <tr v-if="!itensCompraAgrupados.length">
                    <td colspan="3" class="px-3 py-6 text-center text-text-soft">Selecione um plano para ver os agrupamentos de chapas e ferragens.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
            <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Pagamento</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Data da Entrada</label>
                <input v-model="pagamento.data_entrada" type="date" class="w-full rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Link do Comprovante</label>
                <input v-model="pagamento.link_comprovante" type="url" class="w-full rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-sm" placeholder="https://..." />
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, PlanoCorteService } from '@/services'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: ['vendas.fechamento.ver', 'vendas.criar'] } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orcamento = ref(null)
const planos = ref([])
const planoSelecionadoId = ref(0)

const extras = ref([])
const custoBase = ref(0)
const aliquotaImpostos = ref(8)
const desconto = ref(0)
const precoVenda = ref(0)

const pagamento = ref({
  data_entrada: '',
  link_comprovante: '',
})

const orcamentoId = computed(() => Number(String(route.params.orcamentoId || '').replace(/\D/g, '')) || 0)

const clienteTitulo = computed(() => {
  const cli = orcamento.value?.cliente
  const nome = cli?.nome_completo || cli?.razao_social || orcamento.value?.cliente_nome_snapshot || 'Fernanda/Julia'
  return nome
})

const planoSelecionado = computed(() => planos.value.find((p) => Number(p.id) === Number(planoSelecionadoId.value)) || null)

const custoExtras = computed(() => extras.value.reduce((acc, it) => acc + (Number(it.custo_unitario || 0) * Number(it.quantidade || 0)), 0))

const vendaExtras = computed(() => extras.value.reduce((acc, it) => acc + (Number(it.venda_unitaria || 0) * Number(it.quantidade || 0)), 0))

const custoPlano = computed(() => {
  const plano = planoSelecionado.value
  if (!plano) return 0
  return (plano.produtos || []).reduce((acc, p) => acc + Number(p.valor_total || 0), 0)
})

const precoLiquido = computed(() => Math.max(0, Number(precoVenda.value || 0) - Number(desconto.value || 0)))

const custoTotal = computed(() => Number(custoBase.value || 0) + custoPlano.value + custoExtras.value)

const impostosValor = computed(() => precoLiquido.value * (Number(aliquotaImpostos.value || 0) / 100))

const custoMaisImpostos = computed(() => custoTotal.value + impostosValor.value)

const margemPct = computed(() => {
  if (precoLiquido.value <= 0) return 0
  return ((precoLiquido.value - custoMaisImpostos.value) / precoLiquido.value) * 100
})

const itensCompraAgrupados = computed(() => {
  const plano = planoSelecionado.value
  if (!plano) return []

  const map = new Map()
  for (const prod of plano.produtos || []) {
    const item = prod?.item || {}
    const temDimensao = Number(prod?.largura_mm || 0) > 0 && Number(prod?.comprimento_mm || 0) > 0
    const grupo = temDimensao ? 'CHAPAS' : 'FERRAGENS'
    const nomeItem = String(item?.nome_produto || item?.nome || 'Item sem nome')
    const key = `${grupo}::${nomeItem}`
    const quantidade = Number(prod?.quantidade || 0)

    if (!map.has(key)) {
      map.set(key, { key, grupo, item: nomeItem, quantidade: 0 })
    }
    map.get(key).quantidade += quantidade
  }

  for (const ex of extras.value) {
    const grupo = String(ex.tipo || 'OUTRO').toUpperCase() === 'CHAPA' ? 'CHAPAS' : 'FERRAGENS'
    const nomeItem = String(ex.descricao || '').trim()
    if (!nomeItem) continue
    const key = `${grupo}::${nomeItem}`
    const quantidade = Number(ex.quantidade || 0)
    if (!map.has(key)) map.set(key, { key, grupo, item: nomeItem, quantidade: 0 })
    map.get(key).quantidade += quantidade
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.grupo !== b.grupo) return a.grupo.localeCompare(b.grupo)
    return a.item.localeCompare(b.item)
  })
})

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

function totalLinha(item) {
  return Number(item.venda_unitaria || 0) * Number(item.quantidade || 0)
}

function adicionarExtra() {
  extras.value.push({
    _key: `x-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    descricao: '',
    tipo: 'FERRAGEM',
    quantidade: 1,
    custo_unitario: 0,
    venda_unitaria: 0,
  })
}

function removerExtra(idx) {
  extras.value.splice(idx, 1)
}

async function carregar() {
  if (!orcamentoId.value) {
    notify.error('Orcamento invalido para fechamento.')
    router.push('/vendas/fechamento')
    return
  }

  loading.value = true
  try {
    const [resOrc, resPlanos] = await Promise.all([
      OrcamentosService.detalhar(orcamentoId.value),
      PlanoCorteService.listar(),
    ])

    const orc = resOrc?.data ?? resOrc
    orcamento.value = orc || null
    precoVenda.value = Number(orc?.valor_total || orc?.total_itens || 0)

    const listaPlanos = Array.isArray(resPlanos?.data) ? resPlanos.data : []
    planos.value = listaPlanos
    if (listaPlanos.length > 0) planoSelecionadoId.value = Number(listaPlanos[0].id)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao carregar dados de fechamento.')
  } finally {
    loading.value = false
  }
}

async function gerarListaCompras() {
  if (!itensCompraAgrupados.value.length) return

  const linhas = []
  linhas.push(`LISTA DE COMPRAS - ORCAMENTO #${orcamentoId.value}`)
  linhas.push(`CLIENTE: ${clienteTitulo.value}`)
  linhas.push('')

  const grupos = ['CHAPAS', 'FERRAGENS']
  for (const grupo of grupos) {
    const rows = itensCompraAgrupados.value.filter((r) => r.grupo === grupo)
    if (!rows.length) continue
    linhas.push(`${grupo}:`)
    for (const row of rows) {
      linhas.push(`- ${row.item}: ${row.quantidade.toFixed(2).replace(/\.00$/, '')}`)
    }
    linhas.push('')
  }

  const conteudo = linhas.join('\n')

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(conteudo)
    }
  } catch {
    // segue para download mesmo sem copiar
  }

  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lista_compras_orcamento_${orcamentoId.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  notify.success('Lista de compras gerada para envio ao fornecedor.')
}

onMounted(carregar)
</script>