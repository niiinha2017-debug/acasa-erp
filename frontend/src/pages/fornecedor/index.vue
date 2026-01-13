<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Fornecedor</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gestão de fornecedor e dados cadastrais.
        </p>
      </div>

      <Button variant="primary" size="sm" type="button" @click="router.push('/fornecedor/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Novo Fornecedor
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6 space-y-5">
      <SearchInput
        v-model="filtro"
        placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
        colSpan="12"
      />

      <div class="overflow-hidden rounded-2xl border border-gray-100">
        <Table
          :columns="columns"
          :rows="fornecedorFiltrados"
          :loading="carregando"
          empty-text="Nenhum fornecedor encontrado."
        >
          <template #cell-razao_social="{ row }">
            <div class="flex flex-col">
              <strong class="text-sm font-black text-gray-900">
                {{ row.razao_social || 'Sem razão social' }}
              </strong>
              <small v-if="row.nome_fantasia" class="text-xs font-semibold text-gray-400">
                {{ row.nome_fantasia }}
              </small>
            </div>
          </template>
<template #cell-cnpj="{ row }">
  <span
    class="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-black text-gray-700 whitespace-nowrap"
  >
    {{ row.cnpj || '-' }}
  </span>
</template>

<template #cell-contato="{ row }">
  <div class="flex flex-col text-sm font-semibold text-gray-700 leading-tight">
    <div class="whitespace-nowrap">{{ row.whatsapp || row.telefone || '-' }}</div>
    <div class="text-[11px] font-semibold text-gray-400 truncate max-w-[200px]">
      {{ row.cidade ? `${row.cidade} - ${row.estado || ''}`.trim() : 'Sem endereço' }}
    </div>
  </div>
</template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="router.push(`/fornecedor/${row.id}`)"
              >
                <i class="pi pi-pencil text-xs"></i>
              </Button>

              <Button
                variant="danger"
                size="sm"
                type="button"
                :loading="deletandoId === row.id"
                @click="excluir(row)"
              >
                <i class="pi pi-trash text-xs"></i>
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()

const fornecedor = ref([])
const carregando = ref(false)
const filtro = ref('')
const deletandoId = ref(null)

const columns = [
  { key: 'razao_social', label: 'Razão Social / Fantasia' },
  { key: 'cnpj', label: 'CNPJ', width: '150px', align: 'center' }, // Reduzido de 180 para 150
  { key: 'contato', label: 'Contato / Localização' },
  { key: 'acoes', label: 'Ações', width: '120px', align: 'center' }, // Ajustado para 120px
]

const fornecedorFiltrados = computed(() => {
  const termo = (filtro.value || '').toLowerCase().trim().replace(/[./-]/g, '') // Remove máscara da busca
  if (!termo) return fornecedor.value

  return fornecedor.value.filter(f => {
    const cnpjLimpo = String(f.cnpj || '').replace(/[./-]/g, '')
    return String(f.razao_social || '').toLowerCase().includes(termo) ||
           String(f.nome_fantasia || '').toLowerCase().includes(termo) ||
           cnpjLimpo.includes(termo)
  })
})

async function carregar() {
  carregando.value = true
  try {
    const { data } = await api.get('/fornecedor')
    fornecedor.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    fornecedor.value = []
  } finally {
    carregando.value = false
  }
}

async function excluir(row) {
  if (!confirm(`Deseja excluir o fornecedor "${row.razao_social || 'Sem nome'}"?`)) return
  deletandoId.value = row.id
  try {
    await api.delete(`/fornecedor/${row.id}`)
    fornecedor.value = fornecedor.value.filter(item => item.id !== row.id)
  } catch (err) {
    console.error(err)
    alert('Erro ao excluir fornecedor.')
  } finally {
    deletandoId.value = null
  }
}

onMounted(carregar)
</script>
