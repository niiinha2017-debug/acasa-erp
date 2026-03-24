<template>
  <PageShell :padded="false">
    <section class="permissoes-page ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Permissões de Acesso"
        subtitle="Todos precisam estar logados. Aqui você libera ou bloqueia o que cada usuário pode acessar no sistema."
        icon="pi pi-lock"
      >
        <template #actions>
          <div class="permissoes-page__header-actions">
            <Transition name="fade">
              <div v-if="usuarioSelecionado" class="permissoes-page__selection-chip">
                <span class="permissoes-page__selection-dot"></span>
                <span>Editando: {{ usuarioSelecionado.nome }}</span>
              </div>
            </Transition>

            <Button
              v-if="usuarioSelecionado && temAcesso('permissoes.gerenciar')"
              variant="primary"
              :loading="loadingSalvar"
              @click="confirmarSalvarPermissoes"
            >
              <i class="pi pi-save"></i>
              Salvar Alterações
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="permissoes-page__layout ds-page-context__content">
        <aside class="permissoes-page__sidebar">
          <div class="permissoes-page__sidebar-search">
            <SearchInput
              v-model="filtroUsuarios"
              placeholder="Buscar colaborador..."
            />
          </div>

          <div class="permissoes-page__sidebar-list custom-scroll">
            <div v-for="grupo in usuariosPorSetor" :key="grupo.setor" class="permissoes-page__group">
              <div class="permissoes-page__group-title">
                <span class="permissoes-page__group-marker"></span>
                <span>{{ grupo.setor }}</span>
              </div>

              <button
                v-for="row in grupo.usuarios"
                :key="row.id"
                type="button"
                @click="selecionarUsuario(row)"
                :class="[
                  'permissoes-page__user-card',
                  usuarioSelecionado?.id === row.id ? 'permissoes-page__user-card--active' : '',
                ]"
              >
                <div class="permissoes-page__user-identity">
                  <div class="permissoes-page__user-initials">
                    {{ userInitials(row.nome) }}
                  </div>

                  <div class="permissoes-page__user-copy">
                    <span class="permissoes-page__user-name">{{ row.nome }}</span>
                    <span class="permissoes-page__user-meta">{{ row.funcionario?.cargo || row.usuario || 'Sem cargo' }}</span>
                    <div class="permissoes-page__user-status">
                      <span class="ds-status-pill" :class="userStatusClass(row.status)">
                        {{ userStatusLabel(row.status) }}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <main class="permissoes-page__main">
          <div v-if="!usuarioSelecionado" class="permissoes-page__empty-state">
            <div class="permissoes-page__empty-icon">
              <i class="pi pi-user-plus"></i>
            </div>
            <h4 class="permissoes-page__empty-title">Aguardando seleção</h4>
            <p class="permissoes-page__empty-text">Escolha um colaborador para gerenciar os acessos.</p>
          </div>

          <template v-else>
            <div class="permissoes-page__summary">
              <div class="permissoes-page__summary-identity">
                <div class="permissoes-page__summary-initials">
                  {{ userInitials(usuarioSelecionado.nome) }}
                </div>

                <div class="permissoes-page__summary-copy">
                  <span class="permissoes-page__summary-title">{{ usuarioSelecionado.nome }}</span>
                  <span class="permissoes-page__summary-subtitle">
                    {{ usuarioSelecionado.email || usuarioSelecionado.usuario || 'Sem e-mail cadastrado' }}
                  </span>
                </div>
              </div>

              <div class="permissoes-page__summary-meta">
                <span class="ds-status-pill" :class="userStatusClass(usuarioSelecionado.status)">
                  {{ userStatusLabel(usuarioSelecionado.status) }}
                </span>
                <span class="permissoes-page__summary-count">
                  {{ permissoesAtivas.length }} permissões ativas
                </span>
              </div>
            </div>

            <div class="permissoes-page__notice">
              <i class="pi pi-info-circle"></i>
              <span>Acesso ao sistema exige login. Abaixo você define o que este usuário pode ver e fazer.</span>
            </div>

            <div v-if="loadingPermissoes" class="permissoes-page__loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Carregando permissões...</span>
            </div>

            <div v-else class="permissoes-page__modules custom-scroll">
              <section v-for="categoria in permissoesPorCategoria" :key="categoria.key" class="permissoes-page__category">
                <button
                  type="button"
                  class="permissoes-page__category-toggle"
                  @click="toggleCategoria(categoria.key)"
                >
                  <div class="permissoes-page__category-header">
                    <span class="permissoes-page__category-eyebrow">Categoria</span>
                    <div class="permissoes-page__category-heading-row">
                      <h2 class="permissoes-page__category-title">{{ categoria.label }}</h2>
                      <span class="permissoes-page__category-count">{{ categoria.modules.length }} módulos</span>
                    </div>
                  </div>

                  <i
                    :class="[
                      'pi pi-chevron-down permissoes-page__category-chevron',
                      isCategoriaExpandida(categoria.key) ? 'permissoes-page__category-chevron--open' : '',
                    ]"
                  ></i>
                </button>

                <div v-show="isCategoriaExpandida(categoria.key)" class="permissoes-page__category-body">
                <section v-for="modulo in categoria.modules" :key="modulo.key" class="permissoes-page__module">
                  <div class="permissoes-page__module-header">
                    <div>
                      <span class="permissoes-page__module-eyebrow">Módulo</span>
                      <h3 class="permissoes-page__module-title">{{ modulo.label }}</h3>
                    </div>

                    <div class="permissoes-page__module-actions">
                      <button type="button" @click="confirmarMarcarTudoModulo(modulo.key, true)">Marcar todos</button>
                      <button type="button" @click="confirmarMarcarTudoModulo(modulo.key, false)">Limpar</button>
                    </div>
                  </div>

                  <div class="permissoes-page__permission-grid">
                    <label
                      v-for="p in modulo.perms"
                      :key="p.chave"
                      :class="[
                        'permissoes-page__permission-card',
                        temPermissao(p.chave) ? 'permissoes-page__permission-card--active' : '',
                      ]"
                    >
                      <div class="permissoes-page__permission-check">
                        <input
                          type="checkbox"
                          class="permissoes-page__permission-input"
                          :checked="temPermissao(p.chave)"
                          @change="togglePermissao(p.chave)"
                        />
                        <span class="permissoes-page__permission-box">
                          <i v-if="temPermissao(p.chave)" class="pi pi-check"></i>
                        </span>
                      </div>

                      <div class="permissoes-page__permission-copy">
                        <span class="permissoes-page__permission-name">{{ p.nome }}</span>
                        <span class="permissoes-page__permission-key">{{ p.chave }}</span>
                      </div>
                    </label>
                  </div>
                </section>
                </div>
              </section>
            </div>
          </template>
        </main>
      </div>
    </section>
  </PageShell>
