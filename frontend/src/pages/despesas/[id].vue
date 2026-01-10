<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEdit ? 'Editar Despesa' : 'Nova Despesa' }}</h2>
          <p class="card-subtitle">{{ isEdit ? 'Atualize os dados do lançamento.' : 'Preencha os dados para novo registro.' }}</p>
        </div>
        <Button variant="outline" label="Voltar" @click="router.back()" />
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          
          <div class="col-span-3">
            <label class="form-label">Entrada / Saída <span class="required">*</span></label>
            <select v-model="form.tipo_movimento" class="form-input" required>
              <option value="SAÍDA">SAÍDA</option>
              <option value="ENTRADA">ENTRADA</option>
            </select>
          </div>

          <SearchInput 
            v-model="form.classificacao" 
            label="Classificação (Rótulo)" 
            placeholder="Ex: Combustível, Salário..."
            :options="cat.opcoes.value"
            :required="true"
            colSpan="col-span-3"
            @update:model-value="vincularChaveCategoria"
          />

          <Input 
            v-model="form.categoria" 
            label="Chave (Auto)" 
            class="col-span-3" 
            readonly 
          />
          
          <Input v-model="form.local" label="Local / Fornecedor" class="col-span-3" required />

          <hr class="col-span-12 my-4" />

          <Input v-model="form.valor_total" label="Valor total" type="number" step="0.01" class="col-span-3" required />
          
          <SearchInput 
            v-model="form.forma_pagamento" 
            label="Forma de Pagamento" 
            placeholder="Pesquisar pagamento..."
            :options="pag.opcoes.value"
            :required="true"
            colSpan="col-span-3"
          />

          <Input v-model.number="form.quantidade_parcelas" label="Qtd. parcelas" type="number" class="col-span-3" />
          
          <SearchInput 
            v-model="form.status" 
            label="Status Financeiro" 
            placeholder="Pesquisar status..."
            :options="sta.opcoes.value"
            :required="true"
            colSpan="col-span-3"
          />

          <Input v-model="form.data_vencimento" label="Data de vencimento" type="date" class="col-span-4" required />
          <Input v-model="form.data_pagamento" label="Data de pagamento" type="date" class="col-span-4" />
          <Input v-model="form.data_registro" label="Data do registro" type="date" class="col-span-4" />

          <div v-if="erro" class="col-span-12 mt-2">
            <p class="text-danger text-sm">{{ erro }}</p>
          </div>
        </form>
      </div>

      <footer class="card-footer footer-between">
        <Button v-if="isEdit" variant="danger" label="Excluir" :loading="loading" @click="excluir" />
        <div v-else></div>
        
        <Button variant="primary" :label="isEdit ? 'Salvar Alterações' : 'Cadastrar'" :loading="loading" @click="salvar" />
      </footer>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useConstantes } from '@/composables/useConstantes'

// Componentes UI
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue' // Seu componente de busca

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value)
const loading = ref(false)
const erro = ref('')

// Composables para as listas
const cat = useConstantes()
const pag = useConstantes()
const sta = useConstantes()

const form = ref({
  tipo_movimento: 'SAÍDA',
  categoria: '',      // Chave (Ex: CUSTO VARIAVEL)
  classificacao: '',  // Rótulo (Ex: Combustível)
  local: '',
  valor_total: '',
  forma_pagamento: '',
  quantidade_parcelas: 1,
  data_registro: new Date().toISOString().slice(0, 10),
  data_vencimento: '',
  data_pagamento: '',
  status: ''
})

/**
 * Lógica para preencher a Chave Pai automaticamente
 * disparada quando o SearchInput de classificação muda.
 */
function vincularChaveCategoria(valorSelecionado) {
  // Como o SearchInput emite o 'value', e no seu useConstantes 
  // você definiu: label: item.rotulo e value: item.chave
  // O valorSelecionado já é a CHAVE (ex: CUSTO VARIAVEL)
  form.value.categoria = valorSelecionado

  // Opcional: Se você quiser que o SearchInput mostre o Rótulo mas salve a Chave,
  // seu componente já faz isso através do watch interno.
}

async function carregarDados() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/despesas/${id.value}`)
    form.value = { ...data }
    // Limpeza de datas
    if (data.data_vencimento) form.value.data_vencimento = data.data_vencimento.slice(0, 10)
    if (data.data_pagamento) form.value.data_pagamento = data.data_pagamento.slice(0, 10)
    if (data.data_registro) form.value.data_registro = data.data_registro.slice(0, 10)
  } catch (e) {
    erro.value = 'Não foi possível carregar os dados.'
  } finally {
    loading.value = false
  }
}

async function salvar() {
  erro.value = ''
  loading.value = true
  try {
    if (isEdit.value) {
      await api.patch(`/despesas/${id.value}`, form.value)
    } else {
      await api.post('/despesas', form.value)
    }
    router.push('/despesas')
  } catch (e) {
    erro.value = e.response?.data?.message || 'Erro ao salvar despesa.'
  } finally {
    loading.value = false
  }
}

async function excluir() {
  if (!confirm('Deseja excluir este registro?')) return
  loading.value = true
  try {
    await api.delete(`/despesas/${id.value}`)
    router.push('/despesas')
  } catch (e) {
    erro.value = 'Erro ao excluir.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Carrega as opções dos campos de busca
  await Promise.all([
    cat.carregarCategoria('SAÍDA'),
    pag.carregarCategoria('FORMA DE PAGAMENTO'),
    sta.carregarCategoria('STATUS FINANCEIRO') // Carrega conforme imagem
  ])
  
  if (isEdit.value) await carregarDados()
})
</script>

<style scoped>
.required { color: #ef4444; margin-left: 2px; }
.form-label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
.form-input { 
  width: 100%; height: 40px; padding: 0 10px; 
  border: 1px solid #e2e8f0; border-radius: 8px; 
}
</style>