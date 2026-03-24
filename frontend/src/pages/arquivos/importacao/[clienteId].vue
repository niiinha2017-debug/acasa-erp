<template>
  <PageShell :padded="false">
    <section class="arquivos-import ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        :title="cliente ? getClienteNome(cliente) : 'Importação de Cliente'"
        subtitle="Ajuste o status do fluxo e anexe os documentos migrados"
        icon="pi pi-folder"
      >
        <template #actions>
          <div class="arquivos-import__actions ds-page-context__actions">
            <Button v-if="cliente" variant="secondary" class="arquivos-import__toolbar-btn" @click="abrirCadastroCompleto">
              <i class="pi pi-user"></i>
              Cadastro Completo
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="arquivos-import__content ds-page-context__content">
        <Loading v-if="loadingCliente" />

        <div v-else-if="!cliente" class="arquivos-import__empty px-6 py-16 text-center">
          <div class="ds-eyebrow">Cliente não encontrado</div>
          <p class="mt-2 text-sm text-text-soft">Volte ao índice e selecione outro registro para importar.</p>
        </div>

        <div v-else class="arquivos-import__layout space-y-6">
          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title">
                Resumo da Importação
              </span>
            </div>
          </div>

          <section class="arquivos-import__summary-bar">
            <div class="arquivos-import__summary-row">
              <div class="arquivos-import__summary-item">
                <span class="arquivos-import__meta-label">Documento</span>
                <span class="arquivos-import__summary-value">{{ getClienteDocumento(cliente) || 'Sem documento' }}</span>
              </div>
              <div class="arquivos-import__summary-item">
                <span class="arquivos-import__meta-label">Contato</span>
                <span class="arquivos-import__summary-value">{{ cliente.whatsapp || cliente.telefone || 'Sem telefone' }}</span>
              </div>
              <div class="arquivos-import__summary-item">
                <span class="arquivos-import__meta-label">E-mail</span>
                <span class="arquivos-import__summary-value">{{ cliente.email || 'Sem e-mail' }}</span>
              </div>
              <div class="arquivos-import__summary-item">
                <span class="arquivos-import__meta-label">Local</span>
                <span class="arquivos-import__summary-value">{{ [cliente.cidade, cliente.estado].filter(Boolean).join(' / ') || 'Não informado' }}</span>
              </div>
            </div>
          </section>

        <div class="arquivos-import__grid grid grid-cols-1 xl:grid-cols-[380px,minmax(0,1fr)] gap-6 items-start">
          <aside class="arquivos-import__sidebar">
            <div class="arquivos-import__sidebar-head">
              <div class="ds-eyebrow">Atualizar Status</div>
              <span
                class="mt-2 ds-status-pill"
                :class="getFluxoClass(cliente.status)"
              >
                {{ getStatusLabel(cliente.status) }}
              </span>
            </div>

            <div class="arquivos-import__status-form">
              <div class="arquivos-import__status-row">
                <SearchInput
                  v-model="selectedMacro"
                  col-span="w-full"
                  mode="select"
                  variant="line"
                  hide-search-icon
                  label="Macro-etapa"
                  placeholder="Selecione a etapa"
                  :options="macroetapaOptions"
                  :disabled="!canEditClientes || savingStatus"
                />

                <SearchInput
                  v-model="selectedSub"
                  col-span="w-full"
                  mode="select"
                  variant="line"
                  hide-search-icon
                  label="Subetapa"
                  placeholder="Selecione a subetapa"
                  :options="subetapaOptions"
                  :disabled="!canEditClientes || savingStatus || !selectedMacro"
                />

                <SearchInput
                  v-model="selectedExec"
                  col-span="w-full"
                  mode="select"
                  variant="line"
                  hide-search-icon
                  label="Execução"
                  placeholder="Selecione a execução"
                  :options="execucaoOptions"
                  :disabled="!canEditClientes || savingStatus || !selectedSub"
                />

                <div
                  v-if="statusComputado"
                  class="arquivos-import__status-preview rounded-xl border border-border-ui bg-bg-card px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-soft"
                >
                  Status: <span class="text-text-main">{{ statusComputado.replace(/_/g, ' ') }}</span>
                </div>

                <div class="arquivos-import__status-actions flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    class="arquivos-import__status-btn"
                    :disabled="!selectedMacro && !selectedSub && !selectedExec"
                    @click="resetarStatusDraft"
                  >
                    <i class="pi pi-undo"></i>
                    Desfazer
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    class="arquivos-import__status-btn"
                    :disabled="!canEditClientes || !statusHasChanged"
                    :loading="savingStatus"
                    @click="salvarStatusSelecionado"
                  >
                    <i class="pi pi-save"></i>
                    Salvar
                  </Button>
                </div>
              </div>

              <div v-if="!canEditClientes" class="ds-alert ds-alert--warning px-3 py-2 text-xs font-bold">
                Sem permissão para editar o status do cliente.
              </div>
            </div>
          </aside>

          <section class="arquivos-import__documents">
            <div class="arquivos-import__panel-head flex items-center justify-between gap-3">
              <div>
                <div class="ds-eyebrow">Documentos Importados</div>
                <div class="mt-1 text-sm text-text-soft">
                  {{ arquivosOrdenados.length }}
                  {{ arquivosOrdenados.length !== 1 ? 'arquivos' : 'arquivo' }} anexado{{ arquivosOrdenados.length !== 1 ? 's' : '' }}
                </div>
              </div>

              <Button
                variant="secondary"
                class="arquivos-import__toolbar-btn"
                :disabled="!canViewFiles || loadingArquivos"
                @click="carregarArquivos()"
              >
                <i class="pi pi-refresh"></i>
                Atualizar
              </Button>

              <Button
                v-if="canCreateFiles"
                variant="primary"
                class="arquivos-import__toolbar-btn"
                :disabled="uploadingArquivos || !cliente"
                @click="abrirSeletorArquivos"
              >
                <i class="pi pi-upload"></i>
                {{ uploadingArquivos ? 'Enviando...' : 'Adicionar Documentos' }}
              </Button>
            </div>

            <div class="arquivos-import__documents-body">
              <div v-if="!canViewFiles" class="ds-alert ds-alert--warning text-sm">
                Sem permissão para visualizar os arquivos.
              </div>

              <div v-else-if="loadingArquivos" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-for="i in 4" :key="i" class="h-20 rounded-2xl bg-slate-100 animate-pulse" />
              </div>

              <div v-else-if="!arquivosOrdenados.length" class="arquivos-import__empty-state px-5 py-12 text-center">
                <div class="ds-eyebrow">Nenhum documento anexado</div>
                <p class="mt-2 text-sm text-text-soft">Clique em "Adicionar Documentos" para iniciar a importação.</p>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <article
                  v-for="arquivo in arquivosOrdenados"
                  :key="arquivo.id"
                  class="arquivos-import__file px-4 py-3 flex items-center gap-3"
                >
                  <div class="arquivos-import__file-icon w-10 h-10 rounded-xl flex items-center justify-center bg-bg-page border border-border-ui text-text-soft flex-shrink-0">
                    <i :class="getFileIcon(arquivo.mime_type)"></i>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="arquivos-import__file-name text-sm font-black uppercase tracking-tight text-text-main truncate">{{ arquivo.nome || arquivo.filename }}</div>
                    <div class="arquivos-import__file-meta text-[10px] text-text-soft truncate">
                      {{ formatSize(arquivo.tamanho) }}
                      <span v-if="arquivo.criado_em"> · {{ formatDateTime(arquivo.criado_em) }}</span>
                    </div>
                  </div>

                  <div class="ds-table-actions arquivos-import__file-actions flex-shrink-0">
                    <button type="button" class="ds-table-action" @click="visualizarArquivo(arquivo)" title="Visualizar documento">
                      <i class="pi pi-eye ds-table-action__icon"></i>
                    </button>

                    <button
                      v-if="canDeleteFiles"
                      type="button"
                      class="ds-table-action ds-table-action--danger"
                      :disabled="deletingFileId === Number(arquivo.id)"
                      @click="removerArquivo(arquivo)"
                      title="Excluir documento"
                    >
                      <i class="pi pi-trash ds-table-action__icon"></i>
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>

      <input ref="fileInputRef" type="file" class="hidden" multiple @change="onPickFiles" />
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService, ClienteService } from '@/services'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { getSubetapaLabel, getExecucaoEtapaLabel } from '@/constantes'
import { SUBETAPAS_CATALOGO, normalizarStatusCliente, validarTransicaoStatusCliente } from '@/constantes/pipeline-cliente'

