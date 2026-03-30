<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { notify } from '@/services/notify'

definePage({ meta: { title: 'Cadastro de Veículo', perm: 'automoveis.read' } })

const route = useRoute()
const router = useRouter()
const salvando = ref(false)
const carregando = ref(false)

const combustiveis = [
  { label: 'Gasolina', value: 'GASOLINA' },
  { label: 'Etanol', value: 'ETANOL' },
  { label: 'Flex', value: 'FLEX' },
  { label: 'Diesel', value: 'DIESEL' },
  { label: 'Elétrico', value: 'ELÉTRICO' },
]
const statusOptions = [
  { label: 'Ativo', value: 'ATIVO' },
  { label: 'Inativo', value: 'INATIVO' },
  { label: 'Manutenção', value: 'MANUTENCAO' },
]

const form = ref(novoForm())
const automovelId = computed(() => {
  const raw = Number(route.query?.id || 0)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})
const isEditing = computed(() => automovelId.value != null)
const pageTitle = computed(() => (isEditing.value ? 'Editar Automóvel' : 'Cadastrar Automóvel'))
const pageSubtitle = computed(() => (
  isEditing.value
    ? 'Atualize os dados do veículo e o custo operacional por quilômetro'
    : 'Cadastre um veículo da frota e o custo operacional por quilômetro'
))

function novoForm() {
  return {
    placa: '',
    descricao: '',
    marca: '',
    modelo: '',
    ano: null,
    cor: '',
    renavam: '',
    chassi: '',
    combustivel: 'FLEX',
    custo_km: null,
    observacoes: '',
    status: 'ATIVO',
  }
}

