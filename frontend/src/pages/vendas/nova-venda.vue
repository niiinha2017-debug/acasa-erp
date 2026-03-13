<template>
  <div class="w-full h-full">
    <div class="relative bg-bg-card">
      <div class="h-1 w-full bg-brand-primary" />

      <PageHeader
        :title="isEditMode ? `Editar venda #${vendaId}` : 'Fechamento da Venda'"
        :subtitle="isEditMode ? 'Altere itens, parcelas e comissões (mesma tela do fechamento).' : 'Defina o valor final e condições a partir do orçamento aprovado'"
        icon="pi pi-dollar"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <RouterLink
              v-if="isEditMode"
              :to="`/vendas/venda/${vendaId}`"
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <i class="pi pi-arrow-left text-xs"></i>
              Voltar para detalhe
            </RouterLink>
            <RouterLink
              v-else
              to="/orcamentos"
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <i class="pi pi-arrow-left text-xs"></i>
              Voltar para Orçamentos
            </RouterLink>
          </div>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 border-t border-border-ui space-y-6 max-w-[1200px] mx-auto">
        <Loading v-if="loading" />

        <div v-else class="space-y-6">
          <!-- RESUMO DO ORÇAMENTO -->
          <section v-if="orcamento" class="space-y-5">
            <div class="flex items-center justify-center gap-3 pb-2 border-b border-border-ui text-center">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">1</span>
              <div class="text-base font-semibold text-text-main">Resumo do orçamento</div>
            </div>
            <div class="grid grid-cols-12 gap-x-6 gap-y-2">
              <div class="col-span-12 md:col-span-7">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Cliente</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    @click="abrirModalCadastroContrato(false)"
                  >
                    <i class="pi pi-id-card mr-1"></i>
                    Validar contratante
                  </Button>
                </div>
                <p class="text-sm font-semibold text-text-main">
                  {{ orcamento.cliente_nome_snapshot || orcamento.cliente?.nome_completo || orcamento.cliente?.razao_social || '-' }}
                </p>
                <p
                  v-if="clienteContratoPendente"
                  class="text-xs text-amber-700 dark:text-amber-400 mt-1"
                >
                  Falta completar dados do contratante para o contrato.
                </p>
              </div>
              <div class="col-span-6 md:col-span-2">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Orçamento</p>
                <p class="text-sm font-semibold text-text-main">#{{ orcamento.id }}</p>
              </div>
              <div class="col-span-6 md:col-span-3">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Valor orçado</p>
                <p class="text-sm font-black text-brand-primary">{{ format.currency(totalOrcado) }}</p>
              </div>
            </div>

            <!-- REPRESENTANTE DA VENDA (abaixo do nome) -->
            <section class="space-y-4 border-t border-border-ui pt-5">
              <div class="flex items-center justify-center gap-3 text-center">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">2</span>
                <div class="text-base font-semibold text-text-main">Representante da venda</div>
              </div>
              <p class="text-xs text-text-soft">
                Nome completo, CPF e RG.
              </p>
              <div class="p-4 rounded-xl border border-border-ui bg-bg-page">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div class="md:col-span-6">
                    <Input
                      v-model="representanteVenda.nome"
                      label="Nome completo"
                      placeholder="Nome completo"
                      :forceUpper="true"
                    />
                  </div>
                  <div class="md:col-span-3">
                    <Input
                      :model-value="maskCPF(representanteVenda.cpf || '')"
                      label="CPF"
                      placeholder="000.000.000-00"
                      :forceUpper="false"
                      @update:model-value="(v) => (representanteVenda.cpf = onlyNumbers(String(v || '')).slice(0, 11))"
                    />
                  </div>
                  <div class="md:col-span-3">
                    <Input
                      :model-value="maskRG(representanteVenda.rg || '')"
                      label="RG"
                      placeholder="00.000.000-0"
                      :forceUpper="false"
                      @update:model-value="(v) => (representanteVenda.rg = onlyNumbers(String(v || '')).slice(0, 9))"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div class="border-t border-border-ui pt-5 space-y-4">
              <div class="flex items-center justify-center gap-3 text-center">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">3</span>
                <div class="text-base font-semibold text-text-main">Itens da venda</div>
              </div>
              <p class="text-xs text-text-soft">
                Ajuste os itens/ambientes e valores rateados. Não altera o orçamento original.
              </p>
              <div class="flex justify-end pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  @click="adicionarItemVenda"
                >
                  + Adicionar ambiente
                </Button>
              </div>
              <Table :columns="columnsItens" :rows="rowsItens" :boxed="false" :flush="true">
                <template #cell-nome_ambiente="{ row }">
                  <Input
                    v-model="itens[row.__idx].nome_ambiente"
                    :forceUpper="true"
                  />
                </template>
                <template #cell-descricao="{ row }">
                  <textarea
                    v-model="itens[row.__idx].descricao"
                    rows="3"
                    spellcheck="true"
                    lang="pt-BR"
                    placeholder="* Armário superior com 4 portas de giro&#10;* Armário inferior 4 gavetas e 2 portas de giro&#10;* Nicho para microondas"
                    class="w-full p-2 rounded-xl border border-border-ui bg-bg-page text-sm text-text-main outline-none resize-y focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  ></textarea>
                </template>
                <template #cell-observacao="{ row }">
                  <Input
                    v-model="itens[row.__idx].observacao"
                    :forceUpper="true"
                    placeholder="Ex.: PUXADOR REFIL"
                  />
                </template>
                <template #cell-valor_orcado="{ row }">
                  <span class="font-bold">
                    {{ format.currency(row.valor_unitario || 0) }}
                  </span>
                </template>
                <template #cell-valor_rateado="{ row }">
                  <Input
                    :modelValue="format.currency(itens[row.__idx].valor_final || 0)"
                    type="text"
                    inputmode="numeric"
                    :forceUpper="false"
                    class="w-full text-right"
                    @update:modelValue="(val) => { itens[row.__idx].valor_final = moedaParaNumero(val); sincronizarValorFinalComTotal() }"
                  />
                </template>
                <template #cell-acoes="{ row }">
                  <TableActions
                    :id="row.__idx"
                    perm-edit="vendas.criar"
                    perm-delete="vendas.criar"
                    @edit="editarItemVenda(row.__idx)"
                    @delete="removerItemVenda(row.__idx)"
                  />
                </template>
              </Table>
            </div>

            <!-- FECHAMENTO / VALOR FINAL (depois dos itens) -->
            <section class="space-y-4 border-t border-border-ui pt-5">
              <div class="flex items-center justify-center gap-3 text-center">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">4</span>
                <div class="text-base font-semibold text-text-main">Fechamento da venda</div>
              </div>
              <p class="text-xs text-text-soft">
                Defina desconto, data e valor final. As regras de parcelamento e taxas continuam as mesmas.
              </p>

              <div class="grid grid-cols-12 gap-4 items-end">
                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model.number="percentualDesconto"
                    label="Desconto aplicado (%)"
                    type="number"
                    min="0"
                    :max="DESCONTO_MAXIMO_PERCENTUAL"
                    :step="DESCONTO_STEP"
                    :forceUpper="false"
                    @update:modelValue="onPercentualDescontoInput"
                  />
                </div>

                <div class="col-span-12 md:col-span-4">
                  <Input
                    :modelValue="format.currency(valorFinal)"
                    label="Valor final da venda (com desconto) *"
                    type="text"
                    inputmode="numeric"
                    :forceUpper="false"
                    disabled
                    keep-readable-when-disabled
                  />
                  <p v-if="totalReceberCalculado > 0 && Math.abs(totalReceberCalculado - valorFinal) > 0.01" class="text-[11px] text-text-soft mt-1">
                    Com as formas de pagamento, o valor final da venda é {{ format.currency(totalReceberCalculado) }}.
                  </p>
                </div>

                <div class="col-span-12 md:col-span-2">
                  <Input
                    v-model="dataVenda"
                    type="date"
                    label="Data da venda"
                    :forceUpper="false"
                  />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <CustomCheckbox
                    v-model="temNotaFiscal"
                    label="Emitir Nota Fiscal"
                  />
                </div>
              </div>
            </section>
          </section>
          <!-- FORMAS DE PAGAMENTO (SEM VALIDAR COM VALOR FINAL) -->
          <section class="space-y-4 border-t border-border-ui pt-5">
            <div class="flex items-center justify-center gap-3 text-center">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">5</span>
              <div class="text-base font-semibold text-text-main">Formas de pagamento</div>
            </div>
            <p class="text-xs text-text-soft">
              Configure a forma, parcelas e valores.
            </p>

            <div class="flex justify-end mb-3">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="addPagamento"
              >
                <i class="pi pi-plus mr-1"></i> Adicionar forma de pagamento
              </Button>
            </div>

            <Table
              :columns="columnsPagamentos"
              :rows="rowsPagamentos"
              :row-key="'__id'"
              :boxed="true"
              empty-text="Nenhum pagamento definido."
            >
              <template #cell-forma="{ row }">
                <SearchInput
                  v-model="pagamentos[row.__idx].forma_pagamento_chave"
                  mode="select"
                  placeholder="Selecione..."
                  :options="getFormasPagamentoOptionsForRow(row.__idx)"
                  @update:modelValue="() => nextTick(prefillRestanteNosZerados)"
                />
              </template>

              <template #cell-parcelas="{ row }">
                <Select
                  v-model="pagamentos[row.__idx].parcelas"
                  :options="getParcelasOptionsForForm(pagamentos[row.__idx].forma_pagamento_chave)"
                  labelKey="label"
                  valueKey="value"
                  @update:modelValue="() => nextTick(prefillRestanteNosZerados)"
                />
              </template>

              <template #cell-data_prevista="{ row }">
                <div class="space-y-1.5">
                  <div
                    v-for="(parc, i) in normalizeDatasParcelas(pagamentos[row.__idx])"
                    :key="i"
                    class="flex flex-nowrap items-stretch gap-2"
                  >
                    <span class="w-5 shrink-0 flex items-end pb-2.5 text-[10px] font-bold text-text-soft text-right">{{ i + 1 }} —</span>
                    <div class="flex min-h-10 min-w-0 flex-1 shrink-0 flex-col justify-end">
                      <Input
                        v-model="pagamentos[row.__idx].datas_parcelas[i].data"
                        type="date"
                        :forceUpper="false"
                        class="w-full [&_input]:h-10"
                      />
                    </div>
                  </div>
                </div>
              </template>

              <template #cell-valor_parcela="{ row }">
                <div class="space-y-1.5">
                  <div
                    v-for="(parc, i) in normalizeDatasParcelas(pagamentos[row.__idx])"
                    :key="i"
                    class="flex min-h-10 flex-col justify-end"
                  >
                    <template v-if="String(pagamentos[row.__idx].forma_pagamento_chave || '').toUpperCase() === 'CREDITO'">
                      <Input
                        :modelValue="format.currency(pagamentos[row.__idx].datas_parcelas[i].valor || 0)"
                        type="text"
                        inputmode="numeric"
                        :forceUpper="false"
                        class="w-full text-right [&_input]:h-10"
                        placeholder="Valor no cartão"
                        @update:modelValue="(val) => {
                          pagamentos[row.__idx].datas_parcelas[i].valor = moedaParaNumero(val)
                          recomputarTotalPagamento(row.__idx)
                        }"
                      />
                    </template>
                    <Input
                      v-else
                      :modelValue="format.currency(pagamentos[row.__idx].datas_parcelas[i].valor || 0)"
                      type="text"
                      inputmode="numeric"
                      :forceUpper="false"
                      class="w-full text-right [&_input]:h-10"
                      @update:modelValue="
                        (val) => {
                          pagamentos[row.__idx].datas_parcelas[i].valor = moedaParaNumero(val)
                          recomputarTotalPagamento(row.__idx)
                        }
                      "
                    />
                  </div>
                </div>
              </template>

              <template #cell-acoes="{ row }">
                <div class="flex justify-end gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    title="Editar"
                    @click="editarPagamento(row.__idx)"
                  >
                    <i class="pi pi-pencil mr-1"></i> Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    :disabled="(pagamentos || []).length === 1"
                    @click="removerPagamento(row.__idx)"
                  >
                    <i class="pi pi-trash mr-1"></i> Remover
                  </Button>
                </div>
              </template>

            </Table>

            <div class="px-1 py-1 space-y-1">
              <p class="text-[12px] text-text-main font-bold">
                Valor final: {{ format.currency(totalReceberCalculado) }}
              </p>
              <div v-if="restanteParaDistribuir > 0" class="flex flex-wrap items-center gap-2 mt-2">
                <span class="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Restante a distribuir: {{ format.currency(restanteParaDistribuir) }}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  @click="prefillRestanteNosZerados"
                >
                  Preencher restante
                </Button>
              </div>
            </div>
          </section>

          <!-- INDICAÇÃO -->
          <section class="space-y-4 border-t border-border-ui pt-5">
            <div class="flex items-center justify-center gap-3 text-center">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">6</span>
              <div class="text-base font-semibold text-text-main">Indicação</div>
            </div>
            <div class="grid grid-cols-12 gap-4 items-end">
              <div class="col-span-12 md:col-span-6">
                <Input
                  v-model="indicacaoNome"
                  label="Nome da indicação"
                  placeholder="Digite o nome"
                  :forceUpper="true"
                />
              </div>
            </div>
          </section>

          <!-- ENDEREÇO DE ENTREGA -->
          <section class="space-y-4 border-t border-border-ui pt-5">
            <div class="flex items-center justify-center gap-3 text-center">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">7</span>
              <div class="text-base font-semibold text-text-main">Endereço de entrega</div>
            </div>
            <div class="grid grid-cols-12 gap-4 items-end">
              <div class="col-span-12 md:col-span-3">
                <Input
                  v-model="cepEntrega"
                  label="CEP"
                  placeholder="00000-000"
                  :forceUpper="false"
                  @input="cepEntrega = maskCEP(cepEntrega)"
                  @blur="buscarEnderecoEntregaPorCep"
                />
              </div>
              <div class="col-span-12 md:col-span-5">
                <Input
                  v-model="enderecoEntrega"
                  label="Nome da rua"
                  placeholder="Rua/Avenida"
                  :forceUpper="true"
                />
              </div>
              <div class="col-span-12 md:col-span-1">
                <Input
                  v-model="numeroEntrega"
                  label="Número"
                  placeholder="123"
                  :forceUpper="false"
                />
              </div>
              <div class="col-span-12 md:col-span-3">
                <Input
                  v-model="complementoEntrega"
                  label="Complemento"
                  placeholder="Apto, bloco..."
                  :forceUpper="true"
                />
              </div>
              <div class="col-span-12 md:col-span-4">
                <Input
                  v-model="bairroEntrega"
                  label="Bairro"
                  placeholder="Bairro"
                  :forceUpper="true"
                />
              </div>
              <div class="col-span-12 md:col-span-6">
                <Input
                  v-model="cidadeEntrega"
                  label="Cidade"
                  placeholder="Cidade"
                  :forceUpper="true"
                />
              </div>
              <div class="col-span-12 md:col-span-2">
                <Input
                  v-model="estadoEntrega"
                  label="Estado"
                  placeholder="UF"
                  :forceUpper="true"
                />
              </div>
            </div>
            <p class="text-[11px] text-text-soft">
              Preencha o endereço de entrega em campos separados para facilitar ajustes e evitar erros no contrato.
            </p>
          </section>

          <!-- ARQUIVOS VINCULADOS AO ORÇAMENTO -->
          <section v-if="orcamento" class="space-y-6 border-t border-border-ui pt-5">
            <div class="flex items-center justify-center gap-3 text-center">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">8</span>
              <div class="text-base font-semibold text-text-main">Arquivos do orçamento</div>
            </div>
            <!-- Imagens para PDF do orçamento -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold text-text-main">
                  Imagens do orçamento
                </div>
                <div class="flex items-center gap-2">
                  <input
                    ref="fileInputImagemPdf"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="(e) => onPickArquivo(e, 'IMAGEM_PDF')"
                  />
                  <Button
                    v-if="can('orcamentos.editar') && can('arquivos.criar')"
                    size="sm"
                    variant="ghost"
                    type="button"
                    @click="clicarAdicionarArquivo('IMAGEM_PDF')"
                  >
                    <i class="pi pi-upload mr-1"></i> ADICIONAR IMAGEM
                  </Button>
                </div>
              </div>
              <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                Imagens vinculadas ao orçamento original. Serão reutilizadas nos documentos relacionados à venda.
              </p>
              <div class="border border-border-ui overflow-hidden">
                <Table
                  :columns="colArquivos"
                  :rows="imagensParaPdf"
                  :loading="loadingImagensPdf"
                  empty-text="Nenhuma imagem."
                  :boxed="false"
                  :flush="true"
                >
                  <template #cell-nome="{ row }">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                      <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                        {{ row.mime_type || 'IMAGEM' }}
                      </span>
                    </div>
                  </template>
                  <template #cell-acoes="{ row }">
                    <div class="flex justify-end gap-2">
                      <Button
                        v-if="can('arquivos.ver') || can('orcamentos.ver')"
                        variant="secondary"
                        size="sm"
                        type="button"
                        @click="abrirArquivo(row)"
                      >
                        Ver
                      </Button>
                      <Button
                        v-if="can('arquivos.excluir') && can('orcamentos.editar')"
                        variant="danger"
                        size="sm"
                        type="button"
                        @click="excluirArquivo(row.id, 'IMAGEM_PDF')"
                      >
                        Excluir
                      </Button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>

            <!-- Anexos do orçamento -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold text-text-main">
                  Anexos do orçamento
                </div>
                <div class="flex items-center gap-2">
                  <input
                    ref="fileInputAnexos"
                    type="file"
                    class="hidden"
                    @change="(e) => onPickArquivo(e, 'ANEXO')"
                  />
                  <Button
                    v-if="can('orcamentos.editar') && can('arquivos.criar')"
                    size="sm"
                    variant="ghost"
                    type="button"
                    @click="clicarAdicionarArquivo('ANEXO')"
                  >
                    <i class="pi pi-upload mr-1"></i> ADICIONAR ARQUIVO
                  </Button>
                </div>
              </div>
              <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                PDFs e outros arquivos anexados ao orçamento. Ficam vinculados ao orçamento e podem ser consultados pela venda.
              </p>
              <div class="border border-border-ui overflow-hidden">
                <Table
                  :columns="colArquivos"
                  :rows="anexosDocumentos"
                  :loading="loadingAnexos"
                  empty-text="Nenhum anexo ou documento."
                  :boxed="false"
                  :flush="true"
                >
                  <template #cell-nome="{ row }">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                      <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                        {{ row.mime_type || 'ARQUIVO' }}
                      </span>
                    </div>
                  </template>
                  <template #cell-acoes="{ row }">
                    <div class="flex justify-end gap-2">
                      <Button
                        v-if="can('arquivos.ver') || can('orcamentos.ver')"
                        variant="secondary"
                        size="sm"
                        type="button"
                        @click="abrirArquivo(row)"
                      >
                        Ver
                      </Button>
                      <Button
                        v-if="can('arquivos.excluir') && can('orcamentos.editar')"
                        variant="danger"
                        size="sm"
                        type="button"
                        @click="excluirArquivo(row.id, 'ANEXO')"
                      >
                        Excluir
                      </Button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>
          </section>

          <!-- AÇÕES -->
          <section class="flex justify-end gap-3 pt-4 border-t border-border-ui">
            <Button
              variant="primary"
              :disabled="saving || !orcamento || valorFinal <= 0"
              :loading="saving"
              @click="salvarVenda"
            >
              <i class="pi pi-check mr-2" />
              {{ isEditMode ? 'Salvar alterações' : 'Criar venda' }}
            </Button>
          </section>
        </div>
      </div>
    </div>

    <!-- Modal Cadastro Rápido do Contratante (dentro do layout do ERP) -->
    <Transition name="fade">
      <div
        v-if="modalCadastroContrato.aberto"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="fecharModalCadastroContrato"
      >
        <div class="w-full max-w-4xl rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden flex flex-col">
            <div class="h-1 w-full bg-brand-primary" />
            <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui">
              <div class="flex items-center gap-3">
                <i class="pi pi-id-card text-2xl text-text-soft"></i>
                <div>
                  <h3 class="text-lg font-semibold text-text-main">Cadastro rápido do contratante</h3>
                  <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    Confirme os dados para gerar o contrato sem erro
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500"
                @click="fecharModalCadastroContrato"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>

            <form class="p-6 space-y-4" @submit.prevent="salvarCadastroContratoRapido">
              <div class="grid grid-cols-12 gap-4 items-end">
                <div class="col-span-12 md:col-span-6">
                  <Input
                    v-model="cadastroContratoForm.nome_completo"
                    label="Nome completo *"
                    placeholder="Nome do cliente/contratante"
                    :forceUpper="true"
                  />
                </div>
                <div class="col-span-12 md:col-span-2">
                  <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-1.5">Tipo de documento *</label>
                  <select
                    v-model="cadastroContratoForm.tipo_documento"
                    class="w-full h-10 rounded-xl border border-border-ui bg-bg-card text-sm text-text-main px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </div>
                <div class="col-span-12 md:col-span-4">
                  <Input
                    v-model="cadastroContratoForm.documento"
                    :label="cadastroContratoForm.tipo_documento === 'CNPJ' ? 'CNPJ *' : 'CPF *'"
                    :placeholder="cadastroContratoForm.tipo_documento === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'"
                    :forceUpper="false"
                    @input="cadastroContratoForm.documento = cadastroContratoForm.tipo_documento === 'CNPJ' ? maskCNPJ(cadastroContratoForm.documento) : maskCPF(cadastroContratoForm.documento)"
                  />
                </div>

                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model="cadastroContratoForm.rg_ie"
                    :label="cadastroContratoForm.tipo_documento === 'CNPJ' ? 'Inscrição estadual' : 'RG'"
                    :forceUpper="false"
                    @input="cadastroContratoForm.rg_ie = cadastroContratoForm.tipo_documento === 'CNPJ' ? maskIE(cadastroContratoForm.rg_ie) : maskRG(cadastroContratoForm.rg_ie)"
                  />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model="cadastroContratoForm.telefone"
                    label="Telefone"
                    placeholder="(00) 0000-0000"
                    :forceUpper="false"
                    @input="cadastroContratoForm.telefone = maskTelefone(cadastroContratoForm.telefone)"
                  />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model="cadastroContratoForm.whatsapp"
                    label="WhatsApp"
                    placeholder="(00) 00000-0000"
                    :forceUpper="false"
                    @input="cadastroContratoForm.whatsapp = maskTelefone(cadastroContratoForm.whatsapp)"
                  />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model="cadastroContratoForm.email"
                    label="E-mail"
                    placeholder="cliente@email.com"
                    :forceUpper="false"
                  />
                </div>

                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model="cadastroContratoForm.cep"
                    label="CEP *"
                    placeholder="00000-000"
                    :forceUpper="false"
                    @input="cadastroContratoForm.cep = maskCEP(cadastroContratoForm.cep)"
                    @blur="buscarCepCadastroContrato"
                  />
                </div>
                <div class="col-span-12 md:col-span-5">
                  <Input
                    v-model="cadastroContratoForm.endereco"
                    label="Nome da rua *"
                    :forceUpper="true"
                  />
                </div>
                <div class="col-span-12 md:col-span-1">
                  <Input
                    v-model="cadastroContratoForm.numero"
                    label="Número *"
                    :forceUpper="false"
                  />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model="cadastroContratoForm.complemento"
                    label="Complemento"
                    :forceUpper="true"
                  />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <Input
                    v-model="cadastroContratoForm.bairro"
                    label="Bairro *"
                    :forceUpper="true"
                  />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <Input
                    v-model="cadastroContratoForm.cidade"
                    label="Cidade *"
                    :forceUpper="true"
                  />
                </div>
                <div class="col-span-12 md:col-span-2">
                  <Input
                    v-model="cadastroContratoForm.estado"
                    label="Estado *"
                    placeholder="UF"
                    :forceUpper="true"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
                <Button type="button" variant="ghost" @click="fecharModalCadastroContrato">Cancelar</Button>
                <Button type="submit" variant="primary" :loading="modalCadastroContrato.salvando">
                  <i class="pi pi-check mr-2"></i>
                  Salvar e continuar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService, ConfiguracaoService, ContratosService, OrcamentosService, VendaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'
