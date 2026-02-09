<template>
  <div class="w-full max-w-[1700px] mx-auto space-y-6">
    
    <PageHeader 
      title="Clientes" 
      subtitle="Base de contatos e gestão estratégica"
      icon="pi pi-users"
    >
      <template #actions>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-full sm:w-64">
            <SearchInput
              v-model="filtro"
              placeholder="Buscar cliente, CPF ou Cidade..."
              :bordered="true"
            />
          </div>
          
          <Button
            v-if="can('clientes.criar')"
            variant="primary"
            class="flex-shrink-0"
            @click="router.push('/clientes/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Cliente
          </Button>
        </div>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        label="Total de Clientes"
        :value="clientes.length"
        icon="pi pi-users"
        color="slate"
      />
      <MetricCard
        label="Clientes Ativos"
        :value="totalAtivos"
        icon="pi pi-check-circle"
        color="emerald"
      />
      <MetricCard
        label="Cidades Atendidas"
        :value="totalCidades"
        icon="pi pi-map"
        color="blue"
      />
    </div>

    <div class="flex items-center justify-between px-1">
      <CustomCheckbox 
        v-model="mostrarInativos" 
        label="Mostrar registros inativos" 
      />
      
      <Button 
        variant="ghost" 
        size="sm"
        @click="exportarClientes"
        class="text-slate-500 hover:text-brand-primary"
      >
        <i class="pi pi-download mr-2 text-xs"></i>
        Exportar CSV
      </Button>
    </div>

    <Table
      :columns="columns"
      :rows="clientesFiltrados"
      :loading="carregando"
      :empty-text="filtro ? 'Nenhum cliente encontrado para sua busca' : 'Nenhum cliente cadastrado'"
    >
      <template #cell-cliente="{ row }">
        <div class="flex items-center gap-3 py-0.5">
          <div class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
            {{ (row.nome_completo || row.razao_social || '?').substring(0,2).toUpperCase() }}
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ row.nome_completo || row.razao_social }}
            </span>
            <span class="text-xs font-normal text-slate-500 truncate mt-0.5">
              {{ row.cpf || row.cnpj || 'Sem documento' }}
            </span>
          </div>
        </div>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge
          v-if="row.pipeline_status"
          :value="getPipelineLabel(row.pipeline_status)"
          :color="getPipelineColor(row.pipeline_status)"
        />
        <span v-else class="text-xs text-slate-400 italic">Sem status</span>
      </template>

      <template #cell-localizacao="{ row }">
        <div class="flex flex-col">
          <span class="text-sm text-slate-700 dark:text-slate-300">{{ row.cidade || '—' }}</span>
          <span class="text-xs text-slate-400 font-medium">
            {{ row.estado || '—' }}
          </span>
        </div>
      </template>

      <template #cell-acoes="{ row }">
        <TableActions
          :id="row.id"
          perm-edit="clientes.editar"
          perm-delete="clientes.excluir"
          @edit="editarCliente"
          @delete="excluirCliente"
        >
          <Button
            v-if="can('clientes.ver')"
            variant="ghost"
            size="sm"
            class="!p-2 !rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            @click.stop="abrirModalAgendamento(row)"
            title="Agendar"
          >
            <i class="pi pi-calendar text-xs"></i>
          </Button>
        </TableActions>
      </template>
    </Table>

    <AgendamentosModal
      :open="modalAgendamentoOpen"
      :cliente="clienteSelecionado"
      :pipeline="pipeline"
      :is-admin="isAdmin"
      :funcionarios="funcionarios"
      :funcionario-nome="funcionarioNome"
      @close="fecharModalAgendamento"
      @salvar="salvarAgendamento"
    />

  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService, FuncionarioService, AgendaService } from '@/services/index'
import { PIPELINE_CLIENTE } from '@/constantes'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import storage from '@/utils/storage'

// UI Components
import PageHeader from '@/components/ui/PageHeader.vue'
import MetricCard from '@/components/ui/MetricCard.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import TableActions from '@/components/ui/TableActions.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'

definePage({ meta: { perm: 'clientes.ver' } })



