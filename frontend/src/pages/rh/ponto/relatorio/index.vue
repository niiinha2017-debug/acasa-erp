<template>
  <div class="w-full h-full animate-page-in">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Relatório de Ponto"
        subtitle="Espelho de ponto e horas com base no cadastro do funcionário"
        icon="pi pi-stopwatch"
        :show-back="false"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              v-if="can('ponto_convite.criar')"
              variant="outline"
              @click="router.push('/rh/ponto/convites')"
            >
              <i class="pi pi-link mr-2"></i>
              Convites
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <!-- Filtros -->
        <div class="rounded-2xl border border-border-ui bg-bg-page/40 p-5 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div class="md:col-span-4">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Funcionário</label>
              <SearchInput
                v-model="filtros.funcionario_id"
                mode="select"
                placeholder="Selecione o funcionário..."
                :options="funcionarioOptions"
                labelKey="label"
                valueKey="value"
                @update:modelValue="buscar"
              />
            </div>
            <div class="md:col-span-2">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Início</label>
              <input
                v-model="filtros.data_ini"
                type="date"
                @change="buscar"
                class="w-full h-11 bg-bg-card border border-border-ui rounded-xl px-4 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>
            <div class="md:col-span-2">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Fim</label>
              <input
                v-model="filtros.data_fim"
                type="date"
                @change="buscar"
                class="w-full h-11 bg-bg-card border border-border-ui rounded-xl px-4 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>
            <div class="md:col-span-4 flex gap-2 justify-end flex-wrap">
              <Button
                variant="secondary"
                class="h-11 px-5 rounded-xl font-black text-[10px] uppercase"
                :loading="loadingPdf"
                :disabled="!filtros.funcionario_id || !filtros.data_ini"
                @click="gerarRelatorioMensal"
              >
                <i class="pi pi-file-pdf mr-2 text-xs"></i>
                PDF
              </Button>
              <button
                v-if="funcionarioSelecionado?.whatsapp"
                type="button"
                class="h-11 px-5 rounded-xl font-black text-[10px] uppercase bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                :disabled="!filtros.funcionario_id || !filtros.data_ini"
                @click="abrirWhatsComprovante"
              >
                <i class="pi pi-whatsapp text-xs"></i>
                Enviar comprovante WhatsApp
              </button>
            </div>
          </div>
        </div>

        <Loading v-if="loadingTabela && !rows.length" />

        <template v-else>
          <!-- Horário cadastrado do funcionário -->
          <div v-if="funcionarioSelecionado" class="mb-6">
            <div class="relative mb-4">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-bg-page px-4 text-[10px] font-black uppercase tracking-wider text-text-soft">
                  Horário do cadastro
                </span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-2">Segunda a Sexta</p>
                <div class="flex flex-wrap gap-3">
                  <span v-if="horarioSegSex" class="text-sm font-bold text-text-main tabular-nums">
                    {{ horarioSegSex }}
                  </span>
                  <span v-else class="text-sm text-text-soft italic">Não definido</span>
                </div>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-2">Sábado</p>
                <div class="flex flex-wrap gap-3">
                  <span v-if="horarioSabado" class="text-sm font-bold text-text-main tabular-nums">
                    {{ horarioSabado }}
                  </span>
                  <span v-else class="text-sm text-text-soft italic">Não definido</span>
                </div>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-2">Carga horária</p>
                <span class="text-sm font-bold text-text-main tabular-nums">{{ cargaHorariaLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Cards de resumo -->
          <div v-if="rows.length" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div class="rounded-xl border border-border-ui bg-bg-card p-4 flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <i class="pi pi-calendar text-brand-primary text-lg"></i>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Meta diária</p>
                <p class="text-lg font-black text-text-main tabular-nums">{{ resumo.metaDia.toFixed(2) }}h</p>
              </div>
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-card p-4 flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <i class="pi pi-stopwatch text-blue-600 text-lg"></i>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Trabalhado</p>
                <p class="text-lg font-black text-text-main tabular-nums">{{ resumo.totalHorasHHMM }}</p>
              </div>
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-card p-4 flex items-center gap-4">
              <div :class="resumo.totalSaldo >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'" class="w-11 h-11 rounded-xl flex items-center justify-center">
                <i :class="resumo.totalSaldo >= 0 ? 'pi pi-arrow-up text-emerald-600' : 'pi pi-arrow-down text-rose-600'" class="text-lg"></i>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Saldo</p>
                <p :class="resumo.totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'" class="text-lg font-black tabular-nums italic">
                  {{ resumo.totalSaldoHHMM }}
                </p>
              </div>
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-card p-4 flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                <i class="pi pi-dollar text-slate-600 text-lg"></i>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Custo/hora</p>
                <p class="text-sm font-black text-text-main tabular-nums">{{ formatCurrency(resumo.custoHora) }}</p>
              </div>
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-card p-4 flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <i class="pi pi-wallet text-brand-primary text-lg"></i>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-soft">Custo período</p>
                <p class="text-sm font-black text-text-main tabular-nums">{{ formatCurrency(resumo.custoTotal) }}</p>
              </div>
            </div>
          </div>

          <!-- Tabela espelho de ponto -->
          <div class="rounded-xl border border-border-ui bg-bg-card overflow-hidden">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center py-2">
                <span class="bg-bg-page px-4 text-[10px] font-black uppercase tracking-wider text-text-soft">
                  Espelho de ponto
                </span>
              </div>
            </div>

            <div v-if="!rows.length" class="p-12 text-center">
              <i class="pi pi-inbox text-4xl text-slate-300 mb-4"></i>
              <p class="text-sm font-bold text-text-soft uppercase">Selecione um funcionário e clique em Buscar</p>
              <p class="text-xs text-text-soft mt-1">Os registros serão exibidos conforme o horário cadastrado</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full min-w-[780px] border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800/50">
                    <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-text-soft">Data</th>
                    <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-text-soft">
                      Ent 1
                      <span v-if="funcionarioSelecionado?.horario_entrada_1" class="block text-[9px] font-normal text-slate-400 mt-0.5">({{ funcionarioSelecionado.horario_entrada_1 }})</span>
                    </th>
                    <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-text-soft">
                      Sai 1
                      <span v-if="funcionarioSelecionado?.horario_saida_1" class="block text-[9px] font-normal text-slate-400 mt-0.5">({{ funcionarioSelecionado.horario_saida_1 }})</span>
                    </th>
                    <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-text-soft">
                      Ent 2
                      <span v-if="funcionarioSelecionado?.horario_entrada_2" class="block text-[9px] font-normal text-slate-400 mt-0.5">({{ funcionarioSelecionado.horario_entrada_2 }})</span>
                    </th>
                    <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-text-soft">
                      Sai 2
                      <span v-if="funcionarioSelecionado?.horario_saida_2" class="block text-[9px] font-normal text-slate-400 mt-0.5">({{ funcionarioSelecionado.horario_saida_2 }})</span>
                    </th>
                    <th class="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-text-soft">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in rowsAgrupadas"
                    :key="row.data"
                    class="group border-t border-border-ui/60 hover:bg-bg-page/60 transition-colors"
                  >
                    <td class="px-5 py-3">
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-text-main">{{ fmtData(row.data) }}</span>
                        <span class="text-[10px] font-medium text-text-soft uppercase">{{ getDiaSemana(row.data) }}</span>
                      </div>
                    </td>
                    <td
                      v-for="col in ['ent1', 'sai1', 'ent2', 'sai2']"
                      :key="col"
                      class="px-4 py-3 text-center"
                    >
                      <div class="flex items-center justify-center gap-2 group/btn">
                        <span
                          class="tabular-nums font-bold text-sm min-w-[2.5rem]"
                          :class="[
                            row[col]?.hora
                              ? (col.startsWith('ent') ? 'text-blue-600' : 'text-slate-700')
                              : 'text-slate-300',
                            isFimDeSemanaErro(row.data, row[col]?.hora) ? 'text-rose-500' : ''
                          ]"
                        >
                          {{ row[col]?.hora || '--:--' }}
                        </span>
                        <div v-if="row[col]?.id" class="flex items-center opacity-0 group-hover/btn:opacity-100 transition-opacity gap-0.5">
                          <button
                            type="button"
                            @click="abrirComprovante(row[col].id)"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Comprovante PDF"
                          >
                            <i class="pi pi-file-pdf text-xs"></i>
                          </button>
                          <button
                            type="button"
                            @click="abrirComprovanteImagem(row[col].id, 'png')"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Comprovante PNG (imagem)"
                          >
                            <i class="pi pi-image text-xs"></i>
                          </button>
                          <button
                            type="button"
                            @click="abrirModalEditar(row[col])"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <i class="pi pi-pencil text-xs"></i>
                          </button>
                          <button
                            type="button"
                            @click="confirmarExcluirDireto(row[col].id)"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir"
                          >
                            <i class="pi pi-trash text-xs"></i>
                          </button>
                        </div>
                        <button
                          v-else
                          type="button"
                          @click="abrirModalNovoNaPosicao(row, col)"
                          class="opacity-0 group-hover/btn:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                          title="Adicionar"
                        >
                          <i class="pi pi-plus text-xs"></i>
                        </button>
                      </div>
                    </td>
                    <td class="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-8 px-3 rounded-lg text-[10px] font-bold uppercase"
                        @click="abrirModalJustificar(row)"
                      >
                        Justificar
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal Editar / Novo -->
    <div v-if="modalEditar.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-bg-card w-full max-w-md rounded-2xl overflow-hidden border border-border-ui">
        <div class="p-6 border-b border-border-ui flex justify-between items-center bg-bg-page/60">
          <h3 class="font-black text-text-main uppercase text-lg">{{ modalEditar.id ? 'Ajustar horário' : 'Novo horário' }}</h3>
          <button type="button" @click="modalEditar.open = false" class="p-2 text-text-soft hover:text-rose-500 rounded-lg transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data e hora</label>
            <input
              v-model="modalEditar.form.data_hora_local"
              type="datetime-local"
              class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Tipo</label>
            <select
              v-model="modalEditar.form.tipo"
              class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Observação</label>
            <input
              v-model="modalEditar.form.observacao"
              type="text"
              placeholder="Motivo do ajuste..."
              class="w-full h-11 rounded-xl px-4 text-sm font-medium bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30 placeholder:text-slate-400"
            />
          </div>
        </div>
        <div class="p-6 bg-bg-page/60 border-t border-border-ui flex gap-3">
          <Button variant="outline" class="flex-1" @click="modalEditar.open = false">Cancelar</Button>
          <Button variant="primary" class="flex-1" :loading="modalEditar.saving" @click="confirmarSalvarEdicao">
            Salvar
          </Button>
        </div>
      </div>
    </div>

    <!-- Modal Justificativa -->
    <div v-if="modalJust.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-bg-card w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border-ui">
        <div class="p-6 border-b border-border-ui flex justify-between items-center bg-bg-page/60">
          <div>
            <h3 class="font-black text-text-main uppercase text-lg">Justificativa</h3>
            <p class="text-[10px] font-bold text-text-soft uppercase mt-1">Data: {{ fmtData(modalJust.dia) }}</p>
          </div>
          <button type="button" @click="modalJust.open = false" class="p-2 text-text-soft hover:text-rose-500 rounded-lg transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="p-6 space-y-5 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Tipo (ex: Atestado)</label>
              <input
                v-model="modalJust.form.tipo"
                type="text"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data</label>
              <input
                v-model="modalJust.form.data"
                type="date"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Descrição</label>
            <textarea
              v-model="modalJust.form.descricao"
              rows="3"
              class="w-full rounded-xl p-4 text-sm font-medium bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-2">Anexo</label>
            <input ref="justificativaFileRef" type="file" class="hidden" accept="image/*,.pdf,.doc,.docx" @change="onJustificativaFilePick" />
            <div
              @click="justificativaFileRef?.click()"
              class="border-2 border-dashed border-border-ui rounded-xl p-4 cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <i class="pi pi-cloud-upload"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-text-main truncate">{{ justificativaArquivoNome || 'Clique para selecionar (PDF, imagem, doc)' }}</p>
                </div>
              </div>
              <button
                v-if="justificativaArquivoNome"
                type="button"
                @click.stop="limparJustificativaArquivo"
                class="shrink-0 w-9 h-9 rounded-xl border border-border-ui text-text-soft hover:text-rose-500 flex items-center justify-center"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="p-6 bg-bg-page/60 border-t border-border-ui flex gap-3">
          <Button variant="outline" class="flex-1" @click="modalJust.open = false">Fechar</Button>
          <Button variant="primary" class="flex-1" :loading="modalJust.saving" @click="confirmarSalvarJustificativa">
            Lançar justificativa
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PontoRelatorioService,
  PontoJustificativasService,
  PontoRegistrosService,
} from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { consolidarSaldoPeriodo, derivarCargaDosHorarios } from '@/utils/utils'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { listDays, groupRegistrosByDia } from '@/utils/ponto'
import { onlyNumbers } from '@/utils/masks'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()
const loadingTabela = ref(false)
const loadingPdf = ref(false)
const rows = ref([])
const funcionarioOptions = ref([])
const funcionarios = ref([])