</template>

<style scoped>
.permissoes-page {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.permissoes-page__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.permissoes-page__selection-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.3rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 999px;
  background: rgba(245, 248, 251, 0.9);
  color: var(--ds-color-primary);
  font-size: 0.72rem;
  font-weight: 600;
}

.permissoes-page__selection-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: currentColor;
}

.permissoes-page__layout {
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  border: 1px solid rgba(214, 224, 234, 0.68);
  border-radius: 1rem;
  overflow: hidden;
}

.permissoes-page__sidebar,
.permissoes-page__main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.permissoes-page__sidebar {
  overflow: hidden;
  border-right: 1px solid rgba(214, 224, 234, 0.68);
}

.permissoes-page__sidebar-search {
  padding: 1rem 1rem 0.85rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.6);
}

.permissoes-page__sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.6rem 0;
}

.permissoes-page__group + .permissoes-page__group {
  margin-top: 1rem;
}

.permissoes-page__group-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.3rem 0.55rem;
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.permissoes-page__group-marker {
  width: 0.22rem;
  height: 0.95rem;
  border-radius: 999px;
  background: rgba(44, 111, 163, 0.65);
}

.permissoes-page__user-card {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 0;
  border-radius: 0;
  border-left: 2px solid transparent;
  background: transparent;
  text-align: left;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.permissoes-page__user-card:hover {
  background: rgba(248, 250, 252, 0.45);
}

.permissoes-page__user-card--active {
  border-left-color: var(--ds-color-primary);
  background: rgba(44, 111, 163, 0.04);
}

.permissoes-page__user-card + .permissoes-page__user-card {
  margin-top: 0;
}

.permissoes-page__user-identity {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.permissoes-page__user-initials,
.permissoes-page__summary-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.9);
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.permissoes-page__user-copy,
.permissoes-page__summary-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.permissoes-page__user-name,
.permissoes-page__summary-title {
  color: var(--ds-color-text);
  font-size: 0.9rem;
  font-weight: 540;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
}

.permissoes-page__user-meta,
.permissoes-page__summary-subtitle,
.permissoes-page__summary-count,
.permissoes-page__permission-key {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
}

.permissoes-page__user-status {
  margin-top: 0.3rem;
}

.permissoes-page__main {
  overflow: hidden;
}

.permissoes-page__empty-state,
.permissoes-page__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 2rem;
  text-align: center;
}

