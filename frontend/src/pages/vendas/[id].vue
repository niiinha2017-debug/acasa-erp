<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
      <div class="min-w-0">
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? `Venda #${id}` : 'Nova Venda' }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          {{ isEdit ? 'Editar venda, itens e comissões.' : 'Cadastrar venda, itens e comissões.' }}
        </p>
      </div>

      <Button
        variant="secondary"
        size="sm"
        type="button"
        @click="router.push('/vendas')"
      >
        Voltar
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex items-center justify-center rounded-2xl border border-gray-100 p-10 text-sm font-semibold text-gray-500"
      >
        Carregando...
      </div>

      <div v-else class="space-y-8">
        <!-- DADOS -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-black tracking-wider text-gray-900 uppercase">Dados</h3>
          </div>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.cliente_id" type="number" label="Cliente (ID) *" required />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.orcamento_id" type="number" label="Orçamento (ID)" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="form.status"
                label="Status *"
                :options="STATUS_VENDA"
                placeholder="Selecione..."
                required
              />
            </div>

            <div class="col-span-12">
              <Input v-model="form.observacao" label="Observação" />
            </div>
          </div>
        </section>

        <div class="h-px w-full bg-gray-100"></div>

        <!-- PAGAMENTO E TAXAS -->
        <section class="space-y-4">
          <h3 class="text-sm font-black tracking-wider text-gray-900 uppercase">Pagamento e Taxas</h3>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="form.forma_pagamento_chave"
                label="Forma de pagamento"
                :options="FORMAS_PAGAMENTO"
                placeholder="Selecione..."
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="form.taxa_pagamento_percentual_aplicado"
                type="number"
                label="Taxa do pagamento (%)"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="form.taxa_nota_fiscal_percentual_aplicado"
                type="number"
                label="Nota fiscal (%)"
              />
            </div>
          </div>
        </section>

        <div class="h-px w-full bg-gray-100"></div>

        <!-- ITENS -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-sm font-black tracking-wider text-gray-900 uppercase">Itens</h3>
            <Button variant="secondary" size="sm" type="button" @click="addItem">
              + Adicionar item
            </Button>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-100">
            <!-- header -->
            <div class="grid grid-cols-12 gap-3 bg-gray-50/50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-500">
              <div class="col-span-12 md:col-span-2">Ambiente</div>
              <div class="col-span-12 md:col-span-4">Descrição</div>
              <div class="col-span-6 md:col-span-2">Qtd</div>
              <div class="col-span-6 md:col-span-2">Unitário</div>
              <div class="col-span-8 md:col-span-1">Total</div>
              <div class="col-span-4 md:col-span-1 text-right"></div>
            </div>

            <!-- rows -->
            <div class="divide-y divide-gray-100">
              <div
                v-for="(it, idx) in form.itens"
                :key="idx"
                class="grid grid-cols-12 gap-3 px-4 py-4"
              >
                <div class="col-span-12 md:col-span-2">
                  <Input v-model="it.nome_ambiente" />
                </div>

                <div class="col-span-12 md:col-span-4">
                  <Input v-model="it.descricao" />
                </div>

                <div class="col-span-6 md:col-span-2">
                  <Input v-model="it.quantidade" type="number" />
                </div>

                <div class="col-span-6 md:col-span-2">
                  <Input v-model="it.valor_unitario" type="number" />
                </div>

                <div class="col-span-8 md:col-span-1 flex items-center">
                  <span class="text-sm font-black text-gray-900">
                    {{ moeda(totalItem(it)) }}
                  </span>
                </div>

                <div class="col-span-4 md:col-span-1 flex items-center justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    :disabled="form.itens.length === 1"
                    @click="removerItem(idx)"
                    title="Remover item"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="h-px w-full bg-gray-100"></div>

        <!-- COMISSÕES -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-sm font-black tracking-wider text-gray-900 uppercase">Comissões</h3>
            <Button variant="secondary" size="sm" type="button" @click="addComissao">
              + Adicionar comissão
            </Button>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-100">
            <!-- header -->
            <div class="grid grid-cols-12 gap-3 bg-gray-50/50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-500">
              <div class="col-span-12 md:col-span-3">Tipo</div>
              <div class="col-span-6 md:col-span-2">%</div>
              <div class="col-span-6 md:col-span-4">Responsável</div>
              <div class="col-span-8 md:col-span-2">Valor</div>
              <div class="col-span-4 md:col-span-1 text-right"></div>
            </div>

            <!-- rows -->
            <div class="divide-y divide-gray-100">
              <div
                v-for="(c, idx) in form.comissoes"
                :key="idx"
                class="grid grid-cols-12 gap-3 px-4 py-4"
              >
                <div class="col-span-12 md:col-span-3">
                  <SearchInput
                    v-model="c.tipo_comissao_chave"
                    :options="TIPOS_COMISSAO"
                    placeholder="Selecione..."
                  />
                </div>

                <div class="col-span-6 md:col-span-2">
                  <SearchInput
                    v-model="c.percentual_aplicado"
                    :options="PERCENTUAIS_COMISSAO"
                    placeholder="Ex: 3"
                  />
                </div>

                <div class="col-span-6 md:col-span-4">
                  <Input v-model="c.responsavel_nome" placeholder="Opcional..." />
                </div>

                <div class="col-span-8 md:col-span-2 flex items-center">
                  <span class="text-sm font-black text-gray-900">
                    {{ moeda(valorComissao(c)) }}
                  </span>
                </div>

                <div class="col-span-4 md:col-span-1 flex items-center justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    @click="removerComissao(idx)"
                    title="Remover comissão"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="h-px w-full bg-gray-100"></div>

        <!-- TOTAIS -->
        <section class="space-y-4">
          <h3 class="text-sm font-black tracking-wider text-gray-900 uppercase">Totais (Preview)</h3>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="moeda(valorBruto)" label="Valor bruto" readonly />
            </div>
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="moeda(valorTaxaPagamento)" label="Taxa pagamento" readonly />
            </div>
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="moeda(valorNotaFiscal)" label="Nota fiscal" readonly />
            </div>
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="moeda(valorTotal)" label="Total" readonly />
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-between gap-4 border-t border-gray-100 p-6">
      <div class="flex items-center gap-2">
        <Button
          v-if="isEdit"
          variant="danger"
          size="md"
          :loading="excluindo"
          loadingText="Excluindo..."
          type="button"
          @click="excluir"
        >
          Excluir
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          type="button"
          :loading="encaminhando"
          loadingText="Encaminhando..."
          @click="encaminharParaProducao"
        >
          Encaminhar para Produção
        </Button>

        <Button
          variant="primary"
          size="md"
          type="button"
          :loading="salvando"
          loadingText="Salvando..."
          @click="salvar"
        >
          {{ isEdit ? 'Salvar Alterações' : 'Criar Venda' }}
        </Button>
      </div>
    </footer>
  </Card>
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

