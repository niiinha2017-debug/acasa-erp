<template>
  <div v-if="isAuthenticated && usuarioLogado" class="page-container">
    <div class="grid grid-cols-12 gap-6">
      
      <div class="col-span-4">
        <Card>
          <header class="card-header">
            <h2 class="card-title">Colaboradores</h2>
            <p class="cell-muted">Selecione para editar acessos</p>
          </header>
          
          <div class="p-4">
            <SearchInput 
              v-model="filtroUsuarios" 
              placeholder="Filtrar por nome..." 
            />
          </div>

          <div class="usuarios-lista-scroll">
            <div 
              v-for="u in usuariosFiltrados" 
              :key="u.id"
              :class="['user-selection-item', { active: usuarioSelecionado?.id === u.id }]"
              @click="selecionarUsuario(u)"
            >
              <div class="avatar-mini">{{ u.nome.charAt(0) }}</div>
              <div class="flex-1">
                <div class="font-bold text-sm">{{ u.nome }}</div>
                <div class="cell-muted text-xs uppercase">{{ u.setor }}</div>
              </div>
              <span v-if="usuarioSelecionado?.id === u.id" class="text-blue-500">➜</span>
            </div>
          </div>
        </Card>
      </div>

      <div class="col-span-8">
        <Card v-if="usuarioSelecionado">
          <header class="card-header header-between">
            <div>
              <h2 class="card-title">Permissões: {{ usuarioSelecionado.nome }}</h2>
              <p class="cell-muted">Marque os módulos que este usuário pode acessar.</p>
            </div>
            <Button 
              variant="primary" 
              @click="salvar" 
              :loading="loadingSalvar"
            >
              Salvar Alterações
            </Button>
          </header>

          <div class="card-body grid grid-cols-2 gap-6">
            <div v-for="(permissoes, modulo) in mapaPermissoes" :key="modulo" class="modulo-card">
              <h3 class="modulo-titulo">{{ modulo }}</h3>
              <div class="space-y-3">
                <label v-for="p in permissoes" :key="p.chave" class="permission-check">
                  <input 
                    type="checkbox" 
                    :value="p.chave" 
                    v-model="permissoesAtivas"
                  />
                  <div class="check-label">
                    <span class="block font-medium">{{ p.nome }}</span>
                    <code class="text-xs text-gray-400">{{ p.chave }}</code>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card v-else class="empty-selection">
          <div class="text-center p-12">
            <div class="text-4xl mb-4">🛡️</div>
            <h3 class="card-title">Nenhum usuário selecionado</h3>
            <p class="cell-muted">Selecione um colaborador à esquerda para gerenciar os níveis de acesso.</p>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/services/useauth'
import { UsuariosService, PermissoesService } from '@/services'

// Componentes da sua UI
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const { usuarioLogado, isAuthenticated } = useAuth()

const usuarios = ref([])
const filtroUsuarios = ref('')
const usuarioSelecionado = ref(null)
const permissoesAtivas = ref([])
const loadingSalvar = ref(false)

const mapaPermissoes = {
  'Módulo Comercial': [
    { nome: 'Visualizar Vendas', chave: 'vendas.ver' },
    { nome: 'Gerenciar Orçamentos', chave: 'orcamentos.ver' },
    { nome: 'Clientes', chave: 'clientes.ver' }
  ],
  'Módulo Financeiro': [
    { nome: 'Contas a Pagar', chave: 'contas-pagar.ver' },
    { nome: 'Contas a Receber', chave: 'contas-receber.ver' },
    { nome: 'Fluxo de Caixa', chave: 'financeiro.ver' }
  ],
  'Configurações Avançadas': [
    { nome: 'Gerenciar Usuários', chave: 'usuarios.ver' },
    { nome: 'Editar Permissões', chave: 'permissoes.gerenciar' },
    { nome: 'Ajustar Constantes', chave: 'constantes.ver' }
  ]
}

const usuariosFiltrados = computed(() => {
  const termo = filtroUsuarios.value.toLowerCase()
  return usuarios.value.filter(u => u.nome.toLowerCase().includes(termo))
})

async function carregar() {
  const { data } = await UsuariosService.listar()
  usuarios.value = data || []
}

async function selecionarUsuario(u) {
  usuarioSelecionado.value = u
  const { data } = await PermissoesService.listarDoUsuario(u.id)
  permissoesAtivas.value = data.map(p => typeof p === 'string' ? p : p.chave)
}

async function salvar() {
  loadingSalvar.value = true
  try {
    await PermissoesService.definirParaUsuario(usuarioSelecionado.value.id, permissoesAtivas.value)
    alert('Acessos atualizados!')
  } finally {
    loadingSalvar.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.usuarios-lista-scroll {
  max-height: 600px;
  overflow-y: auto;
}

.user-selection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.user-selection-item:hover { background: var(--bg-hover); }
.user-selection-item.active {
  background: #f0f7ff;
  border-left-color: var(--primary-color);
}

.avatar-mini {
  width: 32px; height: 32px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
}

.modulo-card {
  background: #fdfdfd;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.modulo-titulo {
  font-weight: bold;
  color: var(--text-main);
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.permission-check {
  display: flex;
  gap: 10px;
  cursor: pointer;
}

.permission-check input[type="checkbox"] {
  width: 18px; height: 18px;
  margin-top: 2px;
}

.empty-selection {
  border: 2px dashed #eee !important;
  background: transparent !important;
  box-shadow: none !important;
}
</style>