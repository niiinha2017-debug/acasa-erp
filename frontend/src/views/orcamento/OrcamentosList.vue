<script setup>
    
import { reactive } from 'vue'

const orcamento = reactive({
  cliente: {
    nome: '',
    endereco: '',
    contato: ''
  },
  ambientes: [
    {
      nome: '',
      opcoes: [
        {
          titulo: '',
          descritivo: '',
          valor: 0
        }
      ]
    }
  ],
  condicoes: {
    pagamento: '',
    prazo_entrega: ''
  }
})

function adicionarAmbiente() {
  orcamento.ambientes.push({
    nome: '',
    opcoes: [
      {
        titulo: '',
        descritivo: '',
        valor: 0
      }
    ]
  })
}

function adicionarOpcao(indexAmbiente) {
  orcamento.ambientes[indexAmbiente].opcoes.push({
    titulo: '',
    descritivo: '',
    valor: 0
  })
}
</script>
<input v-model="orcamento.cliente.nome" placeholder="Nome do cliente" />
<input v-model="orcamento.cliente.endereco" placeholder="Endereço" />
<input v-model="orcamento.cliente.contato" placeholder="Contato" />


<template>
  <div class="page">
    <div class="page-header">
      <h1>Orçamentos</h1>

      <button class="btn-primary" @click="novoOrcamento">
        Novo Orçamento
      </button>
    </div>

    <ul v-if="orcamentos.length">
      <li v-for="o in orcamentos" :key="o.id">
        {{ o.cliente_nome }} — {{ o.data_orcamento }}
      </li>
    </ul>

    <p v-else class="hint">
      Nenhum orçamento listado ainda.
    </p>
  </div>
</template>