import { FORMAS_PAGAMENTO, TAXAS_CARTAO, TAXA_NOTA_FISCAL, VENDA_FECHAMENTO_REGRAS } from '@/constantes'
import { moedaParaNumero } from '@/utils/number'
import { onlyNumbers, maskCEP, maskCPF, maskCNPJ, maskRG, maskIE, maskTelefone } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'
import { closeTabAndGo } from '@/utils/tabs'

definePage({ meta: { perm: ['vendas.criar', 'vendas.fechamento.criar'] } })

const route = useRoute()
const router = useRouter()

const vendaId = computed(() => {
  const p = route.query?.vendaId || route.params?.vendaId
  return p ? String(p).replace(/\D/g, '') || null : null
})
const isEditMode = computed(() => !!vendaId.value)

const loading = ref(false)
const saving = ref(false)

const orcamento = ref(null)
const contratos = ref([])
const clienteIdVenda = ref(null)
const clienteContrato = ref(null)
const configuracaoEmpresa = ref(null)

const clienteContratoPendente = computed(() =>
  clientePrecisaCadastroRapido(clienteContrato.value || orcamento.value?.cliente),
)

const modalCadastroContrato = ref({
  aberto: false,
  salvando: false,
  continuarAposSalvar: false,
})
const cadastroContratoForm = ref({
  nome_completo: '',
  tipo_documento: 'CPF',
  documento: '',
  rg_ie: '',
  telefone: '',
  whatsapp: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
})
const itens = ref([])

