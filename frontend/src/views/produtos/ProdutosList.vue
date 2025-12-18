<template>
  <div class="main-container">
    <div class="form-card">

      <!-- HEADER -->
      <div class="form-header">
        <h1 class="form-title">Produtos</h1>

        <button
          class="btn btn-primary"
          @click="$router.push('/produtos/novo')"
        >
          Novo Produto
        </button>
      </div>

      <!-- BUSCA -->
      <div class="form-grid gap-md mb-4">
        <SearchInput
          v-model="busca"
          label="Buscar produto"
          placeholder="Nome, fornecedor, unidade, valor..."
          colSpan="col-span-6"
        />
      </div>

      <!-- TABELA -->
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Fornecedor</th>
            <th>Unidade</th>
            <th>Qtd</th>
            <th>Valor Unit.</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtosFiltrados" :key="p.id">
            <td>{{ p.nome }}</td>
            <td>{{ p.fornecedor || '-' }}</td>
            <td>{{ p.unidade || '-' }}</td>
            <td>{{ p.quantidade }}</td>
            <td>
              R$ {{ p.valor_unitario }}
            </td>
            <td class="text-right">
              <button
                class="btn btn-secondary btn-sm"
                @click="editar(p.id)"
              >
                Editar
              </button>
            </td>
          </tr>

          <tr v-if="!produtosFiltrados.length">
            <td colspan="6" class="text-center text-secondary">
              Nenhum produto encontrado
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>


<script>
import SearchInput from '@/components/ui/SearchInput.vue'
import { parseBuscaProduto } from '@/utils/search' // ajuste o caminho se necessário

export default {
  name: 'ProdutosIndex',

  components: {
    SearchInput
  },

  data() {
    return {
      produtos: [],
      busca: ''
    }
  },

  async mounted() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/produtos`)
    this.produtos = await res.json()
  },

  computed: {
    produtosFiltrados() {
      if (!this.busca) return this.produtos

      const filtros = parseBuscaProduto(this.busca)

      return this.produtos.filter(p => {
        // texto livre (nome / fornecedor)
        const textoBase = `
          ${p.nome}
          ${p.fornecedor}
        `.toLowerCase()

        if (
          filtros.texto.length &&
          !filtros.texto.every(t => textoBase.includes(t))
        ) {
          return false
        }

        // unidade
        if (filtros.unidade && p.unidade !== filtros.unidade) {
          return false
        }

        // quantidade
        if (
          filtros.quantidade !== null &&
          Number(p.quantidade) !== filtros.quantidade
        ) {
          return false
        }

        // valor unitário
        if (
          filtros.valor !== null &&
          Number(p.valor_unitario) !== filtros.valor
        ) {
          return false
        }

        return true
      })
    }
  },

  methods: {
    editar(id) {
      this.$router.push(`/produtos/${id}`)
    }
  }
}
</script>

