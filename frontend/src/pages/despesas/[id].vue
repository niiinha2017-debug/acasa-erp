<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEdit ? 'Editar Lançamento' : 'Nova Despesa/Vale' }}</h2>
        </div>
        <Button variant="outline" label="Voltar" @click="router.back()" />
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          
          <div class="col-span-3">
            <label class="form-label">Movimentação <span class="required">*</span></label>
            <select v-model="form.tipo_movimento" class="form-input" required>
              <option value="SAÍDA">SAÍDA</option>
              <option value="ENTRADA">ENTRADA</option>
            </select>
          </div>

          <SearchInput 
            v-model="form.funcionario_id" 
            label="Funcionário (Para Vales/Pagamentos)" 
            placeholder="Selecione o funcionário..."
            :options="listaFuncionarios"
            colSpan="col-span-5"
          />

          <Input v-model="form.local" label="Local / Unidade" class="col-span-4" required />

          <SearchInput 
            v-model="form.categoria" 
            label="Item (Ex: Água, Vale, Energia)" 
            :options="cat.opcoes.value"
            :required="true"
            colSpan="col-span-4"
            @update:model-value="vincularClassificacao"
          />

          <Input 
            v-model="form.classificacao" 
            label="Classificação (Auto)" 
            class="col-span-4" 
            readonly 
          />

          <Input v-model="form.valor_total" label="Valor total" type="number" step="0.01" class="col-span-4" required />
          
          <hr class="col-span-12 my-2 border-gray-100" />

          <SearchInput 
            v-model="form.forma_pagamento" 
            label="Forma de Pagamento" 
            :options="pag.opcoes.value"
            :required="true"
            colSpan="col-span-4"
          />

          <Input v-model.number="form.quantidade_parcelas" label="Parcelas" type="number" class="col-span-2" />
          
          <SearchInput 
            v-model="form.status" 
            label="Status" 
            :options="sta.opcoes.value"
            :required="true"
            colSpan="col-span-6"
          />

          <Input v-model="form.data_vencimento" label="Vencimento" type="date" class="col-span-4" required />
          <Input v-model="form.data_pagamento" label="Pagamento" type="date" class="col-span-4" />
          <Input v-model="form.data_registro" label="Registro" type="date" class="col-span-4" />

        </form>
      </div>

      <footer class="card-footer footer-between">
        <Button v-if="isEdit" variant="danger" label="Excluir" @click="excluir" />
        <div v-else></div>
        <Button variant="primary" :label="isEdit ? 'Salvar' : 'Cadastrar'" :loading="loading" @click="salvar" />
      </footer>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useConstantes } from '@/composables/useConstantes'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value && id.value !== 'novo')
const loading = ref(false)

const cat = useConstantes()
const pag = useConstantes()
const sta = useConstantes()
const listaFuncionarios = ref([])

const form = ref({
  tipo_movimento: 'SAÍDA',
  categoria: '',      // Ex: ENERGIA (Item)
  classificacao: '',  // Ex: CUSTO FIXO
  local: '',
  valor_total: '',
  forma_pagamento: '', // Chave: CARTÃO DE CRÉDITO
  quantidade_parcelas: 1,
  funcionario_id: null, //
  data_registro: new Date().toISOString().slice(0, 10),
  data_vencimento: '',
  data_pagamento: '',
  status: ''
})

async function carregarFuncionarios() {
  try {
    const { data } = await api.get('/funcionarios')
    listaFuncionarios.value = data.map(f => ({ label: f.nome, value: f.id }))
  } catch (e) { console.error("Erro ao carregar funcionários") }
}

function vincularClassificacao(itemSelecionado) {
  form.value.categoria = itemSelecionado
  const opt = cat.opcoes.value.find(o => o.value === itemSelecionado)
  if (opt) {
    // No seu model, a "Classificação" é o Custo Fixo/Variável
    form.value.classificacao = opt.label 
  }
}

async function carregarDados() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/despesas/${id.value}`)
    Object.assign(form.value, data)
    // Ajuste de datas para o input
    if (data.data_vencimento) form.value.data_vencimento = data.data_vencimento.slice(0, 10)
    if (data.data_pagamento) form.value.data_pagamento = data.data_pagamento.slice(0, 10)
    if (data.data_registro) form.value.data_registro = data.data_registro.slice(0, 10)
  } catch (e) { alert('Erro ao carregar') }
  finally { loading.value = false }
}

async function salvar() {
  loading.value = true
  try {
    const payload = { ...form.value, valor_total: Number(form.value.valor_total) }
    if (isEdit.value) await api.patch(`/despesas/${id.value}`, payload)
    else await api.post('/despesas', payload)
    router.push('/despesas')
  } catch (e) { alert('Erro ao salvar') }
  finally { loading.value = false }
}

onMounted(async () => {
  await Promise.all([
    cat.carregarCategoria('SAÍDA'),
    pag.carregarCategoria('FORMA DE PAGAMENTO'),
    sta.carregarCategoria('STATUS FINANCEIRO'),
    carregarFuncionarios()
  ])
  carregarDados()
})
</script>

<style scoped>
.required { color: #ef4444; margin-left: 2px; }
.form-label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.4rem; color: #374151; }
.form-input { 
  width: 100%; height: 40px; padding: 0 10px; 
  border: 1px solid #e2e8f0; border-radius: 8px; 
  background-color: white; outline: none;
}
</style>