<template>
  <div class="p-6">
    <Card>
      <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
        <div>
          <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
            Orçamentos
          </h2>
          <p class="text-sm font-semibold text-gray-500 mt-1">
            Gestão de orçamentos e projetos.
          </p>
        </div>

        <Button variant="primary" @click="router.push('/orcamentos/novo')">
          + Novo Orçamento
        </Button>
      </header>

      <div class="p-6 pb-0">
        <div class="grid grid-cols-12">
          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="filtro"
              label="Buscar"
              placeholder="Cliente ou ID..."
            />
          </div>
        </div>
      </div>

      <!-- ✅ TABELA ÚNICA: CLIENTES COM ORÇAMENTOS -->
      <div class="p-6">
        <Table
          :columns="columns"
          :rows="grupos"
          :loading="loading"
          emptyText="Nenhum cliente com orçamento encontrado."
        >
          <template #cell-cliente="{ row }">
            <div class="flex flex-col">
              <span class="font-bold text-gray-900">
                {{ row.cliente_nome_snapshot || 'Cliente não identificado' }}
              </span>
              <span class="text-xs text-gray-500">
                {{ row.cliente_cpf_snapshot || 'Sem CPF/CNPJ' }}
              </span>
            </div>
          </template>

          <template #cell-qtd="{ row }">
            <span class="font-black text-gray-900">{{ row.qtd }}</span>
          </template>

          <template #cell-ultimo="{ row }">
            <span class="text-gray-500 font-bold">
              #{{ row.ultimo_id || '—' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <Button size="sm" variant="primary" @click="novoParaCliente(row.cliente_id)">
                NOVO
              </Button>

              <Button size="sm" variant="secondary" @click="abrirListaDoCliente(row.cliente_id)">
                ORÇAMENTOS
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
import { useRouter } from 'vue-router'

import api from '@/services/api'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Card from '@/components/ui/Card.vue' // <-- Faltava esta importação
import { format } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const rows = ref([])

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'total', label: 'Total', width: '140px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '260px', align: 'right' },
]


const filtrados = computed(() => {
  const f = (filtro.value || '').trim().toLowerCase()
  if (!f) return rows.value

  return rows.value.filter((r) => {
    const id = String(r.id || '')
    const nome = String(r.cliente_nome_snapshot || '').toLowerCase()
    const cpf = String(r.cliente_cpf_snapshot || '').toLowerCase()
    return id.includes(f) || nome.includes(f) || cpf.includes(f)
  })
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/orcamentos')
    rows.value = data || []
  } catch (e) {
    console.error("Erro ao carregar orçamentos:", e)
  } finally {
    loading.value = false
  }
}

const grupos = computed(() => {
  const f = (filtro.value || '').trim().toLowerCase()

  const map = new Map()

  for (const o of rows.value || []) {
    const clienteId = o.cliente_id || o.clienteId
    if (!clienteId) continue

    const nome = o.cliente_nome_snapshot || ''
    const cpf = o.cliente_cpf_snapshot || ''

    if (!map.has(clienteId)) {
      map.set(clienteId, {
        cliente_id: clienteId,
        cliente_nome_snapshot: nome,
        cliente_cpf_snapshot: cpf,
        orcamentos: [],
      })
    }

    map.get(clienteId).orcamentos.push(o)
  }

  // ordena orçamentos de cada cliente (mais recente primeiro, se tiver data)
  for (const g of map.values()) {
    g.orcamentos.sort((a, b) => {
      const da = new Date(a.criado_em || a.data || 0).getTime()
      const db = new Date(b.criado_em || b.data || 0).getTime()
      return db - da
    })
  }

  let lista = Array.from(map.values()).map((g) => {
    const ultimo = g.orcamentos[0]
    return {
      ...g,
      qtd: g.orcamentos.length,
      ultimo_id: ultimo?.id,
      ultimo_em: ultimo?.criado_em || ultimo?.data || null,
    }
  })

  // filtro por cliente
  if (f) {
    lista = lista.filter((g) => {
      const id = String(g.cliente_id || '')
      const nome = String(g.cliente_nome_snapshot || '').toLowerCase()
      const cpf = String(g.cliente_cpf_snapshot || '').toLowerCase()
      return id.includes(f) || nome.includes(f) || cpf.includes(f)
    })
  }

  // ordena clientes pelo último orçamento (mais recente primeiro)
  lista.sort((a, b) => {
    const da = new Date(a.ultimo_em || 0).getTime()
    const db = new Date(b.ultimo_em || 0).getTime()
    return db - da
  })

  return lista
})
function novoParaCliente(clienteId) {
  router.push({ path: '/orcamentos/novo', query: { cliente_id: String(clienteId) } })
}
function abrirListaDoCliente(clienteId) {
  router.push(`/orcamentos/cliente/${clienteId}`)
}


function abrirPdf(id) {
  const base = import.meta.env.VITE_API_URL
  window.open(`${base}/orcamentos/${id}/pdf`, '_blank')
}

onMounted(carregar)
</script>
