<template>
  <PageShell :padded="false">
    <section class="funcionarios-list animate-page-in">
      <PageHeader
        title="Equipe"
        subtitle="Gestão de capital humano, acessos e custos da operação"
        icon="pi pi-id-card"
      >
        <template #actions>
          <div class="funcionarios-list__actions">
            <div class="funcionarios-list__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar colaborador, documento, cargo, setor ou unidade..."
              />
            </div>

            <div class="funcionarios-list__status-filter" role="group" aria-label="Filtrar colaboradores por status">
              <button
                type="button"
                class="funcionarios-list__status-chip"
                :class="{ 'is-active': filtroStatus === 'ATIVO' }"
                @click="filtroStatus = 'ATIVO'"
              >
                Ativos
              </button>
              <button
                type="button"
                class="funcionarios-list__status-chip"
                :class="{ 'is-active': filtroStatus === 'INATIVO' }"
                @click="filtroStatus = 'INATIVO'"
              >
                Inativos
              </button>
              <button
                type="button"
                class="funcionarios-list__status-chip"
                :class="{ 'is-active': filtroStatus === 'TODOS' }"
                @click="filtroStatus = 'TODOS'"
              >
                Todos
              </button>
            </div>

            <div
              v-if="selectedCount"
              class="funcionarios-list__bulk-actions"
            >
              <span class="funcionarios-list__bulk-count">
                {{ selectedCount }} selecionado(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                :loading="pdfLoading"
                @click="gerarPdfSelecionados"
              >
                <i class="pi pi-image"></i>
                PNG
              </Button>
            </div>

            <Button
              v-if="can('funcionarios.criar')"
              variant="primary"
              @click="novo"
            >
              <i class="pi pi-plus"></i>
              Novo Colaborador
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="funcionarios-list__content">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum colaborador encontrado."
          :boxed="false"
          :flush="false"
        >
          <template #cell-nome="{ row }">
            <div class="funcionarios-list__identity">
              <CustomCheckbox
                :modelValue="isSelected(row.id)"
                @update:modelValue="toggle(row.id)"
                label=""
                class="funcionarios-list__checkbox"
              />

              <div class="funcionarios-list__initials">
                {{ row.iniciais }}
              </div>

              <div class="funcionarios-list__identity-copy">
                <span class="funcionarios-list__primary">
                  {{ row.nome }}
                </span>
                <span class="funcionarios-list__secondary">
                  {{ row.cpf_formatado || 'Sem CPF' }}
                  <span v-if="row.rg_formatado" class="funcionarios-list__secondary-detail">RG: {{ row.rg_formatado }}</span>
                </span>
              </div>
            </div>
          </template>

          <template #cell-cargo="{ row }">
            <div class="funcionarios-list__stack">
              <span class="funcionarios-list__primary">{{ row.cargo || '-' }}</span>
              <span class="funcionarios-list__secondary">{{ row.setor || 'Sem setor' }}</span>
            </div>
          </template>

          <template #cell-unidade="{ row }">
            <div class="funcionarios-list__stack">
              <span class="funcionarios-list__primary">{{ row.unidade || '-' }}</span>
              <span class="funcionarios-list__secondary">{{ row.setor_resumo }}</span>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <div class="funcionarios-list__stack">
              <span class="funcionarios-list__primary">{{ row.contato_principal }}</span>
              <span class="funcionarios-list__secondary">{{ row.contato_secundario }}</span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span
              class="ds-status-pill"
              :class="row.status_class"
            >
              {{ row.status_label }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="funcionarios-list__row-actions">
              <button
                v-if="can('funcionarios.editar')"
                type="button"
                class="funcionarios-list__action-btn"
                @click="editar(row.id)"
              >
                <i class="pi pi-pencil"></i>
                Editar
              </button>

              <button
                v-if="can('funcionarios.excluir')"
                type="button"
                class="funcionarios-list__action-btn funcionarios-list__action-btn--danger"
                @click="confirmarExcluirFuncionario(row)"
              >
                <i class="pi pi-trash"></i>
                Excluir
              </button>
            </div>
          </template>
        </Table>

        <TablePagination
          v-if="total > 0"
          :page="page"
          :page-size="pageSize"
          :total="total"
          @update:page="setPage"
        />
      </div>
    </section>

    <!-- Modal de exportação no mesmo template (evita quebrar navegação no Tauri) -->
    <Teleport to="body">
      <Transition name="modal-bounce">
        <div
          v-if="pdfModalOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          @click.self="fecharPdfModal"
        >
          <div class="w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-border-ui overflow-hidden flex flex-col shadow-2xl">
            <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <h3 class="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <i class="pi pi-image text-emerald-500"></i>
                Relatório de Funcionários
              </h3>
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center rounded-xl border border-border-ui text-slate-500 hover:text-rose-500 hover:border-rose-400 transition-all"
                @click="fecharPdfModal"
                aria-label="Fechar"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>
            <div class="flex-1 min-h-0 flex flex-col bg-slate-100 dark:bg-slate-900">
              <div
                v-if="pdfModalLoading"
                class="flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-slate-400"
              >
                Carregando imagem...
              </div>
              <div
                v-else-if="pdfModalError"
                class="flex-1 flex items-center justify-center px-6 text-center text-[11px] font-black uppercase tracking-widest text-rose-600"
              >
                {{ pdfModalError }}
              </div>
              <div
                v-else-if="previewKind === 'image' && pdfBlobUrl"
                class="flex-1 min-h-0 overflow-auto bg-slate-100 dark:bg-slate-900 p-6"
              >
                <img
                  :src="pdfBlobUrl"
                  class="mx-auto max-w-full h-auto rounded-2xl border border-border-ui bg-white shadow-sm"
                  alt="Relatório de funcionários"
                >
              </div>
              <iframe
                v-else-if="pdfBlobUrl"
                :src="pdfBlobUrl"
                class="w-full h-full border-0 flex-1 min-h-0"
                title="Relatório Funcionários"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FuncionarioService, ArquivosService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { onlyNumbers, maskCPF, maskRG } from '@/utils/masks'
import { usePagination } from '@/composables/usePagination'


definePage({ meta: { perm: 'funcionarios.ver' } })

const router = useRouter()
const loading = ref(true)
const filtro = ref('')
const filtroStatus = ref('ATIVO')
const funcionarios = ref([])
const selectedIds = ref(new Set())
const pdfLoading = ref(false)
const pdfModalOpen = ref(false)
const pdfBlobUrl = ref('')
const pdfModalLoading = ref(false)
const pdfModalError = ref('')
const previewKind = ref('image')

const columns = computed(() => {
  return [
    { key: 'nome', label: 'Colaborador', width: '27%' },
    { key: 'cargo', label: 'Cargo', width: '17%' },
    { key: 'unidade', label: 'Unidade', width: '14%' },
    { key: 'contato', label: 'Contato', width: '22%' },
    { key: 'status', label: 'Acesso', align: 'center', width: '8%' },
    { key: 'acoes', label: 'Acoes', align: 'center', width: '12%' },
  ]
})

function toggle(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function isSelected(id) {
  return selectedIds.value.has(id)
}

const selectedCount = computed(() => selectedIds.value.size)

function normUpper(v) {
  return String(v || '').trim().toUpperCase()
}

function getStatus(row) {
  const s = normUpper(row?.status)
  if (s === 'ATIVO' || s === 'INATIVO') return s
  return 'INATIVO'
}

const funcionariosFiltrados = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  const termoDigits = onlyNumbers(termo)

  return (funcionarios.value || []).filter((f) => {
    const status = getStatus(f)
    if (filtroStatus.value === 'ATIVO' && status !== 'ATIVO') return false
    if (filtroStatus.value === 'INATIVO' && status !== 'INATIVO') return false

    if (!termo) return true

    const nome = String(f.nome || '').toLowerCase()
    const cargoTxt = String(f.cargo || '').toLowerCase()
    const setorTxt = String(f.setor || '').toLowerCase()
    const unidadeTxt = String(f.unidade || '').toLowerCase()

    const cpfDigits = onlyNumbers(String(f.cpf || ''))
    const rgDigits = onlyNumbers(String(f.rg || ''))

    const bateTexto =
      nome.includes(termo) ||
      cargoTxt.includes(termo) ||
      setorTxt.includes(termo) ||
      unidadeTxt.includes(termo)

    const bateDocs = termoDigits
      ? (cpfDigits.includes(termoDigits) || rgDigits.includes(termoDigits))
      : false

    const bateHorario = [
      f.horario_entrada_1,
      f.horario_saida_1,
      f.horario_entrada_2,
      f.horario_saida_2,
      f.horario_sabado_entrada_1,
      f.horario_sabado_saida_1,
    ].some((v) => String(v || '').toLowerCase().includes(termo))

    const bateSalario = termoDigits
      ? [
          f.salario_base,
          f.salario_adicional,
          f.custo_hora,
          f.vale,
          f.vale_transporte,
        ].some((v) => onlyNumbers(String(v ?? '')).includes(termoDigits))
      : false

    return bateTexto || bateDocs || bateHorario || bateSalario
  })
})

const { page, setPage, total, totalPages, pageSize, rowsToShow } = usePagination(
  funcionariosFiltrados,
  { pageSize: 15 },
)
watch(filtro, () => setPage(1))

function getStatusLabel(row) {
  return row?.status_acesso ?? getStatus(row)
}

function getStatusClass(status) {
  if (status === 'Pendente de Senha') return 'ds-status-pill--warning'
  if (status === 'Ativo' || status === 'ATIVO') return 'ds-status-pill--success'
  return 'ds-status-pill--neutral'
}

const rows = computed(() =>
  rowsToShow.value.map((row) => {
    const nome = String(row.nome || '-').trim() || '-'
    const partes = nome.split(/\s+/).filter(Boolean)
    const iniciais = (partes[0]?.[0] || '') + (partes[1]?.[0] || partes[0]?.[1] || '')
    const statusLabel = getStatusLabel(row)

    return {
      ...row,
      iniciais: String(iniciais || '?').toUpperCase(),
      cpf_formatado: row.cpf ? maskCPF(row.cpf) : '',
      rg_formatado: row.rg ? maskRG(row.rg) : '',
      setor_resumo: row.setor || 'Sem setor',
      contato_principal: row.email || row.whatsapp || row.telefone || 'Sem contato cadastrado',
      contato_secundario: row.whatsapp || row.telefone || 'Sem telefone cadastrado',
      status_label: statusLabel,
      status_class: getStatusClass(statusLabel),
    }
  }),
)

async function carregar() {
  loading.value = true
  try {
    const resp = await FuncionarioService.listar()
    const raw =
      (Array.isArray(resp?.data) && resp.data) ||
      (Array.isArray(resp) && resp) ||
      (Array.isArray(resp?.data?.data) && resp.data.data) ||
      (Array.isArray(resp?.data?.items) && resp.data.items) ||
      (Array.isArray(resp?.data?.rows) && resp.data.rows) ||
      [] 

    funcionarios.value = raw.map(f => ({
      ...f,
      nome: f.nome ?? f.nome_completo ?? '',
      cargo: f.cargo ?? f.funcao ?? '',
      setor: f.setor ?? '',
      unidade: f.unidade ?? '',
      rg: f.rg ?? '',
      status_acesso: f.status_acesso ?? (f.status === 'INATIVO' ? 'Inativo' : 'Ativo'),
    }))
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao carregar lista de funcionários.')
  } finally {
    loading.value = false
  }
}

async function novo() {
  if (!can('funcionarios.criar')) return notify.error('Acesso negado.')
  router.push('/funcionarios/novo')
}

const editar = (id) => {

  if (!can('funcionarios.editar')) return notify.error('Acesso negado.')
  router.push(`/funcionarios/${id}`)
}

async function confirmarExcluirFuncionario(row) {
  if (!can('funcionarios.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir Funcionário',
    `Deseja remover "${row?.nome}"? Esta ação não pode ser desfeita.`,
  )
  if (ok) await excluir(row)
}

async function excluir(row) {
  try {
    await FuncionarioService.remover(row.id)
    funcionarios.value = funcionarios.value.filter((f) => f.id !== row.id)
    selectedIds.value.delete(row.id)
    notify.success('Funcionário removido.')
  } catch (err) {
    notify.error('Erro ao tentar excluir funcionário.')
  }
}

onMounted(carregar)

onBeforeUnmount(() => {
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
})

function fecharPdfModal() {
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
    pdfBlobUrl.value = ''
  }
  pdfModalError.value = ''
  previewKind.value = 'image'
  pdfModalOpen.value = false
}

async function gerarPdfSelecionados() {
  if (!selectedCount.value) return notify.warn('Selecione pelo menos 1 funcionário.')
  if (!can('funcionarios.ver')) return notify.error('Acesso negado.')

  pdfLoading.value = true
  pdfModalError.value = ''
  try {
    const ids = Array.from(selectedIds.value)
    const resp = await FuncionarioService.gerarPdf(ids, 'png')
    const data = resp?.data || resp
    const arquivoId = data?.arquivoId || data?.arquivo_id

    if (!arquivoId) {
      notify.error('Não foi possível gerar a imagem agora.')
      return
    }

    pdfModalOpen.value = true
    pdfModalLoading.value = true
    if (pdfBlobUrl.value) {
      URL.revokeObjectURL(pdfBlobUrl.value)
      pdfBlobUrl.value = ''
    }
    try {
      const res = await ArquivosService.baixarBlob(arquivoId)
      const contentType = String(res?.headers?.['content-type'] || 'image/png')
      const blob = new Blob([res.data], { type: contentType })
      previewKind.value = contentType.startsWith('image/') ? 'image' : 'document'
      pdfBlobUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      console.error(e)
      pdfModalError.value = 'Falha ao carregar a imagem.'
      notify.error('Falha ao carregar a imagem.')
    } finally {
      pdfModalLoading.value = false
    }
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao gerar imagem.')
  } finally {
    pdfLoading.value = false
  }
}
</script>

<style scoped>
.funcionarios-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.funcionarios-list :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  backdrop-filter: none;
}

