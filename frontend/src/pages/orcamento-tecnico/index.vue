<template>
  <PageShell :padded="false">
    <section class="ot-index">

      <!-- ── HEADER ───────────────────────────────────────────────── -->
      <div class="ot-index__header">
        <div class="ot-index__header-title">
          <i class="pi pi-file-edit ot-index__header-icon" />
          <div>
            <h1 class="ot-index__title">Orçamento Técnico</h1>
            <p class="ot-index__subtitle">Medições disponíveis e orçamentos em andamento</p>
          </div>
        </div>
        <div class="ot-index__header-actions">
          <Button variant="ghost" size="sm" :disabled="loading" @click="carregar">
            <i class="pi pi-refresh" :class="{ 'animate-spin': loading }" />Recarregar
          </Button>
          <Button variant="primary" size="sm" @click="abrirModalNovo">
            <i class="pi pi-plus" />Nova entrada manual
          </Button>
        </div>
      </div>

      <div class="ot-index__body">

        <!-- ── SEÇÃO 1: MEDIÇÕES DISPONÍVEIS ────────────────────────── -->
        <section class="ot-index__section">
          <div class="ot-index__section-header">
            <span class="ot-index__section-eyebrow">
              <i class="pi pi-ruler text-brand-primary" />
              Medições do técnico disponíveis
            </span>
            <span v-if="medicoes.length" class="ot-index__badge ot-index__badge--brand">
              {{ medicoes.length }}
            </span>
          </div>

          <div v-if="loadingMedicoes" class="ot-index__empty">
            <Loading />
          </div>

          <div v-else-if="!medicoes.length" class="ot-index__empty ot-index__empty--dashed">
            <i class="pi pi-inbox text-2xl text-text-soft mb-2 block" />
            <p class="text-sm text-text-soft">Nenhuma medição pendente de orçamento.</p>
            <p class="text-xs text-text-soft/60 mt-1">Quando o técnico concluir uma medição ela aparece aqui.</p>
          </div>

          <div v-else class="ot-index__cards">
            <div
              v-for="m in medicoes"
              :key="m.agenda_loja_id"
              class="ot-index__card ot-index__card--medicao"
            >
              <!-- Kicker -->
              <div class="ot-index__card-kicker">
                <span class="ot-index__badge ot-index__badge--success">
                  <i class="pi pi-check-circle" />Medição concluída
                </span>
                <span class="ot-index__card-date">{{ format.date(m.data_inicio) }}</span>
              </div>

              <!-- Titulo + cliente -->
              <div class="ot-index__card-main">
                <p class="ot-index__card-title">{{ m.titulo || 'Agendamento #' + m.agenda_loja_id }}</p>
                <p v-if="m.cliente?.nome_completo" class="ot-index__card-sub">
                  <i class="pi pi-user text-[10px]" />{{ m.cliente.nome_completo }}
                </p>
              </div>

              <!-- Resumo de medições -->
              <div class="ot-index__card-metrics">
                <div class="ot-index__metric">
                  <span class="ot-index__metric-value">{{ m.total_ambientes }}</span>
                  <span class="ot-index__metric-label">ambientes</span>
                </div>
                <div class="ot-index__metric">
                  <span class="ot-index__metric-value">{{ m.area_total_m2.toFixed(2) }}</span>
                  <span class="ot-index__metric-label">m² total</span>
                </div>
              </div>

              <!-- Ambientes expandidos -->
              <div v-if="m.ambientes?.length" class="ot-index__card-ambientes">
                <div
                  v-for="amb in m.ambientes"
                  :key="amb.id"
                  class="ot-index__amb"
                >
                  <span class="ot-index__amb-nome">{{ amb.nome_ambiente }}</span>
                  <span class="ot-index__amb-medidas">
                    <template v-if="amb.largura_m">L {{ Math.round(Number(amb.largura_m) * 1000) }}mm</template>
                    <template v-if="amb.pe_direito_m"> · H {{ Math.round(Number(amb.pe_direito_m) * 1000) }}mm</template>
                    <template v-if="amb.profundidade_m"> · P {{ Math.round(Number(amb.profundidade_m) * 1000) }}mm</template>
                  </span>
                  <!-- Paredes -->
                  <div v-if="amb.paredes?.length" class="ot-index__paredes">
                    <span
                      v-for="par in amb.paredes"
                      :key="par.id"
                      class="ot-index__parede-chip"
                    >
                      {{ par.nome }}: {{ Math.round(Number(par.largura_m || 0) * 1000) }}×{{ Math.round(Number(par.pe_direito_m || 0) * 1000) }}mm
                    </span>
                  </div>
                </div>
              </div>

              <!-- Ações -->
              <div class="ot-index__card-actions">
                <Button
                  v-if="can('orcamentos.editar')"
                  variant="primary"
                  size="sm"
                  :loading="criandoDe === m.agenda_loja_id"
                  @click="criarDesMedicao(m)"
                >
                  <i class="pi pi-file-edit" />Criar Orçamento Técnico
                </Button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── SEÇÃO 2: OTS EXISTENTES ───────────────────────────────── -->
        <section class="ot-index__section">
          <div class="ot-index__section-header">
            <span class="ot-index__section-eyebrow">
              <i class="pi pi-file-check text-text-soft" />
              Orçamentos técnicos criados
            </span>
            <span v-if="lista.length" class="ot-index__badge ot-index__badge--neutral">
              {{ lista.length }}
            </span>
          </div>

          <p v-if="erro" class="text-rose-500 text-sm mb-3">{{ erro }}</p>

          <div v-if="loading" class="ot-index__empty">
            <Loading />
          </div>

          <div v-else-if="!lista.length" class="ot-index__empty">
            <p class="text-sm text-text-soft">Nenhum orçamento técnico salvo ainda.</p>
          </div>

          <div v-else class="ot-index__panel">
            <div
              v-for="ot in lista"
              :key="ot.id"
              class="ot-index__row"
            >
              <div class="ot-index__row-info">
                <div class="ot-index__row-title-line">
                  <span class="ot-index__row-id">#{{ ot.id }}</span>
                  <span class="ot-index__row-dot">·</span>
                  <span class="ot-index__row-titulo">{{ ot.agenda_loja?.titulo || 'Orçamento direto' }}</span>
                  <span v-if="ot.agenda_loja?.cliente?.nome_completo" class="ot-index__row-cliente">
                    — {{ ot.agenda_loja.cliente.nome_completo }}
                  </span>
                </div>
                <div class="ot-index__row-meta">
                  <span>{{ format.date(ot.criado_em) }}</span>
                  <!-- Pill de medição disponível -->
                  <span
                    v-if="ot.agenda_loja?.medicao_orcamento?.concluida"
                    class="ot-index__badge ot-index__badge--success ot-index__badge--xs"
                  >
                    <i class="pi pi-ruler" />{{ ot.agenda_loja.medicao_orcamento.ambientes?.length || 0 }} amb. medidos
                  </span>
                  <span v-else class="ot-index__badge ot-index__badge--neutral ot-index__badge--xs">
                    Sem medição técnica
                  </span>
                </div>
              </div>
              <div class="ot-index__row-actions">
                <Button
                  v-if="can('orcamentos.editar')"
                  variant="ghost"
                  size="sm"
                  @click="editarOrcamento(ot.id)"
                >
                  <i class="pi pi-pencil" />Editar
                </Button>
                <Button
                  v-if="can('orcamentos.excluir')"
                  variant="ghost"
                  size="sm"
                  class="ot-index__delete-btn"
                  @click="excluirOrcamento(ot)"
                >
                  <i class="pi pi-trash" />Excluir
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <!-- ── MODAL: NOVO ORÇAMENTO TÉCNICO ───────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="abrirNovo"
        class="fixed inset-0 z-[120] flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.5);"
        @click.self="fecharNovo"
      >
        <div class="ot-index__modal">
          <div class="ot-index__modal-header">
            <div>
              <p class="ot-index__section-eyebrow">Novo orçamento técnico</p>
              <h3 class="ot-index__modal-title">
                {{ etapaModal === 'tipo' ? 'Qual é a origem do orçamento?' : tipoNovoLabel }}
              </h3>
              <p class="ot-index__modal-sub">
                {{ etapaModal === 'tipo'
                  ? 'Escolha como as medidas e módulos serão inseridos neste projeto.'
                  : 'Informe o cliente para criar e abrir o orçamento.' }}
              </p>
            </div>
            <button class="ot-index__modal-close" @click="fecharNovo">
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- Etapa 1: Seleção do tipo -->
          <div v-if="etapaModal === 'tipo'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="ot-index__tipo-card"
              :class="{ 'ot-index__tipo-card--ativo': tipoNovo === 'PROMOB' }"
              @click="selecionarTipoNovo('PROMOB')"
            >
              <i class="pi pi-file-import text-sky-500 text-2xl mb-2" />
              <span class="font-bold text-sm text-text-main">Importar do Promob</span>
              <span class="text-xs text-text-soft mt-1">Sobe um arquivo XML, JSON ou CSV exportado do software Promob. Os ambientes e módulos são mapeados automaticamente.</span>
            </button>
            <button
              type="button"
              class="ot-index__tipo-card"
              :class="{ 'ot-index__tipo-card--ativo': tipoNovo === 'MANUAL' }"
              @click="selecionarTipoNovo('MANUAL')"
            >
              <i class="pi pi-pencil text-amber-500 text-2xl mb-2" />
              <span class="font-bold text-sm text-text-main">Inserção manual</span>
              <span class="text-xs text-text-soft mt-1">O vendedor digita os ambientes, paredes e módulos diretamente na tela. Ideal quando não há arquivo Promob.</span>
            </button>
          </div>

          <!-- Etapa 2: Seleção do cliente -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Input
                v-model="clienteBusca"
                variant="line"
                label="Buscar cliente"
                placeholder="Nome do cliente..."
                :force-upper="false"
                @input="buscarClientes"
              />
              <Button variant="ghost" size="sm" @click="buscarClientes">Buscar</Button>
            </div>

            <div class="ot-index__search-list">
              <button
                v-for="c in clientesEncontrados"
                :key="c.id"
                type="button"
                class="ot-index__search-item"
                :class="{ 'is-selected': Number(clienteSelecionado?.id) === Number(c.id) }"
                @click="selecionarCliente(c)"
              >
                <span class="font-semibold text-text-main text-sm">{{ c.nome_completo }}</span>
                <span class="text-[11px] text-text-soft">Cliente #{{ c.id }}</span>
              </button>
              <div v-if="!clientesEncontrados.length" class="px-4 py-4 text-sm text-text-soft">
                Nenhum cliente listado. Digite o nome acima para buscar.
              </div>
            </div>

            <div v-if="clienteSelecionado" class="ot-index__selected-cliente">
              <span class="text-xs font-semibold text-success">Cliente selecionado</span>
              <strong class="text-success block">{{ clienteSelecionado.nome_completo }}</strong>
            </div>

            <div class="relative">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-border-ui/50" /></div>
              <div class="relative flex justify-center"><span class="bg-bg-card px-4 text-xs text-text-soft">ou cadastro rápido</span></div>
            </div>

            <CustomCheckbox
              v-model="usarCadastroRapido"
              label="Cadastrar cliente rápido"
              description="Use apenas dados essenciais quando o cliente ainda não está no sistema."
            />

            <div v-if="usarCadastroRapido" class="grid grid-cols-12 gap-4">
              <Input v-model="clienteRapido.nome_completo" variant="line" class="col-span-12 md:col-span-6" label="Nome completo" placeholder="Nome do cliente" required />
              <Input v-model="clienteRapido.telefone" variant="line" class="col-span-12 md:col-span-3" label="Telefone" placeholder="Telefone" :force-upper="false" />
              <Input v-model="clienteRapido.whatsapp" variant="line" class="col-span-12 md:col-span-3" label="WhatsApp" placeholder="WhatsApp" :force-upper="false" />
              <Input v-model="clienteRapido.email" variant="line" class="col-span-12" label="E-mail" placeholder="nome@email.com" type="email" :force-upper="false" />
            </div>
          </div>

          <div class="ot-index__modal-footer">
            <Button variant="ghost" size="sm" @click="fecharNovo">Cancelar</Button>
            <Button v-if="etapaModal === 'cliente'" variant="ghost" size="sm" @click="etapaModal = 'tipo'">
              <i class="pi pi-arrow-left mr-1" />Voltar
            </Button>
            <Button
              v-if="etapaModal === 'tipo'"
              variant="primary"
              size="sm"
              :disabled="!tipoNovo"
              @click="etapaModal = 'cliente'"
            >
              Continuar <i class="pi pi-arrow-right ml-1" />
            </Button>
            <Button v-else variant="primary" size="sm" :loading="criando" @click="criarNovoDireto">
              Criar e Abrir
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </PageShell>
</template>

