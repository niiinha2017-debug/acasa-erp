<template>
  <component :is="embedded ? 'div' : PageShell" :padded="embedded ? undefined : false">
    <section class="totem-medicao-page ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        v-if="!embedded"
        :title="pageTitle"
        :subtitle="tituloTarefa || pageSubtitle"
        icon="pi pi-ruler"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push(backTo)">
            <i class="pi pi-arrow-left mr-2 text-xs"></i>
            {{ backLabel }}
          </Button>
        </template>
      </PageHeader>

      <div class="totem-medicao-page__body ds-page-context__content">
        <div v-if="erroCarregamento" class="totem-medicao-page__state ds-alert ds-alert--danger">
          <p class="totem-medicao-page__state-title">{{ erroCarregamento }}</p>
          <p class="totem-medicao-page__state-copy">Verifique o vínculo da tarefa com um projeto antes de continuar.</p>
          <router-link :to="backTo" class="totem-medicao-page__state-link">{{ backLabel }}</router-link>
        </div>

        <Loading v-else-if="loading" />

        <form v-else class="totem-medicao-page__form" @submit.prevent="finalizar">
          <CardSection
            title="Medidas principais"
            description="Preencha as medidas estruturais em milímetros para liberar o envio técnico."
          >
            <div class="totem-medicao-page__grid totem-medicao-page__grid--2">
              <Input
                v-model="form.largura_mm"
                type="number"
                inputmode="numeric"
                label="Largura (mm)"
                placeholder="Ex: 2400"
                :force-upper="false"
                :error="submitted && !validLargura ? 'Obrigatório' : ''"
              />
              <Input
                v-model="form.pe_direito_mm"
                type="number"
                inputmode="numeric"
                label="Pé-direito (mm)"
                placeholder="Ex: 2700"
                :force-upper="false"
                :error="submitted && !validPeDireito ? 'Obrigatório' : ''"
              />
            </div>
            <p v-if="submitted && !medidasOk" class="totem-medicao-page__hint totem-medicao-page__hint--danger">
              Preencha largura e pé-direito para finalizar a medição.
            </p>
          </CardSection>

          <CardSection
            title="Checklist de conferência"
            description="Marque os pontos existentes no local para orientar a engenharia."
          >
            <div class="totem-medicao-page__grid totem-medicao-page__grid--2">
              <label class="totem-medicao-page__check-card">
                <input v-model="form.conferencia_agua" type="checkbox" class="totem-medicao-page__check-input" />
                <span class="totem-medicao-page__check-copy">
                  <strong>Pontos de água</strong>
                  <small>Confirmação hidráulica do ambiente.</small>
                </span>
              </label>
              <label class="totem-medicao-page__check-card">
                <input v-model="form.conferencia_luz" type="checkbox" class="totem-medicao-page__check-input" />
                <span class="totem-medicao-page__check-copy">
                  <strong>Luz</strong>
                  <small>Tomadas, circuitos e posição elétrica.</small>
                </span>
              </label>
              <label class="totem-medicao-page__check-card">
                <input v-model="form.conferencia_gas" type="checkbox" class="totem-medicao-page__check-input" />
                <span class="totem-medicao-page__check-copy">
                  <strong>Gás</strong>
                  <small>Passagem e posição da infraestrutura.</small>
                </span>
              </label>
              <label class="totem-medicao-page__check-card">
                <input v-model="form.conferencia_ar_condicionado" type="checkbox" class="totem-medicao-page__check-input" />
                <span class="totem-medicao-page__check-copy">
                  <strong>Ar-condicionado</strong>
                  <small>Pontos existentes e interferências no projeto.</small>
                </span>
              </label>
            </div>
          </CardSection>

          <CardSection
            title="Upload de projeto"
            description="Envie arquivos do Promob, PDFs, CSVs ou imagens de obra vinculados à medição."
          >
            <template v-if="medicaoId">
              <div class="totem-medicao-page__upload-box">
                <input
                  type="file"
                  accept=".gltf,.glb,.obj,.pdf,.csv,image/*"
                  class="hidden"
                  @change="onFileSelect"
                />
                <Button
                  variant="secondary"
                  class="!rounded-xl"
                  :disabled="uploadProgress > 0 && uploadProgress < 100"
                  @click="$event.currentTarget.previousElementSibling?.click()"
                >
                  <i class="pi pi-upload mr-2 text-xs"></i>
                  Enviar arquivo
                </Button>
                <p class="totem-medicao-page__hint">Arquivos aceitos: 3D, PDF, CSV e imagens.</p>
              </div>

              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="totem-medicao-page__progress">
                <div class="totem-medicao-page__progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
              </div>
              <p v-if="uploadProgress > 0 && uploadProgress < 100" class="totem-medicao-page__hint">
                Enviando... {{ uploadProgress }}%
              </p>

              <ul v-if="arquivosLista.length" class="totem-medicao-page__files">
                <li v-for="f in arquivosLista" :key="f.id" class="totem-medicao-page__file-row">
                  <span class="totem-medicao-page__file-name">{{ f.nome || f.filename || 'Arquivo' }}</span>
                  <button
                    type="button"
                    class="totem-medicao-page__file-remove"
                    title="Remover"
                    @click="removerArquivo(f)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </li>
              </ul>
            </template>
            <p v-else class="totem-medicao-page__hint">Carregando os dados da medição para habilitar uploads.</p>
          </CardSection>

          <CardSection :title="pageTitle" :description="submitDescription">
            <template #footer>
              <div class="totem-medicao-page__footer">
                <Button
                  type="submit"
                  variant="success"
                  full-width
                  class="!rounded-2xl"
                  :loading="finalizando"
                  :disabled="finalizando"
                >
                  <i v-if="!finalizando" class="pi pi-send mr-2 text-xs"></i>
                  {{ finalizando ? 'Enviando...' : submitLabel }}
                </Button>
              </div>
            </template>
          </CardSection>
        </form>
      </div>
    </section>
  </component>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import CardSection from '@/components/ui/CardSection.vue'
