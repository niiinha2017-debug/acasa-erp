<template>
  <div class="login-font clientes-line-list w-full max-w-[1700px] mx-auto">
    <div class="relative overflow-hidden rounded-3xl border border-border-ui bg-bg-card shadow-2xl">
      <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>

      <PageHeader
        title="Fornecedores"
        subtitle="Base de parceiros comerciais"
        icon="pi pi-truck"
        :showBack="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="w-full sm:w-64">
              <SearchInput
                v-model="busca"
                placeholder="Buscar fornecedor, cidade, endereco ou bairro..."
                :bordered="true"
              />
            </div>

            <Button
              v-if="can('fornecedores.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="router.push('/fornecedor/novo')"
            >
              <i class="pi pi-plus mr-2 text-xs"></i>
              Novo Fornecedor
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          :empty-text="busca ? 'Nenhum fornecedor encontrado para sua busca' : 'Nenhum fornecedor cadastrado'"
        >
          <template #cell-razao_social="{ row }">
            <div class="flex items-center gap-3 py-0.5">
              <div class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                {{ (row.nome_fantasia || row.razao_social || '?').substring(0,2).toUpperCase() }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {{ row.nome_fantasia || row.razao_social || '-' }}
                </span>
                <span class="text-xs font-normal text-slate-500 truncate mt-0.5">
                  {{ row.razao_social || '-' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-localizacao="{ row }">
            <span class="text-sm text-slate-700 dark:text-slate-300">
              {{ [row.endereco, row.numero, row.bairro].filter(Boolean).join(', ') || '-' }}
            </span>
          </template>

          <template #cell-contato="{ row }">
            <span class="text-sm text-slate-700 dark:text-slate-300">
              {{ row.whatsapp || row.telefone || row.email || '-' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="w-full flex justify-center">
              <TableActions
                class="!justify-center !px-0"
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

import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import TableActions from '@/components/ui/TableActions.vue'

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

  const ok = await confirm.show('Excluir Fornecedor?', 'Esta acao nao pode ser desfeita.')
  if (!ok) return

  const cleanId = Number(id)

  try {
    await FornecedorService.remover(cleanId)
    fornecedores.value = fornecedores.value.filter((f) => Number(f.id) !== cleanId)
    notify.success('Fornecedor removido com sucesso')
  } catch (e) {
    console.error('Erro ao excluir fornecedor:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Nao foi possivel excluir o fornecedor'))
  }
}

const columns = [
  { key: 'razao_social', label: 'FORNECEDOR', width: '35%' },
  { key: 'localizacao', label: 'LOCALIZACAO', width: '35%' },
  { key: 'contato', label: 'CONTATO', width: '15%' },
  { key: 'acoes', label: 'ACOES', align: 'center', width: '15%' }
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.clientes-line-list :deep(.search-container input.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.clientes-line-list :deep(.search-container input.w-full:focus) {
  box-shadow: none;
}
</style>