<style scoped>
/* ── Layout base ─────────────────────────────────────────────── */
.ot-index {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: var(--ds-font-sans);
  display: flex;
  flex-direction: column;
}

/* ── Header ──────────────────────────────────────────────────── */
.ot-index__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface, #ffffff);
}

.ot-index__header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ot-index__header-icon {
  font-size: 1.375rem;
  color: var(--ds-color-primary);
  flex-shrink: 0;
}

.ot-index__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ds-color-text);
  line-height: 1.2;
}

.ot-index__subtitle {
  font-size: 0.78rem;
  color: var(--ds-color-text-faint);
  margin-top: 0.125rem;
}

.ot-index__header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ── Body ────────────────────────────────────────────────────── */
.ot-index__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem 2rem 2rem;
}

/* ── Section ─────────────────────────────────────────────────── */
.ot-index__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ot-index__section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ot-index__section-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ds-color-text-faint);
}

/* ── Badges ──────────────────────────────────────────────────── */
.ot-index__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.4;
}

.ot-index__badge--brand {
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
}

.ot-index__badge--success {
  background: color-mix(in srgb, var(--ds-color-success) 12%, transparent);
  color: var(--ds-color-success);
}

.ot-index__badge--neutral {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  color: var(--ds-color-text-faint);
}

.ot-index__badge--xs {
  font-size: 0.65rem;
  padding: 0.1rem 0.45rem;
}