/**
 * Unificado:
 * - /vendas/novo  -> isEdit false (id inválido)
 * - /vendas/:id   -> isEdit true
 */
const id = computed(() => Number(route.params.id))
const isEdit = computed(() => Number.isFinite(id.value) && id.value > 0)

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const encaminhando = ref(false)

// Constantes (você depois move pro arquivo geral)
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

function formVazio() {
  return {
    cliente_id: '',
    orcamento_id: '',
    status: 'RASCUNHO',
    observacao: '',
    forma_pagamento_chave: '',
    taxa_pagamento_percentual_aplicado: '',
    taxa_nota_fiscal_percentual_aplicado: '',
    itens: [],
    comissoes: [],
  }
}

const form = reactive(formVazio())

function resetForm() {
  const fresh = formVazio()
  Object.keys(fresh).forEach((k) => { form[k] = fresh[k] })
}

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

const valorBruto = computed(() => round2(form.itens.reduce((acc, it) => acc + totalItem(it), 0)))

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

// helpers p/ template
function moeda(v) {
  return format.currency(v)
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
    // Se for NOVA, só reseta e garante 1 item.
    if (!isEdit.value) {
      resetForm()
      if (!form.itens.length) addItem()
      return
    }

    const { data } = await api.get(`/vendas/${id.value}`)

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

function montarPayload() {
  return {
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
}

async function encaminharParaProducao() {
  if (!isEdit.value) return alert('Salve a venda antes de encaminhar para produção.')

  encaminhando.value = true
  try {
    await api.post('/producao/encaminhar', {
      origem_tipo: 'VENDA_CLIENTE',
      origem_id: id.value,
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
    const payload = montarPayload()

    /**
     * ✅ Unificado:
     * - Novo: PUT /vendas
     * - Editar: PUT /vendas/:id
     *
     * Se o seu backend ainda estiver com PATCH/POST, troca aqui.
     */
    if (isEdit.value) {
      await api.put(`/vendas/${id.value}`, payload)
      alert('Venda atualizada!')
      await carregar()
      return
    }

    const { data } = await api.put('/vendas', payload)
    const newId = data?.id

    alert('Venda criada!')
    if (newId) {
      router.push(`/vendas/${newId}`)
    } else {
      router.push('/vendas')
    }
  } catch (err) {
    alert('Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

async function excluir() {
  if (!isEdit.value) return
  if (!confirm('Deseja excluir esta venda?')) return

  excluindo.value = true
  try {
    await api.delete(`/vendas/${id.value}`)
    router.push('/vendas')
  } finally {
    excluindo.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
