<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden">
      
      <header class="flex flex-col md:flex-row justify-between items-center gap-4 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <i class="pi pi-users text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black text-[var(--text-main)] tracking-tight uppercase leading-none">
              Gestão de Equipe
            </h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Controle de acessos ACASA</p>
          </div>
        </div>

        <Button variant="primary" class="!rounded-2xl shadow-xl shadow-brand-primary/20" @click="abrirModal()">
          <i class="pi pi-user-plus mr-2"></i> Novo Usuário
        </Button>
      </header>

      <div class="p-6">
        <div class="max-w-md mb-6">
          <Input v-model="filtro" placeholder="BUSCAR POR NOME OU E-MAIL...">
            <template #prefix><i class="pi pi-search text-[10px] text-slate-400"></i></template>
          </Input>
        </div>

        <Table :columns="columns" :rows="usuariosFiltrados" :loading="loadingTabela">
          <template #cell-nome="{ row }">
            <div class="flex items-center gap-3">
               <div class="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-black border border-brand-primary/20 shadow-sm">
                {{ row.nome.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <span class="font-black text-[var(--text-main)] uppercase text-[11px] tracking-tight">{{ row.nome }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ row.nivel_acesso || 'Sem Nível' }}</span>
              </div>
            </div>
          </template>

          <template #cell-acesso="{ row }">
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-slate-600">@{{ row.usuario }}</span>
              <span class="text-[10px] text-slate-400 lowercase">{{ row.email }}</span>
            </div>
          </template>

          <template #cell-status="{ row }">
             <button
              :disabled="row.id === usuarioLogado?.id"
              @click="toggleStatus(row)"
              class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
              :class="row.status === 'ATIVO' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-600 border-red-500/20'"
            >
              {{ row.status }}
            </button>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex gap-2 justify-end">
              <button @click="abrirModal(row)" class="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                <i class="pi pi-pencil text-xs"></i>
              </button>
              
              <button v-if="row.id !== usuarioLogado?.id" @click="confirmarExclusao(row)" class="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>

    <div v-if="exibirModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
      <div class="w-full max-w-xl animate-in zoom-in-95 duration-300">
        <Card class="!overflow-visible shadow-2xl border-[var(--border-ui)] !rounded-[2.5rem]">
          <header class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 !rounded-t-[2.5rem]">
            <div>
              <h3 class="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                {{ modoEdicao ? 'Atualizar Colaborador' : 'Novo Colaborador' }}
              </h3>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurações de conta e acesso</p>
            </div>
            <button @click="fecharModal" class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all">
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <form class="p-8 space-y-6" @submit.prevent="salvar">
            <div class="grid grid-cols-12 gap-5">
              <Input v-model="formUsuario.nome" label="Nome Completo" class="col-span-12" required />
              
              <Input v-model="formUsuario.usuario" label="Usuário (@)" class="col-span-6" required />
              <Input v-model="formUsuario.email" label="E-mail" class="col-span-6" required />

              <div class="col-span-12">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Nível de Acesso</label>
                <select 
                  v-model="formUsuario.nivel_acesso" 
                  class="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none"
                >
                  <option value="ADMIN">ADMINISTRADOR TOTAL</option>
                  <option value="GERENTE">GERENTE DE PRODUÇÃO</option>
                  <option value="VENDEDOR">VENDEDOR / COMERCIAL</option>
                  <option value="OPERADOR">OPERADOR DE FÁBRICA</option>
                </select>
              </div>
              
              <Input 
                v-model="formUsuario.senha" 
                :label="modoEdicao ? 'Alterar Senha (opcional)' : 'Senha de Acesso'" 
                type="password" 
                class="col-span-12" 
                :required="!modoEdicao" 
              />
            </div>

            <footer class="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button variant="ghost" type="button" @click="fecharModal" class="!rounded-xl">Cancelar</Button>
              <Button variant="primary" type="submit" :loading="loadingSalvar" class="!rounded-xl !px-8">
                {{ modoEdicao ? 'Atualizar Cadastro' : 'Confirmar Cadastro' }}
              </Button>
            </footer>
          </form>
        </Card>
      </div>
    </div>
  </template>

  <div v-else class="h-96 flex flex-col items-center justify-center gap-4">
      <i class="pi pi-spin pi-spinner text-4xl text-brand-primary"></i>
      <span class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Autenticando sessão...</span>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
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

const formUsuario = ref({
  id: null,
  nome: '',
  usuario: '',
  email: '',
  senha: '',
  status: 'ATIVO',
  nivel_acesso: 'OPERADOR', // Valor padrão
})

const columns = [
  { key: 'nome', label: 'Colaborador' },
  { key: 'acesso', label: 'Login' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' },
]

// --- BUSCA ---
const usuariosFiltrados = computed(() => {
  const t = String(filtro.value || '').toLowerCase().trim()
  if (!t) return usuarios.value

  return usuarios.value.filter((u) =>
    [u?.nome, u?.usuario, u?.email, u?.nivel_acesso].some((field) => 
      String(field || '').toLowerCase().includes(t)
    )
  )
})

// --- CARREGAR TABELA ---
const carregar = async () => {
  if (!isAuthenticated.value) return
  loadingTabela.value = true
  try {
    const { data } = await UsuariosService.listar()
    usuarios.value = Array.isArray(data) ? data : []
  } catch (err) {
    if (err?.response?.status === 401) logout()
    notify.error('Erro ao carregar usuários')
  } finally {
    loadingTabela.value = false
  }
}

// --- MODAL ---
const abrirModal = (user = null) => {
  modoEdicao.value = !!user
  
  if (user) {
    formUsuario.value = {
      id: user.id,
      nome: user.nome || '',
      usuario: user.usuario || '',
      email: user.email || '',
      senha: '', 
      status: user.status || 'ATIVO',
      nivel_acesso: user.nivel_acesso || 'OPERADOR'
    }
  } else {
    formUsuario.value = {
      id: null,
      nome: '',
      usuario: '',
      email: '',
      senha: '',
      status: 'ATIVO',
      nivel_acesso: 'OPERADOR'
    }
  }
  exibirModal.value = true
}

const fecharModal = () => { exibirModal.value = false }

// --- SALVAR ---
const salvar = async () => {
  loadingSalvar.value = true
  try {
    const payload = { ...formUsuario.value }
    if (modoEdicao.value && !payload.senha) delete payload.senha

    await UsuariosService.salvar(formUsuario.value.id, payload)
    notify.success(modoEdicao.value ? 'Usuário atualizado!' : 'Novo colaborador cadastrado!')
    
    exibirModal.value = false
    await carregar()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro na operação')
  } finally {
    loadingSalvar.value = false
  }
}

// --- STATUS ---
const toggleStatus = async (row) => {
  if (row.id === usuarioLogado.value?.id) return
  const novo = row.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
  try {
    await UsuariosService.atualizarStatus(row.id, novo)
    row.status = novo
    notify.success('Status atualizado')
  } catch (err) {
    notify.error('Erro ao atualizar status')
  }
}

// --- EXCLUIR ---
const confirmarExclusao = async (user) => {
  const ok = await confirm.show('Excluir Usuário', `Deseja remover ${user.nome}?`)
  if (!ok) return
  try {
    await UsuariosService.remover(user.id)
    usuarios.value = usuarios.value.filter((u) => u.id !== user.id)
    notify.success('Usuário removido')
  } catch (err) { notify.error('Erro ao excluir') }
}

onMounted(carregar)
</script>