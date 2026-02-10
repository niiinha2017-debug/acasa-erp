<template>
    <PageHeader
      title="Clientes"
      subtitle="Base de contatos e gestão estratégica"
      icon="pi pi-users"
      :show-back="false"
      minimal
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

    <div class="page-section overflow-hidden bg-bg-card">
      <Table
      :columns="columns"
      :rows="clientesFiltrados"
      :loading="carregando"
      :boxed="false"
      :empty-text="filtro ? 'Nenhum cliente encontrado para sua busca' : 'Nenhum cliente cadastrado'"
    >
      <template #cell-nome="{ row }">
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

      <template #cell-whatsapp="{ row }">
        <span class="text-sm text-slate-700 dark:text-slate-300">
          {{ row.whatsapp || '—' }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge
          v-if="row.pipeline_status || row.status"
          :value="getPipelineLabel(row.pipeline_status || row.status)"
          :color="getPipelineColor(row.pipeline_status || row.status)"
        />
        <span v-else class="text-xs text-slate-400 italic">Sem status</span>
      </template>

      <template #cell-localizacao="{ row }">
        <div class="flex flex-col">
          <span class="text-sm text-slate-700 dark:text-slate-300">
            {{ row.endereco || '—' }}
          </span>
          <span class="text-xs text-slate-400 font-medium">
            {{ row.numero || '—' }} • {{ row.bairro || '—' }}
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
        </TableActions>
      </template>
    </Table>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService } from '@/services/index'
import { PIPELINE_CLIENTE } from '@/constantes'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

// UI Components
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import TableActions from '@/components/ui/TableActions.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

definePage({ meta: { perm: 'clientes.ver' } })



const router = useRouter()

// Estado
const filtro = ref('')
const carregando = ref(false)
const clientes = ref([])

const pipeline = ref([])
const pipelineLoaded = ref(false)
const pipelineErro = ref('')

// Computed
const clientesFiltrados = computed(() => {
  let filtrados = clientes.value

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



// Colunas da tabela
const columns = [
  { key: 'nome', label: 'NOME', width: '30%' },
  { key: 'whatsapp', label: 'WHATSAPP', width: '15%' },
  { key: 'localizacao', label: 'LOCALIZAÇÃO', width: '20%' },
  { key: 'status', label: 'STATUS', width: '15%' },
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

    // PADRÃO ACASA ERP
    const lista = Array.isArray(res?.data) ? res.data : []
    clientes.value = lista.map((c) => ({
      ...c,
      pipeline_status: c.pipeline_status ?? c.status ?? null,
    }))

  } catch (error) {
    console.error('Erro ao carregar clientes:', error)
    notify.error('Falha ao carregar clientes.')
    clientes.value = []
  } finally {
    carregando.value = false
  }
}




// Carregar dados ao montar componente
onMounted(carregarClientes)
</script>
