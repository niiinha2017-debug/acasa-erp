<template>
  <PageShell :padded="false">
    <section class="ds-page-context animate-page-in w-full px-4 md:px-8 pb-8">
      <header class="garantia-page-header">
        <div class="garantia-page-header__main">
          <div class="garantia-page-header__icon" aria-hidden="true">
            <i class="pi pi-wrench" />
          </div>
          <div class="min-w-0">
            <h1 class="garantia-page-header__title">{{ isEditing ? `Garantia #${garantiaId}` : 'Nova Garantia' }}</h1>
            <p class="garantia-page-header__subtitle">
              {{ isEditing ? 'Editar detalhes, fotos e agendar' : 'Preencha os dados da garantia ou assistência' }}
            </p>
          </div>
        </div>

        <div class="garantia-page-header__actions">
          <Button variant="secondary" @click="router.push('/garantias')">
            <i class="pi pi-arrow-left" /> Voltar
          </Button>
        </div>
      </header>

      <div v-if="loadingInicial" class="flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-3xl text-brand-primary" />
      </div>

      <form v-else class="garantia-form pb-12" @submit.prevent="salvar">
        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">{{ tipoConfig.sectionTitle }}</h2>
            <span class="garantia-section__meta">{{ tipoConfig.sectionSubtitle }}</span>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Tipo</label>
              <select v-model="form.tipo" class="ds-input w-full">
                <option value="GARANTIA">Garantia</option>
                <option value="ASSISTENCIA">Assistência</option>
              </select>
            </div>

            <div>
              <label class="ds-label">Título *</label>
              <input v-model="form.titulo" type="text" class="ds-input w-full" :placeholder="tipoConfig.titlePlaceholder" required />
            </div>

            <div>
              <label class="ds-label">Cliente *</label>
              <div class="relative">
                <input
                  v-model="clienteBusca"
                  type="text"
                  class="ds-input w-full"
                  placeholder="Buscar cliente..."
                  @input="buscarClientes"
                  @focus="showClienteDropdown = true"
                />
                <div v-if="form.cliente_id && clienteSelecionado" class="mt-1 text-xs text-brand-primary font-semibold">
                  ✓ {{ clienteSelecionado.nome_completo }}
                </div>
                <ul
                  v-if="showClienteDropdown && clientesOpcoes.length"
                  class="absolute z-30 top-full left-0 right-0 mt-1 bg-[var(--ds-color-surface)] border border-[var(--ds-color-border)] rounded-xl shadow-xl max-h-48 overflow-y-auto"
                >
                  <li
                    v-for="c in clientesOpcoes"
                    :key="clienteOptionId(c)"
                    class="px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--ds-color-surface-muted)] transition-colors"
                    @mousedown.prevent="selecionarCliente(c)"
                  >
                    <span class="font-semibold">{{ clienteOptionLabel(c) }}</span>
                    <span v-if="c.whatsapp" class="ml-2 text-text-muted">{{ c.whatsapp }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label class="ds-label">Venda vinculada</label>
              <select v-model="form.venda_id" class="ds-input w-full" :disabled="!vendasCliente.length">
                <option :value="null">Nenhuma</option>
                <option v-for="v in vendasCliente" :key="v.id" :value="v.id">
                  #{{ v.id }} — {{ moeda(v.valor_vendido) }} ({{ v.status }})
                </option>
              </select>
            </div>
          </div>

          <div v-if="form.venda_id" class="garantia-venda-vinculada">
            <div>
              <div class="garantia-venda-vinculada__header">
                <label class="ds-label">Ambientes da garantia</label>
                <span v-if="ambientesSelecionados.length" class="garantia-venda-vinculada__count">
                  {{ ambientesSelecionados.length }} selecionado<span v-if="ambientesSelecionados.length > 1">s</span>
                </span>
              </div>
              <div v-if="vendaAmbientes.length" class="garantia-venda-vinculada__seletores">
                <label
                  v-for="ambiente in vendaAmbientes"
                  :key="ambiente.nome"
                  class="garantia-venda-vinculada__selector"
                  :class="ambienteSelecionado(ambiente.nome)
                    ? 'garantia-venda-vinculada__selector--ativo'
                    : 'garantia-venda-vinculada__selector--inativo'"
                >
                  <input
                    type="checkbox"
                    class="garantia-venda-vinculada__checkbox"
                    :checked="ambienteSelecionado(ambiente.nome)"
                    @change="toggleAmbienteGarantia(ambiente.nome)"
                  />
                  <span>{{ ambiente.nome }}</span>
                </label>
              </div>
              <p v-else class="garantia-empty-state">Nenhuma medição/ambiente encontrado para esta venda.</p>
              <p v-if="vendaAmbientes.length" class="garantia-ajuda-texto">Selecione apenas os ambientes atendidos nesta garantia.</p>
              <div v-if="ambientesSelecionados.length" class="garantia-venda-vinculada__chips">
                <button
                  v-for="ambiente in ambientesSelecionados"
                  :key="ambiente"
                  type="button"
                  class="garantia-venda-vinculada__chip"
                  @click="toggleAmbienteGarantia(ambiente)"
                >
                  {{ ambiente }}
                  <i class="pi pi-times text-[10px]" />
                </button>
              </div>
            </div>
          </div>

          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Produtos</h2>
            <span class="garantia-section__meta">Itens que serão utilizados na ocorrência</span>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Buscar produto</label>
              <div class="relative">
                <input
                  v-model="produtoBusca"
                  type="text"
                  class="ds-input w-full"
                  placeholder="Digite nome, marca, cor ou medida..."
                  @input="buscarProdutos"
                  @focus="showProdutoDropdown = true"
                />

                <ul
                  v-if="showProdutoDropdown && produtosOpcoes.length"
                  class="absolute z-30 top-full left-0 right-0 mt-1 bg-[var(--ds-color-surface)] border border-[var(--ds-color-border)] rounded-xl shadow-xl max-h-72 overflow-y-auto"
                >
                  <li
                    v-for="produto in produtosOpcoes"
                    :key="produto.id"
                    class="garantia-produto-option"
                    @mousedown.prevent="adicionarProduto(produto)"
                  >
                    <div class="min-w-0">
                      <div class="font-semibold truncate">{{ produto.nome_produto || produto.nome || `Produto #${produto.id}` }}</div>
                      <div class="text-xs text-text-muted truncate">
                        {{ [produto.marca, produto.cor, produto.medida].filter(Boolean).join(' • ') || 'Sem variação informada' }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-semibold">{{ moeda(produto.valor_unitario) }}</div>
                      <div class="text-[11px] text-text-muted">valor base</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div class="garantia-produtos-resumo">
              <div>
                <span class="ds-label">Custo total</span>
                <strong>{{ moeda(totalProdutosCusto) }}</strong>
              </div>
              <div>
                <span class="ds-label">Valor garantia</span>
                <strong>{{ moeda(totalProdutosValorVenda) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="produtosSelecionados.length" class="garantia-produtos-lista">
            <div class="garantia-produtos-head">
              <span>Produto</span>
              <span>Qtd.</span>
              <span>Unit.</span>
              <span>Total</span>
              <span></span>
            </div>

            <div
              v-for="produto in produtosSelecionados"
              :key="produto.id"
              class="garantia-produtos-row"
            >
              <div class="min-w-0 garantia-produto-main">
                <div class="font-semibold truncate">{{ produto.nome_produto }}</div>
                <div class="text-xs text-text-muted truncate">
                  {{ [produto.marca, produto.cor, produto.medida].filter(Boolean).join(' • ') || 'Sem detalhes' }}
                </div>

                <div v-if="produtoUsaArea(produto)" class="garantia-produto-consumo-meta">
                  <label class="ds-label">Uso da chapa</label>
                  <div class="garantia-produto-consumo-base">Informe o tamanho final da peça em cm. Chapa base: {{ dimensaoBaseTexto(produto) }}</div>
                  <div class="garantia-produto-consumo-grid">
                    <input
                      :value="dimensaoUsoCm(produto, 'largura_uso_mm')"
                      type="number"
                      min="0.1"
                      step="0.1"
                      class="ds-input w-full"
                      placeholder="Largura da peça (cm)"
                      @input="atualizarDimensaoUso(produto, 'largura_uso_mm', $event.target.value)"
                    />
                    <input
                      :value="dimensaoUsoCm(produto, 'comprimento_uso_mm')"
                      type="number"
                      min="0.1"
                      step="0.1"
                      class="ds-input w-full"
                      placeholder="Altura da peça (cm)"
                      @input="atualizarDimensaoUso(produto, 'comprimento_uso_mm', $event.target.value)"
                    />
                  </div>
                  <div class="text-[11px] text-text-muted mt-1">
                    {{ areaUsoTexto(produto) }}
                  </div>
                </div>

                <div v-else-if="produtoUsaMetragem(produto)" class="garantia-produto-consumo-meta">
                  <label class="ds-label">Metragem usada</label>
                  <input
                    v-model.number="produto.consumo_metros"
                    type="number"
                    min="0.001"
                    step="0.001"
                    class="ds-input garantia-produto-consumo-input"
                    placeholder="Metros utilizados"
                  />
                  <div class="text-[11px] text-text-muted mt-1">
                    {{ metragemUsoTexto(produto) }}
                  </div>
                </div>
              </div>

              <div>
                <input
                  v-model.number="produto.quantidade"
                  type="number"
                  min="0.001"
                  step="0.001"
                  class="ds-input garantia-produtos-qtd"
                />
                <div class="text-[11px] text-text-muted mt-1">{{ quantidadeLabel(produto) }}</div>
              </div>

              <div class="text-sm">{{ moeda(valorUnitarioEfetivo(produto)) }}</div>
              <div class="text-sm font-semibold">{{ moeda(totalProduto(produto)) }}</div>

              <button type="button" class="garantia-link danger" @click="removerProduto(produto.id)">
                Remover
              </button>
            </div>
          </div>

          <p v-else class="garantia-empty-state">
            Nenhum produto selecionado ainda. Busque e adicione os itens para compor o custo da garantia.
          </p>
        </section>

        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Agendamento</h2>
            <span v-if="!isEditing" class="garantia-section__meta">Opcional — será criado automaticamente ao salvar</span>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Data prevista da ocorrência</label>
              <input v-model="agenda.data" type="date" class="ds-input w-full" />
            </div>
            <div class="garantia-grid garantia-grid--2">
              <div>
                <label class="ds-label">Hora início</label>
                <input v-model="agenda.hora_inicio" type="time" class="ds-input w-full" />
              </div>
              <div>
                <label class="ds-label">Hora fim</label>
                <input v-model="agenda.hora_fim" type="time" class="ds-input w-full" />
              </div>
            </div>
            <div class="garantia-grid garantia-grid--2">
              <div>
                <label class="ds-label">Veículo previsto</label>
                <select
                  :value="agenda.automovel_ids[0] ?? ''"
                  class="ds-input w-full"
                  @change="agenda.automovel_ids = $event.target.value ? [Number($event.target.value)] : []"
                >
                  <option value="">Selecione...</option>
                  <option v-for="automovel in automoveis" :key="automovel.id" :value="automovel.id">
                    {{ automovel.placa }}{{ automovel.descricao ? ` - ${automovel.descricao}` : '' }}
                  </option>
                </select>
              </div>
              <div class="garantia-grid garantia-grid--2">
                <div>
                  <label class="ds-label">KM ida previsto</label>
                  <input :value="agenda.km_ida_prevista" type="number" min="0" step="0.1" class="ds-input w-full" placeholder="0,0" readonly />
                </div>
                <div>
                  <label class="ds-label">KM volta previsto</label>
                  <input :value="agenda.km_volta_prevista" type="number" min="0" step="0.1" class="ds-input w-full" placeholder="0,0" readonly />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="ds-label">Funcionários destinados</label>
            <div class="garantia-destino-picker mt-2">
              <select v-model="funcionarioDestinoSelecionado" class="ds-input w-full">
                <option :value="null">Selecione um funcionário...</option>
                <option v-for="f in funcionariosDisponiveisDestino" :key="f.id" :value="f.id">
                  {{ f.nome }} {{ f.cargo ? `(${f.cargo})` : '' }}
                </option>
              </select>
              <Button type="button" variant="secondary" @click="adicionarFuncionarioDestino">
                <i class="pi pi-plus" />
                Adicionar
              </Button>
            </div>
            <p class="garantia-ajuda-texto">Selecione um funcionário por vez e clique em Adicionar.</p>
            <div v-if="agenda.funcionario_ids.length" class="garantia-destino-resumo">
              <button
                v-for="f in funcionarios.filter((item) => agenda.funcionario_ids.includes(item.id))"
                :key="f.id"
                type="button"
                class="garantia-destino-resumo__chip"
                @click="removerFuncionarioDestino(f.id)"
              >
                {{ f.nome }}
                <i class="pi pi-times text-[10px]" />
              </button>
            </div>
          </div>

            <div class="garantia-km-box">
              <div>
                <span class="garantia-km-box__label">Origem do cálculo de KM</span>
                <strong class="garantia-km-box__value">Cadastro da Empresa x endereço do cliente selecionado</strong>
                <p v-if="kmInfoEndereco" class="garantia-km-box__copy">{{ kmInfoEndereco }}</p>
                <p v-if="kmErro" class="garantia-km-box__erro">{{ kmErro }}</p>
              </div>
              <Button type="button" variant="secondary" :loading="calculandoKm" @click="calcularKmPrevisto">
                <i class="pi pi-map-marker" />
                Calcular KM
              </Button>
          </div>

          <Button
            v-if="isEditing"
            type="button"
            variant="secondary"
            :loading="agendando"
            :disabled="!agendaInicioEm || !agendaFimEm"
            @click="criarAgendamento"
          >
            <i class="pi pi-calendar-plus" />
            Criar Agendamento
          </Button>
        </section>

        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Detalhes da ocorrência</h2>
            <span class="garantia-section__meta">Descrição operacional e observações complementares</span>
          </div>

          <div>
            <label class="ds-label">{{ tipoConfig.problemLabel }}</label>
            <textarea v-model="form.descricao" class="ds-input w-full min-h-[100px]" :placeholder="tipoConfig.problemPlaceholder" />
          </div>

          <div>
            <label class="ds-label">{{ tipoConfig.processLabel }}</label>
            <textarea v-model="form.processo" class="ds-input w-full min-h-[100px]" :placeholder="tipoConfig.processPlaceholder" />
          </div>

          <div>
            <label class="ds-label">Observações</label>
            <textarea v-model="form.observacoes" class="ds-input w-full min-h-[80px]" placeholder="Observações adicionais..." />
          </div>
        </section>

        <section class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Custos calculados</h2>
            <span class="garantia-section__meta">Calculado automaticamente a partir dos produtos e horas</span>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Forma de pagamento</label>
              <select v-model="form.forma_pagamento_chave" class="ds-input w-full">
                <option value="">Selecione...</option>
                <option v-for="opt in formasPagamentoOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="ds-label">Prazo previsto (horas)</label>
              <input v-model="form.horas_previstas" type="number" min="0" step="0.25" class="ds-input w-full" placeholder="0,00" />
            </div>
          </div>

          <div class="garantia-grid garantia-grid--2">
            <div>
              <label class="ds-label">Parcelas</label>
              <input
                v-model.number="form.quantidade_parcelas"
                type="number"
                min="1"
                max="12"
                step="1"
                class="ds-input w-full"
                placeholder="1"
              />
            </div>
            <div>
              <label class="ds-label">Valor por parcela</label>
              <div class="ds-input w-full flex items-center">{{ moeda(valorParcela) }}</div>
            </div>
          </div>

          <div class="garantia-resumo-financeiro">
            <div>
              <span class="ds-label">Produtos</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_produtos) }}</strong>
            </div>
            <div>
              <span class="ds-label">Mão de obra prevista</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_mao_obra_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">Veículo / rota prevista</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_veiculo_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo fábrica previsto</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_fabrica_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo total calculado</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_total_previsto) }}</strong>
            </div>
            <div>
              <span class="ds-label">{{ tipoConfig.suggestedChargeLabel }}</span>
              <strong :class="tipoConfig.chargeAccentClass">{{ moeda(resumoFinanceiroPreview.valor_cobrado) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo hora fábrica</span>
              <strong>{{ moeda(resumoFinanceiroPreview.custo_hora_estrutura) }}</strong>
            </div>
          </div>

          <div class="garantia-valor-cobrar">
            <div class="garantia-valor-cobrar__header">
              <div>
                <span class="garantia-valor-cobrar__label">{{ tipoConfig.editableAmountLabel }}</span>
                <span class="garantia-valor-cobrar__hint">{{ tipoConfig.editableAmountHint }}</span>
              </div>
              <button type="button" class="garantia-valor-cobrar__sugestao" @click="usarSugestaoCobranca">
                Usar cálculo ({{ moeda(resumoFinanceiroPreview.valor_cobrado) }})
              </button>
            </div>
            <div class="garantia-valor-cobrar__input-wrap">
              <span class="garantia-valor-cobrar__prefix">R$</span>
              <input
                v-model="form.valor_venda"
                type="text"
                class="garantia-valor-cobrar__input"
                placeholder="0,00"
                @blur="formatarValorCobrar"
              />
            </div>
            <div v-if="valorCobrarNumero > 0" class="garantia-valor-cobrar__margem">
              <span>{{ tipoCobravel ? 'Margem sobre custo:' : 'Referência sobre custo:' }}</span>
              <strong :class="margemClass">{{ margemTexto }}</strong>
            </div>
          </div>

          <div v-if="tipoCobravel && valorCobrarNumero > 0" class="garantia-cobranca-aviso">
            <i class="pi pi-info-circle" />
            <span>Ao salvar, será gerada uma <strong>conta a receber</strong> de <strong>{{ moeda(valorCobrarNumero) }}</strong> vinculada a esta {{ tipoConfig.entityLabel }}.</span>
          </div>
          <div v-else class="garantia-cobranca-aviso" style="background: color-mix(in srgb, var(--ds-color-warning, #f59e0b) 10%, transparent); color: var(--ds-color-warning, #92400e);">
            <i class="pi pi-exclamation-triangle" />
            <span>Garantia não gera cobrança nem conta a receber. O valor de <strong>{{ moeda(valorCobrarNumero || resumoFinanceiroPreview.valor_cobrado) }}</strong> fica como referência interna, enquanto o custo de <strong>{{ moeda(resumoFinanceiroPreview.custo_total_previsto) }}</strong> será absorvido pela empresa.</span>
          </div>
        </section>

        <section v-if="isEditing" class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Realizado</h2>
            <span class="garantia-section__meta">Horas e custos apurados pelos apontamentos da garantia</span>
          </div>

          <div v-if="!resumoFinanceiroRealExibicao.tem_apontamento_real" class="garantia-ajuda-texto">
            Ainda não há apontamentos realizados. Por enquanto, o bloco abaixo mostra apenas os custos já lançados na garantia.
          </div>

          <div class="garantia-resumo-financeiro">
            <div>
              <span class="ds-label">Produtos lançados</span>
              <strong>{{ moeda(resumoFinanceiroRealExibicao.custo_produtos_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Horas realizadas</span>
              <strong>{{ numeroResumo(resumoFinanceiroRealExibicao.horas_realizadas) }}h</strong>
            </div>
            <div>
              <span class="ds-label">Mão de obra real</span>
              <strong>{{ moeda(resumoFinanceiroRealExibicao.custo_mao_obra_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Veículo / rota real</span>
              <strong>{{ moeda(resumoFinanceiroRealExibicao.custo_veiculo_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Custo fábrica real</span>
              <strong>{{ moeda(resumoFinanceiroRealExibicao.custo_fabrica_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Total real</span>
              <strong>{{ moeda(resumoFinanceiroRealExibicao.custo_total_real) }}</strong>
            </div>
            <div>
              <span class="ds-label">Valor cobrado</span>
              <strong>{{ moeda(resumoFinanceiroRealExibicao.valor_cobrado) }}</strong>
            </div>
          </div>
        </section>

        <section v-if="isEditing" class="garantia-section">
          <div class="garantia-section__header">
            <h2 class="garantia-section__title">Fotos</h2>
          </div>

          <div class="garantia-fotos-grid">
            <div
              v-for="foto in fotos"
              :key="foto.id"
              class="garantia-foto-item group"
            >
              <img :src="fotoUrl(foto)" class="w-full h-full object-cover" :alt="foto.nome || 'Foto'" />
              <button
                type="button"
                class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                @click="removerFoto(foto.id)"
              >
                <i class="pi pi-times text-xs" />
              </button>
            </div>

            <div
              class="garantia-foto-upload"
              @click="fotoInput?.click()"
            >
              <i class="pi pi-camera text-2xl text-text-muted mb-1" />
              <span class="text-[10px] font-bold text-text-muted uppercase">Adicionar</span>
              <input ref="fotoInput" type="file" accept="image/*" multiple class="hidden" @change="uploadFotos" />
            </div>
          </div>
        </section>

        <section class="garantia-section garantia-section--actions">
          <div class="garantia-actions">
            <div>
              <select v-if="isEditing" v-model="form.status" class="ds-input">
                <option value="PENDENTE">Pendente</option>
                <option value="AGENDADA">Agendada</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <Button v-if="isEditing" variant="secondary" type="button" :loading="enviandoWhats" @click="enviarWhatsapp">
                <i class="pi pi-whatsapp" /> Enviar OS
              </Button>
              <Button v-if="isEditing" variant="secondary" type="button" :loading="gerandoPdf" @click="gerarPdf">
                <i class="pi pi-file-pdf" /> Gerar PDF
              </Button>
              <Button v-if="isEditing && podeExcluirGarantia" variant="danger" type="button" :loading="removendo" @click="confirmarRemover">
                <i class="pi pi-trash" /> Excluir
              </Button>
              <Button variant="primary" type="submit" :loading="salvando" :disabled="isEditing && !podeEditarGarantia">
                <i class="pi pi-check" />
                {{ isEditing ? 'Salvar alterações' : 'Criar Garantia' }}
              </Button>
            </div>
          </div>
        </section>
      </form>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import PageShell from '@/components/ui/PageShell.vue'
import { FORMAS_PAGAMENTO } from '@/constantes'
import { GarantiaService, ClienteService, FuncionariosService, ProdutosService, VendaService, AutomoveisService, ConfiguracaoService, CustosEstruturaService } from '@/services'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { saveBlobNativeOrBrowser } from '@/utils/native-download'

definePage({ meta: { perm: 'garantias.ver' } })

const route = useRoute()
const router = useRouter()
const podeEditarGarantia = can('garantias.editar')
const podeExcluirGarantia = can('garantias.deletar')

const garantiaId = computed(() => {
  const raw = route.params.id
  if (raw === 'nova') return null
  const n = Number(String(raw || '').replace(/\D/g, ''))
  return n || null
})
const isEditing = computed(() => !!garantiaId.value)

const loadingInicial = ref(false)
const salvando = ref(false)
const removendo = ref(false)
const agendando = ref(false)
const gerandoPdf = ref(false)
const enviandoWhats = ref(false)
const resumoFinanceiroReal = ref(null)
const empresaConfig = ref(null)
const calculandoKm = ref(false)
const kmErro = ref('')
const vendaAmbientes = ref([])

const form = ref({
  tipo: 'GARANTIA',
  titulo: '',
  cliente_id: null,
  venda_id: null,
  descricao: '',
  processo: '',
  horas_previstas: '',
  custo_produtos: '',
  custo_mao_obra_previsto: '',
  custo_fabrica_previsto: '',
  custo: '',
  valor_venda: '',
  forma_pagamento_chave: '',
  quantidade_parcelas: 1,
  data_previsao: '',
  data_conclusao: '',
  observacoes: '',
  status: 'PENDENTE',
})

const agenda = ref({
  titulo: '',
  data: '',
  hora_inicio: '',
  hora_fim: '',
  funcionario_ids: [],
  automovel_ids: [],
  km_ida_prevista: '',
  km_volta_prevista: '',
})

const agendaInicioEm = computed(() => {
  if (!agenda.value.data || !agenda.value.hora_inicio) return ''
  return `${agenda.value.data}T${agenda.value.hora_inicio}`
})

const agendaFimEm = computed(() => {
  if (!agenda.value.data || !agenda.value.hora_fim) return ''
  return `${agenda.value.data}T${agenda.value.hora_fim}`
})

const kmInfoEndereco = computed(() => {
  const origem = montarEnderecoEmpresa()
  const destino = montarEnderecoCliente(clienteSelecionado.value)
  if (!origem || !destino) return ''
  return `Origem: ${origem} | Destino: ${destino}`
})

const enderecoEmpresaCompleto = computed(() => montarEnderecoEmpresa())
const enderecoClienteCompleto = computed(() => montarEnderecoCliente(clienteSelecionado.value))

const formasPagamentoOptions = computed(() => {
  return (FORMAS_PAGAMENTO || []).map((item) => ({ label: item.label, value: item.key }))
})

const tipoCobravel = computed(() => form.value.tipo === 'ASSISTENCIA' || form.value.tipo === 'MANUTENCAO')

const tipoConfig = computed(() => {
  if (tipoCobravel.value) {
    return {
      sectionTitle: 'Dados da Assistência',
      sectionSubtitle: 'Fluxo cobravel com custo estimado, agendamento e conta a receber',
      titlePlaceholder: 'Ex: Ajuste de dobradiça e alinhamento de portas',
      problemLabel: 'Problema relatado / Solicitação do cliente',
      problemPlaceholder: 'Descreva o chamado, defeito ou necessidade atendida...',
      processLabel: 'Serviço a executar',
      processPlaceholder: 'Descreva exatamente o serviço técnico que será realizado...',
      agendaPrefix: 'Assistência',
      suggestedChargeLabel: 'Sugestão de cobrança',
      editableAmountLabel: 'Valor a cobrar do cliente',
      editableAmountHint: 'Informe o valor que será incluído no PDF e conta a receber',
      chargeAccentClass: 'text-brand-primary',
      entityLabel: 'assistência',
    }
  }

  return {
    sectionTitle: 'Dados da Garantia',
    sectionSubtitle: 'Fluxo interno com custo absorvido pela empresa e sem cobrança ao cliente',
    titlePlaceholder: 'Ex: Troca de porta cozinha em garantia',
    problemLabel: 'Ocorrência coberta pela garantia',
    problemPlaceholder: 'Descreva o que falhou e por que o atendimento está sendo tratado como garantia...',
    processLabel: 'Correção prevista',
    processPlaceholder: 'Descreva a solução que será executada dentro da garantia...',
    agendaPrefix: 'Garantia',
    suggestedChargeLabel: 'Referência interna',
    editableAmountLabel: 'Valor interno de referência',
    editableAmountHint: 'Usado como referência operacional, sem gerar conta a receber',
    chargeAccentClass: 'text-[var(--ds-color-warning,#92400e)]',
    entityLabel: 'garantia',
  }
})

const RESUMO_PRODUTOS_INICIO = '[PRODUTOS_GARANTIA]'
const RESUMO_PRODUTOS_FIM = '[/PRODUTOS_GARANTIA]'
const RESUMO_AMBIENTES_INICIO = '[AMBIENTES_GARANTIA]'
const RESUMO_AMBIENTES_FIM = '[/AMBIENTES_GARANTIA]'
const ambientesSelecionados = ref([])

// Produtos
const produtoBusca = ref('')
const produtosCatalogo = ref([])
const produtosOpcoes = ref([])
const produtosSelecionados = ref([])
const showProdutoDropdown = ref(false)
const funcionarioDestinoSelecionado = ref(null)
let produtoBuscaTimeout = null

function numeroProduto(valor) {
  const n = Number(valor ?? 0)
  return Number.isFinite(n) ? n : 0
}

function normalizarProduto(produto) {
  const larguraBase = Number(produto.largura_mm || 0) || null
  const comprimentoBase = Number(produto.comprimento_mm || 0) || null
  const metragemRolo = Number(produto.metragem_rolo_m || 0) || null
  const usaArea = !!(larguraBase && comprimentoBase)

  return {
    id: produto.id,
    nome_produto: produto.nome_produto || produto.nome || `Produto #${produto.id}`,
    marca: produto.marca || '',
    cor: produto.cor || '',
    medida: produto.medida || '',
    unidade: produto.unidade || produto.unidade_consumo || produto.unidade_compra || '',
    largura_mm: larguraBase,
    comprimento_mm: comprimentoBase,
    preco_m2: numeroProduto(produto.preco_m2),
    metragem_rolo_m: metragemRolo,
    valor_unitario: numeroProduto(produto.valor_unitario ?? produto.valor_total ?? produto.custo_unitario_real),
    quantidade: Math.max(0.001, Number(produto.quantidade || 1)),
    largura_uso_mm: usaArea ? null : larguraBase,
    comprimento_uso_mm: usaArea ? null : comprimentoBase,
    consumo_metros: metragemRolo ? 1 : null,
  }
}

function hidratarProdutoSelecionado(produto) {
  const produtoCatalogo = produtosCatalogo.value.find((item) => Number(item.id) === Number(produto.id))
  const larguraSalva = produto.largura_uso_mm != null && produto.largura_uso_mm !== ''
  const comprimentoSalvo = produto.comprimento_uso_mm != null && produto.comprimento_uso_mm !== ''
  return {
    ...normalizarProduto(produtoCatalogo || produto),
    ...produto,
    quantidade: Math.max(0.001, Number(produto.quantidade || 1)),
    largura_uso_mm: larguraSalva ? Number(produto.largura_uso_mm) : null,
    comprimento_uso_mm: comprimentoSalvo ? Number(produto.comprimento_uso_mm) : null,
    consumo_metros: produto.consumo_metros ? Number(produto.consumo_metros) : (produto.metragem_rolo_m ? 1 : null),
  }
}

function produtoUsaArea(produto) {
  return !!(produto?.largura_mm && produto?.comprimento_mm)
}

function produtoUsaMetragem(produto) {
  return !produtoUsaArea(produto) && Number(produto?.metragem_rolo_m || 0) > 0
}

function areaUsoM2(produto) {
  const largura = Number(produto?.largura_uso_mm || 0)
  const comprimento = Number(produto?.comprimento_uso_mm || 0)
  if (!largura || !comprimento) return 0
  return (largura * comprimento) / 1000000
}

function areaBaseM2(produto) {
  const largura = Number(produto?.largura_mm || 0)
  const comprimento = Number(produto?.comprimento_mm || 0)
  if (!largura || !comprimento) return 0
  return (largura * comprimento) / 1000000
}

function mmParaCm(valor) {
  const numero = Number(valor || 0)
  if (!numero) return ''
  return Number((numero / 10).toFixed(2))
}

function dimensaoUsoCm(produto, campo) {
  return mmParaCm(produto?.[campo])
}

function atualizarDimensaoUso(produto, campo, valor) {
  const normalizado = String(valor ?? '').replace(',', '.').trim()
  if (!normalizado) {
    produto[campo] = null
    return
  }
  const numero = Number(normalizado)
  produto[campo] = Number.isFinite(numero) && numero > 0 ? Math.round(numero * 10) : null
}

function dimensaoBaseTexto(produto) {
  const largura = mmParaCm(produto?.largura_mm)
  const comprimento = mmParaCm(produto?.comprimento_mm)
  if (!largura || !comprimento) return 'sem medida cadastrada'
  return `${largura} x ${comprimento} cm`
}

function custoProporcionalArea(produto) {
  const areaUso = areaUsoM2(produto)
  if (!areaUso) return 0
  const precoM2 = Number(produto?.preco_m2 || 0)
  if (precoM2 > 0) return areaUso * precoM2

  const areaBase = areaBaseM2(produto)
  if (!areaBase) return Number(produto?.valor_unitario || 0)
  return (areaUso / areaBase) * Number(produto?.valor_unitario || 0)
}

function custoProporcionalMetragem(produto) {
  const metragemUsada = Number(produto?.consumo_metros || 0)
  const metragemBase = Number(produto?.metragem_rolo_m || 0)
  const valorBase = Number(produto?.valor_unitario || 0)
  if (!metragemUsada || !metragemBase || !valorBase) return 0
  return (metragemUsada / metragemBase) * valorBase
}

function valorUnitarioEfetivo(produto) {
  if (produtoUsaArea(produto)) {
    return custoProporcionalArea(produto)
  }
  if (produtoUsaMetragem(produto)) {
    return custoProporcionalMetragem(produto)
  }
  return Number(produto?.valor_unitario || 0)
}

function totalProduto(produto) {
  return numeroProduto(produto?.quantidade) * valorUnitarioEfetivo(produto)
}

function quantidadeLabel(produto) {
  if (produtoUsaArea(produto)) return 'Quantidade de pedaços usados'
  if (produtoUsaMetragem(produto)) return 'Quantidade de aplicações'
  return `Quantidade${produto?.unidade ? ` (${produto.unidade})` : ''}`
}

function areaUsoTexto(produto) {
  const areaUso = areaUsoM2(produto)
  const areaBase = areaBaseM2(produto)
  if (!areaUso) return 'Informe a área usada da chapa'
  if (!areaBase) return `${numeroResumo(areaUso)} m2 utilizados`
  const percentual = (areaUso / areaBase) * 100
  return `${numeroResumo(areaUso)} m2 utilizados (${numeroResumo(percentual)}% da chapa)`
}

function metragemUsoTexto(produto) {
  const usada = Number(produto?.consumo_metros || 0)
  const total = Number(produto?.metragem_rolo_m || 0)
  if (!usada) return 'Informe quantos metros foram usados'
  if (!total) return `${numeroResumo(usada)} m utilizados`
  const percentual = (usada / total) * 100
  return `${numeroResumo(usada)} m utilizados de ${numeroResumo(total)} m (${numeroResumo(percentual)}%)`
}

function montarResumoProdutos() {
  if (!produtosSelecionados.value.length) return ''

  const linhas = produtosSelecionados.value.map((produto) => (
    `- ${produto.id}|${produto.nome_produto}|${produto.quantidade}|${numeroProduto(produto.valor_unitario).toFixed(2)}|${produto.marca}|${produto.cor}|${produto.medida}|${produto.largura_uso_mm || ''}|${produto.comprimento_uso_mm || ''}|${produto.consumo_metros || ''}`
  ))

  return [RESUMO_PRODUTOS_INICIO, ...linhas, RESUMO_PRODUTOS_FIM].join('\n')
}

function aplicarResumoProdutosNaObservacao(textoBase = '') {
  const textoLimpo = limparResumoAmbientes(limparResumoProdutos(textoBase)).trim()
  const resumo = montarResumoProdutos()
  const resumoAmbientes = montarResumoAmbientes()
  return [textoLimpo, resumoAmbientes, resumo].filter(Boolean).join('\n\n')
}

function montarResumoAmbientes() {
  if (!ambientesSelecionados.value.length) return ''
  return [
    RESUMO_AMBIENTES_INICIO,
    ...ambientesSelecionados.value.map((ambiente) => `- ${ambiente}`),
    RESUMO_AMBIENTES_FIM,
  ].join('\n')
}

function limparResumoProdutos(texto = '') {
  let textoLimpo = String(texto || '')
    .replace(new RegExp(`${RESUMO_PRODUTOS_INICIO}[\\s\\S]*?${RESUMO_PRODUTOS_FIM}`, 'g'), '')
  if (extrairProdutosLegado(texto).length) {
    textoLimpo = textoLimpo.replace(/\[[^\]]*\|[^\]]*\|[^\]]*\]/g, '')
  }
  return textoLimpo
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function limparResumoAmbientes(texto = '') {
  return String(texto || '')
    .replace(new RegExp(`${RESUMO_AMBIENTES_INICIO}[\\s\\S]*?${RESUMO_AMBIENTES_FIM}`, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extrairAmbientesDasObservacoes(texto = '') {
  const match = String(texto || '').match(new RegExp(`${RESUMO_AMBIENTES_INICIO}\\n([\\s\\S]*?)\\n${RESUMO_AMBIENTES_FIM}`))
  if (!match?.[1]) return []

  return match[1]
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha.startsWith('- '))
    .map((linha) => linha.slice(2).trim())
    .filter(Boolean)
}

function ambienteSelecionado(nome) {
  return ambientesSelecionados.value.includes(String(nome || '').trim())
}

function toggleAmbienteGarantia(nome) {
  const ambiente = String(nome || '').trim()
  if (!ambiente) return
  const lista = new Set(ambientesSelecionados.value)
  if (lista.has(ambiente)) {
    lista.delete(ambiente)
  } else {
    lista.add(ambiente)
  }
  ambientesSelecionados.value = Array.from(lista)
}

function extrairProdutosDasObservacoes(texto = '') {
  const match = String(texto || '').match(new RegExp(`${RESUMO_PRODUTOS_INICIO}\\n([\\s\\S]*?)\\n${RESUMO_PRODUTOS_FIM}`))
  if (!match?.[1]) return extrairProdutosLegado(texto)

  return match[1]
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha.startsWith('- '))
    .map((linha) => linha.slice(2).split('|'))
    .map(([id, nome_produto, quantidade, valor_unitario, marca, cor, medida, largura_uso_mm, comprimento_uso_mm, consumo_metros]) => ({
      id: Number(id),
      nome_produto: nome_produto || '',
      quantidade: Math.max(0.001, Number(quantidade || 1)),
      valor_unitario: numeroProduto(valor_unitario),
      marca: marca || '',
      cor: cor || '',
      medida: medida || '',
      largura_uso_mm: largura_uso_mm ? Number(largura_uso_mm) : null,
      comprimento_uso_mm: comprimento_uso_mm ? Number(comprimento_uso_mm) : null,
      consumo_metros: consumo_metros ? Number(consumo_metros) : null,
    }))
    .filter((produto) => produto.id && produto.nome_produto)
}

function extrairProdutosLegado(texto = '') {
  const blocos = Array.from(String(texto || '').matchAll(/\[([\s\S]*?)\]/g))
  return blocos
    .map((match, index) => {
      const bruto = String(match[1] || '').replace(/\r/g, '').replace(/\n/g, '').trim()
      if ((bruto.match(/\|/g) || []).length < 3) return null

      const partes = bruto.split('|').map((parte) => String(parte || '').trim())
      const nome = partes[0] || `Produto legado ${index + 1}`
      const valorUnitario = numeroProduto(partes[1])
      const quantidadeInformada = Number(partes[2])
      const quantidade = Number.isFinite(quantidadeInformada) && quantidadeInformada > 0 ? quantidadeInformada : 1
      const medida = partes[3] && partes[3] !== 'null' ? partes[3] : ''
      const cor = partes[6] && partes[6] !== 'null' ? partes[6] : ''
      const marca = partes[7] && partes[7] !== 'null' ? partes[7] : ''

      if (!nome && !valorUnitario) return null

      return {
        id: -(index + 1),
        nome_produto: nome,
        quantidade,
        valor_unitario: valorUnitario,
        marca,
        cor,
        medida,
        largura_uso_mm: null,
        comprimento_uso_mm: null,
        consumo_metros: null,
      }
    })
    .filter(Boolean)
}

async function buscarProdutos() {
  showProdutoDropdown.value = true
  clearTimeout(produtoBuscaTimeout)
  produtoBuscaTimeout = setTimeout(async () => {
    const q = produtoBusca.value?.trim()
    if (!q) {
      produtosOpcoes.value = produtosCatalogo.value.slice(0, 30)
      return
    }

    const termo = q.toLowerCase()
    const filtrados = produtosCatalogo.value.filter((produto) => {
      const alvo = [
        produto.nome_produto,
        produto.nome,
        produto.marca,
        produto.cor,
        produto.medida,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return alvo.includes(termo)
    })

    produtosOpcoes.value = filtrados.slice(0, 30)
  }, 250)
}

async function carregarProdutos() {
  try {
    const { data } = await ProdutosService.listar()
    const itens = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    produtosCatalogo.value = itens
    produtosOpcoes.value = itens.slice(0, 30)
  } catch (e) {
    console.error(e)
    produtosCatalogo.value = []
    produtosOpcoes.value = []
    notify.error('Falha ao carregar produtos')
  }
}

function adicionarProduto(produto) {
  const existente = produtosSelecionados.value.find((item) => item.id === produto.id)
  if (existente) {
    existente.quantidade += 1
  } else {
    produtosSelecionados.value.push(hidratarProdutoSelecionado(produto))
  }
  produtoBusca.value = ''
  produtosOpcoes.value = []
  showProdutoDropdown.value = false
}

function removerProduto(produtoId) {
  produtosSelecionados.value = produtosSelecionados.value.filter((produto) => produto.id !== produtoId)
}

function toggleFuncionarioDestino(funcionarioId) {
  const ids = new Set(agenda.value.funcionario_ids || [])
  if (ids.has(funcionarioId)) {
    ids.delete(funcionarioId)
  } else {
    ids.add(funcionarioId)
  }
  agenda.value.funcionario_ids = Array.from(ids)
}

function adicionarFuncionarioDestino() {
  const funcionarioId = Number(funcionarioDestinoSelecionado.value || 0)
  if (!funcionarioId) return
  if (!agenda.value.funcionario_ids.includes(funcionarioId)) {
    agenda.value.funcionario_ids = [...agenda.value.funcionario_ids, funcionarioId]
  }
  funcionarioDestinoSelecionado.value = null
}

function removerFuncionarioDestino(funcionarioId) {
  agenda.value.funcionario_ids = agenda.value.funcionario_ids.filter((id) => id !== funcionarioId)
}

const funcionariosDisponiveisDestino = computed(() => {
  const selecionados = new Set(agenda.value.funcionario_ids || [])
  return funcionarios.value.filter((funcionario) => !selecionados.has(funcionario.id))
})

const totalProdutosCusto = computed(() => (
  produtosSelecionados.value.reduce((total, produto) => total + totalProduto(produto), 0)
))

const totalProdutosValorVenda = computed(() => totalProdutosCusto.value * 2)

// Clientes
const clienteBusca = ref('')
const clientesOpcoes = ref([])
const clienteSelecionado = ref(null)
const showClienteDropdown = ref(false)
let buscaTimeout = null
let kmAutoCalcTimeout = null

function buscarClientes() {
  showClienteDropdown.value = true
  clearTimeout(buscaTimeout)
  buscaTimeout = setTimeout(async () => {
    const q = clienteBusca.value?.trim()
    if (!q || q.length < 2) { clientesOpcoes.value = []; return }
    try {
      const { data } = await ClienteService.select(q)
      clientesOpcoes.value = Array.isArray(data) ? data : []
    } catch { clientesOpcoes.value = [] }
  }, 300)
}

function clienteOptionId(cliente) {
  if (cliente?.id != null) return Number(cliente.id)
  if (cliente?.value != null) return Number(cliente.value)
  return null
}

function clienteOptionLabel(cliente) {
  return cliente?.label || cliente?.nome_completo || cliente?.razao_social || cliente?.nome || ''
}

async function selecionarCliente(c) {
  const clienteId = clienteOptionId(c)
  if (!clienteId) return

  form.value.cliente_id = clienteId
  clienteBusca.value = clienteOptionLabel(c)
  showClienteDropdown.value = false
  try {
    const { data } = await ClienteService.buscar(clienteId)
    clienteSelecionado.value = data || null
  } catch {
    clienteSelecionado.value = {
      id: clienteId,
      nome_completo: clienteOptionLabel(c),
    }
  }
  carregarVendasCliente(clienteId)
}

function montarEnderecoEmpresa() {
  const empresa = empresaConfig.value || {}
  return [empresa.logradouro, empresa.numero, empresa.bairro, empresa.cidade, empresa.uf, empresa.cep]
    .filter(Boolean)
    .join(', ')
}

function montarEnderecoCliente(cliente) {
  if (!cliente) return ''
  return [cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(', ')
}

async function geocodificarEndereco(endereco) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(endereco)}`)
  if (!response.ok) throw new Error('Falha ao geocodificar endereço')
  const data = await response.json()
  const item = Array.isArray(data) ? data[0] : null
  if (!item?.lat || !item?.lon) throw new Error('Endereço não localizado no mapa')
  return { lat: Number(item.lat), lon: Number(item.lon) }
}

async function calcularKmPrevisto() {
  kmErro.value = ''
  const origem = montarEnderecoEmpresa()
  const destino = montarEnderecoCliente(clienteSelecionado.value)
  if (!origem || !destino) {
    agenda.value.km_ida_prevista = ''
    agenda.value.km_volta_prevista = ''
    return
  }

  calculandoKm.value = true
  try {
    const [origemGeo, destinoGeo] = await Promise.all([
      geocodificarEndereco(origem),
      geocodificarEndereco(destino),
    ])
    const rotaResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${origemGeo.lon},${origemGeo.lat};${destinoGeo.lon},${destinoGeo.lat}?overview=false`)
    if (!rotaResponse.ok) throw new Error('Falha ao calcular rota')
    const rotaData = await rotaResponse.json()
    const distanciaMetros = rotaData?.routes?.[0]?.distance
    if (!distanciaMetros) throw new Error('Distância não disponível para os endereços informados')
    const km = (Number(distanciaMetros) / 1000).toFixed(1)
    agenda.value.km_ida_prevista = km
    agenda.value.km_volta_prevista = km
  } catch (error) {
    console.error(error)
    agenda.value.km_ida_prevista = ''
    agenda.value.km_volta_prevista = ''
    kmErro.value = 'Não foi possível calcular o KM automaticamente. Revise os endereços no cadastro da empresa e do cliente.'
  } finally {
    calculandoKm.value = false
  }
}

// Vendas do cliente
const vendasCliente = ref([])
async function carregarVendasCliente(clienteId) {
  if (!clienteId) { vendasCliente.value = []; return }
  try {
    const { data } = await VendaService.listar()
    const todas = Array.isArray(data) ? data : []
    vendasCliente.value = todas.filter(v => v.cliente_id === clienteId)
  } catch { vendasCliente.value = [] }
}

async function carregarVendaVinculada(vendaId) {
  if (!vendaId) {
    vendaAmbientes.value = []
    ambientesSelecionados.value = []
    return
  }

  try {
    const { data: ambientes } = await VendaService.listarAmbientes(vendaId)
    vendaAmbientes.value = Array.isArray(ambientes) ? ambientes : []
    if (ambientesSelecionados.value.length) {
      const permitidos = new Set(vendaAmbientes.value.map((item) => String(item.nome || '').trim()).filter(Boolean))
      ambientesSelecionados.value = ambientesSelecionados.value.filter((nome) => permitidos.has(nome))
    }
  } catch (error) {
    console.error(error)
    vendaAmbientes.value = []
  }
}

// Funcionários
const funcionarios = ref([])
const automoveis = ref([])
const custoHoraEstrutura = ref(0)
async function carregarFuncionarios() {
  try {
    const { data } = await FuncionariosService.listar()
    funcionarios.value = (Array.isArray(data) ? data : []).filter(f => f.status === 'ATIVO')
  } catch { funcionarios.value = [] }
}

async function carregarEmpresa() {
  try {
    empresaConfig.value = await ConfiguracaoService.carregar()
  } catch {
    empresaConfig.value = null
  }
}

async function carregarAutomoveis() {
  try {
    const { data } = await AutomoveisService.listar({ status: 'ATIVO' })
    automoveis.value = Array.isArray(data) ? data : []
  } catch {
    automoveis.value = []
  }
}

async function carregarCustoHoraEstrutura() {
  const agora = new Date()
  try {
    const { data } = await CustosEstruturaService.getByMesAno(agora.getMonth() + 1, agora.getFullYear())
    custoHoraEstrutura.value = Number(data?.custo_hora_estrutura ?? data?.custo_hora ?? 0) || 0
  } catch {
    custoHoraEstrutura.value = 0
  }
}

// Fotos
const fotos = ref([])
const fotoInput = ref(null)

function fotoUrl(foto) {
  if (!foto.url) return ''
  return foto.url.startsWith('http') ? foto.url : `/api${foto.url}`
}

async function carregarFotos() {
  if (!garantiaId.value) return
  try {
    const { data } = await ArquivosService.listar({ ownerType: 'GARANTIA', ownerId: garantiaId.value })
    fotos.value = Array.isArray(data) ? data : []
  } catch { fotos.value = [] }
}

async function uploadFotos(e) {
  const files = e.target?.files
  if (!files?.length || !garantiaId.value) return

  for (const file of files) {
    try {
      await ArquivosService.upload({
        ownerType: 'GARANTIA',
        ownerId: garantiaId.value,
        file,
        categoria: 'FOTO',
      })
    } catch (err) {
      console.error(err)
      notify.error(`Falha ao enviar ${file.name}`)
    }
  }
  fotoInput.value.value = ''
  await carregarFotos()
  notify.success('Foto(s) enviada(s)')
}

async function removerFoto(fotoId) {
  if (!confirm('Remover esta foto?')) return
  try {
    await ArquivosService.remover(fotoId)
    await carregarFotos()
    notify.success('Foto removida')
  } catch {
    notify.error('Falha ao remover foto')
  }
}

// Salvar
async function salvar() {
  if (!form.value.cliente_id) { notify.warn('Selecione um cliente'); return }
  if (!form.value.titulo?.trim()) { notify.warn('Informe o título'); return }
  if (isEditing.value && !podeEditarGarantia) { notify.error('Seu usuário não tem permissão para editar garantias'); return }

  salvando.value = true
  try {
    const payload = {
      ...form.value,
      data_previsao: agenda.value.data || form.value.data_previsao || '',
      custo_produtos: String(resumoFinanceiroPreview.value.custo_produtos.toFixed(2)),
      custo_mao_obra_previsto: String(resumoFinanceiroPreview.value.custo_mao_obra_previsto.toFixed(2)),
      custo_fabrica_previsto: String(resumoFinanceiroPreview.value.custo_fabrica_previsto.toFixed(2)),
      horas_previstas: String(resumoFinanceiroPreview.value.horas_previstas.toFixed(2)),
      quantidade_parcelas: Math.max(1, Number(form.value.quantidade_parcelas || 1) || 1),
      observacoes: aplicarResumoProdutosNaObservacao(form.value.observacoes),
    }
    const { data } = await GarantiaService.salvar(garantiaId.value, payload)

    if (isEditing.value) {
      notify.success('Garantia atualizada')
      return
    }

    if (data?.id && agendaInicioEm.value && agendaFimEm.value) {
      try {
        await GarantiaService.agendar(data.id, {
          titulo: `${form.value.tipo === 'ASSISTENCIA' ? 'Assistência' : 'Garantia'} - ${form.value.titulo}`,
          inicio_em: new Date(agendaInicioEm.value).toISOString(),
          fim_em: new Date(agendaFimEm.value).toISOString(),
          funcionario_ids: agenda.value.funcionario_ids,
          automovel_ids: agenda.value.automovel_ids,
          km_ida_prevista: Number(agenda.value.km_ida_prevista || 0),
          km_volta_prevista: Number(agenda.value.km_volta_prevista || 0),
          subetapa: form.value.tipo === 'ASSISTENCIA' ? 'ASSISTENCIA' : 'GARANTIA',
        })
        notify.success('Garantia criada e agendamento gerado!')
        router.replace('/agendamentos')
      } catch (e) {
        console.error(e)
        notify.warn('Garantia criada, mas agendamento falhou. Verifique antes de sair.')
        router.replace(`/garantias/${data.id}`)
      }
    } else if (data?.id) {
      notify.success('Garantia criada')
      router.replace(`/garantias/${data.id}`)
    }
  } catch (e) {
    console.error(e)
    const mensagem = e?.response?.data?.message
    if (Array.isArray(mensagem)) {
      notify.error(mensagem.join(' | '))
    } else {
      notify.error(mensagem || 'Falha ao salvar garantia')
    }
  } finally {
    salvando.value = false
  }
}

// Excluir
async function confirmarRemover() {
  if (!confirm('Tem certeza que deseja excluir esta garantia?')) return
  removendo.value = true
  try {
    await GarantiaService.remover(garantiaId.value)
    notify.success('Garantia excluída')
    router.replace('/garantias')
  } catch {
    notify.error('Falha ao excluir')
  } finally {
    removendo.value = false
  }
}

// Agendar
async function criarAgendamento() {
  if (!agendaInicioEm.value || !agendaFimEm.value) {
    notify.warn('Preencha a data e os horários do agendamento')
    return
  }

  agendando.value = true
  try {
    const payload = {
      titulo: `${form.value.tipo === 'ASSISTENCIA' ? 'Assistência' : 'Garantia'} - ${form.value.titulo}`,
      inicio_em: new Date(agendaInicioEm.value).toISOString(),
      fim_em: new Date(agendaFimEm.value).toISOString(),
      funcionario_ids: agenda.value.funcionario_ids,
      automovel_ids: agenda.value.automovel_ids,
      km_ida_prevista: Number(agenda.value.km_ida_prevista || 0),
      km_volta_prevista: Number(agenda.value.km_volta_prevista || 0),
      subetapa: form.value.tipo === 'ASSISTENCIA' ? 'ASSISTENCIA' : 'GARANTIA',
    }
    await GarantiaService.agendar(garantiaId.value, payload)
    notify.success('Agendamento criado com sucesso')
    form.value.status = 'AGENDADA'
    await carregarGarantia()
  } catch (e) {
    console.error(e)
    notify.error('Falha ao criar agendamento')
  } finally {
    agendando.value = false
  }
}

function moeda(v) {
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoedaBR(v) {
  const s = String(v ?? '').trim()
  if (!s) return 0
  const cleaned = s.replace(/[^\d,.-]/g, '')
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  return Number(normalized) || 0
}

const valorCobrarNumero = computed(() => parseMoedaBR(form.value.valor_venda))

const valorParcela = computed(() => {
  const parcelas = Math.max(1, Number(form.value.quantidade_parcelas || 1) || 1)
  return valorCobrarNumero.value / parcelas
})

const margemClass = computed(() => {
  const custo = resumoFinanceiroPreview.value.custo_total_previsto
  if (!custo || custo <= 0) return 'text-text-muted'
  const margem = ((valorCobrarNumero.value - custo) / custo) * 100
  if (margem >= 50) return 'text-emerald-600 dark:text-emerald-400'
  if (margem >= 0) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const margemTexto = computed(() => {
  const custo = resumoFinanceiroPreview.value.custo_total_previsto
  if (!custo || custo <= 0) return '—'
  const margem = ((valorCobrarNumero.value - custo) / custo) * 100
  const sinal = margem >= 0 ? '+' : ''
  return `${sinal}${margem.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
})

function usarSugestaoCobranca() {
  form.value.valor_venda = resumoFinanceiroPreview.value.valor_cobrado.toFixed(2)
}

function formatarValorCobrar() {
  const n = parseMoedaBR(form.value.valor_venda)
  if (n > 0) {
    form.value.valor_venda = n.toFixed(2)
  }
}

async function gerarPdf() {
  if (!garantiaId.value) return
  gerandoPdf.value = true
  try {
    const response = await GarantiaService.gerarPdf(garantiaId.value)
    const blob = response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], { type: 'application/pdf' })
    const resultado = await saveBlobNativeOrBrowser(blob, `garantia-${garantiaId.value}.pdf`)
    if (resultado?.cancelled) return
    notify.success('PDF gerado com sucesso!')
  } catch (e) {
    console.error(e)
    notify.error('Falha ao gerar PDF')
  } finally {
    gerandoPdf.value = false
  }
}

async function enviarWhatsapp() {
  if (!garantiaId.value) return
  if (!confirm('Enviar a Ordem de Serviço + link do Google Maps por WhatsApp para os funcionários designados?')) return
  enviandoWhats.value = true
  try {
    const { data } = await GarantiaService.enviarWhatsapp(garantiaId.value)
    if (data?.ok) {
      notify.success(data.message || 'OS enviada por WhatsApp!')
    } else {
      notify.warn(data?.message || 'Não foi possível enviar o WhatsApp.')
    }
  } catch (e) {
    console.error(e)
    notify.error('Falha ao enviar WhatsApp')
  } finally {
    enviandoWhats.value = false
  }
}

function numeroResumo(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const funcionariosSelecionadosGarantia = computed(() => {
  const ids = new Set((agenda.value.funcionario_ids || []).filter(Boolean))

  return funcionarios.value.filter((funcionario) => ids.has(funcionario.id))
})

const automoveisSelecionadosGarantia = computed(() => {
  const ids = new Set((agenda.value.automovel_ids || []).filter(Boolean))
  return automoveis.value.filter((automovel) => ids.has(automovel.id))
})

const kmTotalPrevistoGarantia = computed(() => {
  const ida = Number(agenda.value.km_ida_prevista || 0) || 0
  const volta = Number(agenda.value.km_volta_prevista || 0) || 0
  return Math.round((ida + volta) * 100) / 100
})

const horasPrevistasPreview = computed(() => {
  const horasDigitadas = Number(form.value.horas_previstas || 0)
  if (horasDigitadas > 0) return horasDigitadas

  if (agendaInicioEm.value && agendaFimEm.value) {
    const inicio = new Date(agendaInicioEm.value)
    const fim = new Date(agendaFimEm.value)
    const horas = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
    return horas > 0 ? Math.round(horas * 100) / 100 : 0
  }

  return 0
})

const resumoFinanceiroPreview = computed(() => {
  const custoProdutos = totalProdutosCusto.value
  const horasPrevistas = horasPrevistasPreview.value
  const custoMaoObraPrevisto = funcionariosSelecionadosGarantia.value.reduce(
    (total, funcionario) => total + ((Number(funcionario.custo_hora || 0) || 0) * horasPrevistas),
    0,
  )
  const custoFabricaPrevisto = custoHoraEstrutura.value * horasPrevistas
  const custoVeiculoPrevistoSelecionado = automoveisSelecionadosGarantia.value.reduce(
    (total, automovel) => total + ((Number(automovel.custo_km || 0) || 0) * kmTotalPrevistoGarantia.value),
    0,
  )
  const custoVeiculoPrevistoPersistido = Math.max(
    0,
    parseMoedaBR(form.value.custo) - custoProdutos - custoMaoObraPrevisto - custoFabricaPrevisto,
  )
  const custoVeiculoPrevisto = automoveisSelecionadosGarantia.value.length || kmTotalPrevistoGarantia.value > 0
    ? custoVeiculoPrevistoSelecionado
    : custoVeiculoPrevistoPersistido
  const custoTotalPrevisto = custoProdutos + custoMaoObraPrevisto + custoVeiculoPrevisto + custoFabricaPrevisto
  const valorCobrado = (custoProdutos * 2) + custoMaoObraPrevisto + custoVeiculoPrevisto + custoFabricaPrevisto

  return {
    horas_previstas: horasPrevistas,
    custo_produtos: custoProdutos,
    custo_mao_obra_previsto: custoMaoObraPrevisto,
    custo_veiculo_previsto: custoVeiculoPrevisto,
    custo_fabrica_previsto: custoFabricaPrevisto,
    custo_total_previsto: custoTotalPrevisto,
    valor_cobrado: valorCobrado,
    custo_hora_estrutura: custoHoraEstrutura.value,
  }
})

const resumoFinanceiroRealExibicao = computed(() => {
  const resumo = resumoFinanceiroReal.value || {}
  const horasRealizadas = Number(resumo.horas_realizadas || 0)
  const custoProdutos = Number(resumo.custo_produtos ?? resumoFinanceiroPreview.value.custo_produtos ?? 0)
  const custoMaoObraReal = Number(resumo.custo_mao_obra_real || 0)
  const custoVeiculoReal = Number(resumo.custo_veiculo_real || 0)
  const custoFabricaReal = Number(resumo.custo_fabrica_real || 0)
  const valorCobrado = Number(resumo.valor_cobrado ?? valorCobrarNumero.value ?? resumoFinanceiroPreview.value.valor_cobrado ?? 0)
  const temApontamentoReal = horasRealizadas > 0 || custoMaoObraReal > 0 || custoVeiculoReal > 0 || custoFabricaReal > 0

  return {
    horas_realizadas: horasRealizadas,
    custo_produtos_real: custoProdutos,
    custo_mao_obra_real: custoMaoObraReal,
    custo_veiculo_real: custoVeiculoReal,
    custo_fabrica_real: custoFabricaReal,
    custo_total_real: temApontamentoReal ? Number(resumo.custo_total_real || 0) : custoProdutos,
    valor_cobrado: valorCobrado,
    tem_apontamento_real: temApontamentoReal,
  }
})

// Carregar dados (se editando)
async function carregarGarantia() {
  if (!garantiaId.value) return
  loadingInicial.value = true
  try {
    const { data } = await GarantiaService.buscar(garantiaId.value)
    form.value = {
      tipo: data.tipo || 'GARANTIA',
      titulo: data.titulo || '',
      cliente_id: data.cliente_id,
      venda_id: data.venda_id || null,
      descricao: data.descricao || '',
      processo: data.processo || '',
      horas_previstas: data.horas_previstas ? String(data.horas_previstas) : '',
      custo_produtos: data.custo_produtos ? String(data.custo_produtos) : '',
      custo_mao_obra_previsto: data.custo_mao_obra_previsto ? String(data.custo_mao_obra_previsto) : '',
      custo_fabrica_previsto: data.custo_fabrica_previsto ? String(data.custo_fabrica_previsto) : '',
      custo: data.custo ? String(data.custo) : '',
      valor_venda: data.valor_venda ? String(data.valor_venda) : '',
      forma_pagamento_chave: data.forma_pagamento_chave || '',
      quantidade_parcelas: Number(data.quantidade_parcelas) || 1,
      data_previsao: data.data_previsao ? data.data_previsao.substring(0, 10) : '',
      data_conclusao: data.data_conclusao ? data.data_conclusao.substring(0, 10) : '',
      observacoes: limparResumoAmbientes(limparResumoProdutos(data.observacoes || '')),
      status: data.status || 'PENDENTE',
    }
    ambientesSelecionados.value = extrairAmbientesDasObservacoes(data.observacoes || '')
    produtosSelecionados.value = extrairProdutosDasObservacoes(data.observacoes || '').map(hidratarProdutoSelecionado)
    resumoFinanceiroReal.value = data.resumo_financeiro || null
    const primeiroAgendamento = Array.isArray(data.agendamentos) ? data.agendamentos[0] : null
    if (primeiroAgendamento) {
      const inicio = primeiroAgendamento.inicio_em ? new Date(primeiroAgendamento.inicio_em) : null
      const fim = primeiroAgendamento.fim_em ? new Date(primeiroAgendamento.fim_em) : null
      agenda.value = {
        ...agenda.value,
        data: inicio ? inicio.toISOString().slice(0, 10) : '',
        hora_inicio: inicio ? inicio.toISOString().slice(11, 16) : '',
        hora_fim: fim ? fim.toISOString().slice(11, 16) : '',
        funcionario_ids: Array.isArray(primeiroAgendamento.equipe) ? primeiroAgendamento.equipe.map((item) => item.funcionario?.id).filter(Boolean) : [],
        automovel_ids: Array.isArray(primeiroAgendamento.automoveis_planejados) ? primeiroAgendamento.automoveis_planejados.map((item) => item.automovel?.id).filter(Boolean) : [],
        km_ida_prevista: primeiroAgendamento.km_ida_prevista != null ? String(primeiroAgendamento.km_ida_prevista) : '',
        km_volta_prevista: primeiroAgendamento.km_volta_prevista != null ? String(primeiroAgendamento.km_volta_prevista) : '',
      }
    }
    if (data.cliente) {
      clienteSelecionado.value = data.cliente
      clienteBusca.value = data.cliente.nome_completo || ''
      carregarVendasCliente(data.cliente_id)
      carregarVendaVinculada(data.venda_id)
      calcularKmPrevisto()
    } else if (form.value.data_previsao && !agenda.value.data) {
      agenda.value.data = form.value.data_previsao
    }
  } catch (e) {
    console.error(e)
    notify.error('Garantia não encontrada')
    router.replace('/garantias')
  } finally {
    loadingInicial.value = false
  }
}

onMounted(async () => {
  await carregarEmpresa()
  await carregarFuncionarios()
  await carregarAutomoveis()
  await carregarCustoHoraEstrutura()
  await carregarProdutos()
  if (garantiaId.value) {
    await carregarGarantia()
    await carregarFotos()
  }
})

watch(produtosSelecionados, (itens) => {
  const custoCalculado = resumoFinanceiroPreview.value.custo_total_previsto
  form.value.custo = custoCalculado.toFixed(2)
  // Só atualiza valor_venda automaticamente se ainda não foi preenchido manualmente
  if (!valorCobrarNumero.value || itens.length === 1) {
    form.value.valor_venda = resumoFinanceiroPreview.value.valor_cobrado.toFixed(2)
  }
}, { deep: true })

watch([horasPrevistasPreview, funcionariosSelecionadosGarantia], () => {
  form.value.custo = resumoFinanceiroPreview.value.custo_total_previsto.toFixed(2)
}, { deep: true })

watch(() => form.value.tipo, (tipoAtual, tipoAnterior) => {
  if (tipoAtual === tipoAnterior) return
  if (!valorCobrarNumero.value) {
    form.value.valor_venda = resumoFinanceiroPreview.value.valor_cobrado.toFixed(2)
  }
})

watch(() => form.value.venda_id, (vendaId) => {
  carregarVendaVinculada(vendaId)
})

watch([enderecoEmpresaCompleto, enderecoClienteCompleto], ([origem, destino]) => {
  clearTimeout(kmAutoCalcTimeout)

  if (!origem || !destino) {
    agenda.value.km_ida_prevista = ''
    agenda.value.km_volta_prevista = ''
    kmErro.value = ''
    return
  }

  kmAutoCalcTimeout = setTimeout(() => {
    calcularKmPrevisto()
  }, 250)
})

watch(() => agenda.value.data, (data) => {
  if (data) {
    form.value.data_previsao = data
  }
})
</script>

<style scoped>
.garantia-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 85%, transparent);
}
.garantia-page-header__main {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}
.garantia-page-header__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 85%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-soft);
  background: transparent;
  flex-shrink: 0;
}
.garantia-page-header__title {
  color: var(--ds-color-text);
  font-size: clamp(1.75rem, 2.4vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.garantia-page-header__subtitle {
  margin-top: 0.35rem;
  color: var(--ds-color-text-soft);
  font-size: 1rem;
}
.garantia-page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.garantia-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.garantia-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-section:first-of-type {
  padding-top: 0;
  border-top: 0;
}
.garantia-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.garantia-section__title {
  color: var(--ds-color-text);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.garantia-section__meta {
  color: var(--ds-color-text-soft);
  font-size: 0.82rem;
}
.garantia-grid {
  display: grid;
  gap: 1.25rem;
}
.garantia-grid--2,
.garantia-grid--3 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.garantia-fotos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.garantia-foto-item {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface-muted) 45%, transparent);
}
.garantia-foto-upload {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px dashed color-mix(in srgb, var(--ds-color-border) 80%, transparent);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.garantia-foto-upload:hover {
  border-bottom-color: var(--ds-color-primary, var(--brand-primary));
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 4%, transparent);
}
.garantia-section--actions {
  padding-top: 1.5rem;
}
.garantia-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.garantia-produtos-resumo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: end;
}
.garantia-produtos-resumo strong {
  display: block;
  color: var(--ds-color-text);
  font-size: 1.2rem;
  font-weight: 800;
}
.garantia-produto-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.garantia-produto-option:hover {
  background: var(--ds-color-surface-muted);
}
.garantia-produtos-lista {
  display: flex;
  flex-direction: column;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-produtos-head,
.garantia-produtos-row {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) 90px 110px 110px 90px;
  gap: 1rem;
  align-items: start;
  padding: 0.875rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-produtos-head {
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.garantia-produto-main {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.garantia-produtos-qtd {
  min-height: 2.2rem;
  padding-right: 0;
  padding-left: 0.25rem;
}
.garantia-produto-consumo-meta {
  margin-top: 0.35rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--ds-color-surface-muted) 65%, transparent);
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 60%, transparent);
}
.garantia-produto-consumo-base {
  margin-top: 0.2rem;
  color: var(--ds-color-text-soft);
  font-size: 0.78rem;
  line-height: 1.45;
}
.garantia-produto-consumo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.4rem;
}
.garantia-produto-consumo-input {
  margin-top: 0.4rem;
}
.garantia-empty-state {
  color: var(--ds-color-text-soft);
  font-size: 0.92rem;
}
.garantia-venda-vinculada {
  display: block;
  margin-top: 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-venda-vinculada__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.garantia-venda-vinculada__count {
  color: var(--ds-color-text-soft);
  font-size: 0.8rem;
  font-weight: 600;
}
.garantia-venda-vinculada__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.85rem;
}
.garantia-venda-vinculada__seletores {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.55rem;
}
.garantia-venda-vinculada__selector {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  font-size: 0.92rem;
}
.garantia-venda-vinculada__selector--ativo {
  border-color: var(--ds-color-primary, var(--brand-primary));
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 8%, transparent);
}
.garantia-venda-vinculada__selector--inativo:hover {
  background: color-mix(in srgb, var(--ds-color-surface-muted) 70%, transparent);
}
.garantia-venda-vinculada__checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--ds-color-primary, var(--brand-primary));
  flex: 0 0 auto;
}
.garantia-venda-vinculada__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 25%, transparent);
  color: var(--ds-color-primary, var(--brand-primary));
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
.garantia-destino-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: end;
}
.garantia-ajuda-texto {
  margin-top: 0.5rem;
  color: var(--ds-color-text-soft);
  font-size: 0.8rem;
  line-height: 1.45;
}
.garantia-destino-resumo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.garantia-destino-resumo__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.7rem;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 10%, transparent);
  color: var(--ds-color-primary, var(--brand-primary));
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
.garantia-km-box {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--ds-color-surface-muted) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-km-box__label {
  display: block;
  color: var(--ds-color-text-soft);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.garantia-km-box__value {
  display: block;
  margin-top: 0.125rem;
  color: var(--ds-color-text);
  font-size: 0.96rem;
  font-weight: 700;
}
.garantia-km-box__copy {
  margin-top: 0.35rem;
  color: var(--ds-color-text-soft);
  font-size: 0.8rem;
  line-height: 1.5;
}
.garantia-km-box__erro {
  margin-top: 0.35rem;
  color: #b42318;
  font-size: 0.8rem;
  line-height: 1.5;
}
.garantia-link {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--ds-color-primary, var(--brand-primary));
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.garantia-link.danger {
  color: #b42318;
}
.garantia-resumo-financeiro {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
}
.garantia-resumo-financeiro strong {
  display: block;
  color: var(--ds-color-text);
  font-size: 1.05rem;
  font-weight: 800;
}
@media (max-width: 960px) {
  .garantia-venda-vinculada {
    grid-template-columns: 1fr;
  }

  .garantia-produtos-head {
    display: none;
  }

  .garantia-produtos-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.85rem;
  }
}
.garantia-cobranca-aviso {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 8%, transparent);
  color: var(--ds-color-primary, var(--brand-primary));
  font-size: 0.85rem;
  line-height: 1.4;
}
.garantia-cobranca-aviso i {
  flex-shrink: 0;
  font-size: 1rem;
}
.garantia-custo-interno {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--ds-color-warning, #f59e0b) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--ds-color-warning, #f59e0b) 20%, transparent);
}
.garantia-custo-interno__label {
  display: block;
  color: var(--ds-color-text-soft);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.garantia-custo-interno__value {
  display: block;
  margin-top: 0.125rem;
  color: var(--ds-color-warning, #92400e);
  font-size: 1rem;
  font-weight: 800;
}
.garantia-custo-interno__copy {
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
  line-height: 1.5;
}
.garantia-valor-cobrar {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.25rem;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 5%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 25%, transparent);
}
.garantia-valor-cobrar__header {
  display: block;
  gap: 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  color: var(--ds-color-text);
  font-size: 0.875rem;
}
.garantia-valor-cobrar__sugestao:hover {
  background: color-mix(in srgb, var(--ds-color-primary, var(--brand-primary)) 10%, transparent);
}
.garantia-valor-cobrar__input-wrap {
  margin-top: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.garantia-valor-cobrar__prefix {
  color: var(--ds-color-text-soft);
  font-size: 1rem;
  flex: 0 0 auto;
}
.garantia-valor-cobrar__input {
  background: transparent;
  border: 0;
  width: 100%;
  font-size: 0.92rem;
  color: var(--ds-color-text);
  font-size: 1.75rem;
  font-weight: 800;
  outline: none;
}
.garantia-valor-cobrar__input::placeholder {
  color: color-mix(in srgb, var(--ds-color-text-soft) 40%, transparent);
}
.garantia-valor-cobrar__margem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--ds-color-text-soft);
}
.ds-label {
  display: block;
  margin-bottom: 0.375rem;
  color: var(--ds-color-text-muted, var(--ds-color-text-soft));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ds-input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.ds-input::placeholder {
  color: color-mix(in srgb, var(--ds-color-text-soft) 50%, transparent);
}
.ds-input:focus {
  border-color: var(--ds-color-primary, var(--brand-primary));
  box-shadow: inset 0 -1px 0 0 var(--ds-color-primary, var(--brand-primary));
}
textarea.ds-input {
  min-height: 100px;
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  resize: vertical;
}
@media (min-width: 768px) {
  .garantia-grid--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .garantia-venda-vinculada__seletores {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .garantia-fotos-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 767px) {
  .garantia-page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .garantia-page-header__actions {
    justify-content: flex-start;
  }
  .garantia-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .garantia-produtos-resumo,
  .garantia-produtos-head,
  .garantia-produtos-row,
  .garantia-resumo-financeiro {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .garantia-venda-vinculada__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .garantia-destino-picker {
    grid-template-columns: 1fr;
  }
}
</style>
