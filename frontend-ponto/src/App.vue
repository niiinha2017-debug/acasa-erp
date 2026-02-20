<template>
  <div class="min-h-screen w-full bg-[#f8faff] flex items-center justify-center p-4 font-sans antialiased">
    <div class="w-full max-w-[400px] bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-50">
      
      <div class="p-8 sm:p-10 flex flex-col items-center">
        <div class="mb-8">
          <img src="/logo.png" alt="ACASA" class="h-14 w-14 object-contain" />
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
          <div class="w-full text-center border-b border-slate-100 pb-3">
            <p class="text-sm font-black text-[#1e293b] uppercase">{{ empresaNome }}</p>
            <p class="text-[10px] font-bold text-[#64748b] mt-0.5">{{ empresaCnpj }}</p>
          </div>
          <header class="text-center">
            <p class="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Bem-vindo(a)</p>
            <h2 class="text-xl font-black text-[#1e293b] uppercase truncate">{{ funcionarioNome }}</h2>
            <p v-if="pisCpfExibicao" class="text-[10px] font-bold text-[#64748b] mt-1">{{ pisCpfExibicao }}</p>
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

          <div v-if="registrosHojeOrdenados.length" class="space-y-3">
            <p class="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Registros de hoje</p>
            <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <ul class="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                <li
                  v-for="(reg, idx) in registrosHojeOrdenados"
                  :key="reg.id || idx"
                  class="px-4 py-3 space-y-1"
                  :class="idx === registrosHojeOrdenados.length - 1 ? 'bg-indigo-50/50' : ''"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-[#1e293b] uppercase">{{ reg.tipo_label || reg.tipo }}</span>
                    <span class="text-xs font-black text-slate-600 tabular-nums">{{ formatarDataHoraExata(reg.data_hora) }}</span>
                  </div>
                  <p v-if="reg.transacao_id" class="text-[9px] font-mono text-[#94a3b8] truncate" :title="reg.transacao_id">ID: {{ reg.transacao_id }}</p>
                </li>
              </ul>
            </div>
            <div v-if="ultimoRegistro" class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
              <p v-if="ultimoRegistro.transacao_id" class="text-[9px] text-[#64748b]">
                <span class="font-black uppercase">ID da transação:</span>
                <span class="font-mono block mt-1 break-all">{{ ultimoRegistro.transacao_id }}</span>
              </p>
              <button
                type="button"
                @click="enviarComprovanteWhatsApp"
                class="w-full h-11 rounded-xl bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#128C7E] active:scale-[0.98] transition-all"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar comprovante por WhatsApp
              </button>
            </div>
          </div>
        </div>

        <footer class="w-full mt-8 flex flex-col items-center gap-2">
          <div v-if="erro" class="w-full text-[10px] font-black text-rose-500 uppercase bg-rose-50 px-4 py-2 rounded-full text-center mb-4">
            {{ erro }}
          </div>
          <button
            v-if="isAndroid"
            type="button"
            @click="verificarAtualizacao"
            class="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest hover:text-[#1e293b] active:scale-95 transition-all"
          >
            Verificar atualização
          </button>
          <span class="text-[9px] font-black text-[#cbd5e1] uppercase tracking-[0.3em]">ACASA • REGISTRO DIGITAL</span>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PontoService } from './services/ponto.service'
import { checkPontoUpdate } from './utils/check-ponto-update'

const isAndroid = ref(false)

const etapa = ref('ativar')
const loading = ref(false)
const token = ref(localStorage.getItem('acasa_ponto_token') || '')
const funcionarioNome = ref(localStorage.getItem('acasa_funcionario_nome') || 'Funcionário')
const empresaNome = ref('')
const empresaCnpj = ref('')
const funcionarioCpf = ref('')
const funcionarioPis = ref('')
const parearCode = ref('')
const registrosHoje = ref([])
const erro = ref('')
const contadorBloqueio = ref(0)
const agora = ref(new Date())
let timerRelogio, timerBloqueio

const horaAgora = computed(() => agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
const dataHoje = computed(() => agora.value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }))
const registrosHojeOrdenados = computed(() => {
  const lista = Array.isArray(registrosHoje.value) ? [...registrosHoje.value] : []
  return lista.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
})
const ultimoRegistro = computed(() => {
  const lista = registrosHojeOrdenados.value
  return lista.length ? lista[lista.length - 1] : null
})
const proximoStatus = computed(() => (!ultimoRegistro.value || ultimoRegistro.value.tipo === 'SAIDA') ? 'ENTRADA' : 'SAIDA')
const bloqueioTemporario = computed(() => contadorBloqueio.value > 0)
const ultimoRegistroHoraTexto = computed(() => {
  if (!ultimoRegistro.value?.data_hora) return ''
  const d = new Date(ultimoRegistro.value.data_hora)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
})

