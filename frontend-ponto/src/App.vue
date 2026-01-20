<template>
  <div class="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans antialiased">
    <div class="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-slate-900/10 blur-3xl"></div>

    <div class="min-h-screen w-full flex items-center justify-center px-4 py-6 sm:py-10">
      <div class="w-full max-w-[980px] bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(2,6,23,0.08)] overflow-hidden transition-all">
        <div class="grid grid-cols-12 min-h-fit md:min-h-[600px]">
          
          <div class="hidden md:flex md:col-span-5 bg-slate-50 border-r border-slate-100 p-10 items-center justify-center">
            <div class="text-center">
              <div class="relative inline-flex items-center justify-center">
                <div class="absolute inset-0 bg-indigo-500/15 blur-2xl rounded-full"></div>
                <div class="relative h-24 w-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src="/pwa-192.png" alt="ACASA Logo" class="h-14 w-14 object-contain" />
                </div>
              </div>

              <div class="mt-7">
                <div class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">ACASA</div>
                <div class="text-2xl font-black tracking-tight text-slate-900 uppercase">PONTO</div>
              </div>

              <div class="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Identificação Digital
              </div>

              <div class="mt-8 h-px w-14 mx-auto bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

              <p class="mt-6 text-sm text-slate-500 leading-relaxed max-w-[260px] mx-auto italic font-medium">
                {{ etapa === 'app' ? 'Sua jornada registrada com segurança e precisão.' : 'Acesso restrito para funcionários autorizados.' }}
              </p>
            </div>
          </div>

          <div class="col-span-12 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center relative">
            
            <div class="md:hidden flex flex-col items-center mb-8">
              <div class="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <img src="/pwa-192.png" alt="ACASA" class="h-10 w-10 object-contain" />
              </div>
              <span class="mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">A Casa ERP</span>
            </div>

            <header class="mb-8 text-center md:text-left">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {{ etapa === 'termo' ? 'Privacidade' : etapa === 'ativar' ? 'Vincular' : 'Registro' }}
              </h2>
              <p class="text-slate-400 mt-3 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
                {{ etapa === 'termo' ? 'Aceite para continuar' : etapa === 'ativar' ? 'Insira o código do RH' : 'Painel de Frequência' }}
              </p>
            </header>

            <div class="space-y-6">
              
              <div v-if="etapa === 'termo'" class="animate-in space-y-6">
                <div class="bg-slate-50/80 rounded-[1.5rem] p-6 border border-slate-100 text-sm text-slate-500 italic border-l-2 border-indigo-600 font-medium leading-relaxed">
                  Autorizo a coleta de geolocalização e metadados para fins de execução de contrato de trabalho conforme Art. 7º da LGPD.
                </div>
                <Button variant="primary" fullWidth size="lg" class="h-14 sm:h-16 shadow-xl shadow-indigo-500/20 rounded-2xl font-black uppercase tracking-widest" @click="confirmarAceite">
                  Eu Aceito os Termos
                </Button>
              </div>

              <div v-else-if="etapa === 'ativar'" class="animate-in space-y-5">
                <Input v-model="parearCode" label="Código de Ativação" placeholder="EX: A1B2C3" :force-upper="true" required />
                <Button variant="primary" fullWidth size="lg" class="h-14 sm:h-16 shadow-xl shadow-indigo-500/20 rounded-2xl font-black uppercase tracking-widest" :loading="loading" @click="realizarPareamento">
                  Vincular Dispositivo
                </Button>
              </div>

              <div v-else class="animate-in space-y-5">
                <div class="flex items-center gap-4 bg-slate-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm">
                  <div class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600">
                    {{ funcionario?.nome?.charAt(0) || '?' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Funcionário</p>
                    <h3 class="text-sm sm:text-base font-black text-slate-900 uppercase truncate">{{ funcionario?.nome }}</h3>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 text-center">
                    <p class="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status GPS</p>
                    <div class="flex items-center justify-center gap-1.5">
                      <span class="h-1.5 w-1.5 rounded-full" :class="coords ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"></span>
                      <span class="text-[9px] sm:text-[10px] font-black" :class="coords ? 'text-emerald-500' : 'text-rose-500'">{{ coords ? 'ATIVO' : 'BUSCANDO' }}</span>
                    </div>
                  </div>
                  <div class="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 text-center">
                    <p class="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Hoje</p>
                    <p class="text-[9px] sm:text-[10px] font-black text-slate-900 uppercase">{{ hojeTexto }}</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  class="h-20 sm:h-28 flex flex-col gap-0.5 sm:gap-1 shadow-2xl rounded-2xl sm:rounded-[2rem] transition-all"
                  :class="[
                    proximoStatus === 'SAIDA' ? 'bg-rose-600 shadow-rose-500/20' : 'bg-slate-900 shadow-slate-900/20',
                    bloqueioTemporario ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                  ]"
                  :loading="loading"
                  @click="baterPonto"
                >
                  <span v-if="bloqueioTemporario" class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em]">Aguarde {{ contadorBloqueio }}s</span>
                  <template v-else>
                    <span class="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-70 italic">Toque para registrar</span>
                    <span class="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">{{ proximoStatus }}</span>
                  </template>
                </Button>
              </div>
            </div>

            <footer class="mt-12 flex items-center justify-center md:justify-start gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
              <span>Conexão Segura</span>
              <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span>v2.4.0</span>
            </footer>

            <p v-if="erro" class="absolute bottom-4 left-0 right-0 text-center text-[10px] font-black text-rose-500 uppercase tracking-widest">{{ erro }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PontoService } from './services/ponto.service'
