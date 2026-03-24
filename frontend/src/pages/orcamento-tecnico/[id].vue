<template>
  <PageShell :padded="false">
    <section class="ds-page-context ds-page-context--editor animate-page-in">

      <!-- ── Cabeçalho ────────────────────────────────────────── -->
      <PageHeader
        :title="nomeClienteAtual || `Orçamento #${id}`"
        :subtitle="[contatoCliente, orcamento ? `Orç. #${orcamento.id || id}` : null, orcamento?.agenda_loja?.id ? `Proj. #${orcamento.agenda_loja.id}` : null, areaRealProjeto > 0 ? `${areaRealProjeto.toFixed(2)} m²` : null].filter(Boolean).join(' · ')"
        icon="pi pi-calculator"
        variant="minimal"
      >
        <template #actions>
          <button type="button"
            class="btn-secondary-tw"
            @click="router.push('/orcamento-tecnico')">
            <i class="pi pi-arrow-left" /> Voltar
          </button>
          <span :class="temMedicaoTecnico ? 'ds-status-pill ds-status-pill--success' : 'ds-status-pill ds-status-pill--warning'">
            {{ temMedicaoTecnico ? 'Com medição' : 'Sem medição' }}
          </span>
        </template>
      </PageHeader>

      <div class="ds-page-context__content pb-12">

        <Loading v-if="loading" />
        <p v-else-if="erro" class="px-6 py-4 text-sm text-danger">{{ erro }}</p>

        <template v-else-if="orcamento">

          <!-- ── Abas de origem ─────────────────────────────── -->
          <div class="flex items-center gap-0 border-b border-border-ui px-6">
            <button v-for="tab in [
              { key: ORIGEM_MEDIDA.TECNICO, label: 'Técnico', icon: 'pi-wrench', count: ambientesTecnico.length, warn: !temMedicaoTecnico },
              { key: ORIGEM_MEDIDA.VENDEDOR, label: 'Manual', icon: 'pi-pencil', count: ambientesVendedor.length },
              { key: ORIGEM_MEDIDA.PROMOB,  label: 'Promob',  icon: 'pi-file-import', count: ambientesPromob.length, ok: !!promobArquivoNome },
            ]" :key="tab.key" type="button"
              class="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap"
              :class="origemMedida === tab.key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-text-faint hover:text-text-main'"
              @click="selecionarOrigemMedida(tab.key)">
              <i :class="`pi ${tab.icon} text-xs`" />
              {{ tab.label }}
              <span class="text-[10px] font-bold px-1.5 py-px rounded-full"
                :class="tab.warn ? 'bg-amber-100 text-amber-700' : tab.ok ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-text-faint'">
                {{ tab.warn ? '!' : tab.ok ? '✓' : tab.count }}
              </span>
            </button>
            <button v-if="origemMedida === ORIGEM_MEDIDA.PROMOB" type="button"
              class="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-text-soft hover:text-text-main transition-colors"
              @click="abrirUploadPromob">
              <i class="pi pi-paperclip text-xs" />Upload
            </button>
          </div>

          <p v-if="origemMedida === ORIGEM_MEDIDA.PROMOB && promobMensagem"
            class="px-6 py-2 text-xs"
            :class="promobMensagemErro ? 'text-red-500' : 'text-sky-600'">
            {{ promobMensagem }}
          </p>

          <input ref="promobFileInput" type="file"
            accept=".xml,.json,.csv,text/csv,application/xml,application/json,text/xml,application/octet-stream"
            class="hidden" @change="handlePromobUpload" />

          <!-- ── Modo Técnico ───────────────────────────────── -->
          <template v-if="origemMedida === ORIGEM_MEDIDA.TECNICO">
            <p v-if="!temMedicaoTecnico" class="px-6 py-4 text-sm text-text-faint flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-amber-500" />
              Nenhuma medição do técnico. Use o modo <strong>Manual</strong>.
            </p>

            <!-- Cada ambiente = grupo de linhas com cabeçalho -->
            <div v-for="amb in ambientesTecnico" :key="amb.id">
              <!-- Linha de cabeçalho do ambiente -->
              <div class="flex items-center gap-3 px-6 py-2.5 border-b border-border-ui bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors select-none"
                @click="toggleAmbienteTecnico(amb.id)">
                <i class="pi pi-chevron-right text-[10px] text-text-faint transition-transform"
                  :class="{ 'rotate-90': !ambienteOcultoTecnico(amb.id) }" />
                <span class="text-sm font-semibold text-text-main uppercase tracking-tight">{{ amb.nome_ambiente }}</span>
                <span v-if="amb.largura_m" class="text-xs text-text-faint tabular-nums">
                  {{ Math.round(Number(amb.largura_m)*1000) }}×{{ Math.round(Number(amb.pe_direito_m||0)*1000) }}mm
                </span>
                <span class="ml-auto text-xs text-text-soft">{{ areaTecnicoAmbiente(amb).toFixed(2) }} m²</span>
                <span class="text-sm font-bold text-brand-primary tabular-nums">{{ formatCurrency(custoTecnicoAmbiente(amb)) }}</span>
              </div>

              <template v-if="!ambienteOcultoTecnico(amb.id)">
                <template v-if="amb.paredes && amb.paredes.length">
                  <div v-for="parede in amb.paredes" :key="parede.id">
                    <!-- Linha de parede -->
                    <div class="flex items-center gap-3 px-8 py-2 border-b border-border-ui/60 bg-white">
                      <span class="text-xs font-semibold text-text-soft uppercase">{{ parede.nome }}</span>
                      <span class="text-xs text-text-faint tabular-nums">{{ Number(parede.largura_m||0).toFixed(2) }}×{{ Number(parede.pe_direito_m||0).toFixed(2) }}m</span>
                      <span class="ml-auto text-[11px] font-bold px-2 py-px rounded-full tabular-nums"
                        :class="ocupacaoTecnico(amb.id, parede.id, Number(parede.largura_m||0)*1000).excede ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                        {{ ocupacaoTecnico(amb.id, parede.id, Number(parede.largura_m||0)*1000).soma }}/{{ Math.round(Number(parede.largura_m||0)*1000) }}mm
                      </span>
                      <span class="text-xs font-semibold text-text-soft tabular-nums">{{ formatCurrency(custoModulosTecnicoParede(amb.id, parede.id)) }}</span>
                    </div>
                    <!-- Módulos da parede -->
                    <ModuloCard
                      v-for="(mod, mIdx) in modulosTecnico[`${amb.id}_${parede.id}`] || []" :key="mod._id"
                      :mod="mod" :material-options="materialOptions" :ferragem-options="ferragemOptions"
                      :custo-modulo="custoModulo(mod)" :ferragens-abertas="ferragensAbertas(mod)"
                      :qtd-ferragens-pendentes="qtdFerragensPendentes(mod)" :is-tecnico="true"
                      :nome-ferragem-fn="nomeFerragemExibicao" :preco-venda-ferragem-fn="getPrecoVendaFerragemUnitario" :custo-ferragem-fn="custoFerragemItem"
                      @toggle-ferragens="toggleFerragens" @remover="removerModuloTecnico(amb.id, parede.id, mIdx)"
                      @selecionar-ferragem="(m, eid) => onSelecionarFerragemNoModulo(m, eid)"
                      @resolver-ferragem="(m, fer, eid) => resolverFerragemPendente(m, fer, eid)"
                      @remover-ferragem="(m, fIdx) => removerFerragem(m, fIdx)"
                    />
                    <p v-if="!(modulosTecnico[`${amb.id}_${parede.id}`]||[]).length"
                      class="px-10 py-1.5 text-xs text-text-faint italic border-b border-border-ui/40">Nenhum módulo.</p>
                    <button type="button"
                      class="flex items-center gap-1 px-10 py-1.5 w-full text-xs font-semibold text-brand-primary border-b border-border-ui/40 hover:bg-brand-primary/5 transition-colors"
                      @click="addModuloTecnico(amb.id, parede.id)">
                      <i class="pi pi-plus text-[9px]" />Módulo
                    </button>
                  </div>
                </template>
                <p v-else class="px-8 py-2 text-xs text-text-faint italic border-b border-border-ui/40">
                  Sem paredes — {{ Number(amb.largura_m||0).toFixed(2) }}×{{ Number(amb.pe_direito_m||0).toFixed(2) }}m
                </p>
              </template>
            </div>
          </template>

          <!-- ── Modo Vendedor / Promob ─────────────────────── -->
          <template v-else>
            <p v-if="origemMedida === ORIGEM_MEDIDA.PROMOB && !ambientesEditaveis.length"
              class="px-6 py-4 text-sm text-text-faint flex items-center gap-2">
              <i class="pi pi-file-import" />Selecione um arquivo XML, JSON ou CSV do Promob.
            </p>

            <div v-for="(amb, ambIdx) in ambientesEditaveis" :key="amb._id">
              <!-- Cabeçalho do ambiente editável -->
              <div class="flex items-center gap-3 px-6 py-2.5 border-b border-border-ui bg-slate-50/60">
                <button type="button" class="text-text-faint hover:text-text-soft"
                  @click="toggleAmbienteEditavel(amb, ambIdx)">
                  <i class="pi pi-chevron-right text-[10px] transition-transform"
                    :class="{ 'rotate-90': !ambienteOcultoEditavel(amb, ambIdx) }" />
                </button>
                <input v-model="amb.nome" type="text" placeholder="Nome do ambiente"
                  class="flex-1 min-w-0 bg-transparent border-none text-sm font-semibold text-text-main uppercase tracking-tight focus:outline-none" />
                <span class="text-xs text-text-soft">{{ areaVendedorAmbiente(amb).toFixed(2) }} m²</span>
                <span class="text-sm font-bold text-brand-primary tabular-nums">{{ formatCurrency(custoVendedorAmbiente(amb)) }}</span>
                <button type="button" class="w-6 h-6 flex items-center justify-center rounded text-text-faint hover:text-red-400 hover:bg-red-50 transition-colors"
                  @click="removerAmbiente(ambIdx)"><i class="pi pi-trash text-xs" /></button>
              </div>

              <template v-if="!ambienteOcultoEditavel(amb, ambIdx)">
                <div v-for="(parede, pIdx) in amb.paredes" :key="parede._id">
                  <!-- Linha de parede editável -->
                  <div class="flex items-center gap-2 flex-wrap px-8 py-2 border-b border-border-ui/60 bg-white">
                    <input v-model="parede.nome" type="text" :placeholder="`Parede ${pIdx+1}`"
                      class="w-28 h-7 px-2 rounded border border-border-ui text-xs bg-bg-card text-text-main focus:outline-none focus:border-brand-primary" />
                    <div class="relative">
                      <input v-model.number="parede.largura_mm" type="number" min="0" step="1"
                        class="w-20 h-7 px-2 pr-5 text-right rounded border border-border-ui text-xs bg-bg-card text-text-main focus:outline-none focus:border-brand-primary" />
                      <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-soft">L</span>
                    </div>
                    <div class="relative">
                      <input v-model.number="parede.altura_mm" type="number" min="0" step="1"
                        class="w-20 h-7 px-2 pr-5 text-right rounded border border-border-ui text-xs bg-bg-card text-text-main focus:outline-none focus:border-brand-primary" />
                      <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-soft">H</span>
                    </div>
                    <span class="ml-auto text-[11px] font-bold px-2 py-px rounded-full tabular-nums"
                      :class="ocupacaoVendedor(parede).excede ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                      {{ ocupacaoVendedor(parede).soma }}/{{ parede.largura_mm||0 }}mm
                    </span>
                    <span class="text-xs font-semibold tabular-nums"
                      :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-600' : 'text-amber-600'">
                      {{ formatCurrency(custoParede(parede)) }}
                    </span>
                    <button type="button" class="w-6 h-6 flex items-center justify-center rounded text-text-faint hover:text-red-400 hover:bg-red-50 transition-colors"
                      @click="removerParede(ambIdx, pIdx)"><i class="pi pi-minus text-xs" /></button>
                  </div>

                  <!-- Módulos da parede editável -->
                  <ModuloCard
                    v-for="(mod, mIdx) in parede.modulos" :key="mod._id"
                    :mod="mod" :material-options="materialOptions" :ferragem-options="ferragemOptions"
                    :custo-modulo="custoModulo(mod)" :ferragens-abertas="ferragensAbertas(mod)"
                    :qtd-ferragens-pendentes="qtdFerragensPendentes(mod)" :is-promob="origemMedida === ORIGEM_MEDIDA.PROMOB"
                    :nome-ferragem-fn="nomeFerragemExibicao" :preco-venda-ferragem-fn="getPrecoVendaFerragemUnitario" :custo-ferragem-fn="custoFerragemItem"
                    @selecionar-material="(m, eid) => onSelecionarMaterialModulo(m, eid)"
                    @toggle-ferragens="toggleFerragens" @remover="removerModuloVendedor(ambIdx, pIdx, mIdx)"
                    @selecionar-ferragem="(m, eid) => onSelecionarFerragemNoModulo(m, eid)"
                    @resolver-ferragem="(m, fer, eid) => resolverFerragemPendente(m, fer, eid)"
                    @remover-ferragem="(m, fIdx) => removerFerragem(m, fIdx)"
                  />
                  <p v-if="!parede.modulos.length" class="px-10 py-1.5 text-xs text-text-faint italic border-b border-border-ui/40">Nenhum módulo.</p>

                  <!-- Ferragens soltas da parede -->
                  <div class="border-b border-border-ui/40">
                    <div class="flex items-center gap-2 px-10 py-1.5">
                      <span class="text-xs text-text-faint">Ferragens da parede</span>
                      <span class="text-xs font-semibold tabular-nums" :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-600' : 'text-amber-600'">
                        {{ formatCurrency(custoFerragensLista(parede.ferragens)) }}
                      </span>
                      <button type="button" class="ml-auto text-xs text-brand-primary font-semibold hover:opacity-70"
                        @click="toggleFerragensParede(parede)">{{ ferragensParedeAbertas(parede) ? 'Ocultar' : 'Exibir' }}</button>
                    </div>
                    <div v-show="ferragensParedeAbertas(parede)" class="px-10 pb-2 flex flex-col gap-1">
                      <SearchInput v-model="parede._ferragemBuscaId" mode="select" hide-search-icon :options="ferragemOptions" placeholder="Adicionar ferragem..."
                        class="[&_.search-container]:!h-7 [&_input]:!h-7 [&_input]:!text-xs [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!px-1"
                        @update:modelValue="onSelecionarFerragemNaParede(parede, $event)" />
                      <div v-for="(fer, fIdx) in (parede.ferragens||[])" :key="fer._id"
                        class="flex items-center gap-2 py-1 border-t border-border-ui/30">
                        <span class="truncate text-xs flex-1" :class="fer.nao_encontrada ? 'text-rose-600' : 'text-text-main'" :title="nomeFerragemExibicao(fer)">{{ nomeFerragemExibicao(fer) }}</span>
                        <input v-model.number="fer.quantidade" type="number" min="1" step="1"
                          class="w-14 h-6 px-1.5 text-right rounded border border-border-ui text-xs tabular-nums bg-bg-card focus:outline-none" />
                        <span class="text-xs tabular-nums text-text-soft w-20 text-right">{{ formatCurrency(custoFerragemItem(fer)) }}</span>
                        <button type="button" class="w-5 h-5 flex items-center justify-center rounded text-text-faint hover:text-red-400 transition-colors"
                          @click="removerFerragemParede(parede, fIdx)"><i class="pi pi-times text-[9px]" /></button>
                      </div>
                    </div>
                  </div>

                  <!-- Ações parede -->
                  <div class="flex gap-4 px-10 py-1.5 border-b border-border-ui/40">
                    <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:opacity-70"
                      @click="addModuloVendedor(ambIdx, pIdx)"><i class="pi pi-plus text-[9px]" />Módulo</button>
                    <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:opacity-70"
                      @click="addFerragemParede(parede)"><i class="pi pi-plus text-[9px]" />Ferragem</button>
                  </div>
                </div>

                <p v-if="!amb.paredes.length" class="px-8 py-2 text-xs text-text-faint italic border-b border-border-ui/40">Nenhuma parede.</p>
                <button type="button"
                  class="flex items-center gap-1.5 px-8 py-2 w-full text-xs font-semibold text-brand-primary border-b border-border-ui/40 hover:bg-brand-primary/5 transition-colors"
                  @click="addParede(ambIdx)"><i class="pi pi-plus text-[9px]" />Parede</button>
              </template>
            </div>

            <!-- Adicionar ambiente -->
            <button type="button"
              class="flex items-center gap-2 w-full px-6 py-3 text-sm font-semibold text-text-faint border-b border-dashed border-border-ui hover:text-brand-primary hover:bg-brand-primary/3 transition-colors"
              @click="addAmbiente">
              <i class="pi pi-plus text-xs" />Adicionar ambiente
            </button>
          </template>

          <!-- ── Divisor Fechamento ─────────────────────────── -->
          <div class="flex items-center gap-4 px-6 pt-8 pb-3">
            <span class="text-xs font-bold uppercase tracking-widest text-text-faint">Fechamento</span>
            <span class="flex-1 h-px bg-border-ui" />
          </div>

          <PagamentoFechamento
            :pagamentos="pagamentosFechamento"
            :total-informado="totalPagamentoInformado"
            :saldo="saldoPagamento"
            :preco-venda="precoVenda"
            :preco-final-com-taxas="precoFinalComTaxas"
            :taxa-cartao-reais="taxaCartaoReais"
            :taxa-nf-reais="taxaNfReais"
            :total-comissoes-reais="totalComissoesReais"
            :taxa-nota-fiscal="TAXA_NOTA_FISCAL"
            :com-nota-fiscal="comNotaFiscal"
            :comissoes="comissoes"
            :get-opcoes-for-row="getFormasPagamentoOptionsForRow"
            :get-parcelas-for-row="parcelasOptionsDaForma"
            :taxa-cartao-pct-fn="taxaCartaoPct"
            @normalizar-linha="normalizarPagamentoLinha"
            @remover="removerPagamento"
            @add="addPagamento"
            @update:com-nota-fiscal="v => comNotaFiscal = v"
            @update:comissao-ativo="({ idx, val }) => comissoes[idx].ativo = val"
            @update:comissao-nome="({ idx, val }) => comissoes[idx].nome = val"
          />

          <!-- ── Divisor Resumo ──────────────────────────────── -->
          <div class="flex items-center gap-4 px-6 pt-8 pb-3">
            <span class="text-xs font-bold uppercase tracking-widest text-text-faint">Resumo</span>
            <span class="flex-1 h-px bg-border-ui" />
          </div>

          <OrcamentoResumo
            :total-custos-fixos="totalCustosFixos"
            :total-custo-base="totalCustoBase"
            :preco-venda="precoVenda"
            :resumo-ambientes="resumoAmbientes"
            :pode-finalizar-orcamento="podeFinalizarOrcamento"
            :finalizando="finalizandoOrcamento"
            :is-promob="origemMedida === ORIGEM_MEDIDA.PROMOB"
            :tem-materiais-pendentes="temMateriaisPromobPendentes"
            :total-materiais-pendentes="totalMateriaisPromobPendentes"
            @finalizar="finalizarOrcamentoAtual"
          />

        </template>

      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import { useMateriais } from '@/composables/orcamento-tecnico/useMateriais'
