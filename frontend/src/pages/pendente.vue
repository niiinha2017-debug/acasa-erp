<template>
  <div class="w-full h-full flex items-center justify-center p-6">
    <div class="w-full max-w-[520px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/40">
        <h1 class="text-lg font-black uppercase tracking-tight text-slate-800">
          Acesso pendente
        </h1>
        <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
          Aguarde a aprovação do administrador
        </p>
      </div>

      <div class="px-6 py-6 space-y-4">
        <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p class="text-sm font-semibold text-amber-900">
            Seu cadastro foi recebido.
          </p>
          <p class="text-sm text-amber-900/80 mt-1">
            Aguarde a aprovação do administrador para liberar seu acesso.
          </p>
        </div>

        <div class="text-sm text-slate-600 space-y-1">
          <p>• Se você já foi liberado, clique em <b>Entrar</b>.</p>
          <p>• Se ainda não, fale com o administrativo.</p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" label="Recarregar" @click="reload" />
          <Button label="Entrar" @click="verificarAcesso" :loading="loading" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/services/useauth' 
import { useRouter } from 'vue-router'

// Adicionei o definePage para garantir que a rota seja reconhecida corretamente
definePage({ 
  meta: { 
    public: true, // Permitir que o router processe essa página mesmo sem o status ATIVO
    layout: 'auth' 
  } 
})

const { syncMe, loading } = useAuth()
const router = useRouter()

async function verificarAcesso() {
  try {
    const user = await syncMe() // Vai no servidor e atualiza o estado reativo global
    
    if (user && user.status === 'ATIVO') {
      // Se agora é ativo, o router.beforeEach vai permitir a entrada na Home
      router.push('/') 
    } else {
      alert('Seu cadastro ainda está sob análise ou sua conta está inativa.')
    }
  } catch (e) {
    console.error('Erro ao sincronizar', e)
    alert('Não foi possível verificar seu status. Tente novamente.')
  }
}

function reload() {
  window.location.reload()
}
</script>