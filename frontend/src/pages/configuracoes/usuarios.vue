<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <PageShell :padded="false">
      <section class="usuarios-list ds-page-context ds-page-context--list animate-page-in">
        <PageHeader
          title="Equipe"
          subtitle="Gestão de usuários e permissões"
          icon="pi pi-users"
        >
          <template #actions>
            <div class="usuarios-list__actions ds-page-context__actions">
              <div class="usuarios-list__search ds-page-context__search">
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
                <i class="pi pi-user-plus"></i>
                Novo Colaborador
              </Button>
            </div>
          </template>
        </PageHeader>

        <div class="usuarios-list__content ds-page-context__content">
          <Table
            :columns="columns"
            :rows="rows"
            :loading="loadingTabela"
            empty-text="Nenhum colaborador encontrado."
            :boxed="false"
            :flush="false"
          >
              <template #cell-nome="{ row }">
                <div class="usuarios-list__identity">
                  <div class="usuarios-list__initials">
                    {{ row.iniciais }}
                  </div>

                  <div class="usuarios-list__identity-copy">
                    <span class="usuarios-list__primary">
                      {{ row.nome }}
                    </span>
                    <span class="usuarios-list__secondary">
                      {{ row.email_exibicao }}
                    </span>
                    <span class="usuarios-list__mobile-meta">
                      @{{ row.usuario }}
                    </span>
                  </div>
                </div>
              </template>

              <template #cell-acesso="{ row }">
                <div class="usuarios-list__stack">
                  <span class="usuarios-list__primary">{{ row.cargo_label }}</span>
                  <span class="usuarios-list__secondary">@{{ row.usuario }}</span>
                </div>
              </template>

              <template #cell-funcionario_vinculado="{ row }">
                <div class="usuarios-list__stack">
                  <span class="usuarios-list__primary">{{ row.funcionario_nome }}</span>
                  <span class="usuarios-list__secondary">{{ row.funcionario_hint }}</span>
                </div>
              </template>

              <template #cell-senha_status="{ row }">
                <div class="usuarios-list__status-cell">
                  <span class="ds-status-pill" :class="row.senha_class">
                    {{ row.senha_label }}
                  </span>
                </div>
              </template>

              <template #cell-status="{ row }">
                <button
                  v-if="can('usuarios.editar')"
                  :disabled="row.id === usuarioLogado?.id"
                  @click="confirmarAlterarStatus(row)"
                  :class="[
                    'ds-status-pill usuarios-list__status-toggle',
                    row.status_class,
                    row.id === usuarioLogado?.id ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ]"
                >
                  {{ row.status_label }}
                </button>

                <span v-else class="ds-status-pill" :class="row.status_class">
                  {{ row.status_label }}
                </span>
              </template>

              <template #cell-acoes="{ row }">
                <div class="flex justify-center">
                  <div class="usuarios-list__row-actions">
                  <button
                    v-if="can('usuarios.editar') && row.senha_expirada"
                    :disabled="reenviandoIds.has(row.id)"
                    @click.stop="confirmarResetarAcesso(row)"
                    class="usuarios-list__icon-action usuarios-list__icon-action--danger"
                    title="Resetar acesso"
                  >
                    <i class="pi pi-refresh text-xs" />
                  </button>
                  <button
                    v-else-if="can('usuarios.editar')"
                    :disabled="reenviandoIds.has(row.id)"
                    @click.stop="confirmarReenviarSenha(row)"
                    class="usuarios-list__icon-action usuarios-list__icon-action--warning"
                    title="Reenviar senha provisória"
                  >
                    <i class="pi pi-envelope text-xs" />
                  </button>

                    <TableActions
                      :id="row.id"
                      perm-edit="usuarios.editar"
                      :perm-delete="row.id === usuarioLogado?.id ? '' : 'usuarios.excluir'"
                      @edit="abrirModal(row)"
                      @delete="(id) => { const registro = rows.find(u => u.id === id); if (registro && registro.id !== usuarioLogado?.id) confirmarExclusao(registro); }"
                    />
                  </div>
                </div>
              </template>
          </Table>
        </div>
      </section>
    </PageShell>

    <!-- MODAL (Teleport para body = abre no Tauri e no app/APK) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="exibirModal"
          class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModal"
        >
          <div class="usuarios-modal w-full max-w-3xl rounded-xl border border-border-ui bg-bg-card shadow-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <header class="usuarios-modal__header">
              <div class="usuarios-modal__header-copy">
                <div>
                  <span class="usuarios-modal__eyebrow">Equipe</span>
                  <h3 class="usuarios-modal__title">
                    {{ modoEdicao ? 'Editar colaborador' : 'Novo colaborador' }}
                  </h3>
                  <p class="usuarios-modal__subtitle">
                    Dados de acesso, cargo e vínculo
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="usuarios-modal__close"
                @click="fecharModal"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>

            <form class="usuarios-modal__form clientes-line-form" @submit.prevent="confirmarSalvarUsuario">
              <div class="grid grid-cols-12 gap-4 items-start">
                <div class="col-span-12">
                  <Input
                    v-model="formUsuario.nome"
                    label="Nome completo"
                    placeholder="EX: ANA PAULA COSTA DE SOUZA"
                    variant="line"
                  />
                </div>

                <div class="col-span-12 md:col-span-5">
                  <Input
                    v-model="formUsuario.usuario"
                    label="Usuário login"
                    placeholder="EX: ANA.P"
                    :forceUpper="false"
                    variant="line"
                  />
                </div>

                <div class="col-span-12 md:col-span-7">
                  <Input
                    v-model="formUsuario.email"
                    label="E-mail"
                    type="email"
                    placeholder="EX: ANA.PAULA@EMAIL.COM"
                    :forceUpper="false"
                    variant="line"
                  />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <Select
                    v-model="formUsuario.cargo"
                    label="Cargo"
                    placeholder="SELECIONE O CARGO"
                    :options="cargoOptions"
                    variant="line"
                  />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <Select
                    v-model="formUsuario.funcionario_id"
                    label="Vincular a funcionário"
                    placeholder="SELECIONE OU DEIXE SEM VÍNCULO"
                    :options="funcionarioOptions"
                    variant="line"
                  />
                </div>

                <div class="col-span-12">
                  <Input
                    v-model="formUsuario.senha"
                    :label="modoEdicao ? 'Nova senha (deixe em branco para não alterar)' : 'Senha'"
                    type="password"
                    placeholder="DIGITE UMA SENHA OU DEIXE EM BRANCO"
                    :forceUpper="false"
                    autocomplete="new-password"
                    variant="line"
                  />
                </div>

                <div class="col-span-12 usuarios-modal__hint-wrap">
                  <p class="usuarios-modal__hint">
                    A senha provisória enviada por e-mail vem em maiúsculas. Ao definir uma nova senha, inclua pelo menos uma letra maiúscula.
                  </p>
                </div>

                <div v-if="!modoEdicao" class="col-span-12 usuarios-modal__hint-wrap usuarios-modal__hint-wrap--topless">
                  <p class="usuarios-modal__hint usuarios-modal__hint--muted">
                    {{
                      formUsuario.senha
                        ? 'Senha definida manualmente no cadastro.'
                        : 'Se a senha ficar em branco, será enviada senha provisória por e-mail.'
                    }}
                  </p>
                </div>
              </div>

              <div class="usuarios-modal__footer">
                <Button type="button" variant="ghost" @click="fecharModal">
                  Cancelar
                </Button>

                <Button
                  v-if="can(modoEdicao ? 'usuarios.editar' : 'usuarios.criar')"
                  variant="primary"
                  type="submit"
                  :loading="loadingSalvar"
                >
                  <i class="pi pi-check"></i>
                  {{ modoEdicao ? 'Salvar alterações' : 'Criar conta' }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
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
import { UsuariosService, AuthService, FuncionariosService } from '@/services/index'
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
  { key: 'nome', label: 'Colaborador', width: '24%' },
  { key: 'acesso', label: 'Acesso', width: '17%' },
  { key: 'funcionario_vinculado', label: 'Funcionário', width: '21%' },
  { key: 'senha_status', label: 'Senha', width: '14%', align: 'center' },
  { key: 'status', label: 'Status', width: '10%', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '14%', align: 'center' },
]

