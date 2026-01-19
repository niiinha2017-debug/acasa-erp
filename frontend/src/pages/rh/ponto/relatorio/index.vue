<template>
  <div class="page-container">
    <Card :shadow="true">
      <PageHeader
        title="Relatório de Ponto"
        subtitle="Registros por funcionário / período / localização"
        icon="pi pi-map-marker"
        :backTo="'/'"
      />

      <!-- BODY -->
      <div class="p-6 relative">
        <Loading v-if="loading" />

        <div v-else class="space-y-6">
          <!-- FILTROS -->
          <div class="grid grid-cols-12 gap-4">
            <SearchInput
              class="col-span-12 md:col-span-6"
              v-model="filtros.funcionario_id"
              mode="select"
              label="Funcionário"
              placeholder="Selecione..."
              :options="funcionariosOptions"
              labelKey="label"
              valueKey="value"
            />

            <div class="col-span-12 md:col-span-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Data início
              </label>
              <input
                v-model="filtros.data_ini"
                type="date"
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Data fim
              </label>
              <input
                v-model="filtros.data_fim"
                type="date"
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Tipo
              </label>
              <select
                v-model="filtros.tipo"
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
              >
                <option value="">Todos</option>
                <option value="ENTRADA">ENTRADA</option>
                <option value="SAIDA">SAIDA</option>
              </select>
            </div>

            <div class="col-span-12 md:col-span-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Origem
              </label>
              <select
                v-model="filtros.origem"
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
              >
                <option value="">Todas</option>
                <option value="PWA">PWA</option>
                <option value="WEB">WEB</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div class="col-span-12 md:col-span-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Status
              </label>
              <select
                v-model="filtros.status"
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
              >
                <option value="">Todos</option>
                <option value="ATIVO">ATIVO</option>
                <option value="INVALIDADO">INVALIDADO</option>
              </select>
            </div>

            <div class="col-span-12 md:col-span-3 flex items-end gap-3">
              <Button class="w-full" variant="primary" @click="buscar">
                <i class="pi pi-search mr-2"></i> Buscar
              </Button>
              <Button class="w-full" variant="secondary" @click="limpar">
                Limpar
              </Button>
            </div>
          </div>

          <div class="h-px bg-slate-100"></div>

          <!-- TABELA -->
          <Table
            :boxed="true"
            :columns="columns"
            :rows="rows"
            :loading="loadingTabela"
            emptyText="Nenhum registro encontrado."
          >
            <template #cell-funcionario="{ row }">
              <div class="font-black uppercase text-slate-900">
                {{ row?.funcionario?.nome || '—' }}
              </div>
              <div class="text-[11px] font-bold text-slate-400">
                ID: {{ row?.funcionario?.id || '—' }}
              </div>
            </template>

            <template #cell-data_hora="{ row }">
              <div class="font-black text-slate-900">
                {{ fmtDataHora(row?.data_hora) }}
              </div>
              <div class="text-[11px] font-bold text-slate-400">
                {{ row?.tipo }} • {{ row?.origem }}
              </div>
            </template>

            <template #cell-local="{ row }">
              <div class="text-xs font-black text-slate-900 uppercase truncate">
                {{ row?.localidade || '—' }}
              </div>
              <div class="text-[11px] font-mono text-slate-500">
                {{ row?.cep || '—' }}
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row?.status" />
            </template>

            <template #cell-actions="{ row }">
              <div class="flex justify-end">
                <Button variant="ghost" size="sm" @click="abrirDetalhe(row)">
                  <i class="pi pi-eye mr-2"></i> Ver
                </Button>
              </div>
            </template>
          </Table>
        </div>

        <!-- MODAL DETALHE -->
        <transition name="fade">
          <div
            v-if="detalheOpen"
            class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            @click.self="fecharDetalhe"
          >
            <div class="w-full max-w-lg bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div class="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Detalhe do registro
                  </p>
                  <h3 class="text-lg font-black uppercase text-slate-900 mt-1">
                    {{ detalhe?.funcionario?.nome || '—' }}
                  </h3>
                  <p class="text-xs font-bold text-slate-500 mt-1">
                    {{ fmtDataHora(detalhe?.data_hora) }} • {{ detalhe?.tipo }} • {{ detalhe?.origem }}
                  </p>
                </div>

                <Button variant="secondary" size="sm" @click="fecharDetalhe">
                  Fechar
                </Button>
              </div>

              <div class="p-6 space-y-4">
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP</p>
                    <p class="text-sm font-black text-slate-900">{{ detalhe?.cep || '—' }}</p>
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Localidade</p>
                    <p class="text-sm font-black text-slate-900 uppercase">{{ detalhe?.localidade || '—' }}</p>
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">GPS</p>
                    <p class="text-xs font-mono text-slate-700">
                      {{ detalhe?.latitude ?? '—' }}, {{ detalhe?.longitude ?? '—' }}
                    </p>
                    <p class="text-[11px] font-bold text-slate-400">
                      Precisão: {{ detalhe?.precisao_metros ?? '—' }}m
                    </p>
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">IP</p>
                    <p class="text-xs font-mono text-slate-700">{{ detalhe?.ip || '—' }}</p>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">Status</p>
                    <StatusBadge :value="detalhe?.status" />
                  </div>
                </div>

                <div class="h-px bg-slate-100"></div>

                <div class="flex items-center justify-between gap-3">
                  <div class="text-[11px] font-bold text-slate-400">
                    Dispositivo: {{ detalhe?.dispositivo?.device_nome || '—' }} ({{ detalhe?.dispositivo?.plataforma || '—' }})
                  </div>

                  <a
                    v-if="mapLink"
                    :href="mapLink"
                    target="_blank"
                    class="text-[11px] font-black uppercase tracking-widest text-brand-primary hover:opacity-80"
                  >
                    Abrir no mapa →
                  </a>
                </div>
              </div>

              <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button variant="primary" @click="fecharDetalhe">OK</Button>
              </div>
            </div>
          </div>
        </transition>

      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FuncionarioService, PontoRelatorioService } from '@/services/index'

