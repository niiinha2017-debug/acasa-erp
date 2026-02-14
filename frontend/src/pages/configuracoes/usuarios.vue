<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <div class="w-full h-full">
      <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
        <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

        <PageHeader
          title="Equipe"
          subtitle="Gestão de usuários e permissões"
          icon="pi pi-users"
          :show-back="false"
        >
          <template #actions>
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div class="w-full sm:w-64 order-1 sm:order-0">
                <SearchInput
                  v-model="filtro"
                  placeholder="Buscar nome, e-mail ou usuário..."
                />
              </div>

              <Button
                v-if="can('usuarios.criar')"
                variant="primary"
                @click="abrirModal()"
              >
                <i class="pi pi-user-plus mr-2"></i>
                Novo Colaborador
              </Button>
            </div>
          </template>
        </PageHeader>

        <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
          <Table
            :columns="columns"
            :rows="usuariosFiltrados"
            :loading="loadingTabela"
            empty-text="Nenhum colaborador encontrado."
            :boxed="false"
          >
            <template #cell-nome="{ row }">
              <div class="flex items-center gap-3 py-2">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold border bg-bg-page text-text-muted border-border-ui">
                  {{ row.nome?.charAt(0).toUpperCase() }}
                </div>

                <div class="flex flex-col">
                  <span class="font-semibold text-text-main uppercase text-[10px] tracking-tight leading-none">
                    {{ row.nome }}
                  </span>

                  <span
                    class="text-[9px] font-bold uppercase tracking-tighter mt-1"
                    :class="
                      row.status === 'ATIVO'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : row.status === 'PENDENTE'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                    "
                  >
                    {{ row.status }}
                  </span>
                </div>
              </div>
            </template>

            <template #cell-acesso="{ row }">
              <div class="flex flex-col">
                <span class="text-[10px] font-semibold text-text-main tracking-tight">@{{ row.usuario }}</span>
                <span class="text-[9px] font-medium text-text-muted lowercase">{{ row.email }}</span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <button
                v-if="can('usuarios.editar')"
                :disabled="row.id === usuarioLogado.value?.id"
                @click="confirmarAlterarStatus(row)"
                :class="[
                  'px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all',
                  row.status === 'ATIVO'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500'
                    : row.status === 'PENDENTE'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500',
                  row.id === usuarioLogado.value?.id ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                ]"
              >
                {{ row.status }}
              </button>

              <span v-else class="text-[9px] font-bold uppercase tracking-widest text-text-muted">
                {{ row.status }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-center">
                <div class="inline-flex items-center gap-2">
                <button
                  v-if="can('usuarios.editar')"
                  v-can="'usuarios.editar'"
                  :disabled="reenviandoIds.has(row.id)"
                  @click.stop="confirmarReenviarSenha(row)"
                  class="h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border-ui bg-bg-card"
                  title="Reenviar senha provisória"
                >
                  <i class="pi pi-envelope text-xs" />
                </button>
                <TableActions
                    :id="row.id"
                    perm-edit="usuarios.editar"
                    :perm-delete="row.id === usuarioLogado?.id ? '' : 'usuarios.excluir'"
                    @edit="abrirModal(row)"
                    @delete="(id) => { const r = usuariosFiltrados.find(u => u.id === id); if (r && r.id !== usuarioLogado?.id) confirmarExclusao(r); }"
                />
                </div>
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>

    <!-- MODAL (Teleport para body = abre no Tauri e no app/APK) -->
    <Teleport to="body">
      <div v-if="exibirModal" class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/50 backdrop-blur-[2px]" @click.self="fecharModal">
        <div class="relative z-10 w-full max-w-lg animate-in zoom-in-95 duration-200">
        <div class="rounded-2xl overflow-hidden border border-border-ui bg-bg-card shadow-xl dark:shadow-none">
          <header class="px-8 py-5 border-b border-border-ui flex justify-between items-center bg-bg-page">
            <h3 class="text-[11px] font-black text-text-main uppercase tracking-widest">
              {{ modoEdicao ? 'Editar Colaborador' : 'Novo Colaborador' }}
            </h3>
            <button @click="fecharModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
              <i class="pi pi-times text-sm"></i>
            </button>
          </header>

          <form class="p-8 space-y-5" @submit.prevent="confirmarSalvarUsuario">
            <div class="grid grid-cols-2 gap-4">
              <Input v-model="formUsuario.nome" label="Nome Completo" class="col-span-2" />
              <Input v-model="formUsuario.usuario" label="Usuário Login" :forceUpper="false" />
              <Input v-model="formUsuario.email" label="E-mail" type="email" :forceUpper="false" />
            </div>

            <p v-if="!modoEdicao" class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              A senha provisória será enviada por e-mail.
            </p>

            <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
              <button
                type="button"
                @click="fecharModal"
                class="text-[10px] font-black uppercase text-text-muted hover:text-text-main px-4 py-2 rounded-lg hover:bg-bg-page transition-colors"
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
    </Teleport>
  </template>

  <!-- LOADING -->
  <div v-else class="h-[60vh] flex flex-col items-center justify-center gap-3">
    <div class="w-12 h-12 border-4 border-border-ui border-t-brand-primary rounded-full animate-spin"></div>
    <span class="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Sincronizando...</span>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/services/useauth'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { UsuariosService, AuthService } from '@/services/index'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'usuarios.ver' } })

const { usuarioLogado, isAuthenticated, solicitarCadastro } = useAuth()

// --- ESTADOS ---
const usuarios = ref([])
const filtro = ref('')
const exibirModal = ref(false)
const modoEdicao = ref(false)
const loadingTabela = ref(false)
const loadingSalvar = ref(false)
const reenviandoIds = ref(new Set())

const columns = [
  { key: 'nome', label: 'Colaborador' },
  { key: 'acesso', label: 'Login' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações', align: 'center' },
]

const formUsuario = ref({
  id: null,
  nome: '',
  usuario: '',
  email: '',
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
      status: user.status || 'PENDENTE',
    }
  } else {
    formUsuario.value = {
      id: null,
      nome: '',
      usuario: '',
      email: '',
      status: 'PENDENTE',
    }
  }

  exibirModal.value = true
}

const fecharModal = () => {
  exibirModal.value = false
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
    if (modoEdicao.value) {
      await UsuariosService.salvar(formUsuario.value.id, formUsuario.value)
    } else {
      await solicitarCadastro({
        nome: formUsuario.value.nome,
        usuario: formUsuario.value.usuario,
        email: formUsuario.value.email,
      })
    }
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
  if (row.id === usuarioLogado.value?.id) return

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
  if (row.id === usuarioLogado.value?.id) return

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
  if (user.id === usuarioLogado.value?.id) return

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

async function confirmarReenviarSenha(row) {
  if (!can('usuarios.editar')) return notify.error('Acesso negado.')
  if (!row?.email) return notify.error('Usuario sem e-mail cadastrado.')

  const ok = await confirm.show(
    'Reenviar Senha Provisoria',
    `Deseja reenviar uma senha provisoria para "${row.email}"?`,
  )
  if (!ok) return

  await reenviarSenha(row)
}

async function reenviarSenha(row) {
  try {
    reenviandoIds.value.add(row.id)
    await AuthService.reenviarSenhaProvisoria(row.email)
    row.status = 'PENDENTE'
    notify.success('Senha provisoria reenviada com sucesso.')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao reenviar senha provisoria.')
  } finally {
    reenviandoIds.value.delete(row.id)
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'DM Sans', sans-serif;
}

.clientes-line-list :deep(.search-container input.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.clientes-line-list :deep(.search-container input.w-full:focus) {
  box-shadow: none;
}

.premium-table :deep(tr:hover) {
  background-color: rgba(0, 0, 0, 0.01);
}
</style>
