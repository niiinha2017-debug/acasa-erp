<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in pb-10">
    <Card :shadow="true" class="overflow-hidden">
      <PageHeader
        :title="nomeExibicao"
        subtitle="Visualização de arquivo (PWA)"
        icon="pi pi-file"
        :backTo="backTo"
        class="border-b border-slate-100 bg-slate-50/50"
      />

      <div class="p-6">
        <Loading v-if="loading" />

        <div v-else-if="erro" class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
          <p class="text-[10px] font-black uppercase tracking-widest text-rose-600">
            {{ erro }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <!-- Preview -->
          <div class="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <img
              v-if="isImagem"
              :src="blobUrl"
              class="w-full max-h-[75vh] object-contain bg-white"
              alt="Arquivo"
            />

            <iframe
              v-else-if="isPdf"
              :src="blobUrl"
              class="w-full h-[75vh] bg-white"
            />

            <div v-else class="p-6 text-center">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Este tipo de arquivo não tem pré-visualização.
              </p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                Use o botão “Baixar”.
              </p>
            </div>
          </div>

          <!-- Ações -->
          <div class="flex items-center justify-end gap-2">
            <Button variant="secondary" type="button" @click="voltar">
              Voltar
            </Button>

            <a
              v-if="blobUrl"
              :href="blobUrl"
              :download="downloadName"
              class="inline-flex"
            >
              <Button variant="primary" type="button">
                <i class="pi pi-download mr-2 text-[12px]"></i>
                Baixar
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
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

const backTo = computed(() => '/funcionarios') // simples; se quiser, pode ser router.back()

function voltar() {
  router.back()
}

async function carregarBlob() {
  const cleanId = id.value
  if (!cleanId) return

  erro.value = ''
  loading.value = true

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
