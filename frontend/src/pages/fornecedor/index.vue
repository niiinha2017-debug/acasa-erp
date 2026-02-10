<template>
    <PageHeader
      title="Fornecedores"
      subtitle="Gestão de parceiros comerciais e suprimentos"
      icon="pi pi-truck"
      :show-back="false"
      minimal
    >
      <template #actions>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-full sm:w-64">
            <SearchInput
              v-model="busca"
              placeholder="Buscar por razão, CNPJ ou cidade..."
              :bordered="true"
            />
          </div>
          <Button
            v-if="can('fornecedores.criar')"
            variant="primary"
            class="flex-shrink-0"
            @click="router.push('/fornecedor/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Fornecedor
          </Button>
        </div>
      </template>
    </PageHeader>

    <div class="page-section overflow-hidden bg-bg-card">
      <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum fornecedor encontrado."
          :boxed="false"
        >
          <template #cell-razao_social="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">
                {{ row.nome_fantasia || row.razao_social }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {{ row.razao_social }}
              </span>
            </div>
          </template>

          <template #cell-documento="{ row }">
             <span class="text-xs font-medium text-slate-600">
               {{ formatDoc(row.cnpj || row.cpf) }}
             </span>
          </template>

          <template #cell-contato="{ row }">
            <div class="flex flex-col">
              <div v-if="row.email" class="flex items-center gap-1.5 text-slate-600 mb-0.5">
                <i class="pi pi-envelope text-[9px]"></i>
                <span class="text-[10px] font-medium lowercase">{{ row.email }}</span>
              </div>
              <div v-if="row.telefone || row.whatsapp" class="flex items-center gap-1.5 text-slate-600">
                <i class="pi pi-phone text-[9px]"></i>
                <span class="text-[10px] font-medium">{{ row.whatsapp || row.telefone }}</span>
              </div>
            </div>
          </template>

          <template #cell-localizacao="{ row }">
            <span class="text-xs font-bold text-slate-700 uppercase" v-if="row.cidade">
              {{ row.cidade }}<span v-if="row.estado">/{{ row.estado }}</span>
            </span>
            <span v-else class="text-slate-400 text-xs italic">Não informado</span>
          </template>

          <template #cell-acoes="{ row }">
             <TableActions
                :id="row.id"
                perm-edit="fornecedores.editar"
                perm-delete="fornecedores.excluir"
                @edit="router.push(`/fornecedor/${row.id}`)"
                @delete="confirmarExcluir(row)"
              />
          </template>
        </Table>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { maskCNPJ, maskCPF } from '@/utils/masks'

definePage({ meta: { perm: 'fornecedores.ver' } })

const router = useRouter()
const loading = ref(true)
const busca = ref('')
const rows = ref([])

const columns = [
  { key: 'razao_social', label: 'FORNECEDOR', width: '30%' },
  { key: 'documento', label: 'DOCUMENTO', width: '20%' },
  { key: 'contato', label: 'CONTATO', width: '25%' },
  { key: 'localizacao', label: 'LOCALIZAÇÃO', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '10%' }
]

const rowsFiltrados = computed(() => {
  const termo = String(busca.value || '').toLowerCase().trim()
  if (!termo) return rows.value

  return rows.value.filter((f) => {
    const razao = String(f.razao_social || '').toLowerCase()
    const fantasia = String(f.nome_fantasia || '').toLowerCase()
    const doc = String(f.cnpj || f.cpf || '').toLowerCase()
    const cidade = String(f.cidade || '').toLowerCase()

    return razao.includes(termo) || fantasia.includes(termo) || doc.includes(termo) || cidade.includes(termo)
  })
})

function formatDoc(v) {
  if (!v) return '—'
  const s = String(v).replace(/\D/g, '')
  return s.length > 11 ? maskCNPJ(s) : maskCPF(s)
}

async function carregar() {
  loading.value = true
  try {
    // Ajuste conforme o retorno real do seu service
    const data = await FornecedorService.listar()
    rows.value = Array.isArray(data) ? data : (data.data || [])
  } catch (err) {
    notify.error('Erro ao listar fornecedores.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluir(row) {
  if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Remover Fornecedor',
    `Deseja excluir "${row.nome_fantasia || row.razao_social}"?`,
  )
  if (ok) {
    try {
      await FornecedorService.remover(row.id)
      rows.value = rows.value.filter(r => r.id !== row.id)
      notify.success('Fornecedor removido.')
    } catch (e) {
      notify.error('Não foi possível remover.')
    }
  }
}

onMounted(carregar)
</script>
