<template>
  <div :class="{'dark': darkTheme}">
    <div class="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 flex items-center justify-center p-0 sm:p-4">
      
      <div class="w-full max-w-[420px] min-h-screen sm:min-h-fit bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-x border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col relative transition-all">
        
        <header class="p-8 pb-4 flex justify-between items-center sticky top-0 z-20">
          <div class="flex flex-col">
            <span class="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em]">Global ERP</span>
            <h1 class="text-2xl font-black tracking-tighter italic dark:text-white uppercase leading-none">
              ACASA<span class="text-indigo-600">.</span>PONTO
            </h1>
          </div>
          
          <div class="flex gap-2">
            <button @click="darkTheme = !darkTheme" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:scale-110 transition-all">
              <span v-if="!darkTheme">🌙</span><span v-else>☀️</span>
            </button>
            <button v-if="token" @click="sair" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </header>

        <section v-if="etapa === 'termo'" class="flex-1 p-10 flex flex-col justify-center animate-in">
          <div class="mb-10">
            <h2 class="text-4xl font-black tracking-tighter leading-[0.9] dark:text-white uppercase mb-6">
              Privacidade<br/><span class="text-indigo-600">e Ética.</span>
            </h2>
            <div class="space-y-4 text-sm text-slate-500 dark:text-slate-400 font-medium italic border-l-2 border-indigo-600 pl-4">
              <p>Eu, na qualidade de titular, autorizo a coleta de geolocalização exata e metadados de rede no momento do registro.</p>
              <p>Esta operação cumpre o Art. 7º da LGPD para fins de execução de contrato de trabalho.</p>
            </div>
          </div>
          <button @click="confirmarAceite" class="w-full h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all">
            Eu Aceito os Termos
          </button>
        </section>

        <section v-else-if="!token" class="flex-1 p-10 flex flex-col justify-center animate-in">
          <h2 class="text-3xl font-black tracking-tighter uppercase dark:text-white mb-8">
            Ativar<br/><span class="text-indigo-600">Terminal.</span>
          </h2>
          <div class="space-y-4">
            <input v-model="parearCode" type="text" placeholder="INSIRA O CÓDIGO" class="w-full h-16 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-6 font-mono text-xl font-bold uppercase focus:ring-2 ring-indigo-500 outline-none dark:text-white" />
            <button @click="realizarPareamento" class="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-indigo-500/20">
              Vincular Agora
            </button>
          </div>
        </section>

        <main v-else class="flex-1 p-8 pt-4 space-y-6 overflow-y-auto">
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-all"></div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1 italic">Conectado como</p>
            <h2 class="text-2xl font-black tracking-tight uppercase truncate">{{ funcionarioNome }}</h2>
            
            <div class="mt-8 grid grid-cols-2 gap-3">
              <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                <span class="block text-[8px] font-black uppercase opacity-50 mb-1">GPS</span>
                <span class="text-[10px] font-bold" :class="coords ? 'text-emerald-400' : 'text-amber-400'">{{ gpsTexto }}</span>
              </div>
              <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                <span class="block text-[8px] font-black uppercase opacity-50 mb-1">Data</span>
                <span class="text-[10px] font-bold">{{ hojeTexto }}</span>
              </div>
            </div>
          </div>

          <div v-if="localidadeEncontrada" class="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4 animate-in">
            <div class="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">📍</div>
            <div class="overflow-hidden text-left">
              <p class="text-[9px] font-black text-emerald-600 uppercase italic leading-none mb-1">Localização Confirmada</p>
              <p class="text-xs font-black dark:text-white truncate uppercase">{{ localidadeEncontrada }}</p>
            </div>
          </div>

          <div v-if="ultimoRegistro" class="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-[2rem] flex items-center justify-between">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 italic">Última Batida ({{ ultimoRegistro.tipo }})</p>
              <p class="text-3xl font-black dark:text-white tracking-tighter italic leading-none">{{ formatarHora(ultimoRegistro.data_hora) }}</p>
            </div>
            <div class="h-12 w-[2px] bg-slate-200 dark:bg-slate-700"></div>
            <div class="text-right">
              <span class="text-[9px] font-black text-slate-400 uppercase">Status</span>
              <p class="text-[10px] font-bold text-emerald-500 uppercase">OK</p>
            </div>
          </div>

          <div class="pt-4 sticky bottom-0">
            <button @click="baterPonto" class="w-full h-24 bg-indigo-600 dark:bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-white dark:text-slate-900 active:scale-95 transition-all group relative overflow-hidden">
              <div class="relative z-10 flex flex-col items-center">
                <p class="text-[10px] font-black uppercase tracking-[0.5em] mb-1 opacity-70 italic">Clique para Sincronizar</p>
                <h2 class="text-2xl font-black uppercase tracking-widest leading-none">REGISTRAR {{ proximoStatus }}</h2>
              </div>
            </button>
          </div>
        </main>

        <footer class="p-6 text-center">
          <p class="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">Identificação por Assinatura Digital</p>
        </footer>
      </div>

      <div v-if="loading" class="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center">
        <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-6 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Processando dados...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { PontoService } from './services/ponto.service'; // Seu arquivo Axios

