<template>
  <div class="w-full max-w-[900px] mx-auto animate-page-in">
    <div class="rounded-2xl border border-border-ui bg-bg-card overflow-hidden">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
      <PageHeader
        :title="isEdit ? `Editar Contrato #${contratoId}` : 'Novo Contrato'"
        subtitle="Dados do contrato comercial"
        icon="pi pi-file"
        class="border-b border-border-ui"
      >
        <template #actions>
          <RouterLink
            to="/contratos"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            Voltar
          </RouterLink>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 relative">
        <Loading v-if="loading" />

        <form v-else class="space-y-8" @submit.prevent="salvar" autocomplete="off">
          <div class="grid grid-cols-12 gap-6">
            <SearchInput
              class="col-span-12"
              v-model="form.venda_id"
              mode="select"
              label="Venda *"
              :options="vendaOptions"
              placeholder="Selecione a venda"
              labelKey="label"
              valueKey="value"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.numero"
              label="Número do contrato *"
              placeholder="Ex: CONT-2025-001"
              required
            />

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.status"
              mode="select"
              label="Status *"
              :options="statusOptions"
              placeholder="Selecione"
              labelKey="label"
              valueKey="value"
            />

            <div class="col-span-12 md:col-span-4">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-1.5">Valor *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-soft">R$</span>
                <input
                  :value="valorMask"
                  @input="onValorInput($event)"
                  type="text"
                  inputmode="numeric"
                  placeholder="0,00"
                  required
                  class="w-full h-10 pl-9 pr-3 rounded-xl border border-border-ui bg-bg-card text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
            </div>

            <Input
              class="col-span-12"
              v-model="form.descricao"
              label="Descrição"
              placeholder="Descrição ou observações do contrato"
            />

            <Input
              class="col-span-12 md:col-span-6"
              v-model="form.data_inicio"
              label="Data de início"
              type="date"
            />

            <Input
              class="col-span-12 md:col-span-6"
              v-model="form.data_fim"
              label="Data de término"
              type="date"
            />
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border-ui">
            <div v-if="isEdit" class="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                :disabled="gerandoPdf"
                @click="gerarPdfContrato"
              >
                <i v-if="gerandoPdf" class="pi pi-spin pi-spinner mr-2"></i>
                <i v-else class="pi pi-file-pdf mr-2"></i>
                Gerar PDF do Contrato
              </Button>
            </div>
            <div class="flex justify-end gap-3 w-full sm:w-auto">
              <RouterLink
                to="/contratos"
                class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-border-ui rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </RouterLink>
              <Button
                type="submit"
                variant="primary"
                :disabled="salvando"
              >
                <i v-if="salvando" class="pi pi-spin pi-spinner mr-2"></i>
                {{ isEdit ? 'Salvar alterações' : 'Criar contrato' }}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { ContratosService, VendaService } from '@/services/index'

definePage({ meta: { perm: 'contratos.ver' } })

