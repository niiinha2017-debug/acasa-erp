<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Estoque"
        subtitle="Chapas inteiras e retalhos vinculados aos produtos"
        icon="pi pi-box"
      >
        <template #actions>
          <Button variant="secondary" size="sm" @click="carregar">
            <i class="pi pi-refresh mr-2" />
            Atualizar
          </Button>
        </template>
      </PageHeader>

      <div class="p-4 md:p-6 border-t border-border-ui space-y-6">
        <Loading v-if="loading" />

        <template v-else>
          <section class="rounded-xl border border-border-ui bg-white p-4">
            <h2 class="text-xs font-black uppercase tracking-widest text-text-soft mb-3">Resumo em tempo real</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">Chapas disponíveis</p>
                <p class="text-xl font-black text-slate-900">{{ resumo.chapas_disponiveis }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">Registros de chapas reservadas</p>
                <p class="text-xl font-black text-slate-900">{{ resumo.chapas_reservadas_registros }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">Retalhos disponíveis (m²)</p>
                <p class="text-xl font-black text-slate-900">{{ formatDecimal(resumo.retalhos_disponiveis_m2) }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">Retalhos reservados</p>
                <p class="text-xl font-black text-slate-900">{{ resumo.retalhos_reservados_registros }}</p>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Dar Entrada Manual</h2>
              <Button variant="primary" size="sm" :disabled="savingManual" @click="darEntradaManual">
                <i class="pi pi-plus mr-2" />
                Dar Entrada
              </Button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Produto ID</label>
                <input v-model.number="formManual.produto_id" type="number" min="1" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Qtd Chapas</label>
                <input v-model.number="formManual.quantidade_chapas" type="number" min="1" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fornecedor</label>
                <input v-model="formManual.fornecedor_nome" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Lote</label>
                <input v-model="formManual.lote" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Observação</label>
                <input v-model="formManual.observacao" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Dar Entrada por NF</h2>
              <Button variant="secondary" size="sm" :disabled="savingNf" @click="darEntradaNf">
                <i class="pi pi-file-import mr-2" />
                Dar Entrada por NF
              </Button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Número NF</label>
                <input v-model="formNf.numero_nf" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fornecedor</label>
                <input v-model="formNf.fornecedor_nome" type="text" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Produto ID</label>
                <input v-model.number="formNf.item_produto_id" type="number" min="1" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Qtd Chapas</label>
                <input v-model.number="formNf.item_quantidade_chapas" type="number" min="1" class="w-full rounded-xl border border-border-ui px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-border-ui bg-white p-4 space-y-3">
            <h2 class="text-xs font-black uppercase tracking-widest text-text-soft">Disponibilidade por Produto</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm rounded-lg overflow-hidden border border-border-ui">
                <thead class="bg-slate-50 border-b border-border-ui">
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold">Produto ID</th>
                    <th class="px-3 py-2 text-right font-semibold">Chapas disponíveis</th>
                    <th class="px-3 py-2 text-right font-semibold">Retalhos disponíveis (m²)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-ui bg-white">
                  <tr v-for="row in rowsDisponibilidade" :key="row.produto_id">
                    <td class="px-3 py-2">{{ row.produto_id }}</td>
                    <td class="px-3 py-2 text-right">{{ row.chapas_disponiveis }}</td>
                    <td class="px-3 py-2 text-right">{{ formatDecimal(row.retalhos_disponiveis_m2) }}</td>
                  </tr>
                  <tr v-if="rowsDisponibilidade.length === 0">
                    <td colspan="3" class="px-3 py-6 text-center text-text-soft">Sem dados de disponibilidade.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { EstoqueService } from '@/services'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'produtos.ver' } })

const loading = ref(false)
const savingManual = ref(false)
const savingNf = ref(false)

const resumo = ref({
  chapas_disponiveis: 0,
  chapas_reservadas_registros: 0,
  retalhos_disponiveis_m2: 0,
  retalhos_reservados_registros: 0,
})

const porProduto = ref({
  chapas: [],
  retalhos: [],
})

const formManual = ref({
  produto_id: null,
  quantidade_chapas: 1,
  fornecedor_nome: '',
  lote: '',
  observacao: '',
})

const formNf = ref({
  numero_nf: '',
  fornecedor_nome: '',
  item_produto_id: null,
  item_quantidade_chapas: 1,
})

const rowsDisponibilidade = computed(() => {
  const map = new Map()

  for (const c of porProduto.value.chapas || []) {
    map.set(Number(c.produto_id), {
      produto_id: Number(c.produto_id),
      chapas_disponiveis: Number(c.quantidade_disponivel || 0),
      retalhos_disponiveis_m2: 0,
    })
  }

  for (const r of porProduto.value.retalhos || []) {
    const produtoId = Number(r.produto_id)
    if (!map.has(produtoId)) {
      map.set(produtoId, {
        produto_id: produtoId,
        chapas_disponiveis: 0,
        retalhos_disponiveis_m2: 0,
      })
    }
    map.get(produtoId).retalhos_disponiveis_m2 = Number(r.area_disponivel_m2 || 0)
  }

  return Array.from(map.values()).sort((a, b) => a.produto_id - b.produto_id)
})

function formatDecimal(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await EstoqueService.disponibilidade()
    resumo.value = data?.resumo || resumo.value
    porProduto.value = data?.por_produto || porProduto.value
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao carregar disponibilidade de estoque.')
  } finally {
    loading.value = false
  }
}

async function darEntradaManual() {
  savingManual.value = true
  try {
    await EstoqueService.darEntradaManual({ ...formManual.value })
    notify.success('Entrada manual registrada.')
    formManual.value.quantidade_chapas = 1
    await carregar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao dar entrada manual no estoque.')
  } finally {
    savingManual.value = false
  }
}

async function darEntradaNf() {
  savingNf.value = true
  try {
    await EstoqueService.darEntradaNf({
      numero_nf: formNf.value.numero_nf,
      fornecedor_nome: formNf.value.fornecedor_nome,
      itens: [
        {
          produto_id: formNf.value.item_produto_id,
          quantidade_chapas: formNf.value.item_quantidade_chapas,
        },
      ],
    })
    notify.success('Entrada por NF registrada.')
    formNf.value.item_quantidade_chapas = 1
    await carregar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao dar entrada por NF.')
  } finally {
    savingNf.value = false
  }
}

onMounted(carregar)
</script>