async function carregarAutomovel() {
  if (!automovelId.value) {
    form.value = novoForm()
    return
  }

  carregando.value = true
  try {
    const { data } = await api.get(`/automoveis/${automovelId.value}`)
    form.value = {
      ...novoForm(),
      ...data,
      ano: data?.ano ?? null,
      custo_km: data?.custo_km != null ? Number(data.custo_km) : null,
    }
  } catch (error) {
    console.error(error)
    notify.error('Não foi possível carregar o automóvel.')
    router.push('/automoveis')
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  if (!form.value.placa || !form.value.descricao) return
  salvando.value = true
  try {
    if (isEditing.value) {
      await api.patch(`/automoveis/${automovelId.value}`, form.value)
      notify.success('Automóvel atualizado com sucesso.')
    } else {
      await api.post('/automoveis', form.value)
      notify.success('Automóvel cadastrado com sucesso.')
    }
    router.push('/automoveis')
  } catch (error) {
    console.error(error)
    notify.error(error?.response?.data?.message || 'Não foi possível salvar o automóvel.')
  } finally {
    salvando.value = false
  }
}

function voltar() {
  router.push('/automoveis')
}

watch(() => route.query?.id, carregarAutomovel)
onMounted(carregarAutomovel)
</script>

<template>
  <PageShell :padded="false" variant="minimal">
    <section class="automoveis-cadastro ds-page-context ds-page-context--form animate-page-in">
      <PageHeader
        :title="pageTitle"
        :subtitle="pageSubtitle"
        icon="pi pi-car"
        variant="minimal"
      >
        <template #actions>
          <Button variant="secondary" @click="voltar">
            <i class="pi pi-arrow-left"></i>
            Voltar para Lista
          </Button>
        </template>
      </PageHeader>

      <div class="automoveis-form-body ds-editor-body">
        <div class="automoveis-form-shell">
          <div v-if="carregando" class="automoveis-form-card__loading">
            Carregando dados do automóvel...
          </div>

          <form v-else class="automoveis-form ds-editor-form space-y-12" @submit.prevent="salvar" autocomplete="off">
            <div class="section-divider ds-section-divider relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dados do Veículo
                </span>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-x-6 gap-y-7">
              <Input
                variant="line"
                class="col-span-12 md:col-span-3"
                v-model="form.placa"
                label="Placa *"
                placeholder="ABC-1D23"
                maxlength="8"
                required
                force-upper
              />

              <Input
                variant="line"
                class="col-span-12 md:col-span-9"
                v-model="form.descricao"
                label="Descrição *"
                placeholder="Ex.: Fiat Doblo Cargo 2021 - Branco"
                required
                force-upper
              />

              <Input
                variant="line"
                class="col-span-12 md:col-span-3"
                v-model="form.marca"
                label="Marca"
                placeholder="Ex.: Fiat"
                force-upper
              />

              <Input
                variant="line"
                class="col-span-12 md:col-span-4"
                v-model="form.modelo"
                label="Modelo"
                placeholder="Ex.: Doblo Cargo"
                force-upper
              />

              <Input
                variant="line"
                class="col-span-12 md:col-span-2"
                v-model.number="form.ano"
                label="Ano"
                type="number"
                placeholder="2021"
              />

              <Input
                variant="line"
                class="col-span-12 md:col-span-3"
                v-model="form.cor"
                label="Cor"
                placeholder="Branco"
                force-upper
              />
            </div>

            <div class="section-divider ds-section-divider relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Operação
                </span>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-x-6 gap-y-7">
              <div class="col-span-12 md:col-span-4">
                <SearchInput
                  v-model="form.combustivel"
                  mode="select"
                  variant="line"
                  hide-search-icon
                  label="Combustível"
                  placeholder="Selecione o combustível"
                  :options="combustiveis"
                  labelKey="label"
                  valueKey="value"
                />
              </div>

              <Input
                variant="line"
                class="col-span-12 md:col-span-4"
                v-model.number="form.custo_km"
                label="Custo R$/km"
                type="number"
                placeholder="0,8000"
              />

              <div class="col-span-12 md:col-span-4">
                <SearchInput
                  v-model="form.status"
                  mode="select"
                  variant="line"
                  hide-search-icon
                  label="Status"
                  placeholder="Selecione o status"
                  :options="statusOptions"
                  labelKey="label"
                  valueKey="value"
                />
              </div>
            </div>

            <div class="section-divider ds-section-divider relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Identificação
                </span>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-x-6 gap-y-7">
              <Input
                variant="line"
                class="col-span-12 md:col-span-6"
                v-model="form.renavam"
                label="RENAVAM"
                placeholder="Opcional"
                force-upper
              />

              <Input
                variant="line"
                class="col-span-12 md:col-span-6"
                v-model="form.chassi"
                label="Chassi"
                placeholder="Opcional"
                force-upper
              />

              <div class="col-span-12">
                <Input
                  variant="line"
                  v-model="form.observacoes"
                  label="Observações"
                  placeholder="Observações sobre o veículo..."
                  :force-upper="false"
                />
              </div>
            </div>

            <div class="pt-10 mt-6 border-t border-border-ui">
              <div class="automoveis-form__actions ds-editor-actions flex items-center gap-4 justify-end">
                <div class="automoveis-form__actions-main ds-editor-actions-main flex items-center gap-3 justify-end">
                  <Button variant="secondary" type="button" @click="voltar">
                    Cancelar
                  </Button>

                  <Button variant="primary" type="submit" :loading="salvando">
                    <i class="pi pi-save mr-2 text-[12px]"></i>
                    {{ isEditing ? 'Salvar Alterações' : 'Cadastrar Veículo' }}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<style scoped>
.automoveis-cadastro {
  min-height: 100%;
}

.automoveis-form-body {
  padding: 1.5rem 1rem 2rem;
}

.automoveis-form-shell {
  width: 100%;
}

.automoveis-form-card__loading {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-muted);
}

.automoveis-form {
  width: 100%;
}

@media (max-width: 720px) {
  .automoveis-form-body {
    padding: 1rem 1rem 2rem;
  }

  .automoveis-form__actions,
  .automoveis-form__actions-main {
    width: 100%;
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
