<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEdit ? 'Editar Constante' : 'Nova Constante' }}</h2>
          <p class="cell-muted">Gerencie os parâmetros globais do sistema.</p>
        </div>

        <div class="flex-gap-2">
          <Button
            v-if="isEdit"
            variant="danger"
            size="sm"
            type="button"
            @click="excluir"
          >
            Excluir
          </Button>
          <Button variant="outline" size="sm" @click="router.push('/constantes')">Voltar</Button>
        </div>
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          <Input
            v-model="form.categoria"
            label="Categoria *"
            placeholder="Ex: STATUS_FINANCEIRO"
            required
            class="col-span-4"
            @input="form.categoria = form.categoria.toUpperCase()"
          />

          <Input
            v-model="form.chave"
            label="Chave (ID Interno) *"
            placeholder="Ex: PAGO"
            required
            class="col-span-4"
            @input="form.chave = form.chave.toUpperCase()"
          />

          <Input
            v-model="form.rotulo"
            label="Rótulo (Exibição) *"
            placeholder="Ex: Pago"
            required
            class="col-span-4"
          />

          <div class="form-group col-span-4">
            <label class="form-label">Tipo de Dado <span class="required">*</span></label>
            <select v-model="form.tipo" class="form-input" required>
              <option value="TEXTO">TEXTO (Cores, Descrições)</option>
              <option value="NUMERO">NÚMERO (Taxas, Prazos)</option>
            </select>
          </div>

          <Input
            v-model.number="form.ordem"
            label="Ordem de Exibição"
            type="number"
            class="col-span-4"
          />

          <div class="form-group col-span-4">
            <label class="form-label">Status</label>
            <select v-model="form.ativo" class="form-input">
              <option :value="true">Ativo</option>
              <option :value="false">Inativo</option>
            </select>
          </div>

          <div class="col-span-12">
            <Input
              v-if="form.tipo === 'TEXTO'"
              v-model="form.valor_texto"
              :label="form.categoria.includes('STATUS') ? 'Cor do Badge (Hex)' : 'Valor em Texto'"
              placeholder="Ex: #3b82f6"
              class="col-span-12"
            />

            <Input
              v-if="form.tipo === 'NUMERO'"
              v-model.number="form.valor_numero"
              :label="form.categoria.includes('PAGAMENTO') ? 'Taxa (%)' : 'Valor Numérico'"
              type="number"
              step="0.0001"
              placeholder="Ex: 2.99"
              class="col-span-6"
            />
          </div>

          <div class="col-span-12 flex-end gap-2 mt-4">
            <Button variant="outline" type="button" @click="router.push('/constantes')">
              Cancelar
            </Button>
            <Button type="submit" :loading="loading" variant="primary">
              {{ isEdit ? 'Salvar Alterações' : 'Criar Constante' }}
            </Button>
          </div>

          <p v-if="erro" class="col-span-12 error-message text-center">{{ erro }}</p>
        </form>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const erro = ref('')

const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value && id.value !== 'novo')

const form = ref({
  categoria: '',
  chave: '',
  rotulo: '',
  tipo: 'TEXTO',
  valor_texto: '',
  valor_numero: null,
  ordem: 0,
  ativo: true
})

const salvar = async () => {
  erro.value = ''
  loading.value = true
  
  try {
    const payload = {
      categoria: form.value.categoria,
      chave: form.value.chave,
      rotulo: form.value.rotulo,
      ordem: Number(form.value.ordem) || 0,
      ativo: form.value.ativo,
      // Envia apenas o campo que o banco possui
      valor_texto: form.value.tipo === 'TEXTO' ? form.value.valor_texto : null,
      valor_numero: form.value.tipo === 'NUMERO' ? Number(form.value.valor_numero) : null
    }

    if (isEdit.value) {
      await api.patch(`/constantes/${id.value}`, payload)
    } else {
      await api.post('/constantes', payload)
    }
    router.push('/constantes')
  } catch (e) {
    erro.value = e.response?.data?.message || 'Erro ao salvar constante.'
  } finally {
    loading.value = false
  }
}

const carregarDados = async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/constantes/${id.value}`)
    
    // Define o tipo visual baseado no que veio preenchido
    data.tipo = data.valor_numero !== null ? 'NUMERO' : 'TEXTO'
    
    Object.assign(form.value, data)
  } catch (e) {
    erro.value = 'Erro ao carregar dados.'
  } finally {
    loading.value = false
  }
}

const excluir = async () => {
  if (!confirm('Excluir esta constante?')) return
  try {
    await api.delete(`/constantes/${id.value}`)
    router.push('/constantes')
  } catch (e) { erro.value = 'Erro ao excluir.' }
}

onMounted(carregarDados)
</script>

<style scoped>
.flex-gap-2 { display: flex; gap: 8px; }
.flex-end { display: flex; justify-content: flex-end; }
.error-message { color: #ef4444; margin-top: 10px; }
</style>