const filtros = reactive({ funcionario_id: '', data_ini: '', data_fim: '' })

const rowsFiltrados = computed(() => {
  return (rows.value || []).filter((r) => {
    const dia = new Date(r.data_hora).getDay()
    return dia !== 0
  })
})

const registrosPorDia = computed(() => groupRegistrosByDia(rowsFiltrados.value))

const funcionarioSelecionado = computed(() => {
  const id = Number(filtros.funcionario_id || 0)
  return funcionarios.value.find((f) => Number(f.id) === id) || null
})

const horarioSegSex = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f) return ''
  const e1 = f.horario_entrada_1 || '--:--'
  const s1 = f.horario_saida_1 || '--:--'
  const e2 = f.horario_entrada_2 || '--:--'
  const s2 = f.horario_saida_2 || '--:--'
  const turno1 = `${e1} - ${s1}`
  const turno2 = e2 || s2 ? `${e2} - ${s2}` : null
  return turno2 ? `${turno1} / ${turno2}` : turno1
})

const horarioSabado = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f?.horario_sabado_entrada_1 && !f?.horario_sabado_saida_1) return ''
  const e = f.horario_sabado_entrada_1 || '--:--'
  const s = f.horario_sabado_saida_1 || '--:--'
  return `${e} - ${s}`
})

