<!-- src/pages/producao/agenda.vue -->
<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Agenda de Produção</h2>
          <p class="card-subtitle">Produções (projetos) do dia com tarefas e funcionários.</p>
        </div>

        <Button variant="outline" size="md" label="Voltar" @click="router.back()" />
      </header>

      <div class="card-filter agenda-filter">
        <div class="agenda-filter__row">
          <Input v-model="dataRef" type="date" label="Dia" />
          <Button variant="secondary" size="md" label="Hoje" @click="irHoje" />
          <Button
            variant="outline"
            size="md"
            label="Atualizar"
            :loading="loading"
            loadingText="Carregando..."
            @click="carregar"
          />
          <Button
            variant="primary"
            size="md"
            label="+ Nova Produção"
            @click="abrirModalCriarProjeto"
          />
        </div>

        <div class="agenda-filter__row">
          <Input v-model="filtro" label="Buscar" placeholder="Buscar por origem/título/funcionário..." />
        </div>
      </div>

      <div class="card-body">
        <div v-if="!loading && projetosFiltrados.length === 0" class="agenda-empty">
          Nenhuma produção encontrada para o dia.
        </div>

        <div class="agenda-grid">
          <div v-for="p in projetosFiltrados" :key="p.id" class="agenda-card">
            <div class="agenda-card__header">
              <div class="agenda-card__header-left">
                <div class="agenda-card__name">
                  {{ origemLabel(p.origem_tipo, p.origem_id) }}
                </div>

                <div class="agenda-card__meta">
                  <span class="agenda-tag" :class="statusClassProjeto(p.status)">{{ p.status }}</span>
                  <span class="muted">• Projeto #{{ p.id }}</span>
                </div>
              </div>

              <div class="agenda-card__header-actions">
                <Button
                  variant="outline"
                  size="sm"
                  label="+ Tarefa"
                  @click="abrirModalCriarTarefa(p)"
                />
              </div>
            </div>

            <div class="agenda-card__body">
              <div v-if="(p.tarefas || []).length === 0" class="agenda-empty">
                Sem tarefas neste dia.
              </div>

              <div
                v-for="t in (p.tarefas || [])"
                :key="t.id"
                class="agenda-task"
                @click="abrirModalEditarTarefa(p, t)"
              >
                <div class="agenda-task__top">
                  <span class="agenda-task__time">{{ horaRange(t.inicio_em, t.fim_em) }}</span>
                  <span class="agenda-tag" :class="statusClassTarefa(t.status)">{{ t.status }}</span>
                </div>

                <div class="agenda-task__title">{{ t.titulo }}</div>

                <div class="agenda-task__meta">
                  <span class="agenda-chip">
                    {{ t?.funcionario?.nome || `Funcionário #${t.funcionario_id}` }}
                  </span>

                  <span v-if="t.observacao" class="muted">• {{ t.observacao }}</span>
                </div>
              </div>
            </div>

            <div class="agenda-card__footer footer-between">
              <span class="muted">{{ (p.tarefas || []).length }} tarefa(s)</span>
              <span class="muted">Origem: {{ p.origem_tipo }} #{{ p.origem_id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="modal.aberto" class="modal-backdrop" @click.self="fecharModal">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">
              {{ modal.modo === 'criar_projeto'
                ? 'Nova Produção'
                : modal.modo === 'criar_tarefa'
                  ? 'Nova Tarefa'
                  : 'Editar Tarefa' }}
            </h3>

            <p v-if="modal.projeto" class="modal-subtitle">
              Projeto: <b>{{ origemLabel(modal.projeto.origem_tipo, modal.projeto.origem_id) }}</b>
              <span class="muted">• #{{ modal.projeto.id }}</span>
            </p>
          </div>

          <Button variant="outline" size="sm" label="Fechar" @click="fecharModal" />
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <!-- Criar Produção -->
            <template v-if="modal.modo === 'criar_projeto'">
              <div class="col-span-12 section-title">
                <h4 class="section-title__text">Vínculo da Produção</h4>
              </div>

              <div class="col-span-6 form-group">
                <Input v-model="modal.formProjeto.origem_tipo" label="Origem tipo" placeholder="VENDA_CLIENTE / PLANO_CORTE" />
              </div>

              <div class="col-span-6 form-group">
                <Input v-model="modal.formProjeto.origem_id" type="number" label="Origem ID" placeholder="Ex: 123" />
              </div>

              <div class="col-span-12 muted">
                Ao salvar, a primeira tarefa pode ser criada depois (botão “+ Tarefa”).
              </div>
            </template>

            <!-- Criar/Editar Tarefa -->
            <template v-else>
              <div class="col-span-12 section-title">
                <h4 class="section-title__text">Tarefa</h4>
              </div>

              <div class="col-span-4 form-group">
                <Input v-model="modal.formTarefa.funcionario_id" type="number" label="Funcionário ID" placeholder="Ex: 1" />
              </div>

              <div class="col-span-4 form-group">
                <Input v-model="modal.formTarefa.status" label="Status" placeholder="PENDENTE" />
              </div>

              <div class="col-span-4 form-group">
                <Input v-model="modal.formTarefa.titulo" label="Título" placeholder="Ex: Corte / Montagem" />
              </div>

              <div class="col-span-6 form-group">
                <Input v-model="modal.formTarefa.inicio_em" type="datetime-local" label="Início" />
              </div>

              <div class="col-span-6 form-group">
                <Input v-model="modal.formTarefa.fim_em" type="datetime-local" label="Fim" />
              </div>

              <div class="col-span-12 form-group">
                <Input v-model="modal.formTarefa.observacao" label="Observação" placeholder="Opcional..." />
              </div>

              <div v-if="modal.modo === 'editar_tarefa'" class="col-span-12 muted" style="margin-top: 6px;">
                CPV calculado automaticamente no backend.
              </div>
            </template>
          </div>
        </div>

        <div class="modal-footer footer-between">
          <span class="muted">
            {{ modal.modo === 'criar_projeto'
              ? 'Criar produção'
              : modal.modo === 'criar_tarefa'
                ? 'Criar tarefa'
                : 'Salvar alterações' }}
          </span>

          <div class="footer-actions">
            <Button
              v-if="modal.modo === 'editar_tarefa'"
              variant="danger"
              size="md"
              label="Excluir"
              :loading="modal.excluindo"
              loadingText="Excluindo..."
              @click="excluirTarefa"
            />

            <Button
              variant="primary"
              size="md"
              label="Salvar"
              :loading="modal.salvando"
              loadingText="Salvando..."
              @click="salvarModal"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import '@/assets/CSS/producao-agenda.css'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import api from '@/services/api'