/* ── Empty states ────────────────────────────────────────────── */
.ot-index__empty {
  padding: 2rem;
  text-align: center;
  border-radius: 0.75rem;
  background: var(--ds-color-surface, #ffffff);
  border: 1px solid var(--ds-color-border);
}

.ot-index__empty--dashed {
  border-style: dashed;
  background: color-mix(in srgb, var(--ds-color-surface) 60%, transparent);
}

/* ── Cards de medição ────────────────────────────────────────── */
.ot-index__cards {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.ot-index__card {
  border-radius: 0.875rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface, #ffffff);
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}

.ot-index__card--medicao {
  border-top: 3px solid var(--ds-color-primary);
}

.ot-index__card:hover {
  box-shadow: var(--ds-shadow-md);
  border-color: color-mix(in srgb, var(--ds-color-primary) 30%, var(--ds-color-border));
}

.ot-index__card-kicker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ot-index__card-date {
  font-size: 0.72rem;
  color: var(--ds-color-text-faint);
}

.ot-index__card-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ot-index__card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ds-color-text);
  line-height: 1.3;
}

.ot-index__card-sub {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--ds-color-text-faint);
}

/* ── Métricas ────────────────────────────────────────────────── */
.ot-index__card-metrics {
  display: flex;
  gap: 1.25rem;
  padding: 0.625rem 0.75rem;
  background: color-mix(in srgb, var(--ds-color-primary) 5%, transparent);
  border-radius: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}

