a<template>
  <div class="login-font clientes-line-list w-full max-w-[1700px] mx-auto">
    <div class="relative overflow-hidden rounded-3xl border border-border-ui bg-bg-card shadow-2xl">
      <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>

      <PageHeader
        title="Clientes"
        subtitle="Gestao de relacionamento e base de contatos"
        icon="pi pi-users"
        :showBack="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar cliente, documento, email ou endereco..."
              />
            </div>

            <Button
              v-if="can('clientes.criar')"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              @click="router.push('/clientes/novo')"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Cliente
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4">
        <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table
            :columns="columns"
            :rows="rows"
            :loading="loading"
            empty-text="Nenhum cliente encontrado."
            :boxed="false"
          >
            <template #cell-nome_completo="{ row }">
              <div class="flex items-center gap-3 py-1">
                <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                  {{ String(row.nome_exibicao || '?').substring(0, 2).toUpperCase() }}
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-bold text-slate-800 uppercase tracking-tight truncate">
                    {{ row.nome_exibicao }}
                  </span>
                  <span class="text-[10px] font-medium text-slate-500 truncate">
                    {{ row.documento || 'Sem documento' }}
                    <span v-if="row.email" class="ml-2 text-slate-400">{{ row.email }}</span>
                  </span>
                </div>
              </div>
            </template>

            <template #cell-endereco="{ row }">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-slate-700 uppercase">{{ row.endereco_resumo }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {{ [row.cidade, row.estado].filter(Boolean).join(' / ') || '-' }}
                </span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row.status || 'INATIVO'" />
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end gap-1">
                <TableActions
                  :can-edit="can('clientes.editar')"
                  :can-delete="can('clientes.excluir')"
                  @edit="editarCliente(row.id)"
                  @delete="excluirCliente(row)"
                />
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { onlyNumbers } from '@/utils/masks'

definePage({ meta: { perm: 'clientes.ver' } })

const router = useRouter()
const filtro = ref('')
const loading = ref(false)
const clientes = ref([])

const columns = [
  { key: 'nome_completo', label: 'CLIENTE', width: '40%' },
  { key: 'endereco', label: 'ENDERECO', width: '25%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '20%' },
]

const filtrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return clientes.value || []

  const termoDigits = onlyNumbers(termo)

  return (clientes.value || []).filter((c) => {
    const texto = [
      c.nome_completo,
      c.razao_social,
      c.email,
      c.whatsapp,
      c.endereco,
      c.numero,
      c.bairro,
      c.cidade,
      c.estado,
      c.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const cpfDigits = onlyNumbers(String(c.cpf || ''))
    const cnpjDigits = onlyNumbers(String(c.cnpj || ''))
    const whatsappDigits = onlyNumbers(String(c.whatsapp || ''))

    return (
      texto.includes(termo) ||
      (termoDigits
        ? (
            cpfDigits.includes(termoDigits) ||
            cnpjDigits.includes(termoDigits) ||
            whatsappDigits.includes(termoDigits)
          )
        : false)
    )
  })
})

const rows = computed(() =>
  filtrados.value.map((c) => ({
    ...c,
    nome_exibicao: c.nome_completo || c.razao_social || '-',
    documento: c.cpf || c.cnpj || '',
    endereco_resumo: [c.endereco, c.numero, c.bairro].filter(Boolean).join(', ') || '-',
    status: String(c.status || 'INATIVO').toUpperCase(),
  })),
)

function editarCliente(id) {
  if (!can('clientes.editar')) return notify.error('Acesso negado.')
  router.push(`/clientes/${id}`)
}

async function carregarClientes() {
  loading.value = true
  try {
    const res = await ClienteService.listar()
    const payload = res?.data
    clientes.value = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []
  } catch (error) {
    console.error('Erro ao carregar clientes:', error)
    notify.error('Falha ao carregar clientes.')
    clientes.value = []
  } finally {
    loading.value = false
  }
}

async function excluirCliente(row) {
  if (!can('clientes.excluir')) return notify.error('Acesso negado.')

  const nome = row?.nome_exibicao || 'cliente'
  const ok = await confirm.show(
    'Excluir Cliente',
    `Deseja excluir o cliente "${nome}"? Esta acao nao pode ser desfeita.`,
  )
  if (!ok) return

  const cleanId = Number(row?.id)
  try {
    await ClienteService.remover(cleanId)
    clientes.value = clientes.value.filter((c) => Number(c.id) !== cleanId)
    notify.success('Cliente removido com sucesso.')
  } catch (e) {
    console.error('Erro ao excluir cliente:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(
      Array.isArray(apiMsg)
        ? apiMsg.join(' | ')
        : apiMsg || 'Nao foi possivel excluir o cliente.',
    )
  }
}

onMounted(async () => {
  if (!can('clientes.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }

  await carregarClientes()
})
</script>