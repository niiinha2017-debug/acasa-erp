<template>
  <div class="p-6">
    <Card>
      <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
        <div>
          <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
            Orçamentos do Cliente
          </h2>
          <p class="text-sm font-semibold text-gray-500 mt-1">
            Arquivo completo de orçamentos deste cliente.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="secondary" size="sm" type="button" @click="router.back()">
            Voltar
          </Button>

          <Button variant="primary" size="sm" type="button" @click="novoParaCliente">
            NOVO
          </Button>
        </div>
      </header>

      <div class="p-6 pb-0">
        <div class="grid grid-cols-12">
          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="filtro"
              label="Buscar"
              placeholder="ID do orçamento..."
            />
          </div>
        </div>
      </div>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="filtrados"
          :loading="loading"
          emptyText="Nenhum orçamento encontrado para este cliente."
        >
          <template #cell-id="{ row }">
            <span class="text-gray-400 font-bold">#{{ row.id }}</span>
          </template>

          <template #cell-total="{ row }">
            <span class="font-black text-brand-primary">
              {{ format.currency(row.total_itens || 0) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <Button size="sm" variant="secondary" @click="router.push(`/orcamentos/${row.id}`)">
                Abrir
              </Button>

              <Button size="sm" variant="outline" @click="abrirPdf(row.id)">
                PDF
              </Button>

              <Button size="sm" variant="danger" @click="excluir(row.id)">
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { OrcamentosService } from '@/services/index'
import Card from '@/components/ui/Card.vue'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const clienteId = computed(() => Number(String(route.params.id || '').replace(/\D/g, '')))

const loading = ref(false)
const filtro = ref('')
const rows = ref([])

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'total', label: 'Total', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '260px', align: 'right' },
]

async function carregar() {
  loading.value = true
  try {
    const { data } = await OrcamentosService.listar()
    const all = data || []

    rows.value = all
      .filter((o) => Number(o.cliente_id) === Number(clienteId.value))
      .sort((a, b) => {
        const da = new Date(a.criado_em || a.data || 0).getTime()
        const db = new Date(b.criado_em || b.data || 0).getTime()
        return db - da
      })
  } catch (e) {
    console.error('Erro ao carregar orçamentos do cliente:', e)
  } finally {
    loading.value = false
  }
}

const filtrados = computed(() => {
  const f = String(filtro.value || '').trim().toLowerCase()
  if (!f) return rows.value
  return rows.value.filter((o) => String(o.id || '').includes(f))
})

function novoParaCliente() {
  router.push({ path: '/orcamentos/novo', query: { cliente_id: String(clienteId.value) } })
}

function abrirPdf(id) {
  OrcamentosService.abrirPdf(id)
}

async function excluir(id) {
  await OrcamentosService.remover(id)
  await carregar()
}

onMounted(carregar)
</script>
