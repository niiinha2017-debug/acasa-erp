<template>
  <Card :shadow="true">
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Clientes</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gestão da base de clientes e contatos
        </p>
      </div>

      <Button variant="primary" size="sm" type="button" @click="router.push('/clientes/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Novo Cliente
      </Button>
    </header>

    <div class="p-6 space-y-5">
      <SearchInput
        v-model="filtro"
        placeholder="Buscar por nome, documento ou e-mail..."
        colSpan="12"
      />

      <div class="overflow-hidden rounded-2xl border border-gray-100">
        <Table
          :columns="columns"
          :rows="clientesFiltrados"
          :loading="carregando"
          empty-text="Nenhum cliente encontrado."
        >
          <template #cell-nome="{ row }">
            <div class="flex flex-col">
              <strong class="text-sm font-black text-gray-900">
                {{ row.nome_completo || row.nome }}
              </strong>
              <small class="text-xs font-semibold text-gray-400">
                {{ row.cpf_cnpj || row.cpf || row.cnpj || 'Sem documento' }}
              </small>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <div class="text-sm font-semibold text-gray-700">
              <div>{{ row.telefone || row.whatsapp || '-' }}</div>
              <div class="text-xs font-semibold text-gray-400">{{ row.email || '' }}</div>
            </div>
          </template>

          <template #cell-status="{ row }">
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
                @click="router.push(`/clientes/${row.id}`)"
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                @click="confirmarExclusao(row)"
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
const carregando = ref(true)
const filtro = ref('')
const clientes = ref([])

const columns = [
  { key: 'nome', label: 'Cliente' },
  { key: 'contato', label: 'Contato' },
  { key: 'cidade', label: 'Cidade/UF' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '180px' },
]

const clientesFiltrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return clientes.value

  return clientes.value.filter((c) => {
    const nome = String(c.nome_completo || c.nome || '').toLowerCase()
    const doc = String(c.cpf_cnpj || c.cpf || c.cnpj || '')
    const email = String(c.email || '').toLowerCase()
    return nome.includes(termo) || doc.includes(termo) || email.includes(termo)
  })
})

async function confirmarExclusao(cliente) {
  const nome = cliente.nome_completo || cliente.nome || `Cliente #${cliente.id}`
  if (!confirm(`Deseja realmente excluir ${nome}?`)) return

  try {
    await api.delete(`/clientes/${cliente.id}`)
    clientes.value = clientes.value.filter((c) => c.id !== cliente.id)
  } catch (err) {
    alert('Erro ao excluir cliente.')
  }
}

async function buscarClientes() {
  carregando.value = true
  try {
    const { data } = await api.get('/clientes')
    clientes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    alert('Erro ao carregar clientes.')
  } finally {
    carregando.value = false
  }
}

onMounted(buscarClientes)
</script>
