<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
          <i class="pi pi-file-edit text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Orçamentos do Cliente</h1>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-brand-primary uppercase tracking-widest">{{ clienteNome }}</span>
            <span v-if="clienteTelefone" class="text-[10px] font-bold text-slate-400 tracking-widest">— {{ clienteTelefone }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button 
          variant="secondary" 
          class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase border-slate-200" 
          @click="router.back()"
        >
          <i class="pi pi-arrow-left mr-2 text-[8px]"></i> Voltar
        </Button>
<Button
  v-if="can('orcamentos.criar')"
  variant="primary"
  class="!h-10 !rounded-xl !px-6 text-[10px] font-black uppercase tracking-widest shadow-sm"
  @click="novoParaCliente"
>
  <i class="pi pi-plus mr-2 text-[8px]"></i> Novo Orçamento
</Button>

      </div>
    </div>

    <div class="flex justify-start px-2">
      <div class="relative w-full sm:w-80 group">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input 
          v-model="filtro" 
          type="text" 
          placeholder="BUSCAR PELO ID OU DATA..."
          class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
        />
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="filtrados"
        :loading="loading"
        emptyText="Nenhum orçamento encontrado para este cliente."
        :boxed="false"
      >
        <template #cell-id="{ row }">
          <div class="flex items-center gap-2">
            <span class="w-1 h-1 rounded-full bg-slate-300"></span>
            <span class="text-xs font-black text-slate-500">#{{ row.id }}</span>
          </div>
        </template>

        <template #cell-total="{ row }">
          <div class="flex flex-col items-end">
            <span class="text-sm font-black text-slate-800 tabular-nums">
              {{ format.currency(row.total_itens || 0) }}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Valor do Projeto</span>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end items-center gap-1.5 px-2">
<button
  v-if="can('orcamentos.editar')"
  class="h-7 px-3 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider hover:bg-brand-primary transition-all"
  @click="abrir(row.id)"
>
  Abrir
</button>


            <div class="flex items-center border-l border-slate-100 ml-1.5 pl-1.5 gap-1.5">
<button
  v-if="can('orcamentos.ver')"
  title="Arquivos"
  class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:text-brand-primary transition-all"
  @click="openArquivos(row.id)"
>
  <i class="pi pi-paperclip text-[10px]"></i>
</button>


<button
  v-if="can('orcamentos.ver')"
  title="PDF"
  class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:text-emerald-500 transition-all"
  @click="abrirPdf(row.id)"
>
  <i class="pi pi-file-pdf text-[10px]"></i>
</button>


<button
  v-if="can('orcamentos.excluir')"
  title="Excluir"
  class="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-400 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all"
  @click="confirmarExcluirOrcamento(row.id)"
>
  <i class="pi pi-trash text-[10px]"></i>
</button>

            </div>
          </div>
        </template>
      </Table>
    </div>
  </div>

<ArquivosModal
  v-if="arquivosOpen && orcamentoSelecionado"
  :open="arquivosOpen"
  owner-type="ORCAMENTO"
  :owner-id="orcamentoSelecionado"
  categoria="ANEXO"
  :can-manage="can('orcamentos.editar')"
  view-perm="orcamentos.ver"
  @close="arquivosOpen = false"
/>

</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService } from '@/services/index'
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'orcamentos.ver' } })


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

function abrir(id) {
  if (!can('orcamentos.editar')) return notify.error('Acesso negado.')
  router.push(`/orcamentos/${id}`)
}


function openArquivos(id) {
  if (!can('orcamentos.ver')) return notify.error('Acesso negado.')
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

// EXCLUIR (com confirmação)
async function confirmarExcluirOrcamento(id) {
  if (!can('orcamentos.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir Orçamento',
    `Deseja excluir o Orçamento #${id}? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  await excluir(id)
}

function novoParaCliente() {
  if (!can('orcamentos.criar')) return notify.error('Acesso negado.')
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
  if (!can('orcamentos.ver')) return notify.error('Acesso negado.')
  OrcamentosService.abrirPdf(id)
}


async function excluir(id) {
  if (!can('orcamentos.excluir')) return notify.error('Acesso negado.')
  await OrcamentosService.remover(id)
  await carregar()
}

onMounted(carregar)
</script>
