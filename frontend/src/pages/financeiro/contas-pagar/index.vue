<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Contas a Pagar</h2>
          <p class="card-subtitle">Relatório de despesas por fornecedor + abatimento (Plano de Corte).</p>
        </div>

        <div class="header-actions">
          <Button variant="outline" size="md" label="Voltar" @click="router.back()" />
        </div>
      </header>

      <!-- Filtros simples (relatório) -->
      <div class="card-filter fp-filter">
        <div class="fp-filter__row">
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
            :options="STATUS_PAGAR_OPTIONS"
            placeholder="Todos"
            :colSpan="'col-span-4'"
          />

          <Input v-model="busca" label="Buscar" placeholder="Buscar por descrição / fornecedor / cobrador..." />
        </div>

        <div class="fp-filter__row fp-filter__row--actions">
          <Button
            variant="outline"
            size="md"
            label="Atualizar"
            :loading="loading"
            loadingText="Carregando..."
            @click="carregar"
          />
        </div>
      </div>

      <div class="card-body card-body--flush">
        <Table :columns="columns" :rows="rowsExibidas" :loading="loading">
          <template #cell-fornecedor="{ row }">
            <div>
              <strong>{{ fornecedorNome(row.fornecedor_id) }}</strong>
              <div class="cell-muted" v-if="row.fornecedor_cobrador_id">
                Cobrador: {{ fornecedorNome(row.fornecedor_cobrador_id) }}
              </div>
            </div>
          </template>

          <template #cell-vencimento="{ row }">
            {{ format.date(row.vencimento_em) }}
          </template>

          <template #cell-valores="{ row }">
            <div class="fp-values">
              <div><span class="cell-muted">Original:</span> <strong>{{ format.currency(num(row.valor_original)) }}</strong></div>
              <div><span class="cell-muted">Abatido:</span> {{ format.currency(num(row.valor_compensado)) }}</div>
              <div><span class="cell-muted">Aberto:</span> <strong>{{ format.currency(saldoPagar(row)) }}</strong></div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span class="fp-status">{{ row.status }}</span>
          </template>

<template #cell-acoes="{ row }">
  <div class="fp-actions">
    <Button
      variant="secondary"
      size="sm"
      label="Abater"
      :disabled="saldoPagar(row) <= 0"
      @click="abrirModalAbater(row)"
    />

    <Button
      variant="success"
      size="sm"
      label="Baixar"
      @click="abrirModalBaixar(row)"
    />
  </div>
</template>

        </Table>
      </div>
    </div>

    <!-- MODAL ABATIMENTO -->
