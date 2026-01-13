<template>
  <Card>
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isNovo ? 'Novo Orçamento' : `Orçamento #${orcamentoId}` }}
        </h2>
        <p class="text-sm font-semibold text-gray-500 mt-1">
          Arquitetura da tela (sem salvar). Só conferência.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" type="button" @click="router.back()">
          Voltar
        </Button>

        <Button
          variant="outline"
          size="sm"
          type="button"
          :disabled="isNovo"
          @click="gerarPdf()"
        >
          Gerar PDF
        </Button>
      </div>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <div class="grid grid-cols-12 gap-x-5 gap-y-6">

        <!-- LINHA: Cliente + Status -->
        <div class="col-span-12 md:col-span-8">
<SearchInput
  v-model="draft.cliente_id"
  label="Nome do cliente"
  placeholder="Pesquisar cliente..."
  :options="clientesOptions"
/>

        </div>

        <div class="col-span-12">
          <div class="h-px bg-gray-100"></div>
        </div>

        <!-- BLOCO: Add Ambiente -->
        <div class="col-span-12">
          <div class="grid grid-cols-12 gap-x-5 gap-y-4">

<div class="col-span-12 md:col-span-3">
  <Input
    v-model="ambForm.nome_ambiente"
    label="Nome do ambiente"
    placeholder="Ex: Cozinha"
  />
</div>

<div class="col-span-12 md:col-span-6">
  <Input
    v-model="ambForm.descricao"
    label="Descrição"
    placeholder="Descrição..."
  />
</div>

<div class="col-span-12 md:col-span-3">
  <Input
    v-model="ambForm.valor_unitario"
    label="Valor unitário"
    placeholder="0,00"
  />
</div>

<div class="col-span-12">
  <Input
    v-model="ambForm.observacao"
    label="Observação do ambiente"
    placeholder="Observação..."
  />