const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const dataRef = ref(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD

const projetos = ref([])

function irHoje() {
  dataRef.value = new Date().toISOString().slice(0, 10)
  carregar()
}

function inicioFimDoDia(yyyyMmDd) {
  const inicio = new Date(`${yyyyMmDd}T00:00:00`)
  const fim = new Date(`${yyyyMmDd}T23:59:59`)
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}
function horaRange(inicioIso, fimIso) {
  const ini = new Date(inicioIso)
  const fim = new Date(fimIso)
  return `${pad2(ini.getHours())}:${pad2(ini.getMinutes())}–${pad2(fim.getHours())}:${pad2(fim.getMinutes())}`
}

function origemLabel(tipo, id) {
  if (!tipo || !id) return 'Sem vínculo'
  const t = String(tipo).toUpperCase()
  if (t.includes('PLANO')) return `Plano de Corte #${id}`
  return `Venda Cliente #${id}`
}

function statusClassProjeto(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'FECHADO' || s === 'CONCLUIDO' || s === 'CONCLUÍDO') return 'agenda-tag--success'
  if (s === 'ABERTO') return 'agenda-tag--muted'
  return 'agenda-tag--warning'
}

function statusClassTarefa(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'CONCLUIDA' || s === 'CONCLUÍDA') return 'agenda-tag--success'
  if (s === 'ANDAMENTO' || s === 'EM_ANDAMENTO') return 'agenda-tag--warning'
  if (s === 'CANCELADA') return 'agenda-tag--danger'
  return 'agenda-tag--muted'
}

const projetosFiltrados = computed(() => {
  const f = (filtro.value || '').toLowerCase().trim()
  if (!f) return projetos.value

  return projetos.value.filter((p) => {
    const origem = `${p.origem_tipo || ''} ${p.origem_id || ''}`.toLowerCase()
    const tarefasTxt = (p.tarefas || [])
      .map((t) => `${t.titulo || ''} ${t?.funcionario?.nome || ''} ${t.status || ''}`)
      .join(' ')
      .toLowerCase()

    return origem.includes(f) || tarefasTxt.includes(f)
  })
})

async function carregar() {
  loading.value = true
  try {
    const { inicio, fim } = inicioFimDoDia(dataRef.value)
    const { data } = await api.get('/producao/agenda', { params: { inicio, fim } })
    projetos.value = data || []
  } finally {
    loading.value = false
  }
}

