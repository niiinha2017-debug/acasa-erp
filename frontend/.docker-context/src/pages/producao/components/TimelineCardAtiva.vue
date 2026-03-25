<template>
  <div
    class="group relative overflow-hidden bg-white dark:bg-slate-800 border rounded-[2rem] p-6 shadow-[0_15px_40px_rgba(30,58,138,0.05)] dark:shadow-none transition-all duration-300"
    :class="
      atrasada
        ? 'border-red-300 dark:border-red-500/70 ring-1 ring-red-200 dark:ring-red-900/50'
        : 'border-blue-100 dark:border-slate-600'
    "
  >
    <!-- Topo: avatar + título + status + timer -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div class="flex items-center gap-4 min-w-0">
        <div
          class="w-14 h-14 rounded-2xl bg-blue-900 dark:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0 font-bold text-lg"
        >
          {{ iniciais }}
        </div>
        <div class="min-w-0">
          <h3 class="font-bold text-lg text-slate-800 dark:text-slate-200 tracking-tight truncate">
            {{ titulo }}
          </h3>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <template v-if="produçãoAtiva">
              <span class="relative flex h-2 w-2" aria-hidden>
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Produção ativa
              </span>
            </template>
            <template v-else>
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Em andamento
              </span>
            </template>
            <span
              v-if="atrasada"
              class="shrink-0 text-[10px] font-bold uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded"
              title="Prazo excedido"
            >
              Tempo excedido
            </span>
          </div>
        </div>
      </div>
      <div
        class="bg-slate-50 dark:bg-slate-800/80 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shrink-0"
      >
        <div class="font-mono text-2xl md:text-3xl font-medium tracking-tighter text-blue-900 dark:text-blue-300">
          {{ totalHorasLabel }}
        </div>
      </div>
    </div>

    <!-- Tabela de apontamentos -->
    <div
      class="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30"
    >
      <table class="w-full text-sm table-fixed">
        <colgroup>
          <col class="w-[28%]" />
          <col class="w-[18%]" />
          <col class="w-[18%]" />
          <col class="w-[14%]" />
          <col class="w-[22%]" />
        </colgroup>
        <thead
          class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50"
        >
          <tr>
            <th class="text-left py-2.5 pr-2">Funcionário</th>
            <th class="text-left py-2.5 px-2">Início</th>
            <th class="text-left py-2.5 px-2">Fim</th>
            <th class="text-right py-2.5 px-2">Horas</th>
            <th class="text-center py-2.5 pl-2 w-24">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!apontamentos.length" class="text-slate-500 dark:text-slate-400">
            <td colspan="5" class="py-5 text-sm">Nenhum funcionário atribuído ainda.</td>
          </tr>
          <tr
            v-for="ap in apontamentos"
            :key="ap.id"
            class="border-b border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-white/50 dark:hover:bg-slate-700/20"
          >
            <td class="py-2.5 pr-2 font-medium text-slate-800 dark:text-slate-200 align-middle">
              {{ ap.funcionario?.nome || `#${ap.funcionario_id}` }}
            </td>
            <td class="py-2.5 px-2 text-slate-600 dark:text-slate-400 align-middle">
              {{ timeLabel(ap.inicio_em) }}
            </td>
            <td class="py-2.5 px-2 align-middle">
              <template v-if="ap.emAndamento">
                <span
                  v-if="ap.pausado"
                  class="text-amber-600 dark:text-amber-400 text-xs font-medium"
                >
                  Pausado
                </span>
                <span v-else class="text-slate-400">—</span>
              </template>
              <template v-else>
                <span class="text-slate-600 dark:text-slate-400">{{ timeLabel(ap.fim_em) }}</span>
              </template>
            </td>
            <td class="py-2.5 px-2 text-right font-mono font-medium text-slate-800 dark:text-slate-200 align-middle">
              {{ ap.horasLabel }}
            </td>
            <td class="py-2.5 pl-2 align-middle">
              <div class="flex items-center justify-center gap-1">
                <template v-if="ap.emAndamento">
                  <template v-if="ap.pausado">
                    <button
                      type="button"
                      class="btn-icon rounded-xl text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Retomar"
                      @click="$emit('retomar', ap)"
                    >
                      <i class="pi pi-play text-sm" />
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-black dark:hover:bg-slate-600 text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
                      title="Pausar"
                      @click="$emit('pausar', ap)"
                    >
                      <i class="pi pi-pause text-sm" />
                    </button>
                    <button
                      type="button"
                      class="h-9 w-9 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                      title="Concluir"
                      @click="$emit('concluir', ap)"
                    >
                      <i class="pi pi-stop text-sm" />
                    </button>
                  </template>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    title="Excluir"
                    @click="$emit('excluir-apontamento', ap)"
                  >
                    <i class="pi pi-trash text-sm" />
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="apontamentos.length">
          <tr class="border-t border-slate-200 dark:border-slate-600 bg-blue-50/80 dark:bg-blue-900/10">
            <td colspan="3" class="py-2.5 pr-2 text-right font-bold text-slate-700 dark:text-slate-300">
              Total Horas
            </td>
            <td class="py-2.5 px-2 text-right font-mono font-bold text-blue-900 dark:text-blue-300">
              {{ totalHorasLabel }}
            </td>
            <td class="py-2.5 pl-2" />
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Rodapé: funcionário + ações -->
    <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 h-12">
        <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
          Funcionário
        </span>
        <select
          :value="funcionarioSelecionado"
          class="h-12 min-w-[180px] px-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-900/20"
          @input="$emit('update:funcionarioSelecionado', $event.target.value)"
        >
          <option value="">— Selecione —</option>
          <option v-for="f in listaFuncionarios" :key="f.id" :value="String(f.id)">
            {{ f.nome }}
          </option>
        </select>
      </label>
      <button
        type="button"
        class="h-12 px-6 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs tracking-widest uppercase hover:bg-black dark:hover:bg-slate-600 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        :disabled="adicionando || !funcionarioSelecionado"
        @click="$emit('iniciar-tempo')"
      >
        <i class="pi pi-play text-sm" />
        {{ adicionando ? 'Adicionando...' : 'Iniciar Tempo' }}
      </button>
      <button
        type="button"
        class="h-12 px-4 flex items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 text-[11px] font-bold uppercase tracking-widest shrink-0 transition-all active:scale-95"
        :disabled="finalizando"
        :title="finalizando ? 'Finalizando...' : 'Finalizar etapa'"
        @click="$emit('finalizar-etapa')"
      >
        <i class="pi pi-check text-sm" />
        Finalizar Etapa
      </button>
      <button
        type="button"
        class="h-12 w-12 flex items-center justify-center rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
        title="Excluir agendamento"
        @click="$emit('excluir-tarefa')"
      >
        <i class="pi pi-trash text-sm" />
      </button>
    </div>

    <!-- Barra de progresso quando cronômetro rodando -->
    <div
      v-if="produçãoAtiva"
      class="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-[2rem] bg-blue-900/5 dark:bg-blue-400/10"
    >
      <div class="h-full bg-blue-900/40 dark:bg-blue-400/40 w-1/4 animate-progress-slide" />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'TimelineCardAtiva' })

defineProps({
  titulo: { type: String, default: '' },
  iniciais: { type: String, default: 'TA' },
  atrasada: { type: Boolean, default: false },
  produçãoAtiva: { type: Boolean, default: false },
  totalHorasLabel: { type: String, default: '0h' },
  apontamentos: { type: Array, default: () => [] },
  listaFuncionarios: { type: Array, default: () => [] },
  funcionarioSelecionado: { type: String, default: '' },
  adicionando: { type: Boolean, default: false },
  finalizando: { type: Boolean, default: false },
  timeLabel: { type: Function, default: (v) => (v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—') },
})

defineEmits([
  'update:funcionarioSelecionado',
  'iniciar-tempo',
  'finalizar-etapa',
  'excluir-tarefa',
  'pausar',
  'retomar',
  'concluir',
  'excluir-apontamento',
])
</script>