</div>


            <div class="col-span-12 flex justify-end">
              <Button variant="primary" type="button" @click="addOuAtualizarAmbiente()">
                {{ editIdx !== null ? 'Atualizar' : 'Add' }}
              </Button>
            </div>
          </div>
        </div>

        <div class="col-span-12">
          <div class="h-px bg-gray-100"></div>
        </div>

        <!-- TABELA -->
        <div class="col-span-12">
          <Table
            :columns="columns"
            :rows="rowsTabela"
            :loading="false"
            emptyText="Nenhum ambiente adicionado."
          >
            <template #cell-valor_unitario="{ row }">
              <span class="font-black text-brand-primary">
                {{ format.currency(row.valor_unitario || 0) }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end gap-2">
                <Button size="sm" variant="secondary" type="button" @click="editar(row.__idx)">
                  Editar
                </Button>
                <Button size="sm" variant="danger" type="button" @click="excluir(row.__idx)">
                  Excluir
                </Button>
              </div>
            </template>
          </Table>

          <div class="flex items-center justify-end mt-4">
            <div class="text-sm font-black uppercase tracking-tight text-gray-900">
              Total: <span class="text-brand-primary">{{ format.currency(total) }}</span>
            </div>
          </div>
        </div>

        <div class="col-span-12">
          <div class="h-px bg-gray-100"></div>
        </div>

        <!-- ANEXOS -->
<!-- ANEXOS -->
<div class="col-span-12">
  <div class="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
    Anexos
  </div>
<div class="mt-3 flex items-center gap-3">
  <input
    ref="fileInput"
    type="file"
    multiple
    class="hidden"
    @change="onSelectFiles"
  />

  <Button variant="secondary" size="sm" type="button" @click="fileInput?.click()">
    <i class="pi pi-paperclip mr-2"></i>
    Anexar arquivos
  </Button>

  <div class="text-xs font-semibold text-gray-400">
    {{ draft.anexos.length ? `${draft.anexos.length} selecionado(s)` : 'Nenhum arquivo selecionado' }}
  </div>
</div>

  <!-- arquivos já salvos (backend) -->
  <div v-if="draft.arquivosExistentes?.length" class="mt-4 space-y-2">
    <div
      v-for="arq in draft.arquivosExistentes"
      :key="arq.id"
      class="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-2"
    >
      <div class="min-w-0">
        <div class="text-sm font-bold text-gray-900 truncate">
          {{ arq.nome_original }}
        </div>
        <div class="text-xs font-semibold text-gray-400">
          {{ (arq.tamanho / 1024 / 1024).toFixed(2) }} MB
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          @click="abrirArquivo(arq)"
        >
          <i class="pi pi-external-link mr-2"></i>
          Abrir
        </Button>

        <Button
          variant="danger"
          size="sm"
          type="button"
          @click="excluirArquivo(arq)"
        >
          <i class="pi pi-trash mr-2"></i>
          Excluir
        </Button>
      </div>
    </div>
  </div>

  <!-- novos anexos (local, ainda não enviados) -->
  <div v-if="draft.anexos?.length" class="mt-4 space-y-2">
    <div
      v-for="(arq, i) in draft.anexos"
      :key="i"
      class="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-2"
    >
      <div class="min-w-0">
        <div class="text-sm font-bold text-gray-900 truncate">
          {{ arq.name }}
        </div>
        <div class="text-xs font-semibold text-gray-400">
          {{ (arq.size / 1024 / 1024).toFixed(2) }} MB
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          @click="abrirLocal(arq)"
        >
          <i class="pi pi-eye mr-2"></i>
          Abrir
        </Button>

        <Button
          variant="danger"
          size="sm"
          type="button"
          @click="removerArquivo(i)"
        >
          <i class="pi pi-trash mr-2"></i>
          Remover
        </Button>
      </div>
    </div>
  </div>
</div>
      </div>
    </div>
    <!-- FOOTER -->
    <footer class="flex items-center justify-end gap-2 p-6 border-t border-gray-100">
      <Button variant="primary" type="button" disabled>
        Salvar
      </Button>
    </footer>
  </Card>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Table from '@/components/ui/Table.vue'
import Input from '@/components/ui/Input.vue'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const orcamentoId = computed(() => route.params.id)
const isNovo = computed(() => String(orcamentoId.value) === 'novo')

const clientesOptions = ref([])

/**
 * Arquitetura local (sem salvar ainda)
 */
const draft = reactive({
  cliente_id: null,
  ambientes: [],
  anexos: [],
  arquivosExistentes: [], // ✅ usado no template
})


const ambForm = reactive({
  nome_ambiente: '',
  descricao: '',
  valor_unitario: '',
  observacao: '',
})

const editIdx = ref(null)

const columns = [
  { key: 'nome_ambiente', label: 'Ambiente', width: '220px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'valor_unitario', label: 'Valor', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '200px', align: 'right' },
]

function parseMoney(v) {
  const s = String(v ?? '').trim()
  if (!s) return 0
  const normalized = s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

const rowsTabela = computed(() =>
  draft.ambientes.map((a, idx) => ({ ...a, __idx: idx })),
)

const total = computed(() =>
  draft.ambientes.reduce((acc, a) => acc + (Number(a.valor_unitario) || 0), 0),
)

async function carregarClientes() {
  const { data } = await api.get('/clientes')
  clientesOptions.value = (data || []).map((c) => ({
    label: c.nome_completo || c.nome || `Cliente #${c.id}`,
    value: c.id,
  }))
}

function limparForm() {
  ambForm.nome_ambiente = ''
  ambForm.descricao = ''
  ambForm.valor_unitario = ''
  ambForm.observacao = ''
  editIdx.value = null
}

function addOuAtualizarAmbiente() {
  const nome = (ambForm.nome_ambiente || '').trim()
  if (!nome) return

  const payload = {
    nome_ambiente: nome,
    descricao: (ambForm.descricao || '').trim(),
    valor_unitario: parseMoney(ambForm.valor_unitario),
    observacao: (ambForm.observacao || '').trim(),
  }

  if (editIdx.value !== null) {
    draft.ambientes.splice(editIdx.value, 1, payload)
  } else {
    draft.ambientes.push(payload)
  }

  limparForm()
}

function editar(idx) {
  const a = draft.ambientes[idx]
  if (!a) return
  ambForm.nome_ambiente = a.nome_ambiente || ''
  ambForm.descricao = a.descricao || ''
  ambForm.valor_unitario = String(a.valor_unitario ?? '')
  ambForm.observacao = a.observacao || ''
  editIdx.value = idx
}

function excluir(idx) {
  draft.ambientes.splice(idx, 1)
  if (editIdx.value === idx) limparForm()
}

async function carregarArquivos() {
  if (isNovo.value) return
  const { data } = await api.get(`/orcamentos/${orcamentoId.value}/arquivos`)
  draft.arquivosExistentes = data || []
}

function abrirArquivo(arq) {
  window.open(`${import.meta.env.VITE_API_URL}/orcamentos/${orcamentoId.value}/arquivos/${arq.id}`, '_blank')
}

async function excluirArquivo(arq) {
  await api.delete(`/orcamentos/${orcamentoId.value}/arquivos/${arq.id}`)
  await carregarArquivos()
}
function abrirLocal(file) {
  const url = URL.createObjectURL(file)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000) // ✅ libera depois de 1 min
}



const fileInput = ref(null)

function onSelectFiles(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  draft.anexos.push(...files)
  if (fileInput.value) fileInput.value.value = ''
}

function removerArquivo(i) {
  draft.anexos.splice(i, 1)
}

function gerarPdf() {
  if (isNovo.value) return
  window.open(`${import.meta.env.VITE_API_URL}/orcamentos/${orcamentoId.value}/pdf`, '_blank')
}

onMounted(async () => {
  await carregarClientes()
  await carregarArquivos()
})


</script>

