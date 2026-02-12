<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white">
      
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-10 border-b border-slate-50 bg-slate-50/50">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl rotate-3">
            <i class="pi pi-link text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none">Convites do Ponto</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
               <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
               Geração de acesso privado para colaboradores
            </p>
          </div>
        </div>
        
        <Button 
          variant="secondary" 
          class="!h-12 !rounded-xl !px-6 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400 hover:text-slate-900 transition-all"
          @click="router.push('/rh')"
        >
          <i class="pi pi-arrow-left mr-2 text-[10px]"></i>
          Voltar ao RH
        </Button>
      </header>

      <div class="p-10 lg:p-16 relative">
        <Loading v-if="loading" />

        <div v-else class="max-w-4xl mx-auto space-y-12">
          
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div class="md:col-span-8">
              <SearchInput
                v-model="funcionario_id"
                mode="select"
                label="SELECIONE O COLABORADOR PARA O CONVITE"
                placeholder="Pesquise por nome ou CPF..."
                :options="funcionariosOptions"
                labelKey="label"
                valueKey="value"
                class="premium-input"
              />
            </div>
            <div class="md:col-span-4">
              <Button
                v-if="podeGerar"
                variant="primary"
                class="w-full h-14 !rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all font-black text-[11px] uppercase tracking-widest"
                :loading="loadingGerar"
                :disabled="!funcionario_id"
                @click="confirmarGerarConvite"
              >
                <i class="pi pi-bolt mr-2"></i>
                Gerar Novo Convite
              </Button>
            </div>
          </div>

          <div v-if="convite" class="animate-in slide-in-from-top-4 duration-500">
            <div class="bg-slate-50/50 rounded-[3rem] p-10 lg:p-14 border-2 border-dashed border-slate-100 relative overflow-hidden">
              
              <i class="pi pi-qrcode absolute -right-10 -bottom-10 text-[200px] text-slate-100/50 -rotate-12"></i>

              <div class="relative z-10 space-y-8">
                <div class="space-y-3">
                  <label class="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 block">Link de Acesso Único</label>
                  <div class="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <input
                      class="flex-1 bg-transparent border-none font-bold text-slate-700 text-lg px-6 focus:ring-0 outline-none w-full"
                      :value="convite.url"
                      readonly
                    />
                    <button 
                     v-if="podeGerar"
                      @click="copiar(convite.url)"
                      class="w-full sm:w-auto h-12 px-8 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      <i class="pi pi-copy"></i>
                      Copiar Link
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm group hover:border-brand-primary transition-colors">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código de Ativação</p>
                    <p class="text-2xl font-black text-slate-900 tracking-[0.3em] uppercase italic">{{ convite.code }}</p>
                  </div>
                  <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Validade do Link</p>
                    <p class="text-2xl font-black text-slate-700 tabular-nums">{{ formatDate(convite.expira_em) }}</p>
                  </div>
                </div>

                <div class="pt-4 max-w-md mx-auto">
                  <button
                   v-if="podeGerar"
                    @click="abrirWhats()"
                    class="w-full h-16 rounded-[1.2rem] bg-[#25D366] text-white hover:bg-[#128C7E] shadow-xl shadow-green-500/20 transition-all flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest"
                  >
                    <i class="pi pi-whatsapp text-xl"></i>
                    Enviar Convite via WhatsApp
                  </button>
                </div>
              </div>
            </div>
            
            <p class="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-10">
              <i class="pi pi-info-circle mr-2"></i>
              Certifique-se de que o colaborador recebeu o link corretamente.
            </p>
          </div>

          <div v-if="!convite && !loading" class="py-20 text-center border-2 border-dashed border-slate-50 rounded-[3rem]">
             <i class="pi pi-user-plus text-5xl text-slate-100 mb-4"></i>
             <p class="text-slate-300 font-bold uppercase text-xs tracking-[0.2em]">Selecione um funcionário acima para gerar o convite</p>
          </div>

        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { FuncionarioService, PontoService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()

const loading = ref(true)
const loadingGerar = ref(false)

const funcionarios = ref([])
const funcionario_id = ref(null)
const convite = ref(null)

// ✅ perms (reaproveitando as que você já tem)
const permTelaVer = 'ponto_relatorio.ver'
const permConviteGerenciar = 'ponto_relatorio.editar'
const permFuncionariosVer = 'funcionarios.ver'

const podeVerTela = computed(() => can(permTelaVer))
const podeGerar = computed(() => can(permConviteGerenciar))
const podeListarFuncionarios = computed(() => can(permFuncionariosVer))

const funcionariosOptions = computed(() =>
  (funcionarios.value || []).map((f) => ({
    label: `${String(f.nome || '').toUpperCase()} #${f.id}`,
    value: f.id,
  })),
)

onMounted(async () => {
  // ✅ bloqueio de rota (padrão)
if (!podeVerTela.value) {
  notify.error('Acesso negado.')
  loading.value = false
  router.push('/')
  return
}

if (!podeListarFuncionarios.value) {
  notify.error('Acesso negado (funcionários).')
  loading.value = false
  router.push('/rh')
  return
}


  try {
    const res = await FuncionarioService.listar()
    const data = res?.data?.data ?? res?.data ?? res
    funcionarios.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.log('[ERRO listar funcionarios]', e)
    notify.error(e?.response?.data?.message || 'Falha ao carregar funcionários.')
  } finally {
    loading.value = false
  }
})

async function confirmarGerarConvite() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!funcionario_id.value) return

  const ok = await confirm.show('Gerar Convite', 'Deseja gerar um novo convite para este colaborador?')
  if (!ok) return
  await gerar()
}

async function gerar() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!funcionario_id.value) return

  loadingGerar.value = true
  convite.value = null

  try {
    const res = await PontoService.gerarConvite(Number(funcionario_id.value))
    const data = res?.data || {}

    const code = data.code || data.codigo || data.token || data.convite || null
    if (!code) {
      notify.error('Convite gerado, mas não retornou o código.')
      return
    }

    const codeEnc = encodeURIComponent(code)

    // ✅ abre o APP (se estiver instalado e configurado)
    const appUrl = `acasa-ponto://ativar?code=${codeEnc}`

    // ✅ fallback web (sempre funciona)
    const PONTO_BASE_URL = 'https://ponto.acasamarcenaria.com.br'
    const webUrl = `${PONTO_BASE_URL}/ativar?code=${codeEnc}`

    convite.value = { ...data, code, appUrl, webUrl }
    notify.success('Convite gerado.')
  } catch (e) {
    console.error(e)
    notify.error(e?.response?.data?.message || 'Não foi possível gerar o convite.')
  } finally {
    loadingGerar.value = false
  }
}


async function copiar(texto) {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  try {
    await navigator.clipboard.writeText(texto)
    notify.success('Link copiado.')
  } catch {
    notify.error('Não foi possível copiar.')
  }
}

function abrirWhats() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!convite.value?.appUrl && !convite.value?.webUrl) return

  const id = Number(funcionario_id.value)
  const f = funcionarios.value.find((x) => x.id === id)
  const nome = f?.nome ? String(f.nome).trim() : 'tudo bem'

  const msg =
`Olá ${nome}!
Segue seu link privado para ativar o APP do Ponto:

✅ Abrir no APP (se já estiver instalado):
${convite.value.appUrl}

🌐 Se não abrir, use no navegador:
${convite.value.webUrl}

Se expirar, me avise que eu gero outro.`

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString('pt-BR') } catch { return String(v) }
}
</script>