const valorFinal = ref(0)
const percentualDesconto = ref(0)
const dataVenda = ref(new Date().toISOString().slice(0, 10))
const temNotaFiscal = ref(false)
const cepEntrega = ref('')
const enderecoEntrega = ref('')
const numeroEntrega = ref('')
const complementoEntrega = ref('')
const bairroEntrega = ref('')
const cidadeEntrega = ref('')
const estadoEntrega = ref('')
const indicacaoNome = ref('')
const representanteVenda = ref({ nome: '', cpf: '', rg: '' })
const TIPO_COMISSAO_OCULTA = 'VENDEDOR'
const DESCONTO_MAXIMO_PERCENTUAL = Number(VENDA_FECHAMENTO_REGRAS?.DESCONTO_MAXIMO_PERCENTUAL || 0)
const DESCONTO_STEP = Number(VENDA_FECHAMENTO_REGRAS?.DESCONTO_PERCENTUAL_STEP || 0.5)
const LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO = Number(
  VENDA_FECHAMENTO_REGRAS?.LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO_PERCENTUAL || 7,
)
const FORMAS_REMOVIDAS_FECHAMENTO = new Set(
  (VENDA_FECHAMENTO_REGRAS?.FORMAS_REMOVIDAS_FECHAMENTO || []).map((x) => String(x || '').toUpperCase()),
)
const FORMAS_PERMITIDAS_ACIMA_LIMITE = new Set(
  (VENDA_FECHAMENTO_REGRAS?.FORMAS_PERMITIDAS_ACIMA_LIMITE_DESCONTO || []).map((x) => String(x || '').toUpperCase()),
)

function formaPagamentoPermitidaPorDesconto(chave) {
  const key = String(chave || '').toUpperCase()
  if (!key) return true
  if (FORMAS_REMOVIDAS_FECHAMENTO.has(key)) return false
  if (Number(percentualDesconto.value || 0) >= LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO) {
    return FORMAS_PERMITIDAS_ACIMA_LIMITE.has(key)
  }
  return true
}

const FORMAS_PAGAMENTO_OPTIONS = computed(() =>
  (FORMAS_PAGAMENTO || [])
    .filter((x) => formaPagamentoPermitidaPorDesconto(x.key))
    .map((x) => ({ label: x.label, value: x.key })),
)

/** Opções de forma de pagamento por linha: não permite outro Cartão de Crédito se já existir uma linha com Crédito. */
function getFormasPagamentoOptionsForRow(rowIdx) {
  const list = pagamentos.value || []
  const jaTemCredito = list.some(
    (p, i) => i !== rowIdx && String(p?.forma_pagamento_chave || '').toUpperCase() === 'CREDITO',
  )
  const base = FORMAS_PAGAMENTO_OPTIONS.value || []
  if (!jaTemCredito) return base
  return base.filter((opt) => String(opt?.value || '').toUpperCase() !== 'CREDITO')
}
const PARCELAS_OPTIONS = computed(() => {
  const parcelasCredito = TAXAS_CARTAO?.CREDITO?.parcelas || {}
  const byTaxa = Object.entries(parcelasCredito)
    .map(([k, taxa]) => ({
      label: `${Number(k)}x`,
      value: Number(k),
    }))
    .filter((x) => Number.isFinite(x.value) && x.value > 0)
    .sort((a, b) => a.value - b.value)

  if (byTaxa.length) return byTaxa

  return (VENDA_FECHAMENTO_REGRAS?.PARCELAS_OPCOES || [1]).map((n) => ({
    label: `${n}x`,
    value: Number(n),
  }))
})
const pagamentoAtual = computed(() => (pagamentos.value || [])[0] || null)
const PARCELAS_MAX_POR_FORMA = VENDA_FECHAMENTO_REGRAS?.PARCELAS_MAX_POR_FORMA || {}
function toParcelas(value) {
  const clean = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/x/gi, '')
  const n = Number(clean)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.floor(n)
}
function maxParcelasDaForma(forma) {
  const key = String(forma || '').toUpperCase()
  if (key === 'CREDITO') {
    const credit = Object.keys(TAXAS_CARTAO?.CREDITO?.parcelas || {})
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n) && n > 0)
    return credit.length ? Math.max(...credit) : 1
  }
  return Number(PARCELAS_MAX_POR_FORMA?.[key] || 1)
}

