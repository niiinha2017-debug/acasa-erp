<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-truck text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Fornecedores</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestão de parceiros comerciais</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="busca" 
            type="text" 
            placeholder="Buscar por razão, cnpj ou cidade..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>
        
<Button
  v-if="can('fornecedores.criar')"
  variant="primary"
  size="md"
  class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider w-full sm:w-auto"
  @click="router.push('/fornecedor/novo')"
>
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Total Parceiros</p>
        <p class="text-xl font-black text-slate-800">{{ rows.length }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-blue-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">Com E-mail</p>
        <p class="text-xl font-black text-blue-700">{{ rows.filter(r => r.email).length }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Estados Atendidos</p>
        <p class="text-xl font-black text-emerald-700">{{ new Set(rows.map(r => r.estado).filter(Boolean)).size }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-amber-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-amber-600">Novos (Mês)</p>
        <p class="text-xl font-black text-amber-700">{{ rows.slice(0, 5).length }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="rowsFiltrados"
        :loading="loading"
        empty-text="Nenhum parceiro comercial encontrado."
        :boxed="false"
      >
        <template #cell-razao_social="{ row }">
          <div class="py-1">
            <span class="text-sm font-bold text-slate-800 block uppercase tracking-tight">
              {{ row.razao_social }}
            </span>
            <span class="text-[10px] font-medium text-slate-500 uppercase">
              {{ row.nome_fantasia || 'NOME FANTASIA NÃO DEFINIDO' }}
            </span>
          </div>
        </template>

        <template #cell-cnpj="{ row }">
          <span class="text-sm font-medium text-slate-600 tabular-nums">
            {{ row.cnpj || '—' }}
          </span>
        </template>

        <template #cell-contato="{ row }">
          <div class="flex flex-col">
            <span class="text-[11px] font-bold text-slate-500 lowercase">
              {{ row.email || 'sem e-mail' }}
            </span>
            <span class="text-[10px] font-black text-brand-primary uppercase mt-0.5">
              {{ row.whatsapp || row.telefone || '—' }}
            </span>
          </div>
        </template>

        <template #cell-comercial="{ row }">
          <div class="flex flex-col">
            <span class="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-black text-slate-600 uppercase w-fit mb-1">
              {{ row.forma_pagamento || 'A COMBINAR' }}
            </span>
            <div v-if="row.data_vencimento" class="flex items-center gap-1 text-amber-600">
              <i class="pi pi-calendar text-[10px]"></i>
              <span class="text-[9px] font-black uppercase">Dia {{ row.data_vencimento }}</span>
            </div>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1">
<button
  v-if="can('fornecedores.editar')"
  @click="editar(row.id)"
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-pencil text-xs"></i>
            </button>

<button
  v-if="can('fornecedores.excluir')"
  @click="confirmarExclusao(row.id)"
              class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </template>
      </Table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

import { can } from '@/services/permissions'

definePage({ meta: { perm: 'fornecedores.ver' } })


const router = useRouter()
const loading = ref(false)
const busca = ref('')
const rows = ref([])

const columns = [
  { key: 'razao_social', label: 'Fornecedor', width: '35%' },
  { key: 'cnpj', label: 'CNPJ', width: '20%' },
  { key: 'contato', label: 'Contato', width: '25%' },
  { key: 'comercial', label: 'Comercial', width: '15%' },
  { key: 'acoes', label: '', width: '5%', align: 'right' },
]

const rowsFiltrados = computed(() => {
  const q = String(busca.value || '').trim().toLowerCase()
  if (!q) return rows.value

  return rows.value.filter((r) => {
    const alvo = [
      r.razao_social,
      r.nome_fantasia,
      r.cnpj,
      r.email,
      r.telefone,
      r.whatsapp,
      r.cidade,
      r.estado,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return alvo.includes(q)
  })
})

function editar(id) {
  if (!can('fornecedores.editar')) return notify.error('Acesso negado.')
  router.push(`/fornecedor/${id}`)
}



async function confirmarExclusao(id) {
  if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')
  
  const fornecedor = rows.value.find(r => r.id === id)
  const ok = await confirm.show(
    'Excluir Fornecedor',
    `Deseja excluir "${fornecedor?.razao_social || `Fornecedor #${id}`}"? Esta ação é permanente.`
  )
  if (!ok) return

  try {
    await FornecedorService.remover(id)
    rows.value = rows.value.filter((r) => r.id !== id)
    notify.success('Fornecedor removido.')
  } catch (e) {
    notify.error('Erro ao excluir fornecedor.')
  }
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await FornecedorService.listar()
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar fornecedores.')
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>