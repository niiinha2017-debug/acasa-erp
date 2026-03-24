<template>
  <div class="w-full h-full ds-card ds-card--default overflow-hidden animate-page-in">

    <PageHeader
      title="Importar Projeto"
      subtitle="Importe um arquivo CSV ou XML do Promob / Corte Cloud e vincule os materiais às categorias comerciais"
      icon="pi pi-file-import"
      :show-back="true"
    />

    <!-- Stepper -->
    <div class="px-4 md:px-6 py-3 border-b border-border-ui bg-bg-page/60">
      <ol class="flex items-center gap-0">
        <li
          v-for="(step, idx) in steps"
          :key="step.id"
          class="flex items-center"
        >
          <button
            type="button"
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
            :class="activeStep === idx
              ? 'text-brand-primary'
              : idx < activeStep
                ? 'text-[color:var(--ds-color-success)] cursor-pointer'
                : 'text-text-faint cursor-default'"
            :disabled="idx > activeStep"
            @click="idx < activeStep ? activeStep = idx : undefined"
          >
            <span
              class="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shrink-0"
              :class="activeStep === idx
                ? 'bg-brand-primary text-white'
                : idx < activeStep
                  ? 'ds-status-pill--success text-white'
                  : 'bg-bg-page text-text-soft'"
            >
              <i v-if="idx < activeStep" class="pi pi-check text-[10px]"></i>
              <span v-else>{{ idx + 1 }}</span>
            </span>
            {{ step.label }}
          </button>
          <span v-if="idx < steps.length - 1" class="mx-3 text-text-faint text-sm select-none">›</span>
        </li>
      </ol>
    </div>

    <div class="p-4 md:p-6 space-y-5">

      <!-- ── STEP 0: Upload + Configuração da Aba 3 ── -->
      <template v-if="activeStep === 0">
        <!-- Zona de upload -->
        <div
          class="rounded-2xl border-2 border-dashed transition-colors cursor-pointer"
          :class="arrastando ? 'border-brand-primary bg-brand-primary/5' : 'border-border-ui bg-white hover:border-brand-primary/50 hover:bg-bg-page'"
          @dragover.prevent="arrastando = true"
          @dragleave.prevent="arrastando = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <div class="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <span
              class="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              :class="arquivo ? 'ds-surface--success' : 'bg-bg-page'"
            >
              <i
                class="text-2xl"
                :class="arquivo ? 'pi pi-file-check text-[color:var(--ds-color-success)]' : 'pi pi-cloud-upload text-text-faint'"
              ></i>
            </span>
            <div>
              <p class="text-sm font-bold text-text-main">
                {{ arquivo ? arquivo.name : 'Arraste o arquivo aqui ou clique para selecionar' }}
              </p>
              <p class="text-xs text-text-soft mt-1">
                {{ arquivo ? `${(arquivo.size / 1024).toFixed(1)} KB` : 'Formatos aceitos: CSV ou XML (Promob / Corte Cloud). Máx. 10 MB.' }}
              </p>
            </div>
            <button
              v-if="arquivo"
              type="button"
              class="text-[11px] text-text-faint hover:text-[color:var(--ds-color-danger)] underline"
              @click.stop="arquivo = null"
            >
              Remover arquivo
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.xml,.txt"
            class="hidden"
            @change="onFileChange"
          />
        </div>

        <!-- Configuração de custos da Aba 3 -->
        <div class="rounded-xl border border-border-ui bg-white p-4">
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft mb-3">
            Valores da Aba 3 — RH + Fábrica (usados na estimativa de custo)
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-soft mb-1">
                Hora-Homem (R$/m²)
              </label>
              <input
                v-model.number="custoConfig.hora_homem_value"
                type="number"
                min="0"
                step="0.01"
                class="ds-field-line w-full px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-soft mb-1">
                Custo Fixo Fábrica (R$/m²)
              </label>
              <input
                v-model.number="custoConfig.custo_fixo_fabrica_value"
                type="number"
                min="0"
                step="0.01"
                class="ds-field-line w-full px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-text-soft mb-1">
                Acréscimo Global (%)
              </label>
              <input
                v-model.number="custoConfig.acrescimo_pct"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="ds-field-line w-full px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-brand-primary text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            :disabled="!arquivo || importando"
            @click="executarImport"
          >
            <i :class="importando ? 'pi pi-spin pi-spinner' : 'pi pi-upload'" class="text-sm"></i>
            {{ importando ? 'Importando...' : 'Importar Arquivo' }}
          </button>
        </div>
      </template>

      <!-- ── STEP 1: Resultados + Resolução de Pendentes ── -->
      <template v-else-if="activeStep === 1">

        <!-- Resumo da importação -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-xl border border-border-ui bg-white p-3 text-center">
            <p class="text-xs text-text-soft mb-1">Total de peças</p>
            <p class="text-xl font-black text-text-main">{{ importResult.total_pecas_brutas }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-white p-3 text-center">
            <p class="text-xs text-text-soft mb-1">Grupos de material</p>
            <p class="text-xl font-black text-text-main">{{ importResult.total_grupos }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-white p-3 text-center">
            <p class="text-xs text-text-soft mb-1">Encontrados</p>
            <p class="text-xl font-black text-text-main">{{ encontrados }}</p>
          </div>
          <div
            class="rounded-xl p-3 text-center"
            :class="importResult.nao_encontrados > 0 ? 'ds-status-pill--warning border' : 'border border-border-ui bg-white'"
          >
            <p class="text-xs mb-1" :class="importResult.nao_encontrados > 0 ? '' : 'text-text-soft'">Pendentes</p>
            <p class="text-xl font-black" :class="importResult.nao_encontrados > 0 ? '' : 'text-text-main'">{{ importResult.nao_encontrados }}</p>
          </div>
        </div>

        <!-- Tabela de itens -->
        <div class="rounded-xl border border-border-ui bg-white overflow-hidden">
          <div class="px-3 py-2 bg-bg-page border-b border-border-ui flex items-center justify-between gap-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft">
              Itens do Projeto ({{ importResult.itens.length }})
            </p>
            <div class="flex gap-1.5">
              <button
                v-for="f in ['todos', 'encontrados', 'pendentes']"
                :key="f"
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                :class="filtroTabela === f
                  ? 'bg-text-main text-white'
                  : 'border border-border-ui text-text-soft hover:border-border-ui/60'"
                @click="filtroTabela = f"
              >
                {{ f }}
              </button>
            </div>
          </div>
          <div class="overflow-auto max-h-[340px]">
            <table class="w-full min-w-[700px]">
              <thead>
                <tr class="border-b border-border-ui bg-white text-left text-[11px] uppercase tracking-wider text-text-soft">
                  <th class="px-3 py-2.5 font-black">Status</th>
                  <th class="px-3 py-2.5 font-black">Material (arquivo)</th>
                  <th class="px-3 py-2.5 font-black">Produto vinculado</th>
                  <th class="px-3 py-2.5 font-black">Esp.</th>
                  <th class="px-3 py-2.5 font-black text-right">Área m²</th>
                  <th class="px-3 py-2.5 font-black text-right">Custo</th>
                  <th class="px-3 py-2.5 font-black">Categoria manual</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in itensFiltrados"
                  :key="item.nome_original + item.espessura_mm"
                  class="border-b border-border-ui/70 last:border-b-0 hover:bg-bg-page/60 transition-colors"
                >
                  <td class="px-3 py-2">
                    <span
                      class="ds-status-pill inline-flex items-center gap-1 px-2 py-0.5 text-[10px]"
                      :class="item.encontrado ? 'ds-status-pill--success' : 'ds-status-pill--warning'"
                    >
                      <i :class="item.encontrado ? 'pi pi-check' : 'pi pi-exclamation-triangle'" class="text-[9px]"></i>
                      {{ item.encontrado ? 'OK' : 'Pendente' }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs font-semibold text-text-main max-w-[180px] truncate" :title="item.nome_original">
                    {{ item.nome_original }}
                  </td>
                  <td class="px-3 py-2 text-xs text-text-soft max-w-[180px] truncate" :title="item.produto_nome">
                    {{ item.produto_nome || '—' }}
                  </td>
                  <td class="px-3 py-2 text-xs text-text-soft">{{ item.espessura_mm ? `${item.espessura_mm}mm` : '—' }}</td>
                  <td class="px-3 py-2 text-xs tabular-nums text-right font-semibold">{{ item.area_m2.toFixed(3) }}</td>
                  <td class="px-3 py-2 text-right">
                    <span class="text-xs font-black tabular-nums text-text-main">{{ formatCurrency(item.custo_total) }}</span>
                  </td>
                  <td class="px-3 py-2">
                    <select
                      v-if="!item.encontrado"
                      v-model="item._categoria_manual"
                      class="ds-field-line w-full px-2 py-1 text-[11px] font-bold text-text-main"
                    >
                      <option value="">Selecione...</option>
                      <option value="PRIMARIA">Essencial</option>
                      <option value="SECUNDARIA">Desgner</option>
                      <option value="TERCIARIA">Premiun</option>
                    </select>
                    <span v-else class="text-[11px] text-text-faint">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alerta pendentes sem categoria -->
        <div
          v-if="pendenteSemCategoria > 0"
          class="ds-alert ds-alert--warning text-sm flex items-center gap-2"
        >
          <i class="pi pi-info-circle"></i>
          <span>
            <strong>{{ pendenteSemCategoria }} item(ns)</strong> ainda sem categoria definida.
            Preencha a coluna "Categoria manual" para incluí-los no orçamento.
          </span>
        </div>

        <div class="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-border-ui text-text-main hover:bg-bg-page transition-all"
            @click="activeStep = 0"
          >
            <i class="pi pi-arrow-left text-sm"></i>
            Voltar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-brand-primary text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            :disabled="vinculando"
            @click="executarVinculo"
          >
            <i :class="vinculando ? 'pi pi-spin pi-spinner' : 'pi pi-link'" class="text-sm"></i>
            {{ vinculando ? 'Vinculando...' : 'Vincular Materiais por Categoria' }}
          </button>
        </div>
      </template>

      <!-- ── STEP 2: Resultado do Vínculo + Resumo por Categoria ── -->
      <template v-else-if="activeStep === 2">

        <!-- Cards por categoria -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            v-for="(cat, key) in vinculoResult.resumo_por_categoria"
            :key="key"
            class="rounded-xl border p-4"
            :class="catStyle(key).card"
          >
            <div class="flex items-center justify-between mb-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide"
                :class="catStyle(key).badge"
              >
                {{ cat.label }}
              </span>
              <span class="text-[10px] font-semibold" :class="catStyle(key).muted">{{ cat.itens }} grupo(s)</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-text-soft">Área total</span>
                <span class="font-bold tabular-nums">{{ cat.area_m2.toFixed(3) }} m²</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-soft">Custo material</span>
                <span class="font-bold tabular-nums">{{ formatCurrency(cat.custo_material) }}</span>
              </div>
              <div class="flex justify-between border-t border-border-ui/40 pt-1.5 mt-1.5">
                <span class="font-semibold" :class="catStyle(key).text">CMV estimado</span>
                <span class="font-black tabular-nums" :class="catStyle(key).text">{{ formatCurrency(cat.custo_cmv) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumo financeiro total -->
        <div class="rounded-xl border border-border-ui bg-white p-4">
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft mb-3">Resumo Financeiro do Projeto</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-soft">Área vinculada</span>
                <span class="font-bold tabular-nums">{{ vinculoResult.area_vinculada_m2?.toFixed(3) }} m²</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-soft">Custo material real</span>
                <span class="font-bold tabular-nums text-[color:var(--ds-color-success)]">{{ formatCurrency(vinculoResult.custo_material_total) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-soft">CMV total (fórmula matriz)</span>
                <span class="font-bold tabular-nums text-blue-700">{{ formatCurrency(vinculoResult.custo_cmv_total) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="flex items-center gap-1.5 text-text-soft">
                  RH + Fábrica estimado
                  <span class="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                    <i class="pi pi-sync text-[8px]"></i> Aba 3
                  </span>
                </span>
                <span class="font-bold tabular-nums text-text-main">{{ formatCurrency(vinculoResult.custo_rh_estimado) }}</span>
              </div>
              <div v-if="vinculoResult.acrescimo_valor > 0" class="flex justify-between">
                <span class="text-text-soft">Acréscimo ({{ custoConfig.acrescimo_pct }}%)</span>
                <span class="font-bold tabular-nums">{{ formatCurrency(vinculoResult.acrescimo_valor) }}</span>
              </div>
              <div class="flex justify-between border-t border-border-ui pt-2 mt-1">
                <span class="font-bold text-text-main">Custo Total Estimado</span>
                <span class="text-lg font-black tabular-nums text-text-main">{{ formatCurrency(vinculoResult.custo_total_estimado) }}</span>
              </div>
            </div>

            <!-- Pendentes restantes -->
            <div v-if="vinculoResult.nao_vinculados > 0" class="ds-alert ds-alert--warning">
              <p class="text-[11px] font-bold uppercase tracking-wider mb-2">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                {{ vinculoResult.nao_vinculados }} item(ns) não vinculado(s)
              </p>
              <p class="text-xs mb-2">Esses materiais não foram encontrados nem classificados manualmente. Eles não entram no custo acima.</p>
              <ul class="space-y-1">
                <li
                  v-for="p in vinculoResult.itens_pendentes"
                  :key="p.nome_original"
                  class="text-xs font-semibold flex justify-between"
                >
                  <span class="truncate mr-2">{{ p.nome_original }}</span>
                  <span class="whitespace-nowrap tabular-nums">{{ p.area_m2.toFixed(3) }} m²</span>
                </li>
              </ul>
            </div>
            <div v-else class="ds-alert ds-alert--success flex items-center gap-2">
              <i class="pi pi-check-circle text-lg"></i>
              <p class="text-sm font-bold">Todos os materiais foram vinculados com sucesso.</p>
            </div>
          </div>
        </div>

        <!-- Tabela final de itens vinculados -->
        <div class="rounded-xl border border-border-ui bg-white overflow-hidden">
          <div class="px-3 py-2 bg-bg-page border-b border-border-ui">
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft">Itens Vinculados por Categoria</p>
          </div>
          <div class="overflow-auto max-h-[320px]">
            <table class="w-full min-w-[760px]">
              <thead>
                <tr class="border-b border-border-ui bg-white text-left text-[11px] uppercase tracking-wider text-text-soft">
                  <th class="px-3 py-2.5 font-black">Categoria</th>
                  <th class="px-3 py-2.5 font-black">Material</th>
                  <th class="px-3 py-2.5 font-black">Produto</th>
                  <th class="px-3 py-2.5 font-black text-right">Área m²</th>
                  <th class="px-3 py-2.5 font-black text-right">Preço/m²</th>
                  <th class="px-3 py-2.5 font-black text-right">CMV/m²</th>
                  <th class="px-3 py-2.5 font-black text-right">CMV total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in vinculoResult.itens_vinculados"
                  :key="item.nome_original + item.categoria_comercial"
                  class="border-b border-border-ui/70 last:border-b-0 hover:bg-bg-page/60 transition-colors"
                >
                  <td class="px-3 py-2">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                      :class="catStyle(item.categoria_comercial).badge"
                    >
                      {{ catLabel(item.categoria_comercial) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs font-semibold text-text-main max-w-[160px] truncate" :title="item.nome_original">
                    {{ item.nome_original }}
                  </td>
                  <td class="px-3 py-2 text-xs text-text-soft max-w-[160px] truncate" :title="item.produto_nome">
                    {{ item.produto_nome || '—' }}
                  </td>
                  <td class="px-3 py-2 text-xs tabular-nums text-right font-semibold">{{ item.area_m2.toFixed(3) }}</td>
                  <td class="px-3 py-2 text-xs tabular-nums text-right">{{ formatCurrency(item.preco_m2) }}</td>
                  <td class="px-3 py-2 text-xs tabular-nums text-right font-semibold">{{ formatCurrency(item.cmv_m2) }}</td>
                  <td class="px-3 py-2 text-right">
                    <span class="text-xs font-black tabular-nums text-blue-700">{{ formatCurrency(item.custo_cmv) }}</span>
                  </td>
                </tr>
                <tr v-if="!vinculoResult.itens_vinculados?.length">
                  <td colspan="7" class="px-3 py-10 text-center text-sm text-text-soft">
                    Nenhum item vinculado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-border-ui text-text-main hover:bg-bg-page transition-all"
            @click="activeStep = 1"
          >
            <i class="pi pi-arrow-left text-sm"></i>
            Voltar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:opacity-90 transition-all shadow-md"
          >
            <i class="pi pi-calculator text-sm"></i>
            Usar no Orçamento Técnico
          </button>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { OrcamentoTecnicoService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const steps = [
  { id: 'upload',    label: 'Upload & Configuração' },
  { id: 'revisar',  label: 'Revisar Itens' },
  { id: 'resultado', label: 'Resultado por Categoria' },
]

const activeStep   = ref(0)
const arrastando   = ref(false)
const arquivo      = ref(null)
const fileInput    = ref(null)
const importando   = ref(false)
const vinculando   = ref(false)

const custoConfig = ref({
  hora_homem_value:       0,
  custo_fixo_fabrica_value: 0,
  acrescimo_pct:          0,
})

const importResult = ref({
  formato: '',
  total_pecas_brutas: 0,
  total_grupos: 0,
  area_total_m2: 0,
  custo_material_real: 0,
  custo_rh_estimado: 0,
  custo_total_estimado: 0,
  nao_encontrados: 0,
  itens: [],
})

const vinculoResult = ref({
  itens_vinculados: [],
  itens_pendentes:  [],
  resumo_por_categoria: {},
  area_vinculada_m2: 0,
  custo_material_total: 0,
  custo_cmv_total: 0,
  custo_rh_estimado: 0,
  acrescimo_valor: 0,
  custo_total_estimado: 0,
  nao_vinculados: 0,
})

const filtroTabela = ref('todos')

// ─── Computed ─────────────────────────────────────────────────────────────────

const encontrados = computed(() =>
  (importResult.value.itens || []).filter((i) => i.encontrado).length,
)

const itensFiltrados = computed(() => {
  const todos = importResult.value.itens || []
  if (filtroTabela.value === 'encontrados') return todos.filter((i) => i.encontrado)
  if (filtroTabela.value === 'pendentes')   return todos.filter((i) => !i.encontrado)
  return todos
})

const pendenteSemCategoria = computed(() =>
  (importResult.value.itens || []).filter((i) => !i.encontrado && !i._categoria_manual).length,
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0))

const catLabel = (key) => {
  const map = { PRIMARIA: 'Essencial', SECUNDARIA: 'Desgner', TERCIARIA: 'Premiun' }
  return map[key] ?? key
}

const catStyle = (key) => {
  if (key === 'SECUNDARIA') return {
    card:  'ds-alert ds-alert--warning',
    badge: 'ds-status-pill ds-status-pill--warning',
    text:  'text-[color:var(--ds-color-warning)]',
    muted: 'text-text-soft',
  }
  if (key === 'TERCIARIA') return {
    card:  'ds-surface',
    badge: 'ds-status-pill ds-status-pill--neutral',
    text:  'text-text-main',
    muted: 'text-text-soft',
  }
  return {
    card:  'ds-alert ds-alert--success',
    badge: 'ds-status-pill ds-status-pill--success',
    text:  'text-[color:var(--ds-color-success)]',
    muted: 'text-text-soft',
  }
}

// ─── Handlers de arquivo ──────────────────────────────────────────────────────

const onFileChange = (e) => {
  arquivo.value = e.target.files?.[0] ?? null
  if (fileInput.value) fileInput.value.value = ''
}

const onDrop = (e) => {
  arrastando.value = false
  const file = e.dataTransfer.files?.[0]
  if (!file) return
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['csv', 'xml', 'txt'].includes(ext)) {
    notify.error('Apenas arquivos CSV ou XML são aceitos.')
    return
  }
  arquivo.value = file
}

// ─── Import ───────────────────────────────────────────────────────────────────

const executarImport = async () => {
  if (!arquivo.value) return
  importando.value = true
  try {
    const fd = new FormData()
    fd.append('arquivo', arquivo.value)
    fd.append('hora_homem_value',        String(custoConfig.value.hora_homem_value || 0))
    fd.append('custo_fixo_fabrica_value', String(custoConfig.value.custo_fixo_fabrica_value || 0))
    fd.append('acrescimo_pct',           String(custoConfig.value.acrescimo_pct || 0))

    const { data } = await OrcamentoTecnicoService.importarProjeto(fd)

    // adiciona campo auxiliar para categoria manual
    data.itens = (data.itens || []).map((i) => ({ ...i, _categoria_manual: '' }))
    importResult.value = data
    activeStep.value = 1
  } catch (err) {
    notify.error(err?.response?.data?.message ?? 'Erro ao importar arquivo.')
  } finally {
    importando.value = false
  }
}

// ─── Vínculo ──────────────────────────────────────────────────────────────────

const executarVinculo = async () => {
  vinculando.value = true
  try {
    const itens = (importResult.value.itens || []).map((i) => ({
      nome_original: i.nome_original,
      espessura_mm:  i.espessura_mm,
      area_m2:       i.area_m2,
      preco_m2:      i.preco_m2,
      produto_id:    i.produto_id,
      produto_nome:  i.produto_nome,
      tipo:          i.tipo,
      custo_total:   i.custo_total,
      encontrado:    i.encontrado,
      categoria_manual: i._categoria_manual || null,
    }))

    const { data } = await OrcamentoTecnicoService.vincularMateriais({
      itens,
      hora_homem_value:        custoConfig.value.hora_homem_value,
      custo_fixo_fabrica_value: custoConfig.value.custo_fixo_fabrica_value,
      acrescimo_pct:            custoConfig.value.acrescimo_pct,
    })

    vinculoResult.value = data
    activeStep.value = 2
  } catch (err) {
    notify.error(err?.response?.data?.message ?? 'Erro ao vincular materiais.')
  } finally {
    vinculando.value = false
  }
}
</script>