/** Taxa % da máquina para cartão de crédito; só aplica acima de 10x. */
function taxaPercentualCredito(parcelas) {
  const n = toParcelas(parcelas)
  if (n <= 10) return 0
  const taxa = Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[n] || 0)
  return Number.isFinite(taxa) ? taxa : 0
}

/** Soma das taxas em R$ de todas as linhas de cartão de crédito com parcelas > 10. */
const totalTaxaCartaoReais = computed(() => {
  const list = pagamentos.value || []
  let total = 0
  for (const p of list) {
    if (String(p?.forma_pagamento_chave || '').toUpperCase() !== 'CREDITO') continue
    const parcelas = toParcelas(p.parcelas)
    if (parcelas <= 10) continue
    const valorCartao = Number(p.datas_parcelas?.[0]?.valor || 0)
    const taxaPct = taxaPercentualCredito(p.parcelas)
    total += Math.round((valorCartao * taxaPct) / 100 * 100) / 100
  }
  return total
})

/** Legado: taxa % só da primeira linha (usado em rótulos). */
const taxaCobradaPercentual = computed(() => {
  const forma = String(pagamentoAtual.value?.forma_pagamento_chave || '').toUpperCase()
  const parcelas = toParcelas(pagamentoAtual.value?.parcelas)
  if (forma !== 'CREDITO' || parcelas <= 10) return 0
  const taxa = Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[parcelas] || 0)
  return Number.isFinite(taxa) ? taxa : 0
})

/** Preço cobrado = valor final da venda + taxa da máquina (cartão acima de 10x). */
const valorCobradoVenda = computed(() => {
  const base = Number(valorFinal.value || 0)
  const taxaReais = Number(totalTaxaCartaoReais.value || 0)
  return Math.round((base + taxaReais) * 100) / 100
})

/** Valor que será salvo como valor_vendido: campo manual "com juros" se preenchido, senão o calculado. */
const precoCobradoManual = ref('')
const valorVendidoParaSalvar = computed(() => {
  const manual = moedaParaNumero(String(precoCobradoManual.value || '').trim())
  if (manual > 0) return Math.round(manual * 100) / 100
  return valorCobradoVenda.value
})

/** Valor do contrato (sem juros) – o que o cliente vê no contrato. Se preenchido manualmente, usa; senão soma dos valores base das formas (cartão = valor no cartão total; demais = soma das parcelas). */
const valorBaseContrato = computed(() => {
  const manual = moedaParaNumero(String(precoCobradoManual.value || '').trim())
  if (manual > 0) return Math.round(manual * 100) / 100
  const list = pagamentos.value || []
  let total = 0
  for (const p of list) {
    const forma = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (forma === 'CREDITO') {
      // No cartão o vendedor digita o valor total no cartão (sem juros); com taxa vira o valor a receber
      const valorNoCartao = Number(p.datas_parcelas?.[0]?.valor ?? p.valor ?? 0)
      total += Math.round(valorNoCartao * 100) / 100
    } else {
      const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
      total += parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
    }
  }
  return Math.round(total * 100) / 100
})

const PARCELAS_OPTIONS_FILTRADAS = computed(() => {
  const forma = String(pagamentoAtual.value?.forma_pagamento_chave || '').toUpperCase()
  const max = Math.max(1, maxParcelasDaForma(forma))
  return (PARCELAS_OPTIONS.value || []).filter((x) => Number(x.value) <= max)
})

/** Opções de parcelas para uma forma de pagamento (uso por linha). */
function getParcelasOptionsForForm(forma) {
  const max = Math.max(1, maxParcelasDaForma(forma))
  return (PARCELAS_OPTIONS.value || []).filter((x) => Number(x.value) <= max)
}

const FORMAS_COM_DATA_POR_PARCELA = ['PIX', 'DINHEIRO', 'CHEQUE', 'TRANSFERENCIA', 'DEBITO']

let _pagamentoRowId = 0
function getNextPagamentoRowId() {
  _pagamentoRowId += 1
  return _pagamentoRowId
}

const pagamentos = ref([
  {
    __id: getNextPagamentoRowId(),
    forma_pagamento_chave: '',
    valor: 0, // continua existindo só para compatibilidade/validação
    parcelas: 1,
    data_recebimento: '',
    // cada parcela com sua própria data e valor
    datas_parcelas: [{ data: '', valor: 0 }],
  },
])

function addPagamento() {
  const list = [...(pagamentos.value || [])]
  list.push({
    __id: getNextPagamentoRowId(),
    forma_pagamento_chave: '',
    valor: 0,
    parcelas: 1,
    data_recebimento: '',
    datas_parcelas: [{ data: '', valor: 0 }],
  })
  pagamentos.value = list
}

function removerPagamento(idx) {
  const list = pagamentos.value || []
  if (list.length <= 1) return
  pagamentos.value = list.filter((_, i) => i !== Number(idx))
}

function editarPagamento(_idx) {
  // A linha já é editável; o botão Editar mantém paridade com a tabela de itens (Editar + Excluir).
  // Opcional: scroll para a seção de pagamentos ou focus no primeiro campo da linha.
}

const columnsPagamentos = [
  { key: 'forma', label: 'FORMA DE PAGAMENTO', width: '220px' },
  { key: 'parcelas', label: 'PARCELAS', width: '100px', align: 'right' },
  { key: 'data_prevista', label: 'DATA PREVISTA', width: '160px' },
  { key: 'valor_parcela', label: 'VALOR', width: '140px', align: 'right' },
  { key: 'acoes', label: 'AÇÕES', width: '200px', align: 'right' },
]

const rowsPagamentos = computed(() =>
  (pagamentos.value || []).map((p, idx) => ({ ...p, __idx: idx })),
)

/** Soma dos valores de todas as formas de pagamento. */
const totalValorPagamentos = computed(() => {
  const list = pagamentos.value || []
  let total = 0
  for (const p of list) {
    const forma = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (forma === 'CREDITO') {
      total += Number(p.datas_parcelas?.[0]?.valor ?? p.valor ?? 0)
    } else {
      const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
      total += parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
    }
  }
  return Math.round(total * 100) / 100
})

/** Restante para bater com o valor final da venda. Usa o valor do contrato menos a soma do que o vendedor preencheu nas formas. */
const restanteParaDistribuir = computed(() => {
  const total = Number(valorBaseContrato.value || 0)
  const soma = totalValorPagamentos.value || 0
  return Math.round((total - soma) * 100) / 100
})

/** Total a receber (soma das parcelas reais, com juros no cartão quando >10x). Usado para enviar como valor_vendido e para exibir quando diferente do valor do contrato. */
const totalReceberCalculado = computed(() => {
  const list = pagamentos.value || []
  let total = 0
  for (const p of list) {
    const forma = String(p?.forma_pagamento_chave || '').toUpperCase()
    const n = Math.max(1, toParcelas(p.parcelas))
    const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
    if (forma === 'CREDITO' && parcelas.length) {
      // No cartão o valor digitado é o total no cartão; aplicamos taxa para obter total a receber
      const valorNoCartao = Number(parcelas[0]?.valor ?? p.valor ?? 0)
      const taxaPct = taxaPercentualCredito(n)
      const valorComTaxa = taxaPct > 0 ? Math.round(valorNoCartao * (1 + taxaPct / 100) * 100) / 100 : valorNoCartao
      total += valorComTaxa
    } else if (forma !== 'CREDITO') {
      total += parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
    }
  }
  return Math.round(total * 100) / 100
})

const imagensParaPdf = ref([])
const anexosDocumentos = ref([])
const loadingImagensPdf = ref(false)
const loadingAnexos = ref(false)
const fileInputImagemPdf = ref(null)
const fileInputAnexos = ref(null)

const colArquivos = [
  { key: 'nome', label: 'ARQUIVO' },
  { key: 'acoes', label: '', align: 'right', width: '220px' },
]

const columnsItens = [
  { key: 'nome_ambiente', label: 'Ambiente' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'observacao', label: 'Observações' },
  { key: 'valor_orcado', label: 'Valor orçado', align: 'right', width: '140px' },
  { key: 'valor_rateado', label: 'Valor após desconto', align: 'right', width: '160px' },
  { key: 'acoes', label: 'AÇÕES', width: '150px', align: 'right' },
]

const rowsItens = computed(() =>
  (itens.value || []).map((it, idx) => ({
    ...it,
    __idx: idx,
  })),
)

const totalOrcado = computed(() =>
  (itens.value || []).reduce((acc, it) => acc + Number(it.valor_unitario || 0), 0),
)

const totalFinal = computed(() =>
  (itens.value || []).reduce((acc, it) => acc + Number(it.valor_final || 0), 0),
)

function clampPercentualDesconto(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > DESCONTO_MAXIMO_PERCENTUAL) return DESCONTO_MAXIMO_PERCENTUAL
  return n
}

const descontoTotal = computed(() => {
  const tot = Number(totalOrcado.value || 0)
  const vf = Number(valorFinal.value || 0)
  return Math.max(0, tot - vf)
})

function aplicarRegraPagamentoPorDesconto() {
  let alterou = false
  pagamentos.value = (pagamentos.value || []).map((p) => {
    const key = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (!key || formaPagamentoPermitidaPorDesconto(key)) return p
    alterou = true
    return {
      ...p,
      forma_pagamento_chave: '',
    }
  })
  if (alterou) {
    notify.error(
      `Com desconto a partir de ${LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO}%, somente PIX, Transferência e Dinheiro são permitidos.`,
    )
  }
}

