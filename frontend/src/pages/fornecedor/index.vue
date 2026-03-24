<template>
  <PageShell :padded="false">
    <section class="fornecedor-list animate-page-in">
      <PageHeader
        title="Fornecedores"
        subtitle="Base de parceiros comerciais"
        icon="pi pi-truck"
      >
        <template #actions>
          <div class="fornecedor-list__actions">
            <div class="fornecedor-list__search">
              <SearchInput
                v-model="busca"
                placeholder="Buscar fornecedor, cidade, endereço ou bairro..."
              />
            </div>

            <Button
              v-if="can('fornecedores.criar')"
              variant="primary"
              @click="router.push('/fornecedor/novo')"
            >
              <i class="pi pi-plus"></i>
              Novo Fornecedor
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="fornecedor-list__content">
        <Table
          :columns="columns"
          :rows="rowsToShow"
          :loading="loading"
          empty-text="Nenhum fornecedor encontrado."
          :boxed="false"
          :flush="false"
        >
          <template #cell-razao_social="{ row }">
            <div class="fornecedor-list__identity">
              <div class="fornecedor-list__initials">
                {{ (row.nome_fantasia || row.razao_social || '?').substring(0, 2).toUpperCase() }}
              </div>
              <div class="fornecedor-list__identity-copy">
                <span class="fornecedor-list__primary">
                  {{ row.nome_fantasia || row.razao_social || '-' }}
                </span>
                <span class="fornecedor-list__secondary">
                  {{ row.razao_social || '-' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-localizacao="{ row }">
            <div class="fornecedor-list__stack">
              <span class="fornecedor-list__primary">{{ [row.endereco, row.numero, row.bairro].filter(Boolean).join(', ') || '-' }}</span>
              <span class="fornecedor-list__secondary">
                {{ row.cidade || '-' }}
              </span>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <span class="fornecedor-list__primary fornecedor-list__contact">{{ row.whatsapp || row.telefone || row.email || '-' }}</span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="fornecedores.editar"
                perm-delete="fornecedores.excluir"
                @edit="editarFornecedor"
                @delete="excluirFornecedor"
              />
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
  </PageShell>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { usePagination } from '@/composables/usePagination'

definePage({ meta: { perm: 'fornecedores.ver' } })

const router = useRouter()
const busca = ref('')
const loading = ref(false)
const fornecedores = ref([])

const rowsFiltrados = computed(() => {
  let filtrados = fornecedores.value
  if (busca.value) {
    const termo = busca.value.toLowerCase().trim()
    filtrados = filtrados.filter((f) =>
      (f.razao_social && f.razao_social.toLowerCase().includes(termo)) ||
      (f.nome_fantasia && f.nome_fantasia.toLowerCase().includes(termo)) ||
      (f.email && f.email.toLowerCase().includes(termo)) ||
      (f.whatsapp && f.whatsapp.includes(termo)) ||
      (f.telefone && f.telefone.includes(termo)) ||
      (f.endereco && f.endereco.toLowerCase().includes(termo)) ||
      (f.numero && String(f.numero).toLowerCase().includes(termo)) ||
      (f.bairro && f.bairro.toLowerCase().includes(termo)) ||
      (f.cidade && f.cidade.toLowerCase().includes(termo))
    )
  }
  return filtrados
})

const { page, setPage, total, totalPages, pageSize, rowsToShow } = usePagination(
  rowsFiltrados,
  { pageSize: 15 },
)
watch(busca, () => setPage(1))

function editarFornecedor(id) {
  if (!can('fornecedores.editar')) return notify.error('Acesso negado.')
  router.push(`/fornecedor/${id}`)
}

async function excluirFornecedor(id) {
  if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Fornecedor?', 'Esta ação não pode ser desfeita.')
  if (!ok) return
  const cleanId = Number(id)
  try {
    await FornecedorService.remover(cleanId)
    fornecedores.value = fornecedores.value.filter((f) => Number(f.id) !== cleanId)
    notify.success('Fornecedor removido com sucesso')
  } catch (e) {
    console.error('Erro ao excluir fornecedor:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Não foi possível excluir o fornecedor'))
  }
}

const columns = [
  { key: 'razao_social', label: 'Fornecedor', width: '38%' },
  { key: 'localizacao', label: 'Localizacao', width: '34%' },
  { key: 'contato', label: 'Contato', width: '18%' },
  { key: 'acoes', label: 'Acoes', align: 'center', width: '10%' }
]

const carregarFornecedores = async () => {
  loading.value = true
  try {
    const res = await FornecedorService.listar()
    fornecedores.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error)
    notify.error('Falha ao carregar fornecedores.')
    fornecedores.value = []
  } finally {
    loading.value = false
  }
}

