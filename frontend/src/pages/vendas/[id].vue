<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="isEdit ? `Venda #${vendaId}` : 'Nova Venda'"
        subtitle="Pós-venda: venda líquida, rateio, taxas e comissões."
        icon="pi pi-shopping-cart"
      >
        <template v-if="isEdit && can('agendamentos.criar')" #actions>
          <Button variant="secondary" size="sm" type="button" @click="abrirModalEnviarProducao">
            <i class="pi pi-send mr-2"></i>
            Enviar para Produção
          </Button>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 border-t border-border-ui relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-8">
        <!-- ===================== -->
        <!-- DADOS GERAIS -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
            Dados Gerais
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="clienteFiltroId"
                mode="select"
                label="Cliente *"
                placeholder="Selecione o cliente..."
                :options="clientesOptions"
                required
                :readonly="isEdit"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="form.orcamento_id"
                mode="select"
                label="Orçamento *"
                placeholder="Selecione o orçamento..."
                :options="orcamentosOptions"
                :readonly="!clienteFiltroId || isEdit"
                required
              />
              <p
                v-if="isEdit"
                class="mt-1 text-[10px] font-black uppercase tracking-widest text-text-soft"
              >
                * Orçamento não altera após salvar a venda.
              </p>
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input :modelValue="'VENDA FECHADA'" label="Status" readonly />
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input v-model="form.data_venda" type="date" label="Data da venda" :forceUpper="false" />
            </div>
          </div>
        </section>

        <div class="h-px bg-border-ui" />

        <!-- ===================== -->
        <!-- ITENS -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Itens da Venda
            </div>

            <Button
              v-if="isEdit && can('vendas.editar')"
              variant="secondary"
              size="sm"
              type="button"
              @click="abrirModalNovoItem"
            >
              + Novo item
            </Button>
          </div>

          <div v-if="rowsItens.length > 0">
            <Table :columns="columnsItens" :rows="rowsItens" :boxed="true" emptyText="Nenhum item.">
              <template #cell-descricao="{ row }">
                <div class="whitespace-pre-line">{{ row.descricao || '-' }}</div>
              </template>

              <template #cell-observacao="{ row }">
                <div class="whitespace-pre-line font-bold">{{ row.observacao || '-' }}</div>
              </template>

              <template #cell-quantidade="{ row }">
                <Input
                  v-if="isEdit && can('vendas.editar')"
                  v-model.number="form.itens[row.__idx].quantidade"
                  type="number"
                  min="1"
                  :forceUpper="false"
                />
                <span v-else class="font-bold">{{ row.quantidade }}</span>
              </template>

              <template #cell-valor_unitario="{ row }">
                <span class="font-bold">{{ format.currency(row.valor_unitario) }}</span>
              </template>

              <template #cell-valor_total="{ row }">
                <span class="font-bold">{{ format.currency(totalItem(row)) }}</span>
              </template>

              <template #cell-acoes="{ row }">
                <div v-if="isEdit && can('vendas.editar')" class="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    @click="row.id ? iniciarEdicaoItem(row) : editarItemLocal(row)"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    @click="confirmarRemoverItemVenda(row)"
                  >
                    Remover
                  </Button>
                </div>

                <span v-else class="text-[10px] font-black uppercase tracking-widest text-text-soft">
                  —
                </span>
              </template>
            </Table>
          </div>

          <div v-else class="text-[10px] font-black uppercase tracking-widest text-text-soft italic">
            Selecione um orçamento para carregar os itens.
          </div>

          <div class="text-[10px] font-black uppercase tracking-widest text-text-soft">
            * Itens são clonados do orçamento ao salvar. Em edição, as alterações afetam apenas a venda.
          </div>
        </section>

        <div class="h-px bg-border-ui" />

        <!-- ===================== -->
        <!-- PAGAMENTOS / RATEIO -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Pagamentos (Rateio)
            </div>

            <Button
              v-if="can(permSalvarVenda())"
              variant="secondary"
              size="sm"
              type="button"
              @click="addPagamento"
            >
              + Adicionar pagamento
            </Button>
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-4 flex items-center gap-2">
              <Input
                :modelValue="format.currency(form.valor_vendido || 0)"
                type="text"
                inputmode="numeric"
                label="Valor total vendido (cobrado) *"
                :forceUpper="false"
                :readonly="!can(permSalvarVenda())"
                @update:modelValue="form.valor_vendido = moedaParaNumero($event)"
              />
              <i
                v-if="num(form.valor_vendido) > 0 && pagamentosBatendo"
                class="pi pi-check-circle text-green-600 text-2xl flex-shrink-0"
                title="Valor conferido com o rateio"
              />
            </div>
          </div>

          <Table :columns="columnsPagamentos" :rows="rowsPagamentos" :boxed="true" emptyText="Nenhum pagamento.">
            <template #cell-forma="{ row }">
              <SearchInput
                v-model="form.pagamentos[row.__idx].forma_pagamento_chave"
                mode="select"
                placeholder="Selecione..."
                :options="FORMAS_PAGAMENTO_OPTIONS"
                :readonly="!can(permSalvarVenda())"
              />
            </template>

            <template #cell-data_recebimento="{ row }">
              <template v-if="mostrarDataPorParcela(form.pagamentos[row.__idx])">
                <div class="space-y-1.5">
                  <div
                    v-for="(d, i) in (form.pagamentos[row.__idx].datas_parcelas || [])"
                    :key="i"
                    class="flex items-center gap-2"
                  >
                    <span class="text-[10px] font-bold text-text-soft w-5">{{ i + 1 }} —</span>
                    <Input
                      v-model="form.pagamentos[row.__idx].datas_parcelas[i]"
                      type="date"
                      :forceUpper="false"
                      :readonly="!can(permSalvarVenda())"
                      class="flex-1 min-w-0"
                    />
                  </div>
                </div>
              </template>
              <Input
                v-else
                v-model="form.pagamentos[row.__idx].data_recebimento"
                type="date"
                :forceUpper="false"
                :readonly="!can(permSalvarVenda())"
              />
            </template>

            <template #cell-parcelas="{ row }">
              <Input
                v-if="['CREDITO', 'PIX', 'CHEQUE', 'TRANSFERENCIA', 'DINHEIRO'].includes(form.pagamentos[row.__idx].forma_pagamento_chave)"
                v-model.number="form.pagamentos[row.__idx].parcelas"
                type="number"
                min="1"
                max="12"
                :forceUpper="false"
                :readonly="!can(permSalvarVenda())"
              />
              <span v-else class="text-text-soft">—</span>
            </template>

            <template #cell-valor="{ row }">
              <Input
                :modelValue="format.currency(form.pagamentos[row.__idx].valor || 0)"
                type="text"
                inputmode="numeric"
                :forceUpper="false"
                :readonly="!can(permSalvarVenda())"
                @update:modelValue="form.pagamentos[row.__idx].valor = moedaParaNumero($event)"
              />
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button
                  v-if="can(permSalvarVenda())"
                  variant="danger"
                  size="sm"
                  type="button"
                  :disabled="form.pagamentos.length === 1"
                  @click="confirmarRemoverPagamento(row.__idx)"
                >
                  Remover
                </Button>
                <span
                  v-else
                  class="text-[10px] font-black uppercase tracking-widest text-text-soft"
                >
                  —
                </span>
              </div>
            </template>
          </Table>

          <div class="flex items-center justify-end gap-6 pt-2">
            <div class="text-sm font-black uppercase tracking-tight">
              Total rateado:
              <span class="text-brand-primary">{{ format.currency(somaPagamentos) }}</span>
            </div>

            <div class="text-sm font-black uppercase tracking-tight">
              Diferença:
              <span :class="pagamentosBatendo ? 'text-emerald-600' : 'text-rose-600'">
                {{ format.currency(diferencaRateio) }}
              </span>
            </div>
          </div>
        </section>

        <div class="h-px bg-border-ui" />

        <!-- ===================== -->
        <!-- COMISSÕES -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Comissões
            </div>

            <Button
              v-if="can(permSalvarVenda())"
              variant="secondary"
              size="sm"
              type="button"
              @click="addComissao"
            >
              + Adicionar comissão
            </Button>
          </div>

          <Table :columns="columnsComissoes" :rows="rowsComissoes" :boxed="true" emptyText="Nenhuma comissão.">
            <template #cell-tipo="{ row }">
              <SearchInput
                v-model="form.comissoes[row.__idx].tipo_comissao_chave"
                mode="select"
                :options="COMISSOES_OPTIONS"
                :readonly="!can(permSalvarVenda())"
              />
            </template>

            <template #cell-responsavel="{ row }">
              <Input
                v-model="form.comissoes[row.__idx].responsavel_nome"
                placeholder="Nome do responsável"
                :forceUpper="false"
                :readonly="!can(permSalvarVenda())"
              />
            </template>

            <template #cell-percentual="{ row }">
              <Input :modelValue="pctComissao(row.tipo_comissao_chave)" type="number" readonly :forceUpper="false" />
            </template>

            <template #cell-valor="{ row }">
              <span class="font-black text-text-main">{{ format.currency(valorComissao(row)) }}</span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button
                  v-if="can(permSalvarVenda())"
                  variant="danger"
                  size="sm"
                  type="button"
                  @click="confirmarRemoverComissao(row.__idx)"
                >
                  Remover
                </Button>
                <span
                  v-else
                  class="text-[10px] font-black uppercase tracking-widest text-text-soft"
                >
                  —
                </span>
              </div>
            </template>
          </Table>

          <div class="text-[10px] font-black uppercase tracking-widest text-text-soft italic">
            * O percentual de comissão é fixo conforme configurações do sistema.
          </div>
        </section>

        <div class="h-px bg-border-ui" />

        <!-- ===================== -->
        <!-- RESUMO -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
            Taxas e Resumo Líquido
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_bruto)" label="Total vendido (base)" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_taxa_pagamento)" label="Taxa Cartão/Meio" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <CustomCheckbox
                v-model="form.tem_nota_fiscal"
                label="Emitir Nota Fiscal"
                :disabled="!can(permSalvarVenda())"
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input
                :modelValue="`${form.tem_nota_fiscal ? form.taxa_nota_fiscal_percentual_aplicado : 0}%`"
                label="Alíquota NF"
                readonly
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_taxa_nf)" label="Valor Imposto NF" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(total_taxas)" label="Total de Impostos/Taxas" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_comissoes)" label="Total Comissões" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <div class="rounded-2xl border border-border-ui bg-bg-page/60 p-3">
                <Input :modelValue="format.currency(lucro_bruto)" label="Resultado Líquido" readonly />
              </div>
            </div>
          </div>
        </section>

        <div class="h-px bg-border-ui" />

        <!-- ===================== -->
        <!-- ARQUIVOS (igual orçamentos) -->
        <!-- ===================== -->
        <section v-if="isEdit" class="space-y-6">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-black uppercase tracking-widest text-text-soft">
                Imagens para o PDF da venda
              </div>
              <div class="flex items-center gap-2">
                <input ref="fileInputImagemPdf" type="file" class="hidden" accept="image/*" @change="(e) => onPickArquivo(e, 'IMAGEM_PDF')" />
                <Button
                  v-if="can(permSalvarVenda()) && can('arquivos.criar')"
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
              Imagens vinculadas à venda. Podem ser usadas em documentos ou PDFs.
            </p>
            <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden max-h-[200px] overflow-y-auto">
              <Table
                :columns="colArquivos"
                :rows="imagensParaPdf"
                :loading="loadingImagensPdf"
                empty-text="Nenhuma imagem."
                :boxed="false"
              >
                <template #cell-nome="{ row }">
                  <div class="flex flex-col">
                    <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                    <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">{{ row.mime_type || 'IMAGEM' }}</span>
                  </div>
                </template>
                <template #cell-acoes="{ row }">
                  <div class="flex justify-end gap-2">
                    <Button v-if="can('arquivos.ver') || can('vendas.ver')" variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">Ver</Button>
                    <Button v-if="can('arquivos.excluir') && can(permSalvarVenda())" variant="danger" size="sm" type="button" @click="excluirArquivo(row.id, 'IMAGEM_PDF')">Excluir</Button>
                  </div>
                </template>
              </Table>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-black uppercase tracking-widest text-text-soft">
                Anexos e documentos
              </div>
              <div class="flex items-center gap-2">
                <input ref="fileInputAnexos" type="file" class="hidden" @change="(e) => onPickArquivo(e, 'ANEXO')" />
                <Button
                  v-if="can(permSalvarVenda()) && can('arquivos.criar')"
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
              PDFs e outros arquivos anexados à venda (comprovantes, contratos, etc.).
            </p>
            <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden max-h-[200px] overflow-y-auto">
              <Table
                :columns="colArquivos"
                :rows="anexosDocumentos"
                :loading="loadingAnexos"
                empty-text="Nenhum anexo ou documento."
                :boxed="false"
              >
                <template #cell-nome="{ row }">
                  <div class="flex flex-col">
                    <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                    <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">{{ row.mime_type || 'ARQUIVO' }}</span>
                  </div>
                </template>
                <template #cell-acoes="{ row }">
                  <div class="flex justify-end gap-2">
                    <Button v-if="can('arquivos.ver') || can('vendas.ver')" variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">Ver</Button>
                    <Button v-if="can('arquivos.excluir') && can(permSalvarVenda())" variant="danger" size="sm" type="button" @click="excluirArquivo(row.id, 'ANEXO')">Excluir</Button>
                  </div>
                </template>
              </Table>
            </div>
          </div>
        </section>
        <section v-else class="space-y-4">
          <div class="text-[10px] font-black uppercase tracking-widest text-text-soft">
            * Os arquivos ficam disponíveis após salvar a venda.
          </div>

          <div v-if="false" class="oculto-antigo">
            <div class="text-[10px]">
              Use “Abrir Arquivos” para anexar / visualizar dentro do PWA.
            </div>
          </div>

        </section>
      </div>
      </div>

      <!-- ===================== -->
      <!-- FOOTER AÇÕES -->
      <!-- ===================== -->
      <footer class="flex items-center justify-end gap-3 p-6 border-t border-border-ui bg-bg-page/50">
        <Button
          v-if="can(permSalvarVenda())"
          variant="primary"
          size="md"
          type="button"
          :loading="saving"
          :disabled="saving"
          @click="confirmarSalvarVenda"
        >
          Salvar Venda
        </Button>
      </footer>
    </div>
  </div>

  <!-- ===================== -->
  <!-- MODAL ITEM EXTRA -->
  <!-- ===================== -->
  <div
    v-if="modalItemOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    @click.self="fecharModalItem"
  >
    <div class="w-full max-w-[780px] overflow-hidden rounded-2xl border border-border-ui bg-bg-card shadow-xl">
      <div class="p-5 border-b border-border-ui bg-bg-page/50 flex items-center justify-between">
        <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
          {{ modalItemEditando ? 'Editar item' : 'Novo item (extra na venda)' }}
        </div>

        <Button variant="secondary" size="sm" type="button" @click="fecharModalItem">
          Fechar
        </Button>
      </div>

      <div class="p-6 space-y-5">
          <div class="grid grid-cols-12 gap-4 items-end">
            <Input
              class="col-span-12 md:col-span-6"
              v-model="itemDraft.nome_ambiente"
              label="Item/Ambiente *"
              placeholder="Ex: COZINHA / ARMÁRIO / FRETE"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-6"
              v-model="itemDraft.descricao"
              label="Acabamento"
              placeholder="Ex: MDF BRANCO / RIPADO / VIDRO"
              :forceUpper="false"
            />

            <Input
              class="col-span-12"
              v-model="itemDraft.observacao"
              label="Observações"
              placeholder="Texto livre"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model.number="itemDraft.quantidade"
              type="number"
              min="1"
              label="Quantidade"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model.number="itemDraft.valor_unitario"
              type="number"
              min="0"
              step="0.01"
              label="Valor unitário"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-4"
              :modelValue="format.currency(totalItem(itemDraft))"
              label="Total"
              readonly
            />
          </div>

          <div class="text-[10px] font-black uppercase tracking-widest text-text-soft">
            * Esse item é extra na venda (não altera o orçamento).
          </div>
        </div>

      <div class="p-5 border-t border-border-ui bg-bg-page/50 flex justify-end gap-3">
        <Button variant="secondary" type="button" @click="fecharModalItem">
          Cancelar
        </Button>
        <Button variant="primary" type="button" @click="salvarItemDoModal">
          Salvar item
        </Button>
      </div>
    </div>
  </div>

  <!-- Modal Enviar para Produção (Venda / Pós-venda) -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modalEnviarProducao.aberto"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="fecharModalEnviarProducao"
      >
        <div class="w-full max-w-md rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden flex flex-col">
          <div class="h-1 w-full bg-brand-primary" />
          <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui">
            <div class="flex items-center gap-3">
              <i class="pi pi-send text-2xl text-text-soft"></i>
              <div>
                <h3 class="text-lg font-semibold text-text-main">Enviar para Produção</h3>
                <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Cria agendamento na agenda para esta venda
                </p>
              </div>
            </div>
            <button type="button" class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500" @click="fecharModalEnviarProducao">
              <i class="pi pi-times text-sm"></i>
            </button>
          </header>
          <form class="p-6 space-y-4" @submit.prevent="confirmarEnviarProducao">
            <Input v-model="modalEnviarProducao.titulo" label="Título do agendamento *" placeholder="Ex: Produção Venda #..." required />
            <div class="grid grid-cols-2 gap-4">
              <Input v-model="modalEnviarProducao.inicio_em" label="Início *" type="datetime-local" required />
              <Input v-model="modalEnviarProducao.fim_em" label="Término *" type="datetime-local" required />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Equipe (mín. 1) *</label>
              <div class="flex flex-wrap gap-2">
                <SearchInput
                  v-model="modalEnviarProducao.funcionarioSelecionado"
                  mode="select"
                  class="flex-1 min-w-[200px]"
                  :options="funcionariosOptionsEnviarProducao"
                  placeholder="Selecione funcionário..."
                  @update:modelValue="adicionarEquipeEnviarProducao"
                />
                <div v-if="modalEnviarProducao.equipe_ids.length" class="flex flex-wrap gap-2 mt-2 w-full">
                  <span
                    v-for="id in modalEnviarProducao.equipe_ids"
                    :key="id"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-medium"
                  >
                    {{ funcionarioNomeByIdEnviarProducao(id) }}
                    <button type="button" class="hover:text-rose-500" @click="removerEquipeEnviarProducao(id)">&times;</button>
                  </span>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
              <Button type="button" variant="ghost" @click="fecharModalEnviarProducao">Cancelar</Button>
              <Button type="submit" variant="primary" :loading="modalEnviarProducao.salvando">
                <i class="pi pi-send mr-2"></i>
                Enviar para Produção
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