// Mapa triplo: subetapa + execucao → status a salvar no cliente
const _SUB_EXEC_STATUS = {
  CADASTRO:       { PENDENTE: 'CLIENTE_CADASTRADO', AGENDADO: 'CLIENTE_CADASTRADO', EM_ANDAMENTO: 'CLIENTE_CADASTRADO', CONCLUIDO: 'CLIENTE_CADASTRADO' },
  MEDIDA:         { PENDENTE: 'AGENDAR_MEDIDA_VENDA', AGENDADO: 'MEDIDA_AGENDADA', EM_ANDAMENTO: 'MEDIDA_EM_ANDAMENTO', CONCLUIDO: 'MEDIDA_REALIZADA' },
  ORCAMENTO:      { PENDENTE: 'CRIAR_ORCAMENTO', AGENDADO: 'ORCAMENTO_EM_ANDAMENTO', EM_ANDAMENTO: 'ORCAMENTO_EM_ANDAMENTO', CONCLUIDO: 'ORCAMENTO_APROVADO' },
  APRESENTACAO:   { PENDENTE: 'AGENDAR_APRESENTACAO', AGENDADO: 'APRESENTACAO_AGENDADA', EM_ANDAMENTO: 'APRESENTACAO_AGENDADA', CONCLUIDO: 'ORCAMENTO_APRESENTADO' },
  FECHAMENTO:     { PENDENTE: 'VENDA_FECHADA', AGENDADO: 'VENDA_FECHADA', EM_ANDAMENTO: 'VENDA_FECHADA', CONCLUIDO: 'CONTRATO_ASSINADO' },
  MEDIDA_FINA:    { PENDENTE: 'AGENDAR_MEDIDA_FINA', AGENDADO: 'MEDIDA_FINA_AGENDADA', EM_ANDAMENTO: 'MEDIDA_FINA_AGENDADA', CONCLUIDO: 'AGUARDANDO_PRECIFICACAO' },
  PROJETO_TECNICO:{ PENDENTE: 'AGUARDANDO_PROJETO_TECNICO', AGENDADO: 'AGUARDANDO_PROJETO_TECNICO', EM_ANDAMENTO: 'PROJETO_TECNICO_EM_ANDAMENTO', CONCLUIDO: 'PROJETO_TECNICO_CONCLUIDO' },
  PRODUCAO:       { PENDENTE: 'PRODUCAO_RECEBIDA', AGENDADO: 'PRODUCAO_AGENDADA', EM_ANDAMENTO: 'EM_PRODUCAO', CONCLUIDO: 'PRODUCAO_FINALIZADA' },
  ENTREGA:        { PENDENTE: 'AGENDAR_MONTAGEM', AGENDADO: 'MONTAGEM_AGENDADA', EM_ANDAMENTO: 'MONTAGEM_AGENDADA', CONCLUIDO: 'MONTAGEM_AGENDADA' },
  MONTAGEM:       { PENDENTE: 'AGENDAR_MONTAGEM', AGENDADO: 'MONTAGEM_AGENDADA', EM_ANDAMENTO: 'EM_MONTAGEM', CONCLUIDO: 'MONTAGEM_FINALIZADA' },
  GARANTIA:       { PENDENTE: 'GARANTIA', AGENDADO: 'GARANTIA', EM_ANDAMENTO: 'GARANTIA', CONCLUIDO: 'GARANTIA' },
  ASSISTENCIA:    { PENDENTE: 'ASSISTENCIA', AGENDADO: 'ASSISTENCIA', EM_ANDAMENTO: 'ASSISTENCIA', CONCLUIDO: 'ASSISTENCIA' },
  MANUTENCAO:     { PENDENTE: 'MANUTENCAO', AGENDADO: 'MANUTENCAO', EM_ANDAMENTO: 'MANUTENCAO', CONCLUIDO: 'MANUTENCAO' },
}

