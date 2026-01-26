<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
    
    <Card :shadow="true" class="!rounded-[3rem] overflow-hidden border-none shadow-2xl shadow-slate-200/60 bg-white">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-slate-50/50 border-b border-slate-100">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/20">
            <i class="pi pi-file-edit text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-800 uppercase italic">Orçamentos do Cliente</h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px] font-black text-brand-primary uppercase tracking-widest">{{ clienteNome }}</span>
              <span v-if="clienteTelefone" class="text-[10px] font-bold text-slate-400 tracking-widest">— {{ clienteTelefone }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <Button variant="secondary" class="!h-12 !rounded-2xl !px-6 font-black text-[10px] uppercase tracking-widest border-slate-200" @click="router.back()">
            <i class="pi pi-arrow-left mr-2"></i> Voltar
          </Button>

          <Button variant="primary" class="!h-12 !rounded-2xl !px-8 shadow-lg shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest" @click="novoParaCliente">
            <i class="pi pi-plus mr-2"></i> Novo Orçamento
          </Button>
        </div>
      </header>

      <div class="px-10 pt-8">
        <div class="relative w-full md:w-96 group">
          <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-brand-primary transition-colors"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="BUSCAR ORÇAMENTO..."
            class="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 rounded-2xl text-[10px] font-black focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all uppercase tracking-widest"
          />
        </div>
      </div>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="filtrados"
          :loading="loading"
          emptyText="Nenhum orçamento encontrado para este cliente."
          class="!border-none"
        >
          <template #cell-id="{ row }">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span class="text-[11px] font-black text-slate-400 tracking-tighter">#{{ row.id }}</span>
            </div>
          </template>

          <template #cell-total="{ row }">
            <div class="py-1">
              <span class="text-[13px] font-black text-slate-900 tabular-nums tracking-tight">
                {{ format.currency(row.total_itens || 0) }}
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end items-center gap-2">
              <button
                type="button"
                class="h-9 px-4 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-125 transition-all shadow-md shadow-slate-200"
                @click="router.push(`/orcamentos/${row.id}`)"
              >
                Abrir
              </button>

              <button
                type="button"
                title="Arquivos do Orçamento"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                @click="openArquivos(row.id)"
              >
                <i class="pi pi-paperclip text-xs"></i>
              </button>

              <button
                type="button"
                title="Gerar PDF"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                @click="abrirPdf(row.id)"
              >
                <i class="pi pi-file-pdf text-xs"></i>
              </button>

              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all"
                @click="excluir(row.id)"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
  </div>

  <OrcamentoArquivosModal
    :open="arquivosOpen"
    :orcamento-id="orcamentoSelecionado"
    :orcamento-titulo="`ORÇAMENTO #${orcamentoSelecionado || ''}`"
    @close="arquivosOpen = false"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { OrcamentosService } from '@/services/index'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const arquivosOpen = ref(false)
const orcamentoSelecionado = ref(null)

const clienteId = computed(() => Number(String(route.params.id || '').replace(/\D/g, '')))

const loading = ref(false)
const filtro = ref('')
const rows = ref([])

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'total', label: 'Total', width: '160px', align: 'right' },
 { key: 'acoes', label: 'Ações', width: '360px', align: 'right' },

]

async function carregar() {
  loading.value = true
  try {
    const { data } = await OrcamentosService.listar()
    const all = data || []

    rows.value = all
      .filter((o) => Number(o.cliente_id) === Number(clienteId.value))
      .sort((a, b) => {
        const da = new Date(a.criado_em || a.data || 0).getTime()
        const db = new Date(b.criado_em || b.data || 0).getTime()
        return db - da
      })
  } catch (e) {
    console.error('Erro ao carregar orçamentos do cliente:', e)
  } finally {
    loading.value = false
  }
}

function openArquivos(id) {
  orcamentoSelecionado.value = id
  arquivosOpen.value = true
}

const filtrados = computed(() => {
  const f = String(filtro.value || '').trim().toLowerCase()
  if (!f) return rows.value

  // filtra pelo cliente (nome/telefone) — igual ao index
  return rows.value.filter((o) => {
    const cli = o?.cliente || {}
    const nome = String(o?.cliente_nome_snapshot || cli.nome_completo || cli.razao_social || '').toLowerCase()
    const tel = String(cli.whatsapp || cli.telefone || cli.contato || cli.celular || '').toLowerCase()
    return nome.includes(f) || tel.includes(f)
  })
})


function novoParaCliente() {
  router.push({ path: '/orcamentos/novo', query: { cliente_id: String(clienteId.value) } })
}

const clienteNome = computed(() => {
  const o = rows.value?.[0]
  const cli = o?.cliente || {}
  return String(o?.cliente_nome_snapshot || cli.nome_completo || cli.razao_social || 'CLIENTE')
})

const clienteTelefone = computed(() => {
  const o = rows.value?.[0]
  const cli = o?.cliente || {}
  return String(cli.whatsapp || cli.telefone || cli.contato || cli.celular || '')
})


function abrirPdf(id) {
  OrcamentosService.abrirPdf(id)
}

async function excluir(id) {
  await OrcamentosService.remover(id)
  await carregar()
}

onMounted(carregar)
</script>