import { useFerragens } from '@/composables/orcamento-tecnico/useFerragens'
import { usePromob } from '@/composables/orcamento-tecnico/usePromob'
import { useOrcamentoTecnico } from '@/composables/orcamento-tecnico/useOrcamentoTecnico'
import { useAmbientes } from '@/composables/orcamento-tecnico/useAmbientes'
import { useCustos } from '@/composables/orcamento-tecnico/useCustos'
import { useFinalizacao } from '@/composables/orcamento-tecnico/useFinalizacao'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Loading from '@/components/common/Loading.vue'
import ModuloCard from '@/components/orcamento-tecnico/ModuloCard.vue'
import OrcamentoResumo from '@/components/orcamento-tecnico/OrcamentoResumo.vue'
import PagamentoFechamento from '@/components/orcamento-tecnico/PagamentoFechamento.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)
const ORIGEM_MEDIDA = Object.freeze({ TECNICO: 'TECNICO', VENDEDOR: 'VENDEDOR', PROMOB: 'PROMOB' })

// ── Composable: materiais ──────────────────────────────────────
const {
  materiais,
  catalogoFerragens,
  materialOptions,
  ferragemOptions,
  getMaterialById,
  getCustoM2ByMaterial,
  getFerragemById,
  catStyle,
  carregarCatalogosEstrategia,
} = useMateriais()

