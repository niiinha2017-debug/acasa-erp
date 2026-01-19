<template>
  <div class="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
    <div class="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-100">
      <header class="text-center mb-8">
        <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Painel Administrativo</span>
        <h1 class="text-2xl font-black uppercase italic">
          Gerar <span class="text-indigo-600">Acesso</span>
        </h1>
      </header>

      <div class="space-y-6">
        <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center">
          <p class="text-[10px] font-black text-indigo-400 uppercase mb-2">Código de Ativação</p>
          <h2 class="text-4xl font-black text-indigo-900 tracking-widest">
            {{ convite?.code || '—' }}
          </h2>

          <p v-if="convite?.expira_em" class="mt-2 text-[11px] font-bold text-indigo-700">
            Expira: {{ formatDate(convite.expira_em) }}
          </p>
        </div>

        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
          Funcionário (ID)
        </label>
        <input
          v-model.number="funcionarioId"
          type="number"
          class="w-full h-12 px-4 rounded-2xl bg-slate-100 border border-slate-200 font-bold text-slate-800"
          placeholder="Ex: 1"
        />

        <button
          @click="gerarNovoCodigo"
          :disabled="loading || !funcionarioId"
          class="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {{ loading ? 'Gerando...' : 'Gerar Novo Código' }}
        </button>

        <div class="pt-4 border-t border-slate-100">
          <p class="text-[11px] text-slate-400 text-center leading-relaxed">
            Envie este código ao funcionário. Ele deverá abrir o link:
            <span class="font-black text-slate-700">/ponto/ativar?code=...</span>
          </p>

          <div v-if="convite?.code" class="mt-4 flex gap-2">
            <input
              class="w-full h-12 px-4 rounded-2xl bg-slate-100 border border-slate-200 font-bold text-slate-700"
              :value="linkAtivacao"
              readonly
            />
            <button
              class="h-12 px-4 rounded-2xl border border-slate-300 font-black uppercase text-[11px]"
              @click="copiar(linkAtivacao)"
            >
              Copiar
            </button>
          </div>
        </div>

        <p v-if="erro" class="text-[12px] font-bold text-red-600 text-center">{{ erro }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/services/api'

// ⚠️ precisa do token do ERP (admin) para chamar /ponto/convites
// ajuste aqui de onde você guarda esse token admin
const adminToken = localStorage.getItem('erp_token') || ''

const funcionarioId = ref(1)
const convite = ref(null)
const loading = ref(false)
const erro = ref('')

const linkAtivacao = computed(() => {
  if (!convite.value?.code) return ''
  return `${window.location.origin}/ponto/ativar?code=${convite.value.code}`
})

async function gerarNovoCodigo() {
  erro.value = ''
  convite.value = null
  loading.value = true

  try {
    const res = await api.post(
      '/ponto/convites',
      { funcionario_id: Number(funcionarioId.value) },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    )

    convite.value = res?.data || null
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Falha ao gerar convite.'
  } finally {
    loading.value = false
  }
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {}
}

function formatDate(v) {
  try {
    return new Date(v).toLocaleString('pt-BR')
  } catch {
    return String(v)
  }
}
</script>
