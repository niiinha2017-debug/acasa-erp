<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Venda #{{ id }}</h2>
          <p class="card-subtitle">Editar venda, itens e comissões.</p>
        </div>
        <div class="header-actions">
          <Button 
            variant="outline" 
            size="md" 
            label="Voltar" 
            @click="router.push('/vendas')" 
          />
        </div>
      </header>

      <div class="card-body">
        <div v-if="loading" class="page-state">Carregando...</div>

        <div v-else class="form-grid">
          <div class="col-span-12 section-title">
            <h3 class="card-title section-title__text">Dados</h3>
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.cliente_id" type="number" label="Cliente (ID)" required />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.orcamento_id" type="number" label="Orçamento (ID)" />
          </div>

          <div class="col-span-4 form-group">
            <SearchInput
              v-model="form.status"
              label="Status"
              :options="STATUS_VENDA"
              placeholder="Selecione..."
              :colSpan="'col-span-4'"
              required
            />
          </div>

          <div class="col-span-12 form-group">
            <Input v-model="form.observacao" label="Observação" />
          </div>

          <div class="col-span-12 section-title">
            <h3 class="card-title section-title__text">Pagamento e Taxas</h3>
          </div>

          <div class="col-span-4 form-group">
            <SearchInput
              v-model="form.forma_pagamento_chave"
              label="Forma de pagamento"
              :options="FORMAS_PAGAMENTO"
              placeholder="Selecione..."
              :colSpan="'col-span-4'"
            />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.taxa_pagamento_percentual_aplicado" type="number" label="Taxa do pagamento (%)" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.taxa_nota_fiscal_percentual_aplicado" type="number" label="Nota fiscal (%)" />
          </div>

          <div class="col-span-12 section-title header-between">
            <h3 class="card-title section-title__text">Itens</h3>
            <Button variant="secondary" size="sm" label="+ Adicionar item" @click="addItem" />
          </div>

          <div class="col-span-12">
            <div class="mini-table">
              <div class="mini-head">
                <span>Ambiente</span>
                <span>Descrição</span>
                <span>Qtd</span>
                <span>Unitário</span>
                <span>Total</span>
                <span></span>
              </div>

              <div v-for="(it, idx) in form.itens" :key="idx" class="mini-row">
                <Input v-model="it.nome_ambiente" />
                <Input v-model="it.descricao" />
                <Input v-model="it.quantidade" type="number" />
                <Input v-model="it.valor_unitario" type="number" />
                <div class="mini-total">{{ format(totalItem(it)) }}</div>
                <Button variant="danger" size="sm" label="Remover" @click="removerItem(idx)" />
              </div>
            </div>
          </div>

          <div class="col-span-12 section-title header-between">
            <h3 class="card-title section-title__text">Comissões</h3>
            <Button variant="secondary" size="sm" label="+ Adicionar comissão" @click="addComissao" />
          </div>

          <div class="col-span-12">
            <div class="mini-table">
              <div class="mini-head">
                <span>Tipo</span>
                <span>%</span>
                <span>Responsável</span>
                <span>Valor</span>
                <span></span>
              </div>

              <div v-for="(c, idx) in form.comissoes" :key="idx" class="mini-row mini-row--4">
                <SearchInput v-model="c.tipo_comissao_chave" :options="TIPOS_COMISSAO" placeholder="Selecione..." />
                <SearchInput v-model="c.percentual_aplicado" :options="PERCENTUAIS_COMISSAO" placeholder="Ex: 3" />
                <Input v-model="c.responsavel_nome" placeholder="Opcional..." />
                <div class="mini-total">{{ format(valorComissao(c)) }}</div>
                <Button variant="danger" size="sm" label="Remover" @click="removerComissao(idx)" />
              </div>
            </div>
          </div>

          <div class="col-span-12 section-title">
            <h3 class="card-title section-title__text">Totais (Preview)</h3>
          </div>

          <div class="col-span-3 form-group">
            <Input :modelValue="format(valorBruto)" label="Valor bruto" readonly />
          </div>
          <div class="col-span-3 form-group">
            <Input :modelValue="format(valorTaxaPagamento)" label="Taxa pagamento" readonly />
          </div>
          <div class="col-span-3 form-group">
            <Input :modelValue="format(valorNotaFiscal)" label="Nota fiscal" readonly />
          </div>
          <div class="col-span-3 form-group">
            <Input :modelValue="format(valorTotal)" label="Total" readonly />
          </div>
        </div>
      </div>

      <footer class="card-footer footer-between">
        <div class="footer-left">
          <Button
            variant="danger"
            size="md"
            label="Excluir"
            :loading="excluindo"
            loadingText="Excluindo..."
            @click="excluir"
          />
        </div>

        <div class="footer-right flex gap-2">
          <Button
            variant="secondary"
            size="md"
            label="Encaminhar para Produção"
            :loading="encaminhando"
            loadingText="Encaminhando..."
            @click="encaminharParaProducao"
          />

          <Button
            variant="primary"
            size="md"
            label="Salvar Alterações"
            :loading="salvando"
            loadingText="Salvando..."
            @click="salvar"
          />
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import api from '@/services/api'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()


const id = Number(route.params.id)

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const encaminhando = ref(false)