.ot-index__metric {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.ot-index__metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ds-color-primary);
  line-height: 1.1;
}

.ot-index__metric-label {
  font-size: 0.68rem;
  color: var(--ds-color-text-faint);
  font-weight: 500;
}

/* ── Ambientes ───────────────────────────────────────────────── */
.ot-index__card-ambientes {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 160px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.ot-index__amb {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ot-index__amb-nome {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ds-color-text);
}

.ot-index__amb-medidas {
  font-size: 0.72rem;
  color: var(--ds-color-text-faint);
  font-variant-numeric: tabular-nums;
}

.ot-index__paredes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.15rem;
}

.ot-index__parede-chip {
  font-size: 0.67rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  color: var(--ds-color-text-faint);
  font-variant-numeric: tabular-nums;
}

/* ── Ações do card ───────────────────────────────────────────── */
.ot-index__card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--ds-color-border);
}

/* ── Painel de OTs (lista) ───────────────────────────────────── */
.ot-index__panel {
  border-radius: 0.875rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface, #ffffff);
  overflow: hidden;
  box-shadow: var(--ds-shadow-sm);
}

.ot-index__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--ds-color-border);
  transition: background-color 0.15s ease;
}

.ot-index__row:last-child {
  border-bottom: none;
}

.ot-index__row:hover {
  background: var(--ds-color-surface);
}

.ot-index__row-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.ot-index__row-title-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem;
}

.ot-index__row-id {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ds-color-primary);
}

.ot-index__row-dot {
  color: var(--ds-color-text-faint);
}

.ot-index__row-titulo {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ds-color-text);
}

.ot-index__row-cliente {
  font-size: 0.82rem;
  color: var(--ds-color-text-faint);
}

.ot-index__row-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--ds-color-text-faint);
}

