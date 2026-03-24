<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden ds-card ds-card--default">
      <PageHeader
        title="Orçamento Técnico — Importar da medição"
        :subtitle="breadcrumb"
        icon="pi pi-file-edit"
        class="border-b border-border-ui"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push('/totem-fabrica')">
            <i class="pi pi-arrow-left mr-2" />
            Voltar
          </Button>
        </template>
      </PageHeader>

      <div class="p-4 md:p-6 border-t border-border-ui bg-bg-page">
        <Loading v-if="loading" />
        <template v-else-if="erroCarregamento">
          <div class="py-8 text-center">
            <p class="font-medium text-rose-500">{{ erroCarregamento }}</p>
            <router-link to="/totem-fabrica" class="inline-block mt-3 text-sm text-brand-primary font-medium">Voltar ao Totem</router-link>
          </div>
        </template>
        <template v-else-if="!medicao || (medicao.ambientes && medicao.ambientes.length === 0)">
          <div class="py-8 text-center text-text-soft">
            <p>Nenhum ambiente medido encontrado para este agendamento.</p>
            <p class="mt-2 text-sm">Conclua a medição por ambiente na página de medição e tente novamente.</p>
            <router-link to="/totem-fabrica" class="inline-block mt-4 text-brand-primary font-medium">Voltar ao Totem</router-link>
          </div>
        </template>
        <template v-else>
          <p class="text-sm text-text-soft mb-4">
            Selecione os ambientes medidos que deseja converter em itens do orçamento técnico. Os itens serão salvos em tabela independente (não altera o orçamento antigo).
          </p>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="amb in medicao.ambientes"
              :key="amb.id"
              class="flex cursor-pointer rounded-xl border-2 transition overflow-hidden"
              :class="ambientesSelecionados.includes(amb.id) ? 'border-brand-primary bg-brand-primary/5' : 'border-border-ui bg-bg-card hover:border-border-ui/60'"
            >
              <input
                v-model="ambientesSelecionados"
                type="checkbox"
                :value="amb.id"
                class="sr-only"
              />
              <div class="flex-1 p-4 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-box text-brand-primary text-lg" />
                  <span class="font-semibold text-text-main">{{ amb.nome_ambiente }}</span>
                </div>
                <ul class="text-xs text-text-soft space-y-1">
                  <li v-for="p in (amb.paredes || [])" :key="p.id" class="flex items-center gap-1.5">
                    <i class="pi pi-minus text-[10px]" />
                    {{ p.nome }}
                    <span v-if="p.largura_m != null || p.pe_direito_m != null" class="opacity-80">
                      — {{ resumoParede(p) }}
                    </span>
                  </li>
                </ul>
                <p v-if="!(amb.paredes && amb.paredes.length)" class="text-xs text-text-soft italic">Sem paredes cadastradas</p>
              </div>
            </label>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              class="!rounded-xl"
              :disabled="ambientesSelecionados.length === 0 || salvando"
              :loading="salvando"
              @click="gerarOrcamento"
            >
              <i v-if="!salvando" class="pi pi-check mr-2" />
              Converter em orçamento técnico ({{ ambientesSelecionados.length }} ambiente(s))
            </Button>
            <button
              type="button"
              class="text-sm text-text-soft hover:text-brand-primary"
              @click="ambientesSelecionados = medicao.ambientes.map((a) => a.id)"
            >
              Selecionar todos
            </button>
            <button
              type="button"
              class="text-sm text-text-soft hover:text-brand-primary"
              @click="ambientesSelecionados = []"
            >
              Limpar
            </button>
          </div>

          <p v-if="sucesso" class="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Orçamento técnico criado com sucesso. Os itens foram salvos na tabela independente.
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TotemFabricaService, OrcamentoTecnicoService } from '@/services'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const route = useRoute()
const router = useRouter()
const agendamentoId = computed(() => Number(String(route.params?.agendamentoId || '').replace(/\D/g, '')) || null)

const loading = ref(true)
const salvando = ref(false)
const sucesso = ref(false)
const erroCarregamento = ref('')
const medicao = ref(null)
const ambientesSelecionados = ref([])

const breadcrumb = computed(() =>
  agendamentoId.value ? `Agendamento #${agendamentoId.value}` : 'Orçamento técnico'
)

function resumoParede(p) {
  const parts = []
  if (p.largura_m != null) parts.push(`${Math.round(Number(p.largura_m) * 1000)}mm`)
  if (p.pe_direito_m != null) parts.push(`${Math.round(Number(p.pe_direito_m) * 1000)}mm`)
  if (p.profundidade_m != null) parts.push(`${Math.round(Number(p.profundidade_m) * 1000)}mm`)
  return parts.join(' × ') || '—'
}

async function carregar() {
  if (!agendamentoId.value) {
    erroCarregamento.value = 'ID do agendamento não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  sucesso.value = false
  try {
    const res = await TotemFabricaService.getMedicaoOrcamento(agendamentoId.value)
    medicao.value = res?.data ?? res ?? null
    if (medicao.value?.ambientes?.length) {
      ambientesSelecionados.value = medicao.value.ambientes.map((a) => a.id)
    } else {
      ambientesSelecionados.value = []
    }
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a medição.'
    medicao.value = null
  } finally {
    loading.value = false
  }
}

async function gerarOrcamento() {
  if (!agendamentoId.value || ambientesSelecionados.value.length === 0) return
  salvando.value = true
  sucesso.value = false
  try {
    const res = await OrcamentoTecnicoService.criarNovo({
      agenda_loja_id: agendamentoId.value,
      ambiente_ids: ambientesSelecionados.value,
    })
    const created = res?.data ?? res ?? null
    notify.success('Orçamento técnico criado com sucesso.')
    sucesso.value = true
    if (created?.id) {
      router.push(`/orcamento-tecnico/${created.id}`)
    }
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível criar o orçamento técnico.')
  } finally {
    salvando.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