/* ===== Modal ===== */
const modal = reactive({
  aberto: false,
  modo: 'criar_tarefa', // criar_projeto | criar_tarefa | editar_tarefa
  projeto: null,
  tarefaId: null,
  salvando: false,
  excluindo: false,

  formProjeto: {
    origem_tipo: '',
    origem_id: '',
  },

  formTarefa: {
    funcionario_id: '',
    titulo: '',
    status: 'PENDENTE',
    observacao: '',
    inicio_em: '',
    fim_em: '',
  },
})

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function fecharModal() {
  modal.aberto = false
  modal.projeto = null
  modal.tarefaId = null
}

function abrirModalCriarProjeto() {
  modal.aberto = true
  modal.modo = 'criar_projeto'
  modal.projeto = null
  modal.tarefaId = null
  modal.formProjeto.origem_tipo = ''
  modal.formProjeto.origem_id = ''
}

function abrirModalCriarTarefa(projeto) {
  modal.aberto = true
  modal.modo = 'criar_tarefa'
  modal.projeto = projeto
  modal.tarefaId = null

  modal.formTarefa.funcionario_id = ''
  modal.formTarefa.titulo = ''
  modal.formTarefa.status = 'PENDENTE'
  modal.formTarefa.observacao = ''

  const base = dataRef.value
  modal.formTarefa.inicio_em = `${base}T08:00`
  modal.formTarefa.fim_em = `${base}T10:00`
}

function abrirModalEditarTarefa(projeto, tarefa) {
  modal.aberto = true
  modal.modo = 'editar_tarefa'
  modal.projeto = projeto
  modal.tarefaId = tarefa.id

  modal.formTarefa.funcionario_id = String(tarefa.funcionario_id ?? '')
  modal.formTarefa.titulo = tarefa.titulo || ''
  modal.formTarefa.status = tarefa.status || 'PENDENTE'
  modal.formTarefa.observacao = tarefa.observacao || ''
  modal.formTarefa.inicio_em = toLocalInput(tarefa.inicio_em)
  modal.formTarefa.fim_em = toLocalInput(tarefa.fim_em)
}

async function salvarModal() {
  modal.salvando = true
  try {
    if (modal.modo === 'criar_projeto') {
      const origem_tipo = String(modal.formProjeto.origem_tipo || '').trim()
      const origem_id = Number(modal.formProjeto.origem_id)

      if (!origem_tipo) return alert('Informe o origem_tipo.')
      if (!origem_id || Number.isNaN(origem_id)) return alert('Informe o origem_id.')

      // cria/busca projeto (opcional no backend, mas está no controller/service que montamos)
      await api.post('/producao/projetos', { origem_tipo, origem_id })
      fecharModal()
      await carregar()
      return
    }

    // criar/editar tarefa
    if (!modal.projeto) return alert('Projeto inválido.')

    const funcionario_id = Number(modal.formTarefa.funcionario_id)
    if (!funcionario_id || Number.isNaN(funcionario_id)) return alert('Informe o funcionário_id.')
    if (!String(modal.formTarefa.titulo || '').trim()) return alert('Informe o título.')
    if (!String(modal.formTarefa.inicio_em || '').trim()) return alert('Informe o início.')
    if (!String(modal.formTarefa.fim_em || '').trim()) return alert('Informe o fim.')

    const payload = {
      origem_tipo: String(modal.projeto.origem_tipo || '').trim(),
      origem_id: Number(modal.projeto.origem_id),
      funcionario_id,
      titulo: String(modal.formTarefa.titulo || '').trim(),
      status: String(modal.formTarefa.status || 'PENDENTE').trim(),
      observacao: String(modal.formTarefa.observacao || '').trim() ? String(modal.formTarefa.observacao).trim() : undefined,
      inicio_em: new Date(modal.formTarefa.inicio_em).toISOString(),
      fim_em: new Date(modal.formTarefa.fim_em).toISOString(),
    }

    if (modal.modo === 'criar_tarefa') {
      await api.post('/producao/tarefas', payload)
    } else {
      await api.patch(`/producao/tarefas/${modal.tarefaId}`, payload)
    }

    fecharModal()
    await carregar()
  } finally {
    modal.salvando = false
  }
}

async function excluirTarefa() {
  if (!confirm('Deseja excluir esta tarefa?')) return
  modal.excluindo = true
  try {
    await api.delete(`/producao/tarefas/${modal.tarefaId}`)
    fecharModal()
    await carregar()
  } finally {
    modal.excluindo = false
  }
}

onMounted(carregar)
</script>
