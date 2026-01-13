<template>
  <Card>
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? `Editar Orçamento #${orcamentoId}` : 'Novo Orçamento' }}
        </h2>
        <p class="text-sm font-semibold text-gray-500 mt-1">
          Cliente é opcional. Esta tela edita em rascunho — só salva quando você clicar em “Salvar”.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" type="button" @click="router.back()">
          Voltar
        </Button>

        <Button
          v-if="isEdit"
          variant="outline"
          size="sm"
          type="button"
          @click="abrirPdf()"
        >
          PDF
        </Button>
      </div>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <!-- LOADING -->
      <div v-if="loading" class="flex items-center justify-center py-10">
        <div class="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">
          Carregando...
        </div>
      </div>

      <template v-else>
        <div class="grid grid-cols-12 gap-x-5 gap-y-6">
          <!-- Cliente (opcional) -->
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="draft.cliente_nome_snapshot"
              label="Cliente (opcional)"
              placeholder="Digite o nome do cliente (ou deixe em branco)..."
            />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="draft.cliente_cpf_snapshot"
              label="CPF (opcional)"
              placeholder="000.000.000-00"
            />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="draft.status"
              label="Status"
              placeholder="EX: RASCUNHO / ENVIADO / APROVADO..."
            />
          </div>

          <!-- Divider -->
          <div class="col-span-12">
            <div class="h-px bg-gray-100"></div>
          </div>

          <!-- Campos básicos do orçamento (mantidos genéricos) -->
          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="draft.referencia"
              label="Referência (opcional)"
              placeholder="EX: Cozinha / Quarto / Pedido..."
            />
          </div>

          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="draft.observacoes"
              label="Observações (opcional)"
              placeholder="Observações internas..."
            />
          </div>

          <div class="col-span-12 md:col-span-4">
            <div class="flex flex-col gap-2">
              <span class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
                Total (visual)
              </span>
              <div class="text-lg font-black text-brand-primary">
                {{ format.currency(totalVisual) }}
              </div>
              <p class="text-xs font-semibold text-gray-400">
                (apenas conferência na tela; não salva sozinho)
              </p>
            </div>
          </div>

          <!-- Divider -->
          <div class="col-span-12">
            <div class="h-px bg-gray-100"></div>
          </div>

          <!-- Itens (simples, rascunho local) -->
          <div class="col-span-12">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-black uppercase tracking-tight text-gray-900">
                  Itens
                </h3>
                <p class="text-xs font-semibold text-gray-400">
                  Você pode editar aqui só para conferir. Nada é salvo até clicar em Salvar.
                </p>
              </div>

              <Button variant="primary" size="sm" type="button" @click="adicionarItem()">
                + Adicionar item
              </Button>
            </div>

            <div class="mt-4">
              <Table
                :columns="columnsItens"
                :rows="draft.itens"
                :loading="false"
                emptyText="Nenhum item adicionado."
              >
                <template #cell-descricao="{ row, index }">
                  <input
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/30"
                    v-model="draft.itens[index].descricao"
                    placeholder="Descrição..."
                  />
                </template>

                <template #cell-quantidade="{ row, index }">
                  <input
                    type="number"
                    step="0.01"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/30"
                    v-model.number="draft.itens[index].quantidade"
                  />
                </template>

                <template #cell-valor_unitario="{ row, index }">
                  <input
                    type="number"
                    step="0.01"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/30 text-right"
                    v-model.number="draft.itens[index].valor_unitario"
                  />
                </template>

                <template #cell-total="{ row, index }">
                  <span class="font-black text-gray-900">
                    {{ format.currency(itemTotal(draft.itens[index])) }}
                  </span>
                </template>

                <template #cell-acoes="{ row, index }">
                  <div class="flex justify-end">
                    <Button variant="danger" size="sm" type="button" @click="removerItem(index)">
                      Remover
                    </Button>
                  </div>
                </template>
              </Table>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-end gap-2 p-6 border-t border-gray-100">
      <Button
        v-if="isEdit"
        variant="outline"
        type="button"
        :disabled="!alterado"
        @click="descartarAlteracoes()"
      >
        Descartar alterações
      </Button>

      <Button
        variant="primary"
        type="button"
        :loading="saving"
        :disabled="saving"
        @click="salvar()"
      >
        Salvar
      </Button>
    </footer>
  </Card>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)