.funcionarios-list :deep(.ds-header-block) {
  padding-top: 1.25rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .funcionarios-list :deep(.ds-header-block) {
    padding-top: 1.6rem;
    padding-bottom: 1.15rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .funcionarios-list :deep(.ds-header-block) {
    padding-top: 1.85rem;
    padding-bottom: 1.25rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.funcionarios-list :deep(.ds-header-title) {
  font-size: clamp(1.48rem, 1.1rem + 0.7vw, 2rem);
  font-weight: 620;
  letter-spacing: -0.03em;
}

.funcionarios-list :deep(.ds-header-subtitle) {
  max-width: 40rem;
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 430;
}

.funcionarios-list :deep(.ds-header-icon) {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  border-color: rgba(214, 224, 234, 0.7);
  background: transparent;
  color: var(--ds-color-primary);
  font-size: 0.92rem;
  box-shadow: none;
}

.dark .funcionarios-list :deep(.ds-header-icon) {
  border-color: rgba(51, 71, 102, 0.72);
  background: transparent;
}

.funcionarios-list__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  width: 100%;
  flex-wrap: wrap;
}

.funcionarios-list__search {
  width: 100%;
  order: 1;
}

.funcionarios-list__status-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-surface) 96%, white 4%);
}

.funcionarios-list__status-chip {
  border: 0;
  border-radius: 999px;
  padding: 0.52rem 0.82rem;
  background: transparent;
  color: var(--ds-color-text-faint);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background-color 160ms ease, color 160ms ease;
}