// ── Composable: ferragens ──────────────────────────────────────
const {
  novaFerragem,
  upsertFerragemNoModulo,
  nomeFerragemExibicao,
  onSelecionarFerragemNoModulo,
  onSelecionarFerragemNaParede,
  resolverFerragemPendente,
  resolverFerragemPendenteNaParede,
  getPrecoVendaFerragemUnitario,
  custoFerragemItem,
  quantidadeFerragensModulo,
  custoFerragensModulo,
  quantidadeFerragensLista,
  custoFerragensLista,
  qtdFerragensPendentes,
  addFerragem,
  removerFerragem,
  addFerragemParede,
  removerFerragemParede,
  ferragensAbertas,
  toggleFerragens,
  ferragensParedeAbertas,
  toggleFerragensParede,
} = useFerragens({ getFerragemById })

// ── Composable: Promob ─────────────────────────────────────────
const {
  promobFileInput,
  promobArquivoNome,
  promobMensagem,
  promobMensagemErro,
  ambientesPromob,
  abrirUploadPromob,
  handlePromobUpload,
  remapearMateriaisPromob,
  normalizarTexto,
  encontrarMaterialPromob,
  novoModuloPromob,
  normalizarAmbientePromob,
} = usePromob({ materiais, catalogoFerragens, upsertFerragemNoModulo })