import Input from '@/components/ui/Input.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import Loading from '@/components/common/Loading.vue'
import { MedicaoFinaService, ArquivosService, TotemFabricaService } from '@/services'
import { notify } from '@/services/notify'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  agendaIdProp: { type: Number, default: null },
  tipoProp: { type: String, default: null },
  projetoIdProp: { type: Number, default: null },
})

const emit = defineEmits(['finalizado'])

const route = useRoute()
const router = useRouter()

const agendaId = computed(() => props.agendaIdProp || Number(String(route.query?.agendaId || route.params?.id || '').replace(/\D/g, '')) || null)
const tipo = computed(() => {
  if (props.tipoProp) return props.tipoProp
  if (route.query?.tipo === 'agenda_loja') return 'agenda_loja'
  if (String(route.path || '').startsWith('/medicao/venda/')) return 'agenda_loja'
  return 'agenda_fabrica'
})
const projetoIdInformado = computed(() => props.projetoIdProp || Number(String(route.query?.projetoId || '').replace(/\D/g, '')) || null)
const tarefa = ref(null)
const isMedicaoVenda = computed(() => tipo.value === 'agenda_loja')
const projetoId = computed(() => {
  const resolvido = Number(
    tarefa.value?.projeto_id
    || tarefa.value?.projeto?.id
    || tarefa.value?.orcamento?.projeto_id
    || 0,
  )
  return projetoIdInformado.value || (resolvido > 0 ? resolvido : null)
})
const tituloTarefa = computed(() => {
  if (route.query?.titulo) return String(route.query.titulo)
  const nomeProjeto = tarefa.value?.projeto?.nome || tarefa.value?.titulo || tarefa.value?.nome || ''
  const nomeCliente = tarefa.value?.cliente?.nome_completo || tarefa.value?.cliente?.razao_social || ''
  return nomeProjeto || nomeCliente || ''
})
const backTo = computed(() => String(route.query?.back || '').trim() || (isMedicaoVenda.value ? '/agenda-geral' : '/totem-fabrica'))
const backLabel = computed(() => (isMedicaoVenda.value ? 'Voltar para agenda' : 'Voltar ao totem'))
const pageTitle = computed(() => (isMedicaoVenda.value ? 'Medição Inicial' : 'Medição Fina'))
const pageSubtitle = computed(() => (isMedicaoVenda.value ? 'Medição antes da venda' : 'Medição depois da venda'))
const submitLabel = computed(() => (isMedicaoVenda.value ? 'Finalizar medição inicial' : 'Finalizar medição e enviar'))
const submitDescription = computed(() => (isMedicaoVenda.value ? 'Ao finalizar, a medição inicial fica registrada no fluxo comercial.' : 'Ao finalizar, o status muda para Medido - Aguardando Técnico.'))