.funcionarios-list__status-chip.is-active {
  background: color-mix(in srgb, var(--ds-color-primary) 12%, white 88%);
  color: var(--ds-color-primary-strong);
}

.funcionarios-list__bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.funcionarios-list__bulk-count {
  color: var(--ds-color-text-faint);
  font-size: 0.7rem;
  font-weight: 520;
}

.funcionarios-list :deep(.ds-search-shell) {
  position: relative;
}

.funcionarios-list :deep(.ds-search-input) {
  height: 2.7rem;
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 1px;
  border-radius: 0;
  border-color: rgba(214, 224, 234, 0.92);
  background: transparent;
  box-shadow: none;
  padding-left: 1.9rem;
  padding-right: 0.25rem;
  font-size: 0.88rem;
  color: var(--ds-color-text);
  position: relative;
  z-index: 1;
}

.dark .funcionarios-list :deep(.ds-search-input) {
  border-color: rgba(51, 71, 102, 0.84);
  background: transparent;
}

.funcionarios-list :deep(.ds-search-input::placeholder) {
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 400;
}

.funcionarios-list :deep(.ds-search-input:hover) {
  border-color: rgba(188, 203, 221, 0.96);
}

.funcionarios-list :deep(.ds-search-input:focus) {
  border-color: rgba(44, 111, 163, 0.28);
  box-shadow: none;
}

