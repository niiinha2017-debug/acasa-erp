<template>
  <div class="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans antialiased">
    <div class="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-slate-900/10 blur-3xl"></div>

    <div class="min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-10">
      <div class="w-full max-w-[980px] bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(2,6,23,0.08)] overflow-hidden">
        <div class="grid grid-cols-12 md:min-h-[600px]">

          <!-- LADO ESQUERDO -->
          <div class="hidden md:flex md:col-span-5 bg-slate-50 border-r border-slate-100 p-10 items-center justify-center">
            <div class="text-center">
              <div class="relative inline-flex items-center justify-center">
                <div class="absolute inset-0 bg-indigo-500/15 blur-2xl rounded-full"></div>
                <div class="relative h-24 w-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <img src="/pwa-192.png" alt="ACASA" class="h-14 w-14 object-contain" />
                </div>
              </div>

              <div class="mt-7">
                <div class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">ACASA</div>
                <div class="text-2xl font-black tracking-tight text-slate-900 uppercase">PONTO</div>
              </div>

              <p class="mt-8 text-sm text-slate-500 italic font-medium max-w-[240px] mx-auto leading-relaxed">
                {{ etapa === 'app'
                  ? 'Identificação digital biométrica e geográfica.'
                  : 'Área restrita para colaboradores.' }}
              </p>
            </div>
          </div>

          <!-- LADO DIREITO -->
          <div class="col-span-12 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">

            <header class="mb-8">
              <h2 class="text-3xl font-black text-slate-900 uppercase">
                {{ etapa === 'termo' ? 'Privacidade' : etapa === 'ativar' ? 'Vincular' : 'Registro' }}
              </h2>
              <p class="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {{ etapa === 'termo'
                  ? 'Art. 7º da LGPD'
                  : etapa === 'ativar'
                  ? 'Vínculo de Dispositivo'
                  : 'Painel de Controle' }}
              </p>
            </header>

            <!-- TERMO -->
            <div v-if="etapa === 'termo'" class="space-y-6">
              <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100 italic text-slate-500">
                Autorizo a coleta de geolocalização e metadados conforme Art. 7º da LGPD.
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                class="h-14 rounded-2xl font-black uppercase tracking-widest"
                @click="confirmarAceite"
              >
                Eu Aceito os Termos
              </Button>
            </div>

            <!-- ATIVAÇÃO -->
            <div v-else-if="etapa === 'ativar'" class="space-y-5">
              <Input
                v-model="parearCode"
                label="Código de Ativação"
                placeholder="EX: A1B2C3"
                force-upper
              />

              <Button
                variant="primary"
                fullWidth
                size="lg"
                class="h-14 rounded-2xl font-black uppercase tracking-widest"
                :loading="loading"
                @click="realizarPareamento"
              >
                Vincular Agora
              </Button>
            </div>

            <!-- APP -->
            <div v-else class="space-y-4">

              <!-- FUNCIONÁRIO -->
              <div class="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border">
                <div class="h-10 w-10 rounded-xl bg-white border flex items-center justify-center font-black text-indigo-600">
                  {{ funcionario?.nome?.charAt(0) || '?' }}
                </div>
                <div>
                  <p class="text-[8px] font-black uppercase tracking-widest text-slate-400">Colaborador</p>
                  <p class="text-sm font-black uppercase">{{ funcionario?.nome }}</p>
                </div>
              </div>

              <!-- GPS / DATA -->
              <div class="grid grid-cols-2 gap-3">

                <!-- GPS = ENDEREÇO -->
                <div class="bg-white border rounded-xl p-3 text-center">
                  <p class="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1">GPS</p>

                  <p
                    v-if="gpsEnderecoTexto"
                    class="text-[9px] font-black uppercase text-slate-900 leading-tight line-clamp-2"
                  >
                    {{ gpsEnderecoTexto }}
                  </p>

                  <p v-if="gpsCepTexto" class="mt-1 text-[8px] font-black uppercase text-slate-400">
                    CEP {{ gpsCepTexto }}
                  </p>
                </div>

                <!-- DATA / HORA -->
                <div class="bg-white border rounded-xl p-3 text-center">
                  <p class="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1">DATA / HORA</p>
                  <p class="text-[9px] font-black uppercase text-slate-900">
                    {{ ultimoRegistroDataHoraTexto || agoraTexto }}
                  </p>
                </div>
              </div>

              <!-- BOTÃO -->
              <Button
                variant="primary"
                fullWidth
                size="lg"
                class="h-20 rounded-2xl font-black uppercase tracking-widest"
                :loading="loading"
                @click="baterPonto"
              >
                {{ proximoStatus }}
              </Button>

            </div>

            <footer class="mt-8 text-[9px] font-black uppercase tracking-widest text-slate-300">
              ACASA ERP • v2.4.0
            </footer>

            <p v-if="erro" class="mt-4 text-[10px] font-black uppercase text-rose-500 text-center">
              {{ erro }}
            </p>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PontoService } from './services/ponto.service'
import Input from './components/ui/Input.vue'
import Button from './components/ui/Button.vue'

const etapa = ref('termo')
const loading = ref(false)
const token = ref(localStorage.getItem('acasa_ponto_token') || '')
const parearCode = ref('')
const funcionario = ref(null)
const registrosHoje = ref([])
const coords = ref(null)
const erro = ref('')

const ultimoRegistro = computed(() =>
  registrosHoje.value.length ? registrosHoje.value.at(-1) : null
)

const proximoStatus = computed(() =>
  !ultimoRegistro.value || ultimoRegistro.value.tipo === 'SAIDA'
    ? 'ENTRADA'
    : 'SAIDA'
)

const gpsEnderecoTexto = computed(() => {
  const u = ultimoRegistro.value
  if (!u) return ''
  return [u.rua, u.bairro, [u.cidade, u.estado].filter(Boolean).join('/')].filter(Boolean).join(' — ')
})

const gpsCepTexto = computed(() => {
  const cep = ultimoRegistro.value?.cep
  if (!cep) return ''
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
})

const agoraTexto = computed(() => {
  const d = new Date()
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
})

const ultimoRegistroDataHoraTexto = computed(() => {
  const d = ultimoRegistro.value?.data_hora
  if (!d) return ''
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
})

function confirmarAceite() {
  localStorage.setItem('acasa_ponto_aceite', 'true')
  etapa.value = token.value ? 'app' : 'ativar'
}

async function carregarDados() {
  if (!token.value) return
  const [me, hoje] = await Promise.all([
    PontoService.me(token.value),
    PontoService.hoje(token.value),
  ])
  funcionario.value = me.data
  registrosHoje.value = hoje.data || []
}

async function realizarPareamento() {
  loading.value = true
  try {
    const res = await PontoService.ativar({ code: parearCode.value })
    token.value = res.data.token
    localStorage.setItem('acasa_ponto_token', token.value)
    etapa.value = 'app'
    await carregarDados()
  } catch {
    erro.value = 'Falha no vínculo'
  } finally {
    loading.value = false
  }
}

async function baterPonto() {
  loading.value = true
  try {
    await PontoService.registrar({ tipo: proximoStatus.value }, token.value)
    await carregarDados()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (token.value) {
    etapa.value = 'app'
    carregarDados()
  } else {
    etapa.value = localStorage.getItem('acasa_ponto_aceite') ? 'ativar' : 'termo'
  }
})
</script>

