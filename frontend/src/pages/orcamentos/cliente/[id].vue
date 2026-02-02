<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-6 animate-page-in pb-10">
    
    <header class="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2 pt-4">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200 rotate-3 hover:rotate-0 transition-transform duration-300">
            <i class="pi pi-file-edit text-xl"></i>
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
              Orçamentos
            </h1>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                {{ clienteNome }}
              </span>
              <span v-if="clienteTelefone" class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                • {{ clienteTelefone }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3 w-full md:w-auto">
        <button 
          @click="router.back()"
          class="flex-1 md:flex-none h-11 px-6 rounded-xl border border-slate-200 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
        >
          Voltar
        </button>
        <button
          v-if="can('orcamentos.criar')"
          @click="novoParaCliente"
          class="flex-1 md:flex-none h-11 px-8 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/25 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <i class="pi pi-plus text-[8px]"></i> Novo Orçamento
        </button>
      </div>
    </header>

    <div class="px-2">
      <div class="relative max-w-md group">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-brand-primary transition-colors"></i>
        <input 
          v-model="filtro" 
          type="text" 
          placeholder="Filtrar por ID, data ou valor..."
          class="w-full pl-11 pr-4 h-12 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all uppercase placeholder:text-slate-300"
        />
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden mx-2">
      <Table
        :columns="columns"
        :rows="filtrados"
        :loading="loading"
        :boxed="false"
      >
        <template #cell-id="{ row }">
          <div class="py-2">
            <span class="inline-flex items-center justify-center bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 tracking-tighter">
              #{{ row.id }}
            </span>
          </div>
        </template>
        
        <template #cell-data="{ row }">
          <div class="flex flex-col">
            <span class="text-xs font-black text-slate-700">
              {{ format.date(row.criado_em || row.data) }}
            </span>
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Emissão</span>
          </div>
        </template>

        <template #cell-total="{ row }">
          <div class="flex flex-col items-end pr-4">
            <span class="text-sm font-black text-slate-900 tabular-nums">
              {{ format.currency(row.total_itens || row.valor_total || 0) }}
            </span>
            <span class="text-[9px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 rounded">Valor Final</span>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end items-center gap-2 pr-2">
            <button
              v-if="can('orcamentos.editar')"
              @click="abrir(row.id)"
              class="h-9 px-5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Gerenciar
            </button>

            <div class="h-6 w-px bg-slate-100 mx-1"></div>

            <div class="flex items-center gap-1.5">
              <button
                v-if="can('orcamentos.ver')"
                @click="openArquivos(row.id)"
                class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-brand-primary transition-all"
                title="Arquivos"
              >
                <i class="pi pi-paperclip text-xs"></i>
              </button>

              <button
                v-if="can('orcamentos.ver')"
                @click="abrirPdf(row.id)"
                class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-emerald-500 transition-all"
                title="Imprimir PDF"
              >
                <i class="pi pi-file-pdf text-xs"></i>
              </button>

              <button
                v-if="can('orcamentos.excluir')"
                @click="confirmarExcluirOrcamento(row.id)"
                class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                title="Excluir"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </div>
        </template>

        <template #empty>
          <div class="py-24 flex flex-col items-center justify-center text-center">
            <div class="relative mb-6">
              <div class="absolute inset-0 bg-brand-primary/5 blur-3xl rounded-full"></div>
              <div class="relative w-20 h-20 bg-white border border-slate-100 rounded-3xl shadow-xl flex items-center justify-center rotate-6">
                <i class="pi pi-folder-open text-slate-200 text-4xl"></i>
              </div>
            </div>
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Lista vazia</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase mt-2 max-w-[200px] leading-relaxed">
              Não encontramos orçamentos registrados para este cliente.
            </p>
          </div>
        </template>
      </Table>
    </div>

<ArquivosModal
  v-if="arquivosOpen && orcamentoSelecionado"
  :open="arquivosOpen"
  ownerType="ORCAMENTO"
  :ownerId="orcamentoSelecionado"
  categoria="ANEXO"
  :canManage="can('orcamentos.editar')"
  @close="arquivosOpen = false"
/>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, ClienteService } from '@/services/index' // Adicionei ClientesService como fallback
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'orcamentos.ver' } })