.funcionarios-list :deep(.ds-search-icon) {
  position: absolute;
  top: 50%;
  left: 0.35rem;
  transform: translateY(-50%);
  z-index: 2;
  color: var(--ds-color-primary);
  opacity: 1;
  pointer-events: none;
}

.funcionarios-list :deep(.ds-search-action--clear) {
  right: 0;
}

.funcionarios-list :deep(.ds-btn--primary) {
  min-height: 2.55rem;
  padding-inline: 1rem;
  border-radius: 0.9rem;
  box-shadow: none;
  filter: none;
}

@media (min-width: 640px) {
  .funcionarios-list__search {
    width: 19rem;
    order: 0;
  }
}

.funcionarios-list__content {
  width: min(100%, 1460px);
  margin-inline: auto;
  padding: 0.2rem 0.65rem 1.5rem;
}

.funcionarios-list :deep(.ds-table__element) {
  table-layout: fixed;
  min-width: 1120px;
}

.funcionarios-list :deep(.ds-table-head-row) {
  background: transparent;
  border-bottom-color: rgba(214, 224, 234, 0.55);
}

.funcionarios-list :deep(.ds-table__head-cell) {
  padding-top: 0.62rem;
  padding-bottom: 0.45rem;
  color: var(--ds-color-text-faint);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: none;
  white-space: normal;
}

