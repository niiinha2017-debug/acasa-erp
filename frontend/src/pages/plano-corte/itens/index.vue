<template>
    <Card :shadow="true" class="overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-[1.1rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-box text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
              Itens do Plano de Corte
            </h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Cadastro e edição por fornecedor
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
          @click="router.back()"
        >
          Voltar
        </Button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Fornecedor -->
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="fornecedorSelecionado"
              mode="select"
              label="Fornecedor"
              :options="fornecedorOptions"
              required
              @update:modelValue="onSelecionarFornecedor"
            />
          </div>

          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="busca"
              mode="search"
              label="Buscar"
              placeholder="Digite nome / marca / cor..."
            />
          </div>
        </div>

        <!-- Form cadastro/edição -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {{ form.id ? `Editando item #${form.id}` : 'Novo item' }}
              </p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {{ fornecedorSelecionado ? `Fornecedor #${fornecedorSelecionado}` : 'Selecione um fornecedor para habilitar' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Button
                v-if="form.id"
                type="button"
                variant="secondary"
                size="sm"
                class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
                @click="cancelarEdicao"
              >
                Cancelar
              </Button>

<Button
  v-if="can(permSalvarItem())"
  type="button"
  variant="primary"
  size="sm"
  class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
  :loading="salvando"
  :disabled="!podeSalvar"
  @click="salvarItem"
>
  {{ form.id ? 'Salvar alterações' : 'Cadastrar' }}
</Button>

            </div>
          </div>

          <div class="grid grid-cols-12 gap-x-6 gap-y-5">
            <div class="col-span-12 md:col-span-7">
              <Input v-model="form.nome_produto" label="Nome do Produto" required placeholder="EX: MDF BRANCO TX" />
            </div>

            <div class="col-span-12 md:col-span-5">
              <Input v-model="form.marca" label="Marca / Fabricante" placeholder="EX: DURATEX" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.cor" label="Cor / Acabamento" placeholder="EX: BRANCO TX" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.medida" label="Espessura/Medida" placeholder="EX: 18MM" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="form.unidade"
                mode="select"
                label="Unidade"
                :options="unidadesOptions"
                placeholder="SELECIONE..."
                required
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.largura_mm" label="Largura (mm)" type="number" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.comprimento_mm" label="Comprimento (mm)" type="number" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.espessura_mm" label="Espessura (mm)" type="number" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.precoM2Mask" label="Preco por m2" placeholder="0,00" />
            </div>

            <div class="col-span-12">
              <div class="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <CustomCheckbox
                  label="Ativo"
                  description="HABILITA ESTE ITEM PARA NOVOS PLANOS"
                  :model-value="form.status === 'ATIVO'"
                  @update:model-value="(v) => (form.status = v ? 'ATIVO' : 'INATIVO')"
                />
              </div>
            </div>

            <div v-if="erro" class="col-span-12">
              <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-widest text-rose-600">
                  {{ erro }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela -->
        <div class="rounded-2xl border border-slate-200 overflow-hidden">
          <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Itens cadastrados
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
              :loading="loading"
              @click="carregarItens"
              :disabled="!fornecedorSelecionado"
            >
              Atualizar
            </Button>
          </div>

          <Table
            :columns="columns"
            :rows="rowsFiltradas"
            :loading="loading"
            empty-text="Nenhum item encontrado."
          >
            <template #cell-status="{ row }">
              <StatusBadge :value="row.status" />
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end gap-2">
<Button
  v-if="can('plano_corte.editar')"
  type="button"
  variant="ghost"
  size="sm"
  class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
  @click="editar(row)"
>
  Editar
</Button>

<Button
  v-if="can('plano_corte.excluir')"
  type="button"
  variant="danger"
  size="sm"
  class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
  :loading="deletingId === row.id"
  @click="excluir(row)"
>
  Excluir
</Button>

              </div>
            </template>
          </Table>
        </div>
      </div>
    </Card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PlanoCorteService, FornecedorService } from '@/services/index'
import { UNIDADES } from '@/constantes'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { maskMoneyBR } from '@/utils/masks'

definePage({ meta: { perm: 'plano_corte.ver' } })


const router = useRouter()

// fornecedor
const fornecedor = ref([])
const fornecedorSelecionado = ref(null)
const fornecedorOptions = computed(() => fornecedor.value.map(f => ({ label: f.razao_social, value: f.id })))

// busca
const busca = ref('')

// unidades
const unidadesOptions = computed(() => (UNIDADES || []).map(u => ({ label: u.label, value: u.key })))

// listagem
const loading = ref(false)
const itens = ref([])
const permSalvarItem = () => (form.value.id ? 'plano_corte.editar' : 'plano_corte.criar')

// form
const salvando = ref(false)
const erro = ref('')
const deletingId = ref(null)

const form = ref({
  id: null,
  fornecedor_id: null,
  nome_produto: '',
  marca: '',
  cor: '',
  medida: '',
  unidade: 'UN',
  largura_mm: '',
  comprimento_mm: '',
  espessura_mm: '',
  precoM2Mask: 'R$ 0,00',
  status: 'ATIVO',
})

const podeSalvar = computed(() =>
  !!fornecedorSelecionado.value &&
  !!String(form.value.nome_produto || '').trim() &&
  !!form.value.unidade
)

watch(
  () => form.value.precoM2Mask,
  (v) => {
    const n = String(v || '').replace(/\D/g, '')
    form.value.precoM2Mask = maskMoneyBR(n ? Number(n) / 100 : 0)
  },
)

const columns = [
  { key: 'nome_produto', label: 'Nome' },
  { key: 'marca', label: 'Marca', width: '160px' },
  { key: 'cor', label: 'Cor', width: '140px' },
  { key: 'medida', label: 'Medida', width: '140px' },
  { key: 'unidade', label: 'Un', width: '80px', align: 'center' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'acoes', label: '', width: '200px', align: 'right' },
]

const rowsFiltradas = computed(() => {
  const q = String(busca.value || '').trim().toUpperCase()
  if (!q) return itens.value
  return itens.value.filter(r => {
    const s = `${r.nome_produto || ''} ${r.marca || ''} ${r.cor || ''} ${r.medida || ''}`.toUpperCase()
    return s.includes(q)
  })
})

function resetForm(keepFornecedor = true) {
  erro.value = ''
  form.value = {
    id: null,
    fornecedor_id: keepFornecedor ? Number(fornecedorSelecionado.value) : null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    largura_mm: '',
    comprimento_mm: '',
    espessura_mm: '',
    precoM2Mask: 'R$ 0,00',
    status: 'ATIVO',
  }
}

async function onSelecionarFornecedor(v) {
  fornecedorSelecionado.value = v
  resetForm(true)
  itens.value = []
  if (v) await carregarItens()
}

async function carregarItens() {
  if (!can('plano_corte.ver')) return notify.error('Acesso negado.')

  if (!fornecedorSelecionado.value) return
  loading.value = true
  erro.value = ''
  try {
    const { data } = await PlanoCorteService.itens.listar(Number(fornecedorSelecionado.value))
    itens.value = Array.isArray(data) ? data : []
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao carregar itens.'
  } finally {
    loading.value = false
  }
}


function editar(row) {
  if (!can('plano_corte.editar')) return notify.error('Acesso negado.')
  erro.value = ''
  form.value = {
    id: row.id,
    fornecedor_id: Number(row.fornecedor_id || fornecedorSelecionado.value),
    nome_produto: row.nome_produto || '',
    marca: row.marca || '',
    cor: row.cor || '',
    medida: row.medida || '',
    unidade: row.unidade || 'UN',
    largura_mm: row.largura_mm || '',
    comprimento_mm: row.comprimento_mm || '',
    espessura_mm: row.espessura_mm || '',
    precoM2Mask: maskMoneyBR(Number(row.preco_m2 || 0)),
    status: row.status || 'ATIVO',
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelarEdicao() {
  resetForm(true)
}

async function salvarItem() {
  const perm = permSalvarItem()
  if (!can(perm)) return notify.error('Acesso negado.')
  if (!podeSalvar.value) return

  salvando.value = true
  erro.value = ''
  try {
    const precoM2 = Number(String(form.value.precoM2Mask || '').replace(/\D/g, '')) / 100 || 0
    const payload = {
      fornecedor_id: Number(fornecedorSelecionado.value),
      nome_produto: String(form.value.nome_produto || '').trim(),
      marca: String(form.value.marca || '').trim() || null,
      cor: String(form.value.cor || '').trim() || null,
      medida: String(form.value.medida || '').trim() || null,
      unidade: form.value.unidade || null,
      largura_mm: form.value.largura_mm ? Number(form.value.largura_mm) : null,
      comprimento_mm: form.value.comprimento_mm ? Number(form.value.comprimento_mm) : null,
      espessura_mm: form.value.espessura_mm ? Number(form.value.espessura_mm) : null,
      preco_m2: precoM2 || null,
      status: form.value.status || 'ATIVO',

      // obrigatórios do model (se o DTO exigir no create)
      quantidade: 0,
      valor_unitario: 0,
      valor_total: 0,
    }

    await PlanoCorteService.itens.salvar(form.value.id, payload)
    notify.success(form.value.id ? 'Item atualizado!' : 'Item cadastrado!')
    await carregarItens()
    resetForm(true)
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

async function excluir(row) {
  if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show('Excluir Item', 'Deseja excluir este item?')
  if (!ok) return

  deletingId.value = row.id
  erro.value = ''
  try {
    await PlanoCorteService.itens.remover(row.id)
    notify.success('Item removido!')
    await carregarItens()
    if (form.value.id === row.id) resetForm(true)
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao remover.'
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  const { data } = await FornecedorService.listar()
  fornecedor.value = data || []
})
</script>