const orcamentoId = computed(() => route.params.id)
const isEdit = computed(() => !!orcamentoId.value && String(orcamentoId.value) !== 'novo')

/**
 * ⚠️ Aqui está o ponto do "editar sem salvar":
 * - `draft` é o que a tela edita (rascunho local).
 * - `original` guarda a cópia do que veio da API.
 * - Só chama API no botão Salvar.
 */
const original = ref(null)

const draft = reactive({
  id: null,
  cliente_nome_snapshot: '',
  cliente_cpf_snapshot: '',
  status: 'RASCUNHO',
  referencia: '',
  observacoes: '',
  itens: [],
})

const columnsItens = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'quantidade', label: 'Qtd', width: '120px' },
  { key: 'valor_unitario', label: 'V. Unit', width: '140px', align: 'right' },
  { key: 'total', label: 'Total', width: '140px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]

function normalizeNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function itemTotal(item) {
  return normalizeNumber(item.quantidade) * normalizeNumber(item.valor_unitario)
}

const totalVisual = computed(() => {
  return (draft.itens || []).reduce((acc, it) => acc + itemTotal(it), 0)
})

const alterado = computed(() => {
  if (!original.value) return false
  // comparação simples e direta
  return JSON.stringify(toPlain(draft)) !== JSON.stringify(original.value)
})

function toPlain(obj) {
  // tira reactivity e garante shape simples
  return JSON.parse(JSON.stringify(obj))
}

function aplicarDados(payload) {
  draft.id = payload?.id ?? null
  draft.cliente_nome_snapshot = payload?.cliente_nome_snapshot ?? ''
  draft.cliente_cpf_snapshot = payload?.cliente_cpf_snapshot ?? ''
  draft.status = payload?.status ?? 'RASCUNHO'
  draft.referencia = payload?.referencia ?? ''
  draft.observacoes = payload?.observacoes ?? ''
  draft.itens = Array.isArray(payload?.itens) ? payload.itens.map((i) => ({
    descricao: i?.descricao ?? '',
    quantidade: normalizeNumber(i?.quantidade ?? 1),
    valor_unitario: normalizeNumber(i?.valor_unitario ?? 0),
  })) : []
}

async function carregar() {
  if (!isEdit.value) {
    // novo: começa vazio e não precisa original
    original.value = null
    aplicarDados(null)
    return
  }

  loading.value = true
  try {
    const { data } = await api.get(`/orcamentos/${orcamentoId.value}`)
    aplicarDados(data || {})
    original.value = toPlain(draft) // salva o estado inicial para "Descartar"
  } catch (e) {
    console.error('Erro ao carregar orçamento:', e)
  } finally {
    loading.value = false
  }
}

function adicionarItem() {
  draft.itens.push({
    descricao: '',
    quantidade: 1,
    valor_unitario: 0,
  })
}

function removerItem(index) {
  draft.itens.splice(index, 1)
}

function descartarAlteracoes() {
  if (!original.value) return
  aplicarDados(original.value)
}

async function salvar() {
  saving.value = true
  try {
    const payload = toPlain({
      cliente_nome_snapshot: draft.cliente_nome_snapshot || null,
      cliente_cpf_snapshot: draft.cliente_cpf_snapshot || null,
      status: draft.status || 'RASCUNHO',
      referencia: draft.referencia || null,
      observacoes: draft.observacoes || null,
      itens: (draft.itens || []).map((i) => ({
        descricao: i.descricao || '',
        quantidade: normalizeNumber(i.quantidade),
        valor_unitario: normalizeNumber(i.valor_unitario),
      })),
    })

    if (isEdit.value) {
      await api.put(`/orcamentos/${orcamentoId.value}`, payload)
    } else {
      const { data } = await api.post('/orcamentos', payload)
      // se a API retornar o id, já redireciona pra edição
      if (data?.id) router.replace(`/orcamentos/${data.id}`)
    }

    // recarrega e redefine original (estado salvo)
    await carregar()
  } catch (e) {
    console.error('Erro ao salvar orçamento:', e)
  } finally {
    saving.value = false
  }
}

function abrirPdf() {
  if (!isEdit.value) return
  window.open(`${import.meta.env.VITE_API_URL}/orcamentos/${orcamentoId.value}/pdf`, '_blank')
}

onMounted(carregar)
</script>