// ── Composable: ambientes ──────────────────────────────────────
const {
  ambientesVendedor,
  modulosTecnico,
  chaveT,
  novoModulo,
  novaParede,
  novoAmbiente,
  addAmbiente: _addAmbiente,
  removerAmbiente: _removerAmbiente,
  addParede: _addParede,
  removerParede: _removerParede,
  addModuloVendedor: _addModuloVendedor,
  removerModuloVendedor: _removerModuloVendedor,
  addModuloTecnico,
  removerModuloTecnico,
  hidratarAmbientesSalvos,
  ambienteOcultoTecnico,
  toggleAmbienteTecnico,
  ambienteOcultoEditavel,
  toggleAmbienteEditavel,
  ocupacaoTecnico,
  ocupacaoVendedor,
} = useAmbientes({ encontrarMaterialPromob })

// ── Origem das medidas ─────────────────────────────────────────
const origemMedida = ref(ORIGEM_MEDIDA.TECNICO)
const origem = origemMedida

const ambientesEditaveis = computed(() =>
  origemMedida.value === ORIGEM_MEDIDA.PROMOB ? ambientesPromob.value : ambientesVendedor.value,
)

function getAmbientesEditaveisRef() {
  return origemMedida.value === ORIGEM_MEDIDA.PROMOB ? ambientesPromob : ambientesVendedor
}