function normalizarParcelasPeloCatalogo() {
  pagamentos.value = (pagamentos.value || []).map((p) => {
    const opts = getParcelasOptionsForForm(p.forma_pagamento_chave)
    const permitidas = new Set((opts || []).map((x) => Number(x.value)))
    const atual = toParcelas(p?.parcelas)
    if (permitidas.has(atual)) return p
    const primeira = opts?.[0]?.value ?? 1
    return { ...p, parcelas: Number(primeira) }
  })
}

function ensureDatasParcelas(p) {
  // Cartão de crédito: 1 linha (data 1ª parcela e valor da parcela); as demais são geradas no backend
  if (String(p.forma_pagamento_chave || '').toUpperCase() === 'CREDITO') {
    if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
    if (p.datas_parcelas.length === 0) p.datas_parcelas.push({ data: '', valor: 0 })
    return
  }
  if (!FORMAS_COM_DATA_POR_PARCELA.map((f) => String(f).toUpperCase()).includes(String(p.forma_pagamento_chave || '').toUpperCase())) return
  const n = Math.max(1, Math.min(24, toParcelas(p.parcelas)))
  if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
  while (p.datas_parcelas.length < n) {
    p.datas_parcelas.push({ data: '', valor: 0 })
  }
  if (p.datas_parcelas.length > n) p.datas_parcelas = p.datas_parcelas.slice(0, n)
}

function splitValores(total, parcelas) {
  const n = Math.max(1, toParcelas(parcelas))
  const base = Math.round((Number(total || 0) / n) * 100) / 100
  const list = []
  for (let i = 0; i < n; i++) {
    const v = i === n - 1 ? Math.round((Number(total || 0) - base * (n - 1)) * 100) / 100 : base
    list.push(v)
  }
  return list
}

function prefillParcelasValores({ resetDatas = false } = {}) {
  const p = pagamentoAtual.value
  if (!p) return
  const forma = String(p.forma_pagamento_chave || '').toUpperCase()
  const n = Math.max(1, toParcelas(p.parcelas))

  if (forma === 'CREDITO') {
    // Cartão: valor no cartão é livre (usuário informa); não preencher com valor da venda.
    ensureDatasParcelas(p)
    const valorAtual = p.datas_parcelas?.[0]?.valor ?? 0
    const dataAtual = resetDatas ? '' : (p.datas_parcelas?.[0]?.data || '')
    p.datas_parcelas = [{ data: dataAtual, valor: valorAtual }]
    p.valor = Number(valorAtual)
    return
  }

  const valores = splitValores(valorCobradoVenda.value, n)
  ensureDatasParcelas(p)
  p.datas_parcelas = (p.datas_parcelas || []).map((parc, i) => ({
    data: resetDatas ? '' : (parc?.data || ''),
    valor: valores[i] || 0,
  }))
  p.valor = p.datas_parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
}

function limparPagamentoAoTrocarForma() {
  const p = pagamentoAtual.value
  if (!p) return
  const max = Math.max(1, maxParcelasDaForma(p.forma_pagamento_chave))
  p.parcelas = Math.max(1, Math.min(toParcelas(p.parcelas), max))
  p.data_recebimento = ''
  p.datas_parcelas = []
  prefillParcelasValores({ resetDatas: true })
}

function normalizeDatasParcelas(p) {
  ensureDatasParcelas(p)
  return Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
}

function recomputarTotalPagamento(idx) {
  const p = pagamentos.value[idx]
  if (!p || !Array.isArray(p.datas_parcelas)) return
  p.valor = p.datas_parcelas.reduce(
    (acc, parc) => acc + Number(parc?.valor || 0),
    0,
  )
}

/** Soma dos valores já preenchidos em todas as linhas de pagamento. */
function somaValorPagamentos() {
  const list = pagamentos.value || []
  let total = 0
  for (const p of list) {
    const forma = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (forma === 'CREDITO') {
      total += Number(p.datas_parcelas?.[0]?.valor ?? p.valor ?? 0)
    } else {
      const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
      total += parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
    }
  }
  return Math.round(total * 100) / 100
}

/** Preenche a primeira linha zerada (não-crédito) com o restante do valor final da venda. A taxa é do cartão; o restante (PIX etc.) não inclui taxa. */
function prefillRestanteNosZerados() {
  const DEBUG = false
  const log = (...args) => DEBUG && console.log('[prefillRestanteNosZerados]', ...args)

  const valorBase = Number(valorFinal.value || 0)
  log('início', { valorBase: valorFinal.value })
  if (valorBase <= 0) {
    log('SAIU: valorFinal <= 0')
    return
  }
  const list = pagamentos.value || []
  log('pagamentos.length', list.length)

  let somaPreenchida = 0
  for (const p of list) {
    const forma = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (forma === 'CREDITO') {
      const v = Number(p.datas_parcelas?.[0]?.valor ?? p.valor ?? 0)
      somaPreenchida += v
      log('  row CREDITO', { forma, valor: v })
    } else if (forma) {
      const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
      const somaRow = parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
      somaPreenchida += somaRow
      log('  row', { forma, parcelasLength: parcelas.length, somaRow })
    }
  }
  const restante = Math.round((valorBase - somaPreenchida) * 100) / 100
  log('somaPreenchida', somaPreenchida, 'restante (valor final - preenchido)', restante)
  // Não fazer return aqui quando restante <= 0: ainda podemos precisar redistribuir (diluir) dentro de uma linha

  for (let idx = 0; idx < list.length; idx++) {
    const p = list[idx]
    const forma = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (forma === 'CREDITO' || !forma) {
      log('  [', idx, '] PULOU:', forma === 'CREDITO' ? 'CREDITO' : 'forma vazia')
      continue
    }
    ensureDatasParcelas(p)
    const parcelas = p.datas_parcelas || []
    const n = Math.max(1, toParcelas(p.parcelas))
    const somaRow = parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
    const qtdZeradas = parcelas.filter((parc) => !Number(parc?.valor || 0)).length
    const linhaZerada = somaRow === 0
    const soUmaParcelaPreenchida = n > 1 && parcelas.length >= 1 && (qtdZeradas > 0 || parcelas.length < n) && somaRow > 0

    if (linhaZerada && restante <= 0) {
      log('  [', idx, '] PULOU: linha zerada mas restante <= 0')
      continue
    }
    if (!linhaZerada && !soUmaParcelaPreenchida) {
      log('  [', idx, '] PULOU: não precisa preencher nem redistribuir')
      continue
    }

    const valorLinha = linhaZerada ? restante : somaRow
    if (linhaZerada && valorLinha <= 0) {
      log('  [', idx, '] PULOU: valorLinha <= 0')
      continue
    }
    const valores = splitValores(valorLinha, n)
    log('  [', idx, ']', forma, 'PREENCHENDO', { valorLinha, n, valores })

    const base = Array.from({ length: n }, (_, i) => ({
      ...(parcelas[i] || { data: '', valor: 0 }),
      valor: valores[i] ?? 0,
    }))
    p.datas_parcelas = base
    p.valor = base.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
    log('  OK: atribuído', base.map((x) => x.valor))
    return
  }
  log('SAIU: nenhuma linha preenchida')
}

function mostrarDataPorParcela(p) {
  if (!p || !FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return false
  const n = Math.max(1, Math.min(24, toParcelas(p.parcelas)))
  if (n <= 1) return false
  ensureDatasParcelas(p)
  return true
}

async function carregarImagensParaPdf() {
  const id = orcamento.value?.id
  if (!id) {
    imagensParaPdf.value = []
    return
  }
  loadingImagensPdf.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: 'IMAGEM_PDF',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    imagensParaPdf.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingImagensPdf.value = false
  }
}

async function carregarAnexosDocumentos() {
  const id = orcamento.value?.id
  if (!id) {
    anexosDocumentos.value = []
    return
  }
  loadingAnexos.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: 'ANEXO',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    anexosDocumentos.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingAnexos.value = false
  }
}

function carregarArquivos() {
  carregarImagensParaPdf()
  carregarAnexosDocumentos()
}

function abrirArquivo(row) {
  const oid = String(orcamento.value?.id || '').replace(/\D/g, '')
  const backTo = encodeURIComponent(`/vendas/fechamento?orcamentoId=${oid}`)
  const name = encodeURIComponent(row?.nome || row?.filename || 'ARQUIVO')
  const type = encodeURIComponent(row?.mime_type || '')

  router.push(`/arquivos/${row.id}?name=${name}&type=${type}&backTo=${backTo}`)
}

async function excluirArquivo(arquivoId, _categoria) {
  if (!can('arquivos.excluir') || !can('orcamentos.editar')) return notify.error('Acesso negado.')

  try {
    await ArquivosService.remover(Number(arquivoId))
    notify.success('Arquivo removido.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao excluir arquivo.')
  }
}

function clicarAdicionarArquivo(categoria) {
  if (!can('orcamentos.editar') || !can('arquivos.criar')) return notify.error('Acesso negado.')
  if (!orcamento.value?.id) return notify.error('Orçamento não carregado.')

  const input = categoria === 'IMAGEM_PDF' ? fileInputImagemPdf.value : fileInputAnexos.value
  if (!input) return notify.error('Input de arquivo não montado.')
  input?.click?.()
}

async function onPickArquivo(e, categoria) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  if (!can('arquivos.criar') || !can('orcamentos.editar')) return notify.error('Acesso negado.')
  if (!orcamento.value?.id) return notify.error('Orçamento não carregado.')

  try {
    await ArquivosService.upload({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(orcamento.value.id).replace(/\D/g, '')),
      categoria: categoria || 'ANEXO',
      file,
    })
    notify.success(categoria === 'IMAGEM_PDF' ? 'Imagem adicionada.' : 'Arquivo anexado.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar arquivo.')
  }
}

