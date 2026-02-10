<template>
    <PageHeader
      title="Funcionarios"
      subtitle="Gestao de equipe e cadastro"
      icon="pi pi-users"
      :show-back="false"
      minimal
    >
      <template #actions>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-full sm:w-64">
            <SearchInput
              v-model="filtro"
              placeholder="Buscar nome, CPF ou cargo..."
              :bordered="true"
            />
          </div>
          <Button
            v-if="can('funcionarios.criar')"
            variant="primary"
            class="flex-shrink-0"
            @click="novo()"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Funcionario
          </Button>
        </div>
      </template>
    </PageHeader>

    <div class="page-section overflow-hidden bg-bg-card">
      <Table
        :columns="columns"
        :rows="funcionariosFiltrados"
        :loading="loading"
        :empty-text="filtro ? 'Nenhum funcionario encontrado para sua busca' : 'Nenhum funcionario cadastrado'"
        :boxed="false"
      >
        <template #cell-nome="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">{{ row.nome }}</span>
            <span class="text-[10px] font-medium text-slate-500">
              {{ row.cpf ? maskCPF(row.cpf) : '000.000.000-00' }}
              <span v-if="row.rg" class="ml-2 text-slate-400">RG: {{ maskRG(row.rg) }}</span>
            </span>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FuncionarioService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { onlyNumbers, maskCPF, maskRG } from '@/utils/masks'

// UI Components
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import TableActions from '@/components/ui/TableActions.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'


definePage({ meta: { perm: 'funcionarios.ver' } })

const router = useRouter()
const loading = ref(true)
const filtro = ref('')
const funcionarios = ref([])
const arquivosModalOpen = ref(false)
const arquivosFuncionario = ref(null)

const columns = [
  { key: 'nome', label: 'FUNCIONÁRIO', width: '40%' },
  { key: 'cargo', label: 'CARGO / SETOR', width: '25%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '20%' }
]
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
    notify.success('Funcionário removido.')
  } catch (err) {
    notify.error('Erro ao tentar excluir funcionário.')
  }
}

onMounted(carregar)
</script>
