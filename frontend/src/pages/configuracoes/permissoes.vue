<template>
  <Card :shadow="true">
    <PageHeader
      title="Permissões"
      subtitle="ADMIN — Controle de acessos por usuário"
      :showBack="true"
    >
      <template #action>
        <div class="text-[11px] font-black uppercase tracking-[0.15em] text-brand-primary">
          {{ usuarioSelecionado ? `Sessão: ${usuarioSelecionado.nome}` : 'Aguardando Seleção' }}
        </div>
      </template>
    </PageHeader>

    <div class="p-8">
      <div class="grid grid-cols-12 gap-10">
        
        <div class="col-span-12 lg:col-span-4 space-y-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="h-[2px] w-4 bg-brand-primary rounded-full"></div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Colaboradores</span>
          </div>

          <SearchInput
            v-model="filtroUsuarios"
            placeholder="Filtrar por nome..."
          />

          <div class="mt-4 max-h-[600px] overflow-y-auto custom-scroll pr-2">
            <div v-if="loadingDados" class="p-4 text-center text-slate-400 text-[10px] font-black uppercase">
              Sincronizando...
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="row in usuariosFiltrados"
                :key="row.id"
                @click="selecionarUsuario(row)"
                :class="[
                  'w-full p-4 rounded-2xl transition-all duration-300 text-left border',
                  usuarioSelecionado?.id === row.id 
                    ? 'bg-brand-primary/10 border-brand-primary shadow-sm' 
                    : 'bg-transparent border-[var(--border-ui)] hover:border-brand-primary/50'
                ]"
              >
                <div class="flex flex-col">
                  <span :class="['text-xs font-black uppercase tracking-tight', usuarioSelecionado?.id === row.id ? 'text-brand-primary' : 'text-[var(--text-main)]']">
                    {{ row.nome }}
                  </span>
                  <span class="text-[9px] font-bold uppercase mt-1 text-slate-500">
                    {{ row.setor || 'Geral' }} • {{ row.status || 'Ativo' }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-8">
          <div v-if="!usuarioSelecionado" class="h-full flex flex-col items-center justify-center rounded-[2.5rem] bg-slate-500/5 border-2 border-dashed border-[var(--border-ui)] p-20">
             <div class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Selecione um perfil ao lado</div>
          </div>

          <div v-else class="space-y-10 animate-in fade-in slide-in-from-right-2 duration-400">
            
            <div class="flex items-center gap-3">
              <div class="h-[2px] w-6 bg-brand-primary rounded-full"></div>
              <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">Acessos do Usuário</h3>
            </div>

            <div v-for="(perms, modulo) in MAPA_PERMISSOES" :key="modulo" class="space-y-4">
              <div class="flex items-center justify-between border-b border-[var(--border-ui)] pb-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ modulo }}</span>
                <div class="flex gap-4">
                  <button @click="marcarTudoModulo(modulo, true)" class="text-[9px] font-black uppercase text-brand-primary hover:underline">Marcar Tudo</button>
                  <button @click="marcarTudoModulo(modulo, false)" class="text-[9px] font-black uppercase text-slate-400 hover:text-red-500">Limpar</button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  v-for="p in perms"
                  :key="p.chave"
                  :class="[
                    'flex items-center p-4 rounded-2xl border transition-all cursor-pointer select-none',
                    temPermissao(p.chave) 
                      ? 'bg-brand-primary/5 border-brand-primary/30' 
                      : 'bg-transparent border-[var(--border-ui)] hover:border-slate-400'
                  ]"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary mr-4"
                    :checked="temPermissao(p.chave)"
                    @change="togglePermissao(p.chave)"
                  />
                  <div class="flex flex-col min-w-0">
                    <span class="text-[10px] font-black uppercase tracking-tight text-[var(--text-main)] truncate">{{ p.nome }}</span>
                    <span class="text-[9px] font-bold text-slate-500 uppercase leading-none mt-1">{{ p.chave }}</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="flex justify-end pt-10 border-t border-[var(--border-ui)]">
              <Button
                variant="primary"
                :loading="loadingSalvar"
                @click="salvar"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 3px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--border-ui);
  border-radius: 10px;
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