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
                <div class="relative h-24 w-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <img src="/pwa-192.png" alt="ACASA" class="h-14 w-14 object-contain" />
                </div>
              </div>
              <div class="mt-7">
                <div class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">ACASA</div>
                <div class="text-2xl font-black tracking-tight text-slate-900 uppercase">PONTO</div>
              </div>
              <p class="mt-8 text-sm text-slate-500 italic font-medium max-w-[240px] mx-auto leading-relaxed">
                {{ etapa === 'app' ? 'Identificação digital biométrica e geográfica.' : 'Área restrita para colaboradores.' }}
              </p>
            </div>
          </div>

          <div class="col-span-12 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center relative">
            
            <div class="md:hidden flex flex-col items-center mb-6">
              <div class="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <img src="/pwa-192.png" alt="ACASA" class="h-8 w-8 object-contain" />
              </div>
            </div>

            <header class="mb-8 text-center md:text-left">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
                {{ etapa === 'termo' ? 'Privacidade' : etapa === 'ativar' ? 'Vincular' : 'Registro' }}
              </h2>
              <p class="text-slate-400 mt-3 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
                {{ etapa === 'termo' ? 'Art. 7º da LGPD' : etapa === 'ativar' ? 'Vínculo de Dispositivo' : 'Painel de Controle' }}
              </p>
            </header>

            <div class="space-y-6">
              
              <div v-if="etapa === 'termo'" class="animate-in space-y-6">
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm text-slate-500 italic border-l-4 border-indigo-600 font-medium leading-relaxed">
                  Autorizo a coleta de geolocalização e metadados para fins de execução de contrato de trabalho conforme Art. 7º da LGPD.
                </div>
                <Button variant="primary" fullWidth size="lg" class="h-14 sm:h-16 shadow-xl shadow-indigo-500/20 rounded-2xl font-black uppercase tracking-widest" @click="confirmarAceite">
                  Eu Aceito os Termos
                </Button>
              </div>

              <div v-else-if="etapa === 'ativar'" class="animate-in space-y-5">
                <Input v-model="parearCode" label="Código de Ativação" placeholder="EX: A1B2C3" :force-upper="true" required />
                <Button variant="primary" fullWidth size="lg" class="h-14 sm:h-16 shadow-xl shadow-indigo-500/20 rounded-2xl font-black uppercase tracking-widest" :loading="loading" @click="realizarPareamento">
                  Vincular Agora
                </Button>
              </div>

              <div v-else class="animate-in space-y-4">
                <div class="flex items-center gap-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                  <div class="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600">
                    {{ funcionario?.nome?.charAt(0) || '?' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Colaborador</p>
                    <h3 class="text-sm font-black text-slate-900 uppercase truncate">{{ funcionario?.nome }}</h3>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-white border border-slate-100 rounded-xl p-3 text-center">
                    <p class="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">GPS</p>
                    <div class="flex items-center justify-center gap-1.5">
                      <span class="h-1.5 w-1.5 rounded-full" :class="coords ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"></span>
                      <span class="text-[9px] font-black" :class="coords ? 'text-emerald-500' : 'text-rose-500'">{{ coords ? 'ATIVO' : 'OFF' }}</span>
                    </div>
                  </div>
                  <div class="bg-white border border-slate-100 rounded-xl p-3 text-center">
                    <p class="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">DATA</p>
                    <p class="text-[9px] font-black text-slate-900 uppercase">{{ hojeTexto }}</p>
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
                  <span v-if="bloqueioTemporario" class="text-[10px] font-black uppercase">Aguarde {{ contadorBloqueio }}s</span>
                  <template v-else>
                    <span class="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-70 italic">Toque para registrar</span>
                    <span class="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">{{ proximoStatus }}</span>
                  </template>
                </Button>

                <div
                  v-if="ultimoRegistro && (ultimoRegistro.rua || ultimoRegistro.bairro || ultimoRegistro.cidade || ultimoRegistro.estado || ultimoRegistro.cep)"
                  class="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 animate-in"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="h-1 w-3 bg-indigo-500 rounded-full"></span>
                    <p class="text-[8px] font-black uppercase tracking-widest text-slate-400">Último Local Registrado</p>
                  </div>
                  
                  <p v-if="ultimoRegistro.rua" class="text-[11px] font-black text-slate-900 uppercase leading-tight">
                    {{ ultimoRegistro.rua }}
                  </p>

                  <p class="text-[10px] font-bold text-slate-500 uppercase leading-tight mt-1">
                    <span v-if="ultimoRegistro.bairro">{{ ultimoRegistro.bairro }}</span>
                    <span v-if="ultimoRegistro.cidade"> — {{ ultimoRegistro.cidade }}</span>
                    <span v-if="ultimoRegistro.estado">/{{ ultimoRegistro.estado }}</span>
                  </p>

                  <p v-if="ultimoRegistro.cep" class="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-2 bg-white inline-block px-2 py-0.5 rounded-md border border-slate-100">
                    CEP {{ ultimoRegistro.cep }}
                  </p>
                </div>
              </div>
            </div>

            <footer class="mt-8 flex items-center justify-center md:justify-start gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
              <span>ACASA ERP</span>
              <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span>v2.4.0</span>
            </footer>

            <p v-if="erro" class="mt-4 text-center text-[10px] font-black text-rose-500 uppercase tracking-widest">{{ erro }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { PontoService } from './services/ponto.service'
import Input from './components/ui/Input.vue'
import Button from './components/ui/Button.vue'

// ESTADO
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
let backLocked = false

// COMPUTED
const hojeTexto = computed(() => new Date().toLocaleDateString('pt-BR'))
const ultimoRegistro = computed(() => {
  const list = registrosHoje.value || []
  return list.length ? list[list.length - 1] : null
})
const bloqueioTemporario = computed(() => contadorBloqueio.value > 0)
const proximoStatus = computed(() => {
  if (!ultimoRegistro.value) return 'ENTRADA'
  return ultimoRegistro.value.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA'
})

// HELPERS
function getDeviceInfo() {
  return {
    device_uuid: localStorage.getItem('acasa_ponto_uuid') || (() => {
      const u = crypto.randomUUID().toUpperCase();
      localStorage.setItem('acasa_ponto_uuid', u);
      return u;
    })(),
    device_nome: 'PWA Mobile',
    plataforma: 'WEB_PWA'
  }
}

// BLOQUEIO
function verificarBloqueio30s() {
  if (!ultimoRegistro.value?.data_hora) return
  const agora = Date.now()
  const ultima = new Date(ultimoRegistro.value.data_hora).getTime()
  const diff = Math.floor((agora - ultima) / 1000)
  if (diff < 30) {
    contadorBloqueio.value = 30 - diff
    clearInterval(timerBloqueio)
    timerBloqueio = setInterval(() => {
      if (contadorBloqueio.value > 0) contadorBloqueio.value--
      else clearInterval(timerBloqueio)
    }, 1000)
  }
}

// GPS
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

// AÇÕES
function confirmarAceite() {
  localStorage.setItem('acasa_ponto_aceite', 'true')
  etapa.value = token.value ? 'app' : 'ativar'
}

async function carregarDados() {
  if (!token.value) return
  loading.value = true
  erro.value = ''
  try {
    const [resMe, resHoje] = await Promise.all([
      PontoService.me(token.value),
      PontoService.hoje(token.value),
    ])
    funcionario.value = resMe.data
    registrosHoje.value = resHoje.data || []
    verificarBloqueio30s()
  } catch (e) {
    erro.value = e.response?.status === 401 ? 'SESSÃO INVÁLIDA' : 'Erro ao sincronizar dados.'
  } finally {
    loading.value = false
  }
}

async function realizarPareamento() {
  if (!parearCode.value) return (erro.value = 'CÓDIGO OBRIGATÓRIO')
  loading.value = true
  try {
    const res = await PontoService.ativar({
      code: parearCode.value.trim().toUpperCase(),
      ...getDeviceInfo(),
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
      precisao_metros: Math.round(gps.acc),
    }, token.value)
    await carregarDados()
  } catch (e) {
    erro.value = e.response?.data?.message || 'ERRO AO REGISTRAR.'
  } finally {
    loading.value = false
  }
}

// LIFECYCLE
onMounted(() => {
  if (!localStorage.getItem('acasa_ponto_aceite')) {
    etapa.value = 'termo'
  } else if (token.value) {
    etapa.value = 'app'
    carregarDados()
  } else {
    etapa.value = 'ativar'
  }
})

onUnmounted(() => clearInterval(timerBloqueio))
</script>

<style scoped>
.animate-in {
  animation: slideUp 0.4s ease-out forwards;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>