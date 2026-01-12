<template>
  <Card>
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? 'Editar Lançamento' : 'Nova Despesa/Vale' }}
        </h2>
      </div>

      <Button variant="secondary" size="sm" type="button" @click="router.back()">
        Voltar
      </Button>
    </header>

    <div class="p-6">
      <form class="grid grid-cols-12 gap-5" @submit.prevent="salvar">
        <div class="col-span-12 md:col-span-4">
          <label class="block text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500 mb-2">
            Movimentação <span class="text-danger">*</span>
          </label>
          <select
            v-model="form.tipo_movimento"
            required
            class="w-full h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10"
          >
            <option value="SAÍDA">SAÍDA</option>
            <option value="ENTRADA">ENTRADA</option>
          </select>
        </div>

        <div class="col-span-12 md:col-span-8">
          <SearchInput
            v-model="form.funcionario_id"
            label="Funcionário (Opcional)"
            :options="listaFuncionarios"
            :colSpan="12"
          />
        </div>

<div class="col-span-12 md:col-span-6">
<SearchInput
  v-model="categoriaSelecionada"
  :options="cat.opcoes.value"
  label="Item (Energia, Internet...) *"
  required
  @update:modelValue="vincularClassificacaoChave"
/>
</div>

<div class="col-span-12 md:col-span-6">
  <Input
    v-model="form.classificacao"
    label="Classificação (Automática)"
    readonly
    class="bg-gray-50 font-bold text-blue-600" 
    placeholder="Selecione um item..."
  />
</div>

        <div class="col-span-12 md:col-span-4">
          <label class="block text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500 mb-2">
            Unidade <span class="text-danger">*</span>
          </label>
          <select
            v-model="form.unidade"
            required
            class="w-full h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10"
          >
            <option value="FÁBRICA">FÁBRICA</option>
            <option value="LOJA">LOJA</option>
          </select>
        </div>

        <div class="col-span-12 md:col-span-5">
          <Input v-model="form.local" label="Local / Fornecedor *" required />
        </div>

        <div class="col-span-12 md:col-span-3">
          <Input
            v-model="form.valor_total"
            label="Valor Total *"
            type="number"
            step="0.01"
            required
          />
        </div>

        <div class="col-span-12 h-px bg-gray-100 my-2"></div>

        <div class="col-span-12 md:col-span-5">
          <SearchInput
            v-model="form.forma_pagamento"
            label="Forma de Pagamento *"
            :options="pag.opcoes.value"
            required
            :colSpan="12"
          />
        </div>

        <div class="col-span-12 md:col-span-3">
          <Input
            v-model.number="form.quantidade_parcelas"
            label="Qtd. Parcelas"
            type="number"
            min="1"
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <SearchInput
            v-model="form.status"
            label="Status *"
            :options="sta.opcoes.value"
            required
            :colSpan="12"
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input v-model="form.data_vencimento" label="1º Vencimento *" type="date" required />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input v-model="form.data_pagamento" label="Data de Pagamento" type="date" />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input v-model="form.data_registro" label="Data do Registro *" type="date" required />
        </div>
      </form>
    </div>

    <footer class="flex justify-end gap-3 p-6 border-t border-gray-100">
      <Button v-if="isEdit" variant="danger" type="button" @click="excluir">
        Excluir
      </Button>

      <Button variant="primary" type="button" :loading="loading" @click="salvar">
        {{ isEdit ? 'Salvar' : 'Gerar Lançamentos' }}
      </Button>
    </footer>
  </Card>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useConstantes } from '@/composables/useConstantes'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value && id.value !== 'novo')
const loading = ref(false)

const cat = useConstantes()
const pag = useConstantes()
const sta = useConstantes()

const listaFuncionarios = ref([])
const categoriaSelecionada = ref('')

const form = ref({
  tipo_movimento: 'SAÍDA',
  unidade: 'FÁBRICA',
  categoria: '',
  classificacao: '',
  local: '',
  valor_total: '',
  forma_pagamento: '',
  quantidade_parcelas: 1,
  funcionario_id: null,
  data_registro: new Date().toISOString().slice(0, 10),
  data_vencimento: '',
  data_pagamento: '',
  status: ''
})
const vincularClassificacaoChave = (valorChave) => {
  if (!valorChave) return

  const item = cat.opcoes.value.find(o => o.value === valorChave)
  
  if (item) {
    // Atualiza o objeto form com os dados reais da constante
    form.value.categoria = item.label            // Ex: "Energia" (salva no banco)
    form.value.classificacao = item.metadata?.info || 'CUSTO FIXO' // Automático
    
    console.log('✅ Vinculado com sucesso:', form.value.categoria, '|', form.value.classificacao)
  }
}

