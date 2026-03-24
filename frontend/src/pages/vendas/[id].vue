<template>
  <PageShell :padded="false">
    <section class="venda-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Venda #${vendaId}` : 'Nova Venda'"
        :subtitle="isContextoVenda ? 'Editar venda (loja). Itens, parcelas e comissões.' : 'Pós-venda: venda líquida, rateio, taxas e comissões.'"
        icon="pi pi-shopping-cart"
      />

      <div class="venda-editor__body ds-page-context__content p-6 md:p-8 relative">
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

            <div class="col-span-12 md:col-span-3">
              <Input
                v-model="form.cep_entrega"
                label="CEP da entrega"
                placeholder="00000-000"
                :forceUpper="false"
                @input="form.cep_entrega = maskCEP(form.cep_entrega)"
                @blur="buscarEnderecoEntregaPorCep"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="form.endereco_entrega"
                label="Nome da rua"
                placeholder="Rua/Avenida"
                :forceUpper="false"
              />
            </div>

            <div class="col-span-12 md:col-span-1">
              <Input
                v-model="form.numero_entrega"
                label="Nº"
                placeholder="123"
                :forceUpper="false"
              />
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input
                v-model="form.complemento_entrega"
                label="Complemento"
                placeholder="Apto, bloco..."
                :forceUpper="false"
              />
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input
                v-model="form.bairro_entrega"
                label="Bairro"
                placeholder="Bairro"
                :forceUpper="false"
              />
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input
                v-model="form.cidade_entrega"
                label="Cidade"
                placeholder="Cidade"
                :forceUpper="false"
              />
            </div>

            <div class="col-span-12 md:col-span-1">
              <Input
                v-model="form.estado_entrega"
                label="Estado"
                placeholder="UF"
                :forceUpper="true"
              />
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
            <div class="col-span-12 md:col-span-4 flex items-center gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="form.receber_no_ato_medicao"
                  type="checkbox"
                  class="rounded border-border-ui text-brand-primary focus:ring-brand-primary"
                  :disabled="!can(permSalvarVenda())"
                />
                <span class="text-sm font-semibold text-text-main">💎 Receber no ato da medição</span>
              </label>
              <span class="text-[10px] text-text-soft">Exibe alerta no Painel de Obras</span>
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

            <template #cell-data_prevista="{ row }">
              <div class="space-y-1.5">
                <div
                  v-for="(parc, i) in (form.pagamentos[row.__idx].datas_parcelas || [])"
                  :key="i"
                  class="flex flex-nowrap items-stretch gap-2"
                >
                  <span class="w-5 shrink-0 flex items-end pb-2.5 text-[10px] font-bold text-text-soft text-right">{{ i + 1 }} —</span>
                  <div class="flex min-h-10 min-w-0 flex-1 shrink-0 flex-col justify-end">
                    <Input
                      v-model="form.pagamentos[row.__idx].datas_parcelas[i].data"
                      type="date"
                      :forceUpper="false"
                      :readonly="!can(permSalvarVenda())"
                      class="w-full [&_input]:h-10"
                    />
                  </div>
                </div>
              </div>
            </template>

            <template #cell-valor_parcela="{ row }">
              <div class="space-y-1.5">
                <div
                  v-for="(parc, i) in (form.pagamentos[row.__idx].datas_parcelas || [])"
                  :key="i"
                  class="flex min-h-10 flex-col justify-end"
                >
                  <Input
                    :modelValue="format.currency(form.pagamentos[row.__idx].datas_parcelas[i].valor || 0)"
                    type="text"
                    inputmode="numeric"
                    :forceUpper="false"
                    :readonly="!can(permSalvarVenda())"
                    class="w-full text-right [&_input]:h-10"
                    @update:modelValue="(val) => { form.pagamentos[row.__idx].datas_parcelas[i].valor = moedaParaNumero(val); recomputarTotalPagamentoForm(row.__idx) }"
                  />
                </div>
              </div>
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
              <span :class="pagamentosBatendo ? 'text-[var(--ds-color-success-600)]' : 'text-[var(--ds-color-danger-600)]'">
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
              <Input :modelValue="format.currency(valor_bruto)" label="Valor vendido" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_taxa_pagamento)" label="Taxa do meio" readonly />
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
                :modelValue="`${form.tem_nota_fiscal ? form.taxa_nota_fiscal_percentual_aplicado : 0}`"
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
              <div class="ds-card ds-card--default p-3">
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
            <div class="ds-card ds-card--default overflow-hidden max-h-[200px] overflow-y-auto">
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
                    <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">{{ row.mime_type || 'IMAGEM' }}</span>
                  </div>
                </template>
                <template #cell-acoes="{ row }">
                  <div class="flex justify-end gap-2">
                    <Button v-if="can('arquivos.ver') || can('posvenda.ver')" variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">Ver</Button>
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
            <div class="ds-card ds-card--default overflow-hidden max-h-[200px] overflow-y-auto">
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
                    <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">{{ row.mime_type || 'ARQUIVO' }}</span>
                  </div>
                </template>
                <template #cell-acoes="{ row }">
                  <div class="flex justify-end gap-2">
                    <Button v-if="can('arquivos.ver') || can('posvenda.ver')" variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">Ver</Button>
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

      <!-- ===================== -->
      <!-- FOOTER AÇÕES -->
      <!-- ===================== -->
      <footer class="venda-editor__footer flex items-center justify-end gap-3 p-6 border-t border-border-ui bg-[var(--ds-color-surface-muted)]/70">
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
    </section>
  </PageShell>

  <!-- ===================== -->
  <!-- MODAL ITEM EXTRA -->
  <!-- ===================== -->
  <div
    v-if="modalItemOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    @click.self="fecharModalItem"
  >
    <div class="w-full max-w-[780px] overflow-hidden ds-card ds-card--default shadow-xl">
      <div class="p-5 border-b border-border-ui bg-[var(--ds-color-surface-muted)]/70 flex items-center justify-between">
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
              label="Ambiente *"
              placeholder="Ex: COZINHA / ARMÁRIO / FRETE"
              :forceUpper="true"
            />

            <Input
              class="col-span-12 md:col-span-6"
              v-model="itemDraft.descricao"
              label="Acabamento"
              placeholder="* Armario superior com 4 portas de giro&#10;* Armario inferior 4 gavetas e 2 portas de giro&#10;* Nicho para microondas"
              :forceUpper="true"
            />

            <Input
              class="col-span-12"
              v-model="itemDraft.observacao"
              label="Observações"
              placeholder="Texto livre"
              :forceUpper="true"
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

      <div class="p-5 border-t border-border-ui bg-[var(--ds-color-surface-muted)]/70 flex justify-end gap-3">
        <Button variant="secondary" type="button" @click="fecharModalItem">
          Cancelar
        </Button>
        <Button variant="primary" type="button" @click="salvarItemDoModal">
          Salvar item
        </Button>
      </div>
    </div>
  </div>

