<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Contas a Receber</h2>
          <p class="card-subtitle">Relatório de receitas (Cliente + Plano de Corte) com baixa de recebimento.</p>
        </div>

        <div class="header-actions">
          <Button variant="outline" size="md" label="Voltar" @click="router.back()" />
          <Button
            variant="outline"
            size="md"
            label="Atualizar"
            :loading="loading"
            loadingText="Carregando..."
            @click="carregar"
          />
        </div>
      </header>

      <!-- filtros (relatório) -->
      <div class="card-filter fr-filter">
        <div class="fr-filter__row">
          <SearchInput
            v-model="filtroFornecedorId"
            label="Fornecedor"
            :options="fornecedoresOptions"
            placeholder="Selecione..."
            :colSpan="'col-span-4'"
          />

          <SearchInput
            v-model="filtroStatus"
            label="Status"
            :options="STATUS_RECEBER_OPTIONS"
            placeholder="Todos"
            :colSpan="'col-span-4'"
          />

          <Input v-model="busca" label="Buscar" placeholder="Buscar por origem / descrição / fornecedor..." />
        </div>
      </div>

      <div class="card-body card-body--flush">
        <Table :columns="columns" :rows="rowsExibidas" :loading="loading">
          <template #cell-origem="{ row }">
            <div class="fr-origem">
              <strong>{{ origemLabel(row.origem_tipo, row.origem_id) }}</strong>
              <div class="cell-muted" v-if="row.descricao">{{ row.descricao }}</div>
            </div>
          </template>

          <template #cell-fornecedor="{ row }">
            <div>
              <strong>{{ fornecedorNome(row.fornecedor_id) }}</strong>
              <div class="cell-muted">Fornecedor ID: {{ row.fornecedor_id }}</div>
            </div>
          </template>

          <template #cell-vencimento="{ row }">
            <span v-if="row.vencimento_em">{{ format.date(row.vencimento_em) }}</span>
            <span v-else class="cell-muted">—</span>
          </template>

          <template #cell-valores="{ row }">
            <div class="fr-values">
              <div><span class="cell-muted">Original:</span> <strong>{{ format.currency(num(row.valor_original)) }}</strong></div>
              <div><span class="cell-muted">Abatido:</span> {{ format.currency(num(row.valor_compensado)) }}</div>
              <div><span class="cell-muted">Aberto:</span> <strong>{{ format.currency(saldoReceber(row)) }}</strong></div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span class="fr-status">{{ row.status }}</span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="fr-actions">
              <Button
                variant="primary"
                size="sm"
                label="Baixar"
                :disabled="saldoReceber(row) <= 0"
                @click="abrirModalBaixar(row)"
              />
            </div>
          </template>
        </Table>
      </div>
    </div>

    <!-- MODAL BAIXA -->
    <div v-if="modal.aberto" class="fr-modal-backdrop" @click.self="fecharModal">
      <div class="fr-modal">
        <div class="fr-modal__header">
          <div>
            <h3 class="fr-modal__title">Baixar recebimento</h3>
            <p class="fr-modal__subtitle">
              <b>#{{ modal.conta?.id }}</b> — {{ origemLabel(modal.conta?.origem_tipo, modal.conta?.origem_id) }}
            </p>
          </div>

          <Button variant="outline" size="sm" label="Fechar" @click="fecharModal" />
        </div>

        <div class="fr-modal__body">
          <div class="fr-box">
            <div class="fr-box__row">
              <span class="cell-muted">Fornecedor</span>
              <strong>{{ fornecedorNome(modal.conta?.fornecedor_id) }}</strong>
            </div>

            <div class="fr-box__row">
              <span class="cell-muted">Valor em aberto</span>
              <strong>{{ format.currency(saldoReceber(modal.conta)) }}</strong>
            </div>
          </div>

          <div class="form-grid">
            <div class="col-span-6 form-group">
              <Input v-model="modal.recebido_em" type="date" label="Data do recebimento" />
            </div>

            <div class="col-span-6 form-group">
              <!-- status vem da constante (você define) -->
              <Input v-model="modal.status" label="Status (constante)" placeholder="Ex: RECEBIDO" />
            </div>

            <div class="col-span-12 form-group">
              <Input v-model="modal.observacao" label="Observação" placeholder="Opcional..." />
            </div>
          </div>
        </div>

        <div class="fr-modal__footer footer-between">
          <span class="cell-muted">Confirma a baixa?</span>
          <div class="header-actions">
            <Button variant="outline" size="md" label="Cancelar" @click="fecharModal" />
            <Button
              variant="primary"
              size="md"
              label="Confirmar"
              :loading="modal.salvando"
              loadingText="Salvando..."
              @click="confirmarBaixa"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import '@/assets/CSS/financeiro-contas-receber.css'
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import { format } from '@/utils/format'

import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Table from '@/components/ui/Table.vue'

const router = useRouter()

const loading = ref(false)
const busca = ref('')

// filtros
const filtroFornecedorId = ref(null)
const filtroStatus = ref(null)

