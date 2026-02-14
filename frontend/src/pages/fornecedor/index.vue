<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Fornecedores"
        subtitle="Base de parceiros comerciais"
        icon="pi pi-truck"
        :show-back="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="busca"
                placeholder="Buscar fornecedor, cidade, endereço ou bairro..."
              />
            </div>

            <Button
              v-if="can('fornecedores.criar')"
              variant="primary"
              @click="router.push('/fornecedor/novo')"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Fornecedor
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum fornecedor encontrado."
          :boxed="false"
        >
          <template #cell-razao_social="{ row }">
            <div class="flex items-center gap-3 py-1">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-text-muted text-xs bg-bg-page border border-border-ui">
                {{ (row.nome_fantasia || row.razao_social || '?').substring(0, 2).toUpperCase() }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-bold text-text-main uppercase tracking-tight truncate">
                  {{ row.nome_fantasia || row.razao_social || '-' }}
                </span>
                <span class="text-[10px] font-medium text-text-muted truncate">
                  {{ row.razao_social || '-' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-localizacao="{ row }">
            <div class="flex flex-col">
              <span class="text-sm font-medium text-text-main uppercase">{{ [row.endereco, row.numero, row.bairro].filter(Boolean).join(', ') || '-' }}</span>
              <span class="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                {{ row.cidade || '-' }}
              </span>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <span class="text-sm text-text-main">{{ row.whatsapp || row.telefone || row.email || '-' }}</span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="fornecedores.editar"
                perm-delete="fornecedores.excluir"
                @edit="editarFornecedor"
                @delete="excluirFornecedor"
              />
            </div>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'fornecedores.ver' } })

const router = useRouter()
const busca = ref('')
const loading = ref(false)
const fornecedores = ref([])

const rowsFiltrados = computed(() => {
  let filtrados = fornecedores.value
  if (busca.value) {
    const termo = busca.value.toLowerCase().trim()
    filtrados = filtrados.filter((f) =>
      (f.razao_social && f.razao_social.toLowerCase().includes(termo)) ||
      (f.nome_fantasia && f.nome_fantasia.toLowerCase().includes(termo)) ||
      (f.email && f.email.toLowerCase().includes(termo)) ||
      (f.whatsapp && f.whatsapp.includes(termo)) ||
      (f.telefone && f.telefone.includes(termo)) ||
      (f.endereco && f.endereco.toLowerCase().includes(termo)) ||
      (f.numero && String(f.numero).toLowerCase().includes(termo)) ||
      (f.bairro && f.bairro.toLowerCase().includes(termo)) ||
      (f.cidade && f.cidade.toLowerCase().includes(termo))
    )
  }
  return filtrados
})

function editarFornecedor(id) {
  if (!can('fornecedores.editar')) return notify.error('Acesso negado.')
  router.push(`/fornecedor/${id}`)
}

async function excluirFornecedor(id) {
  if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Fornecedor?', 'Esta ação não pode ser desfeita.')
  if (!ok) return
  const cleanId = Number(id)
  try {
    await FornecedorService.remover(cleanId)
    fornecedores.value = fornecedores.value.filter((f) => Number(f.id) !== cleanId)
    notify.success('Fornecedor removido com sucesso')
  } catch (e) {
    console.error('Erro ao excluir fornecedor:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Não foi possível excluir o fornecedor'))
  }
}

const columns = [
  { key: 'razao_social', label: 'FORNECEDOR', width: '35%' },
  { key: 'localizacao', label: 'LOCALIZAÇÃO', width: '35%' },
  { key: 'contato', label: 'CONTATO', width: '15%' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '15%' }
]

const carregarFornecedores = async () => {
  loading.value = true
  try {
    const res = await FornecedorService.listar()
    fornecedores.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error)
    notify.error('Falha ao carregar fornecedores.')
    fornecedores.value = []
  } finally {
    loading.value = false
  }
}

onMounted(carregarFornecedores)
</script>
