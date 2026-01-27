<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-lock text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Permissões de Acesso</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Controle de níveis e segurança por usuário</p>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="usuarioSelecionado" class="flex items-center gap-2 bg-brand-primary/5 px-3 py-1.5 rounded-lg border border-brand-primary/10">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
          <span class="text-[10px] font-black uppercase text-brand-primary tracking-widest">
            Editando: {{ usuarioSelecionado.nome }}
          </span>
        </div>
      </Transition>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[650px] flex flex-col lg:flex-row">
      
      <aside class="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div class="p-4 border-b border-slate-100 bg-white">
          <div class="relative group">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
            <input 
              v-model="filtroUsuarios"
              type="text"
              placeholder="BUSCAR COLABORADOR..."
              class="w-full pl-9 pr-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase focus:bg-white focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-1 custom-scroll">
          <button
            v-for="row in usuariosFiltrados"
            :key="row.id"
            @click="selecionarUsuario(row)"
            :class="[
              'w-full p-3 rounded-xl transition-all text-left group border',
              usuarioSelecionado?.id === row.id 
                ? 'bg-white border-brand-primary/20 shadow-sm ring-1 ring-brand-primary/10' 
                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
            ]"
          >
            <div class="flex flex-col">
              <span :class="['text-[11px] font-black uppercase tracking-tight', usuarioSelecionado?.id === row.id ? 'text-brand-primary' : 'text-slate-700']">
                {{ row.nome }}
              </span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{{ row.setor || 'Geral' }}</span>
                <span :class="['w-1 h-1 rounded-full', row.status === 'Ativo' ? 'bg-emerald-400' : 'bg-rose-400']"></span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <main class="flex-1 flex flex-col bg-white">
        
        <div v-if="!usuarioSelecionado" class="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 text-slate-300">
            <i class="pi pi-user-plus text-xl"></i>
          </div>
          <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">Aguardando Seleção</h4>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Escolha um colaborador para gerenciar os acessos.</p>
        </div>

        <template v-else>
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <i class="pi pi-shield text-xs"></i>
              </div>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Mapa de Acessos</h3>
            </div>
            
            <Button
              variant="primary"
              :loading="loadingSalvar"
              @click="confirmarSalvarPermissoes"
              class="!h-10 !px-6 !rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"
            >
              Salvar Alterações
            </Button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 space-y-12 custom-scroll bg-white">
            <div v-for="(perms, modulo) in MAPA_PERMISSOES" :key="modulo" class="space-y-4">
              <div class="flex items-center justify-between border-b border-slate-50 pb-2">
                <h4 class="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <span class="w-1 h-3 bg-brand-primary rounded-full"></span>
                  {{ modulo }}
                </h4>
                <div class="flex gap-3">
                  <button @click="confirmarMarcarTudoModulo(modulo, true)"class="text-[9px] font-black uppercase text-brand-primary/60 hover:text-brand-primary transition-colors">Marcar Todos</button>
                  <button @click="confirmarMarcarTudoModulo(modulo, false)" class="text-[9px] font-black uppercase text-slate-300 hover:text-rose-500 transition-colors">Limpar</button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <label
                  v-for="p in perms"
                  :key="p.chave"
                  :class="[
                    'flex items-center p-3 rounded-xl border transition-all cursor-pointer group select-none',
                    temPermissao(p.chave) 
                      ? 'bg-brand-primary/5 border-brand-primary/10 shadow-sm shadow-brand-primary/5' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  ]"
                >
                  <div class="relative flex items-center justify-center h-4 w-4 mr-3">
                    <input
                      type="checkbox"
                      class="peer opacity-0 absolute inset-0 cursor-pointer z-10"
                      :checked="temPermissao(p.chave)"
                      @change="togglePermissao(p.chave)"
                    />
                    <div :class="[
                      'h-4 w-4 rounded-md border flex items-center justify-center transition-all',
                      temPermissao(p.chave) ? 'bg-brand-primary border-brand-primary' : 'bg-slate-50 border-slate-200'
                    ]">
                      <i v-if="temPermissao(p.chave)" class="pi pi-check text-[8px] text-white font-black"></i>
                    </div>
                  </div>
                  
                  <div class="flex flex-col min-w-0">
                    <span :class="['text-[10px] font-black uppercase tracking-tight truncate transition-colors', temPermissao(p.chave) ? 'text-brand-primary' : 'text-slate-600']">
                      {{ p.nome }}
                    </span>
                    <span class="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">ID: {{ p.chave }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 3px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UsuariosService, PermissoesService } from '@/services/index'
