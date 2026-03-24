<template>
  <PageShell :padded="false">
    <section class="pre-medicao-page ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Pré-medição administrativa"
        :subtitle="pageSubtitle"
        icon="pi pi-ruler"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push(backTo)">
            <i class="pi pi-arrow-left mr-2 text-xs" />
            {{ backLabel }}
          </Button>
        </template>
      </PageHeader>

      <div class="pre-medicao-page__body ds-page-context__content">
        <div v-if="erroCarregamento" class="ds-alert ds-alert--danger pre-medicao-page__state">
          <p class="pre-medicao-page__state-title">{{ erroCarregamento }}</p>
        </div>

        <Loading v-else-if="loading" />

        <template v-else>
          <div class="pre-medicao-page__workspace">
            <!-- Coluna esquerda: lista de ambientes -->
            <aside class="pre-medicao-page__rail ds-shell-card">
              <div class="pre-medicao-page__rail-header">
                <p class="ds-kicker">Ambientes</p>
                <span class="pre-medicao-page__rail-count">{{ ambientes.length }}</span>
              </div>

              <div class="pre-medicao-page__rail-add">
                <input
                  v-model="novoAmbiente.nome_ambiente"
                  type="text"
                  class="pre-medicao-page__rail-input"
                  placeholder="Ex: Cozinha"
                  :disabled="salvandoNovo"
                  @keyup.enter="adicionarAmbiente"
                />
                <button type="button" class="pre-medicao-page__rail-add-btn" title="Adicionar" :disabled="salvandoNovo" @click="adicionarAmbiente">
                  <i v-if="salvandoNovo" class="pi pi-spin pi-spinner text-[10px]" />
                  <i v-else class="pi pi-plus text-[10px]" />
                </button>
              </div>

              <div v-if="!ambientes.length" class="pre-medicao-page__rail-empty">
                <p>Nenhum ambiente.</p>
              </div>

              <div v-else class="pre-medicao-page__rail-list">
                <div
                  v-for="(amb, idx) in ambientes"
                  :key="amb.uid"
                  class="pre-medicao-page__rail-card"
                  :class="{
                    'pre-medicao-page__rail-card--active': idx === ambienteAtivo,
                    'pre-medicao-page__rail-card--salvo': !!amb.id,
                  }"
                >
                  <button
                    type="button"
                    class="pre-medicao-page__rail-item"
                    :class="{
                      'pre-medicao-page__rail-item--active': idx === ambienteAtivo,
                    }"
                    @click="ambienteAtivo = idx; paredeAtiva = -1"
                  >
                    <span class="pre-medicao-page__rail-item-name">{{ amb.nome_ambiente || `Ambiente ${idx + 1}` }}</span>
                    <span class="pre-medicao-page__rail-item-meta">{{ amb.paredes.length }} parede(s)</span>
                  </button>

                  <!-- Sub-links das paredes -->
                  <div v-if="amb.paredes.length" class="pre-medicao-page__rail-sublinks">
                    <button
                      v-for="(parede, pIdx) in amb.paredes"
                      :key="parede.uid"
                      type="button"
                      class="pre-medicao-page__rail-sublink"
                      :class="{ 'pre-medicao-page__rail-sublink--active': idx === ambienteAtivo && pIdx === paredeAtiva }"
                      @click="ambienteAtivo = idx; paredeAtiva = idx === ambienteAtivo && paredeAtiva === pIdx ? -1 : pIdx"
                    >
                      <i class="pi pi-arrows-alt text-[9px]" />
                      <span class="pre-medicao-page__rail-sublink-name">{{ parede.nome || `Parede ${pIdx + 1}` }}</span>
                      <span v-if="parede.largura_mm" class="pre-medicao-page__rail-sublink-dim">{{ parede.largura_mm }}mm</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <!-- Coluna direita: editor do ambiente ativo -->
            <div class="pre-medicao-page__detail">
              <div v-if="!ambientes.length" class="pre-medicao-page__detail-empty ds-shell-card">
                <p class="ds-section-title ds-section-title--sm">Nenhum ambiente cadastrado.</p>
                <p class="ds-section-copy">Adicione um ambiente na lista ao lado para começar.</p>
              </div>

              <article v-else-if="ambienteAtual" class="pre-medicao-page__editor ds-shell-card">
                <div class="pre-medicao-page__editor-head">
                  <div>
                    <p class="ds-kicker">Ambiente {{ ambienteAtivo + 1 }}</p>
                    <input
                      v-model="ambienteAtual.nome_ambiente"
                      type="text"
                      class="pre-medicao-page__name-input"
                      placeholder="Nome do ambiente"
                    />
                  </div>
                  <div class="ds-inline-row">
                    <span v-if="ambienteAtual.id" class="ds-inline-status">Salvo</span>
                    <Button type="button" variant="ghost" class="!rounded-xl !text-rose-600" @click="removerAmbiente(ambienteAtual, ambienteAtivo)">
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
                <div class="pre-medicao-page__paredes-section">
                  <div class="pre-medicao-page__paredes-header">
                    <p class="ds-kicker">Paredes</p>
                    <Button type="button" variant="ghost" size="sm" class="!rounded-xl" @click="adicionarParede(ambienteAtual)">
                      <i class="pi pi-plus mr-1 text-[10px]" />
                      Parede
                    </Button>
                  </div>

                  <div v-if="!ambienteAtual.paredes.length" class="pre-medicao-page__paredes-empty">
                    <p class="ds-section-copy">Nenhuma parede. Clique em "+ Parede" ou adicione pela lista ao lado.</p>
                  </div>

                  <!-- Editor da parede ativa -->
                  <div v-else-if="paredeAtiva >= 0 && ambienteAtual.paredes[paredeAtiva]" class="pre-medicao-page__parede">
                    <div class="pre-medicao-page__parede-head">
                      <input
                        v-model="ambienteAtual.paredes[paredeAtiva].nome"
                        type="text"
                        class="pre-medicao-page__parede-name"
                        :placeholder="`Parede ${paredeAtiva + 1}. Ex: Parede Pia`"
                      />
                      <button type="button" class="pre-medicao-page__parede-remove" title="Remover parede" @click="removerParede(ambienteAtual, paredeAtiva)">
                        <i class="pi pi-times text-[10px]" />
                      </button>
                    </div>

                    <div class="pre-medicao-page__parede-grid">
                      <Input v-model="ambienteAtual.paredes[paredeAtiva].largura_mm" type="number" step="1" min="0" label="Largura (mm)" placeholder="Ex: 3200" />
                      <Input v-model="ambienteAtual.paredes[paredeAtiva].pe_direito_mm" type="number" step="1" min="0" label="Pé-direito (mm)" placeholder="Ex: 2700" />
                      <Input v-model="ambienteAtual.paredes[paredeAtiva].profundidade_mm" type="number" step="1" min="0" label="Profundidade (mm)" placeholder="Ex: 600" />
                    </div>

                    <Input
                      v-model="ambienteAtual.paredes[paredeAtiva].detalhamento"
                      type="text"
                      label="Detalhamento"
                      placeholder="Tomada à esquerda, janela central, tubulação de água..."
                    />

                    <div class="pre-medicao-page__parede-fotos">
                      <div class="pre-medicao-page__parede-fotos-head">
                        <p class="pre-medicao-page__parede-fotos-title">Fotos da parede</p>
                        <span v-if="carregandoFotosParede" class="pre-medicao-page__parede-fotos-loading">Carregando...</span>
                      </div>

                      <div class="pre-medicao-page__parede-fotos-grid">
                        <div
                          v-for="foto in fotosDaParede(ambienteAtual, paredeAtiva)"
                          :key="foto.id"
                          class="pre-medicao-page__parede-foto-item group"
                        >
                          <button
                            type="button"
                            class="pre-medicao-page__parede-foto-open"
                            title="Abrir foto em tela cheia"
                            @click="abrirFotoFullscreen(foto)"
                          >
                            <img
                              :src="previewFotoParede(foto)"
                              alt="Foto da parede"
                              class="pre-medicao-page__parede-foto-img"
                              @error="($event.target).style.display = 'none'"
                            />
                          </button>
                          <button
                            type="button"
                            class="pre-medicao-page__parede-foto-remove"
                            title="Remover foto"
                            @click.stop="removerFotoParede(ambienteAtual, foto)"
                          >
                            ×
                          </button>
                        </div>

                        <div class="pre-medicao-page__parede-fotos-actions">
                          <label class="pre-medicao-page__parede-foto-add">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              class="hidden"
                              @change="onFotoParedeSelect($event, ambienteAtual, ambienteAtual.paredes[paredeAtiva], paredeAtiva)"
                            />
                            <i class="pi pi-camera text-sm" />
                            <span>Tirar foto</span>
                          </label>

                          <label class="pre-medicao-page__parede-foto-add pre-medicao-page__parede-foto-add--gallery">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onFotoParedeSelect($event, ambienteAtual, ambienteAtual.paredes[paredeAtiva], paredeAtiva)"
                            />
                            <i class="pi pi-images text-sm" />
                            <span>Galeria</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="pre-medicao-page__paredes-empty">
                    <p class="ds-section-copy">Selecione uma parede na lista ao lado para editar.</p>
                  </div>
                </div>

                <div class="pre-medicao-page__editor-actions">
                  <p v-if="ambienteAtual.feedback" class="ds-supporting-copy" :class="ambienteAtual.feedbackErro ? 'ds-supporting-copy--danger' : 'ds-supporting-copy--success'">
                    {{ ambienteAtual.feedback }}
                  </p>
                  <Button type="button" :loading="ambienteAtual.salvando" :disabled="ambienteAtual.salvando" @click="salvarAmbiente(ambienteAtual)">
                    <i v-if="!ambienteAtual.salvando" class="pi pi-save mr-2 text-xs" />
                    {{ ambienteAtual.salvando ? 'Salvando...' : 'Salvar alterações' }}
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </template>
      </div>
      <div
        v-if="fotoFullscreenAberta && fotoFullscreenSrc"
        class="pre-medicao-page__foto-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Visualização da foto da parede"
        @click="fecharFotoFullscreen"
      >
        <button
          type="button"
          class="pre-medicao-page__foto-lightbox-close"
          title="Fechar visualização"
          @click.stop="fecharFotoFullscreen"
        >
          <i class="pi pi-times" />
        </button>
        <img
          :src="fotoFullscreenSrc"
          alt="Foto da parede em tela cheia"
          class="pre-medicao-page__foto-lightbox-img"
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

