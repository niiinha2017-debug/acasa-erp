<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    
    <PageHeader 
      title="Equipe"
      subtitle="Gestão de capital humano e colaboradores"
      icon="pi pi-users"
    >
      <template #actions>
        <Button
          v-if="can('funcionarios.criar')"
          variant="primary"
          @click="novo()"
        >
          <i class="pi pi-plus mr-2"></i>
          Novo Colaborador
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        label="Equipe Total"
        :value="funcionarios.length"
        icon="pi pi-users"
        color="slate"
      />
      
      <MetricCard
        label="Ativos"
        :value="funcionariosAtivos"
        icon="pi pi-check-circle"
        color="emerald"
      />
      
      <div
        class="p-4 rounded-xl border transition-all flex items-center justify-between"
        :class="selecionadosCount > 0 ? 'bg-slate-900 border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-200 shadow-sm'"
      >
        <div>
          <p class="text-[9px] font-black uppercase tracking-[0.15em]" :class="selecionadosCount > 0 ? 'text-slate-400' : 'text-slate-400'">
            Selecionados
          </p>
          <p class="text-xl font-black" :class="selecionadosCount > 0 ? 'text-white' : 'text-slate-800'">
            {{ selecionadosCount }}
          </p>
        </div>

        <button
          v-if="selecionadosCount > 0 && can('funcionarios.ver')"
          @click="confirmarGerarPdfFuncionarios"
          :disabled="gerandoPdf"
          class="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          <i class="pi pi-file-pdf"></i> PDF
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar nome, cpf ou cargo..."
        />
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
                :modelValue="isSelected(row.id)"
                @update:modelValue="toggle(row.id)"
                label=""
                class="scale-90"
              />
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">{{ row.nome }}</span>
                <span class="text-[10px] font-medium text-slate-500">
                  {{ row.cpf ? maskCPF(row.cpf) : '000.000.000-00' }}
                  <span v-if="row.rg" class="ml-2 text-slate-400">RG: {{ maskRG(row.rg) }}</span>
                </span>
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
             <StatusBadge :value="row.status || 'INATIVO'" />
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
              
              <TableActions
                :can-edit="can('funcionarios.editar')"
                :can-delete="can('funcionarios.excluir')"
                @edit="editar(row.id)"
                @delete="confirmarExcluirFuncionario(row)"
              />
             </div>
          </template>
        </Table>
      </div>

      <ArquivosModal
        v-if="arquivosModalOpen && arquivosFuncionario?.id"
        :open="arquivosModalOpen"
        ownerType="FUNCIONARIO"
        :ownerId="arquivosFuncionario.id"
        categoria="ANEXO"
        :canManage="can('arquivos.criar') || can('arquivos.excluir')"
        @close="fecharArquivos"
      />
    </div>
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
import { onlyNumbers, maskCPF, maskRG } from '@/utils/masks'


definePage({ meta: { perm: 'funcionarios.ver' } })

const router = useRouter()
const loading = ref(true)
const gerandoPdf = ref(false)
const filtro = ref('')
const funcionarios = ref([])
const arquivosModalOpen = ref(false)
const arquivosFuncionario = ref(null)

// Reatividade direta no Set é mais performática no Vue 3
const selectedIds = ref(new Set())

const selecionadosCount = computed(() => selectedIds.value.size)

const funcionariosAtivos = computed(() =>
  funcionarios.value.filter(f => String(f.status || '').toUpperCase() === 'ATIVO').length
)

const columns = [
  { key: 'nome', label: 'FUNCIONÁRIO', width: '40%' },
  { key: 'cargo', label: 'CARGO / SETOR', width: '25%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '20%' }
]

// Simplificado: não precisa recriar o Set toda vez
function toggle(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}


function isSelected(id) {
  return selectedIds.value.has(id)
}


const funcionariosFiltrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return funcionarios.value

  const termoDigits = onlyNumbers(termo)

  return funcionarios.value.filter((f) => {
    const nome = String(f.nome || '').toLowerCase()
    const cargo = String(f.cargo || '').toLowerCase()
    const setor = String(f.setor || '').toLowerCase()

    const cpfDigits = onlyNumbers(String(f.cpf || ''))
    const rgDigits = onlyNumbers(String(f.rg || ''))

    const bateTexto =
      nome.includes(termo) ||
      cargo.includes(termo) ||
      setor.includes(termo)

    // se o usuário digitou número, procura no CPF/RG por dígitos
    const bateDocs = termoDigits
      ? (cpfDigits.includes(termoDigits) || rgDigits.includes(termoDigits))
      : false

    return bateTexto || bateDocs
  })
})


async function carregar() {
  loading.value = true
  try {
    const resp = await FuncionarioService.listar()
    const raw =
      (Array.isArray(resp?.data) && resp.data) ||
      (Array.isArray(resp) && resp) ||
      (Array.isArray(resp?.data?.data) && resp.data.data) ||
      (Array.isArray(resp?.data?.items) && resp.data.items) ||
      (Array.isArray(resp?.data?.rows) && resp.data.rows) ||
      []

    funcionarios.value = raw.map(f => ({
      ...f,
      nome: f.nome ?? f.nome_completo ?? '',
      cargo: f.cargo ?? f.funcao ?? '',
      rg: f.rg ?? '',
    }))
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao carregar lista de funcionários.')
  } finally {
    loading.value = false
  }
}


// PDF LOGIC
async function gerarPdf() {
  if (selectedIds.value.size === 0) return
  
  gerandoPdf.value = true
  try {
    const ids = Array.from(selectedIds.value)
    const { data } = await api.post('/funcionarios/pdf', { ids })
    const arquivoId = data?.arquivoId
    
    if (!arquivoId) throw new Error()

    notify.success('PDF gerado com sucesso!')
    router.push(`/arquivos/${String(arquivoId).replace(/\D/g, '')}`)
    selectedIds.value.clear() // Limpa seleção após gerar
  } catch (e) {
    notify.error('Falha ao gerar documento PDF.')
  } finally {
    gerandoPdf.value = false
  }
}

async function confirmarGerarPdfFuncionarios() {
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')
  if (selectedIds.value.size === 0) return

  const ok = await confirm.show(
    'Gerar PDF',
    `Deseja gerar o PDF com ${selectedIds.value.size} funcionário(s) selecionado(s)?`,
  )
  if (ok) await gerarPdf()
}

// ACTIONS
function abrirArquivos(row) {
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')
  arquivosFuncionario.value = row
  arquivosModalOpen.value = true
}

function fecharArquivos() {
  arquivosModalOpen.value = false
  arquivosFuncionario.value = null
}

const novo = () => {
  if (!can('funcionarios.criar')) return notify.error('Acesso negado.')
  router.push('/funcionarios/novo')
}

const editar = (id) => {
  if (!can('funcionarios.editar')) return notify.error('Acesso negado.')
  router.push(`/funcionarios/${id}`)
}

async function confirmarExcluirFuncionario(row) {
  if (!can('funcionarios.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir Funcionário',
    `Deseja remover "${row?.nome}"? Esta ação não pode ser desfeita.`,
  )
  if (ok) await excluir(row)
}

async function excluir(row) {
  try {
    await FuncionarioService.remover(row.id)
    funcionarios.value = funcionarios.value.filter((f) => f.id !== row.id)
    selectedIds.value.delete(row.id)
    notify.success('Funcionário removido.')
  } catch (err) {
    notify.error('Erro ao tentar excluir funcionário.')
  }
}

onMounted(carregar)
</script>
