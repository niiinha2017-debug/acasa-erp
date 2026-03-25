<template>
  <PageShell :padded="false">
    <section class="migracao ds-page-context animate-page-in">
      <PageHeader
        title="Importar do Google Drive"
        subtitle="Migre suas pastas de clientes do Drive direto para o ERP"
        icon="pi pi-cloud-download"
      />

      <div class="migracao__body">

        <!-- ── PASSO 1: Upload do ZIP ──────────────────────────────────── -->
        <div class="migracao__step" :class="{ 'is-done': etapa > 1 }">
          <div class="migracao__step-header">
            <span class="migracao__step-num">1</span>
            <div>
              <div class="migracao__step-title">Baixar e enviar o ZIP do Drive</div>
              <div class="migracao__step-desc">
                No Google Drive, selecione a pasta <strong>CLIENTES</strong> → botão direito →
                <strong>Fazer download</strong>. Depois envie o arquivo .zip aqui.
              </div>
            </div>
          </div>

          <!-- input fora do dropzone para evitar bloqueio do WebView2 -->
          <input
            id="zip-input"
            type="file"
            style="position:fixed;top:-9999px;left:-9999px;opacity:0;width:1px;height:1px"
            @change="onFileChange"
          />

          <div
            class="migracao__dropzone"
            :class="{ 'is-over': arrastando, 'is-selected': arquivoSelecionado }"
            @dragover.prevent="arrastando = true"
            @dragleave="arrastando = false"
            @drop.prevent="onDrop"
            @click="abrirSeletor"
          >
            <template v-if="!arquivoSelecionado">
              <i class="pi pi-upload migracao__dropzone-icon"></i>
              <span class="migracao__dropzone-label">
                Arraste o ZIP aqui ou <u>clique para selecionar</u>
              </span>
              <span class="migracao__dropzone-hint">Aceita arquivos .zip do Google Drive</span>
            </template>

            <template v-else>
              <i class="pi pi-file-arrow-up migracao__dropzone-icon is-selected"></i>
              <span class="migracao__dropzone-label">{{ arquivoSelecionado.name }}</span>
              <span class="migracao__dropzone-hint">
                {{ formatBytes(arquivoSelecionado.size) }} · clique para trocar o arquivo
              </span>
            </template>
          </div>

          <div class="migracao__step-actions">
            <label class="migracao__toggle">
              <input v-model="extrairDados" type="checkbox" />
              <span>Extrair dados dos documentos automaticamente (CPF, valor, endereço)</span>
            </label>

            <Button
              variant="primary"
              :disabled="!arquivoSelecionado || carregandoPreview"
              @click="gerarPreview"
            >
              <i v-if="carregandoPreview" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-eye"></i>
              {{ carregandoPreview ? 'Analisando...' : 'Analisar arquivo' }}
            </Button>
          </div>
        </div>

        <!-- ── PASSO 2: Preview dos clientes encontrados ──────────────── -->
        <div v-if="preview" class="migracao__step" :class="{ 'is-done': etapa > 2 }">
          <div class="migracao__step-header">
            <span class="migracao__step-num">2</span>
            <div>
              <div class="migracao__step-title">Confirmar o que será importado</div>
              <div class="migracao__step-desc">
                Foram encontrados <strong>{{ preview.total_clientes }}</strong>
                {{ preview.total_clientes === 1 ? 'cliente' : 'clientes' }} no ZIP.
                Revise antes de importar.
              </div>
            </div>
          </div>

          <!-- Erros do preview -->
          <div v-if="preview.erros?.length" class="migracao__alertas">
            <div v-for="(e, i) in preview.erros" :key="i" class="migracao__alerta migracao__alerta--warn">
              <i class="pi pi-exclamation-triangle"></i> {{ e }}
            </div>
          </div>

          <!-- Diagnóstico de leitura do ZIP -->
          <div v-if="preview.diagnostico_leitura" class="migracao__diag">
            <div class="migracao__diag-title">
              <i class="pi pi-info-circle"></i>
              Diagnóstico da leitura do ZIP
            </div>
            <div class="migracao__diag-grid">
              <div class="migracao__diag-item">
                <div class="migracao__diag-label">Entradas no ZIP</div>
                <div class="migracao__diag-value">{{ preview.diagnostico_leitura.total_entries ?? 0 }}</div>
              </div>
              <div class="migracao__diag-item">
                <div class="migracao__diag-label">Arquivos no ZIP</div>
                <div class="migracao__diag-value">{{ preview.diagnostico_leitura.total_arquivos ?? 0 }}</div>
              </div>
              <div class="migracao__diag-item">
                <div class="migracao__diag-label">Arquivos lidos</div>
                <div class="migracao__diag-value">{{ preview.diagnostico_leitura.arquivos_lidos ?? 0 }}</div>
              </div>
              <div class="migracao__diag-item">
                <div class="migracao__diag-label">Arquivos ignorados</div>
                <div class="migracao__diag-value">{{ preview.diagnostico_leitura.arquivos_ignorados ?? 0 }}</div>
              </div>
            </div>
            <div
              v-if="Object.keys(preview.diagnostico_leitura.ignorados_por_motivo || {}).length"
              class="migracao__diag-motivos"
            >
              <button
                v-for="(qtd, motivo) in preview.diagnostico_leitura.ignorados_por_motivo"
                :key="motivo"
                type="button"
                class="migracao__badge migracao__badge--file migracao__diag-motivo-btn"
                @click="motivoSelecionado = motivoSelecionado === motivo ? null : motivo"
              >
                {{ motivoIgnoradoLabel(motivo) }}: {{ qtd }}
              </button>
            </div>
            <div
              v-if="motivoSelecionado && preview.diagnostico_leitura.exemplos_ignorados?.[motivoSelecionado]?.length"
              class="migracao__diag-exemplos"
            >
              <div class="migracao__diag-exemplos-title">
                Exemplos ignorados — {{ motivoIgnoradoLabel(motivoSelecionado) }}
              </div>
              <ul class="migracao__diag-exemplos-list">
                <li
                  v-for="(caminho, idx) in preview.diagnostico_leitura.exemplos_ignorados[motivoSelecionado]"
                  :key="`${motivoSelecionado}-${idx}`"
                  class="migracao__diag-exemplo-item"
                  :title="caminho"
                >
                  {{ caminho }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Tabela de clientes -->
          <div class="migracao__table-wrap">
            <table class="migracao__table">
              <thead>
                <tr>
                  <th>Cliente (pasta Drive)</th>
                  <th>Pasta de origem</th>
                  <th>Status no ERP</th>
                  <th>Arquivos</th>
                  <th>Dados extraídos</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(c, i) in preview.clientes"
                  :key="i"
                  class="migracao__table-row"
                >
                  <td>
                    <div class="migracao__cliente-nome">
                      <div class="migracao__initials">
                        {{ String(c.nome_cliente || '?').substring(0, 2).toUpperCase() }}
                      </div>
                      <div>
                        <div class="migracao__primary">{{ c.nome_cliente }}</div>
                        <div class="migracao__secondary">{{ c.nome_drive }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="migracao__badge migracao__badge--drive">
                      {{ c.status_drive }}
                    </span>
                  </td>
                  <td>
                    <span class="migracao__badge" :class="statusClass(c.status_erp)">
                      {{ statusLabel(c.status_erp) }}
                    </span>
                  </td>
                  <td>
                    <div class="migracao__arquivos-grid">
                      <span
                        v-for="(qtd, cat) in c.arquivos_por_categoria"
                        :key="cat"
                        class="migracao__badge migracao__badge--file"
                      >
                        {{ catLabel(cat) }}: {{ qtd }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <template v-if="c.dados_extraidos">
                      <div v-if="c.dados_extraidos.valor_contrato" class="migracao__secondary">
                        💰 {{ formatBRL(c.dados_extraidos.valor_contrato) }}
                      </div>
                      <div v-if="c.dados_extraidos.data_fechamento" class="migracao__secondary">
                        📅 {{ formatData(c.dados_extraidos.data_fechamento) }}
                      </div>
                      <div v-if="c.dados_extraidos.ambientes?.length" class="migracao__secondary">
                        🏠 {{ c.dados_extraidos.ambientes.join(', ') }}
                      </div>
                      <div v-if="c.dados_extraidos.endereco_cliente" class="migracao__secondary" :title="c.dados_extraidos.endereco_cliente">
                        🏠 Cad: {{ c.dados_extraidos.endereco_cliente.substring(0, 40) }}{{ c.dados_extraidos.endereco_cliente.length > 40 ? '…' : '' }}
                      </div>
                      <div v-if="c.dados_extraidos.endereco_entrega" class="migracao__secondary" :title="c.dados_extraidos.endereco_entrega">
                        📦 Entrega: {{ c.dados_extraidos.endereco_entrega.substring(0, 40) }}{{ c.dados_extraidos.endereco_entrega.length > 40 ? '…' : '' }}
                      </div>
                    </template>
                    <span v-else class="migracao__muted">—</span>
                  </td>
                  <td>
                    <div v-if="c.alertas?.length" class="migracao__alertas-inline">
                      <div
                        v-for="(a, ai) in c.alertas"
                        :key="ai"
                        class="migracao__alerta migracao__alerta--warn migracao__alerta--sm"
                      >
                        {{ a }}
                      </div>
                    </div>
                    <span v-else class="migracao__muted">✅ OK</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="migracao__step-actions">
            <Button variant="ghost" @click="resetar">
              <i class="pi pi-arrow-left"></i> Trocar arquivo
            </Button>
            <Button
              variant="primary"
              :disabled="carregandoImport"
              @click="confirmarImportacao"
            >
              <i v-if="carregandoImport" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-cloud-download"></i>
              {{
                carregandoImport
                  ? 'Importando...'
                  : `Importar ${preview.total_clientes} ${preview.total_clientes === 1 ? 'cliente' : 'clientes'}`
              }}
            </Button>
          </div>
        </div>

        <!-- ── PASSO 3: Resultado ─────────────────────────────────────── -->
        <div v-if="resultado" class="migracao__step">
          <div class="migracao__step-header">
            <span class="migracao__step-num migracao__step-num--ok">✓</span>
            <div>
              <div class="migracao__step-title">Importação concluída!</div>
              <div class="migracao__step-desc">
                Confira abaixo o resultado. Os clientes criados já aparecem na lista de Clientes.
              </div>
            </div>
          </div>

          <!-- Resumo -->
          <div class="migracao__resultado-cards">
            <div class="migracao__res-card migracao__res-card--ok">
              <div class="migracao__res-num">{{ resultado.criados }}</div>
              <div class="migracao__res-label">Clientes criados</div>
            </div>
            <div class="migracao__res-card migracao__res-card--skip">
              <div class="migracao__res-num">{{ resultado.ignorados }}</div>
              <div class="migracao__res-label">Já existiam (arquivos adicionados)</div>
            </div>
            <div class="migracao__res-card" :class="resultado.erros?.length ? 'migracao__res-card--err' : 'migracao__res-card--ok'">
              <div class="migracao__res-num">{{ resultado.erros?.length ?? 0 }}</div>
              <div class="migracao__res-label">Erros</div>
            </div>
          </div>

          <!-- Erros de importação -->
          <div v-if="resultado.erros?.length" class="migracao__alertas">
            <div v-for="(e, i) in resultado.erros" :key="i" class="migracao__alerta migracao__alerta--error">
              <i class="pi pi-times-circle"></i> {{ e }}
            </div>
          </div>

          <!-- Detalhes linha a linha -->
          <div class="migracao__table-wrap">
            <table class="migracao__table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Resultado</th>
                  <th>Detalhes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(d, i) in resultado.detalhes" :key="i">
                  <td class="migracao__primary">{{ d.nome_cliente }}</td>
                  <td>
                    <span class="migracao__badge" :class="acaoClass(d.acao)">
                      {{ acaoLabel(d.acao) }}
                    </span>
                  </td>
                  <td class="migracao__secondary">
                    <template v-if="d.acao === 'CRIADO'">
                      ID #{{ d.cliente_id }}
                    </template>
                    <template v-else-if="d.acao === 'IGNORADO'">
                      Já existe (id #{{ d.cliente_id }}) · fluxo verificado
                    </template>
                    <template v-else>
                      {{ d.motivo }}
                    </template>
                  </td>
                  <td>
                    <button
                      v-if="d.cliente_id"
                      class="migracao__btn-reset"
                      :disabled="reimportandoId === d.cliente_id"
                      :title="`Apagar orçamento, venda, contrato e arquivos de ${d.nome_cliente} e reimportar`"
                      @click="reimportarCliente(d)"
                    >
                      <i
                        :class="reimportandoId === d.cliente_id
                          ? 'pi pi-spin pi-spinner'
                          : 'pi pi-refresh'"
                      ></i>
                      {{ reimportandoId === d.cliente_id ? 'Resetando...' : 'Reimportar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="migracao__step-actions">
            <Button variant="ghost" @click="resetar">
              <i class="pi pi-refresh"></i> Nova importação
            </Button>
            <Button variant="primary" @click="irParaClientes">
              <i class="pi pi-users"></i> Ver Clientes
            </Button>
          </div>
        </div>

        <!-- ── PAINEL: Gerenciar importações existentes ─────────────── -->
        <div class="migracao__step">
          <div class="migracao__step-header">
            <span class="migracao__step-num migracao__step-num--tool">
              <i class="pi pi-trash" style="font-size:0.85rem"></i>
            </span>
            <div style="flex:1">
              <div class="migracao__step-title">Gerenciar clientes importados</div>
              <div class="migracao__step-desc">
                Lista todos os clientes importados do Drive. Você pode limpar o fluxo
                (orçamento, venda, contrato, arquivos e contas a receber) de um ou de todos.
                O cadastro do cliente é sempre mantido.
              </div>
            </div>
            <button
              class="migracao__btn-reset migracao__btn-reset--busca"
              :disabled="carregandoImportados"
              @click="carregarImportados"
            >
              <i :class="carregandoImportados ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
              Atualizar lista
            </button>
          </div>

          <!-- Estado vazio / carregando -->
          <div v-if="carregandoImportados" class="migracao__muted" style="padding:1rem 0">
            <i class="pi pi-spin pi-spinner"></i> Carregando...
          </div>
          <div v-else-if="!importados.length" class="migracao__muted" style="padding:1rem 0">
            Nenhum cliente importado do Drive encontrado.
          </div>

          <!-- Lista de importados -->
          <template v-else>
            <div class="migracao__reset-lista">
              <div
                v-for="c in importados"
                :key="c.id"
                class="migracao__reset-item"
              >
                <div class="migracao__reset-info">
                  <div class="migracao__initials migracao__initials--sm">
                    {{ String(c.nome_completo || '?').substring(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <div class="migracao__primary">{{ c.nome_completo }}</div>
                    <div class="migracao__secondary">
                      ID #{{ c.id }}
                      <span v-if="c.cnpj || c.cpf"> · {{ c.cnpj || c.cpf }}</span>
                      <span class="migracao__badge migracao__badge--sm" :class="statusClienteClass(c.status)" style="margin-left:0.4rem">{{ c.status }}</span>
                    </div>
                    <div class="migracao__secondary" style="margin-top:2px">
                      <span v-if="c._orcamentos">📋 {{ c._orcamentos }} orç.</span>
                      <span v-if="c._arquivos" style="margin-left:0.5rem">📎 {{ c._arquivos }} arq.</span>
                      <span v-if="c._contas" style="margin-left:0.5rem">💰 {{ c._contas }} conta(s)</span>
                      <span v-if="!c._orcamentos && !c._arquivos && !c._contas" class="migracao__muted">Sem fluxo gerado</span>
                    </div>
                  </div>
                </div>
                <div style="display:flex;gap:0.5rem;align-items:center">
                  <button
                    class="migracao__btn-reset"
                    style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1"
                    :disabled="resetandoId === c.id || excluindoId === c.id"
                    @click="confirmarReset(c)"
                    title="Remove orçamento, venda, contrato, arquivos e contas. Mantém o cadastro."
                  >
                    <i :class="resetandoId === c.id ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
                    {{ resetandoId === c.id ? 'Limpando...' : 'Limpar fluxo' }}
                  </button>
                  <button
                    class="migracao__btn-reset migracao__btn-reset--danger"
                    :disabled="resetandoId === c.id || excluindoId === c.id"
                    @click="confirmarExcluir(c)"
                    title="Remove tudo incluindo o cadastro do cliente."
                  >
                    <i :class="excluindoId === c.id ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></i>
                    {{ excluindoId === c.id ? 'Excluindo...' : 'Excluir' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Botões em massa -->
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem">
              <button
                class="migracao__btn-reset"
                style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1"
                :disabled="!!resetandoId || !!excluindoId || limpandoTudo"
                @click="confirmarLimparTudo"
              >
                <i :class="limpandoTudo ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
                {{ limpandoTudo ? 'Limpando...' : `Limpar todos os fluxos (${importados.length})` }}
              </button>
              <button
                class="migracao__btn-reset migracao__btn-reset--danger"
                :disabled="!!resetandoId || !!excluindoId || limpandoTudo"
                @click="confirmarExcluirTudo"
              >
                <i :class="excluindoTudo ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></i>
                {{ excluindoTudo ? 'Excluindo...' : `Excluir tudo (${importados.length})` }}
              </button>
            </div>
          </template>
        </div>

      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MigracaoDriveService } from '@/services'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'clientes.criar', title: 'Importar do Drive' } })

const router = useRouter()

onMounted(() => carregarImportados())

// ── Estado ──────────────────────────────────────────────────────────────────
const etapa = ref(1)
const arquivoSelecionado = ref(null)
const arrastando = ref(false)
const extrairDados = ref(true)
const carregandoPreview = ref(false)
const carregandoImport = ref(false)
const preview = ref(null)
const resultado = ref(null)
const reimportandoId = ref(null)
const motivoSelecionado = ref(null)

// ── Gerenciar importações existentes ─────────────────────────────────────────
const importados = ref([])
const carregandoImportados = ref(false)
const resetandoId = ref(null)
const excluindoId = ref(null)
const limpandoTudo = ref(false)
const excluindoTudo = ref(false)

// ── Upload / drag-drop ───────────────────────────────────────────────────────
function abrirSeletor() {
  const input = document.getElementById('zip-input')
  if (input) {
    input.value = ''
    input.click()
  }
}

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) selecionarArquivo(f)
}

function onDrop(e) {
  arrastando.value = false
  const f = e.dataTransfer.files?.[0]
  if (f) selecionarArquivo(f)
  else notify.error('Nenhum arquivo detectado.')
}

function selecionarArquivo(f) {
  arquivoSelecionado.value = f
  preview.value = null
  resultado.value = null
  motivoSelecionado.value = null
  etapa.value = 1
}

// ── Passo 1 → Passo 2: Preview ──────────────────────────────────────────────
async function gerarPreview() {
  if (!arquivoSelecionado.value) return
  carregandoPreview.value = true
  try {
    const res = await MigracaoDriveService.preview(
      arquivoSelecionado.value,
      extrairDados.value,
    )
    preview.value = res.data
    motivoSelecionado.value = null
    etapa.value = 2
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao analisar o ZIP.'
    notify.error(Array.isArray(msg) ? msg.join(' | ') : msg)
  } finally {
    carregandoPreview.value = false
  }
}

// ── Passo 2 → Passo 3: Importar ─────────────────────────────────────────────
async function confirmarImportacao() {
  if (!arquivoSelecionado.value) return
  carregandoImport.value = true
  try {
    const res = await MigracaoDriveService.importar(arquivoSelecionado.value, {
      extrairDados: extrairDados.value,
      pularExistentes: true,
    })
    resultado.value = res.data
    etapa.value = 3
    if (res.data.criados > 0) {
      notify.success(`${res.data.criados} cliente(s) importado(s) com sucesso!`)
    }
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao importar.'
    notify.error(Array.isArray(msg) ? msg.join(' | ') : msg)
  } finally {
    carregandoImport.value = false
  }
}

function resetar() {
  arquivoSelecionado.value = null
  preview.value = null
  resultado.value = null
  motivoSelecionado.value = null
  etapa.value = 1
}

function irParaClientes() {
  router.push('/clientes')
}

// ── Reimportar cliente específico ────────────────────────────────────────────
async function reimportarCliente(detalhe) {
  if (!detalhe.cliente_id || !arquivoSelecionado.value) return
  if (!confirm(`Isso vai apagar o orçamento, venda, contrato, arquivos e contas a receber de "${detalhe.nome_cliente}" e reimportar do ZIP. Continuar?`)) return

  reimportandoId.value = detalhe.cliente_id
  try {
    // 1. Reseta o fluxo do cliente
    await MigracaoDriveService.resetarCliente(detalhe.cliente_id)

    // 2. Reimporta o ZIP inteiro com pular_existentes=false para forçar reprocessamento
    const res = await MigracaoDriveService.importar(arquivoSelecionado.value, {
      extrairDados: extrairDados.value,
      pularExistentes: false,
    })

    // 3. Atualiza o resultado na tela com os novos detalhes
    resultado.value = res.data
    notify.success(`"${detalhe.nome_cliente}" reimportado com sucesso!`)
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao reimportar.'
    notify.error(Array.isArray(msg) ? msg.join(' | ') : msg)
  } finally {
    reimportandoId.value = null
  }
}

// ── Gerenciar importações: lista completa ────────────────────────────────────
async function carregarImportados() {
  carregandoImportados.value = true
  try {
    const res = await MigracaoDriveService.listarImportados()
    importados.value = res.data ?? []
  } catch (e) {
    notify.error('Erro ao carregar clientes importados.')
  } finally {
    carregandoImportados.value = false
  }
}

async function confirmarReset(cliente) {
  const confirmado = confirm(
    `Isso vai remover o orçamento, venda, contrato, arquivos e contas a receber de "${cliente.nome_completo}".\n\nO cadastro do cliente será mantido.\n\nContinuar?`
  )
  if (!confirmado) return

  resetandoId.value = cliente.id
  try {
    await MigracaoDriveService.resetarCliente(cliente.id)
    notify.success(`"${cliente.nome_completo}" limpo. Pode reimportar agora.`)
    await carregarImportados()
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao limpar fluxo.'
    notify.error(msg)
  } finally {
    resetandoId.value = null
  }
}

async function confirmarLimparTudo() {
  const total = importados.value.length
  const confirmado = confirm(
    `Isso vai limpar o fluxo comercial (orçamento, venda, contrato, arquivos e contas a receber) de TODOS os ${total} clientes importados.\n\nOs cadastros dos clientes serão mantidos.\n\nTem certeza?`
  )
  if (!confirmado) return

  limpandoTudo.value = true
  let erros = 0
  for (const c of importados.value) {
    try {
      await MigracaoDriveService.resetarCliente(c.id)
    } catch {
      erros++
    }
  }
  limpandoTudo.value = false
  if (erros > 0) {
    notify.error(`${erros} cliente(s) com erro ao limpar.`)
  } else {
    notify.success(`Todos os ${total} clientes foram limpos. Pode reimportar agora.`)
  }
  await carregarImportados()
}

async function confirmarExcluir(cliente) {
  const confirmado = confirm(
    `Isso vai EXCLUIR COMPLETAMENTE o cliente "${cliente.nome_completo}" (ID #${cliente.id}), incluindo o cadastro.\n\nEssa ação não pode ser desfeita.\n\nContinuar?`
  )
  if (!confirmado) return

  excluindoId.value = cliente.id
  try {
    await MigracaoDriveService.excluirCliente(cliente.id)
    notify.success(`"${cliente.nome_completo}" excluído com sucesso.`)
    await carregarImportados()
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao excluir cliente.'
    notify.error(msg)
  } finally {
    excluindoId.value = null
  }
}

async function confirmarExcluirTudo() {
  const total = importados.value.length
  const confirmado = confirm(
    `Isso vai EXCLUIR COMPLETAMENTE todos os ${total} clientes importados do Drive.\n\nTodos os cadastros, orçamentos, vendas, contratos, arquivos e contas serão removidos.\n\nEssa ação não pode ser desfeita.\n\nTem certeza?`
  )
  if (!confirmado) return

  excluindoTudo.value = true
  let erros = 0
  const lista = [...importados.value]
  for (const c of lista) {
    try {
      await MigracaoDriveService.excluirCliente(c.id)
    } catch {
      erros++
    }
  }
  excluindoTudo.value = false
  if (erros > 0) {
    notify.error(`${erros} cliente(s) com erro ao excluir.`)
  } else {
    notify.success(`Todos os ${total} clientes foram excluídos.`)
  }
  await carregarImportados()
}

function statusClienteClass(status) {
  const map = {
    CADASTRO: 'badge--gray',
    CRIAR_ORCAMENTO: 'badge--blue',
    VENDA_FECHADA: 'badge--green',
    CONTRATO_ASSINADO: 'badge--teal',
  }
  return map[status] ?? 'badge--gray'
}

// ── Helpers de formatação ────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatBRL(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatData(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const STATUS_LABELS = {
  CADASTRO: 'Cadastro',
  MEDICAO_VENDA: 'Medição Inicial',
  ORCAMENTO: 'Orçamento',
  CONTRATO: 'Contrato',
  PRODUCAO_MONTAGEM: 'Produção/Montagem',
}
function statusLabel(s) {
  return STATUS_LABELS[s] ?? s
}
function statusClass(s) {
  if (s === 'PRODUCAO_MONTAGEM') return 'migracao__badge--producao'
  if (s === 'CONTRATO') return 'migracao__badge--contrato'
  if (s === 'ORCAMENTO') return 'migracao__badge--orcamento'
  return 'migracao__badge--cadastro'
}

const CAT_LABELS = {
  ORCAMENTO: 'Orçamento',
  CONTRATO: 'Contrato',
  PROJETO_TECNICO: 'Proj. Técnico',
  PLANO_CORTE: 'Plano de Corte',
  MEDICAO: 'Medição',
  FOTO: 'Foto',
  DOCUMENTO: 'Doc',
  PROJETO: 'Projeto',
}
function catLabel(c) { return CAT_LABELS[c] ?? c }

function acaoLabel(a) {
  if (a === 'CRIADO') return 'Criado'
  if (a === 'IGNORADO') return 'Já existia'
  return 'Erro'
}
function acaoClass(a) {
  if (a === 'CRIADO') return 'migracao__badge--ok'
  if (a === 'IGNORADO') return 'migracao__badge--skip'
  return 'migracao__badge--error'
}

const MOTIVOS_IGNORADOS_LABELS = {
  diretorio: 'Diretório',
  caminho_curto: 'Caminho curto',
  arquivo_oculto: 'Arquivo oculto',
  arquivo_sistema: 'Arquivo de sistema',
  caminho_nao_identificado: 'Caminho não identificado',
  thumbnail_ou_arquivo_pequeno: 'Thumbnail/arquivo pequeno',
}
function motivoIgnoradoLabel(motivo) {
  return MOTIVOS_IGNORADOS_LABELS[motivo] ?? motivo
}
</script>

<style scoped>
.migracao {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.migracao__step-num--tool {
  background: #64748b;
}

.migracao__reset-busca {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.migracao__reset-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ds-color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: var(--ds-color-surface, #fff);
  color: var(--ds-color-text, #1e293b);
  outline: none;
  transition: border-color 0.15s;
}
.migracao__reset-input:focus {
  border-color: var(--ds-color-primary, #3b82f6);
}
.migracao__reset-lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.migracao__reset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ds-color-border, #e2e8f0);
  border-radius: 0.75rem;
  background: var(--ds-color-surface, #fff);
}
.migracao__reset-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.migracao__initials--sm {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.migracao__btn-reset--busca {
  white-space: nowrap;
}
.migracao__btn-reset--danger:hover:not(:disabled) {
  border-color: #ef4444 !important;
  color: #ef4444 !important;
  background: #fef2f2 !important;
}

.migracao__btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ds-color-border, #e2e8f0);
  background: var(--ds-color-surface, #fff);
  color: var(--ds-color-text-secondary, #64748b);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.migracao__btn-reset:hover:not(:disabled) {
  border-color: #f97316;
  color: #f97316;
  background: #fff7ed;
}
.migracao__btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.migracao__body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 2rem 3rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* ── Steps ── */
.migracao__step {
  background: var(--ds-color-surface-raised, #fff);
  border: 1px solid var(--ds-color-border, #e2e8f0);
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: opacity 0.2s;
}
.migracao__step.is-done {
  opacity: 0.5;
  pointer-events: none;
}

.migracao__step-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}
.migracao__step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ds-color-primary, #3b82f6);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}
.migracao__step-num--ok {
  background: #10b981;
}
.migracao__step-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ds-color-text, #1e293b);
  line-height: 1.4;
}
.migracao__step-desc {
  font-size: 0.85rem;
  color: var(--ds-color-text-muted, #64748b);
  margin-top: 0.2rem;
  line-height: 1.5;
}

/* ── Dropzone ── */
.migracao__dropzone {
  border: 2px dashed var(--ds-color-border, #cbd5e1);
  border-radius: 0.75rem;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
}
.migracao__dropzone:hover,
.migracao__dropzone.is-over {
  border-color: var(--ds-color-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.04);
}
.migracao__dropzone.is-selected {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}
.migracao__dropzone-icon {
  font-size: 2rem;
  color: var(--ds-color-text-faint, #94a3b8);
}
.migracao__dropzone-icon.is-selected {
  color: #10b981;
}
.migracao__dropzone-label {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--ds-color-text, #1e293b);
  text-align: center;
}
.migracao__dropzone-hint {
  font-size: 0.78rem;
  color: var(--ds-color-text-faint, #94a3b8);
}

/* ── Actions row ── */
.migracao__step-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.migracao__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.83rem;
  color: var(--ds-color-text-muted, #64748b);
  cursor: pointer;
  flex: 1;
}

/* ── Alertas ── */
.migracao__alertas {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.migracao__alerta {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  line-height: 1.45;
}
.migracao__alerta--warn {
  background: rgba(234, 179, 8, 0.1);
  color: #92400e;
  border: 1px solid rgba(234, 179, 8, 0.3);
}
.migracao__alerta--error {
  background: rgba(239, 68, 68, 0.08);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.migracao__alerta--sm {
  font-size: 0.75rem;
  padding: 0.3rem 0.5rem;
}
.migracao__alertas-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* ── Tabela ── */
.migracao__table-wrap {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border, #e2e8f0);
}

.migracao__diag {
  border: 1px solid var(--ds-color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--ds-color-surface-subtle, #f8fafc);
}
.migracao__diag-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ds-color-text, #1e293b);
  margin-bottom: 0.6rem;
}
.migracao__diag-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 0.6rem;
}
.migracao__diag-item {
  border: 1px solid var(--ds-color-border, #e2e8f0);
  border-radius: 0.6rem;
  background: var(--ds-color-surface, #fff);
  padding: 0.55rem 0.65rem;
}
.migracao__diag-label {
  font-size: 0.72rem;
  color: var(--ds-color-text-faint, #94a3b8);
}
.migracao__diag-value {
  margin-top: 0.2rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ds-color-text, #1e293b);
}
.migracao__diag-motivos {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.migracao__diag-motivo-btn {
  border: 0;
  cursor: pointer;
}
.migracao__diag-exemplos {
  margin-top: 0.65rem;
  border-top: 1px dashed var(--ds-color-border, #e2e8f0);
  padding-top: 0.55rem;
}
.migracao__diag-exemplos-title {
  font-size: 0.77rem;
  color: var(--ds-color-text-muted, #64748b);
  margin-bottom: 0.35rem;
}
.migracao__diag-exemplos-list {
  margin: 0;
  padding-left: 1rem;
}
.migracao__diag-exemplo-item {
  font-size: 0.76rem;
  color: var(--ds-color-text, #1e293b);
  line-height: 1.45;
}
.migracao__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}
.migracao__table th {
  padding: 0.65rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ds-color-text-faint, #94a3b8);
  background: var(--ds-color-surface-subtle, #f8fafc);
  border-bottom: 1px solid var(--ds-color-border, #e2e8f0);
}
.migracao__table td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--ds-color-border-subtle, #f1f5f9);
  vertical-align: top;
}
.migracao__table-row:last-child td {
  border-bottom: none;
}

.migracao__cliente-nome {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.migracao__initials {
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  background: rgba(245, 248, 251, 0.9);
  border: 1px solid var(--ds-color-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--ds-color-text-faint, #94a3b8);
  flex-shrink: 0;
}
.migracao__primary {
  font-weight: 540;
  color: var(--ds-color-text, #1e293b);
  font-size: 0.88rem;
}
.migracao__secondary {
  font-size: 0.78rem;
  color: var(--ds-color-text-muted, #64748b);
  margin-top: 0.1rem;
}
.migracao__muted {
  color: var(--ds-color-text-faint, #94a3b8);
  font-size: 0.8rem;
}

/* ── Badges ── */
.migracao__badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.migracao__badge--drive        { background:#f1f5f9; color:#475569; }
.migracao__badge--cadastro     { background:#f1f5f9; color:#475569; }
.migracao__badge--orcamento    { background:#ede9fe; color:#5b21b6; }
.migracao__badge--contrato     { background:#d1fae5; color:#065f46; }
.migracao__badge--producao     { background:#ccfbf1; color:#0f766e; }
.migracao__badge--file         { background:#f0f9ff; color:#0369a1; }
.migracao__badge--ok           { background:#d1fae5; color:#065f46; }
.migracao__badge--skip         { background:#fef9c3; color:#713f12; }
.migracao__badge--error        { background:#fee2e2; color:#991b1b; }
.migracao__badge--sm           { font-size: 0.65rem; padding: 0.1rem 0.4rem; }
.badge--gray                   { background:#f1f5f9; color:#475569; }
.badge--blue                   { background:#dbeafe; color:#1d4ed8; }
.badge--green                  { background:#d1fae5; color:#065f46; }
.badge--teal                   { background:#ccfbf1; color:#0f766e; }

.migracao__arquivos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* ── Resultado ── */
.migracao__resultado-cards {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.migracao__res-card {
  flex: 1;
  min-width: 140px;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--ds-color-border, #e2e8f0);
  text-align: center;
}
.migracao__res-card--ok  { background: rgba(16,185,129,0.07); border-color: rgba(16,185,129,0.3); }
.migracao__res-card--skip{ background: rgba(234,179,8,0.07);  border-color: rgba(234,179,8,0.3); }
.migracao__res-card--err { background: rgba(239,68,68,0.07);  border-color: rgba(239,68,68,0.3); }

.migracao__res-num {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ds-color-text, #1e293b);
  line-height: 1;
}
.migracao__res-label {
  font-size: 0.78rem;
  color: var(--ds-color-text-muted, #64748b);
  margin-top: 0.35rem;
}

/* ── Dark mode ── */
.dark .migracao__step {
  background: var(--ds-color-surface-raised, #0f172a);
  border-color: rgba(51, 71, 102, 0.6);
}
.dark .migracao__initials {
  background: rgba(18, 30, 49, 0.7);
  border-color: rgba(51, 71, 102, 0.7);
}
.dark .migracao__table th {
  background: rgba(15, 23, 42, 0.6);
}
.dark .migracao__alerta--warn {
  background: rgba(234, 179, 8, 0.07);
  color: #fbbf24;
}
</style>