.ot-index__row-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.ot-index__delete-btn:hover {
  color: var(--ds-color-danger) !important;
}

/* ── Modal ───────────────────────────────────────────────────── */
.ot-index__modal {
  width: 100%;
  max-width: 38rem;
  background: var(--ds-color-surface, #ffffff);
  border: 1px solid var(--ds-color-border, #e2e8f0);
  border-radius: 1rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
  isolation: isolate;
}

.ot-index__modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.ot-index__modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ds-color-text);
  margin-top: 0.25rem;
}

.ot-index__modal-sub {
  font-size: 0.8rem;
  color: var(--ds-color-text-faint);
  margin-top: 0.25rem;
}

.ot-index__modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  color: var(--ds-color-text-faint);
  flex-shrink: 0;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.ot-index__modal-close:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent);
  color: var(--ds-color-text);
}

.ot-index__modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ds-color-border);
}

.ot-index__search-list {
  max-height: 180px;
  overflow-y: auto;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border, #e2e8f0);
  background: var(--ds-color-surface, #ffffff);
}

.ot-index__search-item {
  width: 100%;
  text-align: left;
  padding: 0.625rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 40%, transparent);
}

.ot-index__search-item:last-child { border-bottom: none; }

.ot-index__search-item:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 6%, transparent);
}

.ot-index__search-item.is-selected {
  background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent);
}

.ot-index__selected-cliente {
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-success) 20%, transparent);
  background: color-mix(in srgb, var(--ds-color-success) 5%, transparent);
  padding: 0.75rem 1rem;
}

/* ── Cards de tipo de orçamento ──────────────────────────────── */
.ot-index__tipo-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 1.25rem;
  border-radius: 0.875rem;
  border: 2px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  text-align: left;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
}

.ot-index__tipo-card:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 35%, var(--ds-color-border));
  background: color-mix(in srgb, var(--ds-color-primary) 3%, var(--ds-color-surface));
  box-shadow: var(--ds-shadow-sm);
}

.ot-index__tipo-card--ativo {
  border-color: var(--ds-color-primary);
  background: color-mix(in srgb, var(--ds-color-primary) 5%, var(--ds-color-surface));
  box-shadow: var(--ds-shadow-sm);
}