function aplicarRateio() {
  const tot = Number(totalOrcado.value || 0)
  const pct = clampPercentualDesconto(percentualDesconto.value)
  percentualDesconto.value = pct
  const vf = tot > 0 ? Math.round(tot * (1 - pct / 100) * 100) / 100 : 0
  valorFinal.value = vf
  if (tot <= 0 || vf <= 0) {
    itens.value = (itens.value || []).map((it) => ({ ...it, valor_final: it.valor_unitario || 0 }))
    return
  }
  const fator = vf / tot
  itens.value = (itens.value || []).map((it) => ({
    ...it,
    valor_final: Math.round(Number(it.valor_unitario || 0) * fator * 100) / 100,
  }))
}

function sincronizarValorFinalComTotal() {
  const soma = Number(totalFinal.value || 0)
  const tot = Number(totalOrcado.value || 0)
  if (tot <= 0) {
    valorFinal.value = soma
    percentualDesconto.value = 0
    return
  }
  const pct = ((tot - soma) / tot) * 100
  const pctNormalizado = Math.round(pct * 100) / 100
  if (pctNormalizado > DESCONTO_MAXIMO_PERCENTUAL) {
    percentualDesconto.value = DESCONTO_MAXIMO_PERCENTUAL
    notify.error(`Desconto máximo permitido é ${DESCONTO_MAXIMO_PERCENTUAL}%.`)
    aplicarRateio()
    return
  }
  percentualDesconto.value = clampPercentualDesconto(pctNormalizado)
  valorFinal.value = soma
}

function onPercentualDescontoInput(v) {
  percentualDesconto.value = clampPercentualDesconto(v)
  aplicarRateio()
}

function preencherEnderecoEntregaComCliente(cliente) {
  enderecoEntrega.value = String(cliente?.endereco || '').trim()
  numeroEntrega.value = String(cliente?.numero || '').trim()
  complementoEntrega.value = String(cliente?.complemento || '').trim()
  bairroEntrega.value = String(cliente?.bairro || '').trim()
  cidadeEntrega.value = String(cliente?.cidade || '').trim()
  estadoEntrega.value = String(cliente?.estado || '').trim()
}

function obterTipoDocumento(cliente) {
  const cnpj = onlyNumbers(cliente?.cnpj || '')
  if (cnpj.length === 14) return 'CNPJ'
  return 'CPF'
}

function clientePrecisaCadastroRapido(cliente) {
  const c = cliente || {}
  const nome = String(c.nome_completo || '').trim()
  const cpf = onlyNumbers(c.cpf || '')
  const cnpj = onlyNumbers(c.cnpj || '')
  const docOk = cpf.length === 11 || cnpj.length === 14
  const camposEndereco = [
    String(c.cep || '').trim(),
    String(c.endereco || '').trim(),
    String(c.numero || '').trim(),
    String(c.bairro || '').trim(),
    String(c.cidade || '').trim(),
    String(c.estado || '').trim(),
  ]
  return !nome || !docOk || camposEndereco.some((v) => !v)
}

function preencherCadastroRapidoComCliente(cliente) {
  const c = cliente || {}
  const tipo = obterTipoDocumento(c)
  cadastroContratoForm.value = {
    nome_completo: String(c.nome_completo || '').trim(),
    tipo_documento: tipo,
    documento: tipo === 'CNPJ' ? maskCNPJ(c.cnpj || '') : maskCPF(c.cpf || ''),
    rg_ie: tipo === 'CNPJ' ? maskIE(c.ie || '') : maskRG(c.rg || ''),
    telefone: maskTelefone(c.telefone || ''),
    whatsapp: maskTelefone(c.whatsapp || ''),
    email: String(c.email || '').trim(),
    cep: maskCEP(c.cep || ''),
    endereco: String(c.endereco || '').trim(),
    numero: String(c.numero || '').trim(),
    complemento: String(c.complemento || '').trim(),
    bairro: String(c.bairro || '').trim(),
    cidade: String(c.cidade || '').trim(),
    estado: String(c.estado || '').trim(),
  }
}

function abrirModalCadastroContrato(continuarAposSalvar = false) {
  preencherCadastroRapidoComCliente(clienteContrato.value || orcamento.value?.cliente || {})
  modalCadastroContrato.value.continuarAposSalvar = Boolean(continuarAposSalvar)
  modalCadastroContrato.value.aberto = true
}

function fecharModalCadastroContrato() {
  modalCadastroContrato.value.aberto = false
  modalCadastroContrato.value.salvando = false
  modalCadastroContrato.value.continuarAposSalvar = false
}

async function buscarCepCadastroContrato() {
  const cepLimpo = onlyNumbers(cadastroContratoForm.value.cep).slice(0, 8)
  if (cepLimpo.length !== 8) return
  const data = await buscarCep(cepLimpo)
  if (!data) return notify.warn('CEP não encontrado.')
  cadastroContratoForm.value.cep = data.cep ? maskCEP(data.cep) : cadastroContratoForm.value.cep
  cadastroContratoForm.value.endereco = data.logradouro || cadastroContratoForm.value.endereco
  cadastroContratoForm.value.bairro = data.bairro || cadastroContratoForm.value.bairro
  cadastroContratoForm.value.cidade = data.localidade || cadastroContratoForm.value.cidade
  cadastroContratoForm.value.estado = data.uf || cadastroContratoForm.value.estado
}

function validarCadastroContrato() {
  const f = cadastroContratoForm.value
  if (!String(f.nome_completo || '').trim()) return 'Informe o nome do cliente.'
  const doc = onlyNumbers(f.documento || '')
  if (f.tipo_documento === 'CPF' && doc.length !== 11) return 'Informe um CPF válido.'
  if (f.tipo_documento === 'CNPJ' && doc.length !== 14) return 'Informe um CNPJ válido.'
  if (onlyNumbers(f.cep || '').length !== 8) return 'Informe um CEP válido.'
  if (!String(f.endereco || '').trim()) return 'Informe o nome da rua.'
  if (!String(f.numero || '').trim()) return 'Informe o número.'
  if (!String(f.bairro || '').trim()) return 'Informe o bairro.'
  if (!String(f.cidade || '').trim()) return 'Informe a cidade.'
  if (!String(f.estado || '').trim()) return 'Informe o estado.'
  return null
}

async function salvarCadastroContratoRapido() {
  const erro = validarCadastroContrato()
  if (erro) return notify.error(erro)
  const clienteId = Number(clienteIdVenda.value || orcamento.value?.cliente_id || orcamento.value?.cliente?.id || 0)
  if (!clienteId) return notify.error('Cliente da venda não encontrado para atualização.')

  const f = cadastroContratoForm.value
  const payload = {
    nome_completo: String(f.nome_completo || '').trim(),
    cpf: f.tipo_documento === 'CPF' ? onlyNumbers(f.documento) : null,
    cnpj: f.tipo_documento === 'CNPJ' ? onlyNumbers(f.documento) : null,
    rg: f.tipo_documento === 'CPF' ? onlyNumbers(f.rg_ie) : null,
    ie: f.tipo_documento === 'CNPJ' ? onlyNumbers(f.rg_ie) : null,
    telefone: String(f.telefone || '').trim() || null,
    whatsapp: String(f.whatsapp || '').trim() || null,
    email: String(f.email || '').trim() || null,
    cep: onlyNumbers(f.cep),
    endereco: String(f.endereco || '').trim(),
    numero: String(f.numero || '').trim(),
    complemento: String(f.complemento || '').trim() || null,
    bairro: String(f.bairro || '').trim(),
    cidade: String(f.cidade || '').trim(),
    estado: String(f.estado || '').trim(),
  }

  modalCadastroContrato.value.salvando = true
  try {
    const { data } = await ClienteService.salvar(clienteId, payload)
    clienteContrato.value = data || { ...(clienteContrato.value || {}), ...payload }
    if (orcamento.value?.cliente) {
      orcamento.value = { ...orcamento.value, cliente: { ...orcamento.value.cliente, ...payload } }
    }
    notify.success('Cadastro rápido do contratante atualizado.')
    const continuar = modalCadastroContrato.value.continuarAposSalvar
    fecharModalCadastroContrato()
    if (continuar) await criarOuAtualizarVenda({ skipCadastroContrato: true })
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao atualizar cadastro do contratante.')
  } finally {
    modalCadastroContrato.value.salvando = false
  }
}

function montarEnderecoEntregaCompleto(rua, numero, complemento, bairro, cidade, estado) {
  const base = String(rua || '').trim()
  const num = String(numero || '').trim()
  const comp = String(complemento || '').trim()
  const bai = String(bairro || '').trim()
  const cid = String(cidade || '').trim()
  const uf = String(estado || '').trim()
  return [base, num, comp, bai, cid, uf].filter(Boolean).join(', ')
}

async function buscarEnderecoEntregaPorCep() {
  const cepLimpo = onlyNumbers(cepEntrega.value).slice(0, 8)
  if (cepLimpo.length !== 8) return
  const data = await buscarCep(cepLimpo)
  if (!data) {
    notify.warn('CEP de entrega não encontrado.')
    return
  }
  cepEntrega.value = data.cep ? maskCEP(data.cep) : cepEntrega.value
  enderecoEntrega.value = String(data.logradouro || enderecoEntrega.value || '').trim()
  bairroEntrega.value = String(data.bairro || bairroEntrega.value || '').trim()
  cidadeEntrega.value = String(data.localidade || cidadeEntrega.value || '').trim()
  estadoEntrega.value = String(data.uf || estadoEntrega.value || '').trim()
}

async function carregarConfiguracaoEmpresa() {
  try {
    const data = await ConfiguracaoService.carregar()
    configuracaoEmpresa.value = data || {}
  } catch {
    configuracaoEmpresa.value = null
  }
}

