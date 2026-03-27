<template>
  <PageShell :padded="false">
    <section class="ds-page-context animate-page-in w-full px-4 md:px-8 pb-8">
      <header class="garantia-page-header">
        <div class="garantia-page-header__main">
          <div class="garantia-page-header__icon" aria-hidden="true">
            <i class="pi pi-wrench" />
          </div>
          <div class="min-w-0">
            <h1 class="garantia-page-header__title">{{ isEditing ? `Garantia #${garantiaId}` : 'Nova Garantia' }}</h1>
            <p class="garantia-page-header__subtitle">
              {{ isEditing ? 'Editar detalhes, fotos e agendar' : 'Preencha os dados da garantia ou assistência' }}
            </p>
          </div>
        </div>

        <div class="garantia-page-header__actions">
          <Button variant="secondary" @click="router.push('/garantias')">
            <i class="pi pi-arrow-left" /> Voltar
          </Button>
        </div>
      </header>

      <div v-if="loadingInicial" class="flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-3xl text-brand-primary" />
      </div>

      <form v-else class="garantia-form pb-12" @submit.prevent="salvar">
        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Dados da Garantia</h2>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Tipo</label>
              <select v-model="form.tipo" class="ds-input w-full">
                <option value="GARANTIA">Garantia</option>
                <option value="ASSISTENCIA">Assistência</option>
              </select>
            </div>

            <div>
              <label class="ds-label">Título *</label>
              <input v-model="form.titulo" type="text" class="ds-input w-full" placeholder="Ex: Troca de porta cozinha" required />
            </div>

            <div>
              <label class="ds-label">Cliente *</label>
              <div class="relative">
                <input
                  v-model="clienteBusca"
                  type="text"
                  class="ds-input w-full"
                  placeholder="Buscar cliente..."
                  @input="buscarClientes"
                  @focus="showClienteDropdown = true"
                />
                <div v-if="form.cliente_id && clienteSelecionado" class="mt-1 text-xs text-brand-primary font-semibold">
                  ✓ {{ clienteSelecionado.nome_completo }}
                </div>
                <ul
                  v-if="showClienteDropdown && clientesOpcoes.length"
                  class="absolute z-30 top-full left-0 right-0 mt-1 bg-[var(--ds-color-surface)] border border-[var(--ds-color-border)] rounded-xl shadow-xl max-h-48 overflow-y-auto"
                >
                  <li
                    v-for="c in clientesOpcoes"
                    :key="c.id"
                    class="px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--ds-color-surface-muted)] transition-colors"
                    @mousedown.prevent="selecionarCliente(c)"
                  >
                    <span class="font-semibold">{{ c.nome_completo }}</span>
                    <span v-if="c.whatsapp" class="ml-2 text-text-muted">{{ c.whatsapp }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label class="ds-label">Venda vinculada</label>
              <select v-model="form.venda_id" class="ds-input w-full" :disabled="!vendasCliente.length">
                <option :value="null">Nenhuma</option>
                <option v-for="v in vendasCliente" :key="v.id" :value="v.id">
                  #{{ v.id }} — {{ moeda(v.valor_vendido) }} ({{ v.status }})
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="ds-label">Descrição / Detalhes do problema</label>
            <textarea v-model="form.descricao" class="ds-input w-full min-h-[100px]" placeholder="Descreva o problema reportado pelo cliente..." />
          </div>

          <div>
            <label class="ds-label">Processo / Serviço a ser realizado</label>
            <textarea v-model="form.processo" class="ds-input w-full min-h-[100px]" placeholder="Descreva o que será feito para resolver..." />
          </div>
        </section>

        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Produtos</h2>
            <span class="garantia-section__meta">Busca geral com ajuste de 100%</span>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Buscar produto</label>
              <div class="relative">
                <input
                  v-model="produtoBusca"
                  type="text"
                  class="ds-input w-full"
                  placeholder="Digite nome, marca, cor ou medida..."
                  @input="buscarProdutos"
                  @focus="showProdutoDropdown = true"
                />

                <ul
                  v-if="showProdutoDropdown && produtosOpcoes.length"
                  class="absolute z-30 top-full left-0 right-0 mt-1 bg-[var(--ds-color-surface)] border border-[var(--ds-color-border)] rounded-xl shadow-xl max-h-72 overflow-y-auto"
                >
                  <li
                    v-for="produto in produtosOpcoes"
                    :key="produto.id"
                    class="garantia-produto-option"
                    @mousedown.prevent="adicionarProduto(produto)"
                  >
                    <div class="min-w-0">
                      <div class="font-semibold truncate">{{ produto.nome_produto || produto.nome || `Produto #${produto.id}` }}</div>
                      <div class="text-xs text-text-muted truncate">
                        {{ [produto.marca, produto.cor, produto.medida].filter(Boolean).join(' • ') || 'Sem variação informada' }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-semibold">{{ moeda(produto.valor_unitario) }}</div>
                      <div class="text-[11px] text-text-muted">valor base</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div class="garantia-produtos-resumo">
              <div>
                <span class="ds-label">Custo total</span>
                <strong>{{ moeda(totalProdutosCusto) }}</strong>
              </div>
              <div>
                <span class="ds-label">Valor garantia</span>
                <strong>{{ moeda(totalProdutosValorVenda) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="produtosSelecionados.length" class="garantia-produtos-lista">
            <div class="garantia-produtos-head">
              <span>Produto</span>
              <span>Qtd.</span>
              <span>Unit.</span>
              <span>Total</span>
              <span></span>
            </div>

            <div
              v-for="produto in produtosSelecionados"
              :key="produto.id"
              class="garantia-produtos-row"
            >
              <div class="min-w-0">
                <div class="font-semibold truncate">{{ produto.nome_produto }}</div>
                <div class="text-xs text-text-muted truncate">
                  {{ [produto.marca, produto.cor, produto.medida].filter(Boolean).join(' • ') || 'Sem detalhes' }}
                </div>
              </div>

              <div>
                <input
                  v-model.number="produto.quantidade"
                  type="number"
                  min="1"
                  step="1"
                  class="ds-input garantia-produtos-qtd"
                />
              </div>

              <div class="text-sm">{{ moeda(produto.valor_unitario) }}</div>
              <div class="text-sm font-semibold">{{ moeda(produto.quantidade * produto.valor_unitario) }}</div>

              <button type="button" class="garantia-link danger" @click="removerProduto(produto.id)">
                Remover
              </button>
            </div>
          </div>

          <p v-else class="garantia-empty-state">
            Nenhum produto selecionado ainda. Busque e adicione os itens para compor o custo da garantia.
          </p>
        </section>

        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Agendamento</h2>
            <span v-if="!isEditing" class="garantia-section__meta">Opcional — será criado automaticamente ao salvar</span>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Título do agendamento</label>
              <input v-model="agenda.titulo" type="text" class="ds-input w-full" :placeholder="`${form.tipo === 'ASSISTENCIA' ? 'Assistência' : 'Garantia'} - ${form.titulo || 'descrição'}`" />
            </div>
            <div>
              <label class="ds-label">Funcionário responsável</label>
              <select v-model="form.funcionario_responsavel_id" class="ds-input w-full">
                <option :value="null">Selecione...</option>
                <option v-for="f in funcionarios" :key="f.id" :value="f.id">
                  {{ f.nome }} {{ f.cargo ? `(${f.cargo})` : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="ds-label">Data prevista</label>
              <input v-model="agenda.data" type="date" class="ds-input w-full" />
            </div>
            <div class="garantia-grid garantia-grid--2">
              <div>
                <label class="ds-label">Hora início</label>
                <input v-model="agenda.hora_inicio" type="time" class="ds-input w-full" />
              </div>
              <div>
                <label class="ds-label">Hora fim</label>
                <input v-model="agenda.hora_fim" type="time" class="ds-input w-full" />
              </div>
            </div>
          </div>

          <div>
            <label class="ds-label">Funcionários destinados</label>
            <div class="flex flex-wrap gap-2 mt-2">
              <label
                v-for="f in funcionarios"
                :key="f.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors"
                :class="agenda.funcionario_ids.includes(f.id)
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold'
                  : 'border-[var(--ds-color-border)] text-text-muted hover:bg-[var(--ds-color-surface-muted)]'"
              >
                <input
                  type="checkbox"
                  :value="f.id"
                  v-model="agenda.funcionario_ids"
                  class="sr-only"
                />
                {{ f.nome }}
              </label>
            </div>
          </div>

          <Button
            v-if="isEditing"
            type="button"
            variant="secondary"
            :loading="agendando"
            :disabled="!agendaInicioEm || !agendaFimEm"
            @click="criarAgendamento"
          >
            <i class="pi pi-calendar-plus" />
            Criar Agendamento
          </Button>
        </section>

        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Valores</h2>
            <span class="garantia-section__meta">O valor de venda acompanha automaticamente o custo com acréscimo de 100%</span>
          </div>

          <div class="garantia-grid garantia-grid--3">
            <div>
              <label class="ds-label">Prazo previsto (horas)</label>
              <input v-model="form.horas_previstas" type="number" min="0" step="0.25" class="ds-input w-full" placeholder="0,00" />
            </div>
            <div>
              <label class="ds-label">Custo (R$)</label>
              <input v-model="form.custo" type="text" class="ds-input w-full" placeholder="0,00" />
            </div>
            <div>
              <label class="ds-label">Valor de Venda (R$)</label>
              <input v-model="form.valor_venda" type="text" class="ds-input w-full" placeholder="0,00" />
            </div>
            <div>
              <label class="ds-label">Previsão</label>
              <input v-model="form.data_previsao" type="date" class="ds-input w-full" />
            </div>
          </div>

          <div>
            <label class="ds-label">Observações</label>
            <textarea v-model="form.observacoes" class="ds-input w-full min-h-[80px]" placeholder="Observações adicionais..." />
          </div>

          <div class="garantia-resumo-financeiro">
            <div>
              <span class="ds-label">Produtos</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_produtos) }}</strong>
            </div>
            <div>
              <span class="ds-label">Mão de obra prevista</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_mao_obra_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo fábrica previsto</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_fabrica_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">Total previsto</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_total_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">Valor a cobrar</span>
              <strong class="text-brand-primary">{{ moeda(resumoFinanceiroPreview.valor_cobrado) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo hora fábrica</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_hora_estrutura) }}</strong>
            </div>
          </div>

          <div v-if="form.tipo !== 'GARANTIA' && resumoFinanceiroPreview.valor_cobrado > 0" class="garantia-cobranca-aviso">
            <i class="pi pi-info-circle" />
            <span>Ao salvar, será gerada uma <strong>conta a receber</strong> de <strong>{{ moeda(resumoFinanceiroPreview.valor_cobrado) }}</strong> vinculada a esta {{ form.tipo === 'ASSISTENCIA' ? 'assistência' : 'manutenção' }}.</span>
          </div>
          <div v-else-if="form.tipo === 'GARANTIA' && resumoFinanceiroPreview.valor_cobrado > 0" class="garantia-cobranca-aviso" style="background: color-mix(in srgb, var(--ds-color-warning, #f59e0b) 10%, transparent); color: var(--ds-color-warning, #92400e);">
            <i class="pi pi-exclamation-triangle" />
            <span>Garantia não gera cobrança ao cliente — o custo de <strong>{{ moeda(resumoFinanceiroPreview.custo_total_previsto) }}</strong> será absorvido pela empresa na DRE.</span>
          </div>
        </section>

        <section v-if="isEditing" class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Realizado</h2>
            <span class="garantia-section__meta">Horas e custos apurados pelos apontamentos da garantia</span>
          </div>

          <div class="garantia-resumo-financeiro">
            <div>
              <span class="ds-label">Horas realizadas</span>
              <strong>{{ numeroResumo(resumoFinanceiroReal?.horas_realizadas) }}h</strong>
            </div>
            <div>
              <span class="ds-label">Mão de obra real</span>
              <strong>{{ moeda(resumoFinanceiroReal?.custo_mao_obra_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo fábrica real</span>
              <strong>{{ moeda(resumoFinanceiroReal?.custo_fabrica_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Total real</span>
              <strong>{{ moeda(resumoFinanceiroReal?.custo_total_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Valor cobrado</span>
              <strong>{{ moeda(resumoFinanceiroReal?.valor_cobrado) }}</strong>
            </div>
          </div>
        </section>

        <section v-if="isEditing" class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Fotos</h2>
          </div>

          <div class="garantia-fotos-grid">
            <div
              v-for="foto in fotos"
              :key="foto.id"
              class="garantia-foto-item group"
            >
              <img :src="fotoUrl(foto)" class="w-full h-full object-cover" :alt="foto.nome || 'Foto'" />
              <button
                type="button"
                class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                @click="removerFoto(foto.id)"
              >
                <i class="pi pi-times text-xs" />
              </button>
            </div>

            <div
              class="garantia-foto-upload"
              @click="fotoInput?.click()"
            >
              <i class="pi pi-camera text-2xl text-text-muted mb-1" />
              <span class="text-[10px] font-bold text-text-muted uppercase">Adicionar</span>
              <input ref="fotoInput" type="file" accept="image/*" multiple class="hidden" @change="uploadFotos" />
            </div>
          </div>
        </section>

        <section class="garantia-section garantia-section--actions">
          <div class="garantia-actions">
            <div>
              <select v-if="isEditing" v-model="form.status" class="ds-input">
                <option value="PENDENTE">Pendente</option>
                <option value="AGENDADA">Agendada</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <Button v-if="isEditing" variant="danger" type="button" :loading="removendo" @click="confirmarRemover">
                <i class="pi pi-trash" /> Excluir
              </Button>
              <Button variant="primary" type="submit" :loading="salvando">
                <i class="pi pi-check" />
                {{ isEditing ? 'Salvar alterações' : 'Criar Garantia' }}
              </Button>
            </div>
          </div>
        </section>
      </form>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import PageShell from '@/components/ui/PageShell.vue'
import { GarantiaService, ClienteService, FuncionariosService, ProdutosService, VendaService } from '@/services'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'garantias.ver' } })

const route = useRoute()
const router = useRouter()

const garantiaId = computed(() => {
  const raw = route.params.id
  if (raw === 'nova') return null
  const n = Number(String(raw || '').replace(/\D/g, ''))
  return n || null
})
const isEditing = computed(() => !!garantiaId.value)

const loadingInicial = ref(false)
const salvando = ref(false)
const removendo = ref(false)
const agendando = ref(false)
const resumoFinanceiroReal = ref(null)

const form = ref({
  tipo: 'GARANTIA',
  titulo: '',
  cliente_id: null,
  venda_id: null,
  funcionario_responsavel_id: null,
  descricao: '',
  processo: '',
  horas_previstas: '',
  custo_produtos: '',
  custo_mao_obra_previsto: '',
  custo_fabrica_previsto: '',
  custo: '',
  valor_venda: '',
  data_previsao: '',
  data_conclusao: '',
  observacoes: '',
  status: 'PENDENTE',
})

const agenda = ref({
  titulo: '',
  data: '',
  hora_inicio: '',
  hora_fim: '',
  funcionario_ids: [],
})

const agendaInicioEm = computed(() => {
  if (!agenda.value.data || !agenda.value.hora_inicio) return ''
  return `${agenda.value.data}T${agenda.value.hora_inicio}`
})

const agendaFimEm = computed(() => {
  if (!agenda.value.data || !agenda.value.hora_fim) return ''
  return `${agenda.value.data}T${agenda.value.hora_fim}`
})

const RESUMO_PRODUTOS_INICIO = '[PRODUTOS_GARANTIA]'
const RESUMO_PRODUTOS_FIM = '[/PRODUTOS_GARANTIA]'

// Produtos
const produtoBusca = ref('')
const produtosCatalogo = ref([])
const produtosOpcoes = ref([])
const produtosSelecionados = ref([])
const showProdutoDropdown = ref(false)
let produtoBuscaTimeout = null

function numeroProduto(valor) {
  const n = Number(valor ?? 0)
  return Number.isFinite(n) ? n : 0
}

function normalizarProduto(produto) {
  return {
    id: produto.id,
    nome_produto: produto.nome_produto || produto.nome || `Produto #${produto.id}`,
    marca: produto.marca || '',
    cor: produto.cor || '',
    medida: produto.medida || '',
    valor_unitario: numeroProduto(produto.valor_unitario ?? produto.valor_total ?? produto.custo_unitario_real),
    quantidade: Math.max(1, Number(produto.quantidade || 1)),
  }
}

function montarResumoProdutos() {
  if (!produtosSelecionados.value.length) return ''

  const linhas = produtosSelecionados.value.map((produto) => (
    `- ${produto.id}|${produto.nome_produto}|${produto.quantidade}|${numeroProduto(produto.valor_unitario).toFixed(2)}|${produto.marca}|${produto.cor}|${produto.medida}`
  ))

  return [RESUMO_PRODUTOS_INICIO, ...linhas, RESUMO_PRODUTOS_FIM].join('\n')
}

function aplicarResumoProdutosNaObservacao(textoBase = '') {
  const textoLimpo = limparResumoProdutos(textoBase).trim()
  const resumo = montarResumoProdutos()
  return [textoLimpo, resumo].filter(Boolean).join('\n\n')
}

function limparResumoProdutos(texto = '') {
  return String(texto || '')
    .replace(new RegExp(`${RESUMO_PRODUTOS_INICIO}[\\s\\S]*?${RESUMO_PRODUTOS_FIM}`, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extrairProdutosDasObservacoes(texto = '') {
  const match = String(texto || '').match(new RegExp(`${RESUMO_PRODUTOS_INICIO}\\n([\\s\\S]*?)\\n${RESUMO_PRODUTOS_FIM}`))
  if (!match?.[1]) return []

  return match[1]
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha.startsWith('- '))
    .map((linha) => linha.slice(2).split('|'))
    .map(([id, nome_produto, quantidade, valor_unitario, marca, cor, medida]) => ({
      id: Number(id),
      nome_produto: nome_produto || '',
      quantidade: Math.max(1, Number(quantidade || 1)),
      valor_unitario: numeroProduto(valor_unitario),
      marca: marca || '',
      cor: cor || '',
      medida: medida || '',
    }))
    .filter((produto) => produto.id && produto.nome_produto)
}

async function buscarProdutos() {
  showProdutoDropdown.value = true
  clearTimeout(produtoBuscaTimeout)
  produtoBuscaTimeout = setTimeout(async () => {
    const q = produtoBusca.value?.trim()
    if (!q) {
      produtosOpcoes.value = produtosCatalogo.value.slice(0, 30)
      return
    }

    const termo = q.toLowerCase()
    const filtrados = produtosCatalogo.value.filter((produto) => {
      const alvo = [
        produto.nome_produto,
        produto.nome,
        produto.marca,
        produto.cor,
        produto.medida,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return alvo.includes(termo)
    })

    produtosOpcoes.value = filtrados.slice(0, 30)
  }, 250)
}

async function carregarProdutos() {
  try {
    const { data } = await ProdutosService.listar()
    const itens = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    produtosCatalogo.value = itens
    produtosOpcoes.value = itens.slice(0, 30)
  } catch (e) {
    console.error(e)
    produtosCatalogo.value = []
    produtosOpcoes.value = []
    notify.error('Falha ao carregar produtos')
  }
}

function adicionarProduto(produto) {
  const existente = produtosSelecionados.value.find((item) => item.id === produto.id)
  if (existente) {
    existente.quantidade += 1
  } else {
    produtosSelecionados.value.push(normalizarProduto(produto))
  }
  produtoBusca.value = ''
  produtosOpcoes.value = []
  showProdutoDropdown.value = false
}

function removerProduto(produtoId) {
  produtosSelecionados.value = produtosSelecionados.value.filter((produto) => produto.id !== produtoId)
}

const totalProdutosCusto = computed(() => (
  produtosSelecionados.value.reduce((total, produto) => total + (numeroProduto(produto.quantidade) * numeroProduto(produto.valor_unitario)), 0)
))

const totalProdutosValorVenda = computed(() => totalProdutosCusto.value * 2)

// Clientes
const clienteBusca = ref('')
const clientesOpcoes = ref([])
const clienteSelecionado = ref(null)
const showClienteDropdown = ref(false)
let buscaTimeout = null

function buscarClientes() {
  showClienteDropdown.value = true
  clearTimeout(buscaTimeout)
  buscaTimeout = setTimeout(async () => {
    const q = clienteBusca.value?.trim()
    if (!q || q.length < 2) { clientesOpcoes.value = []; return }
    try {
      const { data } = await ClienteService.select(q)
      clientesOpcoes.value = Array.isArray(data) ? data : []
    } catch { clientesOpcoes.value = [] }
  }, 300)
}

function selecionarCliente(c) {
  form.value.cliente_id = c.id
  clienteSelecionado.value = c
  clienteBusca.value = c.nome_completo
  showClienteDropdown.value = false
  carregarVendasCliente(c.id)
}

// Vendas do cliente
const vendasCliente = ref([])
async function carregarVendasCliente(clienteId) {
  if (!clienteId) { vendasCliente.value = []; return }
  try {
    const { data } = await VendaService.listar()
    const todas = Array.isArray(data) ? data : []
    vendasCliente.value = todas.filter(v => v.cliente_id === clienteId)
  } catch { vendasCliente.value = [] }
}

// Funcionários
const funcionarios = ref([])
const custoHoraEstrutura = ref(0)
async function carregarFuncionarios() {
  try {
    const { data } = await FuncionariosService.listar()
    funcionarios.value = (Array.isArray(data) ? data : []).filter(f => f.status === 'ATIVO')
  } catch { funcionarios.value = [] }
}

async function carregarCustoHoraEstrutura() {
  const agora = new Date()
  try {
    const response = await fetch(`/api/financeiro/custos-estrutura?mes=${agora.getMonth() + 1}&ano=${agora.getFullYear()}`, {
      credentials: 'include',
    })
    const data = await response.json()
    custoHoraEstrutura.value = Number(data?.custo_hora_estrutura ?? data?.custo_hora ?? 0) || 0
  } catch {
    custoHoraEstrutura.value = 0
  }
}

// Fotos
const fotos = ref([])
const fotoInput = ref(null)

function fotoUrl(foto) {
  if (!foto.url) return ''
  return foto.url.startsWith('http') ? foto.url : `/api${foto.url}`
}

async function carregarFotos() {
  if (!garantiaId.value) return
  try {
    const { data } = await ArquivosService.listar({ ownerType: 'GARANTIA', ownerId: garantiaId.value })
    fotos.value = Array.isArray(data) ? data : []
  } catch { fotos.value = [] }
}

async function uploadFotos(e) {
  const files = e.target?.files
  if (!files?.length || !garantiaId.value) return

  for (const file of files) {
    try {
      await ArquivosService.upload({
        ownerType: 'GARANTIA',
        ownerId: garantiaId.value,
        file,
        categoria: 'FOTO',
      })
    } catch (err) {
      console.error(err)
      notify.error(`Falha ao enviar ${file.name}`)
    }
  }
  fotoInput.value.value = ''
  await carregarFotos()
  notify.success('Foto(s) enviada(s)')
}

async function removerFoto(fotoId) {
  if (!confirm('Remover esta foto?')) return
  try {
    await ArquivosService.remover(fotoId)
    await carregarFotos()
    notify.success('Foto removida')
  } catch {
    notify.error('Falha ao remover foto')
  }
}

// Salvar
async function salvar() {
  if (!form.value.cliente_id) { notify.warn('Selecione um cliente'); return }
  if (!form.value.titulo?.trim()) { notify.warn('Informe o título'); return }

  salvando.value = true
  try {
    const payload = {
      ...form.value,
      custo_produtos: String(resumoFinanceiroPreview.value.custo_produtos.toFixed(2)),
      custo_mao_obra_previsto: String(resumoFinanceiroPreview.value.custo_mao_obra_previsto.toFixed(2)),
      custo_fabrica_previsto: String(resumoFinanceiroPreview.value.custo_fabrica_previsto.toFixed(2)),
      horas_previstas: String(resumoFinanceiroPreview.value.horas_previstas.toFixed(2)),
      observacoes: aplicarResumoProdutosNaObservacao(form.value.observacoes),
    }
    const { data } = await GarantiaService.salvar(garantiaId.value, payload)

    if (isEditing.value) {
      notify.success('Garantia atualizada')
      return
    }

    if (data?.id && agendaInicioEm.value && agendaFimEm.value) {
      try {
        await GarantiaService.agendar(data.id, {
          titulo: agenda.value.titulo || `${form.value.tipo === 'ASSISTENCIA' ? 'Assistência' : 'Garantia'} - ${form.value.titulo}`,
          inicio_em: new Date(agendaInicioEm.value).toISOString(),
          fim_em: new Date(agendaFimEm.value).toISOString(),
          funcionario_ids: agenda.value.funcionario_ids,
          subetapa: form.value.tipo === 'ASSISTENCIA' ? 'ASSISTENCIA' : 'GARANTIA',
        })
        notify.success('Garantia criada e agendamento gerado!')
        router.replace('/agendamentos')
      } catch (e) {
        console.error(e)
        notify.warn('Garantia criada, mas agendamento falhou. Verifique antes de sair.')
        router.replace(`/garantias/${data.id}`)
      }
    } else if (data?.id) {
      notify.success('Garantia criada')
      router.replace(`/garantias/${data.id}`)
    }
  } catch (e) {
    console.error(e)
    notify.error('Falha ao salvar garantia')
  } finally {
    salvando.value = false
  }
}

// Excluir
async function confirmarRemover() {
  if (!confirm('Tem certeza que deseja excluir esta garantia?')) return
  removendo.value = true
  try {
    await GarantiaService.remover(garantiaId.value)
    notify.success('Garantia excluída')
    router.replace('/garantias')
  } catch {
    notify.error('Falha ao excluir')
  } finally {
    removendo.value = false
  }
}

// Agendar
async function criarAgendamento() {
  if (!agendaInicioEm.value || !agendaFimEm.value) {
    notify.warn('Preencha a data e os horários do agendamento')
    return
  }

  agendando.value = true
  try {
    const payload = {
      titulo: agenda.value.titulo || `${form.value.tipo === 'ASSISTENCIA' ? 'Assistência' : 'Garantia'} - ${form.value.titulo}`,
      inicio_em: new Date(agendaInicioEm.value).toISOString(),
      fim_em: new Date(agendaFimEm.value).toISOString(),
      funcionario_ids: agenda.value.funcionario_ids,
      subetapa: form.value.tipo === 'ASSISTENCIA' ? 'ASSISTENCIA' : 'GARANTIA',
    }
    await GarantiaService.agendar(garantiaId.value, payload)
    notify.success('Agendamento criado com sucesso')
    form.value.status = 'AGENDADA'
    await carregarGarantia()
  } catch (e) {
    console.error(e)
    notify.error('Falha ao criar agendamento')
  } finally {
    agendando.value = false
  }
}

function moeda(v) {
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function numeroResumo(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const funcionariosSelecionadosGarantia = computed(() => {
  const ids = new Set([
    ...agenda.value.funcionario_ids,
    form.value.funcionario_responsavel_id,
  ].filter(Boolean))

  return funcionarios.value.filter((funcionario) => ids.has(funcionario.id))
})

const horasPrevistasPreview = computed(() => {
  const horasDigitadas = Number(form.value.horas_previstas || 0)
  if (horasDigitadas > 0) return horasDigitadas

  if (agendaInicioEm.value && agendaFimEm.value) {
    const inicio = new Date(agendaInicioEm.value)
    const fim = new Date(agendaFimEm.value)
    const horas = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
    return horas > 0 ? Math.round(horas * 100) / 100 : 0
  }

  return 0
})

const resumoFinanceiroPreview = computed(() => {
  const custoProdutos = totalProdutosCusto.value
  const horasPrevistas = horasPrevistasPreview.value
  const custoMaoObraPrevisto = funcionariosSelecionadosGarantia.value.reduce(
    (total, funcionario) => total + ((Number(funcionario.custo_hora || 0) || 0) * horasPrevistas),
    0,
  )
  const custoFabricaPrevisto = custoHoraEstrutura.value * horasPrevistas
  const custoTotalPrevisto = custoProdutos + custoMaoObraPrevisto + custoFabricaPrevisto
  const valorCobrado = (custoProdutos * 2) + custoMaoObraPrevisto + custoFabricaPrevisto

  return {
    horas_previstas: horasPrevistas,
    custo_produtos: custoProdutos,
    custo_mao_obra_previsto: custoMaoObraPrevisto,
    custo_fabrica_previsto: custoFabricaPrevisto,
    custo_total_previsto: custoTotalPrevisto,
    valor_cobrado: valorCobrado,
    custo_hora_estrutura: custoHoraEstrutura.value,
  }
})

// Carregar dados (se editando)
async function carregarGarantia() {
  if (!garantiaId.value) return
  loadingInicial.value = true
  try {
    const { data } = await GarantiaService.buscar(garantiaId.value)
    form.value = {
      tipo: data.tipo || 'GARANTIA',
      titulo: data.titulo || '',
      cliente_id: data.cliente_id,
      venda_id: data.venda_id || null,
      funcionario_responsavel_id: data.funcionario_responsavel_id || null,
      descricao: data.descricao || '',
      processo: data.processo || '',
      horas_previstas: data.horas_previstas ? String(data.horas_previstas) : '',
      custo_produtos: data.custo_produtos ? String(data.custo_produtos) : '',
      custo_mao_obra_previsto: data.custo_mao_obra_previsto ? String(data.custo_mao_obra_previsto) : '',
      custo_fabrica_previsto: data.custo_fabrica_previsto ? String(data.custo_fabrica_previsto) : '',
      custo: data.custo ? String(data.custo) : '',
      valor_venda: data.valor_venda ? String(data.valor_venda) : '',
      data_previsao: data.data_previsao ? data.data_previsao.substring(0, 10) : '',
      data_conclusao: data.data_conclusao ? data.data_conclusao.substring(0, 10) : '',
      observacoes: limparResumoProdutos(data.observacoes || ''),
      status: data.status || 'PENDENTE',
    }
    produtosSelecionados.value = extrairProdutosDasObservacoes(data.observacoes || '')
    resumoFinanceiroReal.value = data.resumo_financeiro || null
    if (data.cliente) {
      clienteSelecionado.value = data.cliente
      clienteBusca.value = data.cliente.nome_completo || ''
      carregarVendasCliente(data.cliente_id)
    }
  } catch (e) {
    console.error(e)
    notify.error('Garantia não encontrada')
    router.replace('/garantias')
  } finally {
    loadingInicial.value = false
  }
}

onMounted(async () => {
  await carregarFuncionarios()
  await carregarCustoHoraEstrutura()
  await carregarProdutos()
  if (garantiaId.value) {
    await carregarGarantia()
    await carregarFotos()
  }
})

watch(produtosSelecionados, (itens) => {
  const custoCalculado = resumoFinanceiroPreview.value.custo_total_previsto
  const valorCalculado = resumoFinanceiroPreview.value.valor_cobrado

  if (itens.length) {
    form.value.custo = custoCalculado.toFixed(2)
    form.value.valor_venda = valorCalculado.toFixed(2)
  }
}, { deep: true })

watch([horasPrevistasPreview, funcionariosSelecionadosGarantia], () => {
  form.value.custo = resumoFinanceiroPreview.value.custo_total_previsto.toFixed(2)
  form.value.valor_venda = resumoFinanceiroPreview.value.valor_cobrado.toFixed(2)
}, { deep: true })
</script>

<style scoped>
.garantia-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 85%, transparent);
}
.garantia-page-header__main {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}
.garantia-page-header__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 85%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-soft);
  background: transparent;
  flex-shrink: 0;
}
.garantia-page-header__title {
  color: var(--ds-color-text);
  font-size: clamp(1.75rem, 2.4vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.garantia-page-header__subtitle {
  margin-top: 0.35rem;
  color: var(--ds-color-text-soft);
  font-size: 1rem;
}
.garantia-page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.garantia-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.garantia-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-section:first-of-type {
  padding-top: 0;
  border-top: 0;
}
.garantia-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.garantia-section__title {
  color: var(--ds-color-text);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.garantia-section__meta {
  color: var(--ds-color-text-soft);
  font-size: 0.82rem;
}
.garantia-grid {
  display: grid;
  gap: 1.25rem;
}
.garantia-grid--2,
.garantia-grid--3 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.garantia-fotos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.garantia-foto-item {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface-muted) 45%, transparent);
}
.garantia-foto-upload {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px dashed color-mix(in srgb, var(--ds-color-border) 80%, transparent);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.garantia-foto-upload:hover {
  border-bottom-color: var(--ds-color-primary, var(--brand-primary));
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 4%, transparent);
}
.garantia-section--actions {
  padding-top: 1.5rem;
}
.garantia-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.garantia-produtos-resumo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: end;
}
.garantia-produtos-resumo strong {
  display: block;
  color: var(--ds-color-text);
  font-size: 1.2rem;
  font-weight: 800;
}
.garantia-produto-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.garantia-produto-option:hover {
  background: var(--ds-color-surface-muted);
}
.garantia-produtos-lista {
  display: flex;
  flex-direction: column;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-produtos-head,
.garantia-produtos-row {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) 90px 110px 110px 90px;
  gap: 1rem;
  align-items: center;
  padding: 0.875rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-produtos-head {
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.garantia-produtos-qtd {
  min-height: 2.2rem;
  padding-right: 0;
  padding-left: 0.25rem;
}
.garantia-empty-state {
  color: var(--ds-color-text-soft);
  font-size: 0.92rem;
}
.garantia-link {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--ds-color-primary, var(--brand-primary));
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.garantia-link.danger {
  color: #b42318;
}
.garantia-resumo-financeiro {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-resumo-financeiro strong {
  display: block;
  color: var(--ds-color-text);
  font-size: 1.05rem;
  font-weight: 800;
}
.garantia-cobranca-aviso {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 8%, transparent);
  color: var(--ds-color-primary, var(--brand-primary));
  font-size: 0.85rem;
  line-height: 1.4;
}
.garantia-cobranca-aviso i {
  flex-shrink: 0;
  font-size: 1rem;
}
.ds-label {
  display: block;
  margin-bottom: 0.375rem;
  color: var(--ds-color-text-muted, var(--ds-color-text-soft));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ds-input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.ds-input::placeholder {
  color: color-mix(in srgb, var(--ds-color-text-soft) 50%, transparent);
}
.ds-input:focus {
  border-color: var(--ds-color-primary, var(--brand-primary));
  box-shadow: inset 0 -1px 0 0 var(--ds-color-primary, var(--brand-primary));
}
textarea.ds-input {
  min-height: 100px;
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  resize: vertical;
}
@media (min-width: 768px) {
  .garantia-grid--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .garantia-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .garantia-fotos-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 767px) {
  .garantia-page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .garantia-page-header__actions {
    justify-content: flex-start;
  }
  .garantia-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .garantia-produtos-resumo,
  .garantia-produtos-head,
  .garantia-produtos-row,
  .garantia-resumo-financeiro {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
