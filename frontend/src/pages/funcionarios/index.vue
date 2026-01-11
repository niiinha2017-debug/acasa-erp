<template>
  <div class="w-full">
    <Card>
      <!-- HEADER -->
      <div class="flex flex-col gap-4 px-8 pt-8 pb-6 border-b border-gray-100">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">
              Funcionários
            </h2>
            <p class="text-sm font-semibold text-gray-400 mt-2">
              Gestão e controle de colaboradores
            </p>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              :disabled="selecionados.length === 0"
              @click="gerarPdf"
            >
              Gerar PDF ({{ selecionados.length }})
            </Button>

            <Button
              variant="primary"
              size="sm"
              type="button"
              @click="router.push('/funcionarios/novo')"
            >
              Novo Funcionário
            </Button>
          </div>
        </div>
      </div>

      <!-- PESQUISAR -->
      <div class="px-8 py-6 border-b border-gray-100">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por nome, CPF ou cargo..."
          colSpan="w-full"
        />
      </div>

      <!-- TABELA (DENTRO DO MESMO CARD) -->
      <div class="px-8 pb-8">
<Table
  :columns="columns"
  :rows="funcionariosFiltrados"
  :loading="loading"
  empty-text="Nenhum funcionário encontrado."
  :boxed="false"
>

          <template #cell-nome="{ row }">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                  :checked="selectedIds.has(row.id)"
                  @change="toggle(row.id)"
                />
                <span class="font-black text-gray-900">{{ row.nome }}</span>
              </div>
              <span class="text-xs font-semibold text-gray-400">{{ row.cpf }}</span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
              :class="row.demissao
                ? 'bg-gray-50 text-gray-700 border-gray-200'
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
                type="button"
                @click="router.push(`/funcionarios/${row.id}`)"
              >
                Editar
              </Button>

              <Button
                variant="danger"
                size="sm"
                type="button"
                @click="excluir(row)"
              >
                Excluir
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

import api from '@/services/api' // ✅ IMPORT QUE FALTAVA
import { FuncionarioService } from '@/services'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const loading = ref(true)
const filtro = ref('')
const funcionarios = ref([])

const selectedIds = ref(new Set())
const selecionados = computed(() => Array.from(selectedIds.value))

const columns = [
  { key: 'nome', label: 'Funcionário' },
  { key: 'setor', label: 'Setor' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'status', label: 'Status', align: 'center', width: '120px' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '180px' }
]

function toggle(id) {
  const set = new Set(selectedIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedIds.value = set
}

async function gerarPdf() {
  if (!selecionados.value.length) return

  try {
    const res = await api.post(
      '/funcionarios/pdf',
      { ids: selecionados.value },
      { responseType: 'blob' }
    )

    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => window.URL.revokeObjectURL(url), 5000)
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao gerar PDF')
  }
}

const funcionariosFiltrados = computed(() => {
  if (!Array.isArray(funcionarios.value)) return []

  const termo = filtro.value?.toLowerCase().trim()
  if (!termo) return funcionarios.value

  return funcionarios.value.filter((f) => {
    return (
      f.nome?.toLowerCase().includes(termo) ||
      f.cpf?.includes(termo) ||
      f.cargo?.toLowerCase().includes(termo) ||
      f.setor?.toLowerCase().includes(termo)
    )
  })
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await FuncionarioService.listar()
    funcionarios.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erro na listagem:', err)
    funcionarios.value = []
  } finally {
    loading.value = false
  }
}

async function excluir(row) {
  if (!confirm(`Deseja realmente remover o funcionário ${row.nome}?`)) return

  try {
    await FuncionarioService.remover(row.id)

    // remove da lista
    funcionarios.value = funcionarios.value.filter((f) => f.id !== row.id)

    // ✅ remove da seleção também (no lugar certo)
    const set = new Set(selectedIds.value)
    set.delete(row.id)
    selectedIds.value = set
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao excluir funcionário.')
  }
}

onMounted(carregar)
</script>