/** Representante do cadastro da empresa (Configurações > Empresa). Usado quando o representante da venda não está preenchido. */
function getRepresentanteFromEmpresa() {
  const cfg = configuracaoEmpresa.value || {}
  return {
    nome: String(cfg.representante_legal_nome || '').trim(),
    cpf: String(cfg.representante_legal_cpf || '').replace(/\D/g, ''),
    rg: String(cfg.representante_legal_rg || '').trim(),
  }
}

/** Se o representante da venda estiver vazio, preenche com os dados do cadastro da empresa. */
function preencherRepresentanteDoCadastroEmpresaSeVazio() {
  const rep = representanteVenda.value || {}
  const temPreenchido = (rep.nome || '').trim() || (rep.cpf || '').trim() || (rep.rg || '').trim()
  if (temPreenchido) return
  const daEmpresa = getRepresentanteFromEmpresa()
  if (daEmpresa.nome || daEmpresa.cpf || daEmpresa.rg) {
    representanteVenda.value = { ...daEmpresa }
  }
}

function adicionarItemVenda() {
  itens.value.push({
    nome_ambiente: '',
    descricao: '',
    observacao: '',
    valor_unitario: 0,
    valor_final: 0,
  })
}

function editarItemVenda(_idx) {
  // Os campos já são editáveis na própria linha.
  // Mantemos o botão por clareza visual para o vendedor.
}

function removerItemVenda(idx) {
  if (!itens.value || itens.value.length === 0) return
  itens.value.splice(idx, 1)
  sincronizarValorFinalComTotal()
}

async function carregarOrcamento() {
  const idParam = route.query?.orcamentoId || route.params?.orcamentoId
  const id = Number(String(idParam || '').replace(/\D/g, ''))
  if (!id) {
    notify.error('Orçamento não informado.')
    return
  }

  loading.value = true
  try {
    const { data } = await OrcamentosService.detalhar(id)
    orcamento.value = data
    clienteContrato.value = data?.cliente || null
    itens.value = (data?.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: it.observacao ?? '',
      valor_unitario: Number(it.valor_unitario || 0), // orçado (referência)
      valor_final: Number(it.valor_unitario || 0), // valor de venda inicial (pode ser alterado)
    }))
    cepEntrega.value = data?.cliente?.cep ? maskCEP(data.cliente.cep) : ''
    preencherEnderecoEntregaComCliente(data?.cliente)
    temNotaFiscal.value = false
    percentualDesconto.value = 0
    aplicarRateio()
    representanteVenda.value = { nome: '', cpf: '', rg: '' }
    preencherRepresentanteDoCadastroEmpresaSeVazio()

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamento.')
  } finally {
    loading.value = false
  }
}

/** Carrega venda existente para edição (mesma tela do fechamento). */
async function carregarVenda() {
  const id = vendaId.value
  if (!id) {
    notify.error('Venda não informada.')
    return
  }

  loading.value = true
  try {
    const { data: venda } = await VendaService.buscar(id)
    const orcId = Number(venda?.orcamento_id || 0)
    if (!orcId) {
      notify.error('Venda sem orçamento vinculado.')
      return
    }

    const { data: orc } = await OrcamentosService.detalhar(orcId)
    orcamento.value = orc
    clienteContrato.value = orc?.cliente || null

    const orcItens = orc?.itens || []
    const vendaItens = venda?.itens || []
    itens.value = orcItens.length
      ? orcItens.map((it, i) => ({
          nome_ambiente: it.nome_ambiente,
          descricao: it.descricao,
          observacao: it.observacao ?? '',
          valor_unitario: Number(it.valor_unitario || 0),
          valor_final: Number(vendaItens[i]?.valor_unitario ?? it.valor_unitario ?? 0),
        }))
      : vendaItens.map((it) => ({
          nome_ambiente: it.nome_ambiente,
          descricao: it.descricao,
          observacao: it.observacao ?? '',
          valor_unitario: Number(it.valor_unitario || 0),
          valor_final: Number(it.valor_unitario || 0),
        }))

    const totalOrcadoAtual = itens.value.reduce((acc, it) => acc + Number(it.valor_unitario || 0), 0)
    const valorVendaAtual = Number(venda?.valor_vendido ?? 0)
    if (totalOrcadoAtual > 0) {
      const pctAtual = ((totalOrcadoAtual - valorVendaAtual) / totalOrcadoAtual) * 100
      percentualDesconto.value = clampPercentualDesconto(Math.round(pctAtual * 100) / 100)
      aplicarRateio()
    } else {
      valorFinal.value = valorVendaAtual
      percentualDesconto.value = 0
    }
    dataVenda.value = venda?.data_venda ? String(venda.data_venda).slice(0, 10) : new Date().toISOString().slice(0, 10)
    temNotaFiscal.value = Boolean(venda?.tem_nota_fiscal) || Number(venda?.taxa_nota_fiscal_percentual_aplicado || 0) > 0
    cepEntrega.value = orc?.cliente?.cep ? maskCEP(orc.cliente.cep) : ''
    const enderecoEntregaSalvo = String(venda?.endereco_entrega || '').trim()
    if (enderecoEntregaSalvo) {
      enderecoEntrega.value = enderecoEntregaSalvo
      numeroEntrega.value = ''
      complementoEntrega.value = ''
      bairroEntrega.value = ''
      cidadeEntrega.value = ''
      estadoEntrega.value = ''
    } else {
      preencherEnderecoEntregaComCliente(orc?.cliente)
    }

    representanteVenda.value = {
      nome: String(venda?.representante_venda_nome || '').trim(),
      cpf: String(venda?.representante_venda_cpf || '').replace(/\D/g, ''),
      rg: String(venda?.representante_venda_rg || '').trim(),
    }

    const valorVendidoSalvo = Number(venda?.valor_vendido ?? 0)
    precoCobradoManual.value = valorVendidoSalvo > 0 ? format.currency(valorVendidoSalvo) : ''

    const pagos = venda?.pagamentos || []
    if (pagos.length > 0) {
      const totalPagos = pagos.reduce((acc, p) => acc + Number(p?.valor || 0), 0)
      const forma = String(pagos[0]?.forma_pagamento_chave || '').toUpperCase()
      const nParcelas = Math.max(1, pagos.length)
      // Cartão: no form mostramos "valor no cartão" (o que o vendedor digita). Se as parcelas salvas já têm taxa, exibimos o valor base para não somar juros de novo ao salvar.
      const taxaPct = forma === 'CREDITO' ? taxaPercentualCredito(nParcelas) : 0
      const valorCartaoExibir =
        forma === 'CREDITO' && taxaPct > 0
          ? Math.round((totalPagos / (1 + taxaPct / 100)) * 100) / 100
          : totalPagos
      const primeiraData =
        pagos[0]?.data_prevista_recebimento
          ? String(pagos[0].data_prevista_recebimento).slice(0, 10)
          : (pagos[0]?.data_recebimento ? String(pagos[0].data_recebimento).slice(0, 10) : '')
      pagamentos.value = [
        {
          __id: getNextPagamentoRowId(),
          forma_pagamento_chave: pagos[0]?.forma_pagamento_chave || '',
          valor: forma === 'CREDITO' ? valorCartaoExibir : totalPagos,
          parcelas: Math.max(1, pagos.length),
          data_recebimento: primeiraData,
          datas_parcelas:
            forma === 'CREDITO'
              ? [{ data: primeiraData, valor: valorCartaoExibir }]
              : pagos.map((p) => ({
                  data: p.data_prevista_recebimento ? String(p.data_prevista_recebimento).slice(0, 10) : (p.data_recebimento ? String(p.data_recebimento).slice(0, 10) : ''),
                  valor: Number(p.valor || 0),
                })),
        },
      ]
    } else {
      pagamentos.value = [{ __id: getNextPagamentoRowId(), forma_pagamento_chave: '', valor: 0, parcelas: 1, data_recebimento: '', datas_parcelas: [{ data: '', valor: 0 }] }]
    }

    const comis = venda?.comissoes || []
    indicacaoNome.value = String(comis?.[0]?.responsavel_nome || '')

    clienteIdVenda.value = venda?.cliente_id ?? orc?.cliente_id ?? null
    if (can('contratos.ver')) {
      const contratosRes = await ContratosService.listar({ venda_id: id })
      contratos.value = Array.isArray(contratosRes?.data) ? contratosRes.data : []
    } else {
      contratos.value = []
    }

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar venda.')
  } finally {
    loading.value = false
  }
}

function canCriarVenda() {
  return can('vendas.criar') || can('vendas.fechamento.criar')
}

function salvarVenda() {
  if (isEditMode.value) {
    if (!can('vendas.editar')) {
      notify.error('Acesso negado.')
      return
    }
  } else {
    if (!canCriarVenda()) {
      notify.error('Acesso negado.')
      return
    }
  }
  criarOuAtualizarVenda()
}