// Constantes (depois migra pro arquivo geral)
const STATUS_VENDA = [
  { label: 'RASCUNHO', value: 'RASCUNHO' },
  { label: 'FECHADA', value: 'FECHADA' },
  { label: 'CANCELADA', value: 'CANCELADA' },
]
const FORMAS_PAGAMENTO = [
  { label: 'DINHEIRO', value: 'DINHEIRO' },
  { label: 'PIX', value: 'PIX' },
  { label: 'CARTÃO', value: 'CARTAO' },
]
const TIPOS_COMISSAO = [
  { label: 'VENDEDOR', value: 'VENDEDOR' },
  { label: 'ARQUITETO', value: 'ARQUITETO' },
  { label: 'PROJETISTA', value: 'PROJETISTA' },
]
const PERCENTUAIS_COMISSAO = [
  { label: '3%', value: 3 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
]

const form = reactive({
  cliente_id: '',
  orcamento_id: '',
  status: 'RASCUNHO',
  observacao: '',
  forma_pagamento_chave: '',
  taxa_pagamento_percentual_aplicado: '',
  taxa_nota_fiscal_percentual_aplicado: '',
  itens: [],
  comissoes: [],
})

function num(v) {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function totalItem(it) {
  return round2(num(it.quantidade) * num(it.valor_unitario))
}

const valorBruto = computed(() => {
  return round2(form.itens.reduce((acc, it) => acc + totalItem(it), 0))
})

const valorTaxaPagamento = computed(() => {
  return round2(valorBruto.value * (num(form.taxa_pagamento_percentual_aplicado) / 100))
})

const valorNotaFiscal = computed(() => {
  return round2(valorBruto.value * (num(form.taxa_nota_fiscal_percentual_aplicado) / 100))
})

function valorComissao(c) {
  return round2(valorBruto.value * (num(c.percentual_aplicado) / 100))
}

const somaComissoes = computed(() => {
  return round2(form.comissoes.reduce((acc, c) => acc + valorComissao(c), 0))
})

const valorTotal = computed(() => {
  return round2(valorBruto.value + valorTaxaPagamento.value + valorNotaFiscal.value + somaComissoes.value)
})

// helpers p/ template (se você estiver usando)
function moeda(v) {
  return format.currency(v)
}
function dataBr(v) {
  return format.date(v)
}

function addItem() {
  form.itens.push({ nome_ambiente: '', descricao: '', quantidade: 1, valor_unitario: 0 })
}

function removerItem(idx) {
  if (form.itens.length === 1) return
  form.itens.splice(idx, 1)
}

function addComissao() {
  form.comissoes.push({
    tipo_comissao_chave: '',
    percentual_aplicado: 3,
    responsavel_nome: '',
  })
}

function removerComissao(idx) {
  form.comissoes.splice(idx, 1)
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get(`/vendas/${id}`)

    form.cliente_id = data.cliente_id
    form.orcamento_id = data.orcamento_id || ''
    form.status = data.status
    form.observacao = data.observacao || ''
    form.forma_pagamento_chave = data.forma_pagamento_chave || ''
    form.taxa_pagamento_percentual_aplicado = data.taxa_pagamento_percentual_aplicado ?? ''
    form.taxa_nota_fiscal_percentual_aplicado = data.taxa_nota_fiscal_percentual_aplicado ?? ''

    form.itens = (data.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      quantidade: Number(it.quantidade),
      valor_unitario: Number(it.valor_unitario),
    }))

    form.comissoes = (data.comissoes || []).map((c) => ({
      tipo_comissao_chave: c.tipo_comissao_chave,
      percentual_aplicado: Number(c.percentual_aplicado),
      responsavel_nome: c.responsavel_nome || '',
    }))

    if (!form.itens.length) addItem()
  } finally {
    loading.value = false
  }
}

async function encaminharParaProducao() {
  encaminhando.value = true
  try {
    await api.post('/producao/encaminhar', {
      origem_tipo: 'VENDA_CLIENTE',
      origem_id: id,
      status: 'ENCAMINHADO_PRODUCAO',
    })

    alert('Encaminhado para Produção!')
    router.push('/producao/agenda')
  } catch (err) {
    alert('Erro ao encaminhar para produção.')
  } finally {
    encaminhando.value = false
  }
}


async function salvar() {
  if (!String(form.cliente_id).trim()) return alert('Informe o cliente (ID).')
  if (!String(form.status).trim()) return alert('Informe o status.')
  if (!form.itens.length) return alert('Adicione ao menos 1 item.')

  salvando.value = true
  try {
    const payload = {
      cliente_id: Number(form.cliente_id),
      orcamento_id: String(form.orcamento_id).trim() ? Number(form.orcamento_id) : null,
      status: form.status,
      observacao: form.observacao || null,
      forma_pagamento_chave: form.forma_pagamento_chave || null,
      taxa_pagamento_percentual_aplicado: String(form.taxa_pagamento_percentual_aplicado).trim()
        ? Number(form.taxa_pagamento_percentual_aplicado)
        : null,
      taxa_nota_fiscal_percentual_aplicado: String(form.taxa_nota_fiscal_percentual_aplicado).trim()
        ? Number(form.taxa_nota_fiscal_percentual_aplicado)
        : null,
      itens: form.itens.map((it) => ({
        nome_ambiente: it.nome_ambiente,
        descricao: it.descricao,
        quantidade: Number(it.quantidade),
        valor_unitario: Number(it.valor_unitario),
      })),
      comissoes: form.comissoes.map((c) => ({
        tipo_comissao_chave: c.tipo_comissao_chave,
        percentual_aplicado: Number(c.percentual_aplicado),
        responsavel_nome: c.responsavel_nome || null,
      })),
    }

    await api.patch(`/vendas/${id}`, payload)
    alert('Venda atualizada!')
    await carregar()
  } finally {
    salvando.value = false
  }
}

async function excluir() {
  if (!confirm('Deseja excluir esta venda?')) return
  excluindo.value = true
  try {
    await api.delete(`/vendas/${id}`)
    router.push('/vendas')
  } finally {
    excluindo.value = false
  }
}

onMounted(carregar)
</script>