const route = useRoute()
const router = useRouter()
const contratoId = computed(() => route.params.id)
const vendaIdFromQuery = computed(() => {
  const raw = route.query?.vendaId
  const n = Number(String(raw || '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})
const isEdit = computed(() => {
  const id = contratoId.value
  return id && id !== 'novo' && !isNaN(Number(id))
})

const loading = ref(true)
const salvando = ref(false)
const gerandoPdf = ref(false)
const vendaOptions = ref([])

const statusOptions = [
  { label: 'Rascunho', value: 'RASCUNHO' },
  { label: 'Vigente', value: 'VIGENTE' },
  { label: 'Encerrado', value: 'ENCERRADO' },
  { label: 'Cancelado', value: 'CANCELADO' },
]

const form = ref({
  venda_id: null,
  numero: '',
  descricao: '',
  status: 'RASCUNHO',
  valor: 0,
  data_inicio: '',
  data_fim: '',
})

function sugerirNumeroContrato(vendaId) {
  if (form.value.numero && form.value.numero.trim().length > 0) return
  const ano = new Date().getFullYear()
  const seqBase = vendaId && Number.isFinite(vendaId) ? Number(vendaId) : Date.now() % 1000
  const sequencial = String(seqBase).padStart(3, '0')
  form.value.numero = `CONT-${ano}-${sequencial}`
}

function moedaParaNumero(str) {
  if (str == null || str === '') return 0
  const s = String(str).replace(/\D/g, '')
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n / 100 : 0
}

function numeroParaMoeda(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const valorMask = computed(() => numeroParaMoeda(form.value.valor))

function onValorInput(ev) {
  form.value.valor = moedaParaNumero(ev.target.value)
}

async function carregarVendas() {
  try {
    const res = await VendaService.listar()
    const lista = Array.isArray(res?.data) ? res.data : []
    vendaOptions.value = lista.map((v) => ({
      label: `Venda #${v.id} - ${v.cliente?.nome_completo || v.cliente?.nome || '-'} (${numeroParaMoeda(v.valor_vendido || v.valor_total)})`,
      value: v.id,
    }))
  } catch (e) {
    vendaOptions.value = []
  }
}

async function carregarContrato() {
  if (!isEdit.value) {
    loading.value = false
    form.value.status = 'RASCUNHO'
    // Pré-preenche cliente/venda quando vier de uma venda específica
    if (vendaIdFromQuery.value) {
      try {
        const res = await VendaService.buscar(vendaIdFromQuery.value)
        const v = res?.data ?? res
        form.value.venda_id = vendaIdFromQuery.value
        form.value.valor = Number(v?.valor_vendido || v?.valor_total || 0)
      } catch (e) {
        // se falhar, só ignora e deixa o contrato em branco
      }
      sugerirNumeroContrato(vendaIdFromQuery.value)
    } else {
      sugerirNumeroContrato(null)
    }
    return
  }
  try {
    const { data } = await ContratosService.buscar(contratoId.value)
    form.value = {
      cliente_id: data.cliente_id,
      venda_id: data.venda_id ?? null,
      numero: data.numero || '',
      descricao: data.descricao || '',
      status: data.status || 'RASCUNHO',
      valor: Number(data.valor || 0),
      data_inicio: data.data_inicio ? data.data_inicio.slice(0, 10) : '',
      data_fim: data.data_fim ? data.data_fim.slice(0, 10) : '',
    }
  } catch (e) {
    notify.error('Contrato não encontrado.')
    router.push('/contratos')
  } finally {
    loading.value = false
  }
}

async function salvar() {
  if (!isEdit.value && !can('contratos.criar')) return notify.error('Sem permissão para criar contrato.')
  if (isEdit.value && !can('contratos.editar')) return notify.error('Sem permissão para editar contrato.')

  const payload = {
    venda_id: form.value.venda_id || null,
    numero: form.value.numero.trim(),
    descricao: form.value.descricao?.trim() || null,
    status: form.value.status,
    valor: form.value.valor,
    data_inicio: form.value.data_inicio || null,
    data_fim: form.value.data_fim || null,
  }

  if (!payload.numero) return notify.error('Informe o número do contrato.')
  if (!payload.venda_id) return notify.error('Selecione a venda.')

  salvando.value = true
  try {
    if (isEdit.value) {
      await ContratosService.salvar(contratoId.value, payload)
      notify.success('Contrato atualizado.')
    } else {
      const { data } = await ContratosService.salvar(null, payload)
      notify.success('Contrato criado.')
      await router.replace(`/contratos/${data.id}`)
      return
    }
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar contrato.')
  } finally {
    salvando.value = false
  }
}

async function gerarPdfContrato() {
  if (!can('contratos.ver')) return notify.error('Acesso negado.')
  if (!isEdit.value) {
    return notify.error('Salve o contrato antes de gerar o PDF.')
  }

  gerandoPdf.value = true
  try {
    const id = Number(String(contratoId.value).replace(/\D/g, ''))
    if (!id) return notify.error('ID do contrato inválido.')

    const { data } = await ContratosService.abrirPdf(id)
    const arquivoId = data?.arquivoId
    if (!arquivoId) return notify.error('Não retornou arquivoId.')

    await router.push({
      path: `/arquivos/${String(arquivoId).replace(/\D/g, '')}`,
      query: {
        name: `CONTRATO_${String(id).replace(/\D/g, '')}.pdf`,
        type: 'application/pdf',
      },
    })
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao gerar PDF do contrato.'
    notify.error(msg)
  } finally {
    gerandoPdf.value = false
  }
}

onMounted(async () => {
  await carregarVendas()
  await carregarContrato()
})
</script>
