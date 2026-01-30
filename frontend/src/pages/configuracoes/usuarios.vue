<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <div class="w-full max-w-[1200px] mx-auto space-y-6 animate-page-in pb-20">
      <!-- HEADER -->
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
          v-if="can('usuarios.criar')"
          variant="primary"
          class="!h-11 !rounded-xl !px-6 text-[10px] font-black uppercase tracking-widest shadow-sm"
          @click="abrirModal()"
        >
          <i class="pi pi-user-plus mr-2 text-[10px]"></i>
          Novo Colaborador
        </Button>
      </div>

      <!-- CARD LISTA -->
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
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black border bg-slate-50 text-slate-500 border-slate-100">
                  {{ row.nome?.charAt(0).toUpperCase() }}
                </div>

                <div class="flex flex-col">
                  <span class="font-black text-slate-700 uppercase text-[10px] tracking-tight leading-none">
                    {{ row.nome }}
                  </span>

                  <span
                    class="text-[9px] font-bold uppercase tracking-tighter mt-1"
                    :class="
                      row.status === 'ATIVO'
                        ? 'text-emerald-600'
                        : row.status === 'PENDENTE'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    "
                  >
                    {{ row.status }}
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
                v-if="can('usuarios.editar')"
                :disabled="row.id === usuarioLogado?.id"
                @click="confirmarAlterarStatus(row)"
                :class="[
                  'px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all',
                  row.status === 'ATIVO'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                    : row.status === 'PENDENTE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-600 hover:text-white'
                      : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white',
                  row.id === usuarioLogado?.id ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                ]"
              >
                {{ row.status }}
              </button>

              <span v-else class="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {{ row.status }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex gap-1 justify-end">
                <button
                  v-if="can('usuarios.editar')"
                  @click="abrirModal(row)"
                  class="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center"
                >
                  <i class="pi pi-pencil text-[10px]"></i>
                </button>

                <button
                  v-if="can('usuarios.excluir') && row.id !== usuarioLogado?.id"
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

    <!-- MODAL -->
    <div v-if="exibirModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" @click="confirmarFecharModal"></div>

      <div class="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <header class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">
              {{ modoEdicao ? 'Editar Colaborador' : 'Novo Colaborador' }}
            </h3>
            <button @click="confirmarFecharModal" class="text-slate-400 hover:text-rose-500 transition-colors">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <form class="p-8 space-y-5" @submit.prevent="confirmarSalvarUsuario">
            <div class="grid grid-cols-2 gap-4">
              <Input v-model="formUsuario.nome" label="Nome Completo" class="col-span-2" />
              <Input v-model="formUsuario.usuario" label="Usuário Login" :forceUpper="false" />
              <Input v-model="formUsuario.email" label="E-mail" type="email" :forceUpper="false" />

              <Input
                v-model="formUsuario.senha"
                :label="modoEdicao ? 'Nova Senha (deixe vazio para manter)' : 'Senha Inicial'"
                type="password"
                class="col-span-2"
                :forceUpper="false"
              />
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                @click="confirmarFecharModal"
                class="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 px-4"
              >
                Cancelar
              </button>

              <Button
                v-if="can(modoEdicao ? 'usuarios.editar' : 'usuarios.criar')"
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

  <!-- LOADING -->
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
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'usuarios.ver' } })

const { usuarioLogado, isAuthenticated } = useAuth()

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
  id: null,
  nome: '',
  usuario: '',
  email: '',
  senha: '',
  status: 'PENDENTE',
})

// --- LOAD ---
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

// --- MODAL ---
const abrirModal = (user = null) => {
  // permissão por ação
  if (user) {
    if (!can('usuarios.editar')) return notify.error('Acesso negado.')
  } else {
    if (!can('usuarios.criar')) return notify.error('Acesso negado.')
  }

  modoEdicao.value = !!user

  if (user) {
    formUsuario.value = {
      id: user.id,
      nome: user.nome || '',
      usuario: user.usuario || '',
      email: user.email || '',
      senha: '',
      status: user.status || 'PENDENTE',
    }
  } else {
    formUsuario.value = {
      id: null,
      nome: '',
      usuario: '',
      email: '',
      senha: '',
      status: 'PENDENTE',
    }
  }

  exibirModal.value = true
}