const cargaHorariaLabel = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f) return '-'
  const derivado = derivarCargaDosHorarios(f)
  const dia = Number(f.carga_horaria_dia || 0)
  const sem = Number(f.carga_horaria_semana || 0)
  if (derivado.cargaSegSex > 0 || derivado.cargaSabado > 0) {
    const parts = []
    if (derivado.cargaSegSex > 0) parts.push(`${derivado.cargaSegSex.toFixed(1)}h (Seg–Sex)`)
    if (derivado.cargaSabado > 0) parts.push(`${derivado.cargaSabado.toFixed(1)}h (Sáb)`)
    return parts.join(' / ')
  }
  if (dia > 0) return `${dia}h/dia`
  if (sem > 0) return `${sem}h/semana`
  return 'Não definido'
})

const metricasFuncionario = computed(() => {
  const f = funcionarioSelecionado.value || {}
  return { custoHora: Number(f?.custo_hora || 0), funcionario: f }
})

const resumo = computed(() => {
  const m = metricasFuncionario.value
  const base = consolidarSaldoPeriodo({
    registros: rowsFiltrados.value,
    funcionario: m.funcionario || undefined,
    horasSemana: 48,
    diasSemana: 6,
  })
  const custoTotal = Number((base.totalHoras * m.custoHora).toFixed(2))
  return { ...base, custoHora: m.custoHora, custoTotal }
})