// Mapa reverso: status legado → (subetapa, execucao) para pré-preencher os selects
const _STATUS_REVERSO = {
  ATIVO: { subetapa: 'CADASTRO', execucao: 'PENDENTE' },
  CLIENTE_CADASTRADO: { subetapa: 'CADASTRO', execucao: 'PENDENTE' },
  CADASTRO: { subetapa: 'CADASTRO', execucao: 'PENDENTE' },
  AGENDAR_MEDIDA: { subetapa: 'MEDIDA', execucao: 'PENDENTE' },
  AGENDAR_MEDIDA_VENDA: { subetapa: 'MEDIDA', execucao: 'PENDENTE' },
  MEDICAO_VENDA: { subetapa: 'MEDIDA', execucao: 'EM_ANDAMENTO' },
  MEDIDA_AGENDADA: { subetapa: 'MEDIDA', execucao: 'AGENDADO' },
  MEDIDA_EM_ANDAMENTO: { subetapa: 'MEDIDA', execucao: 'EM_ANDAMENTO' },
  MEDIDA_REALIZADA: { subetapa: 'MEDIDA', execucao: 'CONCLUIDO' },
  MEDIDA_VENDA_REALIZADA: { subetapa: 'MEDIDA', execucao: 'CONCLUIDO' },
  CRIAR_ORCAMENTO: { subetapa: 'ORCAMENTO', execucao: 'PENDENTE' },
  ORCAMENTO: { subetapa: 'ORCAMENTO', execucao: 'EM_ANDAMENTO' },
  ORCAMENTO_EM_ANDAMENTO: { subetapa: 'ORCAMENTO', execucao: 'EM_ANDAMENTO' },
  ORCAMENTO_ENVIADO: { subetapa: 'ORCAMENTO', execucao: 'EM_ANDAMENTO' },
  ORCAMENTO_EM_NEGOCIACAO: { subetapa: 'ORCAMENTO', execucao: 'EM_ANDAMENTO' },
  ORCAMENTO_APROVADO: { subetapa: 'ORCAMENTO', execucao: 'CONCLUIDO' },
  ORCAMENTO_REPROVADO: { subetapa: 'ORCAMENTO', execucao: 'CONCLUIDO' },
  AGENDAR_APRESENTACAO: { subetapa: 'APRESENTACAO', execucao: 'PENDENTE' },
  APRESENTACAO_AGENDADA: { subetapa: 'APRESENTACAO', execucao: 'AGENDADO' },
  ORCAMENTO_APRESENTADO: { subetapa: 'APRESENTACAO', execucao: 'CONCLUIDO' },
  CONTRATO: { subetapa: 'FECHAMENTO', execucao: 'EM_ANDAMENTO' },
  VENDA_FECHADA: { subetapa: 'FECHAMENTO', execucao: 'EM_ANDAMENTO' },
  CONTRATO_GERADO: { subetapa: 'FECHAMENTO', execucao: 'EM_ANDAMENTO' },
  CONTRATO_ASSINADO: { subetapa: 'FECHAMENTO', execucao: 'CONCLUIDO' },
  AGENDAR_MEDIDA_FINA: { subetapa: 'MEDIDA_FINA', execucao: 'PENDENTE' },
  MEDIDA_FINA_AGENDADA: { subetapa: 'MEDIDA_FINA', execucao: 'AGENDADO' },
  MEDIDA_FINA_REALIZADA: { subetapa: 'MEDIDA_FINA', execucao: 'CONCLUIDO' },
  AGUARDANDO_PRECIFICACAO: { subetapa: 'MEDIDA_FINA', execucao: 'CONCLUIDO' },
  AGUARDANDO_PROJETO_TECNICO: { subetapa: 'PROJETO_TECNICO', execucao: 'PENDENTE' },
  PROJETO_TECNICO_EM_ANDAMENTO: { subetapa: 'PROJETO_TECNICO', execucao: 'EM_ANDAMENTO' },
  PROJETO_TECNICO_CONCLUIDO: { subetapa: 'PROJETO_TECNICO', execucao: 'CONCLUIDO' },
  PROJETO_TECNICO_APROVADO: { subetapa: 'PROJETO_TECNICO', execucao: 'CONCLUIDO' },
  PRODUCAO_RECEBIDA: { subetapa: 'PRODUCAO', execucao: 'PENDENTE' },
  PRODUCAO_AGENDADA: { subetapa: 'PRODUCAO', execucao: 'AGENDADO' },
  EM_PRODUCAO: { subetapa: 'PRODUCAO', execucao: 'EM_ANDAMENTO' },
  PRODUCAO_FINALIZADA: { subetapa: 'PRODUCAO', execucao: 'CONCLUIDO' },
  PRODUCAO_MONTAGEM: { subetapa: 'PRODUCAO', execucao: 'EM_ANDAMENTO' },
  AGENDAR_MONTAGEM: { subetapa: 'MONTAGEM', execucao: 'PENDENTE' },
  MONTAGEM_AGENDADA: { subetapa: 'MONTAGEM', execucao: 'AGENDADO' },
  MONTAGEM_CLIENTE_AGENDADA: { subetapa: 'MONTAGEM', execucao: 'AGENDADO' },
  EM_MONTAGEM: { subetapa: 'MONTAGEM', execucao: 'EM_ANDAMENTO' },
  EM_MONTAGEM_CLIENTE: { subetapa: 'MONTAGEM', execucao: 'EM_ANDAMENTO' },
  MONTAGEM_FINALIZADA: { subetapa: 'MONTAGEM', execucao: 'CONCLUIDO' },
  MONTAGEM_CLIENTE_FINALIZADA: { subetapa: 'MONTAGEM', execucao: 'CONCLUIDO' },
  GARANTIA: { subetapa: 'GARANTIA', execucao: 'PENDENTE' },
  ASSISTENCIA: { subetapa: 'ASSISTENCIA', execucao: 'PENDENTE' },
  MANUTENCAO: { subetapa: 'MANUTENCAO', execucao: 'PENDENTE' },
}