function selecionarOrigemMedida(novaOrigem) {
  origemMedida.value = novaOrigem
  if (novaOrigem === ORIGEM_MEDIDA.PROMOB && !ambientesPromob.value.length) {
    promobMensagem.value = 'Selecione um XML, JSON ou CSV do Promob para preencher a estrutura automaticamente.'
    promobMensagemErro.value = false
  }
}

// Wrappers que passam a ref editável correta
function addAmbiente() { _addAmbiente(getAmbientesEditaveisRef()) }
function removerAmbiente(idx) { _removerAmbiente(getAmbientesEditaveisRef(), idx) }
function addParede(ambIdx) { _addParede(getAmbientesEditaveisRef(), ambIdx) }
function removerParede(ambIdx, pIdx) { _removerParede(getAmbientesEditaveisRef(), ambIdx, pIdx) }
function addModuloVendedor(ambIdx, pIdx) { _addModuloVendedor(getAmbientesEditaveisRef(), ambIdx, pIdx) }
function removerModuloVendedor(ambIdx, pIdx, mIdx) { _removerModuloVendedor(getAmbientesEditaveisRef(), ambIdx, pIdx, mIdx) }

function onSelecionarMaterialModulo(modulo, materialId) {
  const material = materiais.value.find((m) => m.id === materialId) || null
  modulo.material_id = material?.id ?? null
  modulo.material_nao_encontrado = !material
}