.funcionarios-list :deep(.ds-table__head-cell:last-child),
.funcionarios-list :deep(.ds-table__cell:last-child) {
  padding-right: 0.75rem;
}

.funcionarios-list :deep(.ds-table__cell) {
  padding-top: 0.64rem;
  padding-bottom: 0.64rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.42);
}

.funcionarios-list :deep(.ds-table__head-cell),
.funcionarios-list :deep(.ds-table__cell) {
  padding-left: 0.72rem;
  padding-right: 0.72rem;
}

.funcionarios-list :deep(.ds-table__head-cell:last-child),
.funcionarios-list :deep(.ds-table__cell:last-child) {
  text-align: center;
}

.funcionarios-list :deep(.ds-table__row:hover) {
  background: rgba(255, 255, 255, 0.38);
}

.dark .funcionarios-list :deep(.ds-table__row:hover) {
  background: rgba(18, 30, 49, 0.32);
}

.funcionarios-list :deep(.ds-table__row:hover td:first-child) {
  box-shadow: inset 2px 0 0 0 rgba(188, 203, 221, 0.9);
}

.funcionarios-list :deep(.ds-table-pagination) {
  padding-inline: 1rem;
}

@media (min-width: 768px) {
  .funcionarios-list :deep(.ds-table-pagination) {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .funcionarios-list :deep(.ds-table-pagination) {
    padding-inline: 2rem;
  }
}

.funcionarios-list__identity {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.funcionarios-list__checkbox {
  flex-shrink: 0;
}

.funcionarios-list__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.9);
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.dark .funcionarios-list__initials {
  background: rgba(18, 30, 49, 0.62);
  border-color: rgba(51, 71, 102, 0.76);
}

.funcionarios-list__identity-copy,
.funcionarios-list__stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.funcionarios-list__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.4;
  text-transform: none;
  letter-spacing: -0.01em;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.funcionarios-list__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  text-transform: none;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.funcionarios-list__secondary-detail {
  margin-left: 0.5rem;
}

.funcionarios-list__row-actions {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
}

.funcionarios-list__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 1.95rem;
  padding-inline: 0.55rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 0.7rem;
  color: var(--ds-color-text-soft);
  font-size: 0.68rem;
  font-weight: 600;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  flex-shrink: 0;
}