const router = useRouter()

// Estado
const filtro = ref('')
const carregando = ref(false)
const mostrarInativos = ref(false)
const clientes = ref([])

const pipeline = ref([])
const pipelineLoaded = ref(false)
const pipelineErro = ref('')
const usuarioLogado = computed(() => storage.getUser())

// Modal de agendamento
const modalAgendamentoOpen = ref(false)
const clienteSelecionado = ref(null)
const funcionarios = ref([])
const isAdmin = computed(() => can('ADMIN'))
const funcionarioNome = computed(() => usuarioLogado.value?.nome || '')

// Computed
const clientesFiltrados = computed(() => {
  let filtrados = clientes.value

  if (!mostrarInativos.value) {
    filtrados = filtrados.filter(c => String(c?.status || 'ATIVO').toUpperCase() === 'ATIVO')
  }
  
  
  // Aplicar filtro de busca
  if (filtro.value) {
    const termo = filtro.value.toLowerCase().trim()
    filtrados = filtrados.filter(c => 
      (c.nome_completo && c.nome_completo.toLowerCase().includes(termo)) ||
      (c.razao_social && c.razao_social.toLowerCase().includes(termo)) ||
      (c.cpf && c.cpf.includes(termo)) ||
      (c.cnpj && c.cnpj.includes(termo)) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.whatsapp && c.whatsapp.includes(termo)) ||
      (c.cidade && c.cidade.toLowerCase().includes(termo)) ||
      (c.estado && c.estado.toLowerCase().includes(termo))
    )
  }
  
  return filtrados
})

const totalAtivos = computed(() =>
  clientes.value.filter(c => String(c?.status || 'ATIVO').toUpperCase() === 'ATIVO').length
)



const totalCidades = computed(() => 
  new Set(clientes.value.map(c => c.cidade).filter(Boolean)).size
)


// Métodos utilitários usando pipeline dinâmico
const getPipelineLabel = (key) => {
  if (!key) return 'SEM OBRA'
  const item = pipeline.value.find(p => p.key === key)
  return item ? item.label : String(key).replaceAll('_', ' ')
}

const getPipelineColor = (key) => {
  if (!key) return 'slate'
  const item = pipeline.value.find(p => p.key === key)
  if (!item) return 'slate' // Default para status desconhecido
  
  const fase = String(item.fase || '').toUpperCase()
  
  if (fase.includes('MEDIDA')) return 'indigo'
  if (fase.includes('ORCAMENTO')) return 'amber'
  if (fase.includes('PRODUCAO')) return 'blue'
  if (fase.includes('MONTAGEM')) return 'emerald'
  if (fase.includes('FINAL') || fase.includes('ENCERR')) return 'slate'
  
  return 'slate'
}



// Métodos de ação
const editarCliente = (id) => {
  if (!can('clientes.editar')) return notify.error('Acesso negado.')
  router.push(`/clientes/${id}`)
}

async function excluirCliente(id) {
    if (!can('clientes.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Cliente?', 'Esta ação não pode ser desfeita.')
  if (!ok) return

  const cleanId = Number(id)

  try {
    await ClienteService.remover(cleanId)

    // atualiza lista local
    clientes.value = clientes.value.filter(c => Number(c.id) !== cleanId)

    notify.success('Cliente removido com sucesso')
  } catch (e) {
    console.error('Erro ao excluir cliente:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Não foi possível excluir o cliente'))
  }
}


