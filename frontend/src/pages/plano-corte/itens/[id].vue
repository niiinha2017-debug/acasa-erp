<template>
  <PageShell :padded="false">
    <section class="plano-corte-item-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Item #${itemId}` : 'Novo Item'"
        subtitle="Cadastro de itens por fornecedor"
        icon="pi pi-box"
        :backTo="'/plano-corte/itens'"
      />

    <div class="plano-corte-item-editor__body ds-editor-body">
      <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
        <div class="w-10 h-10 border-2 border-border-ui border-t-brand-primary rounded-full animate-spin"></div>
        <p class="text-xs font-medium text-text-muted uppercase tracking-widest">Carregando...</p>
      </div>

      <form v-else class="plano-corte-item-editor__form ds-editor-form" @submit.prevent="confirmarSalvar" autocomplete="off">
        <div class="plano-corte-item-editor__lead ds-editor-lead-grid grid grid-cols-12 items-end">
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="form.fornecedor_id"
              mode="select"
              variant="line"
              hide-search-icon
              label="Fornecedor *"
              :options="fornecedorOptions"
              required
              placeholder="Selecione o fornecedor para habilitar o cadastro"
            />
          </div>

          <p v-if="!camposDesbloqueados" class="col-span-12 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Selecione o fornecedor para habilitar o cadastro do item.
          </p>

          <template v-if="camposDesbloqueados">
            <div class="col-span-12 md:col-span-3">
              <SearchInput
                v-model="form.unidade"
                mode="select"
                variant="line"
                hide-search-icon
                label="Unidade"
                :options="unidadesOptions"
                required
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <SearchInput
                v-model="form.status"
                mode="select"
                variant="line"
                hide-search-icon
                label="Status"
                :options="statusOptions"
                required
              />
            </div>
          </template>
        </div>

        <div v-if="camposDesbloqueados">
          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title">
                Dados Principais
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <Input
              class="col-span-12 md:col-span-8"
              v-model="form.nome_produto"
              variant="line"
              label="Nome do Produto"
              placeholder="Ex: Chapa MDF Branco TX"
              required
              force-upper
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="quantidadeInput"
              variant="line"
              label="Quantidade corte"
              type="number"
              required
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.marca"
              variant="line"
              label="Marca"
              placeholder="Ex: Duratex"
              force-upper
            />
            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.cor"
              variant="line"
              label="Cor"
              placeholder="Ex: Branco TX"
              force-upper
            />
            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.medida"
              variant="line"
              label="Medida"
              placeholder="Ex: 2750x1840mm ou espessura"
              force-upper
            />
          </div>

          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title">
                Dimensões e Custos
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <Input class="col-span-12 md:col-span-3" v-model="form.largura_mm" variant="line" label="Largura (mm)" type="number" />
            <Input class="col-span-12 md:col-span-3" v-model="form.comprimento_mm" variant="line" label="Comprimento (mm)" type="number" />
            <Input class="col-span-12 md:col-span-3" v-model="form.espessura_mm" variant="line" label="Espessura (mm)" type="number" />
            <Input class="col-span-12 md:col-span-3" v-model="precoM2Mask" variant="line" label="Preço por m²" />

            <Input class="col-span-12 md:col-span-4" v-model="valorUnitarioMask" variant="line" label="Custo Unitário (R$)" required />
            <div class="col-span-12 md:col-span-8">
              <div class="p-4 bg-slate-900 rounded-xl text-white flex flex-col justify-center h-full">
                <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Total</span>
                <span class="text-xl font-semibold tabular-nums">{{ valorTotalMask }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ds-editor-actions flex items-center justify-between gap-4">
          <Button type="button" variant="ghost" @click="confirmarDescartar">
            Cancelar
          </Button>

          <div class="ds-editor-actions-main flex items-center gap-3">
            <Button
              v-if="can(isEdit ? 'plano_corte.editar' : 'plano_corte.criar')"
              variant="primary"
              size="lg"
              type="submit"
              :loading="salvando"
              :disabled="!camposDesbloqueados"
            >
              <i class="pi pi-save mr-2 text-[12px]"></i>
              {{ isEdit ? 'ATUALIZAR ITEM' : 'CADASTRAR ITEM' }}
            </Button>
          </div>
        </div>
      </form>
    </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes'
import { PlanoCorteService, FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { closeTabAndGo } from '@/utils/tabs'

definePage({ meta: { perm: 'plano_corte.ver' } })

const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const itemId = computed(() =>
  isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null,
)

const loading = ref(false)
const salvando = ref(false)

const fornecedor = ref([])
const fornecedorOptions = computed(() =>
  (fornecedor.value || []).map((f) => ({ label: f.razao_social, value: f.id })),
)

const statusOptions = [
  { label: 'ATIVO', value: 'ATIVO' },
  { label: 'INATIVO', value: 'INATIVO' },
]

const camposDesbloqueados = computed(() => isEdit.value || !!form.value.fornecedor_id)

const form = ref({
  fornecedor_id: null,
  nome_produto: '',
  marca: '',
  cor: '',
  medida: '',
  unidade: '',
  largura_mm: null,
  comprimento_mm: null,
  espessura_mm: null,
  preco_m2: 0,
  quantidade: 0,
  valor_unitario: 0,
  valor_total: 0,
  status: 'ATIVO',
})

const quantidadeInput = ref('')
const valorUnitarioMask = ref('R$ 0,00')
const precoM2Mask = ref('R$ 0,00')

const valorTotalNumerico = computed(() => {
  const qtd = Number(form.value.quantidade || 0)
  const v = Number(form.value.valor_unitario || 0)
  return qtd * v
})

watch(valorTotalNumerico, (t) => {
  form.value.valor_total = t
})

const valorTotalMask = computed(() => maskMoneyBR(valorTotalNumerico.value))

watch(quantidadeInput, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  form.value.quantidade = n ? Number(n) : 0
  if (v !== n) quantidadeInput.value = n
})

watch(valorUnitarioMask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  form.value.valor_unitario = valor
  const formatado = maskMoneyBR(valor)
  if (v !== formatado) valorUnitarioMask.value = formatado
})

