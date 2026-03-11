<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="RH"
        subtitle="Tudo de ponto e folha em um lugar. Escolha abaixo o que você quer fazer."
        icon="pi pi-users"
        :show-back="false"
      />

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui space-y-8">
        <!-- Ponto: espelho e app -->
        <section v-if="atalhosPonto.length">
          <h2 class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-3 flex items-center gap-2">
            <i class="pi pi-stopwatch"></i>
            Ponto (espelho e app)
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="item in atalhosPonto"
              :key="item.to"
              type="button"
              class="w-full text-left block p-5 rounded-xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:bg-slate-50 transition-colors cursor-pointer"
              @click="irPara(item.to)"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-brand-primary/10 text-brand-primary shrink-0">
                  <i :class="item.icon" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-text-main uppercase tracking-tight">{{ item.label }}</h3>
                  <p class="text-xs text-text-muted mt-1">{{ item.desc }}</p>
                </div>
                <i class="pi pi-chevron-right text-text-muted text-sm shrink-0" />
              </div>
            </button>
          </div>
        </section>

        <!-- Configuração: pessoas e feriados -->
        <section v-if="atalhosConfig.length">
          <h2 class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-3 flex items-center gap-2">
            <i class="pi pi-cog"></i>
            Configuração (pessoas e feriados)
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="item in atalhosConfig"
              :key="item.to"
              type="button"
              class="w-full text-left block p-5 rounded-xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:bg-slate-50 transition-colors cursor-pointer"
              @click="irPara(item.to)"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-brand-primary/10 text-brand-primary shrink-0">
                  <i :class="item.icon" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-text-main uppercase tracking-tight">{{ item.label }}</h3>
                  <p class="text-xs text-text-muted mt-1">{{ item.desc }}</p>
                </div>
                <i class="pi pi-chevron-right text-text-muted text-sm shrink-0" />
              </div>
            </button>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { can } from '@/services/permissions'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()

function irPara(to) {
  router.push(to)
}

// Ponto: espelho (relógio) e app
const atalhosPonto = computed(() =>
  [
    {
      label: 'Relatório de Ponto',
      desc: 'Espelho de ponto de cada funcionário: datas, entradas/saídas, PDF',
      to: '/rh/ponto/relatorio',
      icon: 'pi pi-stopwatch',
      show: () => can('ponto_relatorio.ver'),
    },
    {
      label: 'Convites do Ponto',
      desc: 'Gerar link para o funcionário ativar o app de ponto',
      to: '/rh/ponto/convites',
      icon: 'pi pi-link',
      show: () => can('ponto_convite.criar'),
    },
    {
      label: 'Fechamento de Folha',
      desc: 'Resumo por período: horas trabalhadas, extras e custo devido (pagamento)',
      to: '/rh/ponto/fechamento',
      icon: 'pi pi-wallet',
      show: () => can('despesas.ver'),
    },
  ].filter((item) => item.show()),
)

// Configuração: quem trabalha e em quais feriados
const atalhosConfig = computed(() =>
  [
    {
      label: 'Cadastro de Funcionários',
      desc: 'Nome, jornada e custo/hora (usado em todos os cálculos)',
      to: '/funcionarios',
      icon: 'pi pi-id-card',
      show: () => can('funcionarios.ver'),
    },
    {
      label: 'Feriados',
      desc: 'Calendário e dias em que a equipe trabalha (100% na folha)',
      to: '/rh/ponto/horas-extras',
      icon: 'pi pi-calendar',
      show: () => can('ponto_relatorio.ver'),
    },
  ].filter((item) => item.show()),
)

</script>
