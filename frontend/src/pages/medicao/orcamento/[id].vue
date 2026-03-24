<template>
  <PageShell :padded="false">
    <section class="med-orc-page ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Medição para Orçamento"
        :subtitle="clienteNome || 'Registre os ambientes e paredes'"
        icon="pi pi-ruler"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push(backTo)">
            <i class="pi pi-arrow-left mr-2 text-xs" />
            {{ backLabel }}
          </Button>
        </template>
      </PageHeader>

      <div class="med-orc-page__body ds-page-context__content">
        <div v-if="erroCarregamento" class="med-orc-page__state ds-alert ds-alert--danger">
          <p class="med-orc-page__state-title">{{ erroCarregamento }}</p>
          <router-link :to="backTo" class="med-orc-page__state-link">{{ backLabel }}</router-link>
        </div>

        <Loading v-else-if="loading" />

        <template v-else>
          <div class="med-orc-page__workspace">
            <!-- Sidebar de ambientes -->
            <aside class="med-orc-page__rail ds-shell-card">
              <div class="med-orc-page__rail-header">
                <p class="ds-kicker">Ambientes</p>
                <span class="med-orc-page__rail-count">{{ ambientes.length }}</span>
              </div>

              <!-- Aviso de modo restrito -->
              <div v-if="modoRestrito" class="med-orc-page__rail-locked">
                <i class="pi pi-lock text-[10px]" />
                <span>Ambientes definidos pelo vendedor. Preencha apenas as medidas.</span>
              </div>

              <!-- Adicionar ambiente (só no modo livre) -->
              <div v-else class="med-orc-page__rail-add">
                <input
                  v-model="novoAmbiente.nome_ambiente"
                  type="text"
                  class="med-orc-page__rail-input"
                  placeholder="Ex: Cozinha"
                  :disabled="salvandoNovo"
                  @keyup.enter="adicionarAmbiente"
                />
                <button
                  type="button"
                  class="med-orc-page__rail-add-btn"
                  title="Adicionar ambiente"
                  :disabled="salvandoNovo"
                  @click="adicionarAmbiente"
                >
                  <i v-if="salvandoNovo" class="pi pi-spin pi-spinner text-[10px]" />
                  <i v-else class="pi pi-plus text-[10px]" />
                </button>
              </div>

              <div v-if="!ambientes.length" class="med-orc-page__rail-empty">
                <p>Nenhum ambiente. Adicione um acima.</p>
              </div>

              <div v-else class="med-orc-page__rail-list">
                <div
                  v-for="(amb, idx) in ambientes"
                  :key="amb.uid"
                  class="med-orc-page__rail-card"
                  :class="{
                    'med-orc-page__rail-card--active': idx === ambienteAtivo,
                    'med-orc-page__rail-card--salvo': !!amb.id,
                  }"
                >
                  <button
                    type="button"
                    class="med-orc-page__rail-item"
                    :class="{ 'med-orc-page__rail-item--active': idx === ambienteAtivo }"
                    @click="ambienteAtivo = idx; paredeAtiva = -1"
                  >
                    <span class="med-orc-page__rail-item-name">{{ amb.nome_ambiente || `Ambiente ${idx + 1}` }}</span>
                    <div class="med-orc-page__rail-item-right">
                      <span class="med-orc-page__rail-item-meta">{{ amb.paredes.length }} parede(s)</span>
                      <span v-if="ambientePendente(amb)" class="med-orc-page__rail-item-dot" title="Medidas não salvas" />
                    </div>
                  </button>

                  <div v-if="amb.paredes.length" class="med-orc-page__rail-sublinks">
                    <button
                      v-for="(parede, pIdx) in amb.paredes"
                      :key="parede.uid"
                      type="button"
                      class="med-orc-page__rail-sublink"
                      :class="{ 'med-orc-page__rail-sublink--active': idx === ambienteAtivo && pIdx === paredeAtiva }"
                      @click="ambienteAtivo = idx; paredeAtiva = idx === ambienteAtivo && paredeAtiva === pIdx ? -1 : pIdx"
                    >
                      <i class="pi pi-arrows-alt text-[9px]" />
                      <span class="med-orc-page__rail-sublink-name">{{ parede.nome || `Parede ${pIdx + 1}` }}</span>
                      <span v-if="parede.largura_mm" class="med-orc-page__rail-sublink-dim">{{ parede.largura_mm }}mm</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <!-- Editor do ambiente ativo -->
            <div class="med-orc-page__detail">
              <div v-if="!ambientes.length" class="med-orc-page__detail-empty ds-shell-card">
                <p class="ds-section-title ds-section-title--sm">Nenhum ambiente cadastrado.</p>
                <p class="ds-section-copy">Adicione um ambiente na lista ao lado para começar.</p>
              </div>

              <article v-else-if="ambienteAtual" class="med-orc-page__editor ds-shell-card">
                <div class="med-orc-page__editor-head">
                  <div>
                    <p class="ds-kicker">Ambiente {{ ambienteAtivo + 1 }}</p>
                    <input
                      v-model="ambienteAtual.nome_ambiente"
                      type="text"
                      class="med-orc-page__name-input"
                      :class="{ 'med-orc-page__name-input--readonly': modoRestrito }"
                      :readonly="modoRestrito"
                      placeholder="Nome do ambiente"
                    />
                  </div>
                  <div class="ds-inline-row">
                    <span v-if="ambienteAtual.id" class="ds-inline-status">Salvo</span>
                    <Button
                      v-if="!modoRestrito"
                      type="button"
                      variant="ghost"
                      class="!rounded-xl !text-rose-600"
                      @click="removerAmbiente(ambienteAtual, ambienteAtivo)"
                    >
                      <i class="pi pi-trash" />
                    </Button>
                  </div>
                </div>

                <Input
                  v-model="ambienteAtual.observacoes"
                  type="text"
                  label="Observações do ambiente"
                  placeholder="Pontos hidráulicos, interferências, notas gerais..."
                />

                <!-- Paredes -->
                <div class="med-orc-page__paredes-section">
                  <div class="med-orc-page__paredes-header">
                    <p class="ds-kicker">Paredes</p>
                    <Button type="button" variant="ghost" size="sm" class="!rounded-xl" @click="adicionarParede(ambienteAtual)">
                      <i class="pi pi-plus mr-1 text-[10px]" />
                      Parede
                    </Button>
                  </div>

                  <div v-if="!ambienteAtual.paredes.length" class="med-orc-page__paredes-empty">
                    <p class="ds-section-copy">Nenhuma parede. Clique em "+ Parede" para adicionar.</p>
                  </div>

                  <div v-else-if="paredeAtiva >= 0 && ambienteAtual.paredes[paredeAtiva]" class="med-orc-page__parede">
                    <div class="med-orc-page__parede-head">
                      <input
                        v-model="ambienteAtual.paredes[paredeAtiva].nome"
                        type="text"
                        class="med-orc-page__parede-name"
                        :placeholder="`Parede ${paredeAtiva + 1}. Ex: Parede Pia`"
                      />
                      <button
                        type="button"
                        class="med-orc-page__parede-remove"
                        title="Remover parede"
                        @click="removerParede(ambienteAtual, paredeAtiva)"
                      >
                        <i class="pi pi-times text-[10px]" />
                      </button>
                    </div>

                    <div class="med-orc-page__parede-grid">
                      <Input
                        v-model="ambienteAtual.paredes[paredeAtiva].largura_mm"
                        type="number"
                        inputmode="numeric"
                        step="1"
                        min="0"
                        label="Largura (mm)"
                        placeholder="Ex: 3200"
                        :force-upper="false"
                      />
                      <Input
                        v-model="ambienteAtual.paredes[paredeAtiva].pe_direito_mm"
                        type="number"
                        inputmode="numeric"
                        step="1"
                        min="0"
                        label="Pé-direito (mm)"
                        placeholder="Ex: 2700"
                        :force-upper="false"
                      />
                      <Input
                        v-model="ambienteAtual.paredes[paredeAtiva].profundidade_mm"
                        type="number"
                        inputmode="numeric"
                        step="1"
                        min="0"
                        label="Profundidade (mm)"
                        placeholder="Ex: 600"
                        :force-upper="false"
                      />
                    </div>

                    <Input
                      v-model="ambienteAtual.paredes[paredeAtiva].observacoes"
                      type="text"
                      label="Detalhamento"
                      placeholder="Tomada à esquerda, janela central, tubulação de água..."
                    />

                    <!-- Fotos da parede -->
                    <div class="med-orc-page__parede-fotos">
                      <div class="med-orc-page__parede-fotos-head">
                        <p class="med-orc-page__parede-fotos-title">Fotos da parede</p>
                        <span v-if="carregandoFotos" class="med-orc-page__parede-fotos-loading">Carregando...</span>
                      </div>
                      <div class="med-orc-page__parede-fotos-grid">
                        <div
                          v-for="foto in fotosDaParede(ambienteAtual, paredeAtiva)"
                          :key="foto.id"
                          class="med-orc-page__parede-foto-item group"
                        >
                          <button
                            type="button"
                            class="med-orc-page__parede-foto-open"
                            title="Abrir foto"
                            @click="abrirFoto(foto)"
                          >
                            <img
                              :src="previewFoto(foto)"
                              alt="Foto da parede"
                              class="med-orc-page__parede-foto-img"
                              @error="($event.target).style.display = 'none'"
                            />
                          </button>
                          <button
                            type="button"
                            class="med-orc-page__parede-foto-remove"
                            title="Remover foto"
                            @click.stop="removerFoto(ambienteAtual, foto)"
                          >
                            ×
                          </button>
                        </div>

                        <div class="med-orc-page__parede-fotos-actions">
                          <label class="med-orc-page__parede-foto-add">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              class="hidden"
                              @change="onFotoSelect($event, ambienteAtual, ambienteAtual.paredes[paredeAtiva], paredeAtiva)"
                            />
                            <i class="pi pi-camera text-sm" />
                            <span>Tirar foto</span>
                          </label>
                          <label class="med-orc-page__parede-foto-add med-orc-page__parede-foto-add--gallery">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onFotoSelect($event, ambienteAtual, ambienteAtual.paredes[paredeAtiva], paredeAtiva)"
                            />
                            <i class="pi pi-images text-sm" />
                            <span>Galeria</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="med-orc-page__paredes-empty">
                    <p class="ds-section-copy">Selecione uma parede na lista ao lado para editar.</p>
                  </div>
                </div>

                <div class="med-orc-page__editor-actions">
                  <p
                    v-if="ambienteAtual.feedback"
                    class="ds-supporting-copy"
                    :class="ambienteAtual.feedbackErro ? 'ds-supporting-copy--danger' : 'ds-supporting-copy--success'"
                  >
                    {{ ambienteAtual.feedback }}
                  </p>
                  <Button
                    type="button"
                    :loading="ambienteAtual.salvando"
                    :disabled="ambienteAtual.salvando"
                    @click="salvarAmbiente(ambienteAtual)"
                  >
                    <i v-if="!ambienteAtual.salvando" class="pi pi-save mr-2 text-xs" />
                    {{ ambienteAtual.salvando ? 'Salvando...' : 'Salvar alterações' }}
                  </Button>
                </div>
              </article>
            </div>
          </div>

          <!-- Rodapé: concluir medição -->
          <div class="med-orc-page__footer ds-shell-card">
            <div>
              <p class="ds-kicker">Medição completa?</p>
              <p class="ds-section-copy">
                <span v-if="totalPendentes > 0">
                  <i class="pi pi-info-circle mr-1" style="color: var(--ds-color-warning);" />
                  {{ totalPendentes }} ambiente(s) com medidas não salvas — serão salvos automaticamente ao concluir.
                </span>
                <span v-else>Ao concluir, a tarefa será marcada como finalizada e o vendedor poderá gerar o orçamento.</span>
              </p>
            </div>
            <Button
              variant="primary"
              class="!rounded-xl"
              :loading="concluindo"
              :disabled="concluindo || !ambientes.length"
              @click="concluir"
            >
              <i v-if="!concluindo" class="pi pi-check mr-2" />
              {{ concluindo ? 'Salvando e concluindo...' : 'Concluir Medição' }}
            </Button>
          </div>
        </template>
      </div>

      <!-- Lightbox de foto -->
      <div
        v-if="fotoFullscreenAberta && fotoFullscreenSrc"
        class="med-orc-page__lightbox"
        role="dialog"
        aria-modal="true"
        @click="fecharFoto"
      >
        <button
          type="button"
          class="med-orc-page__lightbox-close"
          @click.stop="fecharFoto"
        >
          <i class="pi pi-times" />
        </button>
        <img
          :src="fotoFullscreenSrc"
          alt="Foto da parede"
          class="med-orc-page__lightbox-img"
          @click.stop
        />
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import Loading from '@/components/common/Loading.vue'
import { TotemFabricaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()
const router = useRouter()

const agendaLojaId = computed(() =>
  Number(String(route.params?.id || '').replace(/\D/g, '')) || null,
)
const clienteNome = computed(() => String(route.query?.clienteNome || '').trim())
const backTo = computed(() => String(route.query?.back || '').trim() || '/totem-fabrica')
const backLabel = computed(() => String(route.query?.backLabel || '').trim() || 'Voltar ao Totem')

const loading = ref(true)
const erroCarregamento = ref('')
const ambientes = ref([])
const novoAmbiente = ref({ nome_ambiente: '' })
const salvandoNovo = ref(false)
const ambienteAtivo = ref(0)
const paredeAtiva = ref(-1)
const concluindo = ref(false)
const fotosPorCategoria = ref({})
const previewFotos = ref({})
const carregandoFotos = ref(false)
const fotoFullscreenAberta = ref(false)
const fotoFullscreenSrc = ref('')

const ambienteAtual = computed(() => ambientes.value[ambienteAtivo.value] ?? null)

// Modo restrito: se há ambientes pré-cadastrados pelo vendedor, técnico só preenche medidas
const modoRestrito = computed(() => ambientes.value.some((a) => !!a.id))

// Pendente = tem parede nova (sem id) com ao menos uma medida, ou o próprio ambiente ainda não foi persistido
function ambientePendente(amb) {
  if (amb.salvando) return false
  // Ambiente sem id = nunca foi salvo
  if (!amb.id) return true
  // Parede sem id = foi adicionada localmente mas não salva ainda
  return amb.paredes?.some(
    (p) => !p.id && (p.largura_mm || p.pe_direito_mm || p.profundidade_mm || p.nome),
  ) ?? false
}
const totalPendentes = computed(() => ambientes.value.filter(ambientePendente).length)

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mToMm(val) {
  const n = parseFloat(val)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : null
}

function mmToM(val) {
  const n = parseFloat(val)
  return Number.isFinite(n) && n > 0 ? n / 1000 : null
}

function criarParedeLocal(base = {}) {
  return {
    uid: uid(),
    id: base.id ?? null,
    nome: base.nome || '',
    largura_mm: base.largura_m != null ? mToMm(base.largura_m) : (base.largura_mm ?? null),
    pe_direito_mm: base.pe_direito_m != null ? mToMm(base.pe_direito_m) : (base.pe_direito_mm ?? null),
    profundidade_mm: base.profundidade_m != null ? mToMm(base.profundidade_m) : (base.profundidade_mm ?? null),
    observacoes: base.observacoes || '',
    foto_key: base.foto_key || `W${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
  }
}

function criarAmbienteLocal(base = {}) {
  return {
    uid: `${base.id || 'novo'}-${uid()}`,
    id: base.id ?? null,
    nome_ambiente: base.nome_ambiente || '',
    largura_m: base.largura_m ?? null,
    pe_direito_m: base.pe_direito_m ?? null,
    profundidade_m: base.profundidade_m ?? null,
    observacoes: base.observacoes || '',
    paredes: Array.isArray(base.paredes)
      ? base.paredes.map((p) => criarParedeLocal(p))
      : [],
    salvando: false,
    feedback: '',
    feedbackErro: false,
  }
}

function categoriaParede(parede, index) {
  const raw = String(parede?.foto_key || `P${index + 1}`).trim().toUpperCase()
  return `PAREDE_${raw.replace(/[^A-Z0-9_]/g, '_')}`
}

function fotosDaParede(ambiente, index) {
  const categoria = categoriaParede(ambiente?.paredes?.[index], index)
  return fotosPorCategoria.value[categoria] || []
}

function previewFoto(arquivo) {
  return arquivo?.id ? (previewFotos.value[arquivo.id] || '') : ''
}

function abrirFoto(arquivo) {
  const src = previewFoto(arquivo)
  if (!src) return
  fotoFullscreenSrc.value = src
  fotoFullscreenAberta.value = true
}

function fecharFoto() {
  fotoFullscreenAberta.value = false
  fotoFullscreenSrc.value = ''
}

function onTeclaGlobal(event) {
  if (event?.key === 'Escape' && fotoFullscreenAberta.value) fecharFoto()
}

async function garantirPreviewFoto(arquivo) {
  if (!arquivo?.id || previewFotos.value[arquivo.id]) return
  try {
    const res = await ArquivosService.baixarBlob(arquivo.id)
    const blob = res?.data
    if (blob) {
      previewFotos.value = { ...previewFotos.value, [arquivo.id]: URL.createObjectURL(blob) }
    }
  } catch {}
}

async function carregarFotosAmbiente(ambiente) {
  if (!ambiente?.id) {
    fotosPorCategoria.value = {}
    return
  }
  carregandoFotos.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'MEDICAO_ORCAMENTO_AMBIENTE',
      ownerId: ambiente.id,
    })
    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    const agrupado = {}
    for (const arquivo of list) {
      const categoria = String(arquivo?.categoria || '').toUpperCase()
      if (!categoria.startsWith('PAREDE_')) continue
      if (!agrupado[categoria]) agrupado[categoria] = []
      agrupado[categoria].push(arquivo)
      garantirPreviewFoto(arquivo)
    }
    fotosPorCategoria.value = agrupado
  } catch {
    fotosPorCategoria.value = {}
  } finally {
    carregandoFotos.value = false
  }
}

async function onFotoSelect(event, ambiente, parede, index) {
  const file = event?.target?.files?.[0]
  if (event?.target) event.target.value = ''
  if (!file) return
  if (!ambiente?.id) {
    notify.info('Salve o ambiente antes de adicionar fotos.')
    return
  }
  try {
    await ArquivosService.upload({
      ownerType: 'MEDICAO_ORCAMENTO_AMBIENTE',
      ownerId: ambiente.id,
      file,
      categoria: categoriaParede(parede, index),
    })
    await carregarFotosAmbiente(ambiente)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível enviar a foto.')
  }
}

async function removerFoto(ambiente, arquivo) {
  if (!arquivo?.id) return
  try {
    await ArquivosService.remover(arquivo.id)
    await carregarFotosAmbiente(ambiente)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível remover a foto.')
  }
}

function adicionarParede(ambiente) {
  ambiente.paredes.push(criarParedeLocal())
  paredeAtiva.value = ambiente.paredes.length - 1
}

async function removerParede(ambiente, index) {
  const parede = ambiente.paredes[index]
  if (parede?.id) {
    try {
      await TotemFabricaService.removerParedeMedicao(ambiente.id, parede.id)
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Não foi possível remover a parede.')
      return
    }
  }
  ambiente.paredes.splice(index, 1)
  if (paredeAtiva.value >= ambiente.paredes.length)
    paredeAtiva.value = Math.max(-1, ambiente.paredes.length - 1)
}

async function carregar() {
  if (!agendaLojaId.value) {
    erroCarregamento.value = 'ID da tarefa não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const res = await TotemFabricaService.getMedicaoOrcamento(agendaLojaId.value)
    const data = res?.data ?? res ?? {}
    ambientes.value = Array.isArray(data?.ambientes)
      ? data.ambientes.map((a) => criarAmbienteLocal(a))
      : []
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a medição.'
  } finally {
    loading.value = false
  }
}

async function adicionarAmbiente() {
  const nome = String(novoAmbiente.value.nome_ambiente || '').trim()
  if (!nome) return
  salvandoNovo.value = true
  try {
    const res = await TotemFabricaService.salvarAmbienteMedicao(agendaLojaId.value, { nome_ambiente: nome })
    const data = res?.data ?? res ?? {}
    await carregar()
    const idx = ambientes.value.findIndex((a) => a.nome_ambiente === nome)
    ambienteAtivo.value = idx >= 0 ? idx : ambientes.value.length - 1
    novoAmbiente.value.nome_ambiente = ''
    notify.success(`Ambiente "${nome}" criado.`)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível criar o ambiente.')
  } finally {
    salvandoNovo.value = false
  }
}

async function salvarAmbiente(ambiente) {
  const nome = String(ambiente.nome_ambiente || '').trim()
  if (!nome) {
    ambiente.feedback = 'Informe um nome para o ambiente.'
    ambiente.feedbackErro = true
    return
  }
  ambiente.salvando = true
  ambiente.feedback = ''
  ambiente.feedbackErro = false
  try {
    // Se o ambiente não tem medidas próprias mas tem paredes preenchidas,
    // usa as medidas da primeira parede com valores para satisfazer a validação do backend
    let largura_m = ambiente.largura_m != null && ambiente.largura_m !== '' ? Number(ambiente.largura_m) : undefined
    let pe_direito_m = ambiente.pe_direito_m != null && ambiente.pe_direito_m !== '' ? Number(ambiente.pe_direito_m) : undefined
    let profundidade_m = ambiente.profundidade_m != null && ambiente.profundidade_m !== '' ? Number(ambiente.profundidade_m) : undefined

    if (largura_m == null && pe_direito_m == null && profundidade_m == null) {
      const primeiraComMedida = ambiente.paredes?.find(
        (p) => p.largura_mm || p.pe_direito_mm || p.profundidade_mm,
      )
      if (primeiraComMedida) {
        largura_m     = mmToM(primeiraComMedida.largura_mm)     ?? undefined
        pe_direito_m  = mmToM(primeiraComMedida.pe_direito_mm)  ?? undefined
        profundidade_m = mmToM(primeiraComMedida.profundidade_mm) ?? undefined
      }
    }

    // Salva o ambiente principal (cria se não existir, via upsert por nome)
    const ambRes = await TotemFabricaService.salvarAmbienteMedicao(agendaLojaId.value, {
      nome_ambiente: nome,
      largura_m,
      pe_direito_m,
      profundidade_m,
      observacoes: String(ambiente.observacoes || '').trim() || undefined,
    })

    // Obter o ambienteId persistido (pode ser novo ou existente)
    const ambienteId = Number(ambRes?.data?.ambiente?.id || ambRes?.data?.id || ambiente.id || 0) || null

    // Salva cada parede individualmente (converte mm → m para a API)
    if (ambienteId && ambiente.paredes.length) {
      for (const parede of ambiente.paredes) {
        if (!String(parede.nome || '').trim()) continue
        const body = {
          nome: String(parede.nome).trim(),
          largura_m: mmToM(parede.largura_mm) ?? undefined,
          pe_direito_m: mmToM(parede.pe_direito_mm) ?? undefined,
          profundidade_m: mmToM(parede.profundidade_mm) ?? undefined,
          observacoes: String(parede.observacoes || '').trim() || undefined,
          agenda_loja_id: agendaLojaId.value,
          nome_ambiente: nome,
          ...(parede.id ? { parede_id: parede.id } : {}),
        }
        await TotemFabricaService.salvarParedeMedicao(ambienteId, body)
      }
    }

    await carregar()
    const idx = ambientes.value.findIndex((a) => a.nome_ambiente === nome)
    if (idx >= 0) ambienteAtivo.value = idx
    notify.success('Ambiente salvo.')
  } catch (e) {
    ambiente.feedback = e?.response?.data?.message || 'Não foi possível salvar o ambiente.'
    ambiente.feedbackErro = true
  } finally {
    ambiente.salvando = false
  }
}

async function removerAmbiente(ambiente, index) {
  if (!ambiente?.id) {
    ambientes.value.splice(index, 1)
    if (ambienteAtivo.value >= ambientes.value.length)
      ambienteAtivo.value = Math.max(0, ambientes.value.length - 1)
    return
  }
  try {
    await TotemFabricaService.removerAmbienteMedicao(agendaLojaId.value, ambiente.id)
    ambientes.value.splice(index, 1)
    if (ambienteAtivo.value >= ambientes.value.length)
      ambienteAtivo.value = Math.max(0, ambientes.value.length - 1)
    notify.success('Ambiente removido.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível remover o ambiente.')
  }
}

async function concluir() {
  if (!ambientes.value.length) {
    notify.error('Adicione ao menos um ambiente antes de concluir.')
    return
  }
  concluindo.value = true
  try {
    // Salva automaticamente todos os ambientes que tenham paredes com medidas preenchidas
    // (mesmo que o ambiente já tenha id — o backend valida os campos do próprio ambiente)
    for (const amb of ambientes.value) {
      const temMedida = amb.paredes?.some(
        (p) => p.largura_mm || p.pe_direito_mm || p.profundidade_mm,
      )
      if (temMedida) {
        await salvarAmbiente(amb)
      }
    }
    await TotemFabricaService.concluirMedicaoOrcamento(agendaLojaId.value)
    notify.success('Medição concluída! O vendedor pode gerar o orçamento.')
    setTimeout(() => router.push(backTo.value), 700)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível concluir a medição.')
  } finally {
    concluindo.value = false
  }
}

onMounted(() => {
  carregar()
  window.addEventListener('keydown', onTeclaGlobal)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onTeclaGlobal)
})

watch(ambienteAtual, (amb) => {
  carregarFotosAmbiente(amb)
}, { immediate: true })
</script>

<style scoped>
.med-orc-page__body {
  padding-bottom: 1.25rem;
}

.med-orc-page__workspace {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0.85rem;
  align-items: start;
}

.med-orc-page__rail {
  padding: 0.75rem;
  position: sticky;
  top: 1rem;
}

.med-orc-page__rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.med-orc-page__rail-count {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: var(--ds-radius-full);
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
}

.med-orc-page__rail-locked {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: var(--ds-radius-md);
  background: color-mix(in srgb, var(--ds-color-warning, #f59e0b) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--ds-color-warning, #f59e0b) 28%, transparent);
  font-size: 0.7rem;
  color: color-mix(in srgb, var(--ds-color-warning, #f59e0b) 85%, #000);
  line-height: 1.35;
}

.med-orc-page__rail-add {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
}

.med-orc-page__rail-input {
  flex: 1;
  min-width: 0;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-text) 15%, transparent);
  padding: 0.3rem 0;
  background: transparent;
  font-size: 0.78rem;
  color: var(--ds-color-text);
}

.med-orc-page__rail-input:focus {
  outline: none;
  border-bottom-color: var(--ds-color-primary);
}

.med-orc-page__rail-input::placeholder {
  color: color-mix(in srgb, var(--ds-color-text) 35%, transparent);
}

.med-orc-page__rail-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
  border: 0;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-primary);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}

.med-orc-page__rail-add-btn:hover { opacity: 0.85; }

.med-orc-page__rail-empty {
  text-align: center;
  padding: 0.75rem 0;
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--ds-color-text) 45%, transparent);
}

.med-orc-page__rail-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.med-orc-page__rail-card {
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  background: transparent;
  transition: background 0.12s, border-color 0.12s;
}

.med-orc-page__rail-card:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.med-orc-page__rail-card--active {
  background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--ds-color-primary) 25%, transparent);
}

.med-orc-page__rail-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  padding: 0.45rem 0.6rem;
  min-height: 44px;
  border: 0;
  border-radius: var(--ds-radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.med-orc-page__rail-card--salvo .med-orc-page__rail-item-name::after {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ds-color-success);
  margin-left: 0.35rem;
  vertical-align: middle;
}

.med-orc-page__rail-item-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ds-color-text);
  letter-spacing: -0.02em;
}

.med-orc-page__rail-item-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.med-orc-page__rail-item-meta {
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--ds-color-text) 45%, transparent);
}

.med-orc-page__rail-item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  animation: dot-pulse 1.8s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.med-orc-page__rail-sublinks {
  position: relative;
  margin: 0.05rem 0 0.35rem;
  margin-left: 0.45rem;
  padding-left: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.med-orc-page__rail-sublinks::before {
  content: '';
  position: absolute;
  left: 0.15rem;
  top: 0.18rem;
  bottom: 0.2rem;
  width: 1px;
  background: color-mix(in srgb, var(--ds-color-border) 42%, transparent);
  opacity: 0.55;
}

.med-orc-page__rail-sublink {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--ds-color-text) 68%, transparent);
  padding: 0.18rem 0.35rem;
  min-height: 44px;
  border-radius: var(--ds-radius-sm);
  font-size: 0.69rem;
  text-align: left;
  cursor: pointer;
}

.med-orc-page__rail-sublink:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 6%, transparent);
  color: var(--ds-color-text);
}

.med-orc-page__rail-sublink--active {
  background: color-mix(in srgb, var(--ds-color-primary) 10%, transparent);
  color: var(--ds-color-primary);
}

.med-orc-page__rail-sublink-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.med-orc-page__rail-sublink-dim {
  color: color-mix(in srgb, var(--ds-color-text) 42%, transparent);
  font-size: 0.64rem;
}

.med-orc-page__detail-empty {
  padding: 2rem;
  text-align: center;
}

.med-orc-page__editor {
  padding: 1rem;
}

.med-orc-page__editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.med-orc-page__name-input {
  width: min(100%, 22rem);
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.med-orc-page__name-input:focus { outline: none; }

.med-orc-page__name-input--readonly {
  cursor: default;
  color: var(--ds-color-text-soft);
  pointer-events: none;
}

.med-orc-page__paredes-section {
  margin-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-text) 8%, transparent);
  padding-top: 0.85rem;
}

.med-orc-page__paredes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.med-orc-page__paredes-empty {
  padding: 0.75rem 0;
  text-align: center;
}

.med-orc-page__parede {
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  border-radius: var(--ds-radius-lg);
  padding: 0.75rem;
  margin-bottom: 0.6rem;
  background: color-mix(in srgb, var(--ds-color-primary) 2%, transparent);
}

.med-orc-page__parede-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.med-orc-page__parede-name {
  flex: 1;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.med-orc-page__parede-name:focus { outline: none; }

.med-orc-page__parede-name::placeholder {
  color: color-mix(in srgb, var(--ds-color-text) 35%, transparent);
}

.med-orc-page__parede-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--ds-color-danger) 10%, transparent);
  color: var(--ds-color-danger);
  cursor: pointer;
  transition: background 0.15s;
}

.med-orc-page__parede-remove:hover {
  background: color-mix(in srgb, var(--ds-color-danger) 20%, transparent);
}

.med-orc-page__parede-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.med-orc-page__parede-fotos {
  margin-top: 0.75rem;
  border-top: 1px dashed color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  padding-top: 0.65rem;
}

.med-orc-page__parede-fotos-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.med-orc-page__parede-fotos-title {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--ds-color-text-soft);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.med-orc-page__parede-fotos-loading {
  font-size: 0.7rem;
  color: var(--ds-color-text-faint);
}

.med-orc-page__parede-fotos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.med-orc-page__parede-fotos-actions {
  display: contents;
}

.med-orc-page__parede-foto-item {
  position: relative;
}

.med-orc-page__parede-foto-open {
  border: 0;
  padding: 0;
  background: transparent;
  border-radius: 0.5rem;
  cursor: zoom-in;
}

.med-orc-page__parede-foto-img {
  width: 4.2rem;
  height: 4.2rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 82%, transparent);
  background: var(--ds-color-surface-muted);
}

.med-orc-page__parede-foto-remove {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1.15rem;
  height: 1.15rem;
  border: 0;
  border-radius: 999px;
  background: var(--ds-color-danger);
  color: #fff;
  font-size: 0.72rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.group:hover .med-orc-page__parede-foto-remove {
  opacity: 1;
}

.med-orc-page__parede-foto-add {
  width: 4.2rem;
  height: 4.2rem;
  border: 2px dashed color-mix(in srgb, var(--ds-color-border) 86%, transparent);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  cursor: pointer;
}

.med-orc-page__parede-foto-add:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 55%, transparent);
  color: var(--ds-color-primary);
}

.med-orc-page__parede-foto-add--gallery {
  border-style: solid;
  border-width: 1px;
}

.med-orc-page__parede-foto-add--gallery:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 35%, transparent);
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.med-orc-page__editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.med-orc-page__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
  padding: 1rem 1.25rem;
  border-top: 2px solid color-mix(in srgb, var(--ds-color-success) 20%, transparent);
}

.med-orc-page__state {
  text-align: center;
}

.med-orc-page__state-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.med-orc-page__lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: color-mix(in srgb, #000 72%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.med-orc-page__lightbox-img {
  max-width: min(96vw, 1080px);
  max-height: 92vh;
  border-radius: 0.65rem;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
  object-fit: contain;
}

.med-orc-page__lightbox-close {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  width: 2.2rem;
  height: 2.2rem;
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: color-mix(in srgb, #000 40%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

@media (max-width: 768px) {
  .med-orc-page__workspace {
    grid-template-columns: 1fr;
  }

  .med-orc-page__rail {
    position: static;
  }

  .med-orc-page__parede-grid {
    grid-template-columns: 1fr;
  }

  .med-orc-page__editor {
    padding: 0.9rem;
  }

  .med-orc-page__editor-head {
    flex-direction: column;
  }

  .med-orc-page__parede-fotos-actions {
    display: flex;
    flex-basis: 100%;
    width: 100%;
    gap: 0.35rem;
  }

  .med-orc-page__parede-foto-add {
    width: auto;
    min-height: 44px;
    height: auto;
    flex: 1 1 0;
    flex-direction: row;
    gap: 0.35rem;
    padding: 0 0.45rem;
    font-size: 0.58rem;
    touch-action: manipulation;
  }

  .med-orc-page__parede-foto-remove {
    opacity: 1;
    width: 1.35rem;
    height: 1.35rem;
    font-size: 0.8rem;
    touch-action: manipulation;
  }

  .med-orc-page__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .med-orc-page__lightbox {
    padding: 0.6rem;
  }

  .med-orc-page__lightbox-img {
    max-width: 100%;
    max-height: 88vh;
  }
}
</style>
