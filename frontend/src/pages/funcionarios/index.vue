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
            <div
              v-if="selectedCount"
              class="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-0 justify-start sm:justify-end"
            >
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {{ selectedCount }} selecionado(s)
              </span>

              <Button
                variant="secondary"
                class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
                :loading="pdfLoading"
                @click="gerarPdfSelecionados"
              >
                <i class="pi pi-file-pdf mr-2"></i>
                Gerar PDF
              </Button>

              <Button
                variant="danger"
                class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
                :loading="bulkDeleting"
                @click="confirmarExcluirSelecionados"
              >
                <i class="pi pi-trash mr-2"></i>
                Excluir
              </Button>
            </div>

            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar nome, cpf, rg, cargo, horario ou salario..."
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

            <template #cell-unidade="{ row }">
              <span class="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                {{ row.unidade || '-' }}
              </span>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="getStatus(row)" />
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

    <ArquivosModal
      v-if="arquivosModalOpen"
      :open="arquivosModalOpen"
      ownerType="FUNCIONARIO"
      :ownerId="arquivosFuncionario?.id"
      :canManage="can('funcionarios.editar')"
      @close="arquivosModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FuncionarioService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { onlyNumbers, maskCPF, maskRG } from '@/utils/masks'
import ArquivosModal from '@/components/modals/ArquivosModal.vue'


definePage({ meta: { perm: 'funcionarios.ver' } })

const router = useRouter()
const loading = ref(true)
const filtro = ref('')
const funcionarios = ref([])
const selectedIds = ref(new Set())
const arquivosModalOpen = ref(false)
const arquivosFuncionario = ref(null)
const pdfLoading = ref(false)
const bulkDeleting = ref(false)

const columns = [

  { key: 'nome', label: 'FUNCIONÁRIO', width: '40%' },
  { key: 'cargo', label: 'CARGO / SETOR', width: '25%' },
  { key: 'unidade', label: 'UNIDADE', width: '15%' },
  { key: 'status', label: 'STATUS', width: '10%' },
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

const selectedCount = computed(() => selectedIds.value.size)

function normUpper(v) {
  return String(v || '').trim().toUpperCase()
}

function getStatus(row) {
  const s = normUpper(row?.status)
  if (s === 'ATIVO' || s === 'INATIVO') return s
  return 'INATIVO'
}

const funcionariosFiltrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  const termoDigits = onlyNumbers(termo)

  return (funcionarios.value || []).filter((f) => {
    if (!termo) return true

    const nome = String(f.nome || '').toLowerCase()
    const cargoTxt = String(f.cargo || '').toLowerCase()
    const setorTxt = String(f.setor || '').toLowerCase()
    const unidadeTxt = String(f.unidade || '').toLowerCase()

    const cpfDigits = onlyNumbers(String(f.cpf || ''))
    const rgDigits = onlyNumbers(String(f.rg || ''))

    const bateTexto =
      nome.includes(termo) ||
      cargoTxt.includes(termo) ||
      setorTxt.includes(termo) ||
      unidadeTxt.includes(termo)

    const bateDocs = termoDigits
      ? (cpfDigits.includes(termoDigits) || rgDigits.includes(termoDigits))
      : false

    const bateHorario = [
      f.horario_entrada_1,
      f.horario_saida_1,
      f.horario_entrada_2,
      f.horario_saida_2,
      f.horario_sabado_entrada_1,
      f.horario_sabado_saida_1,
    ].some((v) => String(v || '').toLowerCase().includes(termo))

    const bateSalario = termoDigits
      ? [
          f.salario_base,
          f.salario_adicional,
          f.custo_hora,
          f.vale,
          f.vale_transporte,
        ].some((v) => onlyNumbers(String(v ?? '')).includes(termoDigits))
      : false

    return bateTexto || bateDocs || bateHorario || bateSalario
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
      setor: f.setor ?? '',
      unidade: f.unidade ?? '',
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
    await FuncionarioService.reenviarSenhaProvisoria(row.id)
    notify.success('Senha provisória reenviada com sucesso.')
  } catch (err) {

    notify.error('Erro ao reenviar senha provisória.')
  }
}

onMounted(carregar)

async function gerarPdfSelecionados() {
  if (!selectedCount.value) return notify.warn('Selecione pelo menos 1 funcionÇ­rio.')
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')

  pdfLoading.value = true
  try {
    const ids = Array.from(selectedIds.value)
    const resp = await FuncionarioService.gerarPdf(ids)
    const data = resp?.data || resp
    const arquivoId = data?.arquivoId || data?.arquivo_id

    if (!arquivoId) {
      notify.error('NÇœo foi possÇðvel gerar o PDF agora.')
      return
    }

    router.push(`/arquivos/pdf/${arquivoId}`)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao gerar PDF.')
  } finally {
    pdfLoading.value = false
  }
}

async function confirmarExcluirSelecionados() {
  if (!selectedCount.value) return notify.warn('Selecione pelo menos 1 funcionÇ­rio.')
  if (!can('funcionarios.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir selecionados',
    `Deseja remover ${selectedCount.value} funcionÇ­rio(s)? Esta aÇõÇœo nÇœo pode ser desfeita.`,
  )
  if (!ok) return

  bulkDeleting.value = true
  try {
    const ids = Array.from(selectedIds.value)
    await Promise.all(ids.map((id) => FuncionarioService.remover(id)))
    funcionarios.value = (funcionarios.value || []).filter((f) => !selectedIds.value.has(f.id))
    selectedIds.value = new Set()
    notify.success('Registros removidos.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao excluir selecionados.')
  } finally {
    bulkDeleting.value = false
  }
}
</script>