onMounted(carregarFornecedores)
</script>

<style scoped>
.fornecedor-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dark .fornecedor-list {
  background: var(--ds-color-surface);
}

.fornecedor-list :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  backdrop-filter: none;
}

.fornecedor-list :deep(.ds-header-block) {
  padding-top: 1.25rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .fornecedor-list :deep(.ds-header-block) {
    padding-top: 1.6rem;
    padding-bottom: 1.15rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .fornecedor-list :deep(.ds-header-block) {
    padding-top: 1.85rem;
    padding-bottom: 1.25rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.fornecedor-list :deep(.ds-header-title) {
  font-size: clamp(1.48rem, 1.1rem + 0.7vw, 2rem);
  font-weight: 620;
  letter-spacing: -0.03em;
}

.fornecedor-list :deep(.ds-header-subtitle) {
  max-width: 38rem;
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 430;
}

.fornecedor-list :deep(.ds-header-icon) {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  border-color: rgba(214, 224, 234, 0.7);
  background: transparent;
  color: var(--ds-color-primary);
  font-size: 0.92rem;
  box-shadow: none;
}

.dark .fornecedor-list :deep(.ds-header-icon) {
  border-color: rgba(51, 71, 102, 0.72);
  background: transparent;
}

.fornecedor-list__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  width: 100%;
  flex-wrap: wrap;
}

.fornecedor-list__search {
  width: 100%;
  order: 1;
}

.fornecedor-list :deep(.ds-search-shell) {
  position: relative;
}

.fornecedor-list :deep(.ds-search-input) {
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

.dark .fornecedor-list :deep(.ds-search-input) {
  border-color: rgba(51, 71, 102, 0.84);
  background: transparent;
}

.fornecedor-list :deep(.ds-search-input::placeholder) {
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 400;
}

.fornecedor-list :deep(.ds-search-input:hover) {
  border-color: rgba(188, 203, 221, 0.96);
}

.fornecedor-list :deep(.ds-search-input:focus) {
  border-color: rgba(44, 111, 163, 0.28);
  box-shadow: none;
}

.fornecedor-list :deep(.ds-search-icon) {
  position: absolute;
  top: 50%;
  left: 0.35rem;
  transform: translateY(-50%);
  z-index: 2;
  color: var(--ds-color-primary);
  opacity: 1;
  pointer-events: none;
}

.fornecedor-list :deep(.ds-search-shell:focus-within .ds-search-icon) {
  color: var(--ds-color-primary);
}

.fornecedor-list :deep(.ds-search-action--clear) {
  right: 0;
}

.fornecedor-list :deep(.ds-btn--primary) {
  min-height: 2.55rem;
  padding-inline: 1rem;
  border-radius: 0.9rem;
  box-shadow: none;
  filter: none;
}

@media (min-width: 640px) {
  .fornecedor-list__search {
    width: 18rem;
    order: 0;
  }
}

.fornecedor-list__content {
  width: min(100%, 1460px);
  margin-inline: auto;
  padding: 0.2rem 0.65rem 1.5rem;
}

.fornecedor-list :deep(.ds-table__element) {
  table-layout: fixed;
  min-width: 980px;
}

.fornecedor-list :deep(.ds-table-head-row) {
  background: transparent;
  border-bottom-color: rgba(214, 224, 234, 0.55);
}

.fornecedor-list :deep(.ds-table__head-cell) {
  padding-top: 0.62rem;
  padding-bottom: 0.45rem;
  color: var(--ds-color-text-faint);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: none;
  white-space: normal;
}

.fornecedor-list :deep(.ds-table__head-cell:last-child) {
  padding-right: 1rem;
}

.fornecedor-list :deep(.ds-table__cell) {
  padding-top: 0.64rem;
  padding-bottom: 0.64rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.42);
}

.fornecedor-list :deep(.ds-table__head-cell),
.fornecedor-list :deep(.ds-table__cell) {
  padding-left: 0.72rem;
  padding-right: 0.72rem;
}

.fornecedor-list :deep(.ds-table__cell:last-child) {
  padding-right: 1rem;
}

.fornecedor-list :deep(.ds-table__scroll) {
  overflow-x: auto;
}

.fornecedor-list :deep(.ds-table__row:hover) {
  background: rgba(255, 255, 255, 0.38);
}

.dark .fornecedor-list :deep(.ds-table__row:hover) {
  background: rgba(18, 30, 49, 0.32);
}

.fornecedor-list :deep(.ds-table__row:hover td:first-child) {
  box-shadow: inset 2px 0 0 0 rgba(188, 203, 221, 0.9);
}

.fornecedor-list :deep(.ds-table-pagination) {
  padding-inline: 1rem;
}

@media (min-width: 768px) {
  .fornecedor-list :deep(.ds-table-pagination) {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .fornecedor-list :deep(.ds-table-pagination) {
    padding-inline: 2rem;
  }
}

.fornecedor-list__identity {
  display: flex;
  align-items: center;
  gap: 0.58rem;
  min-width: 0;
}

.fornecedor-list__initials {
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

.dark .fornecedor-list__initials {
  background: rgba(18, 30, 49, 0.62);
  border-color: rgba(51, 71, 102, 0.76);
}

.fornecedor-list__identity-copy,
.fornecedor-list__stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fornecedor-list__primary {
  color: var(--ds-color-text);
  font-size: 0.94rem;
  font-weight: 540;
  line-height: 1.4;
  text-transform: none;
  letter-spacing: -0.01em;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fornecedor-list__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.74rem;
  font-weight: 430;
  line-height: 1.45;
  text-transform: none;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fornecedor-list__contact {
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 1280px) {
  .fornecedor-list__content {
    width: 100%;
    padding-inline: 0.9rem;
  }

  .fornecedor-list :deep(.ds-table__element) {
    min-width: 900px;
  }
}

@media (max-width: 1100px) {
  .fornecedor-list :deep(.ds-table__head-cell),
  .fornecedor-list :deep(.ds-table__cell) {
    padding-left: 0.62rem;
    padding-right: 0.62rem;
  }

  .fornecedor-list :deep(.ds-table__head-cell) {
    font-size: 11px;
  }

  .fornecedor-list :deep(.ds-table__element) {
    min-width: 820px;
  }

  .fornecedor-list__primary {
    font-size: 0.9rem;
  }

  .fornecedor-list__secondary {
    font-size: 0.72rem;
  }
}

@media (max-width: 768px) {
  .fornecedor-list__content {
    padding-inline: 0.65rem;
    padding-bottom: 1.1rem;
  }

  .fornecedor-list :deep(.ds-table__element) {
    min-width: 700px;
  }

  .fornecedor-list :deep(.ds-table__head-cell),
  .fornecedor-list :deep(.ds-table__cell) {
    padding-left: 0.56rem;
    padding-right: 0.56rem;
  }

  .fornecedor-list__identity {
    gap: 0.48rem;
  }

  .fornecedor-list__initials {
    width: 1.9rem;
    height: 1.9rem;
  }
}

@media (max-width: 560px) {
  .fornecedor-list__content {
    padding-inline: 0.5rem;
  }

  .fornecedor-list :deep(.ds-table__element) {
    min-width: 620px;
  }

  .fornecedor-list :deep(.ds-table-pagination) {
    padding-inline: 0.5rem;
  }
}
</style>
