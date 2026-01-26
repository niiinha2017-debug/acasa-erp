<template>
  <div class="w-full max-w-[1400px] mx-auto animate-in fade-in duration-700">
    <Card :shadow="true" class="!rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
      
      <PageHeader
        title="Controle de Permissões"
        subtitle="Gestão estratégica de níveis de acesso e segurança por colaborador."
        icon="pi pi-lock"
        :showBack="true"
        iconClass="bg-slate-900 text-white shadow-lg"
      >
        <template #actions>
          <Transition name="fade">
            <div v-if="usuarioSelecionado" class="flex items-center gap-3 bg-brand-primary/5 px-4 py-2 rounded-2xl border border-brand-primary/10">
              <div class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
              <span class="text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary">
                Editando: {{ usuarioSelecionado.nome }}
              </span>
            </div>
          </Transition>
        </template>
      </PageHeader>

      <div class="grid grid-cols-12">
        
        <div class="col-span-12 lg:col-span-4 border-r border-slate-100 bg-slate-50/30 p-8">
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <div class="h-6 w-1 bg-brand-primary rounded-full"></div>
              <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Colaboradores</span>
            </div>

            <div class="relative group">
              <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"></i>
              <input 
                v-model="filtroUsuarios"
                type="text"
                placeholder="BUSCAR POR NOME OU SETOR..."
                class="w-full pl-11 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-tight focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm"
              />
            </div>

            <div class="max-h-[600px] overflow-y-auto custom-scroll pr-2 space-y-3">
              <div v-if="loadingDados" class="p-10 text-center">
                <i class="pi pi-spin pi-spinner text-brand-primary text-xl mb-3"></i>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Base...</p>
              </div>

              <template v-else>
                <button
                  v-for="row in usuariosFiltrados"
                  :key="row.id"
                  @click="selecionarUsuario(row)"
                  :class="[
                    'w-full p-5 rounded-[1.5rem] transition-all duration-300 text-left relative overflow-hidden group',
                    usuarioSelecionado?.id === row.id 
                      ? 'bg-white border-none shadow-xl shadow-slate-200 ring-1 ring-brand-primary' 
                      : 'bg-transparent border border-transparent hover:border-slate-200 hover:bg-white/50'
                  ]"
                >
                  <div class="relative z-10 flex items-center justify-between">
                    <div class="flex flex-col">
                      <span :class="['text-xs font-black uppercase tracking-tight transition-colors', usuarioSelecionado?.id === row.id ? 'text-brand-primary' : 'text-slate-700']">
                        {{ row.nome }}
                      </span>
                      <div class="flex items-center gap-2 mt-1.5">
                        <span class="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">
                          {{ row.setor || 'Geral' }}
                        </span>
                        <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span class="text-[9px] font-black uppercase" :class="row.status === 'Ativo' ? 'text-emerald-500' : 'text-rose-500'">
                          {{ row.status || 'Ativo' }}
                        </span>
                      </div>
                    </div>
                    <i v-if="usuarioSelecionado?.id === row.id" class="pi pi-chevron-right text-brand-primary text-xs"></i>
                  </div>
                </button>
              </template>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-8 p-8 lg:p-12 bg-white">
          
          <div v-if="!usuarioSelecionado" class="h-[600px] flex flex-col items-center justify-center rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-100 p-20 text-center">
              <div class="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
                <i class="pi pi-user-plus text-2xl text-slate-300"></i>
              </div>
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-[0.3em] mb-2">Aguardando Seleção</h4>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                Escolha um colaborador na lista ao lado para gerenciar acessos.
              </p>
          </div>

          <div v-else class="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <i class="pi pi-shield text-sm"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black uppercase tracking-[0.15em] text-slate-800">Mapa de Acessos</h3>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Defina o que este usuário pode ver ou editar</p>
                </div>
              </div>
              
              <Button
                variant="primary"
                :loading="loadingSalvar"
                @click="salvar"
                class="!rounded-2xl !h-12 !px-8 shadow-xl shadow-brand-primary/20 font-black text-[11px] uppercase tracking-widest"
              >
                Salvar Alterações
              </Button>
            </div>

            <div class="space-y-12 h-[600px] overflow-y-auto custom-scroll pr-4">
              <div v-for="(perms, modulo) in MAPA_PERMISSOES" :key="modulo" class="space-y-6 group">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 group-hover:text-brand-primary transition-colors">{{ modulo }}</span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                      {{ perms.length }} itens
                    </span>
                  </div>
                  <div class="flex gap-4">
                    <button @click="marcarTudoModulo(modulo, true)" class="text-[9px] font-black uppercase text-brand-primary hover:tracking-widest transition-all">Selecionar Todos</button>
                    <div class="w-[1px] h-3 bg-slate-200"></div>
                    <button @click="marcarTudoModulo(modulo, false)" class="text-[9px] font-black uppercase text-slate-300 hover:text-rose-500 transition-all">Remover</button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    v-for="p in perms"
                    :key="p.chave"
                    :class="[
                      'flex items-center p-5 rounded-[1.5rem] border transition-all cursor-pointer select-none relative group/item',
                      temPermissao(p.chave) 
                        ? 'bg-brand-primary/5 border-brand-primary/20 shadow-sm shadow-brand-primary/5' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                    ]"
                  >
                    <div class="relative flex items-center w-full">
                      <div class="relative flex items-center justify-center h-5 w-5 mr-4">
                        <input
                          type="checkbox"
                          class="peer h-5 w-5 rounded-lg border-slate-200 text-brand-primary focus:ring-brand-primary transition-all cursor-pointer opacity-0 absolute z-20"
                          :checked="temPermissao(p.chave)"
                          @change="togglePermissao(p.chave)"
                        />
                        <div :class="['h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all', temPermissao(p.chave) ? 'bg-brand-primary border-brand-primary shadow-lg shadow-brand-primary/30' : 'bg-white border-slate-200']">
                          <i v-if="temPermissao(p.chave)" class="pi pi-check text-[10px] text-white font-black"></i>
                        </div>
                      </div>
                      
                      <div class="flex flex-col min-w-0">
                        <span class="text-[10px] font-black uppercase tracking-tight text-slate-700 group-hover/item:text-brand-primary transition-colors truncate">
                          {{ p.nome }}
                        </span>
                        <span class="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tabular-nums">
                          ID: {{ p.chave }}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.02);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--brand-primary);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UsuariosService, PermissoesService } from '@/services/index'
import { AppConfig } from '@/services/config'
import { useAuth } from '@/services/useauth' 
import { notify } from '@/services/notify'

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