const cargoOptions = [
  { label: 'Vendedor/Loja', value: 'VENDEDOR_LOJA' },
  { label: 'Montador/Fábrica', value: 'MONTADOR_FABRICA' },
]

const formUsuario = ref({
  id: null,
  nome: '',
  usuario: '',
  email: '',
  senha: '',
  status: 'PENDENTE',
  cargo: null,
  funcionario_id: null,
})

const funcionariosLista = ref([])
const funcionarioOptions = computed(() =>
  (funcionariosLista.value || []).map((f) => ({
    label: f.nome || `Func. #${f.id}`,
    value: f.id,
  })),
)

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

const carregarFuncionarios = async () => {
  try {
    const res = await FuncionariosService.listar()
    const data = res?.data ?? res
    funcionariosLista.value = Array.isArray(data) ? data : []
  } catch (err) {
    funcionariosLista.value = []
  }
}

// --- MODAL ---
const abrirModal = (user = null) => {
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
      cargo: user.cargo ?? null,
      funcionario_id: user.funcionario_id ?? user.funcionario?.id ?? null,
    }
  } else {
    formUsuario.value = {
      id: null,
      nome: '',
      usuario: '',
      email: '',
      senha: '',
      status: 'PENDENTE',
      cargo: null,
      funcionario_id: null,
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
  const senhaPreenchida = formUsuario.value.senha?.trim()
  if (senhaPreenchida) {
    if (senhaPreenchida.length < 6) {
      return notify.error('A senha deve ter no mínimo 6 caracteres.')
    }
    if (!/[A-Z]/.test(senhaPreenchida)) {
      return notify.error('A senha deve conter pelo menos uma letra maiúscula.')
    }
  }

  loadingSalvar.value = true
  try {
    if (modoEdicao.value) {
      const payload = {
        nome: formUsuario.value.nome,
        usuario: formUsuario.value.usuario,
        email: formUsuario.value.email,
        status: formUsuario.value.status,
        cargo: formUsuario.value.cargo || null,
        funcionario_id:
          formUsuario.value.funcionario_id === '' ||
          formUsuario.value.funcionario_id == null
            ? null
            : Number(formUsuario.value.funcionario_id),
      }
      const novaSenha = formUsuario.value.senha?.trim()
      if (novaSenha && novaSenha.length >= 6) payload.senha = novaSenha
      await UsuariosService.salvar(formUsuario.value.id, payload)
    } else {
      await solicitarCadastro({
        nome: formUsuario.value.nome,
        usuario: formUsuario.value.usuario,
        email: formUsuario.value.email,
        senha: formUsuario.value.senha?.trim() || undefined,
        cargo: formUsuario.value.cargo || undefined,
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
    'Reenviar Senha Provisória',
    `Deseja reenviar uma senha provisória para "${row.email}"?`,
  )
  if (!ok) return

  await reenviarSenha(row, false)
}

async function confirmarResetarAcesso(row) {
  if (!can('usuarios.editar')) return notify.error('Acesso negado.')
  if (!row?.email) return notify.error('Usuário sem e-mail cadastrado.')

  const ok = await confirm.show(
    'Resetar Acesso',
    `A senha provisória expirou. Deseja gerar nova senha e reenviar por e-mail para "${row.email}"?`,
  )
  if (!ok) return

  await reenviarSenha(row, true)
}

async function reenviarSenha(row, isReset = false) {
  try {
    reenviandoIds.value.add(row.id)
    await AuthService.reenviarSenhaProvisoria(row.email)
    row.status = 'PENDENTE'
    row.senha_expirada = false
    row.precisa_trocar_senha = true
    notify.success(isReset ? 'Acesso resetado. Nova senha enviada por e-mail.' : 'Senha provisória reenviada com sucesso.')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao reenviar senha provisória.')
  } finally {
    reenviandoIds.value.delete(row.id)
  }
}

function userStatusClass(status) {
  const currentStatus = String(status || '').toUpperCase()
  if (currentStatus === 'ATIVO') return 'ds-status-pill--success'
  if (currentStatus === 'PENDENTE') return 'ds-status-pill--warning'
  return 'ds-status-pill--danger'
}

function userStatusLabel(status) {
  const currentStatus = String(status || '').toUpperCase()
  if (currentStatus === 'ATIVO') return 'Ativo'
  if (currentStatus === 'PENDENTE') return 'Pendente'
  return 'Inativo'
}

function cargoLabel(cargo) {
  const cargos = {
    VENDEDOR_LOJA: 'Vendedor / Loja',
    MONTADOR_FABRICA: 'Montador / Fábrica',
  }

  return cargos[String(cargo || '').toUpperCase()] || 'Sem cargo'
}

function senhaStatusMeta(row) {
  if (row?.senha_expirada) {
    return {
      label: 'Expirada',
      className: 'ds-status-pill--danger',
    }
  }

  if (row?.precisa_trocar_senha) {
    return {
      label: 'Pendente troca',
      className: 'ds-status-pill--warning',
    }
  }

  return {
    label: 'Alterada',
    className: 'ds-status-pill--success',
  }
}

const rows = computed(() =>
  usuariosFiltrados.value.map((user) => {
    const senhaMeta = senhaStatusMeta(user)
    const nome = String(user?.nome || '-').trim() || '-'
    const partes = nome.split(/\s+/).filter(Boolean)
    const iniciais = `${partes[0]?.[0] || ''}${partes[1]?.[0] || partes[0]?.[1] || ''}`

    return {
      ...user,
      iniciais: String(iniciais || '?').toUpperCase(),
      email_exibicao: user.email || 'Sem e-mail',
      cargo_label: cargoLabel(user.cargo),
      funcionario_nome: user.funcionario?.nome || 'Não vinculado',
      funcionario_hint: user.funcionario?.nome
        ? 'Funcionário vinculado'
        : (user.funcionario_id ? `Vínculo #${user.funcionario_id}` : 'Sem vínculo'),
      status_label: userStatusLabel(user.status),
      status_class: userStatusClass(user.status),
      senha_label: senhaMeta.label,
      senha_class: senhaMeta.className,
    }
  }),
)


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

onMounted(async () => {
  await carregar()
  await carregarFuncionarios()
})
</script>


<style scoped>
.usuarios-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.usuarios-list__identity {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.usuarios-list__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.9);
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.dark .usuarios-list__initials {
  background: rgba(18, 30, 49, 0.62);
  border-color: rgba(51, 71, 102, 0.76);
}

.usuarios-list__identity-copy,
.usuarios-list__stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.usuarios-list__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.4;
  text-transform: none;
  letter-spacing: -0.01em;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usuarios-list__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  text-transform: none;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usuarios-list__mobile-meta {
  display: none;
  color: var(--ds-color-text-faint);
  font-size: 0.7rem;
  font-weight: 430;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usuarios-list__status-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.usuarios-list__status-toggle {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.usuarios-list__status-toggle:not(:disabled):hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.usuarios-list__row-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
}

.usuarios-list__icon-action {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.7rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  background: transparent;
  color: var(--ds-color-text-soft);
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.usuarios-list__icon-action:hover:not(:disabled) {
  border-color: rgba(44, 111, 163, 0.24);
  color: var(--ds-color-primary);
  background: rgba(44, 111, 163, 0.05);
}

.usuarios-list__icon-action--warning:hover:not(:disabled) {
  border-color: rgba(197, 138, 32, 0.28);
  color: var(--ds-color-warning);
  background: rgba(197, 138, 32, 0.08);
}

.usuarios-list__icon-action--danger:hover:not(:disabled) {
  border-color: rgba(196, 73, 73, 0.24);
  color: var(--ds-color-danger);
  background: rgba(196, 73, 73, 0.08);
}

.usuarios-list__icon-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.usuarios-list :deep(.ds-status-pill) {
  max-width: 100%;
  justify-content: center;
  padding-inline: 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

.usuarios-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.7);
  background: transparent;
}

.usuarios-modal__header-copy {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}

.usuarios-modal__eyebrow {
  display: inline-block;
  color: var(--ds-color-text-faint);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.22rem;
}

.usuarios-modal__title {
  color: var(--ds-color-text);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.2;
}

.usuarios-modal__subtitle {
  margin-top: 0.15rem;
  color: var(--ds-color-text-faint);
  font-size: 0.7rem;
  font-weight: 500;
}

.usuarios-modal__close {
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.7rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  color: var(--ds-color-text-soft);
  transition: color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.usuarios-modal__close:hover {
  color: var(--ds-color-danger);
  border-color: rgba(196, 73, 73, 0.24);
  background: rgba(196, 73, 73, 0.08);
}

.usuarios-modal__form {
  padding: 1.15rem 1.25rem 1.25rem;
}

.clientes-line-form :deep(.ds-field-label),
.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.clientes-line-form :deep(.search-container > label) {
  width: auto;
  justify-content: flex-start;
  margin-left: 0;
  margin-bottom: 0.6rem;
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: none;
}

.clientes-line-form :deep(input.ds-control-input) {
  min-height: 46px !important;
  height: 46px !important;
  padding-left: 0.1rem !important;
  padding-right: 0.1rem !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.55rem !important;
  font-size: 0.88rem !important;
  font-weight: 430 !important;
  line-height: 1.45 !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-bottom-width: 1px !important;
  border-bottom-style: solid !important;
  border-bottom-color: rgba(188, 203, 221, 0.75) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.clientes-line-form :deep(select.ds-control-input) {
  min-height: 46px !important;
  height: 46px !important;
  padding-left: 0.1rem !important;
  padding-right: 3.25rem !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.55rem !important;
  font-size: 0.88rem !important;
  font-weight: 430 !important;
  line-height: 1.45 !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-bottom-width: 1px !important;
  border-bottom-style: solid !important;
  border-bottom-color: rgba(188, 203, 221, 0.75) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.clientes-line-form :deep(.select-field__chevron-pill) {
  width: 1.85rem !important;
  height: 1.85rem !important;
  border-color: rgba(188, 203, 221, 0.88) !important;
  background: rgba(248, 250, 252, 0.96) !important;
  box-shadow: none !important;
}

.clientes-line-form :deep(input.ds-control-input:focus) {
  border-bottom-color: var(--ds-color-primary) !important;
  box-shadow: none !important;
  outline: none !important;
}

.clientes-line-form :deep(select.ds-control-input:focus) {
  border-bottom-color: var(--ds-color-primary) !important;
  box-shadow: none !important;
  outline: none !important;
}

.clientes-line-form :deep(input.ds-control-input::placeholder) {
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 400;
  opacity: 1;
}

.clientes-line-form :deep(select.ds-control-input option) {
  font-size: 0.84rem;
  font-weight: 500;
}

.usuarios-modal__hint-wrap {
  margin-top: -0.15rem;
}

.usuarios-modal__hint-wrap--topless {
  margin-top: -0.45rem;
}

.usuarios-modal__hint {
  color: var(--ds-color-text-faint);
  font-size: 0.74rem;
  line-height: 1.55;
}

.usuarios-modal__hint--muted {
  font-weight: 500;
}

.usuarios-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(214, 224, 234, 0.7);
}

.dark .usuarios-modal__header {
  background: transparent;
}

@media (min-width: 640px) {
  .usuarios-list__search {
    width: 19rem;
  }
}

@media (max-width: 1100px) {
  .usuarios-list__primary {
    font-size: 0.88rem;
  }

  .usuarios-list__secondary {
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .usuarios-list__mobile-meta {
    display: block;
  }

  .usuarios-list__identity {
    gap: 0.48rem;
  }

  .usuarios-list__initials {
    width: 1.9rem;
    height: 1.9rem;
  }

  .usuarios-list__row-actions {
    gap: 0.3rem;
  }

  .usuarios-list__icon-action {
    width: 1.95rem;
    height: 1.95rem;
  }

  .usuarios-list :deep(.ds-table__head-cell:nth-child(3)),
  .usuarios-list :deep(.ds-table__cell:nth-child(3)),
  .usuarios-list :deep(.ds-table__head-cell:nth-child(4)),
  .usuarios-list :deep(.ds-table__cell:nth-child(4)) {
    display: none;
  }

  .usuarios-list :deep(.ds-table__head-cell:last-child),
  .usuarios-list :deep(.ds-table__cell:last-child) {
    padding-left: 0.3rem;
    padding-right: 0.3rem;
  }

  .usuarios-list__actions > :deep(.ds-btn--primary) {
    width: 100%;
    justify-content: center;
  }

  .usuarios-modal__header,
  .usuarios-modal__form {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .usuarios-modal__header {
    align-items: flex-start;
  }

  .usuarios-modal__header-copy {
    gap: 0.7rem;
  }

  .usuarios-modal__footer {
    width: 100%;
    flex-direction: column-reverse;
  }

  .usuarios-modal__footer :deep(.ds-btn) {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .usuarios-list :deep(.ds-table__head-cell:nth-child(2)),
  .usuarios-list :deep(.ds-table__cell:nth-child(2)) {
    display: none;
  }
}
</style>
