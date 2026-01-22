<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <i class="pi pi-users text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipe Total</p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-black text-[var(--text-main)]">{{ funcionarios.length }}</p>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Colaboradores</span>
          </div>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <i class="pi pi-user-plus text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativos Agora</p>
          <p class="text-2xl font-black text-emerald-500">{{ funcionariosAtivos }}</p>
        </div>
      </Card>

      <Card 
        :variant="selecionados.length > 0 ? 'dark' : 'default'"
        :active="selecionados.length > 0"
        class="p-6 flex items-center justify-between transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div 
            class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
            :class="selecionados.length > 0 ? 'bg-white/20 text-white' : 'bg-slate-500/10 text-slate-400'"
          >
            <i class="pi pi-file-pdf text-xl"></i>
          </div>
          <div>
            <p 
              class="text-[10px] font-black uppercase tracking-widest"
              :class="selecionados.length > 0 ? 'text-slate-300' : 'text-slate-400'"
            >
              Selecionados
            </p>
            <p 
              class="text-2xl font-black"
              :class="selecionados.length > 0 ? 'text-white' : 'text-[var(--text-main)]'"
            >
              {{ selecionados.length }}
            </p>
          </div>
        </div>

        <button 
          v-if="selecionados.length > 0"
          @click="gerarPdf"
          class="h-10 px-6 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
        >
          <i class="pi pi-download"></i>
          Exportar
        </button>
        <span v-else class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">
          Selecione na lista
        </span>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-id-card text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Gestão de Pessoas</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">RH & Controle de Colaboradores</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-80">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR NOME, CPF OU CARGO..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-[10px] font-black focus:ring-2 focus:ring-brand-primary outline-none transition-all uppercase tracking-widest"
            />
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="router.push('/funcionarios/novo')">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Funcionário
          </Button>
        </div>
      </header>

      <div class="p-4">
<Table
  :columns="columns"
  :rows="funcionariosFiltrados"
  :loading="loading"
  class="!border-none"
>
  <!-- COLUNA NOME + CHECKBOX (seleção pro PDF) -->
<template #cell-nome="{ row }">
  <div class="flex items-center gap-3">
    <CustomCheckbox
      :modelValue="selectedIds.has(row.id)"
      @update:modelValue="() => toggle(row.id)"
      label=""
      :disabled="false"
    />

    <div class="font-black text-[11px] uppercase tracking-widest text-[var(--text-main)]">
      {{ row.nome }}
    </div>
  </div>
</template>


  <!-- STATUS -->
  <template #cell-status="{ row }">
    <span
      class="text-[10px] font-black uppercase tracking-widest"
      :class="String(row.status || '').toUpperCase() === 'ATIVO'
        ? 'text-emerald-600'
        : 'text-slate-500'"
    >
      {{ row.status || '—' }}
    </span>
  </template>

  <!-- AÇÕES -->
  <template #cell-acoes="{ row }">
    <div class="flex items-center justify-center gap-2">
      <button
  type="button"
  class="h-9 px-4 rounded-xl bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
  @click="abrirArquivos(row)"
>
  Arquivos
</button>

      <button
        type="button"
        class="h-9 px-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        @click="router.push(`/funcionarios/${row.id}`)"
      >
        Editar
      </button>

      <button
        type="button"
        class="h-9 px-4 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        @click="excluir(row)"
      >
        Excluir
      </button>
    </div>
  </template>
</Table>
<FuncionarioArquivosModal
  :open="arquivosModalOpen"
  :funcionarioId="arquivosFuncionario?.id"
  :funcionarioNome="arquivosFuncionario?.nome"
  @close="fecharArquivos"
/>

      </div>
    </Card>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { FuncionarioService } from '@/services/index'

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
  { key: 'nome', label: 'Funcionário' },
  { key: 'setor', label: 'Setor' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'status', label: 'Status', align: 'center', width: '120px' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '280px' }

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
  onlyNumbers(String(f.cpf || '')).includes(onlyNumbers(termo)) ||
  String(f.cargo || '').toLowerCase().includes(termo)
)

})

function abrirArquivos(row) {
  arquivosFuncionario.value = row
  arquivosModalOpen.value = true
}

function fecharArquivos() {
  arquivosModalOpen.value = false
  arquivosFuncionario.value = null
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await FuncionarioService.listar()
    funcionarios.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.log('[FUNCIONARIOS][LISTAR] erro =', err)
    alert(err?.response?.data?.message || 'Erro ao carregar funcionários')
    funcionarios.value = []
  } finally {
    loading.value = false
  }
}




async function gerarPdf() {
  if (selecionados.value.length === 0) return

  gerandoPdf.value = true
  try {
    const res = await api.post(
      '/funcionarios/pdf',
      { ids: selecionados.value },
      { responseType: 'blob' }
    )

const blob = new Blob([res.data], { type: 'application/pdf' })
const url = window.URL.createObjectURL(blob)

// 1) abre em nova aba
window.open(url, '_blank')

// 2) faz download com nome bonito
const nomeEmpresa = 'ACASA MOVEIS PLANEJADOS'
const fileName = `${nomeEmpresa} - Lista de Funcionarios.pdf`

const a = document.createElement('a')
a.href = url
a.download = fileName
document.body.appendChild(a)
a.click()
a.remove()

// dá um tempo antes de revogar, pra aba nova não perder o blob
setTimeout(() => window.URL.revokeObjectURL(url), 60_000)



    selectedIds.value = new Set()
  } catch (err) {
    alert('Erro ao gerar o documento.')
  } finally {
    gerandoPdf.value = false
  }
}

async function excluir(row) {
  if (!confirm(`Deseja remover ${row.nome}?`)) return
  try {
    await FuncionarioService.remover(row.id)
    funcionarios.value = funcionarios.value.filter((f) => f.id !== row.id)

    const set = new Set(selectedIds.value)
    set.delete(row.id)
    selectedIds.value = set
  } catch (err) {
    alert('Erro ao excluir.')
  }
}

onMounted(carregar)
</script>
