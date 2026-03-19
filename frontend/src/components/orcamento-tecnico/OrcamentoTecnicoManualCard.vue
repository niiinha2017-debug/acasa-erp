<template>
  <section class="rounded-xl border border-border-ui bg-white p-4 space-y-4">
    <header class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600">Orcamento Tecnico de Marcenaria</h2>
        <p class="text-xs text-text-soft">Calculo automatico por area + padrao interno/externo + acessorios.</p>
      </div>
      <div class="inline-flex rounded-lg border border-border-ui bg-slate-50 p-1">
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-semibold rounded-md"
          :class="medidaOrigem === 'VENDEDOR' ? 'bg-white shadow text-slate-800' : 'text-slate-500'"
          @click="medidaOrigem = 'VENDEDOR'"
        >
          Medida do Vendedor
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-semibold rounded-md"
          :class="medidaOrigem === 'TECNICA' ? 'bg-white shadow text-slate-800' : 'text-slate-500'"
          @click="medidaOrigem = 'TECNICA'"
        >
          Medida Tecnica (Campo)
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="rounded-lg border border-slate-200 p-3 space-y-2">
        <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Medida do vendedor (mm)</p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-text-soft mb-1">Largura</label>
            <input v-model.number="medidaVendedor.larguraMm" type="number" min="0" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label class="block text-[10px] text-text-soft mb-1">Altura</label>
            <input v-model.number="medidaVendedor.alturaMm" type="number" min="0" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm" />
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2">
        <p class="text-[11px] font-bold uppercase tracking-wider text-blue-600">Medida tecnica (mm)</p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-blue-500 mb-1">Largura</label>
            <input v-model.number="medidaTecnica.larguraMm" type="number" min="0" class="w-full rounded-lg border border-blue-300 px-2 py-1.5 text-sm bg-white" />
          </div>
          <div>
            <label class="block text-[10px] text-blue-500 mb-1">Altura</label>
            <input v-model.number="medidaTecnica.alturaMm" type="number" min="0" class="w-full rounded-lg border border-blue-300 px-2 py-1.5 text-sm bg-white" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estrutura interna</label>
        <select v-model="estruturaInternaCategoria" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm bg-white">
          <option v-for="cat in categorias" :key="`int-${cat.id}`" :value="cat.id">{{ cat.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tamponamento/externo</label>
        <select v-model="externoCategoria" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm bg-white">
          <option v-for="cat in categorias" :key="`ext-${cat.id}`" :value="cat.id">{{ cat.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Markup</label>
        <input v-model.number="markup" type="number" min="0" step="0.01" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Percentual externo da area (%)</label>
        <input v-model.number="percentualExternoArea" type="number" min="0" max="100" step="0.01" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
      </div>
      <div class="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
        <p>
          Base da Estrategia de Precos: <strong>{{ carregandoCategorias ? 'carregando...' : origemCategoriasLabel }}</strong>
        </p>
      </div>
    </div>

    <div class="rounded-lg border border-border-ui overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-border-ui">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Acessorios adicionais</p>
        <button type="button" class="text-xs font-semibold text-brand-primary" @click="adicionarAcessorio">+ Adicionar</button>
      </div>

      <table class="w-full text-sm" v-if="acessorios.length">
        <thead class="bg-white border-b border-border-ui text-xs text-slate-500">
          <tr>
            <th class="px-3 py-2 text-left">Descricao</th>
            <th class="px-3 py-2 text-right">Qtd</th>
            <th class="px-3 py-2 text-right">Valor unitario</th>
            <th class="px-3 py-2 text-right">Total</th>
            <th class="px-3 py-2 text-center w-8">Acao</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-ui">
          <tr v-for="(item, idx) in acessorios" :key="item.id">
            <td class="px-3 py-2"><input v-model="item.descricao" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm" /></td>
            <td class="px-3 py-2"><input v-model.number="item.quantidade" type="number" min="1" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm text-right" /></td>
            <td class="px-3 py-2"><input v-model.number="item.valorUnitario" type="number" min="0" step="0.01" class="w-full rounded-lg border border-border-ui px-2 py-1.5 text-sm text-right" /></td>
            <td class="px-3 py-2 text-right tabular-nums font-semibold">{{ formatCurrency(item.quantidade * item.valorUnitario) }}</td>
            <td class="px-3 py-2 text-center">
              <button type="button" class="text-rose-500" @click="removerAcessorio(idx)"><i class="pi pi-trash text-xs" /></button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="p-3 text-xs text-text-soft">Nenhum acessorio adicionado.</div>
    </div>

    <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
      <div>
        <p class="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">Area total</p>
        <p class="font-black text-emerald-800 tabular-nums">{{ areaTotalM2.toFixed(3) }} m2</p>
      </div>
      <div>
        <p class="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">Interno</p>
        <p class="font-black text-emerald-800 tabular-nums">{{ formatCurrency(custoInterno) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">Externo</p>
        <p class="font-black text-emerald-800 tabular-nums">{{ formatCurrency(custoExterno) }}</p>
        <p class="text-[10px] text-emerald-700 tabular-nums">{{ areaExternoM2.toFixed(3) }} m2</p>
      </div>
      <div>
        <p class="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">Acessorios</p>
        <p class="font-black text-emerald-800 tabular-nums">{{ formatCurrency(totalAcessorios) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">Custo total</p>
        <p class="font-black text-emerald-800 tabular-nums">{{ formatCurrency(custoTotal) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">Preco de venda</p>
        <p class="text-lg font-black text-emerald-700 tabular-nums">{{ formatCurrency(precoVenda) }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { EstrategiaPrecosService } from '@/services'
import { notify } from '@/services/notify'

type MedidaOrigem = 'VENDEDOR' | 'TECNICA'

type CategoriaPreco = {
  id: 'ESSENCIAL' | 'DESIGNER' | 'PREMIUM'
  label: string
  valorM2: number
}

type Acessorio = {
  id: string
  descricao: string
  quantidade: number
  valorUnitario: number
}

const categorias = ref<CategoriaPreco[]>([
  { id: 'ESSENCIAL', label: 'Branco / Essencial', valorM2: 66.9 },
  { id: 'DESIGNER', label: 'Designer', valorM2: 123.54 },
  { id: 'PREMIUM', label: 'Premium', valorM2: 180.0 },
])
const carregandoCategorias = ref(false)
const origemCategoriasLabel = ref('Mock local')

const medidaOrigem = ref<MedidaOrigem>('VENDEDOR')

const medidaVendedor = ref({ larguraMm: 0, alturaMm: 0 })
const medidaTecnica = ref({ larguraMm: 0, alturaMm: 0 })

const estruturaInternaCategoria = ref<CategoriaPreco['id']>('ESSENCIAL')
const externoCategoria = ref<CategoriaPreco['id']>('DESIGNER')

const markup = ref(2.5)
const percentualExternoArea = ref(35)

const acessorios = ref<Acessorio[]>([])

function uid() {
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getCategoria(id: CategoriaPreco['id']) {
  return categorias.value.find((c) => c.id === id) ?? categorias.value[0]
}

const medidaAtiva = computed(() =>
  medidaOrigem.value === 'VENDEDOR' ? medidaVendedor.value : medidaTecnica.value,
)

const areaTotalM2 = computed(() => {
  const larguraMm = Number(medidaAtiva.value.larguraMm || 0)
  const alturaMm = Number(medidaAtiva.value.alturaMm || 0)
  if (larguraMm <= 0 || alturaMm <= 0) return 0
  return (larguraMm * alturaMm) / 1_000_000
})

const custoInterno = computed(() => {
  const interno = getCategoria(estruturaInternaCategoria.value)
  return areaTotalM2.value * Number(interno.valorM2 || 0)
})

const custoExterno = computed(() => {
  const externo = getCategoria(externoCategoria.value)
  return areaExternoM2.value * Number(externo.valorM2 || 0)
})

const areaExternoM2 = computed(() => {
  const pct = Math.min(100, Math.max(0, Number(percentualExternoArea.value || 0)))
  return areaTotalM2.value * (pct / 100)
})

const totalAcessorios = computed(() =>
  acessorios.value.reduce((acc, item) => {
    const qtd = Number(item.quantidade || 0)
    const unit = Number(item.valorUnitario || 0)
    return acc + qtd * unit
  }, 0),
)

const custoTotal = computed(() => {
  return custoInterno.value + custoExterno.value + totalAcessorios.value
})

const precoVenda = computed(() => {
  return custoTotal.value * Number(markup.value || 0)
})

function adicionarAcessorio() {
  acessorios.value.push({
    id: uid(),
    descricao: 'Novo acessorio',
    quantidade: 1,
    valorUnitario: 0,
  })
}

function removerAcessorio(index: number) {
  acessorios.value.splice(index, 1)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function mapCategoriaLabel(category: string) {
  const c = String(category || '').toUpperCase()
  if (c.includes('PRIMARIA')) return 'Branco / Essencial'
  if (c.includes('SECUNDARIA')) return 'Designer'
  if (c.includes('TERCIARIA')) return 'Premium'
  return c || 'Categoria'
}

async function carregarCategoriasDaEstrategia() {
  carregandoCategorias.value = true
  try {
    const { data } = await EstrategiaPrecosService.listarMatriz()
    const rows = Array.isArray(data) ? data : []
    if (!rows.length) {
      origemCategoriasLabel.value = 'Mock local (matriz vazia)'
      return
    }

    const byCategory = new Map<string, any>()
    for (const row of rows) {
      const key = String(row?.category || '').toUpperCase()
      if (!key || byCategory.has(key)) continue
      byCategory.set(key, row)
    }

    const mapped: CategoriaPreco[] = [
      {
        id: 'ESSENCIAL',
        label: mapCategoriaLabel('PRIMARIA'),
        valorM2: Number(byCategory.get('PRIMARIA')?.cost_base || 66.9),
      },
      {
        id: 'DESIGNER',
        label: mapCategoriaLabel('SECUNDARIA'),
        valorM2: Number(byCategory.get('SECUNDARIA')?.cost_base || 123.54),
      },
      {
        id: 'PREMIUM',
        label: mapCategoriaLabel('TERCIARIA'),
        valorM2: Number(byCategory.get('TERCIARIA')?.cost_base || 180.0),
      },
    ]

    categorias.value = mapped
    origemCategoriasLabel.value = 'Matriz Operacional'
  } catch {
    origemCategoriasLabel.value = 'Mock local (falha na API)'
    notify.warning('Nao foi possivel carregar categorias da Estrategia de Precos. Usando valores locais.')
  } finally {
    carregandoCategorias.value = false
  }
}

onMounted(() => {
  carregarCategoriasDaEstrategia()
})
</script>