</template>


<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { ClienteService, OrcamentosService, VendaService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { format } from '@/utils/format'
import { moedaParaNumero } from '@/utils/number'
import { FORMAS_PAGAMENTO, COMISSOES, TAXAS_CARTAO, TAXA_NOTA_FISCAL, PIPELINE_CLIENTE } from '@/constantes'
import { can } from '@/services/permissions'
import { closeTabAndGo } from '@/utils/tabs'
import { onlyNumbers, maskCEP } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'
import PageShell from '@/components/ui/PageShell.vue'

definePage({ meta: { perm: 'posvenda.ver' } })

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
// true = tela de VENDA (editar itens, parcelas). false = pós-venda (rateio, produção).
// Padrão é tela de venda, para que "Editar venda" no detalhe sempre abra a edição.
const isContextoVenda = computed(() => route.query.contexto !== 'posvenda')

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

function preencherEnderecoEntregaComCliente(cliente) {
  form.endereco_entrega = String(cliente?.endereco || '').trim()
  form.numero_entrega = String(cliente?.numero || '').trim()
  form.complemento_entrega = String(cliente?.complemento || '').trim()
  form.bairro_entrega = String(cliente?.bairro || '').trim()
  form.cidade_entrega = String(cliente?.cidade || '').trim()
  form.estado_entrega = String(cliente?.estado || '').trim()
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
  const cepLimpo = onlyNumbers(form.cep_entrega).slice(0, 8)
  if (cepLimpo.length !== 8) return
  const data = await buscarCep(cepLimpo)
  if (!data) {
    notify.warn('CEP de entrega não encontrado.')
    return
  }
  form.cep_entrega = data.cep ? maskCEP(data.cep) : form.cep_entrega
  form.endereco_entrega = String(data.logradouro || form.endereco_entrega || '').trim()
  form.bairro_entrega = String(data.bairro || form.bairro_entrega || '').trim()
  form.cidade_entrega = String(data.localidade || form.cidade_entrega || '').trim()
  form.estado_entrega = String(data.uf || form.estado_entrega || '').trim()
}

// (Contrato é aberto a partir do fluxo de venda/fechamento, não daqui)

// =======================
// FORM
// =======================
const form = reactive({
  orcamento_id: '',
  status: pipelineKey('VENDA_FECHADA'),
  data_venda: new Date().toISOString().slice(0, 10),
  cep_entrega: '',
  endereco_entrega: '',
  numero_entrega: '',
  complemento_entrega: '',
  bairro_entrega: '',
  cidade_entrega: '',
  estado_entrega: '',

  valor_vendido: 0,
  receber_no_ato_medicao: false,

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

  representante_venda_nome: '',
  representante_venda_cpf: '',
  representante_venda_rg: '',

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
    notify.warn('Preencha Ambiente')
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
  { key: 'nome_ambiente', label: 'Ambiente' },
  { key: 'descricao', label: 'Acabamento' },
  { key: 'observacao', label: 'Observações' },
  { key: 'quantidade', label: 'Qtd', align: 'right', width: '110px' },
  { key: 'valor_unitario', label: 'Valor', align: 'right', width: '160px' },
  { key: 'valor_total', label: 'Total', align: 'right', width: '160px' },
  { key: 'acoes', label: 'Ações', align: 'right', width: '140px' },
]

const columnsPagamentos = [
  { key: 'forma', label: 'FORMA DE PAGAMENTO', width: '220px' },
  { key: 'parcelas', label: 'PARCELAS', width: '120px', align: 'right' },
  { key: 'data_prevista', label: 'DATA PREVISTA', width: '160px' },
  { key: 'valor_parcela', label: 'VALOR', width: '140px', align: 'right' },
  { key: 'acoes', label: 'AÇÕES', width: '140px', align: 'right' },
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
    datas_parcelas: [{ data: '', valor: 0 }],
    status_financeiro_chave: 'EM_ABERTO',
  })
}

