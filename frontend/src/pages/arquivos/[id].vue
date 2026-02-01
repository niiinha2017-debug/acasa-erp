<template>
  <div class="h-dvh w-full bg-slate-100 dark:bg-slate-950">
    <!-- TOPBAR (estilo Drive) -->
    <div class="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div class="h-14 px-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <button
            type="button"
            @click="voltar"
            class="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label="Voltar"
          >
            <i class="pi pi-times"></i>
          </button>

          <div class="flex items-center gap-2 min-w-0">
            <span class="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <i :class="fileIcon" class="text-sm"></i>
            </span>

            <div class="min-w-0">
              <div class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                {{ nomeExibicao }}
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {{ mimeQuery || 'ARQUIVO' }}
              </div>
            </div>
          </div>
        </div>

        <!-- ações -->
        <div class="flex items-center gap-2">
          <button
            v-if="isImagem"
            type="button"
            @click="zoomOut"
            class="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            -
          </button>

          <button
            v-if="isImagem"
            type="button"
            @click="zoomIn"
            class="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            +
          </button>

          <a
            v-if="blobUrl"
            :href="blobUrl"
            :download="downloadName"
            class="h-9 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
          >
            <i class="pi pi-download text-[11px]"></i>
            Baixar
          </a>
        </div>
      </div>
    </div>

    <!-- BODY -->
    <div class="h-[calc(100dvh-56px)]">
      <div v-if="loading" class="h-full flex items-center justify-center">
        <Loading />
      </div>

      <div v-else-if="erro" class="p-6">
        <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
          <p class="text-[10px] font-black uppercase tracking-widest text-rose-600">
            {{ erro }}
          </p>
        </div>
      </div>

      <div v-else class="h-full">
        <!-- PDF -->
        <iframe v-if="isPdf && blobUrl" :src="blobUrl"
          class="w-full h-full bg-slate-100 dark:bg-slate-950"
        />

        <!-- IMAGEM -->
        <div
          v-else-if="isImagem"
          class="h-full w-full overflow-auto bg-slate-100 dark:bg-slate-950 p-6"
        >
<div class="w-full flex justify-center">
  <img
    v-if="isImagem && blobUrl"
    :src="blobUrl"
    :style="{ transform: `scale(${zoom})` }"
    class="origin-top rounded-2xl bg-white shadow-lg max-w-none"
    alt="Arquivo"
  />
</div>

        </div>

        <!-- OUTROS -->
        <div v-else class="h-full flex items-center justify-center p-6">
          <div class="text-center">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Este tipo de arquivo não tem pré-visualização.
            </p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">
              Use o botão “Baixar”.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'

definePage({ meta: { public: false } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const erro = ref('')
const blobUrl = ref('')

const zoom = ref(1)

const id = computed(() => String(route.params.id || '').replace(/\D/g, ''))
const nomeQuery = computed(() => String(route.query.name || 'ARQUIVO').trim())
const mimeQuery = computed(() => String(route.query.type || '').trim())

const nomeExibicao = computed(() => nomeQuery.value || `Arquivo #${id.value}`)
const downloadName = computed(() => {
  const base = nomeQuery.value || `arquivo_${id.value}`
  return base.includes('.') ? base : base // deixa como veio; sem inventar extensão
})

const isPdf = computed(() => {
  const t = mimeQuery.value.toLowerCase()
  return t.includes('pdf')
})

const isImagem = computed(() => {
  const t = mimeQuery.value.toLowerCase()
  return t.startsWith('image/')
})

const backTo = computed(() => String(route.query.backTo || ''))
function zoomIn() {
  zoom.value = Math.min(3, Number((zoom.value + 0.1).toFixed(2)))
}
function zoomOut() {
  zoom.value = Math.max(0.5, Number((zoom.value - 0.1).toFixed(2)))
}


const fileIcon = computed(() => {
  if (isPdf.value) return 'pi pi-file-pdf'
  if (isImagem.value) return 'pi pi-image'
  return 'pi pi-file'
})

function voltar() {
  if (backTo.value) router.push(backTo.value)
  else router.back()
}


async function carregarBlob() {
  const cleanId = id.value
  if (!cleanId) return

  erro.value = ''
  loading.value = true
zoom.value = 1

  // limpa url anterior
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
  blobUrl.value = ''

  try {
    const { data } = await ArquivosService.baixarBlob(cleanId)
    const url = URL.createObjectURL(data)
    blobUrl.value = url
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao carregar arquivo.'
    notify.error(erro.value)
  } finally {
    loading.value = false
  }
}

onMounted(carregarBlob)

watch(() => id.value, async () => {
  await carregarBlob()
})

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