// ⚠️ depois você troca para suas CONSTANTES oficiais
const STATUS_RECEBER_OPTIONS = [
  { label: 'Todos', value: null },
  // { label: 'EM ABERTO', value: 'EM_ABERTO' },
  // { label: 'RECEBIDO', value: 'RECEBIDO' },
]

const fornecedores = ref([])
const contas = ref([])

const columns = [
  { key: 'origem', label: 'Origem' },
  { key: 'fornecedor', label: 'Fornecedor', width: '260px' },
  { key: 'vencimento', label: 'Vencimento', width: '140px' },
  { key: 'valores', label: 'Valores', width: '280px' },
  { key: 'status', label: 'Status', width: '140px' },
  { key: 'acoes', label: '', width: '140px' },
]

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fornecedorNome(id) {
  if (!id) return ''
  const f = fornecedores.value.find((x) => Number(x.id) === Number(id))
  return f?.razao_social || f?.nome_fantasia || `Fornecedor #${id}`
}

const fornecedoresOptions = computed(() =>
  fornecedores.value.map((f) => ({
    value: f.id,
    label: f.razao_social || f.nome_fantasia || `Fornecedor #${f.id}`,
  })),
)

function saldoReceber(row) {
  if (!row) return 0
  const aberto = num(row.valor_original) - num(row.valor_compensado)
  return Math.max(0, Math.round((aberto + Number.EPSILON) * 100) / 100)
}

function origemLabel(tipo, id) {
  const t = String(tipo || '').toUpperCase()
  if (!t) return 'Sem origem'
  if (t.includes('PLANO')) return `Plano de Corte #${id || ''}`.trim()
  if (t.includes('VENDA')) return `Venda #${id || ''}`.trim()
  // fallback
  return `${t} ${id ? `#${id}` : ''}`.trim()
}

const rowsExibidas = computed(() => {
  let rows = [...(contas.value || [])]

  if (filtroFornecedorId.value) {
    rows = rows.filter((r) => Number(r.fornecedor_id) === Number(filtroFornecedorId.value))
  }

  if (filtroStatus.value) {
    rows = rows.filter((r) => String(r.status || '') === String(filtroStatus.value))
  }

  const q = String(busca.value || '').toLowerCase().trim()
  if (q) {
    rows = rows.filter((r) => {
      const forn = fornecedorNome(r.fornecedor_id).toLowerCase()
      const desc = String(r.descricao || '').toLowerCase()
      const org = `${r.origem_tipo || ''} ${r.origem_id || ''}`.toLowerCase()
      return forn.includes(q) || desc.includes(q) || org.includes(q)
    })
  }

  // ordena por vencimento (sem vencimento vai pro final)
  rows.sort((a, b) => {
    const da = a.vencimento_em ? new Date(a.vencimento_em).getTime() : Number.POSITIVE_INFINITY
    const db = b.vencimento_em ? new Date(b.vencimento_em).getTime() : Number.POSITIVE_INFINITY
    return da - db
  })

  return rows
})

async function carregarFornecedores() {
  const { data } = await api.get('/fornecedores')
  fornecedores.value = data || []
}

async function carregar() {
  loading.value = true
  try {
    const params = {}
    if (filtroFornecedorId.value) params.fornecedor_id = Number(filtroFornecedorId.value)
    if (filtroStatus.value) params.status = String(filtroStatus.value)

    const { data } = await api.get('/financeiro/contas-receber', { params })
    contas.value = data || []
  } finally {
    loading.value = false
  }
}

/* ===== MODAL BAIXA ===== */
const modal = reactive({
  aberto: false,
  conta: null,
  recebido_em: new Date().toISOString().slice(0, 10),
  status: '',
  observacao: '',
  salvando: false,
})

function abrirModalBaixar(conta) {
  modal.aberto = true
  modal.conta = conta
  modal.recebido_em = new Date().toISOString().slice(0, 10)
  modal.status = '' // constante define
  modal.observacao = ''
}

function fecharModal() {
  modal.aberto = false
  modal.conta = null
  modal.recebido_em = new Date().toISOString().slice(0, 10)
  modal.status = ''
  modal.observacao = ''
}

async function confirmarBaixa() {
  if (!modal.conta) return

  // data no meio-dia pra evitar “voltar um dia” por timezone
  const iso = new Date(`${modal.recebido_em}T12:00:00`).toISOString()

  modal.salvando = true
  try {
    await api.post(`/financeiro/contas-receber/${modal.conta.id}/receber`, {
      recebido_em: iso,
      status: modal.status?.trim() ? modal.status.trim() : undefined,
    })

    // observação (se seu backend aceitar no PATCH, deixo pronto)
    if (modal.observacao?.trim()) {
      await api.patch(`/financeiro/contas-receber/${modal.conta.id}`, {
        observacao: modal.observacao.trim(),
      })
    }

    fecharModal()
    await carregar()
  } catch (e) {
    alert('Erro ao dar baixa no recebimento.')
  } finally {
    modal.salvando = false
  }
}

onMounted(async () => {
  await carregarFornecedores()
  await carregar()
})
</script>
