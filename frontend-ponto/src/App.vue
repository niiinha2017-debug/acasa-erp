<template>
  <div class="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans antialiased">
    <div class="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-slate-900/10 blur-3xl"></div>

    <div class="min-h-screen w-full flex items-center justify-center px-4 py-6">
      <div class="w-full max-w-[980px] bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden">
        <div class="grid grid-cols-12">
          
          <div class="hidden md:flex md:col-span-5 bg-slate-50 border-r border-slate-100 p-10 items-center justify-center">
            <div class="text-center">
              <div class="relative h-24 w-24 mx-auto rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6">
                <img src="/pwa-192.png" alt="ACASA" class="h-14 w-14 object-contain" />
              </div>
              <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">ACASA PONTO</h1>
              <p class="mt-4 text-sm text-slate-500 italic px-6">Registro seguro com precisão geográfica e carimbo de tempo digital.</p>
            </div>
          </div>

          <div class="col-span-12 md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            <div class="md:hidden flex justify-center mb-6">
              <img src="/pwa-192.png" alt="ACASA" class="h-12 w-12" />
            </div>

            <header class="mb-8 text-center md:text-left">
              <h2 class="text-2xl font-black text-slate-900 uppercase leading-none">
                {{ etapa === 'termo' ? 'Privacidade' : etapa === 'ativar' ? 'Vincular' : 'Registro' }}
              </h2>
              <p class="text-slate-400 mt-2 text-[10px] font-black uppercase tracking-widest">
                {{ etapa === 'app' ? 'Painel de Frequência' : 'Configuração Inicial' }}
              </p>
            </header>

            <div class="space-y-5">
              
              <div v-if="etapa === 'termo'" class="space-y-6 animate-in">
                <div class="bg-indigo-50 border-l-4 border-indigo-600 p-5 rounded-xl text-sm text-indigo-900 italic">
                  Autorizo a coleta de geolocalização e metadados para fins de execução de contrato de trabalho (Art. 7º LGPD).
                </div>
                <Button variant="primary" fullWidth size="lg" @click="confirmarAceite">Aceitar e Continuar</Button>
              </div>

              <div v-else-if="etapa === 'ativar'" class="space-y-4 animate-in">
                <Input v-model="parearCode" label="Código do RH" placeholder="EX: A1B2" :force-upper="true" />
                <Button variant="primary" fullWidth size="lg" :loading="loading" @click="realizarPareamento">Ativar Dispositivo</Button>
              </div>

              <div v-else class="space-y-4 animate-in">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="h-2 w-2 rounded-full animate-pulse" :class="coords ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                      <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Localização Atual</p>
                    </div>
                    <p class="text-[11px] font-bold text-slate-900 uppercase truncate">
                      {{ enderecoAtual || (coords ? 'Localizando endereço...' : 'GPS Desligado') }}
                    </p>
                    <p v-if="cepAtual" class="text-[9px] font-black text-indigo-600 mt-1">CEP: {{ cepAtual }}</p>
                  </div>

                  <div class="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data e Hora</p>
                    <p class="text-lg font-black text-slate-900 leading-none">{{ horaAgora }}</p>
                    <p class="text-[10px] font-bold text-slate-500 mt-1 uppercase">{{ dataHoje }}</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  class="h-28 flex flex-col shadow-2xl rounded-[2rem] transition-all active:scale-95"
                  :class="proximoStatus === 'SAIDA' ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'"
                  :loading="loading"
                  @click="baterPonto"
                >
                  <template v-if="bloqueioTemporario">
                    <span class="text-[10px] font-black uppercase">Aguarde {{ contadorBloqueio }}s</span>
                  </template>
                  <template v-else>
                    <span class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Registrar</span>
                    <span class="text-3xl font-black">{{ proximoStatus }}</span>
                  </template>
                </Button>

                <div v-if="ultimoRegistro" class="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p class="text-[8px] font-black text-slate-400 uppercase">Último Evento</p>
                    <p class="text-sm font-black text-slate-800 uppercase">{{ ultimoRegistro.tipo }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-600">{{ ultimoRegistroDataHoraTexto }}</p>
                  </div>
                </div>
              </div>
            </div>

            <footer class="mt-8 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
              <span>ACASA v2.4</span>
              <span>Conexão Criptografada</span>
            </footer>

            <p v-if="erro" class="mt-4 text-center text-[10px] font-black text-rose-500 uppercase">{{ erro }}</p>
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
const enderecoAtual = ref('')
const cepAtual = ref('')
const erro = ref('')
const contadorBloqueio = ref(0)
const agora = ref(new Date())

let timerRelogio = null
let timerBloqueio = null

// COMPUTED
const horaAgora = computed(() => agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
const dataHoje = computed(() => agora.value.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }))
const ultimoRegistro = computed(() => registrosHoje.value.at(-1))
const proximoStatus = computed(() => (!ultimoRegistro.value || ultimoRegistro.value.tipo === 'SAIDA') ? 'ENTRADA' : 'SAIDA')
const bloqueioTemporario = computed(() => contadorBloqueio.value > 0)
const ultimoRegistroDataHoraTexto = computed(() => {
  if (!ultimoRegistro.value?.data_hora) return ''
  return new Date(ultimoRegistro.value.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
})

// MÉTODOS DE APP (BACK LOCK & FULLSCREEN)
const setupPWA = async () => {
  if (etapa.value !== 'app') return
  // Fullscreen
  try {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isStandalone && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen()
    }
  } catch (e) {}
  // Back Lock
  history.pushState(null, '', location.href)
  window.onpopstate = () => history.pushState(null, '', location.href)
}

