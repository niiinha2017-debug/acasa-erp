<template>
  <Card :shadow="true">
    <PageHeader
      title="Convites do Ponto"
      subtitle="Gere o link privado do app para o funcionário."
      icon="pi pi-link"
      :backTo="'/rh'"
    />

    <div class="p-6 space-y-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-6">
        <!-- Selecionar funcionário -->
        <div class="grid grid-cols-12 gap-4">
          <SearchInput
            class="col-span-12"
            v-model="funcionario_id"
            mode="select"
            label="Funcionário"
            placeholder="Digite e selecione um funcionário..."
            :options="funcionariosOptions"
            labelKey="label"
            valueKey="value"
          />
        </div>

        <div class="flex items-center gap-3">
          <Button
            variant="primary"
            :loading="loadingGerar"
            :disabled="!funcionario_id"
            @click="gerar"
          >
            <i class="pi pi-bolt mr-2 text-xs"></i>
            Gerar convite
          </Button>

          <Button
            v-if="convite?.url"
            variant="secondary"
            @click="copiar(convite.url)"
          >
            <i class="pi pi-copy mr-2 text-xs"></i>
            Copiar link
          </Button>

          <Button
            v-if="convite?.url"
            variant="success"
            @click="abrirWhats()"
          >
            <i class="pi pi-whatsapp mr-2 text-xs"></i>
            Enviar no Whats
          </Button>
        </div>

        <!-- Resultado -->
        <div v-if="convite" class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
              Link
            </label>

            <div class="flex items-center gap-2">
              <input
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                :value="convite.url"
                readonly
              />
              <Button variant="outline" @click="copiar(convite.url)">
                Copiar
              </Button>
            </div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
              Código
            </label>
            <input
              class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-black text-gray-900 tracking-wider"
              :value="convite.code"
              readonly
            />
          </div>

          <div class="col-span-12 md:col-span-8">
            <label class="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
              Expira em
            </label>
            <input
              class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
              :value="formatDate(convite.expira_em)"
              readonly
            />
          </div>

          <div class="col-span-12">
            <div class="text-xs font-bold text-gray-500">
              Dica: esse link é privado. Se expirar, gere outro.
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { FuncionarioService, PontoService } from '@/services/index'
import { notify } from '@/services/notify'

const loading = ref(true)
const loadingGerar = ref(false)

const funcionarios = ref([])          // <- plural
const funcionario_id = ref(null)
const convite = ref(null)

const funcionariosOptions = computed(() =>
  (funcionarios.value || []).map((f) => ({
    label: `${String(f.nome || '').toUpperCase()} #${f.id}`,
    value: f.id,
  })),
)

onMounted(async () => {
  try {
const res = await FuncionarioService.listar()
funcionarios.value = res?.data || []
console.log('[FUNCIONARIOS] qtd:', funcionarios.value.length)

  } catch (e) {
    console.log('[ERRO listar funcionarios]', e) // <- 1 log real
    notify?.error?.(e?.response?.data?.message || 'Falha ao carregar funcionários.')
  } finally {
    loading.value = false
  }
})

async function gerar() {
  if (!funcionario_id.value) return
  loadingGerar.value = true
  convite.value = null

  try {
    const res = await PontoService.gerarConvite(Number(funcionario_id.value))
    const data = res.data || {}

    // 1. Pega o código que veio da API
    const code = data.code || data.codigo || data.token || data.convite || null
    
    // 2. Monta a URL usando a variável 'code' que acabamos de criar (e não convite.value)
    const PONTO_BASE_URL = `${window.location.origin}/ponto`
    const url = `${PONTO_BASE_URL}/ativar?code=${code}`

    // 3. Agora sim, salva no estado para aparecer na tela
    convite.value = {
      ...data,
      code,
      url,
    }

    notify?.success?.('Convite gerado.')
  } catch (e) {
    console.error(e)
    notify?.error?.(e?.response?.data?.message || 'Não foi possível gerar o convite.')
  } finally {
    loadingGerar.value = false
  }
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    notify?.success?.('Link copiado.')
  } catch {
    notify?.error?.('Não foi possível copiar.')
  }
}

function abrirWhats() {
  if (!convite.value?.url) return

  const id = Number(funcionario_id.value)
  const f = funcionarios.value.find((x) => x.id === id)
  const nome = f?.nome ? String(f.nome).trim() : 'tudo bem'

  const msg =
`Olá ${nome}!
Segue seu link privado para ativar o APP do Ponto:
${convite.value.url}

Se expirar, me avise que eu gero outro.`

  const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}


function formatDate(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString('pt-BR')
  } catch {
    return String(v)
  }
}
</script>