const ultimoRegistroDataTexto = computed(() => {
  if (!ultimoRegistro.value?.data_hora) return ''
  const d = new Date(ultimoRegistro.value.data_hora)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

const pisCpfExibicao = computed(() => {
  const parts = []
  if (funcionarioPis.value) parts.push(`PIS: ${funcionarioPis.value}`)
  if (funcionarioCpf.value) parts.push(maskCpf(funcionarioCpf.value))
  return parts.length ? parts.join('  •  ') : ''
})

const SEGUNDOS_BLOQUEIO = 180

function maskCpf(v) {
  if (!v) return ''
  const s = String(v).replace(/\D/g, '')
  if (s.length !== 11) return v
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`
}

function maskCnpj(v) {
  if (!v) return ''
  const s = String(v).replace(/\D/g, '')
  if (s.length !== 14) return v
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
}

function formatarDataHoraExata(dataHora) {
  if (!dataHora) return '--:--'
  const d = new Date(dataHora)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatarHoraRegistro(dataHora) {
  if (!dataHora) return '--:--'
  const d = new Date(dataHora)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function enviarComprovanteWhatsApp() {
  const reg = ultimoRegistro.value
  if (!reg) return
  const dataHoraStr = formatarDataHoraExata(reg.data_hora)
  const nome = funcionarioNome.value || 'Funcionário'
  const tipoLabel = reg.tipo_label || reg.tipo
  const pisCpf = pisCpfExibicao.value ? `\n${pisCpfExibicao.value}` : ''
  const idTransacao = reg.transacao_id ? `\nID: ${reg.transacao_id}` : ''
  const msg =
`Comprovante de ponto - ${empresaNome.value || 'ACASA'}
CNPJ: ${empresaCnpj.value || '-'}

${nome}${pisCpf}

Data e Hora: ${dataHoraStr}
Tipo: ${tipoLabel}${idTransacao}`
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
  if (typeof window !== 'undefined' && window.open) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    window.location.href = url
  }
}

async function carregarDados() {
  if (!token.value) return
  try {
    const [resMe, resHoje] = await Promise.all([
      PontoService.me(token.value),
      PontoService.hoje(token.value)
    ])
    
    const dataMe = resMe?.data || {}
    const nome = dataMe.nome || dataMe.funcionario?.nome || funcionarioNome.value

    funcionarioNome.value = nome
    localStorage.setItem('acasa_funcionario_nome', nome)

    empresaNome.value = dataMe.empresa?.nome || 'Empresa'
    empresaCnpj.value = maskCnpj(dataMe.empresa?.cnpj || '') || dataMe.empresa?.cnpj || ''
    funcionarioCpf.value = dataMe.cpf || ''
    funcionarioPis.value = dataMe.pis ? String(dataMe.pis).trim() : ''

    const hojeData = Array.isArray(resHoje?.data)
      ? resHoje.data
      : Array.isArray(resHoje?.data?.data)
        ? resHoje.data.data
        : []

    registrosHoje.value = hojeData
    
    if (ultimoRegistro.value) {
      const diff = Math.floor((Date.now() - new Date(ultimoRegistro.value.data_hora).getTime()) / 1000)
      if (diff < SEGUNDOS_BLOQUEIO) {
        contadorBloqueio.value = SEGUNDOS_BLOQUEIO - diff
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
    
    // Limpa o código da URL para ficar elegante
    window.history.replaceState({}, document.title, window.location.pathname);
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

  // --- CAPTURA O CÓDIGO DA URL ---
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code && !token.value) {
    parearCode.value = code.toUpperCase()
    // Tenta ativar automático após 500ms
    setTimeout(() => {
      realizarPareamento()
    }, 500)
  }
  // -------------------------------

  if (token.value) {
    etapa.value = 'app'
    carregarDados()
  }

  // Android: detectar plataforma e checar atualização após 2s
  import('@capacitor/core').then(({ Capacitor }) => {
    if (Capacitor.getPlatform() === 'android') {
      isAndroid.value = true
      setTimeout(() => checkPontoUpdate(), 2000)
    }
  }).catch(() => {})
})

async function verificarAtualizacao() {
  await checkPontoUpdate({ interactive: true })
}

onUnmounted(() => {
  clearInterval(timerRelogio)
  clearInterval(timerBloqueio)
})
</script>