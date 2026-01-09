<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Nova Venda</h2>
          <p class="card-subtitle">
            Crie a venda (módulo antigo) com itens, comissões e taxas.
          </p>
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
        <div class="form-grid">
          <div class="col-span-12 section-title">
            <h3 class="card-title section-title__text">Vínculos</h3>
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.cliente_id" type="number" label="Cliente (ID)" required placeholder="Ex: 1" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.orcamento_id" type="number" label="Orçamento (ID)" placeholder="Ex: 10" />
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
            <Input v-model="form.observacao" label="Observação" placeholder="Opcional..." />
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
            <Input
              v-model="form.taxa_pagamento_percentual_aplicado"
              type="number"
              label="Taxa do pagamento (%)"
              placeholder="Ex: 2.99"
            />
          </div>

          <div class="col-span-4 form-group">
            <Input
              v-model="form.taxa_nota_fiscal_percentual_aplicado"
              type="number"
              label="Nota fiscal (%)"
              placeholder="Ex: 5"
            />
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
                <Input v-model="it.nome_ambiente" placeholder="Ex: Cozinha" />
                <Input v-model="it.descricao" placeholder="Ex: Armário superior" />
                <Input v-model="it.quantidade" type="number" placeholder="1" />
                <Input v-model="it.valor_unitario" type="number" placeholder="0,00" />
                <div class="mini-total">
                  {{ format.currency(totalItem(it)) }}
                </div>
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
                <SearchInput
                  v-model="c.tipo_comissao_chave"
                  :options="TIPOS_COMISSAO"
                  placeholder="Selecione..."
                  :colSpan="'col-span-4'"
                />
                <SearchInput
                  v-model="c.percentual_aplicado"
                  :options="PERCENTUAIS_COMISSAO"
                  placeholder="Ex: 3"
                  :colSpan="'col-span-4'"
                />
                <Input v-model="c.responsavel_nome" placeholder="Opcional..." />
                <div class="mini-total">
                  {{ format.currency(valorComissao(c)) }}
                </div>
                <Button variant="danger" size="sm" label="Remover" @click="removerComissao(idx)" />
              </div>
            </div>
          </div>

          <div class="col-span-12 section-title">
            <h3 class="card-title section-title__text">Totais (Preview)</h3>
          </div>

          <div class="col-span-3 form-group">
            <Input :modelValue="format.currency(valorBruto)" label="Valor bruto" readonly />
          </div>

          <div class="col-span-3 form-group">
            <Input :modelValue="format.currency(valorTaxaPagamento)" label="Taxa pagamento" readonly />
          </div>

          <div class="col-span-3 form-group">
            <Input :modelValue="format.currency(valorNotaFiscal)" label="Nota fiscal" readonly />
          </div>

          <div class="col-span-3 form-group">
            <Input :modelValue="format.currency(valorTotal)" label="Total" readonly />
          </div>
        </div>
      </div>

      <footer class="card-footer footer-end flex gap-2">
        <Button
          variant="secondary"
          size="md"
          label="Salvar"
          :loading="salvando"
          loadingText="Salvando..."
          @click="salvar(false)"
        />

        <Button
          variant="primary"
          size="md"
          label="Encaminhar para Produção"
          :loading="encaminhando"
          loadingText="Encaminhando..."
          @click="salvar(true)"
        />
      </footer>
    </div>
  </div>
</template>


<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import api from '@/services/api'
import { format } from '@/utils/format'

const router = useRouter()
const salvando = ref(false)
const encaminhando = ref(false)


// 🔒 Constantes (depois migra pro arquivo de constantes geral)
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
  itens: [{ nome_ambiente: '', descricao: '', quantidade: 1, valor_unitario: 0 }],
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
  const p = num(form.taxa_pagamento_percentual_aplicado)
  return round2(valorBruto.value * (p / 100))
})

const valorNotaFiscal = computed(() => {
  const p = num(form.taxa_nota_fiscal_percentual_aplicado)
  return round2(valorBruto.value * (p / 100))
})

function valorComissao(c) {
  const p = num(c.percentual_aplicado)
  return round2(valorBruto.value * (p / 100))
}

const somaComissoes = computed(() => {
  return round2(form.comissoes.reduce((acc, c) => acc + valorComissao(c), 0))
})

const valorTotal = computed(() => {
  return round2(valorBruto.value + valorTaxaPagamento.value + valorNotaFiscal.value + somaComissoes.value)
})

// helpers pro template (se você estiver usando)
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

// se escolher CARTAO e tiver taxa vazia, deixa pronto (sem inventar taxa)
watch(
  () => form.forma_pagamento_chave,
  (v) => {
    if (v === 'CARTAO' && !String(form.taxa_pagamento_percentual_aplicado || '').trim()) {
      form.taxa_pagamento_percentual_aplicado = ''
    }
  },
)

async function salvar(encaminhar = false) {
  if (!String(form.cliente_id).trim()) return alert('Informe o cliente (ID).')
  if (!String(form.status).trim()) return alert('Informe o status.')
  if (!form.itens.length) return alert('Adicione ao menos 1 item.')

  if (encaminhar) encaminhando.value = true
  else salvando.value = true

  try {
    const payload = {
      cliente_id: Number(form.cliente_id),
      orcamento_id: String(form.orcamento_id).trim() ? Number(form.orcamento_id) : undefined,
      status: form.status,
      observacao: form.observacao || undefined,
      forma_pagamento_chave: form.forma_pagamento_chave || undefined,
      taxa_pagamento_percentual_aplicado: String(form.taxa_pagamento_percentual_aplicado).trim()
        ? Number(form.taxa_pagamento_percentual_aplicado)
        : undefined,
      taxa_nota_fiscal_percentual_aplicado: String(form.taxa_nota_fiscal_percentual_aplicado).trim()
        ? Number(form.taxa_nota_fiscal_percentual_aplicado)
        : undefined,
      itens: form.itens.map((it) => ({
        nome_ambiente: it.nome_ambiente,
        descricao: it.descricao,
        quantidade: Number(it.quantidade),
        valor_unitario: Number(it.valor_unitario),
      })),
      comissoes: form.comissoes.map((c) => ({
        tipo_comissao_chave: c.tipo_comissao_chave,
        percentual_aplicado: Number(c.percentual_aplicado),
        responsavel_nome: c.responsavel_nome || undefined,
      })),
    }

    const { data } = await api.post('/vendas', payload)

    // ✅ se clicou "Encaminhar"
    if (encaminhar) {
      await api.post('/producao/encaminhar', {
        origem_tipo: 'VENDA_CLIENTE',
        origem_id: Number(data.id),
        status: 'ENCAMINHADO_PRODUCAO',
      })

      router.push('/producao/agenda')
      return
    }

    // ✅ se clicou só "Salvar"
    router.push(`/vendas/${data.id}`)
  } catch (err) {
    alert(encaminhar ? 'Erro ao encaminhar para produção.' : 'Erro ao salvar venda.')
  } finally {
    salvando.value = false
    encaminhando.value = false
  }
}
</script>