.funcionarios-list__action-btn:hover {
  border-color: rgba(44, 111, 163, 0.24);
  color: var(--ds-color-primary);
  background: rgba(44, 111, 163, 0.05);
}

.funcionarios-list__action-btn--danger:hover {
  border-color: rgba(244, 63, 94, 0.2);
  color: #e11d48;
  background: rgba(244, 63, 94, 0.06);
}

.funcionarios-list :deep(.ds-status-pill) {
  max-width: 100%;
  justify-content: center;
  padding-inline: 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

.funcionarios-list :deep(.ds-table__scroll) {
  overflow-x: auto;
}

.funcionarios-list :deep(.ds-checkbox) {
  padding-left: 0;
  padding-right: 0;
  border-radius: 0;
  gap: 0.55rem;
}

.funcionarios-list :deep(.ds-checkbox:hover) {
  background: transparent;
  border-color: transparent;
}

.funcionarios-list :deep(.ds-checkbox__box) {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
}

@media (max-width: 1280px) {
  .funcionarios-list__content {
    width: 100%;
    padding-inline: 0.9rem;
  }

  .funcionarios-list :deep(.ds-table__element) {
    min-width: 1000px;
  }
}

@media (max-width: 1100px) {
  .funcionarios-list :deep(.ds-table__head-cell),
  .funcionarios-list :deep(.ds-table__cell) {
    padding-left: 0.62rem;
    padding-right: 0.62rem;
  }

  .funcionarios-list :deep(.ds-table__head-cell) {
    font-size: 11px;
  }

  .funcionarios-list :deep(.ds-table__element) {
    min-width: 900px;
  }

  .funcionarios-list__primary {
    font-size: 0.88rem;
  }

  .funcionarios-list__secondary {
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .funcionarios-list__content {
    padding-inline: 0.65rem;
    padding-bottom: 1.1rem;
  }

  .funcionarios-list :deep(.ds-table__element) {
    min-width: 780px;
  }

  .funcionarios-list :deep(.ds-table__head-cell),
  .funcionarios-list :deep(.ds-table__cell) {
    padding-left: 0.56rem;
    padding-right: 0.56rem;
  }

  .funcionarios-list__identity {
    gap: 0.48rem;
  }

  .funcionarios-list__initials {
    width: 1.9rem;
    height: 1.9rem;
  }
}

@media (max-width: 560px) {
  .funcionarios-list__content {
    padding-inline: 0.5rem;
  }

  .funcionarios-list :deep(.ds-table__element) {
    min-width: 720px;
  }

  .funcionarios-list :deep(.ds-table-pagination) {
    padding-inline: 0.5rem;
  }
}
</style>
