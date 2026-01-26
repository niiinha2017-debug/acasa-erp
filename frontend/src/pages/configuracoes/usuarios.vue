<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-none shadow-2xl shadow-slate-200/50">
      
      <header class="flex flex-col md:flex-row justify-between items-center gap-4 p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-400/20">
            <i class="pi pi-users text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Gestão de Equipe</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operadores Ativos no Sistema
            </p>
          </div>
        </div>

        <Button 
          variant="primary" 
          class="!rounded-2xl !h-12 !px-8 shadow-xl shadow-brand-primary/20 font-black text-[11px] uppercase tracking-widest" 
          @click="abrirModal()"
        >
          <i class="pi pi-user-plus mr-2"></i> Novo Colaborador
        </Button>
      </header>

      <div class="p-8">
        <div class="max-w-md mb-8">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Filtro de busca</label>
          <Input v-model="filtro" placeholder="BUSCAR POR NOME OU E-MAIL..." class="premium-input">
            <template #prefix><i class="pi pi-search text-xs text-slate-400"></i></template>
          </Input>
        </div>

        <Table :columns="columns" :rows="usuariosFiltrados" :loading="loadingTabela" class="premium-table">
          
          <template #cell-nome="{ row }">
            <div class="flex items-center gap-4">
              <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border shadow-sm transition-all', row.nivel_acesso === 'ADMIN' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-white text-slate-400 border-slate-100']">
                {{ row.nome?.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <span class="font-black text-slate-700 uppercase text-[11px] tracking-tight">{{ row.nome }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {{ row.nivel_acesso || 'Nível Pendente' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-acesso="{ row }">
            <div class="flex flex-col">
              <span class="text-[11px] font-black text-slate-600 tracking-tight">@{{ row.usuario }}</span>
              <span class="text-[10px] font-medium text-slate-400 lowercase">{{ row.email }}</span>
            </div>
          </template>

          <template #cell-status="{ row }">
              <button
                :disabled="row.id === usuarioLogado?.id"
                @click="toggleStatus(row)"
                :class="[
                  'px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm active:scale-95',
                  row.status === 'ATIVO' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white' 
                    : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white',
                  row.id === usuarioLogado?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                ]"
              >
                {{ row.status }}
              </button>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex gap-2 justify-end">
              <button @click="abrirModal(row)" title="Editar" class="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-brand-primary hover:text-white transition-all border border-slate-100 flex items-center justify-center">
                <i class="pi pi-pencil text-[10px]"></i>
              </button>
              
              <button 
                v-if="row.id !== usuarioLogado?.id" 
                @click="confirmarExclusao(row)" 
                title="Excluir" 
                class="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all border border-slate-100 flex items-center justify-center"
              >
                <i class="pi pi-trash text-[10px]"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>

    <div v-if="exibirModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="w-full max-w-xl animate-in zoom-in-95 duration-300">
        <Card class="!overflow-visible shadow-2xl border-none !rounded-[3rem] bg-white">
          <header class="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
              {{ modoEdicao ? 'Atualizar Colaborador' : 'Novo Colaborador' }}
            </h3>
            <button @click="fecharModal" class="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all">
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <form class="p-10 space-y-6" @submit.prevent="salvar">
            <div class="grid grid-cols-12 gap-5">
              <Input v-model="formUsuario.nome" label="Nome Completo" class="col-span-12" required />
              <Input v-model="formUsuario.usuario" label="Usuário (@)" class="col-span-6" required />
              <Input v-model="formUsuario.email" label="E-mail" class="col-span-6" required />

              <div class="col-span-12">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nível de Acesso</label>
                <select v-model="formUsuario.nivel_acesso" class="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="ADMIN">ADMINISTRADOR TOTAL</option>
                  <option value="GERENTE">GERENTE DE PRODUÇÃO</option>
                  <option value="VENDEDOR">VENDEDOR / COMERCIAL</option>
                  <option value="OPERADOR">OPERADOR DE FÁBRICA</option>
                </select>
              </div>

              <Input v-model="formUsuario.senha" :label="modoEdicao ? 'Alterar Senha (opcional)' : 'Senha de Acesso'" type="password" class="col-span-12" :required="!modoEdicao" />
            </div>

            <footer class="flex justify-end gap-3 pt-6">
              <button type="button" @click="fecharModal" class="text-[11px] font-black uppercase text-slate-400 px-4">Cancelar</button>
              <Button variant="primary" type="submit" :loading="loadingSalvar" class="!rounded-xl !px-8">
                {{ modoEdicao ? 'Salvar Alterações' : 'Confirmar Cadastro' }}
              </Button>
            </footer>
          </form>
        </Card>
      </div>
    </div>
  </template>

  <div v-else class="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
      <i class="pi pi-spin pi-spinner text-4xl"></i>
      <span class="text-[10px] font-black uppercase tracking-widest">Autenticando...</span>
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