// REVERSO GEO (CEP e ENDEREÇO)
async function buscarEndereco(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await res.json()
    if (data.address) {
      const r = data.address
      enderecoAtual.value = `${r.road || ''}, ${r.suburb || r.neighbourhood || ''}`.replace(/^, /, '')
      cepAtual.value = r.postcode || ''
    }
  } catch (e) {
    enderecoAtual.value = "Localização obtida"
  }
}

async function capturarGPS() {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        coords.value = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }
        await buscarEndereco(p.coords.latitude, p.coords.longitude)
        resolve(coords.value)
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

function verificarBloqueio30s() {
  if (!ultimoRegistro.value?.data_hora) return
  const diff = Math.floor((Date.now() - new Date(ultimoRegistro.value.data_hora).getTime()) / 1000)
  if (diff < 30) {
    contadorBloqueio.value = 30 - diff
    clearInterval(timerBloqueio)
    timerBloqueio = setInterval(() => {
      if (contadorBloqueio.value > 0) contadorBloqueio.value--
      else clearInterval(timerBloqueio)
    }, 1000)
  }
}

async function carregarDados() {
  if (!token.value) return
  loading.value = true
  try {
    const [me, hoje] = await Promise.all([PontoService.me(token.value), PontoService.hoje(token.value)])
    funcionario.value = me.data
    registrosHoje.value = hoje.data || []
    verificarBloqueio30s()
  } catch (e) {
    if (e.response?.status === 401) etapa.value = 'ativar'
  } finally { loading.value = false }
}

async function realizarPareamento() {
  if (!parearCode.value) return (erro.value = 'CÓDIGO INVÁLIDO')
  loading.value = true
  try {
    const res = await PontoService.ativar({
      code: parearCode.value.trim().toUpperCase(),
      device_uuid: crypto.randomUUID().toUpperCase(),
      plataforma: 'WEB_PWA'
    })
    token.value = res.data.token
    localStorage.setItem('acasa_ponto_token', token.value)
    etapa.value = 'app'
    await carregarDados()
  } catch (e) { erro.value = 'FALHA NA ATIVAÇÃO' } finally { loading.value = false }
}

async function baterPonto() {
  if (bloqueioTemporario.value) return
  loading.value = true
  const gps = await capturarGPS()
  if (!gps) { erro.value = 'LIGUE O GPS'; loading.value = false; return }
  try {
    await PontoService.registrar({
      tipo: proximoStatus.value,
      latitude: gps.lat,
      longitude: gps.lng,
      precisao_metros: Math.round(gps.acc)
    }, token.value)
    await carregarDados()
  } catch (e) { erro.value = 'ERRO AO REGISTRAR' } finally { loading.value = false }
}

function confirmarAceite() {
  localStorage.setItem('acasa_ponto_aceite', 'true')
  etapa.value = token.value ? 'app' : 'ativar'
}

watch(etapa, (val) => { if (val === 'app') setupPWA() })

onMounted(() => {
  timerRelogio = setInterval(() => { agora.value = new Date() }, 1000)
  if (token.value) {
    etapa.value = 'app'
    carregarDados()
    capturarGPS()
  } else {
    etapa.value = localStorage.getItem('acasa_ponto_aceite') ? 'ativar' : 'termo'
  }
})

onUnmounted(() => {
  clearInterval(timerRelogio)
  clearInterval(timerBloqueio)
})
</script>

<style scoped>
.animate-in { animation: slideUp 0.4s ease-out forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>