const loading = ref(true)
const erroCarregamento = ref('')
const medicaoId = ref(null)
const ambientePadrao = ref('')
const finalizando = ref(false)
const submitted = ref(false)
const uploadProgress = ref(0)
const arquivosLista = ref([])

const form = ref({
  largura_mm: null,
  pe_direito_mm: null,
  conferencia_agua: false,
  conferencia_luz: false,
  conferencia_gas: false,
  conferencia_ar_condicionado: false,
})

const validLargura = computed(() => form.value.largura_mm != null && Number(form.value.largura_mm) >= 1)
const validPeDireito = computed(() => form.value.pe_direito_mm != null && Number(form.value.pe_direito_mm) >= 1)
const medidasOk = computed(() => validLargura.value && validPeDireito.value)

async function carregar() {
  if (!agendaId.value) {
    erroCarregamento.value = 'Tarefa não informada.'
    loading.value = false
    return
  }

  loading.value = true
  erroCarregamento.value = ''

  try {
    const tarefaResponse = await TotemFabricaService.getTarefa(agendaId.value, tipo.value)
    tarefa.value = tarefaResponse?.data ?? tarefaResponse ?? null

    if (!projetoId.value) {
      erroCarregamento.value = 'Esta tarefa não está vinculada a um projeto. Conclua pelo Totem ou vincule um projeto na Agenda.'
      return
    }

    const { ambientePadrao: ambienteInicial, medicao } = await MedicaoFinaService.carregarAmbienteInicial(projetoId.value)

    ambientePadrao.value = ambienteInicial || 'Ambiente'
    medicaoId.value = medicao?.id ?? null

    if (medicao?.largura_cm != null) form.value.largura_mm = Math.round(Number(medicao.largura_cm) * 10)
    if (medicao?.altura_cm != null) form.value.pe_direito_mm = Math.round(Number(medicao.altura_cm) * 10)
    if (medicao?.conferencia_hidraulica_ok != null) form.value.conferencia_agua = !!medicao.conferencia_hidraulica_ok
    if (medicao?.conferencia_eletrica_ok != null) form.value.conferencia_luz = !!medicao.conferencia_eletrica_ok
    if (medicao?.conferencia_gas_ok != null) form.value.conferencia_gas = !!medicao.conferencia_gas_ok
    if (Array.isArray(medicao?.interferencias) && medicao.interferencias.includes('AR_CONDICIONADO')) {
      form.value.conferencia_ar_condicionado = true
    }

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a medição.'
  } finally {
    loading.value = false
  }
}

async function carregarArquivos() {
  if (!medicaoId.value) {
    arquivosLista.value = []
    return
  }
  try {
    const res = await ArquivosService.listar({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
    })
    const list = Array.isArray(res?.data) ? res.data : res?.data?.data ?? []
    arquivosLista.value = list || []
  } catch {
    arquivosLista.value = []
  }
}

async function onFileSelect(event) {
  const file = event.target?.files?.[0]
  if (!file || !medicaoId.value) return
  event.target.value = ''
  const ext = (file.name || '').toLowerCase()
  const categoria = /\.(gltf|glb|obj)$/.test(ext)
    ? 'MODELO_3D'
    : /\.(pdf|csv)$/.test(ext)
      ? 'LISTA_CORTE_PROMOB'
      : 'OBRA'
  uploadProgress.value = 10
  try {
    await ArquivosService.upload({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      file,
      categoria,
      onUploadProgress: (ev) => {
        if (ev.total) uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
      },
    })
    await carregarArquivos()
  } catch (e) {
    notify.error('Falha ao enviar arquivo.')
    console.error(e)
  } finally {
    uploadProgress.value = 0
  }
}

