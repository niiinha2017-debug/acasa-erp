<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <Card hoverable class="p-6 flex items-center gap-5 bg-white border-none shadow-xl shadow-slate-200/50">
        <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
          <i class="pi pi-users text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipe Total</p>
          <div class="flex items-baseline gap-2">
            <p class="text-3xl font-black text-slate-800 tracking-tighter">{{ funcionarios.length }}</p>
            <span class="text-[9px] font-bold text-slate-400 uppercase italic">Colaboradores</span>
          </div>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 bg-white border-none shadow-xl shadow-slate-200/50">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <i class="pi pi-user-plus text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativos Agora</p>
          <p class="text-3xl font-black text-emerald-600 tracking-tighter">{{ funcionariosAtivos }}</p>
        </div>
      </Card>

      <Card 
        class="p-6 flex items-center justify-between transition-all duration-500 border-none shadow-xl"
        :class="selecionados.length > 0 ? 'bg-slate-900 shadow-slate-400/20' : 'bg-white shadow-slate-200/50'"
      >
        <div class="flex items-center gap-5">
          <div 
            class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
            :class="selecionados.length > 0 ? 'bg-white/10 text-brand-primary' : 'bg-slate-50 text-slate-300 border border-slate-100'"
          >
            <i class="pi pi-file-pdf text-xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest" :class="selecionados.length > 0 ? 'text-slate-400' : 'text-slate-400'">
              Selecionados
            </p>
            <p class="text-3xl font-black tracking-tighter" :class="selecionados.length > 0 ? 'text-white' : 'text-slate-300'">
              {{ selecionados.length }}
            </p>
          </div>
        </div>

        <button 
          v-if="selecionados.length > 0"
          @click="gerarPdf"
          class="h-12 px-6 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-primary/40 flex items-center gap-2"
        >
          <i class="pi pi-download"></i> Exportar PDF
        </button>
        <span v-else class="text-[9px] font-bold text-slate-300 uppercase tracking-tighter italic mr-4">
          Selecione na lista
        </span>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[3rem] overflow-hidden border-none shadow-2xl shadow-slate-200/60 bg-white">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-slate-50/50 border-b border-slate-100">
        <div class="flex items-center gap-5">
          <div class="w-12 h-12 rounded-[1.2rem] bg-slate-800 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-id-card text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-800 uppercase italic">Gestão de Pessoas</h2>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de dados operacional</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full md:w-auto">
          <div class="relative flex-1 md:w-96 group">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-brand-primary transition-colors"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR NOME, CPF OU CARGO..."
              class="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 rounded-[1.2rem] text-[10px] font-black focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all uppercase tracking-widest"
            />
          </div>
          
          <Button variant="primary" class="!h-14 !rounded-[1.2rem] !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest" @click="router.push('/funcionarios/novo')">
            <i class="pi pi-plus mr-3"></i> Novo
          </Button>
        </div>
      </header>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="funcionariosFiltrados"
          :loading="loading"
          class="!border-none"
        >
          <template #cell-nome="{ row }">
            <div class="flex items-center gap-4 py-2">
              <CustomCheckbox
                :modelValue="selectedIds.has(row.id)"
                @update:modelValue="() => toggle(row.id)"
                label=""
                class="scale-110"
              />
              <div>
                <div class="font-black text-[12px] uppercase tracking-tight text-slate-800">
                  {{ row.nome }}
                </div>
                <div class="text-[9px] font-bold text-slate-400 tracking-widest">
                  {{ row.cpf || '000.000.000-00' }}
                </div>
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <div 
              class="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
              :class="String(row.status || '').toUpperCase() === 'ATIVO'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-slate-50 text-slate-400 border-slate-200'"
            >
              <span class="w-1.5 h-1.5 rounded-full mr-2" :class="String(row.status || '').toUpperCase() === 'ATIVO' ? 'bg-emerald-500' : 'bg-slate-300'"></span>
              {{ row.status || 'INATIVO' }}
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                title="Documentos"
                class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100 flex items-center justify-center shadow-sm"
                @click="abrirArquivos(row)"
              >
                <i class="pi pi-paperclip text-xs"></i>
              </button>

              <button
                type="button"
                class="h-10 px-5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all shadow-md shadow-slate-200"
                @click="router.push(`/funcionarios/${row.id}`)"
              >
                Editar
              </button>

              <button
                type="button"
                class="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center"
                @click="excluir(row)"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>

    <FuncionarioArquivosModal
      :open="arquivosModalOpen"
      :funcionarioId="arquivosFuncionario?.id"
      :funcionarioNome="arquivosFuncionario?.nome"
      @close="fecharArquivos"
    />
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
    const lista = Array.isArray(data) ? data : []
    funcionarios.value = lista.map(f => ({
      ...f,
      cargo: f.cargo ?? f.funcao ?? '',
    }))
  } catch (err) {
    console.log('[FUNCIONARIOS][LISTAR] erro =', err)
    alert(err?.response?.data?.message || 'Erro ao carregar funcionários')
    funcionarios.value = []
  } finally {
    loading.value = false
  }
}

function arquivoUrl(arquivo) {
  const url = arquivo?.url || arquivo?.caminho || arquivo?.path || ''
  if (!url) return '#'
  if (/^https?:\/\//i.test(url)) return url
  return url.startsWith('/') ? url : `/${url}`
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