// ── Composable: orçamento técnico (load + finalizar) ───────────
const {
  loading,
  erro,
  orcamento,
  finalizandoOrcamento,
  nomeClienteAtual,
  contatoCliente,
  totalAmbientesProjeto,
  areaRealProjeto,
  precoEstimadoBase,
  ambientesTecnico,
  temMedicaoTecnico,
  carregar: carregarOrcamento,
  finalizarOrcamentoAtual: _finalizarOrcamentoAtual,
} = useOrcamentoTecnico({
  mapearAmbientesParaFinalizacao: () => mapearAmbientesParaFinalizacao(),
  getPayloadFechamento: () => ({
    preco_venda: Number(precoFinalComTaxas?.value ?? precoVenda?.value ?? 0),
    pagamentos: (pagamentosFechamento?.value ?? []).map(p => ({
      forma_pagamento_chave: p.forma_pagamento_chave,
      parcelas: p.parcelas,
      valor: p.valor,
    })),
    com_nota_fiscal: Boolean(comNotaFiscal?.value),
    taxa_nf_reais: Number(taxaNfReais?.value ?? 0),
    taxa_cartao_reais: Number(taxaCartaoReais?.value ?? 0),
    comissoes: (comissoes?.value ?? [])
      .filter(c => c.ativo && c.nome)
      .map(c => ({
        tipo: c.tipo,
        nome: c.nome,
        percentual: c.percentual,
        valor_reais: Math.round((Number(precoVenda?.value || 0) * c.percentual) / 100 * 100) / 100,
      })),
  }),
})

