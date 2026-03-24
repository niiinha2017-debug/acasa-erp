<template>
  <PageShell :padded="false">
    <section class="ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Plano de Corte Pro"
        subtitle="Novo modulo isolado estilo Mobcloud: importacao, otimizacao avancada e mapa visual."
        icon="pi pi-sitemap"
      >
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" type="button" @click="router.push('/plano-corte')">
              Fluxo legado
            </Button>
            <Button variant="secondary" size="sm" type="button" @click="aplicarExemplo">
              Carregar exemplo
            </Button>
            <Button variant="primary" size="sm" type="button" @click="otimizar">
              Otimizar corte
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 pb-6 md:px-6 lg:px-8 space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="ds-shell-card p-4 space-y-3">
            <h3 class="text-xs font-black uppercase tracking-wider text-text-soft">Chapa base</h3>
            <Input v-model="form.chapa_largura_mm" type="number" label="Largura (mm)" />
            <Input v-model="form.chapa_altura_mm" type="number" label="Altura (mm)" />
            <Input v-model="form.chapa_quantidade" type="number" label="Quantidade de chapas" />
            <Input v-model="form.kerf_mm" type="number" label="Kerf / espessura serra (mm)" />
            <Input v-model="form.sobra_min_largura_mm" type="number" label="Sobra minima largura (mm)" />
            <Input v-model="form.sobra_min_altura_mm" type="number" label="Sobra minima altura (mm)" />
            <label class="flex items-center gap-2 text-sm text-text-main">
              <input v-model="form.permitir_rotacao" type="checkbox" />
              Permitir rotacao das pecas
            </label>
          </div>

          <div class="lg:col-span-2 ds-shell-card p-4 space-y-3">
            <h3 class="text-xs font-black uppercase tracking-wider text-text-soft">Importacao rapida (CSV)</h3>
            <p class="text-xs text-text-soft">
              Formato por linha: <code>nome;largura_mm;altura_mm;quantidade</code>
            </p>
            <textarea
              v-model="csvInput"
              class="w-full min-h-[120px] rounded-xl border border-border-ui bg-bg-page p-3 text-sm"
              placeholder="Lateral Armario;550;2400;8"
            />
            <div class="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" @click="importarCsv">Importar CSV</Button>
              <Button variant="ghost" size="sm" @click="csvInput = ''">Limpar CSV</Button>
            </div>
          </div>
        </div>

        <div class="ds-shell-card p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs font-black uppercase tracking-wider text-text-soft">Chapas para corte</h3>
            <Button size="sm" variant="secondary" @click="adicionarChapa">Adicionar chapa</Button>
          </div>
          <Table :columns="columnsChapas" :rows="chapas" empty-text="Nenhuma chapa cadastrada." :boxed="false" :flush="false">
            <template #cell-codigo="{ row }">
              <Input v-model="row.codigo" type="text" />
            </template>
            <template #cell-material="{ row }">
              <Input v-model="row.material" type="text" />
            </template>
            <template #cell-largura_mm="{ row }">
              <Input v-model="row.largura_mm" type="number" />
            </template>
            <template #cell-altura_mm="{ row }">
              <Input v-model="row.altura_mm" type="number" />
            </template>
            <template #cell-quantidade="{ row }">
              <Input v-model="row.quantidade" type="number" />
            </template>
            <template #cell-acoes="{ index }">
              <Button size="sm" variant="ghost" @click="removerChapa(index)">Remover</Button>
            </template>
          </Table>
        </div>

        <div class="ds-shell-card p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs font-black uppercase tracking-wider text-text-soft">Pecas do projeto</h3>
            <Button size="sm" variant="secondary" @click="adicionarPeca">Adicionar peca</Button>
          </div>
          <Table :columns="columnsPecas" :rows="pecas" empty-text="Nenhuma peca adicionada." :boxed="false" :flush="false">
            <template #cell-nome="{ row }">
              <Input v-model="row.nome" type="text" />
            </template>
            <template #cell-largura_mm="{ row }">
              <Input v-model="row.largura_mm" type="number" />
            </template>
            <template #cell-altura_mm="{ row }">
              <Input v-model="row.altura_mm" type="number" />
            </template>
            <template #cell-quantidade="{ row }">
              <Input v-model="row.quantidade" type="number" />
            </template>
            <template #cell-acoes="{ index }">
              <Button size="sm" variant="ghost" @click="removerPeca(index)">Remover</Button>
            </template>
          </Table>
        </div>

        <div v-if="resultado" class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="ds-shell-card p-3">
            <p class="text-[10px] uppercase tracking-wider text-text-soft font-black">Aproveitamento</p>
            <p class="text-xl font-black text-text-main">{{ resultado.resumo.aproveitamento_pct }}%</p>
          </div>
          <div class="ds-shell-card p-3">
            <p class="text-[10px] uppercase tracking-wider text-text-soft font-black">Pecas alocadas</p>
            <p class="text-xl font-black text-text-main">{{ resultado.resumo.pecas_alocadas }}/{{ resultado.resumo.pecas_total }}</p>
          </div>
          <div class="ds-shell-card p-3">
            <p class="text-[10px] uppercase tracking-wider text-text-soft font-black">Sobras uteis</p>
            <p class="text-xl font-black text-text-main">{{ resultado.sobras.length }}</p>
          </div>
          <div class="ds-shell-card p-3">
            <p class="text-[10px] uppercase tracking-wider text-text-soft font-black">Area alocada</p>
            <p class="text-xl font-black text-text-main">{{ resultado.resumo.area_alocada_m2 }} m2</p>
          </div>
        </div>

        <div v-if="resultado" class="ds-shell-card p-4 space-y-4">
          <h3 class="text-xs font-black uppercase tracking-wider text-text-soft">Mapa visual das chapas</h3>
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div v-for="chapa in resultado.chapas" :key="chapa.id" class="rounded-xl border border-border-ui p-3 space-y-2">
              <p class="text-xs font-black text-text-main uppercase">Chapa #{{ chapa.id }} ({{ chapa.largura_mm }}x{{ chapa.altura_mm }}mm)</p>
              <div class="sheet-canvas-wrap">
                <canvas
                  :ref="(el) => setCanvasRef(chapa.id, el)"
                  class="sheet-canvas"
                  :aria-label="`Chapa ${chapa.id}`"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="resultado" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div class="ds-shell-card p-4">
            <h3 class="text-xs font-black uppercase tracking-wider text-text-soft mb-2">Lista de corte</h3>
            <Table :columns="columnsLista" :rows="resultado.lista_corte" :boxed="false" :flush="false" empty-text="Sem itens.">
              <template #cell-chapa_id="{ row }">#{{ row.chapa_id }}</template>
            </Table>
          </div>
          <div class="ds-shell-card p-4">
            <h3 class="text-xs font-black uppercase tracking-wider text-text-soft mb-2">Controle de sobras</h3>
            <Table :columns="columnsSobras" :rows="resultado.sobras" :boxed="false" :flush="false" empty-text="Sem sobras uteis.">
              <template #cell-chapa_id="{ row }">#{{ row.chapa_id }}</template>
            </Table>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import { otimizarPlanoCorte } from '@/utils/plano-corte-optimizer'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const csvInput = ref('')
