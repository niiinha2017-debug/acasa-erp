<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isNovo ? 'Nova Constante' : 'Editar Constante' }}</h2>
          <p class="cell-muted">
            {{ isNovo ? 'Configure um novo parâmetro global para o sistema.' : 'Atualize as definições desta constante.' }}
          </p>
        </div>

        <div class="flex-gap-2">
          <Button
            v-if="!isNovo"
            variant="danger"
            size="sm"
            type="button"
            :disabled="loading"
            @click="excluir"
          >
            Excluir
          </Button>
        </div>
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          <Input
            v-model="form.categoria"
            label="Categoria *"
            placeholder="Ex: STATUS_PRODUCAO"
            required
            class="col-span-4"
            @input="form.categoria = form.categoria.toUpperCase()"
          />

          <Input
            v-model="form.chave"
            label="Chave (ID Interno) *"
            placeholder="Ex: EM_ATRASO"
            required
            class="col-span-4"
            @input="form.chave = form.chave.toUpperCase()"
          />

          <Input
            v-model="form.rotulo"
            label="Rótulo (Nome de Exibição) *"
            placeholder="Ex: Em Atraso"
            required
            class="col-span-4"
          />

          <div class="form-group col-span-4">
            <label class="form-label">Tipo de Dado <span class="required">*</span></label>
            <select v-model="form.tipo" class="form-input" required>
              <option value="TEXTO">TEXTO (Cores, Descrições)</option>
              <option value="NUMERO">NÚMERO (Taxas, Prazos)</option>
              <option value="BOOLEANO">BOOLEANO (Sim/Não)</option>
              <option value="JSON">JSON (Configurações Complexas)</option>
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

          <transition name="fade">
            <div class="col-span-12 form-grid" style="margin: 0; padding: 0;">
              
              <Input
                v-if="form.tipo === 'TEXTO'"
                v-model="form.valor_texto"
                :label="form.categoria.includes('STATUS') ? 'Cor do Badge (Hexadecimal)' : 'Valor em Texto'"
                placeholder="Ex: #FF0000 ou Observação"
                class="col-span-12"
              />

              <Input
                v-if="form.tipo === 'NUMERO'"
                v-model.number="form.valor_numero"
                :label="form.categoria.includes('PAGAMENTO') ? 'Taxa da Operadora (%)' : 'Valor Numérico'"
                type="number"
                step="0.01"
                placeholder="Ex: 3.50"
                class="col-span-6"
              />

              <div v-if="form.tipo === 'BOOLEANO'" class="form-group col-span-6">
                <label class="form-label">Valor Booleano</label>
                <select v-model="form.valor_booleano" class="form-input">
                  <option :value="true">Verdadeiro (True)</option>
                  <option :value="false">Falso (False)</option>
                </select>
              </div>

              <div v-if="form.tipo === 'JSON'" class="form-group col-span-12">
                <label class="form-label">Configuração JSON</label>
                <textarea
                  v-model="valorJsonTexto"
                  class="form-input code-font"
                  rows="5"
                  placeholder='{"key": "value"}'
                ></textarea>
              </div>
            </div>
          </transition>

          <div class="col-span-12 flex-end gap-2 mt-4">
            <Button variant="outline" type="button" @click="router.push('/constantes')">
              Cancelar
            </Button>

            <Button type="submit" :loading="loading">
              {{ isNovo ? 'Criar Constante' : 'Salvar Alterações' }}
            </Button>
          </div>

          <p v-if="erro" class="col-span-12 error-message">{{ erro }}</p>
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
const valorJsonTexto = ref('')

const isNovo = computed(() => route.params.id === 'novo')
const id = computed(() => isNovo.value ? null : route.params.id)

const form = ref({
  categoria: '',
  chave: '',
  rotulo: '',
  tipo: 'TEXTO',
  valor_texto: '',
  valor_numero: null,
  valor_booleano: true,
  ordem: 0,
  ativo: true
})

// PAYLOAD LIMPO: Envia apenas o que o banco espera baseado no tipo
const gerarPayload = () => {
  const p = { ...form.value }
  
  // Reseta campos que não pertencem ao tipo selecionado para evitar lixo no banco
  if (p.tipo !== 'TEXTO') p.valor_texto = null
  if (p.tipo !== 'NUMERO') p.valor_numero = null
  if (p.tipo !== 'BOOLEANO') p.valor_booleano = null
  
  if (p.tipo === 'JSON') {
    try {
      p.valor_json = valorJsonTexto.value ? JSON.parse(valorJsonTexto.value) : null
    } catch (e) {
      throw new Error('O formato JSON é inválido.')
    }
  } else {
    p.valor_json = null
  }
  
  return p
}

async function carregar() {
  if (isNovo.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/constantes/${id.value}`)
    Object.assign(form.value, data)
    if (data.valor_json) valorJsonTexto.value = JSON.stringify(data.valor_json, null, 2)
  } catch (e) {
    erro.value = 'Erro ao carregar dados.'
  } finally {
    loading.value = false
  }
}

async function salvar() {
  erro.value = ''
  loading.value = true
  try {
    const payload = gerarPayload()
    if (isNovo.value) {
      await api.post('/constantes', payload)
    } else {
      await api.patch(`/constantes/${id.value}`, payload)
    }
    router.push('/constantes')
  } catch (e) {
    erro.value = e.message || 'Erro ao processar requisição.'
  } finally {
    loading.value = false
  }
}

async function excluir() {
  if (!confirm('Tem certeza que deseja remover esta constante?')) return
  try {
    await api.delete(`/constantes/${id.value}`)
    router.push('/constantes')
  } catch (e) {
    alert('Erro ao excluir.')
  }
}

onMounted(carregar)
</script>

<style scoped>
.code-font {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  background: #f8fafc;
}
.flex-gap-2 { display: flex; gap: 8px; }
.flex-end { display: flex; justify-content: flex-end; }
.error-message { color: var(--danger); font-size: 13px; margin-top: 10px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>