// --- ESTADO ---
const darkTheme = ref(true);
const etapa = ref('termo'); // 'termo', 'app'
const loading = ref(false);
const token = ref(localStorage.getItem('acasa_ponto_token') || '');
const parearCode = ref('');
const funcionarioNome = ref('');
const registrosHoje = ref([]);
const coords = ref(null);
const gpsTexto = ref('Pendente');
const localidadeEncontrada = ref('');

// --- COMPUTED ---
const hojeTexto = computed(() => new Date().toLocaleDateString('pt-BR'));
const ultimoRegistro = computed(() => registrosHoje.value[registrosHoje.value.length - 1] || null);
const proximoStatus = computed(() => {
  return String(ultimoRegistro.value?.tipo).toUpperCase() === 'ENTRADA' ? 'Saída' : 'Entrada';
});

// --- MÉTODOS ---
const formatarHora = (data) => new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function sair() {
  localStorage.clear();
  location.reload();
}

function confirmarAceite() {
  localStorage.setItem('acasa_ponto_aceite', 'true');
  etapa.value = 'app';
}

async function carregarDados() {
  if (!token.value) return;
  loading.value = true;
  try {
    const [me, hoje] = await Promise.all([
      PontoService.me(token.value),
      PontoService.hoje(token.value)
    ]);
    funcionarioNome.value = me.data.nome;
    registrosHoje.value = hoje.data;
  } catch (e) {
    if (e.response?.status === 401) sair();
  } finally {
    loading.value = false;
  }
}

async function capturarGPS() {
  gpsTexto.value = 'Buscando...';
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        coords.value = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
        gpsTexto.value = 'Sinal OK';
        resolve(coords.value);
      },
      () => { gpsTexto.value = 'Erro GPS'; resolve(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

async function realizarPareamento() {
  if (!parearCode.value) return;
  loading.value = true;
  try {
    const res = await PontoService.ativar({
      code: parearCode.value.toUpperCase().trim(),
      device_uuid: crypto.randomUUID(), // Gera um ID único para este celular
      device_nome: 'Mobile App',
      plataforma: 'PWA'
    });
    token.value = res.data.token;
    localStorage.setItem('acasa_ponto_token', token.value);
    await carregarDados();
  } catch (e) {
    alert(e.response?.data?.message || 'Código inválido');
  } finally {
    loading.value = false;
  }
}

async function baterPonto() {
  loading.value = true;
  const gps = await capturarGPS();
  
  if (!gps) {
    alert("Para registrar o ponto, você precisa permitir o acesso ao GPS.");
    loading.value = false;
    return;
  }

  try {
    const payload = {
      tipo: proximoStatus.value.toUpperCase(),
      latitude: gps.lat,
      longitude: gps.lng,
      precisao_metros: Math.round(gps.acc)
    };
    
    await PontoService.registrar(payload, token.value);
    await carregarDados(); // Atualiza a lista e o card
  } catch (e) {
    alert(e.response?.data?.message || "Erro ao registrar ponto.");
  } finally {
    loading.value = false;
  }
}

// --- CICLO DE VIDA ---
onMounted(() => {
  if (localStorage.getItem('acasa_ponto_aceite')) {
    etapa.value = 'app';
  }
  if (token.value) {
    carregarDados();
  }
});
</script>

<style scoped>
.animate-in { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
/* Esconde a barra de scroll mas permite rolar */
::-webkit-scrollbar { width: 0px; background: transparent; }
</style>