const modalEditar = reactive({
  open: false,
  saving: false,
  id: null,
  form: { funcionario_id: null, data_hora_local: '', tipo: 'ENTRADA', observacao: '' },
})

const modalJust = reactive({
  open: false,
  saving: false,
  dia: '',
  form: { funcionario_id: null, data: '', tipo: '', descricao: '', arquivo_id: null },
})

const justificativaFileRef = ref(null)
const justificativaFileToUpload = ref(null)
const justificativaArquivoNome = ref('')

const fmtData = (v) => (v ? v.split('-').reverse().join('/') : '-')
/** Formato para input datetime-local em America/Sao_Paulo (YYYY-MM-DDTHH:mm) */
const toDateTimeLocalBR = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const timeStr = d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${dateStr}T${timeStr}`
}
const fmtHoraLocal = (iso) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
const getDiaSemana = (dataStr) => {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const data = new Date(dataStr + 'T12:00:00')
  return dias[data.getDay()]
}
const getMesAnoReferencia = () => {
  const base = filtros.data_ini || new Date().toISOString().slice(0, 10)
  const [y, m] = String(base).split('-').map(Number)
  return { mes: m, ano: y }
}
const isFimDeSemanaErro = (dataStr, horaStr) => {
  if (!horaStr) return false
  const data = new Date(dataStr + 'T12:00:00')
  const [h, m] = horaStr.split(':').map(Number)
  return data.getDay() === 6 && (h > 12 || (h === 12 && m > 0))
}
const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const rowsAgrupadas = computed(() => {
  if (!filtros.data_ini || !filtros.data_fim) return []
  const dias = listDays(filtros.data_ini, filtros.data_fim).filter((dia) => {
    const d = new Date(dia + 'T12:00:00')
    return d.getDay() !== 0
  })
  const map = registrosPorDia.value
  return dias
    .map((dia) => {
      const regsDia = (map.get(dia) || [])
        .filter((r) => r.status === 'ATIVO')
        .slice()
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
      const batidas = regsDia.map((reg) => ({
        id: reg.id,
        hora: fmtHoraLocal(reg.data_hora),
        tipo: reg.tipo,
        data_hora: reg.data_hora,
        observacao: reg.observacao,
      }))
      const entradas = batidas.filter((b) => b.tipo === 'ENTRADA')
      const saidas = batidas.filter((b) => b.tipo === 'SAIDA')
      return {
        data: dia,
        funcionario_id: filtros.funcionario_id,
        ent1: entradas[0],
        sai1: saidas[0],
        ent2: entradas[1],
        sai2: saidas[1],
      }
    })
    .sort((a, b) => b.data.localeCompare(a.data))
})

async function buscar() {
  if (!filtros.funcionario_id) {
    rows.value = []
    return
  }
  try {
    loadingTabela.value = true
    const { data } = await PontoRelatorioService.listarRegistros({ ...filtros })
    rows.value = data || []
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao buscar')
  } finally {
    loadingTabela.value = false
  }
}

async function gerarRelatorioMensal() {
  if (!filtros.funcionario_id) return notify.warn('Selecione um funcionário')
  const { mes, ano } = getMesAnoReferencia()
  const funcionario_id = Number(String(filtros.funcionario_id).replace(/\D/g, ''))
  try {
    loadingPdf.value = true
    const res = await PontoRelatorioService.pdfMensalSalvar({ funcionario_id, mes, ano })
    const data = res?.data ?? res
    const arquivoId = data?.arquivoId ?? data?.data?.arquivoId
    if (arquivoId) {
      router.push(`/arquivos/${arquivoId}?name=RELATORIO_PONTO_${String(mes).padStart(2, '0')}_${ano}&type=application/pdf`)
      notify.success('PDF gerado.')
    } else {
      await abrirPdfViaBlob(funcionario_id, mes, ano)
    }
  } catch (e) {
    console.error('[PONTO PDF]', e?.response?.data || e)
    notify.warn(e?.response?.data?.message || 'Erro ao gerar PDF. Abrindo via stream...')
    await abrirPdfViaBlob(funcionario_id, mes, ano)
  } finally {
    loadingPdf.value = false
  }
}

async function abrirPdfViaBlob(funcionario_id, mes, ano) {
  try {
    const res = await PontoRelatorioService.pdfMensal({ funcionario_id, mes, ano })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    console.error('[PONTO PDF blob]', e)
    notify.error(e?.response?.data?.message || 'Não foi possível abrir o PDF.')
  }
}

async function abrirComprovante(registroId) {
  if (!registroId) return
  try {
    const res = await PontoRelatorioService.comprovantePdf(registroId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    console.error('[PONTO COMPROVANTE]', e)
    notify.error(e?.response?.data?.message || 'Não foi possível abrir o comprovante.')
  }
}

async function abrirComprovanteImagem(registroId, formato = 'png') {
  if (!registroId) return
  try {
    const res = await PontoRelatorioService.comprovanteImagem(registroId, formato)
    const mime = formato === 'jpeg' || formato === 'jpg' ? 'image/jpeg' : 'image/png'
    const blob = new Blob([res.data], { type: mime })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    console.error('[PONTO COMPROVANTE IMAGEM]', e)
    notify.error(e?.response?.data?.message || 'Não foi possível gerar a imagem.')
  }
}

function abrirWhatsComprovante() {
  const f = funcionarioSelecionado.value
  if (!f?.whatsapp) {
    notify.warn('Funcionário sem WhatsApp cadastrado.')
    return
  }
  const num = onlyNumbers(String(f.whatsapp))
  if (num.length < 10) {
    notify.warn('Número de WhatsApp inválido.')
    return
  }
  const numeroWa = num.startsWith('55') ? num : `55${num}`
  const dataIni = filtros.data_ini ? fmtData(filtros.data_ini) : '-'
  const dataFim = filtros.data_fim ? fmtData(filtros.data_fim) : '-'
  const nome = String(f.nome || '').trim() || 'Colaborador'
  const msg =
`Olá ${nome}!

