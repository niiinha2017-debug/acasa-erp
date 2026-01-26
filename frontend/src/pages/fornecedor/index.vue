<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <Card hoverable class="relative overflow-hidden !rounded-[2rem] border-none bg-slate-900 p-7 group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
        <div class="relative z-10 flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-white flex items-center justify-center shadow-2xl">
            <i class="pi pi-truck text-2xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80 mb-1">Total de Parceiros</p>
            <p class="text-3xl font-black text-white leading-none">{{ rows.length }}</p>
          </div>
        </div>
      </Card>

      <Card hoverable class="!rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 p-7 group">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-envelope text-2xl font-bold"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Com E-mail</p>
            <p class="text-3xl font-black text-slate-800 leading-none">{{ rows.filter(r => r.email).length }}</p>
          </div>
        </div>
      </Card>

      <Card hoverable class="!rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 p-7 group">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-map text-2xl font-bold"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estados Atendidos</p>
            <p class="text-3xl font-black text-emerald-600 leading-none">
              {{ new Set(rows.map(r => r.estado).filter(Boolean)).size }}
            </p>
          </div>
        </div>
      </Card>

      <Card hoverable class="!rounded-[2rem] border-amber-100 bg-amber-50/20 shadow-xl shadow-amber-200/20 p-7 group">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <i class="pi pi-star text-2xl" :class="{ 'animate-pulse': rows.length > 0 }"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/70 mb-1">Novos (Mês)</p>
            <p class="text-3xl font-black text-amber-700 leading-none">{{ rows.slice(0, 5).length }}</p>
          </div>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[3rem] overflow-hidden border-none shadow-2xl shadow-slate-200/60 bg-white">
      
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-10 border-b border-slate-50 bg-slate-50/30">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900">
            <i class="pi pi-address-book text-2xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase italic">Fornecedores</h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão de Parceiros Comerciais</p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div class="relative flex-1 min-w-[350px]">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              v-model="busca" 
              type="text" 
              placeholder="Pesquisar por razão, cnpj ou cidade..."
              class="w-full pl-14 pr-6 h-14 bg-white border border-slate-100 rounded-[1.25rem] text-sm font-bold focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all shadow-inner uppercase"
            />
          </div>
          
          <Button 
            variant="primary" 
            class="!h-14 !rounded-[1.25rem] !px-8 shadow-2xl shadow-brand-primary/30 font-black uppercase tracking-widest text-[11px]" 
            @click="router.push('/fornecedor/novo')"
          >
            <i class="pi pi-plus mr-3 text-xs"></i>
            Novo Fornecedor
          </Button>
        </div>
      </header>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum parceiro comercial encontrado."
          class="premium-table"
        >
          <template #cell-razao_social="{ row }">
            <div class="flex flex-col py-2">
              <span class="text-[15px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                {{ row.razao_social }}
              </span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-tighter">
                  {{ row.nome_fantasia || 'NOME FANTASIA NÃO DEFINIDO' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-cnpj="{ row }">
            <div class="flex items-center gap-2">
               <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
               <span class="text-sm font-black text-slate-600 tabular-nums">
                 {{ row.cnpj || '—' }}
               </span>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <div class="flex flex-col">
              <span class="text-[12px] font-bold text-slate-500 italic lowercase">
                {{ row.email || 'sem e-mail' }}
              </span>
              <span class="text-[11px] font-black text-brand-primary uppercase mt-1">
                {{ row.whatsapp || row.telefone || '—' }}
              </span>
            </div>
          </template>

          <template #cell-comercial="{ row }">
            <div class="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
              <span class="text-[10px] font-black text-slate-700 uppercase leading-none mb-2">
                {{ row.forma_pagamento || 'A COMBINAR' }}
              </span>
              <div v-if="row.data_vencimento" class="flex items-center gap-1.5">
                <i class="pi pi-calendar-plus text-[10px] text-amber-500"></i>
                <span class="text-[10px] font-black text-amber-600 uppercase">
                  Vence todo dia {{ row.data_vencimento }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-3">
              <button 
                @click="editar(row.id)"
                class="w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:bg-brand-primary hover:text-white hover:border-brand-primary hover:shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center"
                title="Editar Fornecedor"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button 
                @click="confirmarExclusao(row.id)"
                class="w-11 h-11 rounded-2xl bg-white border border-slate-100 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/30 transition-all flex items-center justify-center"
                title="Excluir Registro"
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

<style scoped>
/* Estilização Premium da Tabela (Igual ao Dashboard Financeiro) */
:deep(.premium-table) {
  border-collapse: separate;
  border-spacing: 0 12px;
}
:deep(.premium-table tr) { background: transparent; transition: all 0.3s ease; }
:deep(.premium-table tr:hover) { transform: scale(1.005); }
:deep(.premium-table th) {
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: #94a3b8;
  padding: 1rem 1.5rem;
  border: none;
}
:deep(.premium-table td) {
  padding: 1.25rem 1.5rem;
  background: white;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}
:deep(.premium-table td:first-child) { border-left: 1px solid #f1f5f9; border-radius: 1.5rem 0 0 1.5rem; }
:deep(.premium-table td:last-child) { border-right: 1px solid #f1f5f9; border-radius: 0 1.5rem 1.5rem 0; }
</style>


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