import { AppConfig } from '@/services/config'
import { useAuth } from '@/services/useauth' 
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

const router = useRouter()
const { temAcesso } = useAuth()

const MAPA_PERMISSOES = AppConfig.PERMISSIONS_MAP
const mapaChaveParaId = ref({})
const usuarios = ref([])
const filtroUsuarios = ref('')
const usuarioSelecionado = ref(null)
const permissoesAtivas = ref([])

const loadingSalvar = ref(false)
const loadingDados = ref(false)
const loadingPermissoes = ref(false)

const columnsUsuarios = [
  { key: 'nome', label: 'Usuário' },
  { key: 'acoes', label: 'Ação', align: 'center', width: '110px' },
]

// --- COMPUTED ---
const usuariosFiltrados = computed(() => {
  const termo = String(filtroUsuarios.value || '').toLowerCase().trim()
  if (!termo) return usuarios.value
  return usuarios.value.filter(u => 
    String(u?.nome).toLowerCase().includes(termo) || 
    String(u?.setor).toLowerCase().includes(termo)
  )
})

// --- MÉTODOS ---
const carregarCatalogo = async () => {
  try {
    const { data } = await PermissoesService.listar()
    mapaChaveParaId.value = (data || []).reduce((acc, p) => {
      if (p.chave) acc[p.chave] = p.id
      return acc
    }, {})
  } catch (e) {
    notify.error('Catálogo de permissões indisponível')
  }
}

const carregarUsuarios = async () => {
  loadingDados.value = true
  try {
    const { data } = await UsuariosService.listar()
    usuarios.value = data || []
  } finally {
    loadingDados.value = false
  }
}

const selecionarUsuario = async (u) => {
  usuarioSelecionado.value = u
  loadingPermissoes.value = true
  try {
    const { data } = await PermissoesService.listarDoUsuario(u.id)
    permissoesAtivas.value = (data || []).map(p => typeof p === 'string' ? p : p.chave)
  } finally {
    loadingPermissoes.value = false
  }
}

const temPermissao = (chave) => permissoesAtivas.value.includes(chave)

const togglePermissao = (chave) => {
  const idx = permissoesAtivas.value.indexOf(chave)
  if (idx >= 0) permissoesAtivas.value.splice(idx, 1)
  else permissoesAtivas.value.push(chave)
}

const marcarTudoModulo = (modulo, marcar) => {
  const chavesModulo = MAPA_PERMISSOES[modulo].map(p => p.chave)
  const set = new Set(permissoesAtivas.value)
  chavesModulo.forEach(k => marcar ? set.add(k) : set.delete(k))
  permissoesAtivas.value = Array.from(set)
}

// confirmar antes de salvar permissões
async function confirmarSalvarPermissoes() {
  if (!usuarioSelecionado.value?.id) return

  const ok = await confirm.show(
    'Salvar Permissões',
    `Deseja salvar as permissões do usuário "${usuarioSelecionado.value.nome}"?`,
  )
  if (!ok) return
  await salvar()
}

// confirmar marcar/limpar módulo
async function confirmarMarcarTudoModulo(modulo, marcar) {
  const ok = await confirm.show(
    marcar ? 'Marcar Permissões' : 'Limpar Permissões',
    marcar
      ? `Deseja marcar todas as permissões do módulo "${modulo}"?`
      : `Deseja limpar todas as permissões do módulo "${modulo}"?`,
  )
  if (!ok) return
  marcarTudoModulo(modulo, marcar)
}

const salvar = async () => {
  loadingSalvar.value = true
  try {
    const ids = permissoesAtivas.value
      .map(k => mapaChaveParaId.value[k])
      .filter(Boolean)
      
    await PermissoesService.definirParaUsuario(usuarioSelecionado.value.id, ids)
    notify.success('Permissões atualizadas com sucesso!')
  } catch (e) {
    notify.error('Erro ao salvar permissões')
  } finally {
    loadingSalvar.value = false
  }
}

onMounted(async () => {
  if (!temAcesso('permissoes.ver')) {
    notify.error('Você não tem acesso a esta tela.')
    router.push('/')
    return
  }
  await Promise.all([carregarUsuarios(), carregarCatalogo()])
})
</script>