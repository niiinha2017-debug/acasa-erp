<template>
  <div class="login-font w-full h-full mt-4 mb-8 mx-2 lg:mx-4 rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
    <PageHeader
      :title="isEdit ? `Editar Item #${itemId}` : 'Novo Item'"
      subtitle="Cadastro de itens por fornecedor (igual ao cadastro de produtos)"
      icon="pi pi-box"
      :backTo="'/plano-corte/itens'"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
        <div class="w-10 h-10 border-2 border-border-ui border-t-brand-primary rounded-full animate-spin"></div>
        <p class="text-xs font-medium text-text-muted uppercase tracking-widest">Carregando...</p>
      </div>

      <form v-else class="space-y-10 produtos-line-form" @submit.prevent="confirmarSalvar" autocomplete="off">
        <!-- Trava: só habilita o restante após selecionar o fornecedor -->
        <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl">
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="form.fornecedor_id"
              mode="select"
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
                label="Unidade"
                :options="unidadesOptions"
                required
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <SearchInput
                v-model="form.status"
                mode="select"
                label="Status"
                :options="statusOptions"
                required
              />
            </div>
          </template>
        </div>

        <div v-if="camposDesbloqueados" class="space-y-10">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Dados Principais
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <Input
              class="col-span-12 md:col-span-8"
              v-model="form.nome_produto"
              label="Nome do Produto"
              placeholder="Ex: Chapa MDF Branco TX"
              required
              force-upper
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="quantidadeInput"
              label="Quantidade corte"
              type="number"
              required
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.marca"
              label="Marca"
              placeholder="Ex: Duratex"
              force-upper
            />
            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.cor"
              label="Cor"
              placeholder="Ex: Branco TX"
              force-upper
            />
            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.medida"
              label="Medida"
              placeholder="Ex: 2750x1840mm ou espessura"
              force-upper
            />
          </div>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Dimensões e Custos
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <Input class="col-span-12 md:col-span-3" v-model="form.largura_mm" label="Largura (mm)" type="number" />
            <Input class="col-span-12 md:col-span-3" v-model="form.comprimento_mm" label="Comprimento (mm)" type="number" />
            <Input class="col-span-12 md:col-span-3" v-model="form.espessura_mm" label="Espessura (mm)" type="number" />
            <Input class="col-span-12 md:col-span-3" v-model="precoM2Mask" label="Preço por m²" />

            <Input class="col-span-12 md:col-span-4" v-model="valorUnitarioMask" label="Custo Unitário (R$)" required />
            <div class="col-span-12 md:col-span-8">
              <div class="p-4 bg-slate-900 rounded-xl text-white flex flex-col justify-center h-full">
                <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Total</span>
                <span class="text-xl font-semibold tabular-nums">{{ valorTotalMask }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <Button type="button" variant="ghost" @click="confirmarDescartar">
              Cancelar
            </Button>

            <Button
              v-if="can(isEdit ? 'plano_corte.editar' : 'plano_corte.criar')"
              variant="primary"
              size="lg"
              type="submit"
              :loading="salvando"
              :disabled="!camposDesbloqueados"
              class="!rounded-xl px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-primary/90 hover:from-brand-primary hover:to-brand-primary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] transition-all duration-300 group relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span class="relative flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                <i class="pi pi-save text-[14px] group-hover:rotate-12 transition-transform"></i>
                {{ isEdit ? 'ATUALIZAR ITEM' : 'CADASTRAR ITEM' }}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.produtos-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.produtos-line-form :deep(.search-container > label) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgb(100 116 139);
}

.produtos-line-form :deep(input.w-full),
.produtos-line-form :deep(select.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.produtos-line-form :deep(input.w-full:focus),
.produtos-line-form :deep(select.w-full:focus) {
  box-shadow: none;
}
</style>

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
    router.push('/plano-corte/itens')
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