const _MACRO_LABELS = {
  COMERCIAL: 'Comercial',
  ENGENHARIA: 'Engenharia',
  FABRICA: 'Fábrica',
  LOGISTICA: 'Logística',
  POS_VENDA: 'Pós-Venda',
}

const _EXEC_LABELS = {
  PENDENTE: 'Pendente',
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
}

definePage({ meta: { perm: 'clientes.ver' } })

const route = useRoute()
const router = useRouter()

const loadingCliente = ref(false)
const loadingArquivos = ref(false)
const uploadingArquivos = ref(false)
const savingStatus = ref(false)
const deletingFileId = ref(null)
const cliente = ref(null)
const arquivos = ref([])
const selectedMacro = ref('')
const selectedSub = ref('')
const selectedExec = ref('')
const fileInputRef = ref(null)

const clienteId = computed(() => Number(String(route.params.clienteId || '').replace(/\D/g, '')) || null)
const canEditClientes = computed(() => can('clientes.editar'))
const canViewFiles = computed(() => can('arquivos.ver'))
const canCreateFiles = computed(() => can('arquivos.criar'))
const canDeleteFiles = computed(() => can('arquivos.excluir'))

// Macro-etapas disponíveis (derivadas do catálogo de subetapas para MARCENARIA)
const macroetapaOptions = computed(() => {
  const vistas = new Set()
  const result = []
  for (const item of (SUBETAPAS_CATALOGO || [])) {
    if (!item.fluxos?.includes('MARCENARIA')) continue
    if (vistas.has(item.macroetapa)) continue
    vistas.add(item.macroetapa)
    result.push({ value: item.macroetapa, label: _MACRO_LABELS[item.macroetapa] || item.macroetapa })
  }
  return result
})

