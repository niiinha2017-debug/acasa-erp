<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Constantes</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gestão de constantes do sistema (formas de pagamento, status, categorias, etc).
        </p>
      </div>

      <Button variant="primary" size="sm" type="button" @click="router.push('/constantes/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Nova Constante
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6 space-y-5">
      <SearchInput
        v-model="filtro"
        placeholder="Buscar por categoria, chave ou rótulo..."
        colSpan="12"
      />

      <div class="overflow-hidden rounded-2xl border border-gray-100">
        <Table
          :columns="columns"
          :rows="constantesFiltradas"
          :loading="loading"
          empty-text="Nenhuma constante encontrada."
        >
          <template #cell-ativo="{ row }">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
              :class="row.ativo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-gray-50 text-gray-700 border-gray-200'"
            >
              {{ row.ativo ? 'Ativo' : 'Inativo' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="router.push(`/constantes/${row.id}`)"
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

const loading = ref(false)
const filtro = ref('')
const constantes = ref([])

/* =========================
   COLUNAS DA TABELA (Simplificadas)
========================= */
const columns = [
  { key: 'categoria',    label: 'Categoria' },
  { key: 'chave',        label: 'Chave' },
  { key: 'rotulo',       label: 'Rótulo' }, // Adicionei rótulo que é mais amigável
  { key: 'valor_exibido', label: 'Valor' }, // 👈 Alterado aqui
  { key: 'ordem',        label: 'Ordem',  width: '80px', align: 'center' },
  { key: 'ativo',        label: 'Status', width: '100px', align: 'center' },
  { key: 'acoes',        label: 'Ações',  width: '140px', align: 'center' },
]

/* =========================
   FILTRO E FORMATAÇÃO
========================= */
const constantesFiltradas = computed(() => {
  // Primeiro, formatamos os dados para a tabela entender o que exibir
  const listaFormatada = constantes.value.map(c => ({
    ...c,
    // Cria um campo virtual "valor_exibido" para a tabela
    valor_exibido: c.valor_numero !== null ? `${c.valor_numero}%` : (c.valor_texto || '-')
  }))

  const termo = (filtro.value || '').toLowerCase().trim()
  if (!termo) return listaFormatada

  return listaFormatada.filter(c =>
    c.categoria?.toLowerCase().includes(termo) ||
    c.chave?.toLowerCase().includes(termo) ||
    c.rotulo?.toLowerCase().includes(termo) ||
    String(c.valor_exibido).toLowerCase().includes(termo)
  )
})
/* =========================
   LOAD
========================= */
async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/constantes')
    constantes.value = Array.isArray(data) ? data : []
  } catch (e) {
    constantes.value = []
  } finally {
    loading.value = false
  }
}

/* =========================
   EXCLUIR
========================= */
async function excluir(row) {
  if (!confirm(`Deseja excluir a constante "${row.rotulo}"?`)) return

  try {
    await api.delete(`/constantes/${row.id}`)
    constantes.value = constantes.value.filter(c => c.id !== row.id)
  } catch (e) {
    alert('Erro ao excluir constante.')
  }
}

onMounted(carregar)
</script>

