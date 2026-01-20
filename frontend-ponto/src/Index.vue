<template>
  <div class="min-h-screen w-full bg-slate-50 relative overflow-hidden">
    <!-- fundo leve (igual login) -->
    <div class="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-brand-primary/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-brand-dark/10 blur-3xl"></div>

    <div class="min-h-screen w-full flex items-center justify-center px-4 py-10">
      <Card class="w-full max-w-[980px] overflow-hidden" :shadow="true">
        <div class="grid grid-cols-12">
          <!-- ESQUERDA -->
          <div class="hidden md:flex md:col-span-5 bg-slate-50 border-r border-slate-100 p-10 items-center justify-center">
            <div class="text-center">
              <div class="relative inline-flex items-center justify-center">
                <div class="absolute inset-0 bg-brand-primary/15 blur-2xl rounded-full"></div>
                <div class="relative h-24 w-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src="/pwa-192.png" alt="ACASA" class="h-14 w-14 object-contain" />
                </div>
              </div>

              <div class="mt-7">
                <div class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">GLOBAL ERP</div>
                <div class="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  ACASA<span class="text-brand-primary">.</span>PONTO
                </div>
              </div>

              <div class="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Ativação de Terminal
              </div>

              <div class="mt-8 h-px w-14 mx-auto bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

              <p class="mt-6 text-sm text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                Digite o código recebido para vincular este dispositivo ao relógio de ponto.
              </p>

              <!-- bloco LGPD/GPS -->
              <div class="mt-8 bg-white/70 border border-slate-100 rounded-2xl p-5 text-left">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Privacidade e Ética
                </p>
                <p class="text-[12px] font-bold text-slate-600 leading-relaxed">
                  Geolocalização e metadados de rede são coletados apenas no momento do registro (entrada/saída),
                  para validação do ponto. Sem rastreamento em segundo plano.
                </p>

                <div class="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                  <a
                    href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    LGPD (texto oficial)
                  </a>
                  <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <a
                    href="https://www.gov.br/anpd/pt-br"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    ANPD
                  </a>
                </div>
              </div>

              <div class="mt-10 text-[9px] font-black uppercase tracking-[0.28em] text-slate-300">
                Identificação por assinatura digital
              </div>
            </div>
          </div>

          <!-- DIREITA -->
          <div class="col-span-12 md:col-span-7 p-8 sm:p-10">
            <!-- topo mobile -->
            <div class="md:hidden flex flex-col items-center mb-8">
              <div class="relative">
                <div class="absolute inset-0 bg-brand-primary/15 blur-2xl rounded-full"></div>
                <div class="relative h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src="/pwa-192.png" alt="ACASA" class="h-10 w-10 object-contain" />
                </div>
              </div>

              <div class="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">GLOBAL ERP</div>
              <div class="mt-1 text-lg font-black tracking-tight text-slate-900 uppercase">
                ACASA<span class="text-brand-primary">.</span>PONTO
              </div>

              <div class="mt-4 h-px w-12 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
            </div>

            <header class="text-center md:text-left">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none">
                Ativar Terminal<span class="text-brand-primary">.</span>
              </h2>
              <p class="text-slate-400 mt-3 text-[11px] font-black uppercase tracking-[0.2em]">
                Insira o código de ativação
              </p>
            </header>

            <form class="mt-8 space-y-6" @submit.prevent="handleAtivar">
              <Input
                v-model="code"
                label="Código"
                placeholder="INSIRA O CÓDIGO"
                :force-upper="true"
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                :loading="loading"
                class="h-14 shadow-2xl shadow-brand-primary/25"
              >
                {{ loading ? 'Vinculando...' : 'Vincular Agora' }}
              </Button>

              <p v-if="error" class="text-center text-xs font-bold text-danger">
                {{ error }}
              </p>

              <div class="pt-6 flex items-center justify-center md:justify-start gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                <span>Conexão Segura</span>
                <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>PWA</span>
              </div>

              <div class="md:hidden pt-6 text-center text-[9px] font-black uppercase tracking-[0.28em] text-slate-300">
                Identificação por assinatura digital
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const router = useRouter()

const code = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  const q = String(route.query.code || '').trim()
  if (q) code.value = q
})

async function handleAtivar() {
  error.value = ''
  loading.value = true

  try {
    // Ajuste aqui se seu backend usar outro formato
    await api.post('/ponto/ativar', { code: String(code.value || '').trim().toUpperCase() })

    // redirecione para onde sua PWA segue após ativar
    router.push('/ponto')
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha ao ativar o terminal.'
  } finally {
    loading.value = false
  }
}
</script>