Resumo do seu ponto:
Período: ${dataIni} a ${dataFim}
Horas trabalhadas: ${resumo.value.totalHorasHHMM}
Saldo: ${resumo.value.totalSaldoHHMM}

Acesse o sistema para o espelho completo.`
  const url = `https://wa.me/${numeroWa}?text=${encodeURIComponent(msg)}`

  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ ?? window.__TAURI_INTERNALS__)
  if (isTauri) {
    try {
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (tauri?.opener?.open) {
        tauri.opener.open(url)
        return
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        tauri.opener.openUrl(url)
        return
      }
      if (tauri?.shell?.open) {
        tauri.shell.open(url)
        return
      }
    } catch (e) {
      console.error('[PONTO_WHATS_TAURI]', e)
    }
  }
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) return
  } catch {}
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    return
  } catch {}
  window.location.href = url
}

async function confirmarExcluirDireto(id) {
  if (!(await confirm.show('Excluir', 'Deseja apagar este registro?'))) return
  try {
    await PontoRegistrosService.remover(id)
    notify.success('Apagado!')
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao excluir')
  }
}

function abrirModalNovoNaPosicao(row, coluna) {
  const f = funcionarioSelecionado.value
  const h = {
    ent1: f?.horario_entrada_1 || '07:30',
    sai1: f?.horario_saida_1 || '12:00',
    ent2: f?.horario_entrada_2 || '13:30',
    sai2: f?.horario_saida_2 || '17:30',
  }
  Object.assign(modalEditar, {
    open: true,
    id: null,
    form: {
      funcionario_id: filtros.funcionario_id,
      data_hora_local: `${row.data}T${h[coluna]}`,
      tipo: coluna.startsWith('ent') ? 'ENTRADA' : 'SAIDA',
      observacao: 'AJUSTE MANUAL',
    },
  })
}

