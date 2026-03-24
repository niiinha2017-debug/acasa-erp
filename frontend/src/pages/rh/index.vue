<template>
  <PageShell :padded="false">
    <section class="rh-hub ds-page-context animate-page-in">
      <PageHeader
        title="RH"
        subtitle="Tudo de ponto e folha em um lugar. Escolha abaixo o que você quer fazer."
        icon="pi pi-users"
      />

      <div class="rh-hub__body ds-page-context__content space-y-8 pb-6">
        <!-- Ponto: espelho e app -->
        <section v-if="atalhosPonto.length">
          <h2 class="text-[10px] font-black uppercase tracking-wider text-[var(--ds-color-text-faint)] mb-3 flex items-center gap-2">
            <i class="pi pi-stopwatch"></i>
            Ponto (espelho e app)
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="item in atalhosPonto"
              :key="item.to"
              type="button"
              class="w-full text-left ds-card ds-card--default ds-card--hoverable p-5 cursor-pointer"
              @click="irPara(item.to)"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)]">
                  <i :class="item.icon" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-[var(--ds-color-text)] uppercase tracking-tight">{{ item.label }}</h3>
                  <p class="text-xs text-[var(--ds-color-text-soft)] mt-1">{{ item.desc }}</p>
                </div>
                <i class="pi pi-chevron-right text-[var(--ds-color-text-faint)] text-sm shrink-0" />
              </div>
            </button>
          </div>
        </section>

        <!-- Configuração: pessoas e feriados -->
        <section v-if="atalhosConfig.length">
          <h2 class="text-[10px] font-black uppercase tracking-wider text-[var(--ds-color-text-faint)] mb-3 flex items-center gap-2">
            <i class="pi pi-cog"></i>
            Configuração (pessoas e feriados)
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="item in atalhosConfig"
              :key="item.to"
              type="button"
              class="w-full text-left ds-card ds-card--default ds-card--hoverable p-5 cursor-pointer"
              @click="irPara(item.to)"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)]">
                  <i :class="item.icon" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-[var(--ds-color-text)] uppercase tracking-tight">{{ item.label }}</h3>
                  <p class="text-xs text-[var(--ds-color-text-soft)] mt-1">{{ item.desc }}</p>
                </div>
                <i class="pi pi-chevron-right text-[var(--ds-color-text-faint)] text-sm shrink-0" />
              </div>
            </button>
          </div>
        </section>

      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { can } from '@/services/permissions'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'

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