<div v-if="modalBaixa.aberto" class="fp-modal-backdrop" @click.self="fecharModalBaixar">
  <div class="fp-modal" style="width:min(640px,100%);">
    <div class="fp-modal__header">
      <div>
        <h3 class="fp-modal__title">Baixar conta a pagar</h3>
        <p class="fp-modal__subtitle">
          #{{ modalBaixa.conta?.id }} — {{ fornecedorNome(modalBaixa.conta?.fornecedor_id) }}
        </p>
      </div>
      <Button variant="outline" size="sm" label="Fechar" @click="fecharModalBaixar" />
    </div>

    <div class="fp-modal__body">
      <div class="form-grid">
        <div class="col-span-6 form-group">
          <Input v-model="modalBaixa.pago_em" type="date" label="Data do pagamento" />
        </div>

        <div class="col-span-6 form-group">
          <Input v-model="modalBaixa.status" label="Status (constante)" placeholder="Ex: PAGO" />
        </div>

        <div class="col-span-12 fp-box">
          <div class="fp-box__row">
            <span class="cell-muted">Valor em aberto</span>
            <strong>{{ format.currency(saldoPagar(modalBaixa.conta)) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="fp-modal__footer footer-between">
      <span class="cell-muted">Confirma a baixa?</span>
      <div class="header-actions">
        <Button variant="outline" size="md" label="Cancelar" @click="fecharModalBaixar" />
        <Button
          variant="primary"
          size="md"
          label="Confirmar"
          :loading="modalBaixa.salvando"
          loadingText="Salvando..."
          @click="confirmarBaixa"
        />
      </div>
    </div>
  </div>
</div>
    <!-- MODAL ABATIMENTO -->   
          <!-- resumo conta pagar -->
          <div class="fp-box">
            <div class="fp-box__row">
              <span class="cell-muted">Vencimento</span>
              <strong>{{ format.date(modal.conta?.vencimento_em) }}</strong>
            </div>
            <div class="fp-box__row">
              <span class="cell-muted">Valor em aberto</span>
              <strong>{{ format.currency(saldoPagar(modal.conta)) }}</strong>
            </div>
            <div class="fp-box__row" v-if="modal.conta?.descricao">
              <span class="cell-muted">Descrição</span>
              <span>{{ modal.conta?.descricao }}</span>
            </div>
          </div>

          <div class="fp-section-title">
            <h4 class="fp-section-title__text">Créditos disponíveis (Contas a Receber)</h4>
            <span class="cell-muted">Selecione créditos e valores para abater.</span>
          </div>

          <div v-if="modal.loadingCreditos" class="fp-state">Carregando créditos...</div>
          <div v-else-if="!modal.creditos.length" class="fp-state">
            Nenhum crédito disponível para este fornecedor.
          </div>

          <div v-else class="fp-creditos">
            <div v-for="c in modal.creditos" :key="c.id" class="fp-credito">
              <label class="fp-credito__check">
                <input type="checkbox" v-model="c._selecionado" />
                <span>
                  <strong>#{{ c.id }}</strong>
                  <span class="cell-muted">• {{ c.origem_tipo || 'SEM_ORIGEM' }} {{ c.origem_id ? `#${c.origem_id}` : '' }}</span>
                </span>
              </label>

              <div class="fp-credito__meta">
                <div class="cell-muted">
                  Original: {{ format.currency(num(c.valor_original)) }}
                  • Abatido: {{ format.currency(num(c.valor_compensado)) }}
                </div>
                <div>
                  <span class="cell-muted">Aberto:</span>
                  <strong>{{ format.currency(saldoReceber(c)) }}</strong>
                </div>
              </div>

              <div class="fp-credito__valor">
                <Input
                  v-model="c._valor_abater"
                  type="number"
                  label="Valor a abater"
                  :disabled="!c._selecionado"
                  placeholder="0.00"
                />
                <Button
                  variant="outline"
                  size="sm"
                  label="Máximo"
                  :disabled="!c._selecionado"
                  @click="setMaximo(c)"
                />
              </div>
            </div>
          </div>

          <!-- opções de status (não inventa: você troca pelos seus valores de constante) -->
          <div class="fp-section-title" style="margin-top: 16px;">
            <h4 class="fp-section-title__text">Status (opcional)</h4>
            <span class="cell-muted">Se quiser, atualiza status do pagar/receber após o abatimento.</span>
          </div>

          <div class="form-grid">
            <div class="col-span-6 form-group">
              <Input v-model="modal.status_pagar" label="Status conta a pagar" placeholder="(constante)" />
            </div>
            <div class="col-span-6 form-group">
              <Input v-model="modal.status_receber" label="Status conta a receber" placeholder="(constante)" />
            </div>
          </div>
        </div>

        <div class="fp-modal__footer footer-between">
          <span class="cell-muted">
            Total selecionado: <b>{{ format.currency(totalSelecionado) }}</b>
          </span>

          <div class="header-actions">
            <Button variant="outline" size="md" label="Cancelar" @click="fecharModal" />
            <Button
              variant="primary"
              size="md"
              label="Confirmar abatimento"
              :loading="modal.salvando"
              loadingText="Salvando..."
              :disabled="totalSelecionado <= 0 || totalSelecionado > saldoPagar(modal.conta)"
              @click="confirmarAbatimento"
            />
      
    </div>
  </div>
</template>

<script setup>
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

// filtros (relatório)
const filtroFornecedorId = ref(null)
const filtroStatus = ref(null)

// ⚠️ depois você troca para suas CONSTANTES oficiais
const STATUS_PAGAR_OPTIONS = [
  { label: 'Todos', value: null },
  // { label: 'EM ABERTO', value: 'EM_ABERTO' },
  // { label: 'PAGO', value: 'PAGO' },
]

const fornecedores = ref([])
const contas = ref([])

const columns = [
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'vencimento', label: 'Vencimento', width: '140px' },
  { key: 'valores', label: 'Valores', width: '280px' },
  { key: 'status', label: 'Status', width: '140px' },
  { key: 'acoes', label: '', width: '200px' },
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

const modalBaixa = reactive({
  aberto: false,
  conta: null,
  pago_em: new Date().toISOString().slice(0, 10),
  status: '',
  salvando: false,
})

function abrirModalBaixar(conta) {
  modalBaixa.aberto = true
  modalBaixa.conta = conta
  modalBaixa.pago_em = new Date().toISOString().slice(0, 10)
  modalBaixa.status = '' // constante decide
}

function fecharModalBaixar() {
  modalBaixa.aberto = false
  modalBaixa.conta = null
  modalBaixa.pago_em = new Date().toISOString().slice(0, 10)
  modalBaixa.status = ''
}

async function confirmarBaixa() {
  if (!modalBaixa.conta) return
  modalBaixa.salvando = true
  try {
    await api.post(`/financeiro/contas-pagar/${modalBaixa.conta.id}/pagar`, {
      pago_em: new Date(`${modalBaixa.pago_em}T12:00:00`).toISOString(),
      status: modalBaixa.status?.trim() ? modalBaixa.status.trim() : undefined,
    })
    fecharModalBaixar()
    await carregar()
  } finally {
    modalBaixa.salvando = false
  }
}


function saldoPagar(row) {
  if (!row) return 0
  const aberto = num(row.valor_original) - num(row.valor_compensado)
  return Math.max(0, Math.round((aberto + Number.EPSILON) * 100) / 100)
}

function saldoReceber(row) {
  if (!row) return 0
  const aberto = num(row.valor_original) - num(row.valor_compensado)
  return Math.max(0, Math.round((aberto + Number.EPSILON) * 100) / 100)
}

const rowsExibidas = computed(() => {
  let rows = [...(contas.value || [])]

  // filtro fornecedor (backend filtra também, mas aqui garante)
  if (filtroFornecedorId.value) {
    rows = rows.filter((r) => Number(r.fornecedor_id) === Number(filtroFornecedorId.value))
  }

  // filtro status (se definido)
  if (filtroStatus.value) {
    rows = rows.filter((r) => String(r.status || '') === String(filtroStatus.value))
  }

  // busca simples
  const q = String(busca.value || '').toLowerCase().trim()
  if (q) {
    rows = rows.filter((r) => {
      const f1 = fornecedorNome(r.fornecedor_id).toLowerCase()
      const f2 = fornecedorNome(r.fornecedor_cobrador_id).toLowerCase()
      const desc = String(r.descricao || '').toLowerCase()
      return f1.includes(q) || f2.includes(q) || desc.includes(q)
    })
  }

  // ordena por vencimento
  rows.sort((a, b) => new Date(a.vencimento_em) - new Date(b.vencimento_em))
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

    const { data } = await api.get('/financeiro/contas-pagar', { params })
    contas.value = data || []
  } finally {
    loading.value = false
  }
}

/* ===== MODAL ABATIMENTO ===== */
const modal = reactive({
  aberto: false,
  conta: null,
  creditos: [],
  loadingCreditos: false,
  salvando: false,

  // status opcionais (você vai usar sua constante)
  status_pagar: '',
  status_receber: '',
})

function fecharModal() {
  modal.aberto = false
  modal.conta = null
  modal.creditos = []
  modal.status_pagar = ''
  modal.status_receber = ''
}

function setMaximo(c) {
  const max = saldoReceber(c)
  c._valor_abater = max
}

async function abrirModalAbater(conta) {
  modal.aberto = true
  modal.conta = conta
  modal.creditos = []
  modal.loadingCreditos = true

  try {
    // busca créditos do mesmo fornecedor
    const { data } = await api.get('/financeiro/contas-receber', {
      params: { fornecedor_id: Number(conta.fornecedor_id) },
    })

    // prepara UI
    const lista = (data || []).map((c) => {
      const aberto = saldoReceber(c)
      return {
        ...c,
        _selecionado: false,
        _valor_abater: aberto > 0 ? aberto : 0,
      }
    })

    // só os que tem saldo
    modal.creditos = lista.filter((c) => saldoReceber(c) > 0)
  } finally {
    modal.loadingCreditos = false
  }
}

const totalSelecionado = computed(() => {
  return Math.round(
    (modal.creditos || [])
      .filter((c) => c._selecionado)
      .reduce((acc, c) => acc + num(c._valor_abater), 0) * 100,
  ) / 100
})

async function confirmarAbatimento() {
  const conta = modal.conta
  if (!conta) return

  const itens = (modal.creditos || [])
    .filter((c) => c._selecionado)
    .map((c) => ({
      conta_pagar_id: Number(conta.id),
      conta_receber_id: Number(c.id),
      valor: num(c._valor_abater),
    }))
    .filter((x) => x.valor > 0)

  if (!itens.length) return alert('Selecione ao menos 1 crédito e informe o valor.')

  // trava para não passar do saldo
  if (totalSelecionado.value > saldoPagar(conta)) {
    return alert('O total do abatimento não pode ser maior que o valor em aberto da conta a pagar.')
  }

  modal.salvando = true
  try {
    const payload = {
      itens,
      status_conta_pagar: String(modal.status_pagar || '').trim() ? String(modal.status_pagar).trim() : undefined,
      status_conta_receber: String(modal.status_receber || '').trim() ? String(modal.status_receber).trim() : undefined,
    }

    await api.post(`/financeiro/fornecedores/${Number(conta.fornecedor_id)}/compensar`, payload)

    fecharModal()
    await carregar()
  } catch (e) {
    alert('Erro ao salvar abatimento.')
  } finally {
    modal.salvando = false
  }
}

onMounted(async () => {
  await carregarFornecedores()
  await carregar()
})
</script>