// Subetapas filtradas pela macro selecionada
const subetapaOptions = computed(() => {
  if (!selectedMacro.value) return []
  return (SUBETAPAS_CATALOGO || [])
    .filter((item) => item.macroetapa === selectedMacro.value && item.fluxos?.includes('MARCENARIA'))
    .map((item) => ({ value: item.key, label: getSubetapaLabel(item.key) || item.label || item.key }))
})

const execucaoOptions = computed(() =>
  Object.entries(_EXEC_LABELS).map(([value, label]) => ({ value, label })),
)

// Status resultante dos 3 selects
const statusComputado = computed(() => {
  if (!selectedSub.value || !selectedExec.value) return null
  return _SUB_EXEC_STATUS[selectedSub.value]?.[selectedExec.value] ?? null
})

const arquivosOrdenados = computed(() =>
  [...(Array.isArray(arquivos.value) ? arquivos.value : [])].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0)),
)

const statusHasChanged = computed(() => {
  if (!cliente.value || !statusComputado.value) return false
  const atual = String(cliente.value.status || '').trim().toUpperCase()
  return atual !== statusComputado.value
})

// Resetar subetapa/execucao quando macro muda
watch(selectedMacro, () => {
  selectedSub.value = ''
  selectedExec.value = ''
})
watch(selectedSub, () => {
  selectedExec.value = ''
})

function normalizeStatusKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function getClienteNome(value) {
  return value?.nome_completo || value?.razao_social || value?.nome_fantasia || 'Cliente'
}

function getClienteDocumento(value) {
  return value?.cpf || value?.cnpj || ''
}

function getStatusLabel(status) {
  const key = normalizeStatusKey(status)
  const reversed = _STATUS_REVERSO[key]
  if (reversed?.subetapa) {
    const subLabel = getSubetapaLabel(reversed.subetapa)
    const execLabel = _EXEC_LABELS[reversed.execucao] || ''
    if (subLabel) return execLabel ? `${subLabel} · ${execLabel}` : subLabel
  }
  return key.replace(/_/g, ' ') || 'Sem status'
}

function getFluxoClass(status) {
  const key = normalizeStatusKey(status)
  const mapa = {
    CLIENTE_CADASTRADO: 'ds-status-pill--neutral',
    MEDIDA_AGENDADA: 'ds-status-pill--warning',
    MEDIDA_REALIZADA: 'ds-status-pill--warning',
    ORCAMENTO_EM_ANDAMENTO: 'ds-status-pill--warning',
    ORCAMENTO_APROVADO: 'ds-status-pill--success',
    VENDA_FECHADA: 'ds-status-pill--success',
    MEDIDA_FINA_AGENDADA: 'ds-status-pill--warning',
    EM_PRODUCAO: 'ds-status-pill--warning',
    EM_MONTAGEM: 'ds-status-pill--warning',
    GARANTIA: 'ds-status-pill--warning',
    ENCERRADO: 'ds-status-pill--neutral',
  }
  return mapa[key] || 'ds-status-pill--neutral'
}

async function carregarCliente() {
  if (!clienteId.value) {
    cliente.value = null
    return
  }

  loadingCliente.value = true
  try {
    const { data } = await ClienteService.buscar(clienteId.value)
    cliente.value = data || null
    aplicarStatusNosSelects(data?.status)
  } catch (error) {
    console.error('Erro ao carregar cliente para importacao:', error)
    notify.error('Falha ao carregar os dados do cliente.')
    cliente.value = null
  } finally {
    loadingCliente.value = false
  }
}

async function carregarArquivos() {
  if (!clienteId.value || !canViewFiles.value) {
    arquivos.value = []
    return
  }

  loadingArquivos.value = true
  try {
    const { data } = await ArquivosService.listar({ ownerType: 'CLIENTE', ownerId: clienteId.value })
    arquivos.value = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  } catch (error) {
    console.error('Erro ao carregar arquivos do cliente:', error)
    notify.error('Falha ao carregar os documentos deste cliente.')
    arquivos.value = []
  } finally {
    loadingArquivos.value = false
  }
}

function voltarIndice() {
  router.push('/arquivos')
}

function abrirCadastroCompleto() {
  if (!cliente.value) return
  router.push(`/clientes/${cliente.value.id}`)
}

function aplicarStatusNosSelects(status) {
  const key = normalizeStatusKey(status)
  const reverso = _STATUS_REVERSO[key]
  if (reverso) {
    const catalogItem = (SUBETAPAS_CATALOGO || []).find((i) => i.key === reverso.subetapa)
    selectedMacro.value = catalogItem?.macroetapa || ''
    // Aguarda o tick para que subetapaOptions seja recalculado antes de atribuir
    setTimeout(() => {
      selectedSub.value = reverso.subetapa
      setTimeout(() => {
        selectedExec.value = reverso.execucao
      }, 0)
    }, 0)
  } else {
    selectedMacro.value = ''
    selectedSub.value = ''
    selectedExec.value = ''
  }
}

function resetarStatusDraft() {
  aplicarStatusNosSelects(cliente.value?.status)
}

async function salvarStatusSelecionado() {
  if (!cliente.value) return
  if (!canEditClientes.value) {
    notify.error('Acesso negado para editar status do cliente.')
    return
  }

  if (!statusComputado.value) {
    notify.error('Selecione macro-etapa, subetapa e execução antes de salvar.')
    return
  }

  const proximo = statusComputado.value
  const validacao = validarTransicaoStatusCliente({ atual: cliente.value.status, proximo })
  if (!validacao?.ok) {
    notify.error(validacao?.motivo || 'Transição de status não permitida.')
    return
  }

  savingStatus.value = true
  try {
    const { data } = await ClienteService.salvar(cliente.value.id, { status: proximo })
    cliente.value = { ...cliente.value, ...(data || {}), status: data?.status || proximo }
    notify.success('Status do cliente atualizado.')
  } catch (error) {
    console.error('Erro ao atualizar status do cliente:', error)
    const apiMsg = error?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : apiMsg || 'Não foi possível atualizar o status.')
  } finally {
    savingStatus.value = false
  }
}

