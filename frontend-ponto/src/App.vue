<template>
  <div class="min-h-screen w-full bg-[#f8faff] flex items-center justify-center p-4 font-sans antialiased">
    <div class="w-full max-w-[450px] bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-50">
      
      <div class="p-8 sm:p-10 flex flex-col items-center">
        <div class="mb-8">
          <img src="/pwa-192.png" alt="ACASA" class="h-16 w-16 object-contain shadow-sm rounded-2xl" />
        </div>

        <header class="text-center mb-10">
          <h2 class="text-3xl font-black text-[#1e293b] tracking-tight uppercase">
            {{ etapa === 'termo' ? 'Privacidade' : etapa === 'ativar' ? 'Vincular' : 'Registro' }}
          </h2>
          <p class="text-[#94a3b8] text-[11px] font-bold uppercase tracking-[0.2em] mt-1">
            {{ etapa === 'app' ? 'Painel de Frequência' : 'Configuração Inicial' }}
          </p>
        </header>

        <div class="w-full space-y-4">
          
          <div v-if="etapa === 'termo'" class="space-y-6 animate-in">
            <div class="bg-indigo-50 border-l-4 border-indigo-600 p-5 rounded-2xl text-sm text-indigo-900 italic leading-relaxed">
              Declaro estar ciente e de acordo com a coleta e o tratamento de meus dados de geolocalização e metadados, estritamente para fins de execução do contrato de trabalho e cumprimento de obrigações legais, em conformidade com o Art. 7º, inciso V, da LGPD.
            </div>
            <button @click="confirmarAceite" class="w-full h-16 bg-[#1e293b] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Eu Aceito os Termos
            </button>
          </div>

          <div v-else-if="etapa === 'ativar'" class="space-y-4 animate-in">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Código de Ativação</label>
              <input v-model="parearCode" type="text" placeholder="EX: A1B2C3" class="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-black uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button @click="realizarPareamento" :disabled="loading" class="w-full h-16 bg-[#1e293b] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center">
              <span v-if="!loading">Vincular Agora</span>
              <div v-else class="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
            </button>
          </div>

          <div v-else class="space-y-4 animate-in">
            <div class="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div class="flex items-center gap-2 mb-2">
                <span class="h-2.5 w-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
                <p class="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Localização Atual</p>
              </div>
              <p class="text-[13px] font-black text-[#1e293b] leading-tight uppercase">
                {{ enderecoAtual || 'Buscando localização...' }}
              </p>
              </div>

            <div class="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <p class="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">Data e Hora</p>
              <p class="text-3xl font-black text-[#1e293b] leading-none">{{ horaAgora }}</p>
              <p class="text-[11px] font-bold text-[#64748b] mt-2 uppercase">{{ dataHoje }}</p>
            </div>

            <button @click="baterPonto" :disabled="loading || bloqueioTemporario"
              class="w-full h-32 rounded-[2.5rem] flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl relative overflow-hidden"
              :class="proximoStatus === 'SAIDA' ? 'bg-gradient-to-br from-[#4b79a1] to-[#283e51]' : 'bg-[#1e293b]'"
            >
              <template v-if="bloqueioTemporario">
                <span class="text-[10px] font-black text-white uppercase">Aguarde {{ contadorBloqueio }}s</span>
              </template>
              <template v-else>
                <span class="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-1 italic">Registrar</span>
                <span class="text-4xl font-black text-white uppercase tracking-wider">{{ proximoStatus }}</span>
              </template>
            </button>

            <div v-if="ultimoRegistro" class="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-5 flex justify-between items-center">
              <div>
                <p class="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest mb-1">Último Evento</p>
                <p class="text-sm font-black text-[#1e293b] uppercase">{{ ultimoRegistro.tipo }}</p>
              </div>
              <p class="text-[11px] font-bold text-[#64748b]">{{ ultimoRegistroDataHoraTexto }}</p>
            </div>
          </div>
        </div>

        <footer class="w-full flex justify-between px-2 mt-8">
          <span class="text-[9px] font-black text-[#cbd5e1] uppercase tracking-widest">ACASA V2.4</span>
          <span class="text-[9px] font-black text-[#cbd5e1] uppercase tracking-widest italic text-right">Conexão Criptografada</span>
        </footer>

        <p v-if="erro" class="mt-4 text-[10px] font-black text-rose-500 uppercase bg-rose-50 px-4 py-2 rounded-full text-center">
          {{ erro }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { PontoService } from './services/ponto.service'

const etapa = ref('termo')
const loading = ref(false)
const token = ref(localStorage.getItem('acasa_ponto_token') || '')
const parearCode = ref('')
const registrosHoje = ref([])
const enderecoAtual = ref('')
const coords = ref(null) // Rastreador de coordenadas para o mapa/backend
const erro = ref('')
const contadorBloqueio = ref(0)
const agora = ref(new Date())
let timerRelogio, timerBloqueio

// BLOQUEIO DE VOLTAR E FULLSCREEN
const lockApp = () => {
  if (etapa.value !== 'app') return
  history.pushState(null, '', location.href)
  window.onpopstate = () => history.pushState(null, '', location.href)
  if (document.documentElement.requestFullscreen && window.matchMedia('(display-mode: standalone)').matches) {
    document.documentElement.requestFullscreen().catch(() => {})
  }
}

const horaAgora = computed(() => agora.value.toLocaleTimeString('pt-BR'))
const dataHoje = computed(() => agora.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))
const ultimoRegistro = computed(() => registrosHoje.value.at(-1))
const proximoStatus = computed(() => (!ultimoRegistro.value || ultimoRegistro.value.tipo === 'SAIDA') ? 'ENTRADA' : 'SAIDA')
const bloqueioTemporario = computed(() => contadorBloqueio.value > 0)
const ultimoRegistroDataHoraTexto = computed(() => ultimoRegistro.value ? new Date(ultimoRegistro.value.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '')

// BUSCA APENAS RUA E BAIRRO (MAIS CONFIÁVEL)
async function buscarEndereco(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`)
    const data = await res.json()
    
    if (data.address) {
      const rua = data.address.road || data.address.pedestrian || ''
      const bairro = data.address.suburb || data.address.neighbourhood || data.address.village || ''
      
      // Formata apenas com Rua e Bairro para ficar limpo no card
      enderecoAtual.value = `${rua}${rua && bairro ? ', ' : ''}${bairro}`.toUpperCase()
    }
  } catch (e) { 
    enderecoAtual.value = "LOCALIZAÇÃO CAPTURADA"
  }
}

async function capturarLocalizacao() {
  if (!navigator.geolocation) return
  
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }

  navigator.geolocation.getCurrentPosition(
    async (p) => {
      coords.value = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }
      await buscarEndereco(p.coords.latitude, p.coords.longitude)
    },
    () => { erro.value = "POR FAVOR, ATIVE O GPS" },
    options
  )
}

async function baterPonto() {
  if (bloqueioTemporario.value) return
  loading.value = true
  
  navigator.geolocation.getCurrentPosition(async (p) => {
    try {
      await PontoService.registrar({ 
        tipo: proximoStatus.value, 
        latitude: p.coords.latitude, 
        longitude: p.coords.longitude, 
        precisao_metros: Math.round(p.coords.accuracy) 
      }, token.value)
      await carregarDados()
    } catch (e) { 
      erro.value = "ERRO NO REGISTRO"
    } finally { 
      loading.value = false
    }
  }, () => { 
    erro.value = "GPS NECESSÁRIO"; 
    loading.value = false
  }, { enableHighAccuracy: true })
}

async function carregarDados() {
  if (!token.value) return
  try {
    const res = await PontoService.hoje(token.value)
    registrosHoje.value = res.data || []
    
    if (ultimoRegistro.value) {
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
  } catch (e) {}
}

function confirmarAceite() {
  localStorage.setItem('acasa_ponto_aceite', 'true')
  etapa.value = token.value ? 'app' : 'ativar'
}

async function realizarPareamento() {
  if (!parearCode.value) return
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
  } catch (e) { 
    erro.value = "FALHA NA ATIVAÇÃO"
  } finally { 
    loading.value = false
  }
}

watch(etapa, (val) => { if (val === 'app') lockApp() })

onMounted(() => {
  timerRelogio = setInterval(() => { agora.value = new Date() }, 1000)
  if (!localStorage.getItem('acasa_ponto_aceite')) {
    etapa.value = 'termo'
  } else if (token.value) { 
    etapa.value = 'app'
    carregarDados()
    capturarLocalizacao()
  } else {
    etapa.value = 'ativar'
  }
})

onUnmounted(() => {
  clearInterval(timerRelogio)
  clearInterval(timerBloqueio)
})
</script>