<template>
  <div class="w-full min-h-full bg-slate-50 dark:bg-slate-900/50">
    <!-- Layout: sem projeto = centralizado; com projeto e aba 3D = tela cheia split -->
    <div
      class="mx-auto px-4 py-6 md:py-8"
      :class="
        projetoId && ambienteSelecionado && abaAtiva === '3d'
          ? 'max-w-[100%]'
          : 'max-w-2xl'
      "
    >
      <div
        class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden"
        :class="
          projetoId && ambienteSelecionado && abaAtiva === '3d'
            ? 'flex flex-col h-[calc(100vh-8rem)] min-h-[480px]'
            : ''
        "
      >
        <div class="h-1 w-full bg-emerald-600" aria-hidden />

        <PageHeader
          title="Medição Fina"
          subtitle="Dados reais do ambiente antes da produção"
          icon="pi pi-ruler"
        >
          <template v-if="projetoId" #actions>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              @click="voltar"
            >
              <i class="pi pi-arrow-left mr-1" />
              Voltar
            </Button>
          </template>
        </PageHeader>

        <!-- Buscador: só aparece quando ainda não abriu um projeto -->
        <div v-if="!projetoId" class="p-4 md:p-6 space-y-6">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Pela <strong>Agenda</strong> ou pela <strong>Timeline</strong> o projeto abre direto. Ou busque por cliente abaixo.
          </p>

          <!-- Buscar por cliente → depois escolher projeto -->
          <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4 space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Buscar por cliente
            </h3>
            <div class="relative">
              <input
                v-model="clienteSearch"
                type="text"
                placeholder="Digite o nome do cliente..."
                class="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                autocomplete="off"
                @focus="buscarClientes()"
                @input="buscarClientes()"
              />
              <ul
                v-if="clienteSuggestions.length > 0 && !clienteSelecionado"
                class="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
              >
                <li
                  v-for="c in clienteSuggestions"
                  :key="c.value"
                  class="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  @click="selecionarCliente(c)"
                >
                  {{ c.label }}
                </li>
              </ul>
            </div>
            <template v-if="clienteSelecionado">
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Cliente: <strong>{{ clienteSelecionado.label }}</strong>
                <button type="button" class="ml-2 text-rose-600 hover:underline" @click="limparCliente">trocar</button>
              </p>
              <div v-if="projetosDoCliente.length === 0 && !loadingProjetos" class="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                <p class="font-medium">Nenhum projeto encontrado para este cliente.</p>
                <p class="mt-1 text-xs opacity-90">
                  O <strong>projeto</strong> é criado quando a venda é fechada ou o contrato é gerado (a partir do orçamento). Se o cliente só tem orçamento ainda, use o campo abaixo e informe o <strong>ID do orçamento</strong> para abrir a medição.
                </p>
              </div>
              <template v-else-if="projetosDoCliente.length > 0">
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Selecione o projeto
                </label>
                <select
                  v-model="projetoSelecionadoId"
                  class="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  @change="abrirProjetoDoCliente"
                >
                  <option :value="null">Selecione o projeto</option>
                  <option v-for="p in projetosDoCliente" :key="p.id" :value="p.id">
                    {{ p.codigo }} (ID {{ p.id }})
                  </option>
                </select>
              </template>
              <div v-else-if="loadingProjetos" class="flex items-center gap-2 text-sm text-slate-500">
                <i class="pi pi-spin pi-spinner" />
                Carregando projetos...
              </div>
            </template>
          </div>

          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span class="flex-shrink-0">ou informe direto:</span>
            <span class="border-t border-slate-200 dark:border-slate-600 flex-1" />
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Projeto ou orçamento (código / ID)
            </label>
            <div class="flex gap-2">
              <input
                v-model="projetoIdInput"
                type="text"
                placeholder="Ex: 123, PROJ-2025-001"
                class="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                @keyup.enter="irParaProjeto"
              />
              <Button type="button" @click="irParaProjeto">
                Abrir medição
              </Button>
            </div>
          </div>
        </div>

        <!-- Após clicar em Abrir Medição: dados do cliente + Formulário de Conferência -->
        <template v-else>
          <Loading v-if="loading" class="p-8" />

          <template v-else>
            <!-- Card Dados do cliente (escondido o buscador) -->
            <div v-if="dadosProjeto" class="mx-4 mt-4 md:mx-6 md:mt-4">
              <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Dados do cliente
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span class="text-slate-500 dark:text-slate-400">Nome</span>
                    <p class="font-medium text-slate-800 dark:text-slate-200">{{ dadosProjeto.cliente?.nome_completo || dadosProjeto.cliente?.razao_social || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-slate-500 dark:text-slate-400">Contato</span>
                    <p class="font-medium text-slate-800 dark:text-slate-200">{{ dadosProjeto.cliente?.telefone || dadosProjeto.cliente?.whatsapp || dadosProjeto.cliente?.email || '—' }}</p>
                  </div>
                  <div class="sm:col-span-2 lg:col-span-1">
                    <span class="text-slate-500 dark:text-slate-400">Endereço</span>
                    <p class="font-medium text-slate-800 dark:text-slate-200">{{ enderecoCliente }}</p>
                  </div>
                </div>
                <p class="mt-2 text-[11px] text-slate-500">
                  Projeto: <strong>{{ dadosProjeto.codigo }}</strong>
                  <span v-if="dadosProjeto.status_atual === 'PRONTO_PARA_PRODUCAO'" class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    Pronto para Produção
                  </span>
                </p>
                <div v-if="validacaoOk" class="mt-3 p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-sm font-medium">
                  Medição validada. Status do projeto alterado para &quot;Pronto para Produção&quot;.
                </div>
              </div>
            </div>

            <!-- Seletor de ambiente + Abas (Medição | Ver 3D) -->
            <div class="border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-2 pb-0">
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <section class="flex-1 min-w-0">
                  <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ambiente
                  </label>
                  <select
                    v-model="ambienteSelecionado"
                    class="mt-1 w-full max-w-xs h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                    @change="carregarMedicao"
                  >
                    <option value="">Selecione o ambiente</option>
                    <option v-for="a in ambientes" :key="a" :value="a">
                      {{ a }}
                    </option>
                  </select>
                </section>
                <div
                  v-if="ambienteSelecionado"
                  class="flex rounded-xl bg-slate-100 dark:bg-slate-700/50 p-1"
                >
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    :class="
                      abaAtiva === 'medicao'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    "
                    @click="abaAtiva = 'medicao'"
                  >
                    <i class="pi pi-list mr-1.5" />
                    Medição
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    :class="
                      abaAtiva === '3d'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    "
                    @click="abaAtiva = '3d'"
                  >
                    <i class="pi pi-box mr-1.5" />
                    Ver 3D
                  </button>
                </div>
              </div>
            </div>

            <template v-if="ambienteSelecionado">
              <!-- Aba Medição: layout em coluna única -->
              <div
                v-show="abaAtiva === 'medicao'"
                class="p-4 md:p-6 space-y-6 overflow-y-auto"
              >
                <MedicaoForm
                  :form="form"
                  :interferencias-opcoes="interferenciasOpcoes"
                  :categorias-foto="categoriasFoto"
                  :fotos-por-categoria="fotosPorCategoria"
                  :galeria-lado-a="galeriaLadoA"
                  :galeria-lado-b="galeriaLadoB"
                  :medicao-id="medicaoId"
                  :salvando="salvando"
                  :validando="validando"
                  :preview-url="previewUrl"
                  :projeto-id="projetoId"
                  @salvar="salvar"
                  @validar-medicao="validarMedicao"
                  @file-select="onFileSelect"
                  @remover-foto="removerFoto"
                />
              </div>

              <!-- Aba Ver 3D: split screen + opção tela cheia -->
              <div
                v-show="abaAtiva === '3d'"
                class="flex-1 flex min-h-0 flex-col md:flex-row relative"
              >
                <!-- Painel esquerdo (ocultável para tela cheia) -->
                <div
                  v-show="!painelEsquerdoOculto"
                  class="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30 transition-all duration-200"
                >
                  <div class="p-4 space-y-4">
                    <!-- Tabela Conferência: Promob vs Medida Real -->
                    <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden">
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 pt-4 pb-2">
                        Conferência: Promob vs Obra
                      </h3>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 px-4 pb-3">
                        Diferença &gt; 5 mm destaca em vermelho para o projetista.
                      </p>
                      <table class="w-full text-xs">
                        <thead>
                          <tr class="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                            <th class="text-left py-2 px-3 font-semibold">Medida</th>
                            <th class="text-right py-2 px-2 font-semibold">Promob</th>
                            <th class="text-right py-2 px-2 font-semibold">Real</th>
                            <th class="text-right py-2 px-2 font-semibold">Δ (mm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in tabelaConferencia"
                            :key="row.medida"
                            class="border-t border-slate-100 dark:border-slate-700"
                            :class="row.alerta ? 'bg-rose-50 dark:bg-rose-950/30' : ''"
                          >
                            <td class="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{{ row.label }}</td>
                            <td class="text-right py-2 px-2" :class="row.alerta ? 'text-rose-700 dark:text-rose-400 font-bold' : ''">{{ row.promob }}</td>
                            <td class="text-right py-2 px-2">{{ row.real }}</td>
                            <td class="text-right py-2 px-2 font-medium" :class="row.alerta ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'">{{ row.diff }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Medidas do Projeto Promob (edição) -->
                    <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                        Medidas do projeto Promob (cm)
                      </h3>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                        Preencha com os valores do projeto no Promob para conferir com a obra.
                      </p>
                      <div class="grid grid-cols-3 gap-2">
                        <div>
                          <label class="text-[10px] font-semibold uppercase text-slate-400">Altura</label>
                          <input
                            v-model.number="form.altura_promob_cm"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="—"
                            class="w-full mt-0.5 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                            @blur="salvarPromobRapido"
                          />
                        </div>
                        <div>
                          <label class="text-[10px] font-semibold uppercase text-slate-400">Largura</label>
                          <input
                            v-model.number="form.largura_promob_cm"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="—"
                            class="w-full mt-0.5 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                            @blur="salvarPromobRapido"
                          />
                        </div>
                        <div>
                          <label class="text-[10px] font-semibold uppercase text-slate-400">Prof.</label>
                          <input
                            v-model.number="form.profundidade_promob_cm"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="—"
                            class="w-full mt-0.5 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                            @blur="salvarPromobRapido"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Upload Projeto Promob: 3D -->
                    <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Projeto 3D (Promob)
                      </h3>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        .obj ou .gltf exportados do Promob.
                      </p>
                      <template v-if="medicaoId">
                        <label
                          class="flex flex-col items-center justify-center w-full h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition"
                          :class="{ 'pointer-events-none opacity-70': uploadProgress > 0 && uploadProgress < 100 }"
                        >
                          <input
                            type="file"
                            accept=".gltf,.glb,.obj"
                            class="hidden"
                            @change="onModelo3DSelect"
                          />
                          <i class="pi pi-cube text-xl text-slate-400 mb-0.5" />
                          <span class="text-xs text-slate-600 dark:text-slate-400">Enviar modelo 3D</span>
                        </label>
                        <div v-if="uploadProgress > 0 && uploadProgress < 100 && uploadLabel.startsWith('Enviando modelo')" class="mt-2">
                          <div class="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${uploadProgress}%` }" />
                          </div>
                          <p class="text-[10px] text-slate-500 mt-0.5">{{ uploadLabel }} {{ uploadProgress }}%</p>
                        </div>
                        <ul v-if="modelos3D.length" class="mt-2 space-y-1">
                          <li
                            v-for="m in modelos3D"
                            :key="m.id"
                            class="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                            :class="modelo3DSelecionadoId === m.id ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-1 ring-emerald-500/30' : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'"
                            @click="modelo3DSelecionadoId = m.id"
                          >
                            <span class="truncate">{{ m.nome || m.filename || 'Modelo' }}</span>
                            <div class="flex items-center gap-1 shrink-0" @click.stop>
                              <span v-if="modelo3DSelecionadoId === m.id" class="text-emerald-600 dark:text-emerald-400"><i class="pi pi-eye" /></span>
                              <button type="button" class="text-slate-400 hover:text-rose-500 p-0.5" title="Remover" @click="removerModelo3D(m)"><i class="pi pi-trash" /></button>
                            </div>
                          </li>
                        </ul>
                      </template>
                      <p v-else class="text-xs text-slate-500">Salve a medição antes de enviar.</p>
                    </div>

                    <!-- Upload Lista de Corte / Peças (PDF ou CSV) -->
                    <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4">
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Lista de Corte / Peças
                      </h3>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        PDF ou CSV gerado pelo Promob.
                      </p>
                      <template v-if="medicaoId">
                        <label
                          class="flex flex-col items-center justify-center w-full h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition"
                          :class="{ 'pointer-events-none opacity-70': uploadProgress > 0 && uploadProgress < 100 }"
                        >
                          <input
                            type="file"
                            accept=".pdf,.csv,application/pdf,text/csv"
                            class="hidden"
                            @change="onListaCorteSelect"
                          />
                          <i class="pi pi-file text-xl text-slate-400 mb-0.5" />
                          <span class="text-xs text-slate-600 dark:text-slate-400">Enviar PDF ou CSV</span>
                        </label>
                        <div v-if="uploadProgress > 0 && uploadProgress < 100 && uploadLabel.startsWith('Enviando Lista')" class="mt-2">
                          <div class="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${uploadProgress}%` }" />
                          </div>
                          <p class="text-[10px] text-slate-500 mt-0.5">{{ uploadLabel }} {{ uploadProgress }}%</p>
                        </div>
                        <ul v-if="listaCortePromob.length" class="mt-2 space-y-1">
                          <li
                            v-for="f in listaCortePromob"
                            :key="f.id"
                            class="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700/50"
                          >
                            <span class="truncate">{{ f.nome || f.filename || 'Arquivo' }}</span>
                            <div class="flex items-center gap-1">
                              <a
                                :href="blobUrlListaCorte(f.id)"
                                target="_blank"
                                rel="noopener"
                                class="text-slate-500 hover:text-emerald-600 p-0.5"
                                title="Abrir"
                                @click.prevent="abrirListaCorte(f.id)"
                              >
                                <i class="pi pi-external-link" />
                              </a>
                              <button type="button" class="text-slate-400 hover:text-rose-500 p-0.5" title="Remover" @click="removerListaCorte(f)"><i class="pi pi-trash" /></button>
                            </div>
                          </li>
                        </ul>
                      </template>
                      <p v-else class="text-xs text-slate-500">Salve a medição antes de enviar.</p>
                    </div>

                    <Button variant="ghost" size="sm" type="button" class="w-full" @click="abaAtiva = 'medicao'">
                      <i class="pi pi-pencil mr-1" />
                      Editar medição completa
                    </Button>
                  </div>
                </div>

                <!-- Área do visualizador 3D + botão tela cheia -->
                <div class="flex-1 min-h-[320px] md:min-h-0 relative">
                  <Visualizador3D
                    v-if="abaAtiva === '3d'"
                    :model-url="modelo3DBlobUrl"
                    class="absolute inset-0 w-full h-full"
                  />
                  <button
                    type="button"
                    class="absolute top-2 right-2 z-10 w-9 h-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg transition"
                    :title="painelEsquerdoOculto ? 'Mostrar painéis' : 'Tela cheia (ocultar painéis)'"
                    @click="painelEsquerdoOculto = !painelEsquerdoOculto"
                  >
                    <i class="pi" :class="painelEsquerdoOculto ? 'pi-window-maximize' : 'pi-window-minimize'" />
                  </button>
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { MedicaoFinaService, ArquivosService, ClienteService } from '@/services'
import MedicaoForm from '@/components/medicao-fina/MedicaoForm.vue'
import { defineAsyncComponent } from 'vue'

const Visualizador3D = defineAsyncComponent(() =>
  import('@/components/medicao-fina/Visualizador3D.vue')
)

definePage({ meta: { perm: 'agendamentos.vendas' } })

const route = useRoute()
const router = useRouter()

const projetoIdInput = ref('')
const projetoId = ref(Number(String(route.query?.projetoId || '').replace(/\D/g, '')) || null)

// Busca por cliente
const clienteSearch = ref('')
const clienteSuggestions = ref([])
const clienteSelecionado = ref(null)
const projetosDoCliente = ref([])
const loadingProjetos = ref(false)
const projetoSelecionadoId = ref(null)
let clienteSearchTimeout = null
const ambientes = ref([])
const ambienteSelecionado = ref('')
const loading = ref(false)
const salvando = ref(false)
const validando = ref(false)
const dadosProjeto = ref(null)
const medicaoId = ref(null)
const medicaoAtual = ref(null)
const abaAtiva = ref('medicao')

const CATEGORIA_MODELO_3D = 'MODELO_3D'
const CATEGORIA_LISTA_CORTE_PROMOB = 'LISTA_CORTE_PROMOB'
const modelos3D = ref([])
const modelo3DSelecionadoId = ref(null)
const modelo3DBlobUrl = ref('')
const listaCortePromob = ref([])
const painelEsquerdoOculto = ref(false)
const uploadProgress = ref(0)
const uploadLabel = ref('')
const listaCorteBlobCache = ref({})

const LIMITE_DIFERENCA_MM = 5

const tabelaConferencia = computed(() => {
  const rows = [
    { medida: 'altura', label: 'Altura (cm)', promob: form.value.altura_promob_cm, real: form.value.altura_cm },
    { medida: 'largura', label: 'Largura (cm)', promob: form.value.largura_promob_cm, real: form.value.largura_cm },
    { medida: 'profundidade', label: 'Profundidade (cm)', promob: form.value.profundidade_promob_cm, real: form.value.profundidade_cm },
  ]
  return rows.map((r) => {
    const p = r.promob != null && r.promob !== '' ? Number(r.promob) : null
    const re = r.real != null && r.real !== '' ? Number(r.real) : null
    let diff = null
    let alerta = false
    if (p != null && re != null && Number.isFinite(p) && Number.isFinite(re)) {
      const diffCm = re - p
      diff = (diffCm * 10).toFixed(1)
      alerta = Math.abs(diffCm * 10) > LIMITE_DIFERENCA_MM
    }
    return {
      medida: r.medida,
      label: r.label,
      promob: p != null ? String(p) : '—',
      real: re != null ? String(re) : '—',
      diff: diff != null ? `${Number(diff) >= 0 ? '+' : ''}${diff}` : '—',
      alerta,
    }
  })
})

const interferenciasOpcoes = [
  { key: 'AGUA', label: 'Pontos de Água' },
  { key: 'GAS', label: 'Gás' },
  { key: 'ESGOTO', label: 'Esgoto' },
  { key: 'TOMADAS', label: 'Tomadas' },
  { key: 'AR_CONDICIONADO', label: 'Pontos de Ar Condicionado' },
  { key: 'RODAPES', label: 'Rodapés' },
  { key: 'GESSO', label: 'Gesso' },
]

const categoriasFoto = [
  { key: 'PAREDE_A', label: 'Parede A' },
  { key: 'PAREDE_B', label: 'Parede B' },
  { key: 'TETO', label: 'Teto' },
  { key: 'PISO', label: 'Piso' },
]

// Galeria: Lado A (Medição) e Lado B (3D/Produção) — upload direto do celular, url no banco por AmbienteID
const galeriaLadoA = [
  { key: 'GALERIA_LOCAL_VAZIO', label: 'Local vazio' },
  { key: 'GALERIA_PONTOS_ELETRICOS', label: 'Pontos elétricos' },
  { key: 'GALERIA_PONTOS_HIDRAULICOS', label: 'Pontos hidráulicos' },
]
const galeriaLadoB = [
  { key: 'GALERIA_PRINT_PROMOB', label: 'Print Promob' },
  { key: 'GALERIA_MONTAGEM', label: 'Montagem (móvel)' },
]

const form = ref({
  altura_cm: null,
  largura_cm: null,
  profundidade_cm: null,
  altura_promob_cm: null,
  largura_promob_cm: null,
  profundidade_promob_cm: null,
  prumo_ok: false,
  esquadro_ok: false,
  interferencias: [],
  observacoes_montador: '',
  concluida: false,
})

const fotosPorCategoria = ref({})
const previewCache = ref({})
const modelo3DBlobCache = ref({})

function voltar() {
  router.push('/agendamentos')
}

async function buscarClientes() {
  if (clienteSearchTimeout) clearTimeout(clienteSearchTimeout)
  const q = String(clienteSearch.value || '').trim()
  if (q.length < 2) {
    clienteSuggestions.value = []
    return
  }
  clienteSearchTimeout = setTimeout(async () => {
    try {
      const res = await ClienteService.select(q)
      const data = Array.isArray(res?.data) ? res.data : []
      clienteSuggestions.value = data.map((item) => ({
        label: item?.label || item?.nome_completo || item?.razao_social || item?.nome || '',
        value: item?.value ?? item?.id ?? item?.cliente_id ?? null,
      })).filter((opt) => opt.value != null && opt.label)
    } catch {
      clienteSuggestions.value = []
    }
  }, 300)
}

function selecionarCliente(c) {
  clienteSelecionado.value = c
  clienteSuggestions.value = []
  clienteSearch.value = c.label
  loadingProjetos.value = true
  projetosDoCliente.value = []
  projetoSelecionadoId.value = null
  MedicaoFinaService.projetosPorCliente(c.value).then((res) => {
    const list = res?.data ?? res ?? []
    projetosDoCliente.value = Array.isArray(list) ? list : []
  }).catch(() => {
    projetosDoCliente.value = []
  }).finally(() => {
    loadingProjetos.value = false
  })
}

function limparCliente() {
  clienteSelecionado.value = null
  clienteSearch.value = ''
  projetosDoCliente.value = []
  projetoSelecionadoId.value = null
}

function abrirProjetoDoCliente() {
  const id = projetoSelecionadoId.value
  if (!id) return
  router.replace({ path: '/producao/medicao-fina', query: { projetoId: id } })
  projetoId.value = id
  carregarAmbientes()
}

async function irParaProjeto() {
  const raw = String(projetoIdInput.value || '').trim()
  if (!raw) return
  const num = Number(raw.replace(/\D/g, ''))
  let id = num > 0 ? num : null
  if (!id) {
    try {
      const res = await MedicaoFinaService.resolverProjeto(raw)
      const data = res?.data ?? res
      id = data?.projeto_id
    } catch (_) {}
  }
  if (id) {
    router.replace({ path: '/producao/medicao-fina', query: { projetoId: id } })
    projetoId.value = id
    carregarAmbientes()
  }
}

watch(() => route.query?.projetoId, (id) => {
  const n = Number(String(id || '').replace(/\D/g, ''))
  if (n) {
    projetoId.value = n
    carregarAmbientes()
  }
}, { immediate: true })

async function carregarAmbientes() {
  if (!projetoId.value) return
  loading.value = true
  dadosProjeto.value = null
  try {
    const [ambRes, dadosRes] = await Promise.all([
      MedicaoFinaService.listarAmbientes(projetoId.value),
      MedicaoFinaService.getProjetoDados(projetoId.value),
    ])
    const data = ambRes?.data ?? ambRes
    ambientes.value = Array.isArray(data) ? data : []
    if (ambientes.value.length && !ambienteSelecionado.value) {
      ambienteSelecionado.value = ambientes.value[0]
    }
    dadosProjeto.value = dadosRes?.data ?? dadosRes
    await carregarMedicao()
  } catch (e) {
    ambientes.value = []
    dadosProjeto.value = null
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function carregarMedicao() {
  if (!projetoId.value || !ambienteSelecionado.value) {
    medicaoId.value = null
    medicaoAtual.value = null
    modelos3D.value = []
    modelo3DBlobUrl.value = ''
    modelo3DSelecionadoId.value = null
    return
  }
  loading.value = true
  try {
    const res = await MedicaoFinaService.buscarPorProjetoAmbiente(projetoId.value, ambienteSelecionado.value)
    const data = res?.data ?? res
    medicaoAtual.value = data
    medicaoId.value = data?.id ?? null
    form.value = {
      altura_cm: data?.altura_cm ?? null,
      largura_cm: data?.largura_cm ?? null,
      profundidade_cm: data?.profundidade_cm ?? null,
      altura_promob_cm: data?.altura_promob_cm ?? null,
      largura_promob_cm: data?.largura_promob_cm ?? null,
      profundidade_promob_cm: data?.profundidade_promob_cm ?? null,
      prumo_ok: data?.prumo_ok ?? false,
      esquadro_ok: data?.esquadro_ok ?? false,
      interferencias: Array.isArray(data?.interferencias) ? [...data.interferencias] : [],
      conferencia_eletrica_ok: data?.conferencia_eletrica_ok ?? false,
      conferencia_hidraulica_ok: data?.conferencia_hidraulica_ok ?? false,
      conferencia_gas_ok: data?.conferencia_gas_ok ?? false,
      conferencia_alvenaria_ok: data?.conferencia_alvenaria_ok ?? false,
      observacoes_montador: data?.observacoes_montador ?? '',
      concluida: data?.concluida ?? false,
    }
    await carregarFotos()
    await carregarModelos3D()
    await carregarListaCorte()
  } catch (e) {
    medicaoId.value = null
    medicaoAtual.value = null
    modelos3D.value = []
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function carregarFotos() {
  if (!medicaoId.value) {
    fotosPorCategoria.value = {}
    return
  }
  try {
    const res = await ArquivosService.listar({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
    })
    const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ? res.data.data : [])
    const porCat = {}
    const todasCategorias = [...categoriasFoto, ...galeriaLadoA, ...galeriaLadoB]
    for (const cat of todasCategorias) {
      porCat[cat.key] = (list || []).filter((f) => (f.categoria || '').toUpperCase() === cat.key)
    }
    fotosPorCategoria.value = porCat
    for (const cat of todasCategorias) {
      for (const f of porCat[cat.key] || []) {
        ensurePreview(f)
      }
    }
  } catch {
    fotosPorCategoria.value = {}
  }
}

async function carregarModelos3D() {
  if (!medicaoId.value) {
    modelos3D.value = []
    modelo3DBlobUrl.value = ''
    modelo3DSelecionadoId.value = null
    return
  }
  try {
    const res = await ArquivosService.listar({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      categoria: CATEGORIA_MODELO_3D,
    })
    const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ? res.data.data : [])
    modelos3D.value = list || []
    if (!modelos3D.value.length) {
      modelo3DSelecionadoId.value = null
    } else if (!modelo3DSelecionadoId.value || !modelos3D.value.some((x) => x.id === modelo3DSelecionadoId.value)) {
      modelo3DSelecionadoId.value = modelos3D.value[0].id
    }
    await atualizarBlobUrlModelo3D()
  } catch {
    modelos3D.value = []
    modelo3DBlobUrl.value = ''
  }
}

async function atualizarBlobUrlModelo3D() {
  const id = modelo3DSelecionadoId.value
  if (!id) {
    modelo3DBlobUrl.value = ''
    return
  }
  if (modelo3DBlobCache.value[id]) {
    modelo3DBlobUrl.value = modelo3DBlobCache.value[id]
    return
  }
  try {
    const res = await api.get(`/arquivos/${id}/blob`, { responseType: 'blob' })
    const blob = res?.data
    if (blob) {
      const url = URL.createObjectURL(blob)
      modelo3DBlobCache.value = { ...modelo3DBlobCache.value, [id]: url }
      modelo3DBlobUrl.value = url
    }
  } catch (_) {
    modelo3DBlobUrl.value = ''
  }
}

watch(modelo3DSelecionadoId, () => {
  atualizarBlobUrlModelo3D()
})

function previewUrl(f) {
  if (f.url && f.url.startsWith('blob:')) return f.url
  return previewCache.value[f.id] || ''
}

async function ensurePreview(f) {
  if (!f?.id || previewCache.value[f.id]) return
  try {
    const res = await api.get(`/arquivos/${f.id}/blob`, { responseType: 'blob' })
    const blob = res?.data
    if (blob) {
      previewCache.value = { ...previewCache.value, [f.id]: URL.createObjectURL(blob) }
    }
  } catch (_) {}
}

async function onFileSelect(event, categoriaKey) {
  const file = event.target?.files?.[0]
  if (!file || !medicaoId.value) return
  event.target.value = ''
  try {
    await ArquivosService.upload({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      file,
      categoria: categoriaKey,
    })
    await carregarFotos()
  } catch (e) {
    console.error(e)
  }
}

async function onModelo3DSelect(event) {
  const file = event.target?.files?.[0]
  if (!file || !medicaoId.value) return
  event.target.value = ''
  const ext = (file.name || '').toLowerCase()
  if (!['.gltf', '.glb', '.obj'].some((e) => ext.endsWith(e))) return
  uploadProgress.value = 0
  uploadLabel.value = 'Enviando modelo'
  try {
    await ArquivosService.upload({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      file,
      categoria: CATEGORIA_MODELO_3D,
      onUploadProgress: (ev) => {
        if (ev.total) uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
      },
    })
    await carregarModelos3D()
  } catch (e) {
    console.error(e)
  } finally {
    uploadProgress.value = 0
    uploadLabel.value = ''
  }
}

async function carregarListaCorte() {
  if (!medicaoId.value) {
    listaCortePromob.value = []
    return
  }
  try {
    const res = await ArquivosService.listar({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      categoria: CATEGORIA_LISTA_CORTE_PROMOB,
    })
    const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ? res.data.data : [])
    listaCortePromob.value = list || []
  } catch {
    listaCortePromob.value = []
  }
}

function blobUrlListaCorte(id) {
  return listaCorteBlobCache.value[id] || '#'
}

async function abrirListaCorte(id) {
  if (listaCorteBlobCache.value[id]) {
    window.open(listaCorteBlobCache.value[id], '_blank')
    return
  }
  try {
    const res = await api.get(`/arquivos/${id}/blob`, { responseType: 'blob' })
    const blob = res?.data
    if (blob) {
      const url = URL.createObjectURL(blob)
      listaCorteBlobCache.value = { ...listaCorteBlobCache.value, [id]: url }
      window.open(url, '_blank')
    }
  } catch (_) {}
}

async function onListaCorteSelect(event) {
  const file = event.target?.files?.[0]
  if (!file || !medicaoId.value) return
  event.target.value = ''
  const ext = (file.name || '').toLowerCase()
  if (!ext.endsWith('.pdf') && !ext.endsWith('.csv')) return
  uploadProgress.value = 0
  uploadLabel.value = 'Enviando Lista'
  try {
    await ArquivosService.upload({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      file,
      categoria: CATEGORIA_LISTA_CORTE_PROMOB,
      onUploadProgress: (ev) => {
        if (ev.total) uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
      },
    })
    await carregarListaCorte()
  } catch (e) {
    console.error(e)
  } finally {
    uploadProgress.value = 0
    uploadLabel.value = ''
  }
}

async function removerListaCorte(f) {
  if (!f.id) return
  try {
    await ArquivosService.remover(f.id)
    await carregarListaCorte()
  } catch (e) {
    console.error(e)
  }
}

async function salvarPromobRapido() {
  if (!projetoId.value || !ambienteSelecionado.value) return
  try {
    await MedicaoFinaService.salvar({
      projeto_id: projetoId.value,
      nome_ambiente: ambienteSelecionado.value,
      altura_cm: form.value.altura_cm ?? undefined,
      largura_cm: form.value.largura_cm ?? undefined,
      profundidade_cm: form.value.profundidade_cm ?? undefined,
      altura_promob_cm: form.value.altura_promob_cm ?? undefined,
      largura_promob_cm: form.value.largura_promob_cm ?? undefined,
      profundidade_promob_cm: form.value.profundidade_promob_cm ?? undefined,
      prumo_ok: form.value.prumo_ok,
      esquadro_ok: form.value.esquadro_ok,
      interferencias: form.value.interferencias,
      conferencia_eletrica_ok: form.value.conferencia_eletrica_ok,
      conferencia_hidraulica_ok: form.value.conferencia_hidraulica_ok,
      conferencia_gas_ok: form.value.conferencia_gas_ok,
      conferencia_alvenaria_ok: form.value.conferencia_alvenaria_ok,
      observacoes_montador: form.value.observacoes_montador || undefined,
      concluida: form.value.concluida,
    })
  } catch (e) {
    console.error(e)
  }
}

const validacaoOk = ref(false)
async function validarMedicao() {
  if (!projetoId.value) return
  validando.value = true
  validacaoOk.value = false
  try {
    await MedicaoFinaService.validarMedicao(projetoId.value)
    dadosProjeto.value = { ...dadosProjeto.value, status_atual: 'PRONTO_PARA_PRODUCAO' }
    validacaoOk.value = true
    setTimeout(() => { validacaoOk.value = false }, 4000)
  } catch (e) {
    console.error(e)
  } finally {
    validando.value = false
  }
}

async function removerModelo3D(m) {
  if (!m.id) return
  try {
    await ArquivosService.remover(m.id)
    if (modelo3DSelecionadoId.value === m.id) {
      modelo3DSelecionadoId.value = modelos3D.value.find((x) => x.id !== m.id)?.id ?? null
    }
    await carregarModelos3D()
  } catch (e) {
    console.error(e)
  }
}

async function removerFoto(f, categoriaKey) {
  if (!f.id) return
  try {
    await ArquivosService.remover(f.id)
    await carregarFotos()
  } catch (e) {
    console.error(e)
  }
}

async function salvar() {
  if (!projetoId.value || !ambienteSelecionado.value) return
  salvando.value = true
  try {
    const payload = {
      projeto_id: projetoId.value,
      nome_ambiente: ambienteSelecionado.value,
      altura_cm: form.value.altura_cm ?? undefined,
      largura_cm: form.value.largura_cm ?? undefined,
      profundidade_cm: form.value.profundidade_cm ?? undefined,
      altura_promob_cm: form.value.altura_promob_cm ?? undefined,
      largura_promob_cm: form.value.largura_promob_cm ?? undefined,
      profundidade_promob_cm: form.value.profundidade_promob_cm ?? undefined,
      prumo_ok: form.value.prumo_ok,
      esquadro_ok: form.value.esquadro_ok,
      interferencias: form.value.interferencias,
      conferencia_eletrica_ok: form.value.conferencia_eletrica_ok,
      conferencia_hidraulica_ok: form.value.conferencia_hidraulica_ok,
      conferencia_gas_ok: form.value.conferencia_gas_ok,
      conferencia_alvenaria_ok: form.value.conferencia_alvenaria_ok,
      observacoes_montador: form.value.observacoes_montador || undefined,
      concluida: form.value.concluida,
    }
    const res = await MedicaoFinaService.salvar(payload)
    const data = res?.data ?? res
    medicaoId.value = data?.id ?? medicaoId.value
    medicaoAtual.value = data
    await carregarFotos()
  } catch (e) {
    console.error(e)
  } finally {
    salvando.value = false
  }
}
</script>