</template>


<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { AgendaService, ClienteService, FuncionarioService, OrcamentosService, VendaService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { format } from '@/utils/format'
import { moedaParaNumero } from '@/utils/number'
import { FORMAS_PAGAMENTO, COMISSOES, TAXAS_CARTAO, TAXA_NOTA_FISCAL, PIPELINE_CLIENTE } from '@/constantes'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'vendas.ver' } })

// =======================
// ROUTE
// =======================
const route = useRoute()
const router = useRouter()

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

const vendaId = computed(() => {
  const n = Number(String(route.params.id || '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})
const isEdit = computed(() => !!vendaId.value)

// ✅ perm salvar (criar/editar)
const permSalvarVenda = () => (isEdit.value ? 'vendas.editar' : 'vendas.criar')

// =======================
// UI STATE
// =======================
const loading = ref(false)
const saving = ref(false)

const clientesOptions = ref([])
const orcamentosOptions = ref([])
const clienteFiltroId = ref('')
const funcionariosOptionsEnviarProducao = ref([])

const modalEnviarProducao = ref({
  aberto: false,
  titulo: '',
  inicio_em: '',
  fim_em: '',
  funcionarioSelecionado: null,
  equipe_ids: [],
  salvando: false,
})

// =======================
// CONSTANTS / OPTIONS
// =======================
const FORMAS_PAGAMENTO_OPTIONS = (FORMAS_PAGAMENTO || []).map((x) => ({ label: x.label, value: x.key }))
const COMISSOES_OPTIONS = Object.entries(COMISSOES || {}).map(([key, v]) => ({ label: v.label, value: key }))

// =======================
// HELPERS
// =======================
function num(v) {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}
function totalItem(row) {
  const q = Number(row?.quantidade || 0)
  const u = Number(row?.valor_unitario || 0)
  return round2(q * u)
}
function pctComissao(tipo) {
  return Number(COMISSOES?.[String(tipo || '')]?.percentual || 0)
}
function taxaPctPorForma(forma, parcelas) {
  const f = String(forma || '')
  if (f === 'DEBITO') return Number(TAXAS_CARTAO?.DEBITO?.taxa || 0)
  if (f === 'CREDITO') {
    const p = Math.min(12, Math.max(1, Number(parcelas || 1)))
    return Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[p] || 0)
  }
  return 0
}
function pipelineKey(key) {
  const k = PIPELINE_CLIENTE.find((p) => p.key === key)?.key
  if (!k) throw new Error(`PIPELINE_CLIENTE key não encontrada: ${key}`)
  return k
}

// =======================
// ENVIAR PARA PRODUÇÃO (Venda / Pós-venda)
// =======================
function funcionarioNomeByIdEnviarProducao(id) {
  const o = funcionariosOptionsEnviarProducao.value.find((f) => String(f.value) === String(id))
  return o?.label || String(id)
}
function adicionarEquipeEnviarProducao(id) {
  if (!id) return
  if (!modalEnviarProducao.value.equipe_ids.includes(id)) modalEnviarProducao.value.equipe_ids.push(id)
  modalEnviarProducao.value.funcionarioSelecionado = null
}
function removerEquipeEnviarProducao(id) {
  modalEnviarProducao.value.equipe_ids = modalEnviarProducao.value.equipe_ids.filter((f) => String(f) !== String(id))
}
function fecharModalEnviarProducao() {
  modalEnviarProducao.value.aberto = false
  modalEnviarProducao.value.titulo = ''
  modalEnviarProducao.value.inicio_em = ''
  modalEnviarProducao.value.fim_em = ''
  modalEnviarProducao.value.funcionarioSelecionado = null
  modalEnviarProducao.value.equipe_ids = []
}
async function abrirModalEnviarProducao() {
  const cid = Number(clienteFiltroId.value)
  if (!cid) return notify.error('Selecione o cliente da venda.')
  if (!vendaId.value) return notify.error('Venda não carregada.')
  try {
    const res = await FuncionarioService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    funcionariosOptionsEnviarProducao.value = lista
      .map((item) => ({ label: item?.label || item?.nome || '', value: item?.value ?? item?.id ?? null }))
      .filter((opt) => opt.value != null)
  } catch (e) {
    funcionariosOptionsEnviarProducao.value = []
  }
  const now = new Date()
  const fim = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  modalEnviarProducao.value.titulo = `Produção Venda #${vendaId.value}`
  modalEnviarProducao.value.inicio_em = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  modalEnviarProducao.value.fim_em = `${fim.getFullYear()}-${pad(fim.getMonth() + 1)}-${pad(fim.getDate())}T${pad(fim.getHours())}:${pad(fim.getMinutes())}`
  modalEnviarProducao.value.equipe_ids = []
  modalEnviarProducao.value.aberto = true
}
async function confirmarEnviarProducao() {
  if (!modalEnviarProducao.value.equipe_ids.length) return notify.error('Selecione pelo menos um funcionário na equipe.')
  const inicio = new Date(modalEnviarProducao.value.inicio_em)
  const fim = new Date(modalEnviarProducao.value.fim_em)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return notify.error('Data de início e término inválidas.')
  if (fim <= inicio) return notify.error('Término deve ser depois do início.')
  const cid = Number(clienteFiltroId.value)
  if (!cid) return notify.error('Cliente não informado.')
  modalEnviarProducao.value.salvando = true
  try {
    await AgendaService.criar({
      titulo: modalEnviarProducao.value.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: cid,
      venda_id: vendaId.value,
      equipe_ids: modalEnviarProducao.value.equipe_ids.map((id) => Number(id)),
      categoria: 'PRODUCAO',
    })
    notify.success('Venda enviada para produção!')
    fecharModalEnviarProducao()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao enviar para produção.')
  } finally {
    modalEnviarProducao.value.salvando = false
  }
}

// =======================
// FORM
// =======================
const form = reactive({
  orcamento_id: '',
  status: pipelineKey('VENDA_FECHADA'),
  data_venda: new Date().toISOString().slice(0, 10),

  valor_vendido: 0,

  itens: [],

  pagamentos: [
    {
      forma_pagamento_chave: '',
      valor: 0,
      parcelas: 1,
      data_prevista_recebimento: '',
      data_recebimento: '',
      datas_parcelas: [], // uma data por parcela (PIX/Dinheiro/Cheque/Transferência)
      status_financeiro_chave: 'EM_ABERTO',
    },
  ],

  comissoes: [],

  taxa_pagamento_percentual_aplicado: 0,
  tem_nota_fiscal: false,
  taxa_nota_fiscal_percentual_aplicado: Number(TAXA_NOTA_FISCAL?.taxa || 0),
})

// =======================
// ROWS (somente p/ render)
// =======================
const rowsItens = computed(() => (form.itens || []).map((it, idx) => ({ ...it, __idx: idx })))
const rowsPagamentos = computed(() => (form.pagamentos || []).map((p, idx) => ({ ...p, __idx: idx })))
const rowsComissoes = computed(() => (form.comissoes || []).map((c, idx) => ({ ...c, __idx: idx })))

// =======================
// MODAL ITEM EXTRA (LOCAL)
// =======================
const modalItemOpen = ref(false)
const modalItemEditando = ref(false)
const itemEditIdx = ref(null)

const itemDraft = reactive({
  nome_ambiente: '',
  descricao: '',
  observacao: '',
  quantidade: 1,
  valor_unitario: 0,
})

function resetItemDraft() {
  itemDraft.nome_ambiente = ''
  itemDraft.descricao = ''
  itemDraft.observacao = ''
  itemDraft.quantidade = 1
  itemDraft.valor_unitario = 0
  itemEditIdx.value = null
  modalItemEditando.value = false
}

function abrirModalNovoItem() {
  if (!isEdit.value || !can('vendas.editar')) return notify.error('Acesso negado.')
  resetItemDraft()
  modalItemOpen.value = true
}

function fecharModalItem() {
  modalItemOpen.value = false
}

function editarItemLocal(row) {
  if (!isEdit.value || !can('vendas.editar')) return notify.error('Acesso negado.')
  if (!row) return
  const base = form.itens?.[row.__idx]
  if (!base) return

  modalItemEditando.value = true
  itemEditIdx.value = row.__idx

  itemDraft.nome_ambiente = base.nome_ambiente || ''
  itemDraft.descricao = base.descricao || ''
  itemDraft.observacao = base.observacao || ''
  itemDraft.quantidade = Number(base.quantidade || 1)
  itemDraft.valor_unitario = Number(base.valor_unitario || 0)

  modalItemOpen.value = true
}

function salvarItemDoModal() {
  if (!isEdit.value || !can('vendas.editar')) return notify.error('Acesso negado.')

  if (!String(itemDraft.nome_ambiente || '').trim()) {
    notify.warn('Preencha Item/Ambiente')
    return
  }

  const payload = {
    nome_ambiente: String(itemDraft.nome_ambiente || '').trim(),
    descricao: String(itemDraft.descricao || ''),
    observacao: String(itemDraft.observacao || ''),
    quantidade: Math.max(1, Number(itemDraft.quantidade || 1)),
    valor_unitario: round2(num(itemDraft.valor_unitario || 0)),
  }

  if (modalItemEditando.value && itemEditIdx.value !== null) {
    Object.assign(form.itens[itemEditIdx.value], payload)
    fecharModalItem()
    return
  }

  form.itens.push(payload)
  fecharModalItem()
}

function removerItem(row) {
  if (!isEdit.value || !can('vendas.editar')) return notify.error('Acesso negado.')
  if (row?.id) {
    notify.warn('Remoção de item do orçamento não disponível (sem endpoint).')
    return
  }
  const idx = row?.__idx
  if (idx === undefined || idx === null) return
  form.itens.splice(idx, 1)
}

// =======================
// CONFIRMS
// =======================
async function confirmarSalvarVenda() {
  const perm = permSalvarVenda()
  if (!can(perm)) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    isEdit.value ? 'Salvar Venda' : 'Criar Venda',
    isEdit.value
      ? `Deseja salvar as alterações da Venda #${vendaId.value}?`
      : 'Deseja criar esta venda agora?',
  )
  if (!ok) return
  await salvar()
}


async function confirmarRemoverItemVenda(row) {
  if (!isEdit.value || !can('vendas.editar')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Remover Item',
    `Deseja remover "${row?.nome_ambiente || 'ITEM'}" desta venda?`,
  )
  if (!ok) return
  removerItem(row)
}

async function confirmarRemoverPagamento(idx) {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')

  const ok = await confirm.show('Remover Pagamento', 'Deseja remover este pagamento do rateio?')
  if (!ok) return
  removerPagamento(idx)
}

async function confirmarRemoverComissao(idx) {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')

  const ok = await confirm.show('Remover Comissão', 'Deseja remover esta comissão?')
  if (!ok) return
  removerComissao(idx)
}

// =======================
// TABLE DEFINITIONS
// =======================
const columnsItens = [
  { key: 'nome_ambiente', label: 'Item/Ambiente' },
  { key: 'descricao', label: 'Acabamento' },
  { key: 'observacao', label: 'Observações' },
  { key: 'quantidade', label: 'Qtd', align: 'right', width: '110px' },
  { key: 'valor_unitario', label: 'Valor', align: 'right', width: '160px' },
  { key: 'valor_total', label: 'Total', align: 'right', width: '160px' },
  { key: 'acoes', label: '', align: 'right', width: '140px' },
]

const columnsPagamentos = [
  { key: 'forma', label: 'Forma', width: '220px' },
  { key: 'parcelas', label: 'Parcelas', width: '120px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'data_recebimento', label: 'Recebido', width: '150px' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]

const columnsComissoes = [
  { key: 'tipo', label: 'Tipo', width: '220px' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'percentual', label: '%', width: '120px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]

// =======================
// PAGAMENTOS / RATEIO
// =======================
const FORMAS_COM_DATA_POR_PARCELA = ['PIX', 'DINHEIRO', 'CHEQUE', 'TRANSFERENCIA']

function addPagamento() {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')
  form.pagamentos.push({
    forma_pagamento_chave: '',
    valor: 0,
    parcelas: 1,
    data_prevista_recebimento: '',
    data_recebimento: '',
    datas_parcelas: [],
    status_financeiro_chave: 'EM_ABERTO',
  })
}

function ensureDatasParcelas(p) {
  if (!FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return
  const n = Math.max(1, Math.min(12, Number(p.parcelas || 1)))
  if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
  while (p.datas_parcelas.length < n) p.datas_parcelas.push('')
  if (p.datas_parcelas.length > n) p.datas_parcelas = p.datas_parcelas.slice(0, n)
}

function mostrarDataPorParcela(p) {
  if (!p || !FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return false
  const n = Math.max(1, Math.min(12, Number(p.parcelas || 1)))
  if (n <= 1) return false
  ensureDatasParcelas(p)
  return true
}

function removerPagamento(idx) {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')
  if (form.pagamentos.length === 1) return
  form.pagamentos.splice(idx, 1)
}

const somaPagamentos = computed(() =>
  round2((form.pagamentos || []).reduce((acc, p) => acc + num(p?.valor || 0), 0)),
)
const diferencaRateio = computed(() => round2(somaPagamentos.value - num(form.valor_vendido || 0)))
const pagamentosBatendo = computed(() => diferencaRateio.value === 0)

// =======================
// COMISSÕES
// =======================
function addComissao() {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')
  form.comissoes.push({ tipo_comissao_chave: 'VENDEDOR', responsavel_nome: '' })
}
function removerComissao(idx) {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')
  form.comissoes.splice(idx, 1)
}

// =======================
// ARQUIVOS (igual orçamentos)
// =======================
async function carregarImagensParaPdf() {
  const id = vendaId.value
  if (!id) {
    imagensParaPdf.value = []
    return
  }
  loadingImagensPdf.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'VENDA',
      ownerId: Number(id),
      categoria: 'IMAGEM_PDF',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    imagensParaPdf.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingImagensPdf.value = false
  }
}

async function carregarAnexosDocumentos() {
  const id = vendaId.value
  if (!id) {
    anexosDocumentos.value = []
    return
  }
  loadingAnexos.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'VENDA',
      ownerId: Number(id),
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
  const vid = String(vendaId.value || '').replace(/\D/g, '')
  const backTo = encodeURIComponent(`/vendas/${vid}`)
  const name = encodeURIComponent(row?.nome || row?.filename || 'ARQUIVO')
  const type = encodeURIComponent(row?.mime_type || '')
  router.push(`/arquivos/${row.id}?name=${name}&type=${type}&backTo=${backTo}`)
}

async function excluirArquivo(arquivoId, _categoria) {
  if (!can('arquivos.excluir') || !can(permSalvarVenda())) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir arquivo?', 'Esta ação não pode ser desfeita.')
  if (!ok) return
  try {
    await ArquivosService.remover(Number(arquivoId))
    notify.success('Arquivo removido.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao excluir arquivo.')
  }
}

function clicarAdicionarArquivo(categoria) {
  if (!can(permSalvarVenda()) || !can('arquivos.criar')) return notify.error('Acesso negado.')
  if (!vendaId.value) return notify.error('Salve a venda antes de anexar arquivos.')
  const input = categoria === 'IMAGEM_PDF' ? fileInputImagemPdf.value : fileInputAnexos.value
  if (!input) return notify.error('Input de arquivo não montado.')
  input.click()
}

async function onPickArquivo(e, categoria) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!can('arquivos.criar') || !can(permSalvarVenda())) return notify.error('Acesso negado.')
  if (!vendaId.value) return notify.error('Salve a venda antes de anexar arquivos.')
  try {
    await ArquivosService.upload({
      ownerType: 'VENDA',
      ownerId: Number(vendaId.value),
      categoria: categoria || 'ANEXO',
      file,
    })
    notify.success(categoria === 'IMAGEM_PDF' ? 'Imagem adicionada.' : 'Arquivo anexado.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar arquivo.')
  }
}

const valor_bruto = computed(() => round2(num(form.valor_vendido || 0)))

const valorComissao = (row) => {
  const pct = pctComissao(row?.tipo_comissao_chave)
  return round2(valor_bruto.value * (pct / 100))
}
const valor_comissoes = computed(() =>
  round2((form.comissoes || []).reduce((acc, c) => acc + valorComissao(c), 0)),
)

// =======================
// TAXAS
// =======================
const valor_taxa_pagamento = computed(() =>
  round2(
    (form.pagamentos || []).reduce((acc, p) => {
      const v = num(p?.valor || 0)
      const pct = taxaPctPorForma(p?.forma_pagamento_chave, p?.parcelas)
      return acc + round2(v * (pct / 100))
    }, 0),
  ),
)

const taxa_pagamento_percentual_calc = computed(() => {
  const base = num(form.valor_vendido || 0)
  if (base <= 0) return 0
  return round2((valor_taxa_pagamento.value / base) * 100)
})

watch(
  [() => form.pagamentos, () => form.valor_vendido],
  () => {
    form.taxa_pagamento_percentual_aplicado = taxa_pagamento_percentual_calc.value
  },
  { deep: true },
)

watch(() => form.tem_nota_fiscal, (v) => {
  form.taxa_nota_fiscal_percentual_aplicado = v ? Number(TAXA_NOTA_FISCAL?.taxa || 0) : 0
})

const valor_taxa_nf = computed(() => {
  if (!form.tem_nota_fiscal) return 0
  return round2(valor_bruto.value * (num(form.taxa_nota_fiscal_percentual_aplicado || 0) / 100))
})

const total_taxas = computed(() => round2(valor_taxa_pagamento.value + valor_taxa_nf.value))
const lucro_bruto = computed(() => round2(valor_bruto.value - total_taxas.value - valor_comissoes.value))

// =======================
// LOADERS
// =======================
async function carregarClientesOptions() {
  const { data } = await ClienteService.listar()
  const rows = Array.isArray(data) ? data : (data?.rows || data?.data || [])
  clientesOptions.value = rows.map((c) => ({
    label: c.nome_completo || c.razao_social || c.nome_fantasia || c.nome || `CLIENTE #${c.id}`,
    value: c.id,
  }))
}

async function carregarOrcamentosOptions(clienteId) {
  const { data } = await OrcamentosService.listar()
  const rows = Array.isArray(data) ? data : (data?.rows || data?.data || [])
  orcamentosOptions.value = rows
    .filter((o) => Number(o?.cliente_id) === Number(clienteId))
    .map((o) => ({ label: `Orçamento #${o.id}`, value: o.id }))
}

async function carregarOrcamentoNaVenda(orcamentoId) {
  loading.value = true
  try {
    const { data } = await OrcamentosService.detalhar(orcamentoId)

    form.itens = (data?.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: '',
      quantidade: 1,
      valor_unitario: Number(it.valor_unitario || 0),
    }))

    const soma = round2((form.itens || []).reduce((acc, it) => acc + totalItem(it), 0))
    form.valor_vendido = round2(soma)

    if (form.pagamentos.length === 1 && num(form.pagamentos[0].valor) === 0 && form.valor_vendido > 0) {
      form.pagamentos[0].valor = round2(form.valor_vendido)
    }
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamento')
  } finally {
    loading.value = false
  }
}

async function carregarVenda() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await VendaService.buscar(vendaId.value)

    clienteFiltroId.value = data?.cliente_id ? String(data.cliente_id) : ''
    await carregarOrcamentosOptions(clienteFiltroId.value)

    form.orcamento_id = data?.orcamento_id ?? ''
    form.data_venda = data?.data_venda ? String(data.data_venda).slice(0, 10) : form.data_venda
    form.valor_vendido = round2(num(data?.valor_vendido || 0))

    form.taxa_pagamento_percentual_aplicado = round2(num(data?.taxa_pagamento_percentual_aplicado || 0))
    form.taxa_nota_fiscal_percentual_aplicado = round2(num(data?.taxa_nota_fiscal_percentual_aplicado || 0))
    form.tem_nota_fiscal = num(form.taxa_nota_fiscal_percentual_aplicado) > 0

    form.itens = (data?.itens || []).map((it) => ({
      id: it.id,
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: it.observacao || '',
      quantidade: Number(it.quantidade || 1),
      valor_unitario: Number(it.valor_unitario || 0),
    }))

    const rawPagamentos = (data?.pagamentos || []).map((p) => ({
      forma_pagamento_chave: p.forma_pagamento_chave || '',
      valor: round2(num(p.valor || 0)),
      data_recebimento: p.data_recebimento ? String(p.data_recebimento).slice(0, 10) : '',
    }))
    const grupos = []
    for (let i = 0; i < rawPagamentos.length; i++) {
      const p = rawPagamentos[i]
      const forma = p.forma_pagamento_chave
      const valorUnit = p.valor
      const datas = [p.data_recebimento].filter(Boolean)
      let j = i + 1
      while (j < rawPagamentos.length && rawPagamentos[j].forma_pagamento_chave === forma && round2(num(rawPagamentos[j].valor)) === valorUnit) {
        if (rawPagamentos[j].data_recebimento) datas.push(rawPagamentos[j].data_recebimento)
        j++
      }
      const n = j - i
      grupos.push({
        forma_pagamento_chave: forma,
        valor: round2(valorUnit * n),
        parcelas: n,
        data_prevista_recebimento: '',
        data_recebimento: n === 1 ? (rawPagamentos[i].data_recebimento || '') : '',
        datas_parcelas: FORMAS_COM_DATA_POR_PARCELA.includes(forma) && n > 1 ? (rawPagamentos.slice(i, j).map((x) => x.data_recebimento || '')) : [],
        status_financeiro_chave: data?.pagamentos?.[i]?.status_financeiro_chave || 'EM_ABERTO',
      })
      i = j - 1
    }
    form.pagamentos = grupos.length ? grupos : [{
      forma_pagamento_chave: '',
      valor: round2(form.valor_vendido),
      parcelas: 1,
      data_prevista_recebimento: '',
      data_recebimento: '',
      datas_parcelas: [],
      status_financeiro_chave: 'EM_ABERTO',
    }]

    form.comissoes = (data?.comissoes || []).map((c) => ({
      id: c.id,
      tipo_comissao_chave: c.tipo_comissao_chave || 'VENDEDOR',
      responsavel_nome: c.responsavel_nome || '',
    }))

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar venda')
  } finally {
    loading.value = false
  }
}

// =======================
// ITENS (EDIT): endpoint PUT item
// =======================
async function iniciarEdicaoItem(row) {
  if (!isEdit.value || !row?.id) return
  if (!can('vendas.editar')) return notify.error('Acesso negado.')

  try {
    await VendaService.atualizarItem(vendaId.value, row.id, {
      nome_ambiente: row.nome_ambiente,
      descricao: row.descricao,
      observacao: row.observacao || '',
      quantidade: Number(row.quantidade || 1),
      valor_unitario: round2(num(row.valor_unitario || 0)),
    })
    await carregarVenda()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao salvar item')
  }
}

// =======================
// PAYLOAD
// =======================
function montarPayload() {
  return {
    orcamento_id: Number(form.orcamento_id),
    status: pipelineKey('VENDA_FECHADA'),
    data_venda: form.data_venda ? String(form.data_venda) : undefined,
    valor_vendido: round2(num(form.valor_vendido || 0)),

    taxa_pagamento_percentual_aplicado: round2(num(form.taxa_pagamento_percentual_aplicado || 0)),
    tem_nota_fiscal: Boolean(form.tem_nota_fiscal),
    taxa_nota_fiscal_percentual_aplicado: round2(num(form.taxa_nota_fiscal_percentual_aplicado || 0)),

    pagamentos: (function () {
      const list = []
      for (const p of form.pagamentos || []) {
        const forma = String(p.forma_pagamento_chave || '')
        const valorTotal = round2(num(p.valor || 0))
        const n = Math.max(1, Math.min(12, Number(p.parcelas || 1)))
        const comDataPorParcela = FORMAS_COM_DATA_POR_PARCELA.includes(forma) && n > 1 && Array.isArray(p.datas_parcelas) && p.datas_parcelas.length >= n
        if (comDataPorParcela) {
          const valorParcela = round2(valorTotal / n)
          for (let i = 0; i < n; i++) {
            list.push({
              forma_pagamento_chave: forma,
              valor: valorParcela,
              data_prevista_recebimento: null,
              data_recebimento: (p.datas_parcelas[i] && String(p.datas_parcelas[i]).trim()) ? String(p.datas_parcelas[i]).slice(0, 10) : null,
              status_financeiro_chave: p.status_financeiro_chave || 'EM_ABERTO',
            })
          }
        } else {
          list.push({
            forma_pagamento_chave: forma,
            valor: valorTotal,
            data_prevista_recebimento: p.data_prevista_recebimento || null,
            data_recebimento: (p.data_recebimento && String(p.data_recebimento).trim()) ? String(p.data_recebimento).slice(0, 10) : null,
            status_financeiro_chave: p.status_financeiro_chave || 'EM_ABERTO',
          })
        }
      }
      return list
    })(),

    comissoes: (form.comissoes || []).map((c) => ({
      tipo_comissao_chave: String(c.tipo_comissao_chave || ''),
      percentual_aplicado: round2(pctComissao(c.tipo_comissao_chave)),
      responsavel_nome: c.responsavel_nome || null,
    })),
  }
}

// =======================
// ACTIONS
// =======================
async function salvar() {
  const perm = permSalvarVenda()
  if (!can(perm)) return notify.error('Acesso negado.')
  if (saving.value) return

  saving.value = true
  try {
    const payload = montarPayload()

    if (isEdit.value) {
      await VendaService.salvar(vendaId.value, payload)
      notify.success('Salvo!')
      router.push('/vendas')
      return
    }

    await VendaService.salvar(null, payload)
    notify.success('Criado!')
    router.push('/vendas')
  } catch (e) {
    console.error(e)
    notify.error('Erro ao salvar venda')
  } finally {
    saving.value = false
  }
}

// =======================
// WATCHERS
// =======================
watch(
  () => clienteFiltroId.value,
  async (val) => {
    if (isEdit.value) return
    form.orcamento_id = ''
    orcamentosOptions.value = []
    form.itens = []
    if (!val) return

    try {
      await carregarOrcamentosOptions(val)
    } catch (e) {
      console.error(e)
      notify.error('Erro ao carregar orçamentos')
    }
  },
)

watch(
  () => form.orcamento_id,
  async (val) => {
    if (!val) return
    if (isEdit.value) return
    await carregarOrcamentoNaVenda(val)
  },
)

watch(
  () => form.valor_vendido,
  (v) => {
    if (form.pagamentos.length === 1 && num(form.pagamentos[0].valor) === 0 && num(v) > 0) {
      form.pagamentos[0].valor = round2(num(v))
    }
  },
)

// =======================
// INIT
// =======================
onMounted(async () => {
  // ✅ bloqueio base: ver
  if (!can('vendas.ver')) {
    notify.error('Acesso negado.')
    router.push('/vendas')
    return
  }

  // ✅ se for edição, precisa poder editar
  if (isEdit.value && !can('vendas.editar')) {
    notify.error('Acesso negado.')
    router.push('/vendas')
    return
  }

  // ✅ se for novo, precisa poder criar
  if (!isEdit.value && !can('vendas.criar')) {
    notify.error('Acesso negado.')
    router.push('/vendas')
    return
  }

  loading.value = true
  try {
    await carregarClientesOptions()
    if (isEdit.value) await carregarVenda()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao inicializar')
  } finally {
    loading.value = false
  }
})
</script>