const route = useRoute()
const router = useRouter()

// Estados de UI
const arquivosOpen = ref(false)
const orcamentoSelecionado = ref(null)
const loading = ref(false)
const filtro = ref('')
const rows = ref([])
const dadosClienteExtra = ref(null) // Para quando a lista de orçamentos vier vazia

const clienteId = computed(() => Number(String(route.params.id || '').replace(/\D/g, '')))

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'data', label: 'Data', width: '140px' },
  { key: 'total', label: 'Total', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '220px', align: 'right' }, // Ajustei largura para caber os ícones novos
]

async function carregar() {
  if (!clienteId.value) return
  loading.value = true
  try {
    const [resOrcs, resCliente] = await Promise.allSettled([
      OrcamentosService.listar(),
      ClienteService.buscar(clienteId.value),
    ])

    const all = resOrcs.status === 'fulfilled' ? resOrcs.value.data : []
    rows.value = (Array.isArray(all) ? all : [])
      .filter((o) => Number(o.cliente_id) === clienteId.value)
      .sort((a, b) => {
        const da = new Date(a.criado_em || a.data || 0).getTime()
        const db = new Date(b.criado_em || b.data || 0).getTime()
        return db - da
      })

    if (resCliente.status === 'fulfilled') {
      dadosClienteExtra.value = resCliente.value.data
    }
  } catch (e) {
    console.error('Erro ao carregar orçamentos:', e)
    notify.error('Erro ao sincronizar dados.')
  } finally {
    loading.value = false
  }
}


// Filtro Inteligente
const filtrados = computed(() => {
  const query = filtro.value?.trim().toLowerCase()
  if (!query) return rows.value

  return rows.value.filter((o) => {
    const id = String(o.id || '').toLowerCase()
    const dataFmt = format.date(o.criado_em || o.data || '').toLowerCase()
    const valor = format.currency(o.total_itens || o.valor_total || 0).toLowerCase()
    
    return id.includes(query) || dataFmt.includes(query) || valor.includes(query)
  })
})

// Dados do Header (Computeds com Fallback Seguro)
const clienteNome = computed(() => {
  if (dadosClienteExtra.value) return dadosClienteExtra.value.nome_completo || dadosClienteExtra.value.razao_social
  const o = rows.value?.[0]
  return o?.cliente_nome_snapshot || o?.cliente?.nome_completo || 'CLIENTE'
})

const clienteTelefone = computed(() => {
  const cli = dadosClienteExtra.value || rows.value?.[0]?.cliente || {}
  return cli.whatsapp || cli.telefone || cli.celular || ''
})

// Ações
function abrir(id) {
  if (!can('orcamentos.editar')) return notify.error('Acesso negado.')
  router.push(`/orcamentos/${id}`)
}

function openArquivos(id) {
  orcamentoSelecionado.value = id
  arquivosOpen.value = true
}

async function abrirPdf(id) {
  try {
    const { data } = await OrcamentosService.abrirPdf(id)
    const arquivoId = data?.arquivoId || data?.id
    if (!arquivoId) throw new Error()

    router.push({
      path: `/arquivos/${arquivoId}`,
      query: { name: `ORC_${id}.pdf`, type: 'application/pdf' }
    })
  } catch {
    notify.error('Documento PDF não disponível no momento.')
  }
}

async function confirmarExcluirOrcamento(id) {
  const ok = await confirm.show('Excluir?', `Deseja remover o orçamento #${id}?`)
  if (!ok) return
  
  try {
    await OrcamentosService.remover(id)
    notify.success('Removido com sucesso')
    await carregar()
  } catch {
    notify.error('Erro ao excluir.')
  }
}

function novoParaCliente() {
  router.push({ 
    path: '/orcamentos/novo', 
    query: { cliente_id: clienteId.value } 
  })
}

onMounted(carregar)
</script>
