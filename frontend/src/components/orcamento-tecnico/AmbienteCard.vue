<template>
  <!-- Card de ambiente — gerenciado pelo useProjetoStore -->
  <div
    class="rounded-xl border border-border-ui bg-bg-card overflow-hidden transition-shadow hover:shadow-sm"
    :class="{ 'ring-2 ring-brand-primary': expandido }"
  >
    <!-- ── Cabeçalho do card ───────────────────────────────────── -->
    <div
      class="flex items-center gap-3 px-4 py-3 bg-bg-page border-b border-border-ui cursor-pointer select-none"
      @click="expandido = !expandido"
    >
      <i class="pi pi-box text-brand-primary text-sm" />

      <!-- Nome editável (clique no ícone de lápis abre edição) -->
      <span
        v-if="!editandoNome"
        class="flex-1 font-semibold text-text-main text-sm truncate"
      >{{ ambiente.nome }}</span>
      <input
        v-else
        ref="inputNome"
        v-model="nomeTemp"
        class="flex-1 rounded-lg border border-border-ui bg-white px-2 py-1 text-sm font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-brand-primary"
        @keydown.enter="confirmarNome"
        @keydown.esc="cancelarNome"
        @blur="confirmarNome"
        @click.stop
      />

      <button
        v-if="!editandoNome"
        type="button"
        class="text-text-soft hover:text-brand-primary text-xs p-1 rounded"
        title="Renomear ambiente"
        @click.stop="iniciarEdicaoNome"
      >
        <i class="pi pi-pencil" />
      </button>

      <!-- Subtotal do ambiente -->
      <span class="text-xs tabular-nums font-bold text-[var(--ds-color-success-700)] bg-[var(--ds-color-success-50)] border border-[var(--ds-color-success-200)] px-2 py-0.5 rounded-full">
        {{ formatCurrency(subtotal.preco) }}
      </span>

      <!-- Contador de itens -->
      <span class="text-xs text-text-soft">
        {{ ambiente.itens.length }} item(s)
      </span>

      <!-- Expandir/colapsar -->
      <i class="pi text-text-soft text-xs" :class="expandido ? 'pi-chevron-up' : 'pi-chevron-down'" />

      <!-- Remover ambiente -->
      <button
        type="button"
        class="text-[var(--ds-color-danger-400)] hover:text-[var(--ds-color-danger-600)] p-1 rounded text-xs"
        title="Excluir ambiente"
        @click.stop="pedirRemocao"
      >
        <i class="pi pi-trash" />
      </button>
    </div>

    <!-- ── Corpo expandido ────────────────────────────────────── -->
    <div v-show="expandido" class="p-4 space-y-4">

      <!-- Medidas Vendedor | Técnico -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Vendedor -->
        <div class="rounded-lg border border-border-ui bg-white p-3 space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft flex items-center gap-1">
            <i class="pi pi-user text-text-faint" />
            Medidas do Vendedor (pré-medição)
          </p>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[10px] text-text-soft mb-0.5">Largura (mm)</label>
              <input
                :value="ambiente.medidaVendedor.largura_m || ''"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm text-center"
                @change="atualizarMedida('vendedor', 'largura_m', $event.target.value)"
              />
            </div>
            <div>
              <label class="block text-[10px] text-text-soft mb-0.5">Pé direito (mm)</label>
              <input
                :value="ambiente.medidaVendedor.altura_m || ''"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm text-center"
                @change="atualizarMedida('vendedor', 'altura_m', $event.target.value)"
              />
            </div>
            <div>
              <label class="block text-[10px] text-text-soft mb-0.5">Prof. (mm)</label>
              <input
                :value="ambiente.medidaVendedor.profundidade_m || ''"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm text-center"
                @change="atualizarMedida('vendedor', 'profundidade_m', $event.target.value)"
              />
            </div>
          </div>
          <p class="text-[10px] text-text-soft">
            Área estimada:
            <strong class="tabular-nums">
              {{ areaVendedor.toFixed(3) }} m²
            </strong>
          </p>
        </div>

        <!-- Técnico -->
        <div class="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
            <i class="pi pi-ruler text-blue-400" />
            Medidas Técnicas (campo)
          </p>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[10px] text-blue-500 mb-0.5">Largura (mm)</label>
              <input
                :value="ambiente.medidaTecnica.largura_m || ''"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-blue-300 bg-white px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-400"
                @change="atualizarMedida('tecnica', 'largura_m', $event.target.value)"
              />
            </div>
            <div>
              <label class="block text-[10px] text-blue-500 mb-0.5">Pé direito (mm)</label>
              <input
                :value="ambiente.medidaTecnica.altura_m || ''"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-blue-300 bg-white px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-400"
                @change="atualizarMedida('tecnica', 'altura_m', $event.target.value)"
              />
            </div>
            <div>
              <label class="block text-[10px] text-blue-500 mb-0.5">Prof. (mm)</label>
              <input
                :value="ambiente.medidaTecnica.profundidade_m || ''"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-blue-300 bg-white px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-400"
                @change="atualizarMedida('tecnica', 'profundidade_m', $event.target.value)"
              />
            </div>
          </div>
          <p class="text-[10px] text-blue-600">
            Área real:
            <strong class="tabular-nums">
              {{ areaTecnica.toFixed(3) }} m²
            </strong>
            <span v-if="diferencaArea !== 0" class="ml-2" :class="Math.abs(diferencaArea) > 0.5 ? 'text-[var(--ds-color-warning-600)]' : 'text-[var(--ds-color-success-600)]'">
              ({{ diferencaArea > 0 ? '+' : '' }}{{ diferencaArea.toFixed(3) }} m² vs. vendedor)
            </span>
          </p>
        </div>
      </div>

      <!-- Tipo de Módulo + Busca de Cor para cálculo por m² de chapa -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Tipo de Módulo -->
        <div class="rounded-lg border border-purple-200 bg-purple-50/40 p-3 space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
            <i class="pi pi-list text-purple-400" />
            Tipo de Módulo (Consumo de Chapa)
          </p>
          <select
            :value="ambiente.tipoModulo || ''"
            class="w-full rounded-lg border border-purple-300 bg-white px-2 py-1.5 text-sm text-text-main focus:ring-1 focus:ring-purple-400"
            @change="(e) => {
              store.atualizarAmbiente(ambiente.id, { tipoModulo: e.target.value })
              recalcularPreco()
            }"
          >
            <option value="">Selecione um tipo...</option>
            <option v-for="tipo in store.TIPOS_MODULO" :key="tipo" :value="tipo">
              {{ tipo }} (Fator {{ store.FATORES_CONSUMO_MODULO[tipo] }})
            </option>
          </select>
          <p v-if="ambiente.tipoModulo" class="text-[10px] text-purple-600">
            Fator selecionado: <strong>{{ store.FATORES_CONSUMO_MODULO[ambiente.tipoModulo] }}</strong>
          </p>
        </div>

        <!-- Busca de Cor (Nome do Material) -->
        <div class="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-2 relative">
          <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <i class="pi pi-palette text-indigo-400" />
            Cor da Chapa (buscar por nome)
          </p>
          <input
            v-model="buscaCor"
            type="text"
            placeholder="Ex: Gianduia, Branco, Designer..."
            class="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-400"
            @input="onBuscaCorInput"
            @focus="mostrarSugestoesCor = true"
          />

          <!-- Dropdown de cores sugeridas -->
          <div
            v-if="mostrarSugestoesCor && (buscandoCores || coresFiltradas.length > 0)"
            class="absolute left-0 right-0 z-20 mt-1 top-full max-h-48 overflow-auto rounded-lg border border-indigo-300 bg-white shadow-md"
          >
            <div v-if="buscandoCores" class="px-3 py-2 text-xs text-text-soft">Buscando cores...</div>
            <button
              v-for="cor in coresFiltradas"
              :key="cor.id"
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-indigo-100 last:border-b-0"
              @click="selecionarCor(cor)"
            >
              <p class="text-sm font-medium text-text-main">{{ cor.nome_cor }}</p>
              <p class="text-[10px] text-text-soft">
                {{ cor.categoria }} · Venda {{ formatCurrency(cor.valor_m2) }}/m²
              </p>
            </button>
          </div>

          <!-- Cor selecionada (badge) -->
          <div v-if="ambiente.corSelecionada" class="flex items-center gap-2 text-xs">
            <span class="inline-block w-3 h-3 rounded-full bg-indigo-500" />
            <span class="text-text-main font-medium">{{ ambiente.corSelecionada.nome_cor }}</span>
            <span class="text-text-soft">Venda {{ formatCurrency(ambiente.corSelecionada.valor_m2) }}/m²</span>
            <button
              type="button"
              class="ml-auto text-text-soft hover:text-[var(--ds-color-danger-500)]"
              @click="removerCorSelecionada"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>
        </div>
      </div>

      <!-- Resumo do cálculo de chapa (se tipo de módulo + cor estão selecionados) -->
      <div v-if="ambiente.tipoModulo && ambiente.corSelecionada" class="rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-3">
        <p class="text-xs font-semibold text-purple-700 mb-2">
          <i class="pi pi-calculator mr-1" />
          Cálculo Automático: {{ ambiente.tipoModulo }}
        </p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p class="text-text-soft">Área do desenho</p>
            <p class="font-bold text-text-main">{{ areaVendedor.toFixed(3) }} m²</p>
          </div>
          <div>
            <p class="text-text-soft">Fator de consumo</p>
            <p class="font-bold text-text-main">× {{ store.FATORES_CONSUMO_MODULO[ambiente.tipoModulo] }}</p>
          </div>
          <div>
            <p class="text-text-soft">m² de chapa</p>
            <p class="font-bold text-[var(--ds-color-success-600)]">{{ (areaVendedor * store.FATORES_CONSUMO_MODULO[ambiente.tipoModulo]).toFixed(3) }} m²</p>
          </div>
          <div>
            <p class="text-text-soft">Preço de venda</p>
            <p class="font-bold text-[var(--ds-color-success-700)]">{{ formatCurrency((areaVendedor * store.FATORES_CONSUMO_MODULO[ambiente.tipoModulo]) * ambiente.corSelecionada.valor_m2) }}</p>
          </div>
        </div>
      </div>

      <!-- Importação de arquivo Promob -->
      <div class="rounded-lg border border-dashed border-border-ui bg-white p-3">
        <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft mb-2">
          <i class="pi pi-upload mr-1" />
          Importar arquivo Promob (CSV/XML) — {{ ambiente.nome }}
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.xml,.txt"
            class="hidden"
            @change="onFileChange"
          />
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-border-ui bg-bg-page px-3 py-1.5 text-sm font-medium text-text-main hover:bg-bg-page transition"
            @click="fileInput?.click()"
          >
            <i class="pi pi-folder-open text-xs" />
            {{ arquivo?.name || 'Escolher arquivo' }}
          </button>
          <button
            type="button"
            :disabled="!arquivo || importando"
            class="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white transition disabled:opacity-50 hover:opacity-90"
            @click="executarImport"
          >
            <i :class="importando ? 'pi pi-spin pi-spinner' : 'pi pi-sync'" class="text-xs" />
            {{ importando ? 'Importando...' : 'Importar e cruzar' }}
          </button>
          <span v-if="arquivo" class="text-xs text-text-soft">{{ arquivo.name }}</span>
        </div>
      </div>

      <!-- Materiais adicionais / acessórios -->
      <div class="rounded-lg border border-border-ui bg-white p-3 space-y-3">
        <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft">
          <i class="pi pi-sliders-h mr-1" />
          MATERIAIS ADICIONAIS / ACESSORIOS
        </p>

        <div class="grid gap-2 md:grid-cols-12 items-end">
          <div class="md:col-span-7 relative">
            <label class="block text-[10px] text-text-soft mb-0.5">Buscar produto (nao MDF/chapa)</label>
            <input
              v-model="buscaProduto"
              type="text"
              placeholder="Ex: puxador cava, aramado, dobradica especial"
              class="w-full rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm"
              @input="onBuscaProdutoInput"
              @focus="mostrarSugestoes = true"
            />

            <div
              v-if="mostrarSugestoes && (buscandoProdutos || produtosFiltrados.length > 0)"
              class="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-border-ui bg-white shadow-sm"
            >
              <div v-if="buscandoProdutos" class="px-3 py-2 text-xs text-text-soft">Buscando produtos...</div>
              <button
                v-for="p in produtosFiltrados"
                :key="p.id"
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-bg-page border-b border-border-ui/60 last:border-b-0"
                @click="selecionarProdutoAcessorio(p)"
              >
                <p class="text-sm font-medium text-text-main">{{ p.nome_produto }}</p>
                <p class="text-[11px] text-text-soft">
                  {{ p.marca || 'Sem marca' }} · {{ p.categoria_base || 'Sem categoria' }} · {{ formatCurrency(p.valor_unitario) }}
                </p>
              </button>
            </div>
          </div>

          <div class="md:col-span-3" v-if="produtoSelecionado">
            <label class="block text-[10px] text-text-soft mb-0.5">Quantidade</label>
            <input
              v-model.number="quantidadeAcessorio"
              type="number"
              min="1"
              step="1"
              class="w-full rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm"
            />
          </div>

          <div class="md:col-span-2" v-if="produtoSelecionado">
            <button
              type="button"
              class="w-full rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              @click="adicionarAcessorio"
            >
              Adicionar
            </button>
          </div>
        </div>

        <p v-if="produtoSelecionado" class="text-xs text-text-soft">
          Selecionado: <strong class="text-text-main">{{ produtoSelecionado.nome_produto }}</strong>
        </p>
      </div>

      <!-- Tabela de itens do ambiente -->
      <div class="rounded-lg border border-border-ui overflow-hidden">
        <div class="flex items-center justify-between px-3 py-2 bg-bg-page border-b border-border-ui">
          <p class="text-xs font-bold uppercase tracking-wider text-text-soft">
            Itens do ambiente
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs text-brand-primary font-semibold hover:underline"
            @click="mostrarFormManual = !mostrarFormManual"
          >
            <i class="pi pi-plus text-[10px]" />
            Item manual
          </button>
        </div>

        <!-- Formulário de item manual (inline) -->
        <div v-if="mostrarFormManual" class="p-3 border-b border-border-ui bg-[var(--ds-color-success-50)] grid gap-2 sm:grid-cols-4">
          <input
            v-model="novoItem.descricao"
            type="text"
            placeholder="Descrição"
            class="rounded-lg border border-border-ui px-2 py-1.5 text-sm col-span-2"
          />
          <input
            v-model.number="novoItem.quantidade"
            type="number"
            min="1"
            step="1"
            placeholder="Qtd"
            class="rounded-lg border border-border-ui px-2 py-1.5 text-sm"
          />
          <input
            v-model.number="novoItem.preco_unitario"
            type="number"
            min="0"
            step="0.01"
            placeholder="Preço unit. (R$)"
            class="rounded-lg border border-border-ui px-2 py-1.5 text-sm"
          />
          <input
            v-model="novoItem.material"
            type="text"
            placeholder="Material (opcional)"
            class="rounded-lg border border-border-ui px-2 py-1.5 text-sm sm:col-span-2"
          />
          <input
            v-model.number="novoItem.custo_unitario"
            type="number"
            min="0"
            step="0.01"
            placeholder="Custo unit. (R$)"
            class="rounded-lg border border-border-ui px-2 py-1.5 text-sm"
          />
          <div class="flex gap-2 items-center sm:col-span-1">
            <button
              type="button"
              :disabled="!novoItem.descricao.trim()"
              class="flex-1 rounded-xl bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              @click="adicionarItemManual"
            >
              Adicionar
            </button>
            <button
              type="button"
              class="text-text-soft hover:text-[var(--ds-color-danger-500)] text-xs"
              @click="cancelarFormManual"
            >
              <i class="pi pi-times" />
            </button>
          </div>
        </div>

        <!-- Lista de itens -->
        <table v-if="ambiente.itens.length" class="w-full text-sm">
          <thead class="bg-bg-page border-b border-border-ui text-xs">
            <tr>
              <th class="px-3 py-2 text-left font-semibold text-text-soft">Descrição</th>
              <th class="px-3 py-2 text-left font-semibold text-text-soft">Material</th>
              <th class="px-2 py-2 text-right font-semibold text-text-soft">Qtd</th>
              <th class="px-2 py-2 text-right font-semibold text-text-soft">Área m²</th>
              <th class="px-3 py-2 text-right font-semibold text-text-soft">Custo</th>
              <th class="px-3 py-2 text-right font-semibold text-text-soft">Preço</th>
              <th class="px-3 py-2 text-center font-semibold text-text-soft w-8">Src</th>
              <th class="w-8" />
            </tr>
          </thead>
          <tbody class="divide-y divide-border-ui bg-white">
            <tr
              v-for="item in ambiente.itens"
              :key="item.id"
              class="hover:bg-bg-page transition-colors"
            >
              <td class="px-3 py-2 text-text-main font-medium max-w-[200px] truncate">{{ item.descricao }}</td>
              <td class="px-3 py-2 text-text-soft text-xs">{{ item.material || '—' }}</td>
              <td class="px-2 py-2 text-right tabular-nums">{{ item.quantidade }}</td>
              <td class="px-2 py-2 text-right tabular-nums text-xs text-text-soft">
                {{ item.area_m2 > 0 ? item.area_m2.toFixed(3) : '—' }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-xs text-text-soft">
                {{ formatCurrency(item.custo_unitario * (item.area_m2 > 0 ? item.area_m2 : 1) * item.quantidade) }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums font-semibold text-[var(--ds-color-success-700)]">
                {{ formatCurrency(item.preco_unitario * (item.area_m2 > 0 ? item.area_m2 : 1) * item.quantidade) }}
              </td>
              <td class="px-3 py-2 text-center">
                <span
                  class="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                  :class="item.origem === 'promob' ? 'bg-blue-100 text-blue-700' : 'bg-[var(--ds-color-warning-100)] text-[var(--ds-color-warning-700)]'"
                >
                  {{ item.origem === 'promob' ? 'CSV' : 'Man.' }}
                </span>
              </td>
              <td class="px-2 py-2 text-center">
                <button
                  type="button"
                  class="text-[var(--ds-color-danger-300)] hover:text-[var(--ds-color-danger-500)] text-xs"
                  title="Remover item"
                  @click="store.removerItem(ambiente.id, item.id)"
                >
                  <i class="pi pi-trash" />
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-border-ui bg-bg-page">
            <tr>
              <td colspan="4" class="px-3 py-2 text-xs text-text-soft font-semibold">Subtotal do ambiente</td>
              <td class="px-3 py-2 text-right tabular-nums font-bold text-text-main text-xs">
                {{ formatCurrency(subtotal.custo) }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums font-bold text-[var(--ds-color-success-700)]">
                {{ formatCurrency(subtotal.preco) }}
              </td>
              <td colspan="2" />
            </tr>
          </tfoot>
        </table>

        <div v-else class="px-3 py-6 text-center text-xs text-text-soft">
          Nenhum item ainda. Importe um arquivo Promob ou adicione itens manualmente.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useProjetoStore } from '@/stores/useProjetoStore'
import { ProdutosService } from '@/services'
import { notify } from '@/services/notify'

const props = defineProps({
  /** Objeto Ambiente do store (referência direta) */
  ambiente: { type: Object, required: true },
  /** Configuração de custo usada no import Promob */
  custoConfig: { type: Object, default: () => ({}) },
})

const store = useProjetoStore()

// ── Estado local do card ──────────────────────────────────────────────────────

const expandido = ref(true)
const editandoNome = ref(false)
const nomeTemp = ref('')
const inputNome = ref(null)

const fileInput = ref(null)
const arquivo = ref(null)
const importando = ref(false)

const mostrarFormManual = ref(false)
const novoItem = ref(itemVazio())

const buscaProduto = ref('')
const buscandoProdutos = ref(false)
const produtosFiltrados = ref([])
const produtoSelecionado = ref(null)
const quantidadeAcessorio = ref(1)
const mostrarSugestoes = ref(false)
let buscaProdutoTimer = null

// Busca de cores para cálculo por m² de chapa
const buscaCor = ref('')
const buscandoCores = ref(false)
const coresFiltradas = ref([])
const mostrarSugestoesCor = ref(false)
let buscaCorTimer = null

function itemVazio() {
  return { descricao: '', material: '', quantidade: 1, preco_unitario: 0, custo_unitario: 0, area_m2: 0 }
}

// ── Computed ──────────────────────────────────────────────────────────────────

const subtotal = computed(() => {
  return store.subtotalPorAmbiente[props.ambiente.id] ?? { custo: 0, preco: 0 }
})

const areaVendedor = computed(() => {
  const { largura_m, altura_m } = props.ambiente.medidaVendedor
  const lMm = Number(largura_m || 0)
  const hMm = Number(altura_m || 0)
  const lM = lMm / 1000
  const hM = hMm / 1000
  return lM > 0 && hM > 0 ? lM * hM : 0
})

const areaTecnica = computed(() => {
  const { largura_m, altura_m } = props.ambiente.medidaTecnica
  const lMm = Number(largura_m || 0)
  const hMm = Number(altura_m || 0)
  const lM = lMm / 1000
  const hM = hMm / 1000
  return lM > 0 && hM > 0 ? lM * hM : 0
})

const diferencaArea = computed(() => areaTecnica.value - areaVendedor.value)

watch(
  () => [
    Number(props.ambiente?.medidaVendedor?.largura_m || 0),
    Number(props.ambiente?.medidaVendedor?.altura_m || 0),
    Number(props.ambiente?.medidaTecnica?.largura_m || 0),
    Number(props.ambiente?.medidaTecnica?.altura_m || 0),
    areaVendedor.value,
  ],
  async () => {
    await store.calcularPrecoAmbiente(props.ambiente.id)
  },
  { immediate: true },
)

// ── Edição de nome ─────────────────────────────────────────────────────────────

function iniciarEdicaoNome() {
  nomeTemp.value = props.ambiente.nome
  editandoNome.value = true
  nextTick(() => inputNome.value?.focus())
}

function confirmarNome() {
  const nome = String(nomeTemp.value || '').trim()
  if (nome && nome !== props.ambiente.nome) {
    store.atualizarAmbiente(props.ambiente.id, { nome })
  }
  editandoNome.value = false
}

function cancelarNome() {
  editandoNome.value = false
}

// ── Medidas ─────────────────────────────────────────────────────────────────────

function atualizarMedida(tipo, campo, valor) {
  store.atualizarMedida(props.ambiente.id, tipo, { [campo]: Number(valor || 0) })
}

// ── Importação Promob ─────────────────────────────────────────────────────────

function onFileChange(e) {
  arquivo.value = e.target.files?.[0] ?? null
  if (fileInput.value) fileInput.value.value = ''
}

async function executarImport() {
  if (!arquivo.value) return
  importando.value = true
  try {
    await store.importarPromob({
      arquivo: arquivo.value,
      ambienteId: props.ambiente.id,
      areaRealM2: areaTecnica.value,
      custoConfig: props.custoConfig,
    })
    arquivo.value = null
  } finally {
    importando.value = false
  }
}

// ── Item manual ───────────────────────────────────────────────────────────────

function adicionarItemManual() {
  const desc = String(novoItem.value.descricao || '').trim()
  if (!desc) return
  store.adicionarItemManual(props.ambiente.id, { ...novoItem.value, descricao: desc })
  novoItem.value = itemVazio()
  mostrarFormManual.value = false
}

function cancelarFormManual() {
  novoItem.value = itemVazio()
  mostrarFormManual.value = false
}

// ── Materiais adicionais / acessórios ───────────────────────────────────────

function isProdutoChapa(produto) {
  const categoria = String(produto?.categoria_base || '').trim().toUpperCase()
  if (categoria === 'PRIMARIA' || categoria === 'SECUNDARIA' || categoria === 'TERCIARIA') {
    return true
  }

  const nome = String(produto?.nome_produto || '').toLowerCase()
  return nome.includes('mdf') || nome.includes('chapa')
}

async function buscarProdutosAcessorios(termo) {
  const q = String(termo || '').trim()
  if (q.length < 2) {
    produtosFiltrados.value = []
    return
  }

  buscandoProdutos.value = true
  try {
    const res = await ProdutosService.buscarComFiltros({
      nome_produto: q,
      page: 1,
      pageSize: 20,
    })

    const raw = res?.data ?? res ?? []
    const lista = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
    produtosFiltrados.value = lista.filter((p) => !isProdutoChapa(p))
  } catch {
    produtosFiltrados.value = []
  } finally {
    buscandoProdutos.value = false
  }
}

function onBuscaProdutoInput() {
  if (buscaProdutoTimer) clearTimeout(buscaProdutoTimer)
  buscaProdutoTimer = setTimeout(() => {
    buscarProdutosAcessorios(buscaProduto.value)
  }, 250)
}

function selecionarProdutoAcessorio(produto) {
  produtoSelecionado.value = produto
  buscaProduto.value = String(produto?.nome_produto || '')
  quantidadeAcessorio.value = 1
  mostrarSugestoes.value = false
}

function adicionarAcessorio() {
  if (!produtoSelecionado.value) return

  const qtd = Math.max(1, Number(quantidadeAcessorio.value || 1))
  const valorUnitario = Number(produtoSelecionado.value?.valor_unitario || 0)

  store.adicionarItemManual(props.ambiente.id, {
    descricao: String(produtoSelecionado.value?.nome_produto || 'Acessorio'),
    material: String(produtoSelecionado.value?.marca || produtoSelecionado.value?.categoria_base || 'Acessorio'),
    quantidade: qtd,
    preco_unitario: valorUnitario,
    custo_unitario: valorUnitario,
    area_m2: 0,
  })

  notify.success('Acessorio adicionado ao ambiente.')
  produtoSelecionado.value = null
  buscaProduto.value = ''
  produtosFiltrados.value = []
  quantidadeAcessorio.value = 1
}

// ── Remover ambiente ──────────────────────────────────────────────────────────

function pedirRemocao() {
  if (props.ambiente.itens.length > 0) {
    if (!window.confirm(`Remover o ambiente "${props.ambiente.nome}" e seus ${props.ambiente.itens.length} item(s)?`)) return
  }
  store.removerAmbiente(props.ambiente.id)
}

// ── Tipo de Módulo e Cores (m² de chapa) ──────────────────────────────────────

async function buscarCoresMDF(termo) {
  const q = String(termo || '').trim()
  if (q.length < 2) {
    coresFiltradas.value = []
    return
  }

  buscandoCores.value = true
  try {
    const cores = await store.buscarCoresMateriais(q)
    coresFiltradas.value = Array.isArray(cores) ? cores : []
  } catch {
    coresFiltradas.value = []
  } finally {
    buscandoCores.value = false
  }
}

function onBuscaCorInput() {
  if (buscaCorTimer) clearTimeout(buscaCorTimer)
  buscaCorTimer = setTimeout(() => {
    buscarCoresMDF(buscaCor.value)
  }, 250)
}

function selecionarCor(cor) {
  store.atualizarAmbiente(props.ambiente.id, { corSelecionada: cor })
  buscaCor.value = cor.nome_cor
  mostrarSugestoesCor.value = false
  coresFiltradas.value = []
  recalcularPreco()
}

function removerCorSelecionada() {
  store.atualizarAmbiente(props.ambiente.id, { corSelecionada: null })
  buscaCor.value = ''
  recalcularPreco()
}

async function recalcularPreco() {
  if (props.ambiente.tipoModulo && props.ambiente.corSelecionada) {
    await store.calcularPrecoAmbienteComModulo(props.ambiente.id, {
      tipoModulo: props.ambiente.tipoModulo,
      corSelecionada: props.ambiente.corSelecionada,
    })
  }
}

// Watch para mudanças em medidas quando há tipo de módulo + cor
watch(
  () => areaVendedor.value,
  () => {
    if (props.ambiente.tipoModulo && props.ambiente.corSelecionada) {
      recalcularPreco()
    }
  },
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
</script>
