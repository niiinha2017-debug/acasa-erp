<template>
  <div class="w-full">
    <Card>
      <div class="flex flex-col gap-4 px-8 pt-8 pb-6 border-b border-gray-100">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase">Funcionários</h2>
            <p class="text-sm font-semibold text-gray-400 mt-1">Gestão e controle de colaboradores</p>
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="selecionados.length > 0"
              variant="secondary"
              size="sm"
              :loading="gerandoPdf" 
              @click="gerarPdf"
            >
              <i class="pi pi-file-pdf mr-2"></i>
              Relatório Selecionados ({{ selecionados.length }})
            </Button>

            <Button
              variant="primary"
              size="sm"
              @click="router.push('/funcionarios/novo')"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Funcionário
            </Button>
          </div>
        </div>
      </div>

      <div class="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por nome, CPF ou cargo..."
          colSpan="w-full"
        />
      </div>

      <div class="px-8 pb-8">
        <Table
          :columns="columns"
          :rows="funcionariosFiltrados"
          :loading="loading"
          empty-text="Nenhum funcionário encontrado."
        >
          <template #cell-nome="{ row }">
            <div class="flex items-center gap-4">
              <input
                type="checkbox"
                class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                :checked="selectedIds.has(row.id)"
                @change="toggle(row.id)"
              />
              <div class="flex flex-col">
                <span class="font-black text-gray-900 leading-tight">{{ row.nome }}</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{{ row.cpf }}</span>
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border"
              :class="row.demissao
                ? 'bg-gray-50 text-gray-500 border-gray-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'"
            >
              {{ row.demissao ? 'Inativo' : 'Ativo' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                title="Editar"
                @click="router.push(`/funcionarios/${row.id}`)"
              >
                <i class="pi pi-pencil"></i>
              </Button>

              <Button
                variant="danger"
                size="sm"
                title="Excluir"
                @click="excluir(row)"
              >
                <i class="pi pi-trash"></i>
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { FuncionarioService } from '@/services/funcionarioService'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const loading = ref(true)
const gerandoPdf = ref(false)
const filtro = ref('')
const funcionarios = ref([])
const selectedIds = ref(new Set())

const selecionados = computed(() => Array.from(selectedIds.value))

const columns = [
  { key: 'nome', label: 'Funcionário' },
  { key: 'setor', label: 'Setor' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'status', label: 'Status', align: 'center', width: '120px' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '140px' }
]

function toggle(id) {
  const set = new Set(selectedIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedIds.value = set
}

async function gerarPdf() {
  if (selecionados.value.length === 0) return
  
  gerandoPdf.value = true
  try {
    const res = await api.post(
      '/funcionarios/relatorio/lote', // Rota que vai ler a tabela Empresa
      { ids: selecionados.value },
      { responseType: 'blob' }
    )

    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Limpar seleção após gerar para evitar erros
    selectedIds.value = new Set()
  } catch (err) {
    alert('Erro ao gerar o documento. Verifique as configurações da ACASA.')
  } finally {
    gerandoPdf.value = false
  }
}

const funcionariosFiltrados = computed(() => {
  const termo = filtro.value?.toLowerCase().trim()
  if (!termo) return funcionarios.value
  return funcionarios.value.filter(f => 
    f.nome?.toLowerCase().includes(termo) || 
    f.cpf?.includes(termo) ||
    f.cargo?.toLowerCase().includes(termo)
  )
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await FuncionarioService.listar()
    funcionarios.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

async function excluir(row) {
  if (!confirm(`Deseja remover ${row.nome}?`)) return
  try {
    await FuncionarioService.remover(row.id)
    funcionarios.value = funcionarios.value.filter(f => f.id !== row.id)
    selectedIds.value.delete(row.id)
  } catch (err) {
    alert('Erro ao excluir.')
  }
}

onMounted(carregar)
</script>