watch(precoM2Mask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  form.value.preco_m2 = valor
  const formatado = maskMoneyBR(valor)
  if (v !== formatado) precoM2Mask.value = formatado
})

const unidadesOptions = computed(() => UNIDADES.map((u) => ({ label: u.label, value: u.key })))

function validar() {
  if (!form.value.fornecedor_id) return 'Selecione o fornecedor.'
  if (!form.value.nome_produto) return 'Informe o nome do produto.'
  if (!form.value.unidade) return 'Selecione a unidade.'
  if (form.value.quantidade == null || form.value.quantidade === '' || Number(form.value.quantidade) < 0) return 'Informe a quantidade corte.'
  if (!form.value.valor_unitario || Number(form.value.valor_unitario) < 0) return 'Informe o valor unitário.'
  if (!form.value.status) return 'Informe o status.'
  return null
}

function resetForm() {
  form.value = {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: '',
    largura_mm: null,
    comprimento_mm: null,
    espessura_mm: null,
    preco_m2: 0,
    quantidade: 0,
    valor_unitario: 0,
    valor_total: 0,
    status: 'ATIVO',
  }
  quantidadeInput.value = ''
  valorUnitarioMask.value = 'R$ 0,00'
  precoM2Mask.value = 'R$ 0,00'
}

async function carregarFornecedores() {
  const res = await FornecedorService.listar()
  const data = res?.data ?? res
  fornecedor.value = Array.isArray(data) ? data : []
}

async function carregarItem() {
  const res = await PlanoCorteService.itens.buscar(itemId.value)
  const data = res?.data ?? res

  form.value = {
    ...form.value,
    ...data,
    fornecedor_id: data.fornecedor_id ?? null,
    largura_mm: data.largura_mm ?? null,
    comprimento_mm: data.comprimento_mm ?? null,
    espessura_mm: data.espessura_mm ?? null,
    preco_m2: Number(data.preco_m2 || 0),
    quantidade: Number(data.quantidade || 0),
    valor_unitario: Number(data.valor_unitario || 0),
    valor_total: Number(data.valor_total || 0),
    status: data.status || 'ATIVO',
  }

  quantidadeInput.value = form.value.quantidade ? String(form.value.quantidade) : ''
  valorUnitarioMask.value = maskMoneyBR(form.value.valor_unitario || 0)
  precoM2Mask.value = maskMoneyBR(form.value.preco_m2 || 0)
}

async function confirmarSalvar() {
  const perm = isEdit.value ? 'plano_corte.editar' : 'plano_corte.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    isEdit.value ? 'Salvar alterações' : 'Cadastrar item',
    isEdit.value
      ? `Deseja salvar as alterações do Item #${itemId.value}?`
      : 'Deseja cadastrar este item?',
  )
  if (!ok) return
  await salvar()
}

async function confirmarDescartar() {
  const ok = await confirm.show('Descartar', 'Deseja sair sem salvar? As alterações serão perdidas.')
  if (!ok) return
  router.push('/plano-corte/itens')
}

async function salvar() {
  const perm = isEdit.value ? 'plano_corte.editar' : 'plano_corte.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const err = validar()
  if (err) {
    notify.error(err)
    return
  }

  salvando.value = true
  try {
    const payload = {
      fornecedor_id: Number(form.value.fornecedor_id),
      nome_produto: String(form.value.nome_produto || '').trim(),
      marca: String(form.value.marca || '').trim() || null,
      cor: String(form.value.cor || '').trim() || null,
      medida: String(form.value.medida || '').trim() || null,
      unidade: form.value.unidade ? String(form.value.unidade) : null,
      largura_mm: form.value.largura_mm === null || form.value.largura_mm === '' ? null : Number(form.value.largura_mm),
      comprimento_mm: form.value.comprimento_mm === null || form.value.comprimento_mm === '' ? null : Number(form.value.comprimento_mm),
      espessura_mm: form.value.espessura_mm === null || form.value.espessura_mm === '' ? null : Number(form.value.espessura_mm),
      preco_m2: Number(form.value.preco_m2 || 0) || null,
      quantidade: Number(form.value.quantidade || 0),
      valor_unitario: Number(form.value.valor_unitario || 0),
      valor_total: Number(form.value.valor_total || 0),
      status: form.value.status || 'ATIVO',
    }

    await PlanoCorteService.itens.salvar(isEdit.value ? itemId.value : null, payload)
    notify.success(isEdit.value ? 'Item atualizado!' : 'Item cadastrado!')
    closeTabAndGo('/plano-corte/itens')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  const perm = isEdit.value ? 'plano_corte.editar' : 'plano_corte.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/plano-corte/itens')
    return
  }

  loading.value = true
  try {
    await carregarFornecedores()
    if (isEdit.value) await carregarItem()
    else {
      resetForm()
      const idFornecedor = route.query.fornecedor
      if (idFornecedor) form.value.fornecedor_id = Number(idFornecedor)
    }
  } catch (err) {
    console.error('[PLANO_CORTE_ITENS] erro no mounted:', err)
    notify.error('Erro ao carregar dados.')
    router.push('/plano-corte/itens')
  } finally {
    loading.value = false
  }
})
</script>
