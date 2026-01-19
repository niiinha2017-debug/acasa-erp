<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    
    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
        <i class="pi pi-truck text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Parceiros</p>
        <p class="text-xl font-black text-[var(--text-main)]">{{ rows.length }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
        <i class="pi pi-envelope text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-blue-500">Com E-mail</p>
        <p class="text-xl font-black text-[var(--text-main)]">{{ rows.filter(r => r.email).length }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <i class="pi pi-map text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-emerald-500">Estados Atendidos</p>
        <p class="text-xl font-black text-[var(--text-main)]">
          {{ new Set(rows.map(r => r.estado).filter(Boolean)).size }}
        </p>
      </div>
    </Card>

    <Card 
      hoverable 
      :active="rows.slice(0, 5).length > 0"
      class="p-6 flex items-center gap-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
        <i class="pi pi-star text-xl animate-pulse"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-amber-500">Recentes</p>
        <p class="text-xl font-black text-[var(--text-main)]">{{ rows.slice(0, 5).length }}</p>
      </div>
    </Card>

  </div>


    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-address-book text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Fornecedores</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de parceiros e contratos comerciais</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-96">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="busca" 
              type="text" 
              placeholder="BUSCAR POR RAZÃO, CNPJ OU CIDADE..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all uppercase"
            />
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="router.push('/fornecedor/novo')">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Fornecedor
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum fornecedor encontrado no sistema."
          class="!border-none"
        >
          <template #cell-razao_social="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-[14px] font-black text-gray-900 leading-tight uppercase tracking-tight">
                {{ row.razao_social }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {{ row.nome_fantasia || '—' }}
              </span>
            </div>
          </template>

          <template #cell-cnpj="{ row }">
            <span class="text-sm font-black text-slate-700">
              {{ row.cnpj || '—' }}
            </span>
          </template>

          <template #cell-contato="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-[12px] font-bold text-slate-600 leading-tight">
                {{ row.email || '—' }}
              </span>
              <span class="text-[10px] font-black text-brand-primary uppercase mt-1 tracking-tighter">
                {{ row.whatsapp || row.telefone || '—' }}
              </span>
            </div>
          </template>

          <template #cell-comercial="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-[11px] font-black text-slate-700 uppercase">
                {{ row.forma_pagamento || '—' }}
              </span>
              <div v-if="row.data_vencimento" class="flex items-center gap-1 mt-1">
                <i class="pi pi-calendar text-[9px] text-amber-500"></i>
                <span class="text-[10px] font-bold text-slate-400 uppercase">
                  Dia {{ row.data_vencimento }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                @click="editar(row.id)"
                class="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button 
                @click="confirmarExclusao(row.id)"
                class="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

const router = useRouter()

const loading = ref(false)
const busca = ref('')
const rows = ref([])

const columns = [
  { key: 'razao_social', label: 'Fornecedor', width: '40%' },
  { key: 'cnpj', label: 'CNPJ', width: '16%' },
  { key: 'contato', label: 'Contato', width: '24%' },
  { key: 'comercial', label: 'Comercial', width: '14%' },
  { key: 'acoes', label: 'Ações', width: '6%', align: 'right' },
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
  router.push(`/fornecedor/${id}`)
}

async function confirmarExclusao(id) {
  const ok = await confirm.show('Excluir Fornecedor', 'Isso removerá o fornecedor. Deseja continuar?')
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
