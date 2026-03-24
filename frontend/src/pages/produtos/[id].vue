<template>
  <PageShell :padded="false">
    <section class="login-font produto-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Produto #${produtoId}` : 'Novo Produto'"
        subtitle="Gerenciamento de insumos e controle de materiais"
        icon="pi pi-box"
      />

    <div class="produto-body ds-editor-body">
      <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
        <div class="w-10 h-10 border-2 border-border-ui border-t-brand-primary rounded-full animate-spin"></div>
        <p class="text-xs font-medium text-text-muted uppercase tracking-widest">Carregando...</p>
      </div>

      <form v-else class="produto-form ds-editor-form" @submit.prevent="confirmarSalvarProduto" autocomplete="off">
        <div class="produto-form__lead produto-form__lead-grid ds-editor-lead-grid grid grid-cols-12 gap-6 items-end">
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="form.fornecedor_id"
              mode="select"
              variant="line"
              hide-search-icon
              label="Fornecedor Principal *"
              :options="fornecedorOptions"
              required
              placeholder="Selecione o fornecedor"
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
        </div>

        <div>
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
            variant="line"
            class="col-span-12 md:col-span-8"
            v-model="form.nome_produto"
            label="Nome do Produto"
            placeholder="Ex: Chapa MDF Branco TX"
            required
            force-upper
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="quantidadeInput"
            label="Qtd. em Estoque"
            type="number"
            required
          />
          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="estoqueMinimoInput"
            label="Estoque Mínimo"
            type="number"
            placeholder="0"
          />

          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="form.marca"
            label="Marca"
            placeholder="Ex: Duratex"
            force-upper
          />
          <Input
            variant="line"
            class="col-span-12 md:col-span-4"
            v-model="form.cor"
            label="Cor"
            placeholder="Ex: Branco TX"
            force-upper
          />
          <Input
            variant="line"
            v-if="ehFitaBorda"
            class="col-span-12 md:col-span-4"
            v-model="metragemRoloInput"
            label="Metragem do Rolo (m)"
            type="number"
            step="0.001"
            placeholder="Ex: 50"
          />
          <Input
            variant="line"
            v-else
            class="col-span-12 md:col-span-4"
            v-model="form.medida"
            label="Medida"
            placeholder="Ex: 2750x1840mm"
            force-upper
          />
          <SearchInput
            class="col-span-12 md:col-span-6"
            v-model="form.categoria_base"
            mode="select"
            variant="line"
            hide-search-icon
            label="Categoria Base"
            :options="categoriasBaseOptions"
            placeholder="Selecione..."
            required
          />

          <template v-if="ehCategoriaComercial">
            <SearchInput
              class="col-span-12 md:col-span-6"
              v-model="form.fita_vinculada_id"
              mode="select"
              variant="line"
              hide-search-icon
              label="Vincular Fita"
              :options="fitasBordaOptions"
              placeholder="Busque a fita de borda"
            />
            <p class="col-span-12 text-[11px] text-slate-500">
              {{ textoVinculoFita }}
            </p>
          </template>

          <p v-if="ehFitaBorda" class="col-span-12 text-[11px] text-orange-600 font-semibold">
            <i class="pi pi-tag mr-1" />
            Produtos de Fita de Borda usam metragem do rolo para cálculo automático do custo vinculado aos MDFs.
          </p>

          <!-- Sub-categoria exclusiva para Ferragens -->
          <template v-if="ehFerragem">
            <SearchInput
              class="col-span-12 md:col-span-6"
              v-model="form.categoria_ferragem"
              mode="select"
              variant="line"
              hide-search-icon
              label="Categoria da Ferragem *"
              :options="catsFerragem"
              placeholder="Selecione o tipo"
              required
            />
            <p class="col-span-12 text-[11px] text-amber-600 font-semibold">
              <i class="pi pi-wrench mr-1" />
              Este produto será listado como ferragem no Orçamento Técnico.<br />
              Use <strong>Custo Unitário</strong> como preço de compra por unidade.
            </p>
          </template>

          <template v-if="ehInsumo">
            <SearchInput
              class="col-span-12 md:col-span-3"
              v-model="form.unidade"
              mode="select"
              variant="line"
              hide-search-icon
              label="Unidade"
              :options="unidadesConversaoOptions"
              placeholder="Ex: CX, PAR, M, KG"
            />
            <SearchInput
              class="col-span-12 md:col-span-3"
              v-model="form.insumo_unidade_referencia"
              mode="select"
              variant="line"
              hide-search-icon
              label="Unidade de Consumo"
              :options="unidadesConsumoOptions"
              placeholder="Ex: UN, G, MM, M2"
            />
            <Input
              variant="line"
              class="col-span-12 md:col-span-3"
              v-model="insumoFatorConversaoInput"
              label="Fator de Conversão"
              type="number"
              step="0.001"
              placeholder="Ex: 100 (caixa), 1000 (kg)"
            />
            <Input
              variant="line"
              class="col-span-12 md:col-span-3"
              v-model="insumoConsumoM2Input"
              label="Consumo Médio / m2"
              type="number"
              step="0.0001"
              placeholder="Ex: 0,0800"
            />
            <p class="col-span-12 text-[11px] text-slate-500">
              {{ textoConferenciaConversao }}
            </p>
            <p class="col-span-12 text-[11px] text-emerald-700 font-semibold">
              {{ textoCustoInsumoM2 }}
            </p>
          </template>
        </div>

        <div class="section-divider ds-section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title ds-section-title">
              Dimensoes e Custos
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 lg:col-span-4 xl:col-span-3">
            <div class="produto-imagem w-full max-w-[220px]">
              <div
                class="produto-imagem__dropzone relative group w-[200px] max-w-full h-[200px] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
                @click="previewImagem ? abrirPreviewImagem() : (imagemInput?.click())"
              >
                <img v-if="previewImagem" :src="previewImagem" class="w-full h-full object-contain p-3" />
                <div v-else class="text-center p-4">
                  <i class="pi pi-image text-slate-300 text-2xl mb-2"></i>
                  <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter leading-tight">
                    {{ isEdit ? 'Sem imagem anexada' : 'Clique para enviar imagem' }}
                  </p>
                </div>

                <div
                  v-if="(isEdit && can('produtos.editar')) || (!isEdit && can('produtos.criar'))"
                  class="produto-imagem__actions absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  @click.stop
                >
                  <button type="button" @click.stop="imagemInput?.click()" class="p-2 bg-white rounded-lg text-slate-900 hover:scale-110 transition-transform">
                    <i class="pi pi-upload"></i>
                  </button>
                  <button v-if="previewImagem" type="button" @click.stop="confirmarRemoverImagem" class="p-2 bg-white rounded-lg text-rose-600 hover:scale-110 transition-transform">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
              <input ref="imagemInput" type="file" class="hidden" accept="image/*" @change="onImagemPick" />

              <p class="text-[10px] text-slate-500 mt-3 leading-relaxed">
                Imagem principal usada no card e na listagem.
              </p>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-8 xl:col-span-9">
            <div class="grid grid-cols-12 gap-6">
              <Input variant="line" class="col-span-12 md:col-span-3" v-model="form.largura_mm" label="Largura (mm)" type="number" />
              <Input variant="line" class="col-span-12 md:col-span-3" v-model="form.comprimento_mm" label="Comprimento (mm)" type="number" />
              <Input variant="line" class="col-span-12 md:col-span-3" v-model="form.espessura_mm" label="Espessura (mm)" type="number" />
              <Input variant="line" class="col-span-12 md:col-span-3" v-model="precoM2Mask" label="Preco por m2" />

              <Input variant="line" class="col-span-12 md:col-span-4" v-model="adicionalFitaM2Mask" label="ADIC. FITA / M2" />

              <p v-if="ehCategoriaComercial && fitaVinculadaSelecionada" class="col-span-12 text-[11px] text-slate-500 -mt-2">
                Cálculo automático: {{ valorFitaPorMetroLabel }} aplicado a partir da fita {{ fitaVinculadaSelecionada.nome_produto }}.
              </p>

              <Input variant="line" class="col-span-12 md:col-span-4" v-model="valorUnitarioMask" label="Custo Unitario (R$)" required />
              <div class="col-span-12 md:col-span-8">
                <div class="produto-resumo">
                  <span class="produto-resumo__label">Total em Inventario</span>
                  <span class="produto-resumo__value">{{ valorTotalMask }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isEdit && produtoId" class="section-divider ds-section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title ds-section-title">
              Galeria e Retalhos
            </span>
          </div>
        </div>

        <div v-if="isEdit && produtoId" class="produto-assets grid grid-cols-12 gap-6">
          <div class="produto-assets__panel col-span-12 lg:col-span-6">
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">Galeria de fotos</p>
            <div class="flex flex-wrap gap-2 items-start">
              <div
                v-for="arq in galeriaFotos"
                :key="arq.id"
                class="relative group w-16 h-16 rounded-lg overflow-hidden border border-border-ui bg-slate-100 dark:bg-slate-700 shrink-0"
              >
                <img :src="arq.url" class="w-full h-full object-cover" alt="" />
                <button
                  v-if="can('produtos.editar')"
                  type="button"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                  @click="removerFotoGaleria(arq)"
                >
                  <i class="pi pi-trash text-xs" />
                </button>
              </div>
              <label
                v-if="can('produtos.editar')"
                class="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-colors shrink-0"
              >
                <i class="pi pi-plus text-xl text-text-muted" />
                <input type="file" class="hidden" accept="image/*" @change="onGaleriaPick" />
              </label>
            </div>
            <p class="text-[10px] text-slate-500 mt-2">Fotos adicionais do produto.</p>
          </div>

          <div class="produto-assets__panel col-span-12 lg:col-span-6">
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
              <i class="pi pi-box text-amber-500" />
              Retalhos (sobras)
            </p>
            <p class="text-[10px] text-slate-500 mb-3">Sobras cadastradas no Totem para este material.</p>

            <div v-if="retalhosList.length === 0" class="text-sm text-text-muted py-4 text-center">
              Nenhum retalho registrado para este produto.
            </div>

            <div v-else class="overflow-x-auto max-h-[260px] overflow-y-auto">
              <table class="w-full text-xs border border-border-ui rounded-xl overflow-hidden">
                <thead>
                  <tr class="bg-slate-100 dark:bg-slate-700/50">
                    <th class="text-left py-2 px-2 font-medium text-text-muted w-12">Foto</th>
                    <th class="text-left py-2 px-2 font-medium text-text-muted">Dimensões</th>
                    <th class="text-right py-2 px-2 font-medium text-text-muted">Área (m²)</th>
                    <th class="text-left py-2 px-2 font-medium text-text-muted">Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in retalhosList" :key="r.id" class="border-t border-border-ui">
                    <td class="py-2 px-2">
                      <div class="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        <img v-if="r.produto?.imagem_url || r.imagem_url" :src="r.imagem_url || r.produto?.imagem_url" class="w-full h-full object-cover" alt="" />
                        <i v-else class="pi pi-box text-amber-500 text-xs" />
                      </div>
                    </td>
                    <td class="py-2 px-2 text-text-main">{{ r.largura_mm }} × {{ r.comprimento_mm }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-text-main">{{ Number(r.quantidade_m2).toFixed(4) }}</td>
                    <td class="py-2 px-2 text-text-muted">{{ r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="produto-form__actions ds-editor-actions">
          <div class="produto-form__actions-main ds-editor-actions-main flex items-center gap-3 justify-end">
            <Button type="button" variant="secondary" @click="confirmarDescartarProduto">
              Cancelar
            </Button>

            <Button
              v-if="can(isEdit ? 'produtos.editar' : 'produtos.criar')"
              variant="primary"
              type="submit"
              :loading="salvando"
              :disabled="!camposDesbloqueados"
            >
              <i class="pi pi-save mr-2 text-[12px]"></i>
              {{ isEdit ? 'Atualizar Produto' : 'Cadastrar Produto' }}
            </Button>
          </div>
        </div>
        </div>
      </form>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalImagemOpen"
          class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8"
          @click.self="modalImagemOpen = false"
        >
          <div class="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            <button @click="modalImagemOpen = false" class="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
              <i class="pi pi-times"></i>
            </button>
            <div class="p-4 flex items-center justify-center bg-white min-h-[400px]">
              <img :src="previewImagem" class="max-h-[80vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
  </PageShell>
</template>

<style scoped>
.login-font {
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.produto-editor {
  min-height: 100%;
  background: var(--ds-color-surface);
}

.produto-form__lead {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.produto-imagem__dropzone {
  border-radius: 1rem;
  border: 1px dashed rgba(177, 190, 204, 0.9);
  background: rgba(248, 250, 252, 0.86);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.produto-imagem__dropzone:hover {
  border-color: rgba(148, 163, 184, 0.95);
  background: rgba(241, 245, 249, 0.92);
}

.produto-imagem__actions {
  background: rgba(15, 23, 42, 0.38);
}

.produto-resumo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 70px;
  height: 100%;
  padding: 0.95rem 1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.produto-resumo__label {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}

.produto-resumo__value {
  color: var(--ds-color-text);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
}

.produto-assets__panel {
  padding: 0.95rem 0 0.25rem;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.dark .produto-imagem__dropzone {
  border-color: rgba(71, 85, 105, 0.9);
  background: rgba(15, 23, 42, 0.4);
}

.dark .produto-imagem__dropzone:hover {
  border-color: rgba(100, 116, 139, 0.95);
  background: rgba(15, 23, 42, 0.55);
}

.dark .produto-resumo,
.dark .produto-assets__panel,
.dark .produto-form__lead {
  border-color: rgba(51, 71, 102, 0.55);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes'
import { CATEGORIAS_BASE, CATS_FERRAGEM } from '@/constantes/categorias-base'
import { ProdutosService, FornecedorService, EstoqueRetalhoService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { ArquivosService } from '@/services/arquivos.service' 
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { closeTabAndGo } from '@/utils/tabs'

definePage({ meta: { perm: 'produtos.ver' } })

const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const produtoId = computed(() =>
  isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null,
)
const modalImagemOpen = ref(false)

function abrirPreviewImagem() {
  if (!previewImagem.value) return
  modalImagemOpen.value = true
}


const imagemInput = ref(null)
const uploadingImagem = ref(false)
const removendoImagem = ref(false)
const galeriaFotos = ref([])
const uploadingGaleria = ref(false)
const retalhosList = ref([])
const fitasBorda = ref([])
const loadingFitasBorda = ref(false)

const loading = ref(false)
const salvando = ref(false)

const fornecedor = ref([])
const fornecedorOptions = computed(() =>
  (fornecedor.value || []).map((f) => ({
    label: f?.label || f?.razao_social || f?.nome_fantasia || '-',
    value: f?.value ?? f?.id,
  })),
)

const statusOptions = [
  { label: 'ATIVO', value: 'ATIVO' },
  { label: 'INATIVO', value: 'INATIVO' },
]

// ======= FORM (estado numérico) =======
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
  metragem_rolo_m: null,
  preco_m2: 0,
  adicional_fita_m2: 0,
  quantidade: 0,
  estoque_minimo: 0,
  valor_unitario: 0,
  valor_total: 0,
  status: 'ATIVO',
  categoria_base: 'PRIMARIA',
  fita_vinculada_id: null,
  fita_vinculada: null,
  insumo_fator_conversao: null,
  insumo_unidade_referencia: null,
  insumo_consumo_m2: null,
  imagem_url: '',
})

const camposDesbloqueados = computed(() => {
  const baseLiberada = isEdit.value || !!form.value.fornecedor_id
  return (
    baseLiberada &&
    !loading.value &&
    !salvando.value &&
    !uploadingImagem.value &&
    !removendoImagem.value &&
    !uploadingGaleria.value
  )
})

// Arquivo pendente (criação): permite enviar imagem antes de salvar
const pendingImagemFile = ref(null)
const pendingImagemObjectUrl = ref('')
watch(pendingImagemFile, (file) => {
  if (pendingImagemObjectUrl.value) URL.revokeObjectURL(pendingImagemObjectUrl.value)
  pendingImagemObjectUrl.value = file ? URL.createObjectURL(file) : ''
}, { immediate: true })
const previewImagem = computed(() => {
  if (pendingImagemFile.value && pendingImagemObjectUrl.value) return pendingImagemObjectUrl.value
  const url = String(form.value.imagem_url || '').trim()
  return url.length ? url : ''
})

// ======= Inputs auxiliares (máscaras) =======
const quantidadeInput = ref('')
const estoqueMinimoInput = ref('')
const insumoFatorConversaoInput = ref('')
const insumoConsumoM2Input = ref('')
const metragemRoloInput = ref('')
const valorUnitarioMask = ref('R$ 0,00')
const precoM2Mask = ref('R$ 0,00')
const adicionalFitaM2Mask = ref('R$ 0,00')

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
watch(estoqueMinimoInput, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  form.value.estoque_minimo = n ? Number(n) : 0
})

watch(insumoFatorConversaoInput, (v) => {
  const raw = String(v || '').replace(',', '.').trim()
  if (!raw) {
    form.value.insumo_fator_conversao = null
    return
  }
  const n = Number(raw)
  form.value.insumo_fator_conversao = Number.isFinite(n) && n > 0 ? n : null
})

watch(insumoConsumoM2Input, (v) => {
  const raw = String(v || '').replace(',', '.').trim()
  if (!raw) {
    form.value.insumo_consumo_m2 = null
    return
  }
  const n = Number(raw)
  form.value.insumo_consumo_m2 = Number.isFinite(n) && n > 0 ? n : null
})

watch(metragemRoloInput, (v) => {
  const raw = String(v || '').replace(',', '.').trim()
  if (!raw) {
    form.value.metragem_rolo_m = null
    return
  }
  const n = Number(raw)
  form.value.metragem_rolo_m = Number.isFinite(n) && n > 0 ? n : null
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

watch(adicionalFitaM2Mask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  form.value.adicional_fita_m2 = valor

  const formatado = maskMoneyBR(valor)
  if (v !== formatado) adicionalFitaM2Mask.value = formatado
})

// Cálculo automático: Preço por M² = Custo Unitário / área em m² (quando Largura, Comprimento e Custo Unitário preenchidos)
function calcularPrecoM2Automatico() {
  const larg = Number(form.value.largura_mm) || 0
  const comp = Number(form.value.comprimento_mm) || 0
  const custo = Number(form.value.valor_unitario) || 0
  if (larg <= 0 || comp <= 0 || custo <= 0) return
  const areaM2 = (larg / 1000) * (comp / 1000)
  if (areaM2 <= 0) return
  const precoM2 = custo / areaM2
  form.value.preco_m2 = Math.round(precoM2 * 100) / 100
  precoM2Mask.value = maskMoneyBR(form.value.preco_m2)
}
watch(
  () => [form.value.largura_mm, form.value.comprimento_mm, form.value.valor_unitario],
  () => calcularPrecoM2Automatico(),
  { deep: true },
)

// ======= UNIDADES (constantes) =======
const categoriasBaseOptions = computed(() => CATEGORIAS_BASE)
const catsFerragem = computed(() => CATS_FERRAGEM.map((c) => ({ label: c.label, value: c.value })))
const ehInsumo = computed(() => String(form.value.categoria_base || '').trim().toUpperCase() === 'INSUMO')
const ehFerragem = computed(() => String(form.value.categoria_base || '').trim().toUpperCase() === 'FERRAGEM')
const ehFitaBorda = computed(() => String(form.value.categoria_base || '').trim().toUpperCase() === 'FITA_BORDA')
const ehCategoriaComercial = computed(() => ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'].includes(String(form.value.categoria_base || '').trim().toUpperCase()))
const unidadesConversaoOptions = computed(() =>
  UNIDADES.map((u) => ({ label: u.label, value: u.key })),
)
const unidadesConsumoOptions = [
  { label: 'Unidade (un)', value: 'UN' },
  { label: 'Grama (g)', value: 'G' },
  { label: 'Milímetro (mm)', value: 'MM' },
  { label: 'Metro² (m²)', value: 'M2' },
]
const unidadeCompra = computed(() => String(form.value.unidade || '').trim().toUpperCase())
const custoInsumoReferencia = computed(() => {
  const valorUnitario = Number(form.value.valor_unitario || 0)
  const fator = Number(form.value.insumo_fator_conversao || 0)
  if (fator > 0) return valorUnitario / fator
  return valorUnitario
})
const custoInsumoM2 = computed(() => {
  const consumoM2 = Number(form.value.insumo_consumo_m2 || 0)
  if (!Number.isFinite(consumoM2) || consumoM2 <= 0) return 0
  return custoInsumoReferencia.value * consumoM2
})
const textoConferenciaConversao = computed(() => {
  const unidade = unidadeCompra.value || '-'
  const fator = Number(form.value.insumo_fator_conversao || 0)
  const fatorLabel = fator > 0 ? String(fator) : '-'
  const unidadeConsumo = String(form.value.insumo_unidade_referencia || '-').toUpperCase()
  return `Configuração: 1 ${unidade} será baixado como ${fatorLabel} ${unidadeConsumo} no estoque.`
})
const textoCustoInsumoM2 = computed(() => {
  const consumoM2 = Number(form.value.insumo_consumo_m2 || 0)
  if (!consumoM2 || consumoM2 <= 0) {
    return 'Informe o consumo médio por m2 para o sistema calcular o custo automático do insumo base.'
  }

  return `Custo base calculado: ${maskMoneyBR(custoInsumoReferencia.value)} por ${String(form.value.insumo_unidade_referencia || 'UN').toUpperCase()} x ${consumoM2.toFixed(4)} = ${maskMoneyBR(custoInsumoM2.value)}/m².`
})

function normalizeNumber(value) {
  const raw = String(value ?? '').replace(',', '.').trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function formatarMetragemRolo(metragem) {
  const valor = normalizeNumber(metragem)
  if (valor == null || valor <= 0) return '-'
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} m`
}

function calcularValorFitaPorMetro(produto) {
  const valorUnitario = Number(produto?.valor_unitario || 0)
  const metragemRolo = normalizeNumber(produto?.metragem_rolo_m)
  if (!metragemRolo || metragemRolo <= 0) return 0
  return Math.round(((valorUnitario / metragemRolo) + Number.EPSILON) * 10000) / 10000
}

function montarLabelFita(produto) {
  const partes = [
    produto?.nome_produto,
    produto?.cor,
    formatarMetragemRolo(produto?.metragem_rolo_m),
    maskMoneyBR(Number(produto?.valor_unitario || 0)),
  ].filter(Boolean)

  return partes.join(' · ')
}

const fitasBordaOptions = computed(() =>
  (fitasBorda.value || []).map((produto) => ({
    value: produto.id,
    label: montarLabelFita(produto),
  })),
)

const fitaVinculadaSelecionada = computed(() => {
  const fitaId = Number(form.value.fita_vinculada_id || 0)
  if (!fitaId) return form.value.fita_vinculada || null
  return fitasBorda.value.find((produto) => Number(produto.id) === fitaId) || form.value.fita_vinculada || null
})

const valorFitaPorMetro = computed(() => calcularValorFitaPorMetro(fitaVinculadaSelecionada.value))
const valorFitaPorMetroLabel = computed(() => `${maskMoneyBR(valorFitaPorMetro.value)}/m`)
const textoVinculoFita = computed(() => {
  if (loadingFitasBorda.value) {
    return 'Carregando fitas de borda disponíveis para vínculo.'
  }
  if (!fitaVinculadaSelecionada.value) {
    return 'Selecione uma Fita de Borda para preencher automaticamente o campo ADIC. FITA / M2.'
  }
  return `${valorFitaPorMetroLabel.value} calculado com base em ${maskMoneyBR(Number(fitaVinculadaSelecionada.value?.valor_unitario || 0))} por ${formatarMetragemRolo(fitaVinculadaSelecionada.value?.metragem_rolo_m)}.`
})

function aplicarDefaultsConversaoInsumo() {
  if (!ehInsumo.value) {
    form.value.insumo_fator_conversao = null
    form.value.insumo_unidade_referencia = null
    form.value.insumo_consumo_m2 = null
    insumoFatorConversaoInput.value = ''
    insumoConsumoM2Input.value = ''
    return
  }

  if (unidadeCompra.value === 'CX') {
    form.value.insumo_unidade_referencia = 'UN'
    if (form.value.insumo_fator_conversao == null || Number(form.value.insumo_fator_conversao) <= 0) {
      form.value.insumo_fator_conversao = null
    }
  } else if (unidadeCompra.value === 'PAR') {
    form.value.insumo_unidade_referencia = 'UN'
    form.value.insumo_fator_conversao = 2
  } else if (unidadeCompra.value === 'M') {
    form.value.insumo_unidade_referencia = 'MM'
    form.value.insumo_fator_conversao = 1000
  } else if (unidadeCompra.value === 'KG') {
    form.value.insumo_unidade_referencia = 'G'
    form.value.insumo_fator_conversao = 1000
  } else {
    if (!form.value.insumo_unidade_referencia) form.value.insumo_unidade_referencia = 'UN'
  }

  insumoFatorConversaoInput.value =
    form.value.insumo_fator_conversao != null ? String(form.value.insumo_fator_conversao) : ''
}

watch(
  () => [form.value.categoria_base, form.value.unidade],
  () => aplicarDefaultsConversaoInsumo(),
)

watch(
  () => form.value.categoria_base,
  (categoriaAtual, categoriaAnterior) => {
    const categoria = String(categoriaAtual || '').trim().toUpperCase()
    const categoriaAnteriorNormalizada = String(categoriaAnterior || '').trim().toUpperCase()

    if (!['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'].includes(categoria)) {
      form.value.fita_vinculada_id = null
      form.value.fita_vinculada = null
    }

    if (categoria !== 'FITA_BORDA') {
      form.value.metragem_rolo_m = null
      metragemRoloInput.value = ''
      if (categoriaAnteriorNormalizada === 'FITA_BORDA') {
        form.value.medida = ''
      }
      return
    }

    form.value.medida = ''
  },
)

watch(
  () => form.value.fita_vinculada_id,
  (fitaId) => {
    if (!ehCategoriaComercial.value) return

    const fitaSelecionada = fitasBorda.value.find((produto) => Number(produto.id) === Number(fitaId || 0))
    form.value.fita_vinculada = fitaSelecionada || null

    if (!fitaSelecionada) {
      form.value.adicional_fita_m2 = 0
      adicionalFitaM2Mask.value = maskMoneyBR(0)
      return
    }

    const adicionalCalculado = calcularValorFitaPorMetro(fitaSelecionada)
    form.value.adicional_fita_m2 = adicionalCalculado
    adicionalFitaM2Mask.value = maskMoneyBR(adicionalCalculado)
  },
)
// ======= CRUD =======
function validar() {
  if (!form.value.fornecedor_id) return 'Selecione o fornecedor.'
  if (!form.value.nome_produto) return 'Informe o nome do produto.'
  if (ehFitaBorda.value && (!form.value.metragem_rolo_m || Number(form.value.metragem_rolo_m) <= 0)) return 'Informe a metragem do rolo da fita.'
  if (ehInsumo.value && !form.value.unidade) return 'Selecione a unidade.'
  if (ehInsumo.value && !form.value.insumo_unidade_referencia) return 'Selecione a unidade de consumo.'
  if (ehInsumo.value && (!form.value.insumo_consumo_m2 || Number(form.value.insumo_consumo_m2) <= 0)) return 'Informe o consumo médio por m2 do insumo.'
  if (ehInsumo.value && unidadeCompra.value === 'CX' && (!form.value.insumo_fator_conversao || Number(form.value.insumo_fator_conversao) <= 0)) {
    return 'Informe o fator de conversão da caixa (ex.: 500).'
  }
  if (!form.value.quantidade || Number(form.value.quantidade) <= 0) return 'Informe a quantidade.'
  if (!form.value.valor_unitario || Number(form.value.valor_unitario) <= 0) return 'Informe o valor unitário.'
  if (!form.value.status) return 'Informe o status.'
  if (!form.value.categoria_base) return 'Selecione a categoria base.'
  return null
}

function resetForm() {
  form.value = {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    categoria_base: 'PRIMARIA',
    fita_vinculada_id: null,
    fita_vinculada: null,
    categoria_ferragem: null,
    metragem_rolo_m: null,
    insumo_fator_conversao: null,
    insumo_unidade_referencia: null,
    insumo_consumo_m2: null,
    unidade: '',
    largura_mm: null,
    comprimento_mm: null,
    espessura_mm: null,
    preco_m2: 0,
    adicional_fita_m2: 0,
    quantidade: 0,
    estoque_minimo: 0,
    valor_unitario: 0,
    valor_total: 0,
    status: 'ATIVO',
    imagem_url: '',
  }
  quantidadeInput.value = ''
  estoqueMinimoInput.value = ''
  insumoFatorConversaoInput.value = ''
  insumoConsumoM2Input.value = ''
  metragemRoloInput.value = ''
  valorUnitarioMask.value = 'R$ 0,00'
  precoM2Mask.value = 'R$ 0,00'
  adicionalFitaM2Mask.value = 'R$ 0,00'
  pendingImagemFile.value = null
}

async function carregarFornecedor() {
  const res = await FornecedorService.select()
  const data = res?.data ?? res
  fornecedor.value = Array.isArray(data) ? data : []
}

async function carregarFitasBorda() {
  loadingFitasBorda.value = true
  try {
    const res = await ProdutosService.buscarComFiltros({ categoria_base: 'FITA_BORDA' })
    const data = res?.data ?? res
    const lista = Array.isArray(data) ? data : []
    fitasBorda.value = lista.map((produto) => ({
      ...produto,
      metragem_rolo_m: normalizeNumber(produto?.metragem_rolo_m),
      valor_unitario: Number(produto?.valor_unitario || 0),
    }))
  } catch (err) {
    console.error(err)
    fitasBorda.value = []
    notify.error('Erro ao carregar fitas de borda.')
  } finally {
    loadingFitasBorda.value = false
  }
}

async function carregarProduto() {
  const res = await ProdutosService.buscar(produtoId.value)
  const data = res?.data ?? res

  form.value = {
    ...form.value,
    ...data,
    fornecedor_id: data.fornecedor_id ?? null,
    largura_mm: data.largura_mm ?? null,
    comprimento_mm: data.comprimento_mm ?? null,
    espessura_mm: data.espessura_mm ?? null,
    metragem_rolo_m: data.metragem_rolo_m == null ? null : Number(data.metragem_rolo_m),
    preco_m2: Number(data.preco_m2 || 0),
    adicional_fita_m2: Number(data.adicional_fita_m2 || 0),
    quantidade: Number(data.quantidade || 0),
    estoque_minimo: Number(data.estoque_minimo ?? 0),
    categoria_base: data.categoria_base || 'PRIMARIA',
    fita_vinculada_id: data.fita_vinculada_id ?? null,
    fita_vinculada: data.fita_vinculada || null,
    categoria_ferragem: data.categoria_ferragem ?? null,
    insumo_fator_conversao:
      data.insumo_fator_conversao == null ? null : Number(data.insumo_fator_conversao),
    insumo_consumo_m2:
      data.insumo_consumo_m2 == null ? null : Number(data.insumo_consumo_m2),
    unidade: data.unidade || '',
    valor_unitario: Number(data.valor_unitario || 0),
    valor_total: Number(data.valor_total || 0),
    status: data.status || 'ATIVO',
    imagem_url: data.imagem_url || '',
  }

  quantidadeInput.value = form.value.quantidade ? String(form.value.quantidade) : ''
  estoqueMinimoInput.value = form.value.estoque_minimo != null && form.value.estoque_minimo !== '' ? String(form.value.estoque_minimo) : ''
  insumoFatorConversaoInput.value =
    form.value.insumo_fator_conversao != null ? String(form.value.insumo_fator_conversao) : ''
  insumoConsumoM2Input.value =
    form.value.insumo_consumo_m2 != null ? String(form.value.insumo_consumo_m2) : ''
  metragemRoloInput.value = form.value.metragem_rolo_m != null ? String(form.value.metragem_rolo_m) : ''
  valorUnitarioMask.value = maskMoneyBR(form.value.valor_unitario || 0)
  precoM2Mask.value = maskMoneyBR(form.value.preco_m2 || 0)
  adicionalFitaM2Mask.value = maskMoneyBR(form.value.adicional_fita_m2 || 0)

  if (form.value.fita_vinculada && !fitasBorda.value.some((produto) => Number(produto.id) === Number(form.value.fita_vinculada.id))) {
    fitasBorda.value = [
      {
        ...form.value.fita_vinculada,
        metragem_rolo_m: normalizeNumber(form.value.fita_vinculada?.metragem_rolo_m),
        valor_unitario: Number(form.value.fita_vinculada?.valor_unitario || 0),
      },
      ...fitasBorda.value,
    ]
  }
}

async function onImagemPick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return

  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  if (!isEdit.value) {
    pendingImagemFile.value = file
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  if (!can('produtos.editar')) {
    notify.error('Acesso negado.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  uploadingImagem.value = true
  try {
    const res = await ArquivosService.upload({
      ownerType: 'PRODUTO',
      ownerId: produtoId.value,
      categoria: 'IMAGEM',
      slotKey: 'IMAGEM_PRINCIPAL',
      file,
    })

    const arq = res?.data ?? res
    const url = arq?.url
    if (!url) {
      notify.error('Upload ok, mas não retornou URL.')
      return
    }

    form.value.imagem_url = url
    await ProdutosService.salvar(produtoId.value, { imagem_url: url })

    notify.success('Imagem atualizada!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar imagem.')
  } finally {
    uploadingImagem.value = false
    if (imagemInput.value) imagemInput.value.value = ''
  }
}


async function confirmarRemoverImagem() {
  if (!isEdit.value) {
    pendingImagemFile.value = null
    return
  }
  if (!can('produtos.editar')) return notify.error('Acesso negado.')

  const ok = await confirm.show('Remover imagem', 'Deseja remover a imagem deste produto?')
  if (!ok) return

  removendoImagem.value = true
  try {
    await ProdutosService.salvar(produtoId.value, { imagem_url: null })
    form.value.imagem_url = ''
    notify.success('Imagem removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover imagem.')
  } finally {
    removendoImagem.value = false
  }
}

async function carregarGaleriaFotos() {
  if (!isEdit.value || !produtoId.value) return
  try {
    const res = await ArquivosService.listar({ ownerType: 'PRODUTO', ownerId: produtoId.value })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : (arr?.data ?? [])
    galeriaFotos.value = lista.filter((a) => String(a.slot_key || '').startsWith('GALERIA_'))
  } catch {
    galeriaFotos.value = []
  }
}

async function carregarRetalhos() {
  if (!isEdit.value || !produtoId.value) return
  try {
    const res = await EstoqueRetalhoService.listarPorProduto(produtoId.value)
    const data = res?.data ?? res
    retalhosList.value = Array.isArray(data) ? data : []
  } catch {
    retalhosList.value = []
  }
}

async function onGaleriaPick(e) {
  const file = e?.target?.files?.[0]
  if (!file || !produtoId.value || !can('produtos.editar')) return
  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
    e.target.value = ''
    return
  }
  uploadingGaleria.value = true
  try {
    await ArquivosService.upload({
      ownerType: 'PRODUTO',
      ownerId: produtoId.value,
      categoria: 'GALERIA',
      slotKey: 'GALERIA_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      file,
    })
    notify.success('Foto adicionada à galeria.')
    await carregarGaleriaFotos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar foto.')
  } finally {
    uploadingGaleria.value = false
    e.target.value = ''
  }
}

async function removerFotoGaleria(arq) {
  if (!can('produtos.editar')) return
  const ok = await confirm.show('Remover foto', 'Remover esta foto da galeria?')
  if (!ok) return
  try {
    await ArquivosService.remover(arq.id)
    galeriaFotos.value = galeriaFotos.value.filter((f) => f.id !== arq.id)
    notify.success('Foto removida.')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover.')
  }
}

async function confirmarSalvarProduto() {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    isEdit.value ? 'Salvar Alterações' : 'Finalizar Cadastro',
    isEdit.value
      ? `Deseja salvar as alterações do Produto #${produtoId.value}?`
      : 'Deseja finalizar o cadastro deste produto?',
  )
  if (!ok) return
  await salvar()
}
function abrirImagem() {
  if (!previewImagem.value) return
  window.open(previewImagem.value, '_blank')
}


async function confirmarDescartarProduto() {
  const ok = await confirm.show('Descartar', 'Deseja sair sem salvar? As alterações serão perdidas.')
  if (!ok) return
  router.push('/produtos')
}

async function salvar() {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const erro = validar()
  if (erro) return alert(erro)

  salvando.value = true
  try {
    const payload = {
      ...form.value,
      fornecedor_id: Number(form.value.fornecedor_id),
      largura_mm:
        form.value.largura_mm === null || form.value.largura_mm === ''
          ? null
          : Number(form.value.largura_mm),
      comprimento_mm:
        form.value.comprimento_mm === null || form.value.comprimento_mm === ''
          ? null
          : Number(form.value.comprimento_mm),
      espessura_mm:
        form.value.espessura_mm === null || form.value.espessura_mm === ''
          ? null
          : Number(form.value.espessura_mm),
      metragem_rolo_m:
        ehFitaBorda.value && form.value.metragem_rolo_m != null
          ? Number(form.value.metragem_rolo_m)
          : null,
      preco_m2: Number(form.value.preco_m2 || 0),
      adicional_fita_m2: Number(form.value.adicional_fita_m2 || 0),
      quantidade: Number(form.value.quantidade || 0),
      valor_unitario: Number(form.value.valor_unitario || 0),
      valor_total: Number(form.value.valor_total || 0),
      unidade: form.value.unidade ? String(form.value.unidade) : null,
      marca: form.value.marca ? String(form.value.marca) : null,
      cor: form.value.cor ? String(form.value.cor) : null,
      medida: ehFitaBorda.value ? null : (form.value.medida ? String(form.value.medida) : null),

      // ✅ imagem opcional
      imagem_url: String(form.value.imagem_url || '').trim() || null,
      estoque_minimo: Number(form.value.estoque_minimo ?? 0),
      categoria_base: form.value.categoria_base ? String(form.value.categoria_base).trim().toUpperCase() : 'PRIMARIA',
      fita_vinculada_id:
        ehCategoriaComercial.value && form.value.fita_vinculada_id
          ? Number(form.value.fita_vinculada_id)
          : null,
      categoria_ferragem:
        String(form.value.categoria_base || '').toUpperCase() === 'FERRAGEM'
          ? (form.value.categoria_ferragem ? String(form.value.categoria_ferragem).trim().toUpperCase() : null)
          : null,
      insumo_fator_conversao:
        String(form.value.categoria_base || '').toUpperCase() === 'INSUMO'
          ? (form.value.insumo_fator_conversao == null ? null : Number(form.value.insumo_fator_conversao))
          : null,
      insumo_unidade_referencia:
        String(form.value.categoria_base || '').toUpperCase() === 'INSUMO'
          ? (form.value.insumo_unidade_referencia
              ? String(form.value.insumo_unidade_referencia).trim().toUpperCase()
              : null)
          : null,
      insumo_consumo_m2:
        String(form.value.categoria_base || '').toUpperCase() === 'INSUMO'
          ? (form.value.insumo_consumo_m2 == null ? null : Number(form.value.insumo_consumo_m2))
          : null,
    }

    const res = await ProdutosService.salvar(isEdit.value ? produtoId.value : null, payload)
    const produtoSalvo = res?.data ?? res
    const idNovo = produtoSalvo?.id

    if (!isEdit.value && idNovo && pendingImagemFile.value) {
      uploadingImagem.value = true
      try {
        const up = await ArquivosService.upload({
          ownerType: 'PRODUTO',
          ownerId: idNovo,
          categoria: 'IMAGEM',
          slotKey: 'IMAGEM_PRINCIPAL',
          file: pendingImagemFile.value,
        })
        const arq = up?.data ?? up
        if (arq?.url) await ProdutosService.salvar(idNovo, { imagem_url: arq.url })
      } catch (err) {
        notify.error(err?.response?.data?.message || 'Erro ao enviar imagem.')
      } finally {
        uploadingImagem.value = false
      }
    }

    closeTabAndGo('/produtos')
  } catch (err) {
    console.error(err)
    alert(err?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

onBeforeUnmount(() => {
  if (pendingImagemObjectUrl.value) URL.revokeObjectURL(pendingImagemObjectUrl.value)
})

onMounted(async () => {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/produtos')
    return
  }

  loading.value = true
  try {
    await Promise.all([carregarFornecedor(), carregarFitasBorda()])
    if (isEdit.value) {
      await carregarProduto()
      await Promise.all([carregarGaleriaFotos(), carregarRetalhos()])
    } else {
      resetForm()
      const idFornecedor = route.query.fornecedor
      if (idFornecedor) form.value.fornecedor_id = Number(idFornecedor)
    }
  } catch (err) {
  console.error('[PRODUTOS] erro no mounted:', err)
  notify.error('Erro ao carregar dados iniciais.')
  router.push('/produtos')
} finally {

    loading.value = false
  }
})

</script>