function validarObrigatorios() {
  if (!form.value.tipo_movimento) return 'Selecione a Movimentação.'
  if (!form.value.unidade) return 'Selecione a Unidade (Fábrica ou Loja).'
  if (!categoriaSelecionada.value) return 'Selecione o Item (Ex: Água, Vale).'
  if (!form.value.local) return 'Informe o Local / Fornecedor.'
  if (!form.value.valor_total) return 'Informe o Valor Total.'
  if (!form.value.forma_pagamento) return 'Selecione a Forma de Pagamento.'
  if (!form.value.status) return 'Selecione o Status.'
  if (!form.value.data_vencimento) return 'Informe o 1º Vencimento.'
  if (!form.value.data_registro) return 'Informe a Data do Registro.'
  return null
}

async function salvar() {
  // 1. Validamos antes de qualquer coisa
  const mensagemErro = validarObrigatorios()
  if (mensagemErro) {
    alert(mensagemErro)
    return
  }

  loading.value = true
  try {
    // 2. FORÇA BRUTA: Se o SearchInput falhou, tentamos capturar o valor 
    // direto da variável de controle categoriaSelecionada
    const constanteReal = cat.opcoes.value.find(c => c.value === categoriaSelecionada.value)
    
    if (constanteReal) {
      form.value.categoria = constanteReal.label
      form.value.classificacao = constanteReal.metadata?.info || 'CUSTO FIXO'
    }

    // 3. Montagem do Payload limpo
    const payload = {
      ...form.value,
      valor_total: Number(form.value.valor_total).toFixed(2),
      funcionario_id: form.value.funcionario_id ? Number(form.value.funcionario_id) : null,
      quantidade_parcelas: Number(form.value.quantidade_parcelas || 1)
    }

    console.log('🚀 Enviando Payload Final:', payload)

    if (isEdit.value) {
      await api.put(`/despesas/${id.value}`, payload)
    } else {
      await api.post('/despesas', payload)
    }

    router.push('/despesas')
  } catch (e) {
    console.error('❌ Erro no Servidor:', e.response?.data || e)
    alert('Erro ao salvar. Verifique a conexão com o servidor.')
  } finally {
    loading.value = false
  }
}
async function excluir() {
  if (!confirm('Deseja realmente excluir este lançamento?')) return

  loading.value = true
  try {
    await api.delete(`/despesas/${id.value}`)
    router.push('/despesas')
  } catch (e) {
    console.error(e)
    alert('Erro ao excluir lançamento.')
  } finally {
    loading.value = false
  }
}

async function carregarFuncionarios() {
  try {
    const { data } = await api.get('/funcionarios')
    listaFuncionarios.value = data.map(f => ({ label: f.nome, value: f.id }))
  } catch (e) {
    console.error(e)
  }
}
onMounted(async () => {
  // 1. Carrega todas as listas primeiro (Aguardamos todas)
  await Promise.all([
    cat.carregarCategoria('SAÍDA'),
    pag.carregarCategoria('FORMA DE PAGAMENTO FINANCEIRO'),
    sta.carregarCategoria('STATUS FINANCEIRO'),
    carregarFuncionarios()
  ])

  // Se for novo lançamento, para aqui
  if (!isEdit.value) {
    // Sugestão: Definir data de registro padrão como hoje
    form.value.data_registro = new Date().toISOString().slice(0, 10)
    return
  }
  
  // 2. Se for Edição, busca os dados do banco
  try {
    const { data } = await api.get(`/despesas/${id.value}`)
    
    // Usamos o spread para garantir reatividade total
    form.value = { ...data }

    // 3. SINCRONIZAÇÃO CRÍTICA:
    // O SearchInput precisa da CHAVE (value), mas o banco guardou o RÓTULO (categoria)
    const encontrado = cat.opcoes.value.find(o => o.label === data.categoria)
    
    if (encontrado) {
      categoriaSelecionada.value = encontrado.value // Seta a chave no SearchInput (ex: energia_id)
      form.value.classificacao = encontrado.metadata?.info || data.classificacao // Garante a classe
    }

    // 4. Formata as datas para o input HTML (YYYY-MM-DD)
    if (data.data_vencimento) form.value.data_vencimento = data.data_vencimento.slice(0, 10)
    if (data.data_pagamento) form.value.data_pagamento = data.data_pagamento.slice(0, 10)
    if (data.data_registro) form.value.data_registro = data.data_registro.slice(0, 10)
    
  } catch (err) {
    console.error("Erro ao carregar despesa:", err)
  }
})
</script>
