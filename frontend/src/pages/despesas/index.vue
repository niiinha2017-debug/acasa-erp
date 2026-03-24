<template>
  <PageShell :padded="false">
    <section class="despesas-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Despesas Gerais"
        subtitle="Registro de despesas operacionais, receitas e status financeiros"
        icon="pi pi-wallet"
      >
        <template #actions>
          <div class="despesas-list__actions ds-page-context__actions">
            <div class="despesas-list__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar descrição, categoria, responsável, status ou valor..."
              />
            </div>

            <MonthReferenceField
              v-model="mesReferencia"
              class="despesas-list__date-field"
              label="Mês de referência"
            />

            <Button
              v-if="can('despesas.criar')"
              variant="primary"
              @click="novo"
            >
              <i class="pi pi-plus"></i>
              Novo lançamento
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="despesas-list__content ds-page-context__content space-y-6">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhuma movimentação registrada."
          :boxed="false"
          :flush="false"
        >
          <template #cell-descricao="{ row }">
            <div class="despesas-list__identity">
              <div class="despesas-list__initials" :class="row.tipo_class">
                {{ row.tipo_abrev }}
              </div>
              <div class="despesas-list__identity-copy">
                <span class="despesas-list__primary">
                  {{ row.descricao_exibicao }}
                </span>
                <span class="despesas-list__secondary">
                  {{ row.categoria_exibicao }}
                  <span v-if="row.contexto_exibicao" class="despesas-list__secondary-detail">{{ row.contexto_exibicao }}</span>
                </span>
              </div>
            </div>
          </template>

          <template #cell-tipo="{ row }">
            <span class="ds-status-pill" :class="row.tipo_pill_class">
              {{ row.tipo_exibicao }}
            </span>
          </template>

          <template #cell-data="{ row }">
            <span class="despesas-list__date">{{ format.date(row.data_exibicao) }}</span>
          </template>

          <template #cell-valor="{ row }">
            <span class="despesas-list__amount" :class="row.valor_class">
              {{ row.valor_prefixo }}{{ format.currency(row.valor_exibicao) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <span class="ds-status-pill" :class="row.status_class">
              {{ row.status_exibicao }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="despesas.editar"
                perm-delete="despesas.excluir"
                @edit="() => editar(row)"
                @delete="() => confirmarExcluir(row)"
              />
            </div>
          </template>
        </Table>

        <TablePagination
          v-if="total > 0"
          :page="page"
          :page-size="pageSize"
          :total="total"
          @update:page="setPage"
        />
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { DespesaService } from '@/services/index'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'
import { format } from '@/utils/format'
import { usePagination } from '@/composables/usePagination'

definePage({ meta: { perm: 'despesas.ver' } })

function getMesReferenciaAtual() {
  const dataAtual = new Date()
  const ano = dataAtual.getFullYear()
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

function intervaloDoMesReferencia(mesRef) {
  const [anoStr, mesStr] = String(mesRef || '').split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)

  if (!ano || !mes) {
    const fallback = getMesReferenciaAtual()
    return intervaloDoMesReferencia(fallback)
  }

  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0)
  return {
    data_ini: inicio.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
  }
}

const router = useRouter()
const loading = ref(false)
const despesas = ref([])
const filtro = ref('')
const mesReferencia = ref(getMesReferenciaAtual())
const filtros = ref(intervaloDoMesReferencia(mesReferencia.value))

const columns = [
  { key: 'descricao', label: 'Lançamento', width: '38%' },
  { key: 'tipo', label: 'TIPO', width: '12%' },
  { key: 'data', label: 'DATA', width: '15%' },
  { key: 'valor', label: 'VALOR', width: '15%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '12%' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '10%' },
]

const despesasExibir = computed(() =>
  despesas.value.map((despesa) => {
    const base = despesa.local || despesa.categoria || 'Sem descrição'
    const parcela = despesa.parcelas_total > 1 && despesa.parcela_numero
      ? ` ${despesa.parcela_numero}/${despesa.parcelas_total}`
      : ''

    return {
      ...despesa,
      descricao: `${base}${parcela}`.trim(),
      tipo: despesa.tipo_movimento || despesa.tipo,
      data: despesa.data_vencimento || despesa.data_registro || despesa.data,
      valor: despesa.valor_total ?? despesa.valor,
    }
  }),
)

const filtradas = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return despesasExibir.value

  const palavras = termo.split(/\s+/).filter(Boolean)
  return despesasExibir.value.filter((despesa) => {
    const textoBusca = [
      despesa.descricao,
      despesa.categoria,
      despesa.local,
      despesa.unidade,
      despesa.status,
      despesa.tipo,
      despesa.funcionario?.nome_completo,
      despesa.funcionario?.nome,
      despesa.valor,
      despesa.data ? format.date(despesa.data) : '',
    ]
      .map((valor) => String(valor || '').toLowerCase())
      .join(' ')

    return palavras.every((palavra) => textoBusca.includes(palavra))
  })
})

const { page, setPage, total, pageSize, rowsToShow } = usePagination(
  filtradas,
  { pageSize: 15 },
)

watch(filtro, () => setPage(1))

watch(mesReferencia, async (novoMes) => {
  filtros.value = intervaloDoMesReferencia(novoMes)
  setPage(1)
  if (can('despesas.ver')) await carregar()
})

const rows = computed(() =>
  rowsToShow.value.map((row) => {
    const tipo = String(row.tipo || '').toUpperCase()
    const status = statusExibicao(row)
    const funcionario = row.funcionario?.nome_completo || row.funcionario?.nome || ''
    const unidade = String(row.unidade || '').trim()

    return {
      ...row,
      tipo_abrev: tipo === 'ENTRADA' ? 'EN' : 'SD',
      tipo_exibicao: tipo === 'ENTRADA' ? 'Receita' : 'Despesa',
      tipo_class: tipo === 'ENTRADA' ? 'despesas-list__initials--success' : 'despesas-list__initials--danger',
      tipo_pill_class: tipo === 'ENTRADA' ? 'ds-status-pill--success' : 'ds-status-pill--danger',
      descricao_exibicao: row.descricao || `Lançamento #${row.id}`,
      categoria_exibicao: row.categoria || 'Sem categoria',
      contexto_exibicao: [unidade, funcionario].filter(Boolean).join(' • '),
      data_exibicao: row.data,
      valor_exibicao: Number(row.valor || 0),
      valor_prefixo: tipo === 'SAIDA' ? '−' : '',
      valor_class: tipo === 'ENTRADA' ? 'despesas-list__amount--success' : 'despesas-list__amount--danger',
      status_exibicao: status,
      status_class: statusClass(status),
    }
  }),
)

function statusExibicao(row) {
  const statusAtual = String(row.status || 'EM_ABERTO').toUpperCase()
  if (statusAtual === 'PAGO') return 'PAGO'

  const vencimento = row.data_vencimento || row.data
  if (!vencimento) return statusAtual

  const dataVencimento = new Date(vencimento)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  dataVencimento.setHours(0, 0, 0, 0)

  if (statusAtual === 'EM_ABERTO' && dataVencimento < hoje) return 'VENCIDO'
  return statusAtual
}

function statusClass(status) {
  if (status === 'PAGO') return 'ds-status-pill--success'
  if (status === 'VENCIDO') return 'ds-status-pill--warning'
  return 'ds-status-pill--neutral'
}

async function carregar() {
  if (!can('despesas.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const params = {}
    if (filtros.value.data_ini) params.data_ini = filtros.value.data_ini
    if (filtros.value.data_fim) params.data_fim = filtros.value.data_fim
    const resposta = await DespesaService.listar(params)
    const data = resposta?.data ?? resposta
    despesas.value = Array.isArray(data) ? data : []
  } catch (error) {
    notify.error('Erro ao carregar despesas.')
  } finally {
    loading.value = false
  }
}

function novo() {
  router.push('/despesas/novo')
}

function editar(row) {
  router.push(`/despesas/${row.id}`)
}

async function confirmarExcluir(row) {
  if (!can('despesas.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Registro',
    `Deseja remover "${row.local || row.categoria || row.descricao || 'este registro'}"?`,
  )
  if (!ok) return

  try {
    await DespesaService.remover(Number(row.id))
    notify.success('Registro removido.')
    await carregar()
  } catch (error) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (can('despesas.ver')) await carregar()
})
</script>

<style scoped>
.despesas-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.despesas-list__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16rem auto;
  justify-content: end;
  align-items: end;
  gap: 0.75rem;
  width: 100%;
}

.despesas-list__search {
  display: flex;
  align-items: flex-end;
  min-width: 0;
  width: 100%;
  flex: 0 0 auto;
}

.despesas-list__date-field {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  min-width: 0;
  width: 100%;
}

.despesas-list :deep(.ds-header-block) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(32rem, 42rem);
  align-items: start;
}