const fecharModal = () => {
  exibirModal.value = false
}

async function confirmarFecharModal() {
  const ok = await confirm.show('Cancelar', 'Deseja fechar sem salvar as alterações deste formulário?')
  if (!ok) return
  fecharModal()
}

// --- SALVAR (CRIAR/EDITAR) ---
async function confirmarSalvarUsuario() {
  const perm = modoEdicao.value ? 'usuarios.editar' : 'usuarios.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const titulo = modoEdicao.value ? 'Salvar Alterações' : 'Criar Colaborador'
  const mensagem = modoEdicao.value
    ? `Deseja salvar as alterações do colaborador "${formUsuario.value.nome}"?`
    : `Deseja criar o colaborador "${formUsuario.value.nome}"?`

  const ok = await confirm.show(titulo, mensagem)
  if (!ok) return

  await salvar()
}

const salvar = async () => {
  const perm = modoEdicao.value ? 'usuarios.editar' : 'usuarios.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  loadingSalvar.value = true
  try {
    await UsuariosService.salvar(formUsuario.value.id, formUsuario.value)
    notify.success('Operação realizada com sucesso!')
    exibirModal.value = false
    await carregar()
  } catch (err) {
    notify.error('Erro ao salvar dados')
  } finally {
    loadingSalvar.value = false
  }
}

// --- STATUS ---
async function confirmarAlterarStatus(row) {
  if (!can('usuarios.editar')) return notify.error('Acesso negado.')
  if (row.id === usuarioLogado?.id) return

  const statusAtual = String(row.status || '').toUpperCase()
  const novoStatus = statusAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO'

  const verbo =
    novoStatus === 'ATIVO'
      ? (statusAtual === 'PENDENTE' ? 'aprovar' : 'ativar')
      : 'inativar'

  const ok = await confirm.show('Alterar Status', `Deseja ${verbo} o colaborador "${row.nome}"?`)
  if (!ok) return

  await toggleStatus(row)
}

const toggleStatus = async (row) => {
  if (!can('usuarios.editar')) return notify.error('Acesso negado.')
  if (row.id === usuarioLogado?.id) return

  const statusAtual = String(row.status || '').toUpperCase()
  const novoStatus = statusAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO'

  try {
    await UsuariosService.atualizarStatus(row.id, novoStatus)
    row.status = novoStatus
    notify.success(`Usuário ${novoStatus.toLowerCase()}!`)
  } catch (err) {
    notify.error('Erro ao alterar status')
  }
}

// --- EXCLUIR ---
const confirmarExclusao = async (user) => {
  if (!can('usuarios.excluir')) return notify.error('Acesso negado.')
  if (user.id === usuarioLogado?.id) return

  const ok = await confirm.show('Excluir', `Remover ${user.nome}?`)
  if (!ok) return

  try {
    await UsuariosService.remover(user.id)
    usuarios.value = usuarios.value.filter((u) => u.id !== user.id)
    notify.success('Removido com sucesso')
  } catch (err) {
    notify.error('Erro ao excluir')
  }
}

// --- FILTRO ---
const usuariosFiltrados = computed(() => {
  const t = String(filtro.value || '').toLowerCase().trim()
  if (!t) return usuarios.value
  return usuarios.value.filter(
    (u) =>
      String(u?.nome || '').toLowerCase().includes(t) ||
      String(u?.email || '').toLowerCase().includes(t) ||
      String(u?.usuario || '').toLowerCase().includes(t),
  )
})

onMounted(carregar)
</script>


<style scoped>
.premium-table :deep(tr:hover) {
  background-color: rgba(0, 0, 0, 0.01);
}
</style>