const resultado = ref(null)
const canvasRefs = ref({})

const form = ref({
  chapa_largura_mm: 2750,
  chapa_altura_mm: 1850,
  chapa_quantidade: 10,
  kerf_mm: 3,
  permitir_rotacao: true,
  sobra_min_largura_mm: 120,
  sobra_min_altura_mm: 120,
})

const pecas = ref([])
const chapas = ref([])

const columnsPecas = [
  { key: 'nome', label: 'Nome' },
  { key: 'largura_mm', label: 'Largura (mm)', width: '18%' },
  { key: 'altura_mm', label: 'Altura (mm)', width: '18%' },
  { key: 'quantidade', label: 'Qtd', width: '14%' },
  { key: 'acoes', label: 'Acoes', width: '12%', align: 'center' },
]

const columnsChapas = [
  { key: 'codigo', label: 'Codigo', width: '16%' },
  { key: 'material', label: 'Material', width: '20%' },
  { key: 'largura_mm', label: 'Largura (mm)', width: '16%' },
  { key: 'altura_mm', label: 'Altura (mm)', width: '16%' },
  { key: 'quantidade', label: 'Qtd', width: '12%' },
  { key: 'acoes', label: 'Acoes', width: '12%', align: 'center' },
]

const columnsLista = [
  { key: 'chapa_id', label: 'Chapa', width: '14%' },
  { key: 'ordem', label: 'Ordem', width: '14%' },
  { key: 'nome', label: 'Peca' },
  { key: 'largura_mm', label: 'Largura' },
  { key: 'altura_mm', label: 'Altura' },
]

const columnsSobras = [
  { key: 'chapa_id', label: 'Chapa', width: '14%' },
  { key: 'largura_mm', label: 'Largura', width: '20%' },
  { key: 'altura_mm', label: 'Altura', width: '20%' },
  { key: 'area_m2', label: 'Area (m2)' },
]