import Input from './components/ui/Input.vue'
import Button from './components/ui/Button.vue'

// --- ESTADO ---
const etapa = ref('termo')
const loading = ref(false)
const token = ref(localStorage.getItem('acasa_ponto_token') || '')
const parearCode = ref('')
const funcionario = ref(null)
const registrosHoje = ref([])
const coords = ref(null)
const erro = ref('')
const contadorBloqueio = ref(0)
let timerBloqueio = null

// --- COMPUTED ---
const hojeTexto = computed(() => new Date().toLocaleDateString('pt-BR'))
const ultimoRegistro = computed(() => registrosHoje.value[registrosHoje.value.length - 1] || null)
const bloqueioTemporario = computed(() => contadorBloqueio.value > 0)

const proximoStatus = computed(() => {
  if (!ultimoRegistro.value) return 'ENTRADA'
  return ultimoRegistro.value.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA'
})

// --- MÉTODOS ---
function confirmarAceite() {
  localStorage.setItem('acasa_ponto_aceite', 'true')
  etapa.value = token.value ? 'app' : 'ativar'
}

async function carregarDados() {
  if (!token.value) return
  loading.value = true
  try {
    const [resMe, resHoje] = await Promise.all([
      PontoService.me(token.value),
      PontoService.hoje(token.value)
    ])
    funcionario.value = resMe.data
    registrosHoje.value = resHoje.data
    verificarBloqueio30s()
  } catch (e) {
    if (e.response?.status === 401) sair()
    erro.value = 'Erro ao sincronizar dados.'
  } finally {
    loading.value = false
  }
}

function verificarBloqueio30s() {
  if (!ultimoRegistro.value) return
  const agora = Date.now()
  const ultimaData = new Date(ultimoRegistro.value.data_hora).getTime()
  const diff = Math.floor((agora - ultimaData) / 1000)
  if (diff < 30) {
    contadorBloqueio.value = 30 - diff
    iniciarContagem()
  }
}

function iniciarContagem() {
  clearInterval(timerBloqueio)
  timerBloqueio = setInterval(() => {
    if (contadorBloqueio.value > 0) contadorBloqueio.value--
    else clearInterval(timerBloqueio)
  }, 1000)
}

async function capturarGPS() {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        coords.value = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }
        resolve(coords.value)
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 7000 }
    )
  })
}

async function realizarPareamento() {
  if (!parearCode.value) return (erro.value = 'CÓDIGO OBRIGATÓRIO')
  loading.value = true
  erro.value = ''
  try {
    const res = await PontoService.ativar({
      code: parearCode.value.trim().toUpperCase(),
      device_uuid: getDeviceUuid(),
      device_nome: 'PWA Mobile',
      plataforma: 'WEB_PWA'
    })
    token.value = res.data.token
    localStorage.setItem('acasa_ponto_token', token.value)
    etapa.value = 'app'
    await carregarDados()
  } catch (e) {
    erro.value = e.response?.data?.message || 'FALHA NO VÍNCULO.'
  } finally {
    loading.value = false
  }
}

async function baterPonto() {
  if (bloqueioTemporario.value) return
  erro.value = ''
  loading.value = true
  const gps = await capturarGPS()
  if (!gps) {
    erro.value = 'GPS NECESSÁRIO PARA REGISTRAR.'
    loading.value = false
    return
  }
  try {
    await PontoService.registrar({
      tipo: proximoStatus.value,
      latitude: gps.lat,
      longitude: gps.lng,
      precisao_metros: Math.round(gps.acc)
    }, token.value)
    await carregarDados()
  } catch (e) {
    erro.value = e.response?.data?.message || 'ERRO AO REGISTRAR.'
  } finally {
    loading.value = false
  }
}

function getDeviceUuid() {
  let uuid = localStorage.getItem('acasa_ponto_uuid')
  if (!uuid) {
    uuid = crypto.randomUUID().toUpperCase()
    localStorage.setItem('acasa_ponto_uuid', uuid)
  }
  return uuid
}

function sair() {
  localStorage.removeItem('acasa_ponto_token')
  location.reload()
}

onMounted(() => {
  const aceitou = localStorage.getItem('acasa_ponto_aceite')
  if (!aceitou) return (etapa.value = 'termo')
  if (token.value) {
    etapa.value = 'app'
    carregarDados()
    capturarGPS()
  } else {
    etapa.value = 'ativar'
  }
})

onUnmounted(() => clearInterval(timerBloqueio))
</script>

<style scoped>
.animate-in {
  animation: slideIn 0.4s ease-out forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>