.despesas-list :deep(.ds-header-actions) {
  width: 100%;
  min-width: 0;
}

.despesas-list :deep(.ds-page-context__actions) {
  width: 100%;
  flex-wrap: nowrap;
}

.despesas-list :deep(.ds-page-context__search) {
  width: auto;
  order: 0;
}

.despesas-list__date-label {
  color: var(--ds-color-text-faint);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding-left: 0.2rem;
}

.despesas-list__date-shell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0 0.9rem;
  border-radius: 1rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-raised, #fff);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.despesas-list__date-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-faint);
  font-size: 0.82rem;
  flex-shrink: 0;
}

.despesas-list__date-input {
  height: 2.75rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 0.78rem;
  font-weight: 700;
  outline: none;
}

.despesas-list__date-shell:focus-within {
  border-color: rgba(16, 88, 168, 0.35);
  box-shadow: 0 0 0 3px rgba(16, 88, 168, 0.08);
}

.despesas-list__date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.7;
}

.despesas-list__identity {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.despesas-list__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.05rem;
  height: 2.05rem;
  border-radius: 0.72rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.92);
  color: var(--ds-color-text-faint);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.despesas-list__initials--success {
  color: var(--ds-color-success-700);
  border-color: rgba(148, 226, 178, 0.78);
  background: rgba(236, 252, 242, 0.95);
}