const loading = ref(false)
const loadingTabela = ref(false)

const funcionariosOptions = ref([])
const rows = ref([])

const filtros = ref({
  funcionario_id: '',
  data_ini: '',
  data_fim: '',
  tipo: '',
  origem: '',
  status: '',
})

const columns = [
  { key: 'funcionario', label: 'Funcionário', width: '220px' },
  { key: 'data_hora', label: 'Registro' },
  { key: 'local', label: 'Localização' },
  { key: 'status', label: 'Status', width: '120px', align: 'right' },
  { key: 'actions', label: '', width: '90px', align: 'right' },
]

function fmtDataHora(dt) {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleString('pt-BR')
  } catch {
    return String(dt)
  }
}

async function carregarFuncionarios() {
  // Ajusta aqui conforme seu endpoint real
  // Se seu listar aceitar filtros, ok; se não aceitar, só chama listar()
  const res = await FuncionarioService.listar?.() // ou FuncionarioService.listar({})
  const list = Array.isArray(res?.data) ? res.data : []
  funcionariosOptions.value = list.map((f) => ({
    label: f.nome,
    value: String(f.id),
  }))
}

function limpar() {
  filtros.value = { funcionario_id: '', data_ini: '', data_fim: '', tipo: '', origem: '', status: '' }
  rows.value = []
}

async function buscar() {
  loadingTabela.value = true
  try {
    const params = { ...filtros.value }
    // remove params vazios
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k]
    })

    const res = await PontoRelatorioService.listarRegistros(params)
    rows.value = Array.isArray(res?.data) ? res.data : []
  } finally {
    loadingTabela.value = false
  }
}

/** DETALHE */
const detalheOpen = ref(false)
const detalhe = ref(null)

const mapLink = computed(() => {
  const lat = detalhe.value?.latitude
  const lng = detalhe.value?.longitude
  if (lat == null || lng == null) return ''
  return `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`
})

function abrirDetalhe(row) {
  detalhe.value = row
  detalheOpen.value = true
}

function fecharDetalhe() {
  detalheOpen.value = false
  detalhe.value = null
}

onMounted(async () => {
  loading.value = true
  try {
    await carregarFuncionarios()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
