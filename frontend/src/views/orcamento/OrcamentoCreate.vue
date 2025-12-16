<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api' // seu axios central

const router = useRouter()

const orcamento = ref({
  cliente_nome: '',
  cliente_endereco: '',
  cliente_contato: '',
  data_orcamento: new Date().toISOString().slice(0, 10),
  validade_dias: 7,
  condicoes_pagamento: '',
  prazo_entrega: '',
  observacoes: ''
})
function gerarPdf() {
  // TEMPORÁRIO: ID fixo só para testar
  const idOrcamento = 1

  window.open(
   window.open('http://localhost:3000/orcamentos/1/pdf')
    `http://localhost:3000/orcamentos/${idOrcamento}/pdf`,
    '_blank'
  )
}

const ambientes = ref([])

function addAmbiente() {
  ambientes.value.push({
    nome: '',
    opcoes: []
  })
}

function addOpcao(ambiente) {
  ambiente.opcoes.push({
    titulo: '',
    descritivo: '',
    valor: 0
  })
}

async function salvar() {
  if (!orcamento.value.cliente_nome || ambientes.value.length === 0) {
    alert('Preencha cliente e ao menos um ambiente')
    return
  }

  await api.post('/orcamentos', {
    orcamento: orcamento.value,
    ambientes: ambientes.value
  })

  router.push('/orcamentos')
}
</script>

<template>
  <div>
    <h1>Novo Orçamento</h1>

    <h3>Cliente</h3>
    <input v-model="orcamento.cliente_nome" placeholder="Nome do cliente" />
    <input v-model="orcamento.cliente_endereco" placeholder="Endereço" />
    <input v-model="orcamento.cliente_contato" placeholder="Contato" />

    <h3>Ambientes</h3>

    <div v-for="(ambiente, i) in ambientes" :key="i">
      <input v-model="ambiente.nome" placeholder="Nome do ambiente" />

      <div v-for="(opcao, j) in ambiente.opcoes" :key="j">
        <input v-model="opcao.titulo" placeholder="Título da opção" />
        <textarea v-model="opcao.descritivo" placeholder="Descritivo"></textarea>
        <input type="number" v-model.number="opcao.valor" placeholder="Valor" />
      </div>

      <button @click="addOpcao(ambiente)">+ Opção</button>
    </div>

    <button @click="addAmbiente">+ Ambiente</button>

    <h3>Condições</h3>
    <textarea v-model="orcamento.condicoes_pagamento" placeholder="Condições de pagamento"></textarea>
    <textarea v-model="orcamento.prazo_entrega" placeholder="Prazo de entrega"></textarea>

    <br /><br />
    <button @click="salvar">Salvar orçamento</button>
  </div>
  <button @click="gerarPdf">
  Gerar PDF
</button>

</template>