.despesas-list__initials--danger {
  color: var(--ds-color-danger-700);
  border-color: rgba(254, 205, 211, 0.86);
  background: rgba(255, 241, 242, 0.95);
}

.despesas-list__identity-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.despesas-list__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.35;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.despesas-list__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.despesas-list__secondary-detail {
  margin-left: 0.5rem;
}

.despesas-list__date {
  color: var(--ds-color-text);
  font-size: 0.8rem;
  font-weight: 520;
}

.despesas-list__amount {
  color: var(--ds-color-text);
  font-size: 0.88rem;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
}

.despesas-list__amount--success {
  color: var(--ds-color-success-700);
}

.despesas-list__amount--danger {
  color: var(--ds-color-danger-700);
}

.despesas-list :deep(.ds-status-pill) {
  max-width: 100%;
  justify-content: center;
  padding-inline: 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .despesas-list :deep(.ds-header-block) {
    display: flex;
  }

  .despesas-list :deep(.ds-page-context__actions) {
    flex-wrap: wrap;
  }

  .despesas-list :deep(.ds-page-context__search) {
    width: 100%;
    order: 1;
  }

  .despesas-list__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: stretch;
    align-items: stretch;
  }

  .despesas-list__search,
  .despesas-list__date-field {
    min-width: 100%;
    flex-basis: 100%;
  }

  .despesas-list__primary,
  .despesas-list__secondary {
    white-space: normal;
  }
}
</style>