.permissoes-page__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.9);
  color: var(--ds-color-text-faint);
  font-size: 1.15rem;
}

.permissoes-page__empty-title {
  color: var(--ds-color-text);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.permissoes-page__empty-text,
.permissoes-page__notice {
  color: var(--ds-color-text-faint);
  font-size: 0.78rem;
  line-height: 1.55;
}

.permissoes-page__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.6);
  background: transparent;
}

.permissoes-page__summary-identity,
.permissoes-page__summary-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.permissoes-page__summary-meta {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.permissoes-page__notice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.6);
  background: transparent;
}

.permissoes-page__notice i {
  color: var(--ds-color-primary);
}

.permissoes-page__modules {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.25rem 1.35rem;
}

.permissoes-page__category {
  border-bottom: 1px solid rgba(214, 224, 234, 0.68);
}

.permissoes-page__category-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 0;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.permissoes-page__category-header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.permissoes-page__category-heading-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.permissoes-page__category-eyebrow {
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.permissoes-page__category-title {
  color: var(--ds-color-text);
  font-size: 1rem;
  font-weight: 620;
  line-height: 1.3;
}

.permissoes-page__category-count {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}

.permissoes-page__category-chevron {
  color: var(--ds-color-text-faint);
  font-size: 0.8rem;
  transition: transform 0.18s ease, color 0.18s ease;
}

.permissoes-page__category-chevron--open {
  transform: rotate(180deg);
  color: var(--ds-color-primary);
}

.permissoes-page__category-body {
  padding-bottom: 0.15rem;
}

.permissoes-page__module + .permissoes-page__module {
  margin-top: 0;
}

.permissoes-page__module {
  padding: 1.15rem 0;
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid rgba(214, 224, 234, 0.68);
  background: transparent;
}

.permissoes-page__module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.9rem;
}

