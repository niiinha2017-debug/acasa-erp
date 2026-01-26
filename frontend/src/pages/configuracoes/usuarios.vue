<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <div class="w-full max-w-[1200px] mx-auto space-y-6 animate-page-in pb-20">
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <i class="pi pi-users text-lg"></i>
          </div>
          <div>
            <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Gestão de Equipe</h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Operadores ativos no sistema
            </p>
          </div>
        </div>
        
        <Button 
          variant="primary" 
          class="!h-11 !rounded-xl !px-6 text-[10px] font-black uppercase tracking-widest shadow-sm" 
          @click="abrirModal()"
        >
          <i class="pi pi-user-plus mr-2 text-[10px]"></i> Novo Colaborador
        </Button>
      </div>

      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        <div class="p-6 border-b border-slate-100 bg-slate-50/30">
          <div class="max-w-md relative group">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="filtro" 
              placeholder="BUSCAR POR NOME, E-MAIL OU USUÁRIO..." 
              class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <Table :columns="columns" :rows="usuariosFiltrados" :loading="loadingTabela">
            
            <template #cell-nome="{ row }">
              <div class="flex items-center gap-3 py-1">
                <div :class="[
                  'w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors',
                  row.nivel_acesso === 'ADMIN' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'
                ]">
                  {{ row.nome?.charAt(0).toUpperCase() }}
                </div>
                <div class="flex flex-col">
                  <span class="font-black text-slate-700 uppercase text-[10px] tracking-tight leading-none">{{ row.nome }}</span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    {{ row.nivel_acesso || 'Nível Pendente' }}
                  </span>
                </div>
              </div>
            </template>

            <template #cell-acesso="{ row }">
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-slate-600 tracking-tight">@{{ row.usuario }}</span>
                <span class="text-[9px] font-medium text-slate-400 lowercase">{{ row.email }}</span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <button
                :disabled="row.id === usuarioLogado?.id"
                @click="toggleStatus(row)"
                :class="[
                  'px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all',
                  row.status === 'ATIVO' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' 
                    : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white',
                  row.id === usuarioLogado?.id ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                ]"
              >
                {{ row.status }}
              </button>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex gap-1 justify-end">
                <button @click="abrirModal(row)" class="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center">
                  <i class="pi pi-pencil text-[10px]"></i>
                </button>
                <button 
                  v-if="row.id !== usuarioLogado?.id" 
                  @click="confirmarExclusao(row)" 
                  class="w-8 h-8 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center justify-center"
                >
                  <i class="pi pi-trash text-[10px]"></i>
                </button>
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>

    <div v-if="exibirModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" @click="fecharModal"></div>
      
      <div class="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <header class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">
              {{ modoEdicao ? 'Editar Colaborador' : 'Novo Colaborador' }}
            </h3>
            <button @click="fecharModal" class="text-slate-400 hover:text-rose-500 transition-colors">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <form class="p-8 space-y-5" @submit.prevent="salvar">
            <div class="grid grid-cols-2 gap-4">
              <Input v-model="formUsuario.nome" label="Nome Completo" class="col-span-2" />
              <Input v-model="formUsuario.usuario" label="Usuário Login" />
              <Input v-model="formUsuario.email" label="E-mail" />

              <div class="col-span-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Nível de Acesso</label>
                <select v-model="formUsuario.nivel_acesso" class="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[11px] font-bold text-slate-700 outline-none focus:border-brand-primary transition-all">
                  <option value="ADMIN">ADMINISTRADOR TOTAL</option>
                  <option value="GERENTE">GERENTE DE PRODUÇÃO</option>
                  <option value="VENDEDOR">VENDEDOR / COMERCIAL</option>
                  <option value="OPERADOR">OPERADOR DE FÁBRICA</option>
                </select>
              </div>

              <Input 
                v-model="formUsuario.senha" 
                :label="modoEdicao ? 'Nova Senha (deixe vazio para manter)' : 'Senha Inicial'" 
                type="password" 
                class="col-span-2" 
              />
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" @click="fecharModal" class="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 px-4">Cancelar</button>
              <Button 
                variant="primary" 
                type="submit" 
                :loading="loadingSalvar" 
                class="!h-10 !rounded-xl !px-8 text-[10px] font-black uppercase tracking-widest"
              >
                {{ modoEdicao ? 'Salvar Alterações' : 'Criar Conta' }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>

  <div v-else class="h-[60vh] flex flex-col items-center justify-center gap-3">
    <div class="w-12 h-12 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin"></div>
    <span class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando...</span>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/services/useauth'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { UsuariosService } from '@/services/index'

const { usuarioLogado, isAuthenticated, logout } = useAuth()

// --- ESTADOS ---
const usuarios = ref([])
const filtro = ref('')
const exibirModal = ref(false)
const modoEdicao = ref(false)
const loadingTabela = ref(false)
const loadingSalvar = ref(false)

const columns = [
  { key: 'nome', label: 'Colaborador' },
  { key: 'acesso', label: 'Login' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' },
]

const formUsuario = ref({
  id: null, nome: '', usuario: '', email: '', senha: '', status: 'ATIVO', nivel_acesso: 'OPERADOR'
})

// --- MÉTODOS ---
const carregar = async () => {
  loadingTabela.value = true
  try {
    const { data } = await UsuariosService.listar()
    usuarios.value = Array.isArray(data) ? data : []
  } catch (err) {
    notify.error('Erro ao carregar lista')
  } finally {
    loadingTabela.value = false
  }
}

const abrirModal = (user = null) => {
  modoEdicao.value = !!user
  if (user) {
    formUsuario.value = { ...user, senha: '' }
    // Garante que o nível não fique vazio
    if(!formUsuario.value.nivel_acesso) formUsuario.value.nivel_acesso = 'OPERADOR'
  } else {
    formUsuario.value = { id: null, nome: '', usuario: '', email: '', senha: '', status: 'ATIVO', nivel_acesso: 'OPERADOR' }
  }
  exibirModal.value = true
}

const fecharModal = () => { exibirModal.value = false }

const salvar = async () => {
  loadingSalvar.value = true
  try {
    await UsuariosService.salvar(formUsuario.value.id, formUsuario.value)
    notify.success('Operação realizada com sucesso!')
    exibirModal.value = false
    carregar()
  } catch (err) {
    notify.error('Erro ao salvar dados')
  } finally {
    loadingSalvar.value = false
  }
}

const toggleStatus = async (row) => {
  const novoStatus = row.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
  try {
    await UsuariosService.atualizarStatus(row.id, novoStatus)
    row.status = novoStatus
    notify.success(`Usuário ${novoStatus.toLowerCase()}!`)
  } catch (err) {
    notify.error('Erro ao alterar status')
  }
}

const confirmarExclusao = async (user) => {
  const ok = await confirm.show('Excluir', `Remover ${user.nome}?`)
  if (!ok) return
  try {
    await UsuariosService.remover(user.id)
    usuarios.value = usuarios.value.filter(u => u.id !== user.id)
    notify.success('Removido com sucesso')
  } catch (err) {
    notify.error('Erro ao excluir')
  }
}

const usuariosFiltrados = computed(() => {
  const t = filtro.value.toLowerCase()
  return usuarios.value.filter(u => u.nome?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t))
})

onMounted(carregar)
</script>

<style scoped>
.premium-table :deep(tr:hover) {
  background-color: rgba(0,0,0,0.01);
}
</style>