function ensureDatasParcelas(p) {
  if (!FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return
  const n = Math.max(1, Math.min(12, Number(p.parcelas || 1)))
  if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
  while (p.datas_parcelas.length < n) {
    p.datas_parcelas.push({ data: '', valor: 0 })
  }
  if (p.datas_parcelas.length > n) p.datas_parcelas = p.datas_parcelas.slice(0, n)
}

function recomputarTotalPagamentoForm(idx) {
  const p = form.pagamentos[idx]
  if (!p || !Array.isArray(p.datas_parcelas)) return
  p.valor = p.datas_parcelas.reduce(
    (acc, parc) => acc + num(parc?.valor || 0),
    0,
  )
}

function normalizeDatasParcelasForm(p) {
  ensureDatasParcelas(p)
  return Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
}

function removerPagamento(idx) {
  if (!can(permSalvarVenda())) return notify.error('Acesso negado.')
  if (form.pagamentos.length === 1) return
  form.pagamentos.splice(idx, 1)
}

const somaPagamentos = computed(() =>
  round2(
    (form.pagamentos || []).reduce((acc, p) => {
      if (Array.isArray(p.datas_parcelas) && p.datas_parcelas.length) {
        const sub = p.datas_parcelas.reduce(
          (s, parc) => s + num(parc?.valor || 0),
          0,
        )
        return acc + sub
      }
      return acc + num(p?.valor || 0)
    }, 0),
  ),
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
  const backTo = encodeURIComponent(isContextoVenda.value ? `/vendas/venda/${vid}` : `/vendas/${vid}`)
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
  input?.click?.()
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
      const baseValor = Array.isArray(p.datas_parcelas) && p.datas_parcelas.length
        ? p.datas_parcelas.reduce((s, parc) => s + num(parc?.valor || 0), 0)
        : num(p?.valor || 0)
      const pct = taxaPctPorForma(p?.forma_pagamento_chave, p?.parcelas)
      return acc + round2(baseValor * (pct / 100))
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
    form.cep_entrega = data?.cliente?.cep ? maskCEP(data.cliente.cep) : ''
    preencherEnderecoEntregaComCliente(data?.cliente)

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
    form.cep_entrega = data?.cliente?.cep ? maskCEP(data.cliente.cep) : ''
    const enderecoEntregaSalvo = String(data?.endereco_entrega || '').trim()
    if (enderecoEntregaSalvo) {
      form.endereco_entrega = enderecoEntregaSalvo
      form.numero_entrega = ''
      form.complemento_entrega = ''
      form.bairro_entrega = ''
      form.cidade_entrega = ''
      form.estado_entrega = ''
    } else {
      preencherEnderecoEntregaComCliente(data?.cliente)
    }
    form.valor_vendido = round2(num(data?.valor_vendido || 0))
    form.receber_no_ato_medicao = Boolean(data?.receber_no_ato_medicao)
    form.representante_venda_nome = data?.representante_venda_nome ?? ''
    form.representante_venda_cpf = data?.representante_venda_cpf ?? ''
    form.representante_venda_rg = data?.representante_venda_rg ?? ''

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
      data_prevista_recebimento: p.data_prevista_recebimento
        ? String(p.data_prevista_recebimento).slice(0, 10)
        : (p.data_recebimento ? String(p.data_recebimento).slice(0, 10) : ''),
    }))
    const grupos = []
    for (let i = 0; i < rawPagamentos.length; i++) {
      const p = rawPagamentos[i]
      const forma = p.forma_pagamento_chave
      const valorUnit = p.valor
      let j = i + 1
      while (j < rawPagamentos.length && rawPagamentos[j].forma_pagamento_chave === forma && round2(num(rawPagamentos[j].valor)) === valorUnit) {
        j++
      }
      const n = j - i
      grupos.push({
        forma_pagamento_chave: forma,
        valor: round2(valorUnit * n),
        parcelas: n,
        data_prevista_recebimento: n === 1 ? (rawPagamentos[i].data_prevista_recebimento || '') : '',
        data_recebimento: '',
        datas_parcelas:
          FORMAS_COM_DATA_POR_PARCELA.includes(forma) && n > 1
            ? rawPagamentos.slice(i, j).map((x) => ({
                data: x.data_prevista_recebimento || '',
                valor: round2(num(x.valor || 0)),
              }))
            : [{ data: rawPagamentos[i].data_prevista_recebimento || '', valor: round2(num(valorUnit || 0)) }],
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
    endereco_entrega:
      montarEnderecoEntregaCompleto(
        form.endereco_entrega,
        form.numero_entrega,
        form.complemento_entrega,
        form.bairro_entrega,
        form.cidade_entrega,
        form.estado_entrega,
      ) || undefined,
    valor_vendido: round2(num(form.valor_vendido || 0)),
    receber_no_ato_medicao: Boolean(form.receber_no_ato_medicao),

    representante_venda_nome: undefined,
    representante_venda_cpf: undefined,
    representante_venda_rg: undefined,

    taxa_pagamento_percentual_aplicado: round2(num(form.taxa_pagamento_percentual_aplicado || 0)),
    tem_nota_fiscal: Boolean(form.tem_nota_fiscal),
    taxa_nota_fiscal_percentual_aplicado: round2(num(form.taxa_nota_fiscal_percentual_aplicado || 0)),

    pagamentos: (function () {
      const list = []
      for (const p of form.pagamentos || []) {
        const forma = String(p.forma_pagamento_chave || '')
        const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
        if (parcelas.length) {
          for (const parc of parcelas) {
            list.push({
              forma_pagamento_chave: forma,
              valor: round2(num(parc?.valor || 0)),
              data_prevista_recebimento:
                parc?.data && String(parc.data).trim()
                  ? String(parc.data).slice(0, 10)
                  : null,
              data_recebimento: null,
              status_financeiro_chave: p.status_financeiro_chave || 'EM_ABERTO',
            })
          }
        } else {
          const valorTotal = round2(num(p.valor || 0))
          list.push({
            forma_pagamento_chave: forma,
            valor: valorTotal,
            data_prevista_recebimento:
              (p.data_prevista_recebimento && String(p.data_prevista_recebimento).trim())
                ? String(p.data_prevista_recebimento).slice(0, 10)
                : ((p.data_recebimento && String(p.data_recebimento).trim())
                    ? String(p.data_recebimento).slice(0, 10)
                    : null),
            data_recebimento: null,
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
      closeTabAndGo(isContextoVenda.value ? `/vendas/venda/${vendaId.value}` : '/vendas')
      return
    }

    await VendaService.salvar(null, payload)
    notify.success('Criado!')
    closeTabAndGo(isContextoVenda.value ? '/vendas/fechamento' : '/vendas')
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
    form.cep_entrega = ''
    form.endereco_entrega = ''
    form.numero_entrega = ''
    form.complemento_entrega = ''
    form.bairro_entrega = ''
    form.cidade_entrega = ''
    form.estado_entrega = ''
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
  const redirecionarSemPerm = (path) => {
    router.push(path)
  }
  const baseRedirect = isContextoVenda.value ? '/vendas/fechamento' : '/vendas'

  // ✅ bloqueio base: pós-venda (produção) – comercial não acessa esta tela
  if (!can('posvenda.ver')) {
    notify.error('Acesso negado.')
    redirecionarSemPerm(baseRedirect)
    return
  }

  // ✅ se for edição, precisa poder editar
  if (isEdit.value && !can('vendas.editar')) {
    notify.error('Acesso negado.')
    redirecionarSemPerm(baseRedirect)
    return
  }

  // ✅ se for novo, precisa poder criar
  if (!isEdit.value && !can('vendas.criar')) {
    notify.error('Acesso negado.')
    redirecionarSemPerm(baseRedirect)
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
