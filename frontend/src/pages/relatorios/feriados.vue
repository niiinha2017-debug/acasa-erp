<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-indigo-500 rounded-t-2xl" />

      <PageHeader
        title="Feriados Nacionais"
        subtitle="Configuração de trabalho nos feriados (impacta no ponto)"
        icon="pi pi-calendar"
      >
        <template #actions>
          <RouterLink to="/relatorios" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-ui text-sm font-medium text-text-muted hover:bg-bg-page">
            <i class="pi pi-arrow-left"></i>
            Voltar
          </RouterLink>
          <div class="flex items-center gap-2">
            <input
              v-model.number="ano"
              type="number"
              min="2020"
              max="2030"
              class="h-9 w-24 rounded-lg border border-border-ui bg-bg-page px-3 text-sm"
            />
            <Button variant="outline" size="sm" @click="buscarDados" :disabled="salvando">
              <i class="pi pi-refresh mr-2"></i>
              Buscar
            </Button>
            <Button variant="primary" size="sm" @click="salvarConfig" :loading="salvando">
              <i class="pi pi-save mr-2"></i>
              Salvar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div v-if="loading" class="h-48 flex items-center justify-center text-brand-primary animate-pulse font-mono text-sm">
          Carregando feriados...
        </div>

        <div v-else-if="!(lista && lista.length)" class="h-48 flex items-center justify-center text-text-muted text-center px-4">
          Nenhum feriado encontrado para {{ ano }}.
        </div>

        <div v-else class="rounded-xl border border-border-ui overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-bg-page border-b border-border-ui">
              <tr>
                <th class="text-left py-3 px-4 font-bold text-text-muted">Data</th>
                <th class="text-left py-3 px-4 font-bold text-text-muted">Nome</th>
                <th class="text-left py-3 px-4 font-bold text-text-muted">Tipo</th>
                <th class="text-center py-3 px-4 font-bold text-text-muted">Trabalha?</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(f, i) in lista"
                :key="f.date"
                :class="i % 2 === 0 ? 'bg-bg-card' : 'bg-bg-page'"
                class="border-b border-border-ui last:border-b-0"
              >
                <td class="py-3 px-4">{{ formatarData(f.date) }}</td>
                <td class="py-3 px-4">{{ f.name || '—' }}</td>
                <td class="py-3 px-4 text-text-muted">{{ f.type || '—' }}</td>
                <td class="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    v-model="f.trabalha"
                    class="w-4 h-4 rounded border-border-ui text-brand-primary focus:ring-brand-primary"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { notify } from '@/services/notify';
import api from '@/services/api';

definePage({ meta: { perm: 'dashboard.visualizar' } });

const loading = ref(true);
const salvando = ref(false);
const ano = ref(new Date().getFullYear());
const lista = ref([]);

function formatarData(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const buscarDados = async () => {
  loading.value = true;
  try {
    const anoSelecionado = ano.value;
    // Busca feriados da API externa
    const { data: daApi } = await api.get('/ponto/relatorio/feriados', { params: { ano: anoSelecionado } });
    
    // Busca configurações salvas
    const { data: salvos } = await api.get('/ponto/relatorio/feriados-config', { 
      params: { 
        data_ini: `${anoSelecionado}-01-01`, 
        data_fim: `${anoSelecionado}-12-31` 
      } 
    });

    const apiFeriados = Array.isArray(daApi) ? daApi : [];
    const configSalva = Array.isArray(salvos) ? salvos : [];

    lista.value = apiFeriados.map(f => {
      const cfg = configSalva.find(c => c.date === f.date);
      return {
        ...f,
        trabalha: cfg ? !!cfg.trabalha : false
      };
    });
  } catch (e) {
    console.error('Erro ao carregar feriados:', e);
    lista.value = [];
  } finally {
    loading.value = false;
  }
};

const salvarConfig = async () => {
  salvando.value = true;
  try {
    const payload = lista.value.map(f => ({
      date: f.date,
      name: f.name,
      type: f.type,
      trabalha: !!f.trabalha
    }));
    await api.put('/ponto/relatorio/feriados-config', { itens: payload });
    notify('Feriados atualizados com sucesso!', 'success');
  } catch (e) {
    console.error('Erro ao salvar feriados:', e);
    notify('Erro ao salvar configurações.', 'error');
  } finally {
    salvando.value = false;
  }
};

onMounted(buscarDados);
</script>