// ── Composable: custos ─────────────────────────────────────────
const {
  margemLucroPct,
  custosFixos,
  areaModuloM2,
  areaTecnicoAmbiente,
  areaVendedorAmbiente,
  custoMdfModulo,
  custoModulo,
  custoParede,
  custoVendedorAmbiente,
  custoModulosTecnicoParede,
  custoTecnicoAmbiente,
  resumoAmbientes,
  totalAreaM2,
  totalInsumosFixos,
  totalCustosOperacionais,
  totalCustosFixos,
  totalCustoBase,
  totalCusto,
  lucroRealTotal,
  precoVenda,
  formatCurrency,
} = useCustos({
  getCustoM2ByMaterial,
  custoFerragensModulo,
  custoFerragensLista,
  quantidadeFerragensModulo,
  quantidadeFerragensLista,
  modulosTecnico,
  chaveT,
  ambientesEditaveis,
  ambientesTecnico,
  origemMedida,
  ORIGEM_MEDIDA,
})

// ── Composable: finalização ────────────────────────────────────
const {
  pagamentosFechamento,
  comNotaFiscal,
  comissoes,
  FORMAS_PAGAMENTO_OPTIONS,
  TAXA_NOTA_FISCAL,
  taxaCartaoReais,
  taxaNfReais,
  totalComissoesReais,
  precoFinalComTaxas,
  totalPagamentoInformado,
  saldoPagamento,
  taxaCartaoPct,
  maxParcelasDaForma,
  parcelasOptionsDaForma,
  getFormasPagamentoOptionsForRow,
  normalizarPagamentoLinha,
  addPagamento,
  removerPagamento,
  mapearAmbientesParaFinalizacao,
} = useFinalizacao({
  origemMedida,
  ORIGEM_MEDIDA,
  ambientesEditaveis,
  ambientesTecnico,
  modulosTecnico,
  chaveT,
  areaModuloM2,
  getCustoM2ByMaterial,
  getMaterialById,
  getFerragemById,
  precoVenda,
})

// ── Derivados ──────────────────────────────────────────────────
const origemAtualLabel = computed(() => {
  if (origemMedida.value === ORIGEM_MEDIDA.TECNICO) return 'Técnico'
  if (origemMedida.value === ORIGEM_MEDIDA.PROMOB) return 'Promob'
  return 'Vendedor'
})

const totalMateriaisPromobPendentes = computed(() => {
  if (origemMedida.value !== ORIGEM_MEDIDA.PROMOB) return 0
  return ambientesPromob.value.reduce((sAmb, amb) =>
    sAmb + (amb.paredes || []).reduce((sPar, parede) =>
      sPar + (parede.modulos || []).reduce((sMod, mod) =>
        sMod + (mod.material_id == null ? 1 : 0), 0), 0), 0)
})