function abrirModalEditar(batida) {
  Object.assign(modalEditar, {
    open: true,
    id: batida.id,
    form: {
      funcionario_id: filtros.funcionario_id,
      data_hora_local: toDateTimeLocalBR(batida.data_hora),
      tipo: batida.tipo,
      observacao: batida.observacao || '',
    },
  })
}

async function confirmarSalvarEdicao() {
  try {
    modalEditar.saving = true
    const payload = {
        funcionario_id: Number(modalEditar.form.funcionario_id),
        tipo: modalEditar.form.tipo,
        observacao: modalEditar.form.observacao || null,
        data_hora: `${modalEditar.form.data_hora_local}:00-03:00`,
      }
    if (modalEditar.id) {
      await PontoRegistrosService.atualizar(modalEditar.id, payload)
    } else {
      await PontoRegistrosService.salvar(payload)
    }
    notify.success('Sucesso!')
    modalEditar.open = false
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar')
  } finally {
    modalEditar.saving = false
  }
}

function onJustificativaFilePick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return
  justificativaFileToUpload.value = file
  justificativaArquivoNome.value = file.name
}

function limparJustificativaArquivo() {
  justificativaFileToUpload.value = null
  justificativaArquivoNome.value = ''
  if (justificativaFileRef.value) justificativaFileRef.value.value = ''
  modalJust.form.arquivo_id = null
}

