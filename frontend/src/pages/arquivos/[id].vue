<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    <PageHeader title="Arquivos" subtitle="Gestão de anexos" icon="pi pi-folder" />

    <Card>
      <div class="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div class="w-full sm:w-80">
          <SearchInput v-model="q" mode="search" placeholder="Buscar arquivo..." />
        </div>

        <div class="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="md" class="!h-10" @click="recarregar">
            Recarregar
          </Button>

          <Button
            v-if="can('arquivos.criar')"
            variant="primary"
            size="md"
            class="!h-10"
            @click="abrirPicker"
          >
            Enviar
          </Button>

          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="onPickFile"
          />
        </div>
      </div>

      <div class="px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span v-if="ownerType && ownerId">
          CONTEXTO: {{ ownerType }} #{{ ownerId }} <span v-if="categoria">| {{ categoria }}</span>
        </span>
        <span v-else class="text-rose-500">
          owner_type e owner_id são obrigatórios para listar.
        </span>
      </div>

      <Table
        :columns="columns"
        :rows="rowsFiltradas"
        :loading="loading"
        :empty-text="ownerType && ownerId ? 'Nenhum arquivo encontrado' : 'Informe o contexto (owner_type/owner_id)'"
        :boxed="false"
      >
        <template #cell-arquivo="{ row }">
          <div class="flex items-center gap-3 py-2">
            <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <i class="pi pi-file"></i>
            </div>
            <div class="min-w-0 flex flex-col">
              <span class="text-sm font-bold text-slate-800 truncate">
                {{ row.filename || row.nome || 'Arquivo' }}
              </span>
              <span class="text-[10px] font-medium text-slate-500 truncate">
                {{ row.mime_type || '—' }} <span v-if="row.tamanho">· {{ formatBytes(row.tamanho) }}</span>
              </span>
            </div>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1">
            <Button variant="ghost" size="sm" class="!h-9" @click="ver(row.id)">
              Ver
            </Button>

            <Button variant="ghost" size="sm" class="!h-9" @click="baixar(row.id, row.filename)">
              Baixar
            </Button>

            <Button
              v-if="can('arquivos.excluir')"
              variant="danger"
              size="sm"
              class="!h-9"
              @click="excluir(row.id)"
            >
              Excluir
            </Button>
          </div>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'arquivos.ver' } })

const route = useRoute()
const router = useRouter()

// aceita query no formato owner_type/owner_id (backend) ou ownerType/ownerId (frontend)
const ownerType = computed(() => String(route.query.owner_type || route.query.ownerType || '').trim().toUpperCase())
const ownerId = computed(() => String(route.query.owner_id || route.query.ownerId || '').replace(/\D/g, ''))
const categoria = computed(() => String(route.query.categoria || '').trim().toUpperCase())

const q = ref('')
const loading = ref(false)
const rows = ref([])

const fileInput = ref(null)

const columns = [
  { key: 'arquivo', label: 'ARQUIVO', width: '70%' },
  { key: 'acoes', label: '', align: 'right', width: '30%' },
]

const rowsFiltradas = computed(() => {
  const termo = q.value.trim().toLowerCase()
  if (!termo) return rows.value
  return rows.value.filter(r => String(r.filename || r.nome || '').toLowerCase().includes(termo))
})

function formatBytes(n) {
  const v = Number(n || 0)
  if (!v) return ''
  const units = ['B','KB','MB','GB']
  let i = 0, x = v
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++ }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

async function carregar() {
  if (!ownerType.value || !ownerId.value) {
    rows.value = []
    return
  }

  loading.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: ownerType.value,
      ownerId: ownerId.value,
      categoria: categoria.value || undefined,
    })

    rows.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    console.error(e)
    notify.error('Falha ao carregar arquivos.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function recarregar() {
  carregar()
}

function ver(id) {
  router.push(`/arquivos/${id}`)
}

async function baixar(id, filename) {
  try {
    const res = await ArquivosService.baixarBlob(id)
    const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'arquivo'
    a.click()

    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
    notify.error('Não foi possível baixar o arquivo.')
  }
}

async function excluir(id) {
  const ok = await confirm.show('EXCLUIR ARQUIVO', 'Deseja excluir este arquivo?')
  if (!ok) return

  try {
    await ArquivosService.remover(id)
    rows.value = rows.value.filter(r => String(r.id) !== String(id))
    notify.success('Arquivo removido.')
  } catch (e) {
    console.error(e)
    notify.error('Não foi possível excluir.')
  }
}

function abrirPicker() {
  if (!ownerType.value || !ownerId.value) return notify.error('Informe owner_type e owner_id.')
  fileInput.value?.click()
}

async function onPickFile(ev) {
  const file = ev?.target?.files?.[0]
  ev.target.value = '' // permite selecionar o mesmo arquivo de novo
  if (!file) return

  try {
    await ArquivosService.upload({
      ownerType: ownerType.value,
      ownerId: ownerId.value,
      file,
      categoria: categoria.value || undefined,
      // prefixo/nomeBase opcionais (se quiser depois)
    })
    notify.success('Upload concluído.')
    await carregar()
  } catch (e) {
    console.error(e)
    notify.error(e?.message || e?.response?.data?.message || 'Falha no upload.')
  }
}

onMounted(carregar)
</script>