.permissoes-page__module-eyebrow {
  display: inline-block;
  margin-bottom: 0.2rem;
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.permissoes-page__module-title {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.3;
}

.permissoes-page__module-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.permissoes-page__module-actions button {
  color: var(--ds-color-text-faint);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: color 0.18s ease;
}

.permissoes-page__module-actions button:hover {
  color: var(--ds-color-primary);
}

.permissoes-page__permission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.permissoes-page__permission-card {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.85rem 0.25rem;
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid rgba(214, 224, 234, 0.62);
  background: transparent;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.permissoes-page__permission-card:hover {
  background: rgba(248, 250, 252, 0.45);
}

.permissoes-page__permission-card--active {
  background: rgba(44, 111, 163, 0.05);
}

.permissoes-page__permission-check {
  position: relative;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  margin-top: 0.08rem;
}

.permissoes-page__permission-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.permissoes-page__permission-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border: 1px solid rgba(188, 203, 221, 0.9);
  border-radius: 0.3rem;
  background: rgba(248, 250, 252, 0.95);
  color: white;
  font-size: 0.55rem;
}

.permissoes-page__permission-card--active .permissoes-page__permission-box {
  border-color: var(--ds-color-primary);
  background: var(--ds-color-primary);
}

.permissoes-page__permission-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.permissoes-page__permission-name {
  color: var(--ds-color-text);
  font-size: 0.8rem;
  font-weight: 550;
  line-height: 1.35;
}

.permissoes-page__permission-card--active .permissoes-page__permission-name {
  color: var(--ds-color-primary);
}

.permissoes-page :deep(.ds-status-pill) {
  max-width: 100%;
  justify-content: center;
  padding-inline: 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

.custom-scroll::-webkit-scrollbar {
  width: 3px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1180px) {
  .permissoes-page__permission-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .permissoes-page__layout {
    grid-template-columns: 1fr;
  }

  .permissoes-page__sidebar {
    max-height: 24rem;
    border-right: 0;
    border-bottom: 1px solid rgba(214, 224, 234, 0.68);
  }

  .permissoes-page__summary,
  .permissoes-page__module-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .permissoes-page__summary-meta,
  .permissoes-page__header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .permissoes-page__permission-grid {
    grid-template-columns: 1fr;
  }

  .permissoes-page__modules,
  .permissoes-page__summary,
  .permissoes-page__notice,
  .permissoes-page__sidebar-search {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .permissoes-page__module {
    padding: 0.9rem;
  }
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UsuariosService, PermissoesService } from '@/services/index'
import { useAuth } from '@/services/useauth'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { NAV_SCHEMA } from '@/services/navigation'

definePage({ meta: { perm: 'permissoes.ver' } })


const router = useRouter()
const { temAcesso, usuarioLogado, syncMe } = useAuth()

// Estados
const usuarios = ref([])
const filtroUsuarios = ref('')
const usuarioSelecionado = ref(null)
const permissoesAtivas = ref([])
const categoriasExpandidas = ref([])
const loadingSalvar = ref(false)
const loadingDados = ref(false)
const loadingPermissoes = ref(false)
const catalogoPermissoes = ref([])

// Rótulos amigáveis dos módulos (ex.: producao_fabrica → PRODUÇÃO/FÁBRICA)
const ROTULO_MODULO = {
  producao_fabrica: 'PRODUÇÃO/FÁBRICA',
  geral: 'Geral',
  contratos: 'Contratos',
  clientes: 'Clientes',
  permissoes: 'Permissões',
  configuracoes: 'Configurações',
  agendamentos: 'Agendamentos',
  vendas: 'Vendas',
  orcamentos: 'Orçamentos',
  plano_corte: 'Serviço de Corte',
  funcionarios: 'Funcionários',
  ponto_relatorio: 'Ponto',
  ponto_convite: 'Ponto Convites',
  relatorios: 'Relatórios',
  usuarios: 'Usuários',
  arquivos: 'Arquivos',
  contas_pagar: 'Contas a Pagar',
  contas_receber: 'Contas a Receber',
  despesas: 'Despesas',
  compras: 'Compras',
  fornecedores: 'Fornecedores',
  produtos: 'Produtos',
  fechamento_fornecedor: 'Fechamento Fornecedor',
}

const SECTION_LABELS = {
  comercial: '1 Comercial',
  comercial_2: '2 Comercial',
  producao: 'Produção',
  financeiro: 'Financeiro',
  cadastros: 'Cadastros',
  configuracoes: 'Configurações',
  relatorios: 'Relatórios',
  sistema: 'Sistema',
}

const SECTION_ORDER = [
  'comercial',
  'comercial_2',
  'producao',
  'financeiro',
  'cadastros',
  'configuracoes',
  'relatorios',
  'sistema',
]

const MODULO_PARA_CATEGORIA = (() => {
  const mapa = {}

  const registrarPermissao = (perm, sectionKey) => {
    if (!perm || typeof perm !== 'string' || perm === 'ADMIN') return
    const modulo = perm.includes('.') ? perm.split('.')[0] : perm
    if (modulo && !mapa[modulo]) mapa[modulo] = sectionKey
  }

  const registrarItem = (item, sectionKey) => {
    if (!item || item.divider || item.heading) return
    if (Array.isArray(item.perm)) {
      item.perm.forEach((perm) => registrarPermissao(perm, sectionKey))
    } else {
      registrarPermissao(item.perm, sectionKey)
    }
    if (Array.isArray(item.children)) {
      item.children.forEach((child) => registrarItem(child, sectionKey))
    }
  }

  Object.entries(NAV_SCHEMA).forEach(([sectionKey, items]) => {
    ;(items || []).forEach((item) => registrarItem(item, sectionKey))
  })

  mapa.dashboard = 'sistema'
  mapa.index = 'sistema'
  mapa.geral = 'sistema'

  return mapa
})()

// Chave -> ID
const mapaChaveParaId = computed(() => {
  const acc = {}
  for (const p of catalogoPermissoes.value) {
    if (p?.chave) acc[p.chave] = p.id
  }
  return acc
})

// Agrupa permissões por módulo
const MAPA_PERMISSOES = computed(() => {
  const grupos = {}
  for (const p of catalogoPermissoes.value) {
    const chave = String(p?.chave || '')
    if (!chave) continue
    const modulo = chave.includes('.') ? chave.split('.')[0] : 'geral'
    if (!grupos[modulo]) grupos[modulo] = []
    grupos[modulo].push({
      id: p.id,
      chave: p.chave,
      nome: p.descricao || p.chave,
    })
  }
  for (const m of Object.keys(grupos)) {
    grupos[m].sort((a, b) => String(a.chave).localeCompare(String(b.chave)))
  }
  return grupos
})

const permissoesPorCategoria = computed(() => {
  const categorias = {}

  for (const [modulo, perms] of Object.entries(MAPA_PERMISSOES.value || {})) {
    const categoryKey = MODULO_PARA_CATEGORIA[modulo] || 'sistema'
    if (!categorias[categoryKey]) {
      categorias[categoryKey] = {
        key: categoryKey,
        label: SECTION_LABELS[categoryKey] || categoryKey,
        modules: [],
      }
    }

    categorias[categoryKey].modules.push({
      key: modulo,
      label: ROTULO_MODULO[modulo] || modulo,
      perms,
    })
  }

  Object.values(categorias).forEach((categoria) => {
    categoria.modules.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  })

  return Object.values(categorias).sort((a, b) => {
    return SECTION_ORDER.indexOf(a.key) - SECTION_ORDER.indexOf(b.key)
  })
})

// Nome do setor do usuário (funcionario.setor ou usuário)
const setorDoUsuario = (u) =>
  String(u?.funcionario?.setor || u?.setor || '').trim() || 'Geral'

// Filtro usuários
const usuariosFiltrados = computed(() => {
  const termo = String(filtroUsuarios.value || '').toLowerCase().trim()
  if (!termo) return usuarios.value
  return usuarios.value.filter(u =>
    String(u?.nome || '').toLowerCase().includes(termo) ||
    String(u?.usuario || '').toLowerCase().includes(termo)
  )
})

// Usuários agrupados por setor (ordenado: setores A–Z, "Geral" por último)
const usuariosPorSetor = computed(() => {
  const lista = usuariosFiltrados.value
  const porSetor = {}
  for (const u of lista) {
    const setor = setorDoUsuario(u)
    if (!porSetor[setor]) porSetor[setor] = []
    porSetor[setor].push(u)
  }
  const setores = Object.keys(porSetor).sort((a, b) => {
    if (a === 'Geral') return 1
    if (b === 'Geral') return -1
    return a.localeCompare(b, 'pt-BR')
  })
  return setores.map((setor) => ({ setor, usuarios: porSetor[setor] }))
})

function userInitials(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  const iniciais = `${partes[0]?.[0] || ''}${partes[1]?.[0] || partes[0]?.[1] || ''}`
  return String(iniciais || '?').toUpperCase()
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

function isCategoriaExpandida(categoryKey) {
  return categoriasExpandidas.value.includes(categoryKey)
}

function expandirCategoriaDoModulo(modulo) {
  const categoryKey = MODULO_PARA_CATEGORIA[String(modulo || '')] || 'sistema'
  if (isCategoriaExpandida(categoryKey) && categoriasExpandidas.value.length === 1) return
  categoriasExpandidas.value = [categoryKey]
}

function toggleCategoria(categoryKey) {
  if (isCategoriaExpandida(categoryKey)) {
    categoriasExpandidas.value = categoriasExpandidas.value.filter((key) => key !== categoryKey)
    return
  }

  categoriasExpandidas.value = [categoryKey]
}

// Funções de API
const carregarCatalogo = async () => {
  try {
    const { data } = await PermissoesService.listar()
    catalogoPermissoes.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Catálogo de permissões indisponível')
  }
}

const carregarUsuarios = async () => {
  loadingDados.value = true
  try {
    const { data } = await UsuariosService.listar()
    usuarios.value = Array.isArray(data) ? data : []
  } finally {
    loadingDados.value = false
  }
}

// Normaliza o que vem do banco
const normalizarPerms = (data) => {
  if (!Array.isArray(data)) return []
  // Se vier um array de objetos [{chave: '...'}], extrai só a string da chave
  if (data.length > 0 && typeof data[0] === 'object') {
    return data.map(x => x.chave || x.permission?.chave).filter(Boolean)
  }
  return data
}

// Selecionar usuário
const selecionarUsuario = async (u) => {
  usuarioSelecionado.value = u
  loadingPermissoes.value = true
  try {
    const { data } = await PermissoesService.listarDoUsuario(u.id)
    permissoesAtivas.value = normalizarPerms(data)
  } catch (e) {
    notify.error('Erro ao carregar permissões do usuário')
  } finally {
    loadingPermissoes.value = false
  }
}

// Helpers de tela
const temPermissao = (chave) => permissoesAtivas.value.includes(chave)

const togglePermissao = (chave) => {
  const modulo = String(chave || '').includes('.') ? String(chave).split('.')[0] : String(chave || 'geral')
  expandirCategoriaDoModulo(modulo)

  const idx = permissoesAtivas.value.indexOf(chave)
  if (idx >= 0) permissoesAtivas.value.splice(idx, 1)
  else permissoesAtivas.value.push(chave)
}

const marcarTudoModulo = (modulo, marcar) => {
  expandirCategoriaDoModulo(modulo)

  const perms = MAPA_PERMISSOES.value?.[modulo] || []
  const chavesModulo = perms.map(p => p.chave)
  const set = new Set(permissoesAtivas.value)
  chavesModulo.forEach(k => (marcar ? set.add(k) : set.delete(k)))
  permissoesAtivas.value = Array.from(set)
}

// Ações
async function confirmarSalvarPermissoes() {
  if (!temAcesso('permissoes.gerenciar')) return notify.error('Acesso negado.')
  if (!usuarioSelecionado.value?.id) return
  const ok = await confirm.show('Salvar', `Deseja salvar as permissões de ${usuarioSelecionado.value.nome}?`)
  if (ok) await salvar()
}

async function confirmarMarcarTudoModulo(modulo, marcar) {
  if (!temAcesso('permissoes.gerenciar')) return notify.error('Acesso negado.')
  const ok = await confirm.show(marcar ? 'Marcar' : 'Limpar', `Deseja alterar o módulo ${modulo}?`)
  if (ok) marcarTudoModulo(modulo, marcar)
}

const salvar = async () => {
  if (!temAcesso('permissoes.gerenciar')) return notify.error('Acesso negado.')
  loadingSalvar.value = true
  try {
    const ids = permissoesAtivas.value
      .map(chave => Number(mapaChaveParaId.value[chave]))
      .filter(n => Number.isFinite(n))

    console.log('[PERMS] chaves:', permissoesAtivas.value)
    console.log('[PERMS] ids:', ids)

    await PermissoesService.definirParaUsuario(usuarioSelecionado.value.id, ids)

    // confere na hora o que ficou no banco
    const { data } = await PermissoesService.listarDoUsuario(usuarioSelecionado.value.id)
    permissoesAtivas.value = normalizarPerms(data)

    // Se alteramos as permissões do próprio usuário, atualiza sessão local (menu e can())
    if (usuarioSelecionado.value.id === usuarioLogado.value?.id) {
      await syncMe()
    }

    const agora = new Date()
    const dia = String(agora.getDate()).padStart(2, '0')
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const ano = agora.getFullYear()
    const dataRegistro = `${dia}/${mes}/${ano}`
    const quem = usuarioLogado.value?.nome || 'Sistema'
    notify.success(`Permissões atualizadas! Registrado em ${dataRegistro} por ${quem}.`)
  } catch (e) {
    console.error(e)
    notify.error('Erro ao salvar')
  } finally {
    loadingSalvar.value = false
  }
}


onMounted(async () => {
  const user = usuarioLogado.value
  const perms = Array.isArray(user?.permissoes) ? user.permissoes : (Array.isArray(user?.permissões) ? user.permissões : [])
  const ehAdmin = perms.includes('ADMIN')

  if (!ehAdmin && !temAcesso('permissoes.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }

  await Promise.all([carregarUsuarios(), carregarCatalogo()])
})

</script>
