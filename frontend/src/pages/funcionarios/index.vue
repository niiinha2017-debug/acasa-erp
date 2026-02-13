<template>
  <div class="login-font clientes-line-list w-full max-w-[1700px] mx-auto">
    <div class="relative overflow-hidden rounded-3xl border border-border-ui bg-bg-card shadow-2xl">
      <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>

      <PageHeader
        title="Equipe"
        subtitle="Gestão de capital humano e colaboradores"
        icon="pi pi-users"
        :showBack="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar nome, cpf ou cargo..."
              />
            </div>

            <Button
              v-if="can('funcionarios.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="novo"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Colaborador
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4">
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
              <div class="flex justify-end gap-1 items-center">
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
                  @click="reenviarSenhaProvisoria(row)"
                  class="w-7 h-7 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 transition-all flex items-center justify-center border border-yellow-500"
                  title="Reenviar Senha Provisória"
                >
                  <i class="pi pi-envelope text-xs"></i>
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
      </div>
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
const filtro = ref('')
const funcionarios = ref([])
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

async function novo() {
  if (!can('funcionarios.criar')) return notify.error('Acesso negado.')
  router.push('/funcionarios/novo')
}

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

async function reenviarSenhaProvisoria(row) {
  if (!can('funcionarios.editar')) return notify.error('Acesso negado.')

  try {
    await FuncionarioService.renviarSenhaProvisoria(row.id)
    notify.success('Senha provisória reenviada com sucesso.')
  } catch (err) {
    notify.error('Erro ao reenviar senha provisória.')
  }
}

onMounted(carregar)
</script>