function abrirModalJustificar(row) {
  limparJustificativaArquivo()
  Object.assign(modalJust, {
    open: true,
    dia: row.data,
    form: { funcionario_id: filtros.funcionario_id, data: row.data, tipo: '', descricao: '', arquivo_id: null },
  })
}

async function confirmarSalvarJustificativa() {
  try {
    modalJust.saving = true
    const form = { ...modalJust.form }
    const funcionario_id = Number(String(form.funcionario_id || '').replace(/\D/g, ''))
    if (justificativaFileToUpload.value && funcionario_id) {
      const { data } = await ArquivosService.upload({
        ownerType: 'FUNCIONARIO',
        ownerId: funcionario_id,
        file: justificativaFileToUpload.value,
        categoria: 'JUSTIFICATIVA_PONTO',
        slot_key: form.data,
      })
      if (data?.id) form.arquivo_id = data.id
    }
    await PontoJustificativasService.salvar(form)
    notify.success('Justificativa salva!')
    modalJust.open = false
    limparJustificativaArquivo()
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar')
  } finally {
    modalJust.saving = false
  }
}

onMounted(async () => {
  const hoje = new Date()
  filtros.data_ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  filtros.data_fim = hoje.toISOString().slice(0, 10)
  try {
    const { data } = await PontoRelatorioService.listarFuncionariosAtivos()
    const lista = data?.data || data || []
    funcionarios.value = Array.isArray(lista) ? lista : []
    funcionarioOptions.value = funcionarios.value.map((f) => ({
      label: `${String(f.nome || '').toUpperCase()} #${f.id}`,
      value: f.id,
    }))
  } catch (e) {
    funcionarios.value = []
    funcionarioOptions.value = []
    notify.error('Não foi possível carregar funcionários.')
  }
})
</script>