async function criarOuAtualizarVenda({ skipCadastroContrato = false } = {}) {
  if (!orcamento.value) {
    notify.error('Orçamento não carregado.')
    return
  }
  if (!valorFinal.value || valorFinal.value <= 0) {
    notify.error('Informe o valor final da venda.')
    return
  }

  if (!skipCadastroContrato && clientePrecisaCadastroRapido(clienteContrato.value || orcamento.value?.cliente)) {
    if (!can('clientes.editar')) {
      notify.error('Faltam dados do contratante e você não tem permissão para editar cliente.')
      return
    }
    notify.warn('Complete os dados do contratante antes de concluir a venda.')
    abrirModalCadastroContrato(true)
    return
  }

  saving.value = true
  try {
    const pagamentosPayload = (function () {
      const list = []
      const dataVendaStr = (dataVenda.value || '').trim() || null
      // Cartão: valor digitado é o que passa no cartão; acima de 10x aplicamos a taxa e salvamos as parcelas já com juros (diluídos).
      const valorCartaoComTaxa = (valorDigitado, parcelasCount) => {
        const v = Number(valorDigitado || 0)
        if (v <= 0) return 0
        const taxaPct = taxaPercentualCredito(parcelasCount)
        if (taxaPct <= 0) return v
        return Math.round(v * (1 + taxaPct / 100) * 100) / 100
      }
      const parseDataLocal = (str) => {
        if (!str || typeof str !== 'string') return null
        const parts = String(str).trim().split('-').map(Number)
        if (parts.length !== 3) return null
        const [y, m, d] = parts
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
        const date = new Date(y, m - 1, d)
        return Number.isNaN(date.getTime()) ? null : date
      }
      for (const p of pagamentos.value || []) {
        const forma = String(p.forma_pagamento_chave || '').trim()
        const formaUpper = forma.toUpperCase()
        if (!formaPagamentoPermitidaPorDesconto(formaUpper)) {
          throw new Error(
            `Forma de pagamento "${formaUpper}" não permitida para desconto de ${Number(percentualDesconto.value || 0).toFixed(2)}%.`,
          )
        }
        const nParcelas = Math.max(1, Math.min(24, toParcelas(p.parcelas)))
        const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []

        // Cartão de crédito: data que passou o cartão = 1ª parcela; demais a cada 30 dias (recorrente)
        if (formaUpper === 'CREDITO' && parcelas.length && parcelas[0]?.data) {
          const base = parcelas[0]
          const valorNoCartao = Number(base.valor || 0)
          const valorParaSalvar = valorCartaoComTaxa(valorNoCartao, nParcelas)
          const dataBase = parseDataLocal(base.data) || new Date(base.data)

          if (dataBase && !Number.isNaN(dataBase.getTime()) && valorParaSalvar > 0) {
            const valorParcela = Math.round((valorParaSalvar / nParcelas) * 100) / 100
            for (let i = 0; i < nParcelas; i++) {
              const d = new Date(dataBase)
              d.setDate(d.getDate() + 30 * i)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              const valorEstaParcela =
                i === nParcelas - 1
                  ? Math.round((valorParaSalvar - valorParcela * (nParcelas - 1)) * 100) / 100
                  : valorParcela
              list.push({
                forma_pagamento_chave: forma,
                valor: valorEstaParcela,
                data_prevista_recebimento: `${y}-${m}-${day}`,
                data_recebimento: null,
              })
            }
            continue
          }
        }

        // Cartão de crédito sem data preenchida: gera N parcelas pelo valor no cartão e data da venda.
        if (formaUpper === 'CREDITO' && nParcelas >= 1) {
          const valorNoCartao = Number(parcelas[0]?.valor ?? p.valor ?? 0)
          const valorParaSalvar = valorCartaoComTaxa(valorNoCartao, nParcelas)
          if (valorParaSalvar > 0) {
            const valorParcela = Math.round((valorParaSalvar / nParcelas) * 100) / 100
            let dataBase = (dataVendaStr && parseDataLocal(dataVendaStr)) || new Date(dataVendaStr || undefined)
            if (!dataBase || Number.isNaN(dataBase.getTime())) dataBase = new Date()
            for (let i = 0; i < nParcelas; i++) {
              const d = new Date(dataBase)
              d.setDate(d.getDate() + 30 * i)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              let valorEstaParcela = i === nParcelas - 1 ? valorParaSalvar - valorParcela * (nParcelas - 1) : valorParcela
              valorEstaParcela = Math.round(valorEstaParcela * 100) / 100
              list.push({
                forma_pagamento_chave: forma,
                valor: valorEstaParcela,
                data_prevista_recebimento: `${y}-${m}-${day}`,
                data_recebimento: null,
              })
            }
          }
          continue
        }

        // Demais formas: cada linha (data/valor) vira um pagamento
        if (parcelas.length) {
          for (const parc of parcelas) {
            list.push({
              forma_pagamento_chave: forma,
              valor: Number(parc?.valor || 0),
              data_prevista_recebimento: parc?.data || null,
              data_recebimento: null,
            })
          }
        } else {
          list.push({
            forma_pagamento_chave: forma,
            valor: Number(p.valor || 0),
            data_prevista_recebimento: p.data_recebimento || null,
            data_recebimento: null,
          })
        }
      }
      const soma = list.reduce((acc, x) => acc + Number(x.valor || 0), 0)
      // Soma dos pagamentos = total a receber (valor_vendido). Quando há juros no cartão, pode ser maior que o valor do contrato.
      if (list.length === 0) {
        throw new Error('Adicione ao menos uma forma de pagamento.')
      }
      return list
    })()

    const somaPagamentosPayload = pagamentosPayload.reduce((acc, x) => acc + Number(x.valor || 0), 0)

    const formasPagamentoPayload = (function () {
      const out = []
      for (const p of pagamentos.value || []) {
        const forma = String(p?.forma_pagamento_chave || '').trim()
        if (!forma) continue
        const formaUpper = forma.toUpperCase()
        const n = Math.max(1, toParcelas(p.parcelas))
        const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
        let valorBase = 0
        if (formaUpper === 'CREDITO') {
          valorBase = Number(parcelas[0]?.valor ?? p.valor ?? 0)
        } else {
          valorBase = parcelas.reduce((acc, parc) => acc + Number(parc?.valor || 0), 0)
        }
        if (valorBase <= 0) continue
        out.push({
          forma_pagamento_chave: forma,
          valor_base: Math.round(valorBase * 100) / 100,
          quantidade_parcelas: n,
          com_juros: formaUpper === 'CREDITO' && n > 10,
        })
      }
      return out
    })()

    const nomeIndicacao = String(indicacaoNome.value || '').trim()
    const comissoesPayload = nomeIndicacao
      ? [
          {
            tipo_comissao_chave: TIPO_COMISSAO_OCULTA,
            percentual_aplicado: 0,
            responsavel_nome: nomeIndicacao,
          },
        ]
      : []

    const itensPayload = (itens.value || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: it.observacao ?? '',
      quantidade: 1,
      valor_unitario: Number(it.valor_final ?? it.valor_unitario ?? 0),
    }))

    const rep = representanteVenda.value || {}
    const nomeRep = (rep.nome || '').trim()
    const cpfRep = (rep.cpf || '').trim()
    const rgRep = (rep.rg || '').trim()
    const repPreenchido = nomeRep || cpfRep || rgRep
    const repFinal = repPreenchido ? rep : getRepresentanteFromEmpresa()
    const payload = {
      orcamento_id: Number(orcamento.value.id),
      status: 'VENDA_FECHADA',
      data_venda: dataVenda.value,
      endereco_entrega:
        montarEnderecoEntregaCompleto(
          enderecoEntrega.value,
          numeroEntrega.value,
          complementoEntrega.value,
          bairroEntrega.value,
          cidadeEntrega.value,
          estadoEntrega.value,
        ) || undefined,
      valor_vendido: Math.round(somaPagamentosPayload * 100) / 100,
      valor_base_contrato: Number(valorBaseContrato.value || 0),
      valor_base_venda: Math.round(somaPagamentosPayload * 100) / 100,
      tem_nota_fiscal: Boolean(temNotaFiscal.value),
      taxa_nota_fiscal_percentual_aplicado: temNotaFiscal.value ? Number(TAXA_NOTA_FISCAL?.taxa || 0) : 0,
      representante_venda_nome: (repFinal.nome || '').trim() || undefined,
      representante_venda_cpf: (repFinal.cpf || '').trim() || undefined,
      representante_venda_rg: (repFinal.rg || '').trim() || undefined,
      itens: itensPayload,
      pagamentos: pagamentosPayload,
      formas_pagamento: formasPagamentoPayload.length ? formasPagamentoPayload : undefined,
      comissoes: comissoesPayload,
    }

    const id = isEditMode.value ? vendaId.value : null
    const { data } = await VendaService.salvar(id, payload)
    const savedId = data?.id || id
    if (isEditMode.value) {
      notify.success('Venda atualizada.')
      closeTabAndGo(`/vendas/venda/${savedId}`)
    } else {
      notify.success('Venda criada. Você será redirecionada para o contrato.')
      if (savedId) {
        closeTabAndGo(`/contratos/novo?vendaId=${String(savedId)}`)
      } else {
        closeTabAndGo('/vendas')
      }
    }
  } catch (e) {
    console.error(e)
    const apiMsg = e?.response?.data?.message
    const msg =
      Array.isArray(apiMsg)
        ? apiMsg.filter(Boolean).join(' | ')
        : (apiMsg && String(apiMsg).trim()) || (isEditMode.value ? 'Erro ao atualizar venda.' : 'Erro ao criar venda.')
    notify.error(msg)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (can('configuracoes.empresa.ver')) {
    await carregarConfiguracaoEmpresa()
  }
  const id = vendaId.value
  if (id) {
    if (!can('vendas.editar')) {
      notify.error('Acesso negado.')
      router.push('/vendas')
      return
    }
    await carregarVenda()
  } else {
    if (!canCriarVenda()) {
      notify.error('Acesso negado.')
      router.push('/vendas')
      return
    }
    await carregarOrcamento()
  }
  setTimeout(prefillRestanteNosZerados, 400)
})

watch(percentualDesconto, () => {
  aplicarRegraPagamentoPorDesconto()
})

watch(PARCELAS_OPTIONS, () => {
  normalizarParcelasPeloCatalogo()
})

watch(
  () => pagamentoAtual.value?.forma_pagamento_chave,
  (nova, antiga) => {
    if (nova === antiga) return
    limparPagamentoAoTrocarForma()
  },
)

watch(
  () => pagamentoAtual.value?.parcelas,
  () => {
    normalizarParcelasPeloCatalogo()
    prefillParcelasValores()
  },
)

watch(valorCobradoVenda, () => {
  prefillParcelasValores()
  prefillRestanteNosZerados()
})

watch(precoCobradoManual, () => {
  prefillRestanteNosZerados()
})

watch(
  pagamentos,
  (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) {
      pagamentos.value = [{ __id: getNextPagamentoRowId(), forma_pagamento_chave: '', valor: 0, parcelas: 1, data_recebimento: '', datas_parcelas: [{ data: '', valor: 0 }] }]
    }
  },
  { deep: true },
)
</script>





