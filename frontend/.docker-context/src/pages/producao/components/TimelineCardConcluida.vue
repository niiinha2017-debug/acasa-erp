<template>
  <div
    class="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-[2rem] p-6 opacity-60 hover:opacity-100 transition-all duration-300"
  >
    <div class="flex items-center gap-4 mb-4">
      <div
        class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-600 shrink-0 font-bold text-lg"
      >
        {{ iniciais }}
      </div>
      <div class="min-w-0">
        <h3 class="font-bold text-lg text-slate-500 dark:text-slate-400 truncate">
          {{ titulo }}
        </h3>
        <p class="text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest mt-1">
          Concluída
        </p>
      </div>
      <div
        class="ml-auto bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700"
      >
        <span class="font-mono text-xl text-slate-400 dark:text-slate-500">{{ totalHorasLabel }}</span>
      </div>
    </div>
    <div
      class="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30"
    >
      <table class="w-full text-sm table-fixed">
        <thead
          class="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-600"
        >
          <tr>
            <th class="text-left py-2 pr-2">Funcionário</th>
            <th class="text-left py-2 px-2">Início</th>
            <th class="text-left py-2 px-2">Fim</th>
            <th class="text-right py-2 px-2">Horas</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ap in apontamentos"
            :key="ap.id"
            class="border-b border-slate-100 dark:border-slate-700/50"
          >
            <td class="py-2 pr-2 font-medium text-slate-600 dark:text-slate-400">
              {{ ap.funcionario?.nome || '—' }}
            </td>
            <td class="py-2 px-2 text-slate-500 dark:text-slate-500">{{ timeLabel(ap.inicio_em) }}</td>
            <td class="py-2 px-2 text-slate-500 dark:text-slate-500">
              {{ ap.fim_em ? timeLabel(ap.fim_em) : '—' }}
            </td>
            <td class="py-2 px-2 text-right font-medium text-slate-600 dark:text-slate-400">
              {{ ap.horasLabel }}
            </td>
          </tr>
        </tbody>
        <tfoot v-if="apontamentos.length">
          <tr class="border-t border-slate-200 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-900/10">
            <td colspan="3" class="py-2.5 pr-2 text-right font-bold text-slate-600 dark:text-slate-400">
              Total Horas
            </td>
            <td class="py-2.5 px-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
              {{ totalHorasLabel }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'TimelineCardConcluida' })

defineProps({
  titulo: { type: String, default: '' },
  iniciais: { type: String, default: 'TA' },
  totalHorasLabel: { type: String, default: '0h' },
  apontamentos: { type: Array, default: () => [] },
  timeLabel: {
    type: Function,
    default: (v) =>
      v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
  },
})
</script>