const temMateriaisPromobPendentes = computed(() => totalMateriaisPromobPendentes.value > 0)
const podeFinalizarOrcamento = computed(() => !loading.value && !finalizandoOrcamento.value && !temMateriaisPromobPendentes.value)

function numeroPositivo(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// ── Hidratar fechamento salvo ──────────────────────────────────
function hidratarFechamento(orcamentoCarregado) {
  const raw = orcamentoCarregado?.pagamentos_json
  if (!raw) return
  try {
    const dados = typeof raw === 'string' ? JSON.parse(raw) : raw

    // Pagamentos
    const pags = Array.isArray(dados?.pagamentos) ? dados.pagamentos : []
    if (pags.length) {
      pagamentosFechamento.value = pags.map(p => ({
        forma_pagamento_chave: p.forma_pagamento_chave || '',
        parcelas: Number(p.parcelas || 1),
        valor: Number(p.valor || 0),
      }))
    }

    // Nota fiscal
    comNotaFiscal.value = Boolean(dados?.com_nota_fiscal)

    // Comissões
    const comsSalvas = Array.isArray(dados?.comissoes) ? dados.comissoes : []
    if (comsSalvas.length) {
      comissoes.value = comissoes.value.map(c => {
        const salva = comsSalvas.find(s => s.tipo === c.tipo)
        if (!salva) return c
        return { ...c, ativo: true, nome: salva.nome || '' }
      })
    }
  } catch (_) { /* pagamentos_json inválido — ignora */ }
}

// ── Carregar orçamento ─────────────────────────────────────────
async function carregar() {
  await carregarOrcamento(id.value, (orcamentoCarregado) => {
    const ambientesTecnicos = orcamentoCarregado?.agenda_loja?.medicao_orcamento?.ambientes ?? []
    const temEstruturaTecnica = ambientesTecnicos.some((amb) => Array.isArray(amb?.paredes) && amb.paredes.length > 0)
    const ambientesSalvos = hidratarAmbientesSalvos(orcamentoCarregado)

    if (ambientesSalvos.length) ambientesVendedor.value = ambientesSalvos

    const origemQuery = String(route.query?.origem || '').toUpperCase()
    if (origemQuery === 'PROMOB') {
      origemMedida.value = ORIGEM_MEDIDA.PROMOB
    } else if (origemQuery === 'MANUAL' || (!temEstruturaTecnica && ambientesSalvos.length) || !ambientesTecnicos.length) {
      origemMedida.value = ORIGEM_MEDIDA.VENDEDOR
      if (!ambientesSalvos.length) ambientesVendedor.value = [novoAmbiente()]
    }

    hidratarFechamento(orcamentoCarregado)
  })
}

async function finalizarOrcamentoAtual() {
  const resultado = await _finalizarOrcamentoAtual(id.value)
  if (!resultado) return

  const orcamentoComercialId = resultado.orcamento_id
  // Serializa o fechamento para passar à nova-venda
  const fechamentoParam = encodeURIComponent(JSON.stringify({
    pagamentos: resultado.pagamentos || [],
    com_nota_fiscal: resultado.com_nota_fiscal || false,
    taxa_nf_reais: resultado.taxa_nf_reais || 0,
    taxa_cartao_reais: resultado.taxa_cartao_reais || 0,
    comissoes: resultado.comissoes || [],
  }))

  if (orcamentoComercialId) {
    router.push(`/vendas/nova-venda?orcamentoId=${orcamentoComercialId}&orcamentoTecnicoId=${id.value}&precoVenda=${resultado.preco_venda || ''}&fechamentoOT=${fechamentoParam}`)
  } else {
    router.push(`/vendas/nova-venda?orcamentoTecnicoId=${id.value}&precoVenda=${resultado.preco_venda || ''}&fechamentoOT=${fechamentoParam}`)
  }
}

onMounted(() => {
  carregar()
  carregarCatalogosEstrategia(() => {
    if (ambientesPromob.value.length) {
      ambientesPromob.value = remapearMateriaisPromob(ambientesPromob.value)
    }
  })
})
</script>