const exportarClientes = () => {
  const dadosParaExportar = clientesFiltrados.value.map(c => ({
    'ID': c.id,
    'Nome/Razão Social': c.nome_completo || c.razao_social,
    'CPF/CNPJ': c.cpf || c.cnpj,
    'Status': (c.pipeline_status || 'SEM_OBRA').replaceAll('_', ' '),
    'Cidade': c.cidade,
    'Estado': c.estado,
    'E-mail': c.email,
    'WhatsApp': c.whatsapp,
    'Telefone': c.telefone
  }))
  
  const csvContent = [
    Object.keys(dadosParaExportar[0] || {}).join(','),
    ...dadosParaExportar.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

async function abrirModalAgendamento(cliente) {
  clienteSelecionado.value = cliente
  if (isAdmin.value) {
    try {
      const res = await FuncionarioService.listar()
      const lista = Array.isArray(res?.data) ? res.data : []
      funcionarios.value = lista.filter((f) => String(f?.status || 'ATIVO').toUpperCase() === 'ATIVO')
    } catch (e) {
      funcionarios.value = []
    }
  } else {
    funcionarios.value = []
  }
  await nextTick()
  modalAgendamentoOpen.value = true
}

function fecharModalAgendamento() {
  modalAgendamentoOpen.value = false
  clienteSelecionado.value = null
}

function getNextStage(currentKey) {
  const arr = [...(pipeline.value || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  const idx = arr.findIndex((p) => p.key === currentKey)
  return idx >= 0 ? arr[idx + 1] : arr.find((p) => p.temTela) || arr[0]
}

function getStatusFromCategoria(categoria) {
  const map = {
    MEDIDA: 'MEDIDA_AGENDADA',
    ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
    MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
    PRODUCAO: 'PRODUCAO_AGENDADA',
    MONTAGEM: 'MONTAGEM_AGENDADA',
  }
  return map[String(categoria || '').toUpperCase()] || ''
}

function salvarAgendamento(payload) {
  const clienteId = Number(clienteSelecionado.value?.id)
  const dataHora = payload?.dataHora
  const funcionarioId = isAdmin.value
    ? Number(payload?.funcionarioId)
    : Number(usuarioLogado.value?.funcionario_id)

  if (!clienteId) return notify.error('Cliente invalido.')
  if (!funcionarioId) return notify.error('Funcionario nao encontrado.')
  if (!dataHora) return notify.error('Informe a data e horario.')

  const nextStage = getNextStage(clienteSelecionado.value?.pipeline_status)
  if (!nextStage) return notify.error('Nao foi possivel definir a proxima etapa.')

  const inicio = new Date(dataHora)
  if (Number.isNaN(inicio.getTime())) return notify.error('Data invalida.')
  const fim = new Date(inicio)
  fim.setHours(fim.getHours() + 1)

  const categoria = String(nextStage.fase || '').toUpperCase()
  const statusKey = payload?.statusKey || getStatusFromCategoria(categoria) || nextStage.key

  AgendaService.criar({
    titulo: nextStage.label,
    inicio_em: inicio.toISOString(),
    fim_em: fim.toISOString(),
    cliente_id: clienteId,
    equipe_ids: [funcionarioId],
    categoria,
  })
    .then(() => {
      const idx = clientes.value.findIndex((c) => Number(c.id) === clienteId)
      if (idx >= 0) {
        clientes.value[idx] = { ...clientes.value[idx], pipeline_status: statusKey }
      }
      if (clienteSelecionado.value) {
        clienteSelecionado.value = { ...clienteSelecionado.value, pipeline_status: statusKey }
      }
      notify.success('Agendamento salvo!')
      fecharModalAgendamento()
    })
    .catch((e) => {
      const apiMsg = e?.response?.data?.message
      notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Nao foi possivel salvar.'))
    })
}

// Colunas da tabela
const columns = [
  { key: 'cliente', label: 'CLIENTE', width: '40%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'localizacao', label: 'LOCALIZAÇÃO', width: '25%' },
  { key: 'acoes', label: '', align: 'right', width: '20%' }
]

// Carregar pipeline e clientes
const carregarPipeline = async () => {
  pipelineLoaded.value = false
  pipelineErro.value = ''

  // Sem endpoint publico para pipeline: usa constante local.
  pipeline.value = PIPELINE_CLIENTE || []
  pipelineLoaded.value = true
}

const carregarClientes = async () => {
  carregando.value = true
  try {
    await carregarPipeline()
    const res = await ClienteService.listar()
    const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
    clientes.value = data
  } catch (error) {
    notify.error('Falha ao carregar clientes.')
    clientes.value = []
  } finally {
    carregando.value = false
  }
}



// Carregar dados ao montar componente
onMounted(carregarClientes)
</script>