/* ── Responsivo ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .ot-index__header {
    padding: 1rem;
  }

  .ot-index__body {
    padding: 1rem;
  }

  .ot-index__cards {
    grid-template-columns: 1fr;
  }

  .ot-index__header-actions {
    width: 100%;
  }
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService, OrcamentoTecnicoService } from '@/services'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'
import PageShell from '@/components/ui/PageShell.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const router = useRouter()

// ── OTs existentes ─────────────────────────────────────────────
const loading = ref(true)
const erro = ref('')
const lista = ref([])

// ── Medições disponíveis ────────────────────────────────────────
const loadingMedicoes = ref(true)
const medicoes = ref([])
const criandoDe = ref(null)

// ── Modal novo orçamento ────────────────────────────────────────
const abrirNovo = ref(false)
const criando = ref(false)
const etapaModal = ref('tipo')       // 'tipo' | 'cliente'
const tipoNovo = ref('')             // 'PROMOB' | 'MANUAL'
const clienteBusca = ref('')
const clientesEncontrados = ref([])
const clienteSelecionado = ref(null)
const usarCadastroRapido = ref(false)
const clienteRapido = ref({ nome_completo: '', telefone: '', whatsapp: '', email: '' })

const tipoNovoLabel = computed(() => {
  if (tipoNovo.value === 'PROMOB') return 'Orçamento via Promob'
  if (tipoNovo.value === 'MANUAL') return 'Orçamento manual'
  return 'Novo Orçamento Técnico'
})

async function carregar() {
  loading.value = true
  erro.value = ''
  try {
    const res = await OrcamentoTecnicoService.listar()
    const raw = res?.data ?? res
    lista.value = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
  } catch (e) {
    lista.value = []
    const status = e?.response?.status
    erro.value = status === 401
      ? 'Faça login novamente para carregar a lista.'
      : (e?.response?.data?.message || 'Erro ao carregar a lista.')
  } finally {
    loading.value = false
  }
}

async function carregarMedicoes() {
  loadingMedicoes.value = true
  try {
    const res = await OrcamentoTecnicoService.listarComMedicao()
    const raw = res?.data ?? res
    medicoes.value = Array.isArray(raw) ? raw : []
  } catch {
    medicoes.value = []
  } finally {
    loadingMedicoes.value = false
  }
}

async function criarDesMedicao(m) {
  if (!can('orcamentos.editar')) return notify.error('Acesso negado.')
  criandoDe.value = m.agenda_loja_id
  try {
    const ambienteIds = (m.ambientes || []).map((a) => a.id)
    const res = await OrcamentoTecnicoService.criarNovo({
      agenda_loja_id: m.agenda_loja_id,
      ambiente_ids: ambienteIds,
    })
    const created = res?.data ?? res
    if (!created?.id) throw new Error('Sem ID retornado.')
    notify.success('Orçamento técnico criado!')
    // Remove da lista de medições e navega para o OT
    medicoes.value = medicoes.value.filter((x) => x.agenda_loja_id !== m.agenda_loja_id)
    router.push(`/orcamento-tecnico/${created.id}`)
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível criar o orçamento técnico.')
  } finally {
    criandoDe.value = null
  }
}

function abrirModalNovo() {
  etapaModal.value = 'tipo'
  tipoNovo.value = ''
  abrirNovo.value = true
}

function selecionarTipoNovo(tipo) {
  tipoNovo.value = tipo
}

function fecharNovo() {
  abrirNovo.value = false
  criando.value = false
  etapaModal.value = 'tipo'
  tipoNovo.value = ''
  clienteBusca.value = ''
  clientesEncontrados.value = []
  clienteSelecionado.value = null
  usarCadastroRapido.value = false
  clienteRapido.value = { nome_completo: '', telefone: '', whatsapp: '', email: '' }
}

function selecionarCliente(cliente) {
  clienteSelecionado.value = cliente
  usarCadastroRapido.value = false
}

function editarOrcamento(id) {
  if (!can('orcamentos.editar')) return notify.error('Acesso negado.')
  router.push(`/orcamento-tecnico/${id}`)
}

async function excluirOrcamento(orcamento) {
  if (!can('orcamentos.excluir')) return notify.error('Acesso negado.')
  const id = Number(orcamento?.id || 0)
  if (!id) return notify.error('Orçamento inválido.')
  const nomeCliente = orcamento?.agenda_loja?.cliente?.nome_completo || orcamento?.agenda_loja?.titulo || `#${id}`
  const ok = await confirm.show('Excluir Orçamento Técnico', `Deseja excluir "${nomeCliente}"? Esta ação não pode ser desfeita.`)
  if (!ok) return
  try {
    await OrcamentoTecnicoService.remover(id)
    lista.value = lista.value.filter((item) => Number(item.id) !== id)
    notify.success('Orçamento técnico excluído.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível excluir.')
  }
}

async function buscarClientes() {
  try {
    const res = await ClienteService.select(clienteBusca.value || '')
    const raw = res?.data ?? []
    clientesEncontrados.value = (Array.isArray(raw) ? raw : [])
      .map((item) => {
        const id = Number(item?.id ?? item?.value ?? 0)
        const nome = String(item?.nome_completo || item?.razao_social || item?.label || '').trim()
        if (!id || !nome) return null
        return { id, label: nome, nome_completo: nome }
      })
      .filter(Boolean)
  } catch {
    clientesEncontrados.value = []
  }
}

async function criarNovoDireto() {
  const payload = { tipo_origem: tipoNovo.value || 'MANUAL' }
  if (usarCadastroRapido.value) {
    if (!String(clienteRapido.value.nome_completo || '').trim()) {
      notify.error('Informe o nome no cadastro rápido.')
      return
    }
    payload.cliente_rapido = { ...clienteRapido.value }
  } else if (clienteSelecionado.value?.id) {
    payload.cliente_id = Number(clienteSelecionado.value.id)
  } else {
    notify.error('Selecione um cliente ou use o cadastro rápido.')
    return
  }
  criando.value = true
  try {
    const res = await OrcamentoTecnicoService.criarDireto(payload)
    const created = res?.data ?? res
    if (!created?.id) throw new Error('Sem ID retornado.')
    notify.success('Orçamento técnico criado!')
    fecharNovo()
    router.push({ path: `/orcamento-tecnico/${created.id}`, query: { origem: tipoNovo.value || 'MANUAL' } })
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao criar orçamento técnico.')
  } finally {
    criando.value = false
  }
}

onMounted(() => {
  carregar()
  carregarMedicoes()
})
</script>