function adicionarPeca() {
  pecas.value.push({
    id: `P${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    nome: '',
    largura_mm: '',
    altura_mm: '',
    quantidade: 1,
  })
}

function adicionarChapa() {
  chapas.value.push({
    id: `CH${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    codigo: '',
    material: '',
    largura_mm: form.value.chapa_largura_mm,
    altura_mm: form.value.chapa_altura_mm,
    quantidade: 1,
  })
}

function removerChapa(index) {
  chapas.value.splice(index, 1)
}

function removerPeca(index) {
  pecas.value.splice(index, 1)
}

function importarCsv() {
  const linhas = String(csvInput.value || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (!linhas.length) return notify.warn('Cole um CSV antes de importar.')

  const imported = []
  for (const linha of linhas) {
    const parts = linha.split(';').map((p) => p.trim())
    if (parts.length < 4) continue
    imported.push({
      id: `C${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: parts[0] || 'Peca',
      largura_mm: Number(parts[1] || 0),
      altura_mm: Number(parts[2] || 0),
      quantidade: Number(parts[3] || 0),
    })
  }
  if (!imported.length) return notify.error('Nenhuma linha valida no CSV.')
  pecas.value.push(...imported)
  notify.success(`${imported.length} linha(s) importada(s).`)
}

function aplicarExemplo() {
  chapas.value = [
    { id: 'CH-1', codigo: 'CH-MDF-18-BR', material: 'MDF 18 BRANCO TX', largura_mm: 2750, altura_mm: 1850, quantidade: 8 },
  ]
  pecas.value = [
    { id: 'EX-1', nome: 'Lateral Armario', largura_mm: 550, altura_mm: 2400, quantidade: 6 },
    { id: 'EX-2', nome: 'Prateleira', largura_mm: 550, altura_mm: 400, quantidade: 14 },
    { id: 'EX-3', nome: 'Porta', largura_mm: 450, altura_mm: 2200, quantidade: 8 },
    { id: 'EX-4', nome: 'Fundo', largura_mm: 900, altura_mm: 600, quantidade: 5 },
  ]
}

function otimizar() {
  if (!pecas.value.length) return notify.warn('Adicione pecas antes de otimizar.')
  if (!chapas.value.length) return notify.warn('Cadastre ao menos uma chapa para corte.')

  const chapasValidas = chapas.value.filter((c) => Number(c.largura_mm) > 0 && Number(c.altura_mm) > 0 && Number(c.quantidade) > 0)
  if (!chapasValidas.length) return notify.warn('As chapas cadastradas estao invalidas.')

  const larguraRef = Number(chapasValidas[0].largura_mm)
  const alturaRef = Number(chapasValidas[0].altura_mm)
  const dimensaoMista = chapasValidas.some((c) => Number(c.largura_mm) !== larguraRef || Number(c.altura_mm) !== alturaRef)
  if (dimensaoMista) {
    return notify.warn('Por enquanto o otimizador usa um tamanho de chapa por vez. Deixe as chapas com mesma dimensao neste projeto.')
  }

  const qtdTotal = chapasValidas.reduce((acc, c) => acc + Number(c.quantidade || 0), 0)
  resultado.value = otimizarPlanoCorte({
    ...form.value,
    chapa_largura_mm: larguraRef,
    chapa_altura_mm: alturaRef,
    chapa_quantidade: qtdTotal,
    pecas: pecas.value,
  })
  notify.success('Plano de corte otimizado.')
  nextTick(() => desenharChapasNoCanvas())
}

function setCanvasRef(chapaId, el) {
  if (!el) return
  canvasRefs.value[chapaId] = el
}

function corPorIndice(idx) {
  const cores = ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#67e8f9', '#f9a8d4']
  return cores[idx % cores.length]
}

function desenharChapasNoCanvas() {
  const chapas = resultado.value?.chapas || []
  for (const chapa of chapas) {
    const canvas = canvasRefs.value[chapa.id]
    if (!canvas) continue

    const largura = Number(chapa.largura_mm || 1)
    const altura = Number(chapa.altura_mm || 1)

    const maxW = 540
    const escala = Math.min(maxW / largura, 0.32)
    const canvasW = Math.max(260, Math.floor(largura * escala))
    const canvasH = Math.max(180, Math.floor(altura * escala))

    canvas.width = canvasW
    canvas.height = canvasH

    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    ctx.clearRect(0, 0, canvasW, canvasH)

    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, canvasW, canvasH)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, canvasW - 1, canvasH - 1)

    chapa.colocacoes.forEach((item, idx) => {
      const x = (Number(item.x || 0) / largura) * canvasW
      const y = (Number(item.y || 0) / altura) * canvasH
      const w = (Number(item.largura_mm || 0) / largura) * canvasW
      const h = (Number(item.altura_mm || 0) / altura) * canvasH

      ctx.fillStyle = corPorIndice(idx)
      ctx.globalAlpha = 0.55
      ctx.fillRect(x, y, w, h)
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, w, h)

      if (w >= 42 && h >= 16) {
        ctx.fillStyle = '#0f172a'
        ctx.font = '10px sans-serif'
        ctx.fillText(String(item.nome || ''), x + 4, y + 12)
      }
    })
  }
}

watch(
  () => resultado.value,
  async () => {
    await nextTick()
    desenharChapasNoCanvas()
  },
)
</script>

<style scoped>
.sheet-canvas-wrap {
  width: 100%;
  min-height: 220px;
  border: 1px solid var(--ds-color-border-ui);
  border-radius: 0.75rem;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.sheet-canvas {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 0.5rem;
}
</style>
