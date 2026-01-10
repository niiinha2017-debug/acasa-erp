<template>
  <Transition name="fade">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-card">
        <header class="modal-header">
          <div>
            <h3 class="modal-title">Cadastrar item</h3>
            <p class="modal-subtitle">Item não encontrado. Cadastre rapidamente.</p>
          </div>
          <button class="modal-x" @click="emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group col-span-6">
              <Input v-model="form.nome" label="Nome" placeholder="Ex: MDF" :required="true" />
            </div>

            <div class="form-group col-span-3">
              <Input v-model="form.cor" label="Cor" placeholder="Ex: Branco" />
            </div>

            <div class="form-group col-span-3">
              <Input v-model="form.medida" label="Medida" placeholder="Ex: 18mm" />
            </div>

            <div class="form-group col-span-3">
              <Input v-model="form.unidade" label="Unidade" placeholder="METRO / UN" :required="true" />
            </div>

            <div class="form-group col-span-9 flex items-center h-full pt-6">
               <CustomCheckbox
                label="Item Ativo"
                :model-value="form.status === 'ATIVO'"
                @update:model-value="(val) => form.status = val ? 'ATIVO' : 'INATIVO'"
              />
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <Button label="Cancelar" variant="outline" @click="emit('close')" />
          <Button
            label="Salvar item"
            variant="success"
            :loading="salvando"
            @click="salvar"
          />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import api from '@/services/api'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue' // Importando o novo padrão

const props = defineProps({
  open: { type: Boolean, default: false },
  textoInicial: { type: String, default: '' },
  endpoint: { type: String, default: '/plano-corte-item' },
})

const emit = defineEmits(['close', 'created'])
const salvando = ref(false)

const form = reactive({
  nome: '',
  cor: '',
  medida: '',
  unidade: 'METRO',
  status: 'ATIVO',
})

watch(() => props.open, (v) => {
  if (!v) return
  form.nome = props.textoInicial || ''
  form.cor = ''
  form.medida = ''
  form.unidade = 'METRO'
  form.status = 'ATIVO'
})

async function salvar() {
  if (!form.nome?.trim()) return alert('Informe o nome.')
  
  salvando.value = true
  try {
    const payload = { ...form, nome: form.nome.trim() }
    const { data } = await api.post(props.endpoint, payload)
    emit('created', data)
    emit('close')
  } catch (error) {
    alert('Erro ao salvar item.')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.modal-overlay{
  position:fixed; inset:0;
  background: rgba(0,0,0,.45);
  display:flex; align-items:center; justify-content:center;
  padding: 18px;
  z-index: 50;
}

.modal-card{
  width: 100%;
  max-width: 760px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.modal-header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--bg-input);
}

.modal-title{ margin:0; font-size: 1.05rem; }
.modal-subtitle{ margin: 4px 0 0; color: var(--text-muted); font-size: var(--font-size-sm); }

.modal-x{
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-secondary);
}

.modal-body{ padding: 16px 18px; }

.modal-footer{
  display:flex;
  justify-content:flex-end;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--border-soft);
  background: var(--bg-input);
}
</style>