function abrirSeletorArquivos() {
  if (!cliente.value) return
  if (!canCreateFiles.value) {
    notify.error('Acesso negado para enviar arquivos.')
    return
  }
  fileInputRef.value?.click?.()
}

async function onPickFiles(event) {
  const files = Array.from(event?.target?.files || [])
  if (!files.length || !cliente.value) return

  uploadingArquivos.value = true
  let enviados = 0
  try {
    for (const file of files) {
      await ArquivosService.upload({
        ownerType: 'CLIENTE',
        ownerId: cliente.value.id,
        file,
        prefixo: 'CLIENTE',
        nomeBase: getClienteNome(cliente.value),
      })
      enviados += 1
    }
    await carregarArquivos()
    notify.success(enviados === 1 ? 'Documento enviado.' : `${enviados} documentos enviados.`)
  } catch (error) {
    console.error('Erro ao enviar arquivos:', error)
    const apiMsg = error?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : apiMsg || 'Não foi possível enviar os documentos.')
  } finally {
    uploadingArquivos.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function visualizarArquivo(arquivo) {
  if (!arquivo?.id || !cliente.value) return
  const from = `/arquivos/importacao/${cliente.value.id}`
  const mime = String(arquivo.mime_type || '').toLowerCase()
  const path = mime.includes('pdf') ? `/arquivos/pdf/${arquivo.id}` : `/arquivos/${arquivo.id}`
  router.push({
    path,
    query: {
      name: arquivo.nome || arquivo.filename || `ARQUIVO_${arquivo.id}`,
      type: arquivo.mime_type || '',
      from,
      owner_type: 'CLIENTE',
      owner_id: String(cliente.value.id),
    },
  })
}

async function removerArquivo(arquivo) {
  if (!arquivo?.id || !canDeleteFiles.value) {
    notify.error('Acesso negado para remover arquivo.')
    return
  }

  const ok = await confirm.show(
    'Excluir Documento',
    `Deseja excluir o arquivo "${arquivo.nome || arquivo.filename || 'documento'}"?`,
  )
  if (!ok) return

  deletingFileId.value = Number(arquivo.id)
  try {
    await ArquivosService.remover(arquivo.id)
    arquivos.value = arquivos.value.filter((item) => Number(item.id) !== Number(arquivo.id))
    notify.success('Documento removido.')
  } catch (error) {
    console.error('Erro ao remover arquivo:', error)
    const apiMsg = error?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : apiMsg || 'Não foi possível remover o documento.')
  } finally {
    deletingFileId.value = null
  }
}

function getFileIcon(mime) {
  const value = String(mime || '').toLowerCase()
  if (value.includes('pdf')) return 'pi pi-file-pdf'
  if (value.includes('image')) return 'pi pi-image'
  if (value.includes('sheet') || value.includes('excel')) return 'pi pi-file-excel'
  if (value.includes('word')) return 'pi pi-file-word'
  return 'pi pi-file'
}

function formatSize(bytes) {
  const total = Number(bytes || 0)
  if (!total) return '0 KB'
  const kb = total / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await carregarCliente()
  await carregarArquivos()
})
</script>

