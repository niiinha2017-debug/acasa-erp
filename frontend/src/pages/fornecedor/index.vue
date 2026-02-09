<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    
    <PageHeader 
      title="Fornecedores"
      subtitle="Gestão de parceiros comerciais e suprimentos"
      icon="pi pi-truck"
    >
      <template #actions>
        <Button
          v-if="can('fornecedores.criar')"
          variant="primary"
          @click="router.push('/fornecedor/novo')"
        >
          <i class="pi pi-plus mr-2"></i>
          Novo Fornecedor
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total Parceiros"
        :value="rows.length"
        icon="pi pi-building"
        color="slate"
      />
      
      <MetricCard
        label="Com E-mail"
        :value="rows.filter(r => r.email).length"
        icon="pi pi-envelope"
        color="blue"
      />
      
      <MetricCard
        label="Com Telefone"
        :value="rows.filter(r => r.telefone || r.whatsapp).length"
        icon="pi pi-phone"
        color="emerald"
      />

       <MetricCard
        label="Ativos"
        :value="rows.filter(r => !r.inativo).length"
        icon="pi pi-check-circle"
        color="amber"
      />
    </div>

    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="busca"
          placeholder="Buscar por razão, cnpj ou cidade..."
        />
      </div>

      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
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
                :can-edit="can('fornecedores.editar')"
                :can-delete="can('fornecedores.excluir')"
                @edit="router.push(`/fornecedor/${row.id}`)"
                @delete="confirmarExcluir(row)"
              />
          </template>
        </Table>
      </div>
    </div>
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
