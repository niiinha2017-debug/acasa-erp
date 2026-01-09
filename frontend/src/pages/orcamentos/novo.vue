<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Novo Orçamento</h2>
          <p class="card-subtitle">
            Selecione o cliente e crie um orçamento (sem financeiro).
          </p>
        </div>

        <Button label="Voltar" variant="outline" @click="router.push('/orcamentos')" />
      </header>

      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-6">
            <SearchInput
              v-model="clienteSelecionado"
              label="Cliente"
              placeholder="Digite e selecione..."
              :options="clientesOptions"
              required
            />
          </div>

          <div class="col-span-12">
            <div class="actions-bar">
              <Button
                label="Criar orçamento"
                variant="primary"
                :loading="loading"
                loadingText="Criando..."
                :disabled="!clienteSelecionado?.value"
                @click="criar"
              />
            </div>
          </div>

          <div v-if="erro" class="col-span-12">
            <p class="form-error">{{ erro }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'


const router = useRouter()

const loading = ref(false)
const erro = ref('')

const clientes = ref([])
const clienteSelecionado = ref(null)

const clientesOptions = computed(() =>
  (clientes.value || []).map((c) => ({
    value: c.id,
    label: c.nome_completo,
  })),
)

async function carregarClientes() {
  // Ajuste essa rota se o seu backend usa outro endpoint.
  // Eu não vou inventar: se a sua rota não for /clientes, me fala que eu troco.
  const { data } = await api.get('/clientes')
  clientes.value = data || []
}

async function criar() {
  erro.value = ''
  loading.value = true
  try {
    const payload = { cliente_id: Number(clienteSelecionado.value.value) }
    const { data } = await api.post('/orcamentos', payload)
    router.push(`/orcamentos/${data.id}`)
  } catch (e) {
    erro.value = 'Não foi possível criar o orçamento.'
  } finally {
    loading.value = false
  }
}

onMounted(carregarClientes)
</script>
