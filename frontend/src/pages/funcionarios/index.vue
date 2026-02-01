<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-users text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Equipe</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestão de capital humano</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="BUSCAR NOME, CPF OU CARGO..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>
        
<Button
  v-if="can('funcionarios.criar')"
  variant="primary"
  size="md"
  class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider w-full sm:w-auto"
  @click="novo()"
>

          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Equipe Total</p>
        <p class="text-xl font-black text-slate-800">{{ funcionarios.length }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Ativos</p>
        <p class="text-xl font-black text-emerald-700">{{ funcionariosAtivos }}</p>
      </div>
      
      <div 
        class="p-4 rounded-xl border transition-all flex items-center justify-between"
        :class="selecionados.length > 0 ? 'bg-slate-900 border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-200 shadow-sm'"
      >
        <div>
          <p class="text-[9px] font-black uppercase tracking-[0.15em]" :class="selecionados.length > 0 ? 'text-slate-400' : 'text-slate-400'">Selecionados</p>
          <p class="text-xl font-black" :class="selecionados.length > 0 ? 'text-white' : 'text-slate-800'">{{ selecionados.length }}</p>
        </div>
<button
  v-if="selecionados.length > 0 && can('funcionarios.ver')"
  @click="confirmarGerarPdfFuncionarios"
          class="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-2 hover:brightness-110"
        >
          <i class="pi pi-file-pdf"></i> PDF
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="funcionariosFiltrados"
        :loading="loading"
        empty-text="Nenhum colaborador encontrado."
        :boxed="false"
      >
        <template #cell-nome="{ row }">
          <div class="flex items-center gap-3 py-1">
<CustomCheckbox
  :modelValue="selectedIds.has(row.id)"
  @update:modelValue="toggle(row.id)"
  label=""
  class="scale-90"
/>

            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">{{ row.nome }}</span>
              <span class="text-[10px] font-medium text-slate-500">{{ row.cpf || '000.000.000-00' }}</span>
            </div>
          </div>
        </template>

        <template #cell-cargo="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-700 uppercase">{{ row.cargo }}</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ row.setor }}</span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span 
            class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5"
            :class="String(row.status || '').toUpperCase() === 'ATIVO' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="String(row.status || '').toUpperCase() === 'ATIVO' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
            {{ row.status || 'INATIVO' }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1">
<button
  v-if="can('funcionarios.ver')"
  @click="abrirArquivos(row)"
              class="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center border border-slate-100"
              title="Documentos"
            >
              <i class="pi pi-paperclip text-xs"></i>
            </button>
<button
  v-if="can('funcionarios.editar')"
  @click="editar(row.id)"
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
              title="Editar"
            >
              <i class="pi pi-pencil text-xs"></i>
            </button>
<button
  v-if="can('funcionarios.excluir')"
  @click="confirmarExcluirFuncionario(row)"
              class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
              title="Excluir"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </template>
      </Table>
    </div>
<ArquivosModal
  v-if="arquivosModalOpen && arquivosFuncionario?.id"
  :open="arquivosModalOpen"
  owner-type="FUNCIONARIO"
  :owner-id="arquivosFuncionario.id"
  categoria="ANEXO"
  :can-manage="can('arquivos.criar') || can('arquivos.excluir')"
  @close="fecharArquivos"
/>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { FuncionarioService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'funcionarios.ver' } })


const router = useRouter()
const loading = ref(true)
const gerandoPdf = ref(false)
const filtro = ref('')
const funcionarios = ref([])
const arquivosModalOpen = ref(false)
const arquivosFuncionario = ref(null)
const selectedIds = ref(new Set())

const selecionados = computed(() => Array.from(selectedIds.value))
const funcionariosAtivos = computed(() =>
  funcionarios.value.filter(f => String(f.status || '').toUpperCase() === 'ATIVO').length
)

const columns = [
  { key: 'nome', label: 'FUNCIONÁRIO', width: '40%' },
  { key: 'cargo', label: 'CARGO / SETOR', width: '25%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '20%' }
]

function toggle(id) {
  const set = new Set(selectedIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedIds.value = set
}

const funcionariosFiltrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return funcionarios.value
  return funcionarios.value.filter((f) =>
    String(f.nome || '').toLowerCase().includes(termo) ||
    String(f.cpf || '').includes(termo) ||
    String(f.cargo || '').toLowerCase().includes(termo)
  )
})

function abrirArquivos(row) {
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')
  arquivosFuncionario.value = row
  arquivosModalOpen.value = true
}


function fecharArquivos() {
  arquivosModalOpen.value = false
  arquivosFuncionario.value = null
}

const editar = (id) => {
  if (!can('funcionarios.editar')) return notify.error('Acesso negado.')
  router.push(`/funcionarios/${id}`)
}


async function carregar() {
  loading.value = true
  try {
    const { data } = await FuncionarioService.listar()
    funcionarios.value = (Array.isArray(data) ? data : []).map(f => ({
      ...f,
      cargo: f.cargo ?? f.funcao ?? '',
    }))
  } catch (err) {
    console.error('Erro ao carregar funcionários:', err)
  } finally {
    loading.value = false
  }
}

async function gerarPdf() {
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')
  if (selecionados.value.length === 0) return

  gerandoPdf.value = true
  try {
    // ✅ backend agora retorna { arquivoId }
    const { data } = await api.post('/funcionarios/pdf', { ids: selecionados.value })
    const arquivoId = data?.arquivoId

    if (!arquivoId) {
      notify.error('PDF gerado, mas não retornou arquivoId.')
      return
    }

    // ✅ abre dentro do PWA no viewer que você já tem
    router.push(`/arquivos/${String(arquivoId).replace(/\D/g, '')}`)

    selectedIds.value = new Set()
  } catch (err) {
    notify.error('Erro ao gerar o documento.')
  } finally {
    gerandoPdf.value = false
  }
}


const novo = () => {
  if (!can('funcionarios.criar')) return notify.error('Acesso negado.')
  router.push('/funcionarios/novo')
}


async function confirmarExcluirFuncionario(row) {
  if (!can('funcionarios.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir Funcionário',
    `Deseja remover "${row?.nome}"? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  await excluir(row)
}

async function confirmarGerarPdfFuncionarios() {
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')

  if (selecionados.value.length === 0) return

  const ok = await confirm.show(
    'Gerar PDF',
    `Deseja gerar o PDF com ${selecionados.value.length} funcionário(s) selecionado(s)?`,
  )
  if (!ok) return
  await gerarPdf()
}


async function excluir(row) {
  if (!can('funcionarios.excluir')) return notify.error('Acesso negado.')

  try {
    await FuncionarioService.remover(row.id)
    funcionarios.value = funcionarios.value.filter((f) => f.id !== row.id)

    // remove da seleção também
    const set = new Set(selectedIds.value)
    set.delete(row.id)
    selectedIds.value = set
  } catch (err) {
    alert('Erro ao excluir.')
  }
}


onMounted(carregar)
</script>