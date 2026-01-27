<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-2xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-[1.1rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <i class="pi pi-box text-lg"></i>
              </div>

              <div>
                <h3 class="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                  Cadastrar Produto
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Ficha Técnica do Item
                  </p>
                </div>
              </div>
            </div>

            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
              @click="emit('close')"
              type="button"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <!-- Body -->
          <div class="p-6 overflow-y-auto">
            <div class="grid grid-cols-12 gap-x-6 gap-y-6">
              <div class="col-span-12 md:col-span-7">
                <Input
                  v-model="form.nome_produto"
                  label="Nome do Produto"
                  placeholder="EX: MDF CRU OU DOBRADIÇA"
                  required
                />
              </div>

              <div class="col-span-12 md:col-span-5">
                <Input v-model="form.marca" label="Marca / Fabricante" placeholder="EX: DURATEX" />
              </div>

              <div class="col-span-12 md:col-span-4">
                <Input v-model="form.cor" label="Cor / Acabamento" placeholder="EX: BRANCO TX" />
              </div>

              <div class="col-span-12 md:col-span-4">
                <Input v-model="form.medida" label="Espessura" placeholder="EX: 18MM" />
              </div>

              <div class="col-span-12 md:col-span-4">
                <SearchInput
                  v-model="form.unidade"
                  mode="select"
                  label="Unidade Medida"
                  :options="unidadesOptions"
                  placeholder="SELECIONE..."
                  required
                />
              </div>

              <div class="col-span-12 md:col-span-6">
                <div class="relative">
                  <Input
                    v-model="form.valor_unitario_mask"
                    label="Valor de Custo (UN)"
                    placeholder="0,00"
                    @input="form.valor_unitario_mask = maskMoneyBR(form.valor_unitario_mask)"
                  />
                  <span class="absolute right-4 bottom-4 text-[10px] font-black text-slate-300">BRL</span>
                </div>
              </div>

              <div class="col-span-12 md:col-span-6">
                <div class="h-full flex items-end">
                  <div class="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100/60">
                    <CustomCheckbox
                      label="Disponibilidade Ativa"
                      description="HABILITAR ESTE PRODUTO PARA NOVOS PEDIDOS DE COMPRA"
                      :model-value="form.status === 'ATIVO'"
                      @update:model-value="(val) => (form.status = val ? 'ATIVO' : 'INATIVO')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <footer class="flex items-center justify-end gap-4 px-6 py-5 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              @click="emit('close')"
              class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <Button
              type="button"
              variant="primary"
              class="!h-12 !rounded-[1.2rem] !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest"
              :loading="salvando"
              @click="salvar"
            >
              <i class="pi pi-check-circle mr-3"></i> Salvar Produto
            </Button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Estilização extra para manter o padrão uppercase nos inputs caso os componentes base permitam */
:deep(input) {
  text-transform: uppercase;
}
:deep(input::placeholder) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 9px;
  font-weight: 700;
}
</style>

<script setup>
import { reactive, ref, watch, onMounted, onUnmounted, computed } from 'vue' // Adicionado computed
import { ProdutosService } from '@/services/index'
import { notify } from '@/services/notify'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes/unidades'

const props = defineProps({
  open: { type: Boolean, default: false },
  textoInicial: { type: String, default: '' },
  fornecedorId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'created'])
const salvando = ref(false)

const form = reactive({
  nome_produto: '',
  cor: '',
  medida: '',
  unidade: 'METRO',
  marca: '',
  valor_unitario_mask: '0,00',
  status: 'ATIVO',
})

// Corrigido: Estava faltando o import do computed e a lógica está protegida contra arrays nulos
const unidadesOptions = computed(() =>
  (Array.isArray(UNIDADES) ? UNIDADES : []).map((u) => ({ value: u.key, label: u.label })),
)

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => window.removeEventListener('keydown', handleEsc))

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  
  Object.assign(form, {
    nome_produto: props.textoInicial || '',
    cor: '',
    medida: '',
    unidade: 'METRO',
    marca: '',
    valor_unitario_mask: '0,00',
    status: 'ATIVO',
  })
})

async function salvar() {
  console.log('[MODAL PRODUTO] fornecedorId:', props.fornecedorId)
  console.log('[MODAL PRODUTO] form:', JSON.parse(JSON.stringify(form)))

  if (!props.fornecedorId) {
    notify.warn('Selecione um fornecedor antes.')
    return
  }
  if (!form.nome_produto?.trim()) {
    notify.warn('Informe o nome do produto.')
    return
  }

  const valorRaw = String(form.valor_unitario_mask || '').replace(/\D/g, '')
  const valorNum = Number(valorRaw) / 100

  const payload = {
    fornecedor_id: props.fornecedorId,
    nome_produto: form.nome_produto.trim(),
    cor: form.cor || null,
    medida: form.medida || null,
    unidade: form.unidade || 'METRO',
    marca: form.marca || null,
    valor_unitario: isNaN(valorNum) ? 0 : valorNum,
    status: form.status,
  }

  console.log('[MODAL PRODUTO] payload:', payload)

  salvando.value = true
  try {
    const res = await ProdutosService.salvar(null, payload) // ou undefined

    console.log('[MODAL PRODUTO] res:', res)

    emit('created', res?.data || res)
    emit('close')
    notify.success('Produto cadastrado!')
  } catch (error) {
    console.log('[MODAL PRODUTO] erro:', error)
    notify.error(error?.response?.data?.message || 'Erro ao salvar produto.')
  } finally {
    salvando.value = false
  }
}

</script>