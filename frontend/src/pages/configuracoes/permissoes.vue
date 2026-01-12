<template>
  <template v-if="isAuthenticated && usuarioLogado">
    <Card :shadow="true">
      <!-- HEADER -->
      <header class="flex flex-col gap-4 px-8 pt-8 pb-6 border-b border-gray-100">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <i class="pi pi-shield text-brand-primary text-xl"></i>
              <h2 class="text-2xl font-black text-gray-900 tracking-tight">Permissões</h2>
            </div>

            <p class="text-sm font-semibold text-gray-400 mt-2">
              Selecione um colaborador e marque os módulos que ele pode acessar.
            </p>
          </div>

          <Button variant="secondary" size="sm" type="button" @click="$router.back()">
            Voltar
          </Button>
        </div>
      </header>

      <!-- BODY -->
      <div class="p-8">
        <div class="grid grid-cols-12 gap-6">
          <!-- ESQUERDA -->
          <section class="col-span-12 lg:col-span-4">
            <div class="pb-3 mb-4 border-b border-gray-100">
              <h3 class="text-sm font-black text-gray-900 tracking-tight">Colaboradores</h3>
              <p class="text-xs font-semibold text-gray-400 mt-1">Selecione para editar acessos.</p>
            </div>

            <SearchInput
              v-model="filtroUsuarios"
              placeholder="Filtrar por nome..."
              colSpan="w-full"
            />

            <div class="mt-4 max-h-[520px] overflow-auto pr-1">
              <button
                v-for="u in usuariosFiltrados"
                :key="u.id"
                type="button"
                @click="selecionarUsuario(u)"
                class="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition-all text-left mb-2"
                :class="usuarioSelecionado?.id === u.id ? 'ring-2 ring-brand-primary/10 border-brand-primary/20 bg-brand-primary/[0.03]' : ''"
              >
                <div class="w-10 h-10 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center font-black">
                  {{ (u.nome || '-').charAt(0) }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-black text-gray-900 truncate">{{ u.nome }}</div>
                  <div class="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em]">
                    {{ u.setor }}
                  </div>
                </div>

                <i v-if="usuarioSelecionado?.id === u.id" class="pi pi-angle-right text-brand-primary"></i>
              </button>
            </div>
          </section>

          <!-- DIREITA -->
          <section class="col-span-12 lg:col-span-8">
            <div class="pb-3 mb-4 border-b border-gray-100">
              <h3 class="text-sm font-black text-gray-900 tracking-tight">
                {{ usuarioSelecionado ? `Permissões: ${usuarioSelecionado.nome}` : 'Permissões do usuário' }}
              </h3>
              <p class="text-xs font-semibold text-gray-400 mt-1">
                {{ usuarioSelecionado ? 'Marque os módulos que este usuário pode acessar.' : 'Selecione um colaborador à esquerda.' }}
              </p>
            </div>

            <div v-if="usuarioSelecionado" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="(permissoes, modulo) in mapaPermissoes"
                :key="modulo"
                class="rounded-3xl border border-gray-100 bg-white shadow-sm p-5"
              >
                <h4 class="text-sm font-black text-gray-900 tracking-tight">
                  {{ modulo }}
                </h4>

                <div class="mt-4 space-y-3">
                  <label
                    v-for="p in permissoes"
                    :key="p.chave"
                    class="flex items-start gap-3 p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :value="p.chave"
                      v-model="permissoesAtivas"
                      class="mt-1 w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />

                    <div class="min-w-0">
                      <span class="block text-sm font-bold text-gray-800">
                        {{ p.nome }}
                      </span>
                      <code class="block text-[11px] font-semibold text-gray-400 truncate">
                        {{ p.chave }}
                      </code>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div v-else class="rounded-3xl border border-gray-100 bg-gray-50/40 p-10 text-center">
              <i class="pi pi-shield text-4xl text-gray-300"></i>
              <h3 class="text-base font-black text-gray-900 mt-4">Nenhum usuário selecionado</h3>
              <p class="text-sm font-semibold text-gray-400 mt-2">
                Selecione um colaborador à esquerda para gerenciar os níveis de acesso.
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- FOOTER -->
      <footer class="flex justify-end px-8 py-6 border-t border-gray-100">
        <Button
          variant="primary"
          type="button"
          @click="salvar"
          :loading="loadingSalvar"
          :disabled="!usuarioSelecionado"
        >
          Salvar Alterações
        </Button>
      </footer>
    </Card>
  </template>

  <template v-else>
    <Card :shadow="true">
      <div class="p-10 flex flex-col items-center justify-center gap-3">
        <i class="pi pi-spin pi-spinner text-brand-primary text-4xl"></i>
        <p class="text-gray-400 font-medium animate-pulse">Sincronizando acessos ACASA...</p>
      </div>
    </Card>
  </template>
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
    { nome: 'Clientes', chave: 'clientes.ver' },
    { nome: 'Fornecedores', chave: 'fornecedores.ver' },
    { nome: 'Gerenciar Orçamentos', chave: 'orcamentos.gerenciar' }
  ],
  'Módulo Financeiro': [
    { nome: 'Contas a Pagar', chave: 'contas-pagar.ver' },
    { nome: 'Contas a Receber', chave: 'contas-receber.ver' },
    { nome: 'Fluxo de Caixa', chave: 'financeiro.ver' },
  ],

  'Módulo de Estoque': [
    { nome: 'Visualizar Estoque', chave: 'estoque.ver' },
    { nome: 'Gerenciar Produtos', chave: 'produtos.gerenciar' },
    { nome: 'Fornecedores', chave: 'fornecedores.ver' }
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