async function removerArquivo(f) {
  if (!f?.id) return
  try {
    await ArquivosService.remover(f.id)
    await carregarArquivos()
  } catch {
    notify.error('Falha ao remover arquivo.')
  }
}

async function finalizar() {
  submitted.value = true
  if (!medidasOk.value) return
  if (!agendaId.value || !projetoId.value) {
    notify.error('Dados da tarefa incompletos.')
    return
  }
  finalizando.value = true
  try {
    await MedicaoFinaService.finalizarTotem({
      agenda_id: agendaId.value,
      tipo: tipo.value,
      projeto_id: projetoId.value,
      nome_ambiente: ambientePadrao.value || undefined,
      largura_mm: Number(form.value.largura_mm),
      pe_direito_mm: Number(form.value.pe_direito_mm),
      conferencia_agua: form.value.conferencia_agua,
      conferencia_luz: form.value.conferencia_luz,
      conferencia_gas: form.value.conferencia_gas,
      conferencia_ar_condicionado: form.value.conferencia_ar_condicionado,
    })
    notify.success(isMedicaoVenda.value ? 'Medição inicial finalizada.' : 'Medição finalizada. Status atualizado para Medido - Aguardando Técnico.')
    if (props.embedded) {
      emit('finalizado')
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 800))
    window.location.href = backTo.value
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data?.error || 'Não foi possível finalizar a medição.'
    notify.error(msg)
  } finally {
    finalizando.value = false
  }
}

onMounted(() => carregar())
</script>

<style scoped>
.totem-medicao-page__body {
  width: min(100%, 960px);
  margin: 0 auto;
}

.totem-medicao-page__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.totem-medicao-page__state {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  text-align: center;
}

.totem-medicao-page__state-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.totem-medicao-page__state-copy {
  margin: 0;
  font-size: 0.84rem;
  color: var(--ds-color-text-soft);
}

.totem-medicao-page__state-link {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--ds-color-primary);
}

.totem-medicao-page__grid {
  display: grid;
  gap: 0.85rem;
}

.totem-medicao-page__grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.totem-medicao-page__hint {
  margin: 0.65rem 0 0;
  font-size: 0.78rem;
  color: var(--ds-color-text-soft);
}

.totem-medicao-page__hint--danger {
  color: var(--ds-color-danger);
}

.totem-medicao-page__check-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-height: 5rem;
  padding: 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ds-color-surface) 84%, white 16%);
  cursor: pointer;
}

.totem-medicao-page__check-input {
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.2rem;
  accent-color: var(--ds-color-success);
}

.totem-medicao-page__check-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.totem-medicao-page__check-copy strong {
  font-size: 0.9rem;
  color: var(--ds-color-text);
}

.totem-medicao-page__check-copy small {
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--ds-color-text-soft);
}

.totem-medicao-page__upload-box {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.totem-medicao-page__progress {
  width: 100%;
  height: 0.55rem;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.18);
}

.totem-medicao-page__progress-bar {
  height: 100%;
  background: var(--ds-color-success);
  transition: width 0.25s ease;
}

.totem-medicao-page__files {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0.9rem 0 0;
  padding: 0;
  list-style: none;
}

.totem-medicao-page__file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--ds-color-border);
  background: color-mix(in srgb, var(--ds-color-surface) 88%, white 12%);
}

.totem-medicao-page__file-name {
  min-width: 0;
  font-size: 0.82rem;
  color: var(--ds-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.totem-medicao-page__file-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(196, 73, 73, 0.18);
  border-radius: 0.7rem;
  background: rgba(196, 73, 73, 0.06);
  color: var(--ds-color-danger);
}

.totem-medicao-page__footer {
  width: 100%;
}

@media (max-width: 768px) {
  .totem-medicao-page__grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>