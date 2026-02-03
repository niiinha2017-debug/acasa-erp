<template>
  <div class="min-h-screen w-full bg-[#f8faff] flex items-center justify-center p-4 font-sans antialiased">
    <div class="w-full max-w-[400px] bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-50">
      
      <div class="p-8 sm:p-10 flex flex-col items-center">
        <div class="mb-8">
          <img src="/pwa-192.png" alt="ACASA" class="h-14 w-14 object-contain" />
        </div>

        <div v-if="etapa === 'ativar'" class="w-full space-y-6 animate-in">
          <header class="text-center mb-6">
            <h2 class="text-2xl font-black text-[#1e293b] uppercase tracking-tight">Vincular</h2>
            <p class="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mt-1">Configuração Inicial</p>
          </header>

          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Código do Convite</label>
            <input v-model="parearCode" type="text" placeholder="EX: A1B2C3" 
              class="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-black uppercase focus:ring-2 focus:ring-[#1e293b] outline-none transition-all" />
          </div>

          <button @click="realizarPareamento" :disabled="loading" 
            class="w-full h-16 bg-[#1e293b] text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center disabled:opacity-50">
            <span v-if="!loading">Ativar Dispositivo</span>
            <div v-else class="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
          </button>
        </div>

        <div v-else class="w-full space-y-6 animate-in">
          <header class="text-center">
            <p class="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Bem-vindo(a)</p>
            <h2 class="text-xl font-black text-[#1e293b] uppercase truncate">{{ funcionarioNome }}</h2>
          </header>

          <div class="bg-slate-50 rounded-[2.5rem] p-8 text-center border border-slate-100">
            <p class="text-5xl font-black text-[#1e293b] tracking-tighter">{{ horaAgora }}</p>
            <p class="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mt-2">{{ dataHoje }}</p>
          </div>

          <button @click="baterPonto" :disabled="loading || bloqueioTemporario"
            class="w-full h-32 rounded-[2.5rem] flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl relative overflow-hidden"
            :class="proximoStatus === 'SAIDA' ? 'bg-gradient-to-br from-[#4b79a1] to-[#283e51]' : 'bg-[#1e293b]'"
          >
            <template v-if="bloqueioTemporario">
              <span class="text-[10px] font-black text-white/50 uppercase mb-1">Aguarde para registrar</span>
              <span class="text-2xl font-black text-white uppercase">{{ contadorBloqueio }}s</span>
            </template>
            <template v-else-if="loading">
              <div class="animate-spin h-8 w-8 border-4 border-white/20 border-t-white rounded-full"></div>
            </template>
            <template v-else>
              <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1 italic">Toque para registrar</span>
              <span class="text-4xl font-black text-white uppercase tracking-wider">{{ proximoStatus }}</span>
            </template>
          </button>

          <div v-if="ultimoRegistro" class="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p class="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest mb-0.5">Último Evento</p>
              <p class="text-xs font-black text-[#1e293b] uppercase">{{ ultimoRegistro.tipo }} às {{ ultimoRegistroHoraTexto }}</p>
            </div>
            <div class="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
              <div class="h-2 w-2 rounded-full bg-indigo-500"></div>
            </div>
          </div>
        </div>

        <footer class="w-full mt-8 flex flex-col items-center gap-2">
          <div v-if="erro" class="w-full text-[10px] font-black text-rose-500 uppercase bg-rose-50 px-4 py-2 rounded-full text-center mb-4">
            {{ erro }}
          </div>
          <span class="text-[9px] font-black text-[#cbd5e1] uppercase tracking-[0.3em]">ACASA • REGISTRO DIGITAL</span>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PontoService } from './services/ponto.service'

const etapa = ref('ativar')
const loading = ref(false)
const token = ref(localStorage.getItem('acasa_ponto_token') || '')
const funcionarioNome = ref(localStorage.getItem('acasa_funcionario_nome') || 'Funcionário')
const parearCode = ref('')
const registrosHoje = ref([])
const erro = ref('')
const contadorBloqueio = ref(0)
const agora = ref(new Date())
let timerRelogio, timerBloqueio

const horaAgora = computed(() => agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
const dataHoje = computed(() => agora.value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }))
const ultimoRegistro = computed(() => registrosHoje.value.at(-1))
const proximoStatus = computed(() => (!ultimoRegistro.value || ultimoRegistro.value.tipo === 'SAIDA') ? 'ENTRADA' : 'SAIDA')
const bloqueioTemporario = computed(() => contadorBloqueio.value > 0)
const ultimoRegistroHoraTexto = computed(() => ultimoRegistro.value ? new Date(ultimoRegistro.value.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

async function carregarDados() {
  if (!token.value) return
  try {
    const [resMe, resHoje] = await Promise.all([
      PontoService.me(token.value),
      PontoService.hoje(token.value)
    ])
    
    funcionarioNome.value = resMe.data.nome
    localStorage.setItem('acasa_funcionario_nome', resMe.data.nome)
    registrosHoje.value = resHoje.data || []
    
    // Trava de 30 segundos
    if (ultimoRegistro.value) {
      const diff = Math.floor((Date.now() - new Date(ultimoRegistro.value.data_hora).getTime()) / 1000)
      if (diff < 30) {
        contadorBloqueio.value = 30 - diff
        startTimerBloqueio()
      }
    }
  } catch (e) {
    if (e.response?.status === 401) {
      token.value = ''
      localStorage.clear()
      etapa.value = 'ativar'
    }
  }
}

async function baterPonto() {
  if (bloqueioTemporario.value || loading.value) return
  loading.value = true
  erro.value = ""
  try {
    await PontoService.registrar({ tipo: proximoStatus.value }, token.value)
    await carregarDados()
  } catch (e) {
    erro.value = e.response?.data?.message || "ERRO NO REGISTRO"
  } finally {
    loading.value = false
  }
}

async function realizarPareamento() {
  if (!parearCode.value) return
  loading.value = true
  erro.value = ""
  try {
    const res = await PontoService.ativar({ 
      code: parearCode.value.trim().toUpperCase(), 
      device_uuid: crypto.randomUUID().toUpperCase(),
      plataforma: 'PWA' 
    })
    token.value = res.data.token
    localStorage.setItem('acasa_ponto_token', token.value)
    etapa.value = 'app'
    await carregarDados()
  } catch (e) {
    erro.value = "CÓDIGO INVÁLIDO OU EXPIRADO"
  } finally {
    loading.value = false
  }
}

function startTimerBloqueio() {
  clearInterval(timerBloqueio)
  timerBloqueio = setInterval(() => {
    if (contadorBloqueio.value > 0) contadorBloqueio.value--
    else clearInterval(timerBloqueio)
  }, 1000)
}

onMounted(() => {
  timerRelogio = setInterval(() => { agora.value = new Date() }, 1000)
  if (token.value) {
    etapa.value = 'app'
    carregarDados()
  }
})

onUnmounted(() => {
  clearInterval(timerRelogio)
  clearInterval(timerBloqueio)
})
</script>