definePage({ meta: { perm: 'agendamentos.vendas' } })

const route = useRoute()
const router = useRouter()

const preMedicaoId = computed(() => Number(String(route.params?.id || route.query?.preMedicaoId || '').replace(/\D/g, '')) || null)
const clienteNome = computed(() => String(route.query?.clienteNome || '').trim())
const backTo = computed(() => String(route.query?.back || '').trim() || '/producao/medicao-fina?etapa=pre')
const backLabel = computed(() => String(route.query?.backLabel || '').trim() || 'Voltar')
const pageSubtitle = computed(() => clienteNome.value || 'Rascunho administrativo de pré-medição')

const loading = ref(true)
const erroCarregamento = ref('')
const ambientes = ref([])
const novoAmbiente = ref({ nome_ambiente: '' })
const salvandoNovo = ref(false)
const ambienteAtivo = ref(0)
const paredeAtiva = ref(-1)
const fotosParedePorCategoria = ref({})
const previewFotosParede = ref({})
const carregandoFotosParede = ref(false)
const fotoFullscreenAberta = ref(false)
const fotoFullscreenSrc = ref('')

const ambienteAtual = computed(() => ambientes.value[ambienteAtivo.value] ?? null)

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function criarParedeLocal(base = {}) {
  const fotoKey = String(base.foto_key || '').trim() || `W${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  return {
    uid: uid(),
    foto_key: fotoKey,
    nome: base.nome || '',
    largura_mm: base.largura_mm ?? null,
    pe_direito_mm: base.pe_direito_mm ?? null,
    profundidade_mm: base.profundidade_mm ?? null,
    detalhamento: base.detalhamento || '',
  }
}

function parseMedidasJson(raw) {
  if (!raw) return []
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(obj?.paredes) ? obj.paredes.map((p) => criarParedeLocal(p)) : []
  } catch { return [] }
}

function serializarParedes(paredes) {
  const arr = (paredes || []).map((p) => ({
    foto_key: String(p.foto_key || '').trim() || null,
    nome: String(p.nome || '').trim(),
    largura_mm: p.largura_mm != null && p.largura_mm !== '' ? Number(p.largura_mm) : null,
    pe_direito_mm: p.pe_direito_mm != null && p.pe_direito_mm !== '' ? Number(p.pe_direito_mm) : null,
    profundidade_mm: p.profundidade_mm != null && p.profundidade_mm !== '' ? Number(p.profundidade_mm) : null,
    detalhamento: String(p.detalhamento || '').trim(),
  }))
  return arr.length ? JSON.stringify({ paredes: arr }) : null
}

function categoriaParede(parede, index) {
  const raw = String(parede?.foto_key || `P${index + 1}`).trim().toUpperCase()
  const safe = raw.replace(/[^A-Z0-9_]/g, '_')
  return `PAREDE_${safe}`
}

function fotosDaParede(ambiente, index) {
  const categoria = categoriaParede(ambiente?.paredes?.[index], index)
  return fotosParedePorCategoria.value[categoria] || []
}

function previewFotoParede(arquivo) {
  if (!arquivo?.id) return ''
  return previewFotosParede.value[arquivo.id] || ''
}

function abrirFotoFullscreen(arquivo) {
  const src = previewFotoParede(arquivo)
  if (!src) return
  fotoFullscreenSrc.value = src
  fotoFullscreenAberta.value = true
}

function fecharFotoFullscreen() {
  fotoFullscreenAberta.value = false
  fotoFullscreenSrc.value = ''
}

function onTeclaGlobal(event) {
  if (event?.key === 'Escape' && fotoFullscreenAberta.value) {
    fecharFotoFullscreen()
  }
}

async function garantirPreviewFotoParede(arquivo) {
  if (!arquivo?.id || previewFotosParede.value[arquivo.id]) return
  try {
    const res = await ArquivosService.baixarBlob(arquivo.id)
    const blob = res?.data
    if (blob) {
      previewFotosParede.value = {
        ...previewFotosParede.value,
        [arquivo.id]: URL.createObjectURL(blob),
      }
    }
  } catch {}
}

async function carregarFotosParedeAmbiente(ambiente) {
  if (!ambiente?.id) {
    fotosParedePorCategoria.value = {}
    return
  }
  carregandoFotosParede.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'PRE_MEDICAO_AMBIENTE',
      ownerId: ambiente.id,
    })
    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    const agrupado = {}
    for (const arquivo of list) {
      const categoria = String(arquivo?.categoria || '').toUpperCase()
      if (!categoria.startsWith('PAREDE_')) continue
      if (!agrupado[categoria]) agrupado[categoria] = []
      agrupado[categoria].push(arquivo)
      garantirPreviewFotoParede(arquivo)
    }
    fotosParedePorCategoria.value = agrupado
  } catch {
    fotosParedePorCategoria.value = {}
  } finally {
    carregandoFotosParede.value = false
  }
}

async function onFotoParedeSelect(event, ambiente, parede, index) {
  const file = event?.target?.files?.[0]
  if (event?.target) event.target.value = ''
  if (!file) return
  if (!ambiente?.id) {
    notify.info('Salve o ambiente antes de adicionar fotos na parede.')
    return
  }
  try {
    await ArquivosService.upload({
      ownerType: 'PRE_MEDICAO_AMBIENTE',
      ownerId: ambiente.id,
      file,
      categoria: categoriaParede(parede, index),
    })
    await carregarFotosParedeAmbiente(ambiente)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível enviar a foto da parede.')
  }
}

async function removerFotoParede(ambiente, arquivo) {
  if (!arquivo?.id) return
  try {
    await ArquivosService.remover(arquivo.id)
    await carregarFotosParedeAmbiente(ambiente)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível remover a foto da parede.')
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
    paredes: parseMedidasJson(base.medidas_json),
    salvando: false,
    feedback: '',
    feedbackErro: false,
  }
}

function adicionarParede(ambiente) {
  ambiente.paredes.push(criarParedeLocal())
  paredeAtiva.value = ambiente.paredes.length - 1
}

function removerParede(ambiente, index) {
  ambiente.paredes.splice(index, 1)
  if (paredeAtiva.value >= ambiente.paredes.length) paredeAtiva.value = ambiente.paredes.length - 1
  if (paredeAtiva.value < 0) paredeAtiva.value = -1
}

async function carregar() {
  if (!preMedicaoId.value) {
    erroCarregamento.value = 'Pré-medição não informada.'
    loading.value = false
    return
  }

  loading.value = true
  erroCarregamento.value = ''
  try {
    const res = await TotemFabricaService.getPreMedicao(preMedicaoId.value)
    const data = res?.data ?? res ?? {}
    ambientes.value = Array.isArray(data?.ambientes) ? data.ambientes.map((amb) => criarAmbienteLocal(amb)) : []
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a pré-medição.'
  } finally {
    loading.value = false
  }
}

async function adicionarAmbiente() {
  const nome = String(novoAmbiente.value.nome_ambiente || '').trim()
  if (!nome) return

  salvandoNovo.value = true
  try {
    const res = await TotemFabricaService.salvarAmbientePreMedicao(preMedicaoId.value, { nome_ambiente: nome })
    const data = res?.data ?? res ?? {}
    ambientes.value = Array.isArray(data?.ambientes) ? data.ambientes.map((amb) => criarAmbienteLocal(amb)) : ambientes.value
    // Seleciona o ambiente recém-criado (vem por último na lista)
    const idx = ambientes.value.findIndex((a) => a.nome_ambiente === nome)
    ambienteAtivo.value = idx >= 0 ? idx : 0
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
    const res = await TotemFabricaService.salvarAmbientePreMedicao(preMedicaoId.value, {
      nome_ambiente: nome,
      largura_m: ambiente.largura_m != null && ambiente.largura_m !== '' ? Number(ambiente.largura_m) : undefined,
      pe_direito_m: ambiente.pe_direito_m != null && ambiente.pe_direito_m !== '' ? Number(ambiente.pe_direito_m) : undefined,
      profundidade_m: ambiente.profundidade_m != null && ambiente.profundidade_m !== '' ? Number(ambiente.profundidade_m) : undefined,
      observacoes: String(ambiente.observacoes || '').trim() || undefined,
      medidas_json: serializarParedes(ambiente.paredes),
    })
    const data = res?.data ?? res ?? {}
    ambientes.value = Array.isArray(data?.ambientes) ? data.ambientes.map((amb) => criarAmbienteLocal(amb)) : ambientes.value
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
    if (ambienteAtivo.value >= ambientes.value.length) ambienteAtivo.value = Math.max(0, ambientes.value.length - 1)
    return
  }

  try {
    await TotemFabricaService.removerAmbientePreMedicao(preMedicaoId.value, ambiente.id)
    ambientes.value.splice(index, 1)
    if (ambienteAtivo.value >= ambientes.value.length) ambienteAtivo.value = Math.max(0, ambientes.value.length - 1)
    notify.success('Ambiente removido.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível remover o ambiente.')
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
  carregarFotosParedeAmbiente(amb)
}, { immediate: true })
</script>

<style scoped>
.pre-medicao-page__body {
  padding-bottom: 1.25rem;
}

/* Layout 2 colunas */
.pre-medicao-page__workspace {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0.85rem;
  align-items: start;
}

/* Rail (sidebar esquerda) */
.pre-medicao-page__rail {
  padding: 0.75rem;
  position: sticky;
  top: 1rem;
}

.pre-medicao-page__rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.pre-medicao-page__rail-count {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: var(--ds-radius-full);
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
}

.pre-medicao-page__rail-add {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
}

.pre-medicao-page__rail-input {
  flex: 1;
  min-width: 0;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-text) 15%, transparent);
  padding: 0.3rem 0;
  background: transparent;
  font-size: 0.78rem;
  color: var(--ds-color-text);
}

.pre-medicao-page__rail-input:focus {
  outline: none;
  border-bottom-color: var(--ds-color-primary);
}

.pre-medicao-page__rail-input::placeholder {
  color: color-mix(in srgb, var(--ds-color-text) 35%, transparent);
}

.pre-medicao-page__rail-add-btn {
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

.pre-medicao-page__rail-add-btn:hover {
  opacity: 0.85;
}

.pre-medicao-page__rail-empty {
  text-align: center;
  padding: 0.75rem 0;
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--ds-color-text) 45%, transparent);
}

.pre-medicao-page__rail-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pre-medicao-page__rail-card {
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  background: transparent;
  transition: background 0.12s, border-color 0.12s;
}

.pre-medicao-page__rail-card:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.pre-medicao-page__rail-card--active {
  background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--ds-color-primary) 25%, transparent);
}

.pre-medicao-page__rail-item {
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
  transition: background 0.12s, border-color 0.12s;
}

.pre-medicao-page__rail-item:hover {
  background: transparent;
}

.pre-medicao-page__rail-item--active {
  background: transparent;
}

.pre-medicao-page__rail-card--salvo .pre-medicao-page__rail-item-name::after {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ds-color-success);
  margin-left: 0.35rem;
  vertical-align: middle;
}

.pre-medicao-page__rail-item-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ds-color-text);
  letter-spacing: -0.02em;
}

.pre-medicao-page__rail-item-meta {
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--ds-color-text) 45%, transparent);
}

.pre-medicao-page__rail-sublinks {
  position: relative;
  margin: 0.05rem 0 0.35rem;
  margin-left: 0.45rem;
  padding-left: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.pre-medicao-page__rail-sublinks::before {
  content: '';
  position: absolute;
  left: 0.15rem;
  top: 0.18rem;
  bottom: 0.2rem;
  width: 1px;
  background: color-mix(in srgb, var(--ds-color-border) 42%, transparent);
  opacity: 0.55;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.pre-medicao-page__rail-sublink {
  position: relative;
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

.pre-medicao-page__rail-sublink::before {
  content: '';
  position: absolute;
  left: -0.42rem;
  top: 50%;
  width: 0.32rem;
  height: 1px;
  background: color-mix(in srgb, var(--ds-color-border) 42%, transparent);
  opacity: 0.55;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.pre-medicao-page__rail-sublink:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 6%, transparent);
  color: var(--ds-color-text);
}

.pre-medicao-page__rail-card:hover .pre-medicao-page__rail-sublinks::before,
.pre-medicao-page__rail-sublink:hover::before {
  opacity: 0.9;
}

.pre-medicao-page__rail-sublink--active {
  background: color-mix(in srgb, var(--ds-color-primary) 10%, transparent);
  color: var(--ds-color-primary);
}

.pre-medicao-page__rail-sublink--active::before {
  background: color-mix(in srgb, var(--ds-color-primary) 60%, transparent);
  opacity: 1;
}

.pre-medicao-page__rail-sublink-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-medicao-page__rail-sublink-dim {
  color: color-mix(in srgb, var(--ds-color-text) 42%, transparent);
  font-size: 0.64rem;
}

/* Detail (coluna direita) */
.pre-medicao-page__detail-empty {
  padding: 2rem;
  text-align: center;
}

.pre-medicao-page__editor {
  padding: 1rem;
}

.pre-medicao-page__editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.pre-medicao-page__name-input {
  width: min(100%, 22rem);
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.pre-medicao-page__name-input:focus {
  outline: none;
}

/* Paredes */
.pre-medicao-page__paredes-section {
  margin-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-text) 8%, transparent);
  padding-top: 0.85rem;
}

.pre-medicao-page__paredes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.pre-medicao-page__paredes-empty {
  padding: 0.75rem 0;
  text-align: center;
}

/* Sub-links das paredes */
.pre-medicao-page__paredes-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.6rem;
}

.pre-medicao-page__parede-link {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
  font-size: 0.8rem;
  color: var(--ds-color-text);
}

.pre-medicao-page__parede-link:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 5%, transparent);
}

.pre-medicao-page__parede-link--active {
  background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--ds-color-primary) 20%, transparent);
}

.pre-medicao-page__parede-link-name {
  font-weight: 600;
  letter-spacing: -0.02em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-medicao-page__parede-link-dims {
  font-size: 0.7rem;
  color: color-mix(in srgb, var(--ds-color-text) 45%, transparent);
  flex-shrink: 0;
}

.pre-medicao-page__parede-link-chevron {
  flex-shrink: 0;
  color: color-mix(in srgb, var(--ds-color-text) 35%, transparent);
  transition: transform 0.15s;
}

.pre-medicao-page__parede-link-chevron--open {
  transform: rotate(180deg);
}

.pre-medicao-page__parede {
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  border-radius: var(--ds-radius-lg);
  padding: 0.75rem;
  margin-bottom: 0.6rem;
  background: color-mix(in srgb, var(--ds-color-primary) 2%, transparent);
}

.pre-medicao-page__parede-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.pre-medicao-page__parede-name {
  flex: 1;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.pre-medicao-page__parede-name:focus {
  outline: none;
}

.pre-medicao-page__parede-name::placeholder {
  color: color-mix(in srgb, var(--ds-color-text) 35%, transparent);
}

.pre-medicao-page__parede-remove {
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

.pre-medicao-page__parede-remove:hover {
  background: color-mix(in srgb, var(--ds-color-danger) 20%, transparent);
}

.pre-medicao-page__parede-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.pre-medicao-page__parede-fotos {
  margin-top: 0.75rem;
  border-top: 1px dashed color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  padding-top: 0.65rem;
}

.pre-medicao-page__parede-fotos-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.pre-medicao-page__parede-fotos-title {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--ds-color-text-soft);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.pre-medicao-page__parede-fotos-loading {
  font-size: 0.7rem;
  color: var(--ds-color-text-faint);
}

.pre-medicao-page__parede-fotos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Desktop: wrapper não altera o fluxo do flex */
.pre-medicao-page__parede-fotos-actions {
  display: contents;
}

.pre-medicao-page__parede-foto-item {
  position: relative;
}

.pre-medicao-page__parede-foto-open {
  border: 0;
  padding: 0;
  background: transparent;
  border-radius: 0.5rem;
  cursor: zoom-in;
}

.pre-medicao-page__parede-foto-img {
  width: 4.2rem;
  height: 4.2rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 82%, transparent);
  background: var(--ds-color-surface-muted);
}

.pre-medicao-page__parede-foto-remove {
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

.group:hover .pre-medicao-page__parede-foto-remove {
  opacity: 1;
}

.pre-medicao-page__parede-foto-add {
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

.pre-medicao-page__parede-foto-add:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 55%, transparent);
  color: var(--ds-color-primary);
}

.pre-medicao-page__parede-foto-add--gallery {
  border-style: solid;
  border-width: 1px;
}

.pre-medicao-page__parede-foto-add--gallery:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 35%, transparent);
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.pre-medicao-page__foto-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: color-mix(in srgb, #000 72%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pre-medicao-page__foto-lightbox-img {
  max-width: min(96vw, 1080px);
  max-height: 92vh;
  border-radius: 0.65rem;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
  object-fit: contain;
}

.pre-medicao-page__foto-lightbox-close {
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

.pre-medicao-page__editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.pre-medicao-page__state {
  text-align: center;
}

.pre-medicao-page__state-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

/* Mobile: empilha */
@media (max-width: 768px) {
  .pre-medicao-page__workspace {
    grid-template-columns: 1fr;
  }

  .pre-medicao-page__rail {
    position: static;
  }

  .pre-medicao-page__rail-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .pre-medicao-page__rail-card {
    width: 100%;
  }

  .pre-medicao-page__rail-item,
  .pre-medicao-page__rail-sublink {
    padding-top: 0.38rem;
    padding-bottom: 0.38rem;
  }

  .pre-medicao-page__rail-item-name {
    font-size: 0.88rem;
  }

  .pre-medicao-page__rail-item-meta {
    font-size: 0.74rem;
  }

  .pre-medicao-page__rail-sublink {
    font-size: 0.8rem;
    gap: 0.35rem;
  }

  .pre-medicao-page__rail-sublink-dim {
    font-size: 0.72rem;
  }

  .pre-medicao-page__parede-grid {
    grid-template-columns: 1fr;
  }

  .pre-medicao-page__editor {
    padding: 0.9rem;
  }

  .pre-medicao-page__editor-head {
    flex-direction: column;
  }

  /* Fotos da parede: cabe melhor na tela, mantém toque ≥44px nos botões */
  .pre-medicao-page__parede-fotos-grid {
    gap: 0.35rem;
    align-items: flex-start;
  }

  .pre-medicao-page__parede-foto-img {
    width: 3.35rem;
    height: 3.35rem;
  }

  .pre-medicao-page__parede-foto-remove {
    opacity: 1;
    width: 1.35rem;
    height: 1.35rem;
    font-size: 0.8rem;
    touch-action: manipulation;
  }

  .pre-medicao-page__parede-fotos-actions {
    display: flex;
    flex-basis: 100%;
    width: 100%;
    gap: 0.35rem;
  }

  .pre-medicao-page__parede-foto-add {
    width: auto;
    min-height: 44px;
    height: auto;
    min-width: 0;
    flex: 1 1 0;
    max-width: none;
    flex-direction: row;
    gap: 0.35rem;
    padding: 0 0.45rem;
    font-size: 0.58rem;
    line-height: 1.15;
    text-align: center;
    touch-action: manipulation;
  }

  .pre-medicao-page__parede-foto-add .pi {
    font-size: 0.82rem !important;
    flex-shrink: 0;
  }

  .pre-medicao-page__parede-foto-add span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pre-medicao-page__foto-lightbox {
    padding: 0.6rem;
  }

  .pre-medicao-page__foto-lightbox-img {
    max-width: 100%;
    max-height: 88vh;
  }
}
</style>