<style scoped>
.arquivos-import {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.arquivos-import__toolbar-btn {
  min-height: 2.55rem;
  padding-inline: 1rem;
  border-radius: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.arquivos-import__content {
  padding-top: 0.55rem;
  padding-bottom: 1.9rem;
}

.arquivos-import__grid {
  align-items: start;
}

.arquivos-import__layout {
  width: 100%;
}

.arquivos-import__summary-bar {
  padding: 1rem 1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
  overflow: hidden;
}

.arquivos-import__summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  align-items: center;
}

.arquivos-import__summary-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.arquivos-import__summary-value {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arquivos-import__sidebar,
.arquivos-import__documents {
  overflow: hidden;
  background: transparent;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.arquivos-import__sidebar {
  padding: 1rem 1rem 1.15rem;
}

.arquivos-import__sidebar-head {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.45);
}

.arquivos-import__panel-head {
  background: transparent;
  padding: 1rem 1rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.45);
}

.arquivos-import__meta-label {
  display: block;
  margin-bottom: 0.15rem;
  color: var(--ds-color-text-soft);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.arquivos-import__status-form {
  display: grid;
  gap: 0.9rem;
  width: 100%;
  margin-inline: auto;
  padding-top: 1rem;
}

.arquivos-import__status-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto auto auto;
  align-items: end;
  gap: 0.85rem;
}

.arquivos-import__status-row > * {
  min-width: 0;
}

.arquivos-import__status-preview {
  border-style: dashed;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  white-space: nowrap;
}

.arquivos-import__status-actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  justify-content: flex-end;
}

.arquivos-import__status-btn {
  border-radius: 0.9rem !important;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.75rem;
}

.arquivos-import__documents-body {
  padding: 1.1rem 1rem 1.15rem;
}

.arquivos-import__file {
  border-radius: 0;
  border: 0;
  border-bottom: 1px solid rgba(214, 224, 234, 0.42);
  background: transparent;
  box-shadow: none;
}

.arquivos-import__file-icon {
  background: rgba(245, 248, 251, 0.9);
}

.dark .arquivos-import__file-icon {
  background: rgba(18, 30, 49, 0.62);
}

.arquivos-import__file-name {
  letter-spacing: -0.01em;
}

.arquivos-import__file-actions {
  gap: 0.2rem;
}

.arquivos-import__empty {
  width: min(100%, 980px);
  margin: 0 auto;
  border: 1px solid rgba(214, 224, 234, 0.55);
  border-radius: 1rem;
}

.arquivos-import__empty-state {
  border: 1px dashed rgba(188, 203, 221, 0.9);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.45);
}

.dark .arquivos-import__summary-bar,
.dark .arquivos-import__sidebar,
.dark .arquivos-import__documents,
.dark .arquivos-import__sidebar-head,
.dark .arquivos-import__panel-head,
.dark .arquivos-import__empty {
  border-color: rgba(51, 71, 102, 0.55);
}

.dark .arquivos-import__file {
  border-color: rgba(51, 71, 102, 0.55);
}

.dark .arquivos-import__empty-state {
  border-color: rgba(71, 85, 105, 0.85);
  background: rgba(15, 23, 42, 0.28);
}

@media (min-width: 768px) {
  .arquivos-import__content {
    padding-top: 0.7rem;
    padding-bottom: 2rem;
  }

  .arquivos-import__summary-bar {
    padding-inline: 1.15rem;
  }

  .arquivos-import__sidebar {
    padding-inline: 1.15rem;
  }

  .arquivos-import__panel-head,
  .arquivos-import__documents-body {
    padding-inline: 1.15rem;
  }
}

@media (min-width: 1024px) {
  .arquivos-import__content {
    padding-top: 0.75rem;
    padding-bottom: 2.1rem;
  }

  .arquivos-import__summary-bar {
    padding-inline: 1.25rem;
  }

  .arquivos-import__sidebar {
    padding-inline: 1.25rem;
  }

  .arquivos-import__panel-head,
  .arquivos-import__documents-body {
    padding-inline: 1.25rem;
  }
}

@media (max-width: 1280px) {
  .arquivos-import__summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .arquivos-import__content {
    padding-bottom: 1.25rem;
  }

  .arquivos-import__summary-bar,
  .arquivos-import__sidebar,
  .arquivos-import__panel-head,
  .arquivos-import__documents-body {
    padding-inline: 0.85rem;
  }

  .arquivos-import__actions,
  .arquivos-import__status-actions {
    width: 100%;
  }

  .arquivos-import__toolbar-btn,
  .arquivos-import__status-btn {
    width: 100%;
    justify-content: center;
  }

  .arquivos-import__summary-row {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  .arquivos-import__summary-value {
    white-space: normal;
  }

  .arquivos-import__status-form {
    width: 100%;
  }

  .arquivos-import__status-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .arquivos-import__status-row > * {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .arquivos-import__summary-bar,
  .arquivos-import__sidebar,
  .arquivos-import__panel-head,
  .arquivos-import__documents-body {
    padding-inline: 0.75rem;
  }

  .arquivos-import__file {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }
}
</style>
