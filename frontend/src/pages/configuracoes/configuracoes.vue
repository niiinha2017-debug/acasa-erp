<template>
  <PageShell :padded="false">
    <section class="login-font configuracoes-empresa ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Cadastro da Empresa"
        subtitle="Registro da empresa, dados fiscais e de recebimento"
        icon="pi pi-building"
      >
      <template #actions>
        <div class="configuracoes-empresa__header-actions ds-page-context__actions">
          <p v-if="ultimoSalvamento" class="text-[10px] text-slate-500 self-center sm:self-auto sm:mr-2 order-last sm:order-none">
            Último salvamento: {{ ultimoSalvamento }}
          </p>
          <div class="flex items-center gap-2">
            <Button
              v-if="can('configuracoes.empresa.ver')"
              variant="ghost"
              class="flex-1 sm:flex-none !rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200"
              @click="confirmarExportarDadosEmpresa"
            >
              <i class="pi pi-external-link mr-2"></i> Exportar
            </Button>
            <Button
              v-if="can('configuracoes.empresa.editar')"
              class="flex-1 sm:flex-none !rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-primary hover:bg-brand-primary/90"
              :loading="salvando"
              @click="confirmarSalvarDadosEmpresa"
            >
              <i class="pi pi-check-circle mr-2"></i> Salvar Alterações
            </Button>
          </div>
        </div>
      </template>
      </PageHeader>

      <div class="configuracoes-empresa__body ds-editor-body clientes-line-form">
        <div class="configuracoes-empresa__tabs" role="tablist" aria-label="Etapas do cadastro da empresa">
          <button
            v-for="etapa in ETAPAS_CONFIG"
            :key="etapa.key"
            type="button"
            class="configuracoes-empresa__tab"
            :class="etapaAtual === etapa.key ? 'configuracoes-empresa__tab--active' : ''"
            @click="irParaEtapa(etapa.key)"
          >
            <span class="configuracoes-empresa__tab-index">{{ etapa.numero }}</span>
            <span class="configuracoes-empresa__tab-copy">
              <span class="configuracoes-empresa__tab-label">{{ etapa.label }}</span>
              <span class="configuracoes-empresa__tab-description">{{ etapa.descricao }}</span>
            </span>
          </button>
        </div>

        <div class="configuracoes-empresa__step-summary">
          <p class="configuracoes-empresa__step-eyebrow">Etapa {{ etapaAtualMeta.numero }}</p>
          <h2 class="configuracoes-empresa__step-title">{{ etapaAtualMeta.label }}</h2>
          <p class="configuracoes-empresa__step-description">{{ etapaAtualMeta.descricao }}</p>
        </div>

        <div class="configuracoes-empresa__layout grid grid-cols-12">
        
        <div class="configuracoes-empresa__sidebar col-span-12 lg:col-span-4 p-6 lg:p-8 space-y-8">
          
          <section v-show="etapaAtiva('cadastro')" class="pb-6">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center lg:text-left">
              Identidade
            </h3>

            <div class="space-y-6">
              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logo da Marca</p>
                <div
                  class="configuracoes-empresa__upload-surface relative aspect-square w-48 mx-auto lg:ml-0 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
                  @click="fileInput?.click()"
                >
                  <img
                    v-if="logoPreview"
                    :src="logoPreview"
                    class="object-contain w-full h-full p-6 transition-transform group-hover:scale-105"
                    alt="Logo"
                  />
                  <div v-else class="flex flex-col items-center text-slate-300">
                    <i class="pi pi-images text-3xl mb-2"></i>
                    <span class="text-[9px] font-black uppercase text-center px-4">Clique para fazer upload</span>
                  </div>
                  <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleLogoUpload" />
                </div>
                <div class="mt-2 flex justify-center lg:justify-start">
                  <Button
                    v-if="logoPreview"
                    variant="ghost"
                    size="sm"
                    class="!h-9 !rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 hover:bg-white hover:text-rose-500"
                    type="button"
                    :loading="removendoLogo"
                    @click="confirmarRemoverLogo"
                  >
                    <i class="pi pi-trash mr-2"></i> Remover logo
                  </Button>
                </div>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logo para Fundo Escuro</p>
                <div
                  class="configuracoes-empresa__upload-surface configuracoes-empresa__upload-surface--dark relative aspect-square w-40 mx-auto lg:ml-0 rounded-xl border-2 border-dashed border-slate-200 bg-slate-800 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
                  @click="fileInputFundoEscuro?.click()"
                >
                  <img
                    v-if="logoFundoEscuroPreview"
                    :src="logoFundoEscuroPreview"
                    class="object-contain w-full h-full p-4 transition-transform group-hover:scale-105"
                    alt="Logo fundo escuro"
                  />
                  <div v-else class="flex flex-col items-center text-slate-500">
                    <i class="pi pi-moon text-2xl mb-1"></i>
                    <span class="text-[9px] font-black uppercase text-center px-2">Clique para upload</span>
                  </div>
                  <input type="file" ref="fileInputFundoEscuro" class="hidden" accept="image/*" @change="handleLogoFundoEscuroUpload" />
                </div>
                <div class="mt-2 flex justify-center lg:justify-start">
                  <Button
                    v-if="logoFundoEscuroPreview"
                    variant="ghost"
                    size="sm"
                    class="!h-8 !rounded-xl text-[9px] font-black uppercase border border-slate-200 text-slate-600 hover:text-rose-500"
                    type="button"
                    :loading="removendoLogoFundoEscuro"
                    @click="confirmarRemoverLogoFundoEscuro"
                  >
                    <i class="pi pi-trash mr-1"></i> Remover
                  </Button>
                </div>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cor da Marca</p>
                <div class="flex items-center gap-3">
                  <input
                    v-model="form.cor_marca"
                    type="color"
                    class="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer bg-white p-0.5"
                  />
                  <input
                    v-model="form.cor_marca"
                    type="text"
                    class="flex-1 h-10 rounded-xl border border-slate-200 px-3 text-sm font-mono uppercase bg-bg-card text-text-main"
                    placeholder="#2563eb"
                    maxlength="7"
                  />
                </div>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logotipo Secundário / Ícone</p>
                <div
                  class="configuracoes-empresa__upload-surface relative aspect-square w-32 mx-auto lg:ml-0 rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
                  @click="fileInputLogoSecundario?.click()"
                >
                  <img
                    v-if="logoSecundarioPreview"
                    :src="logoSecundarioPreview"
                    class="object-contain w-full h-full p-3 transition-transform group-hover:scale-105"
                    alt="Logo secundário"
                  />
                  <div v-else class="flex flex-col items-center text-slate-300">
                    <i class="pi pi-image text-2xl mb-1"></i>
                    <span class="text-[8px] font-black uppercase text-center px-2">Ícone</span>
                  </div>
                  <input type="file" ref="fileInputLogoSecundario" class="hidden" accept="image/*" @change="handleLogoSecundarioUpload" />
                </div>
                <div class="mt-2 flex justify-center lg:justify-start">
                  <Button
                    v-if="logoSecundarioPreview"
                    variant="ghost"
                    size="sm"
                    class="!h-8 !rounded-xl text-[9px] font-black uppercase border border-slate-200 text-slate-600 hover:text-rose-500"
                    type="button"
                    :loading="removendoLogoSecundario"
                    @click="confirmarRemoverLogoSecundario"
                  >
                    <i class="pi pi-trash mr-1"></i> Remover
                  </Button>
                </div>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Imagem da Assinatura Digital</p>
                <div
                  class="configuracoes-empresa__upload-surface relative aspect-[3/1] w-full max-w-48 mx-auto lg:ml-0 rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
                  @click="fileInputAssinatura?.click()"
                >
                  <img
                    v-if="assinaturaPreview"
                    :src="assinaturaPreview"
                    class="object-contain w-full h-full p-2 transition-transform group-hover:scale-105"
                    alt="Assinatura digital"
                  />
                  <div v-else class="flex flex-col items-center text-slate-300">
                    <i class="pi pi-pencil text-2xl mb-1"></i>
                    <span class="text-[9px] font-black uppercase text-center px-2">Clique para upload</span>
                  </div>
                  <input type="file" ref="fileInputAssinatura" class="hidden" accept="image/*" @change="handleAssinaturaUpload" />
                </div>
                <div class="mt-2 flex justify-center lg:justify-start">
                  <Button
                    v-if="assinaturaPreview"
                    variant="ghost"
                    size="sm"
                    class="!h-8 !rounded-xl text-[9px] font-black uppercase border border-slate-200 text-slate-600 hover:text-rose-500"
                    type="button"
                    :loading="removendoAssinatura"
                    @click="confirmarRemoverAssinatura"
                  >
                    <i class="pi pi-trash mr-1"></i> Remover
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section v-show="etapaAtiva('operacao')">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Arquivos e Documentos
            </h3>

            <div class="space-y-2 mb-4">
              <div
                v-for="doc in documentos"
                :key="doc.id"
                class="configuracoes-empresa__document-row flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <i class="pi pi-file text-slate-400"></i>
                  <span class="text-[10px] font-bold text-slate-600 truncate uppercase">
                    {{ doc.nome || doc.filename }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="abrirArquivo(doc)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    <i class="pi pi-eye text-xs"></i>
                  </button>

                  <button
                    type="button"
                    @click="confirmarRemoverDocumento(doc)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
              </div>

              <div v-if="!documentos.length" class="configuracoes-empresa__empty-dropzone text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nenhum documento anexado</p>
              </div>
            </div>

            <Button
              variant="ghost"
              class="configuracoes-empresa__attach-trigger w-full !h-11 !rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-500 hover:bg-slate-50"
              type="button"
              :loading="anexandoDoc"
              @click="triggerDocumentUpload"
            >
              <i class="pi pi-paperclip mr-2"></i> Anexar Documento
            </Button>

            <input
              type="file"
              ref="documentInput"
              class="hidden"
              @change="handleDocumentUpload"
            />
          </section>
        </div>

        <div class="configuracoes-empresa__main col-span-12 lg:col-span-8 p-6 lg:p-10 space-y-8">
          
          <section v-show="etapaAtiva('cadastro')" class="pb-6">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Informações Fiscais</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input v-model="form.razao_social" label="Razão Social" class="md:col-span-2" />
              <Input v-model="form.nome_fantasia" label="Nome Fantasia" />
              <Input v-model="cnpjMask" label="CNPJ" placeholder="00.000.000/0000-00" @blur="onCnpjBlur" />
              <Input v-model="ieMask" label="Inscrição Estadual" />
              <Input v-model="imMask" label="Inscrição Municipal" placeholder="Conforme prefeitura" />
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-0.5">Regime Tributário</label>
                <select
                  v-model="form.regime_tributario"
                  class="w-full h-10 border rounded-xl text-sm bg-bg-card text-text-main border-border-ui hover:border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all px-3"
                >
                  <option value="">Selecione</option>
                  <option v-for="opt in REGIME_TRIBUTARIO_OPCOES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>
          </section>

          <section v-show="etapaAtiva('operacao')" class="pb-6">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Contato</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input v-model="form.email" label="E-mail de Contato" type="email" icon="pi pi-envelope" class="md:col-span-2" />
              <Input v-model="telefoneMask" label="WhatsApp (número)" icon="pi pi-whatsapp" placeholder="(00) 00000-0000" />
              <Input v-model="form.whatsapp_url" label="Link do WhatsApp" placeholder="https://wa.me/5511999999999" />

              <div class="md:col-span-2 configuracoes-empresa__inline-group space-y-4">
                <div class="flex items-center gap-2">
                  <i class="pi pi-key text-slate-500"></i>
                  <h4 class="text-[11px] font-black text-slate-700 uppercase tracking-wider">WhatsApp – Base de autenticação (Evolution API)</h4>
                </div>
                <p class="text-[11px] text-slate-500 -mt-1">Envio de mensagens (ex.: orçamento) usa Evolution API. Preencha URL, API Key e nome da instância.</p>
                <div class="grid grid-cols-1 gap-4">
                  <Input
                    v-model="form.evolution_api_url"
                    label="Evolution API – URL"
                    placeholder="Ex: http://localhost:8080 ou https://acasamarcenaria.com.br/evolution-api"
                    class="md:col-span-2"
                  />
                  <Input
                    v-model="form.evolution_api_key"
                    type="password"
                    label="Evolution API – Chave (API Key)"
                    placeholder="Chave de autenticação da Evolution API"
                    class="md:col-span-2"
                  />
                  <Input
                    v-model="form.evolution_instance_name"
                    label="Evolution API – Nome da instância"
                    placeholder="Ex: acasa-erp"
                    :force-upper="false"
                    @blur="normalizarNomeInstanciaEvolution"
                  />
                  <div class="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      :loading="testandoWhatsApp"
                      @click="testarTokenWhatsApp"
                    >
                      <i class="pi pi-whatsapp mr-2"></i>
                      Testar Evolution API
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      :loading="loadingQrWhatsApp"
                      @click="mostrarQrWhatsApp"
                    >
                      <i class="pi pi-qrcode mr-2"></i>
                      Conectar meu WhatsApp (QR)
                    </Button>
                  </div>
                </div>
              </div>
              <!-- Modal QR Code / Pairing para conectar WhatsApp -->
              <div
                v-if="showQrWhatsAppModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px] p-4"
                @click.self="showQrWhatsAppModal = false"
              >
                <div class="configuracoes-empresa__qr-modal max-w-sm w-full p-5">
                  <div class="flex justify-between items-center mb-3 gap-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">WhatsApp</p>
                      <h4 class="text-sm font-bold text-slate-800">Conectar dispositivo</h4>
                    </div>
                    <button type="button" class="text-slate-400 hover:text-slate-600 transition-colors" @click="showQrWhatsAppModal = false" aria-label="Fechar">
                      <i class="pi pi-times text-lg"></i>
                    </button>
                  </div>
                  <p class="text-xs text-slate-600 mb-4 leading-relaxed">Escaneie o QR Code no WhatsApp em Aparelhos conectados ou use o código de vinculação. Se não aparecer, informe seu número abaixo e tente novamente.</p>
                  <div class="mb-4">
                    <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Número com DDI (opcional)</label>
                    <input
                      v-model="qrWhatsAppNumber"
                      type="text"
                      placeholder="5511999999999"
                      class="w-full text-sm border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-slate-700 outline-none transition-colors focus:border-brand-primary"
                    />
                  </div>
                  <div v-if="qrWhatsAppData?.code" class="flex justify-center mb-3">
                    <img :src="'data:image/png;base64,' + qrWhatsAppData.code" alt="QR Code WhatsApp" class="w-48 h-48 object-contain border border-slate-200/80 rounded-xl bg-white p-2" />
                  </div>
                  <div v-else-if="qrWhatsAppData?.pairingCode" class="configuracoes-empresa__qr-state mb-3 text-center">
                    <p class="text-xs text-slate-600 mb-1">Código de vinculação:</p>
                    <p class="text-lg font-mono font-bold">{{ qrWhatsAppData.pairingCode }}</p>
                    <p class="text-[11px] text-slate-500 mt-1">WhatsApp → Ajustes → Aparelhos conectados → Conectar um aparelho → Código de vinculação</p>
                  </div>
                  <div v-else-if="qrWhatsAppData && !qrWhatsAppData.code && !qrWhatsAppData.pairingCode" class="text-sm text-amber-600 py-2">
                    Aguardando QR na Evolution API. Preencha seu número com DDI acima e clique em &quot;Buscar QR de novo&quot;.
                  </div>
                  <div class="flex gap-2 mt-4">
                    <Button type="button" variant="outline" size="sm" :loading="loadingQrWhatsApp" @click="mostrarQrWhatsApp(true)">Buscar QR de novo</Button>
                    <Button type="button" variant="outline" size="sm" @click="showQrWhatsAppModal = false">Fechar</Button>
                  </div>
                </div>
              </div>
              <Input v-model="form.instagram_url" label="Link do Instagram" placeholder="https://instagram.com/..." />
              <Input v-model="form.site" label="Site da Empresa" placeholder="https://..." class="md:col-span-2" />
            </div>
          </section>

          <section v-show="etapaAtiva('cadastro')" class="py-2">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Endereço Principal</h3>
            </div>

            <p class="text-[11px] text-slate-500 mb-3">
              Preencha o CEP e perca o foco (Tab ou clique fora) para preencher Rua, Bairro e Cidade automaticamente.
            </p>
            <div class="grid grid-cols-12 gap-5">
              <Input v-model="cepMask" label="CEP" placeholder="00000-000" class="col-span-4" @blur="onCepBlur" />
              <Input v-model="form.logradouro" label="Rua/Logradouro" placeholder="Nome da rua" class="col-span-8" />
              <Input v-model="form.numero" label="Nº" placeholder="Número" class="col-span-3" />
              <Input v-model="form.bairro" label="Bairro" placeholder="Nome do bairro" class="col-span-5" />
              <Input v-model="form.cidade" label="Cidade" placeholder="Nome da cidade" class="col-span-4" />
              <Input v-model="form.uf" label="UF" placeholder="UF" class="col-span-2" maxlength="2" />
            </div>
          </section>

          <section v-show="etapaAtiva('operacao')" class="pb-6">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Controle de Estoque / Desperdício</h3>
            </div>
            <p class="text-[11px] text-slate-500 mb-3">
              Percentual de perda padrão usado no cálculo de desperdício na DRE do projeto: (Material Comprado) − (Material Usado) − (Sobras/Retalhos) = Perda Real.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                v-model="form.perda_padrao_percentual"
                type="number"
                label="Perda padrão (%)"
                placeholder="Ex: 5"
                step="0.5"
                min="0"
                max="100"
              />
            </div>
          </section>

          <section v-show="etapaAtiva('operacao')" class="pb-6">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Base de cálculo – Custos de Estrutura / Timeline</h3>
            </div>
            <p class="text-[11px] text-slate-500 mb-3">
              Horas úteis da fábrica no mês. Usado na Taxa de Máquina (Financeiro → Custos de Estrutura) e na base de cálculo da timeline. Se os funcionários trabalham 220 h/mês, informe 220; senão use o padrão 176 (22 dias × 8 h).
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                v-model.number="form.horas_uteis_mes_fabrica"
                type="number"
                label="Horas úteis mês (fábrica)"
                placeholder="Ex: 220 ou 176"
                step="1"
                min="1"
                max="400"
              />
            </div>
          </section>

          <section v-show="etapaAtiva('financeiro')" class="pt-2">
            <div class="configuracoes-empresa__inline-group">
              <p class="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">Assinatura do Responsável</p>
              <p class="text-[11px] text-slate-500 mb-3">
                Imagem usada como variável em PDFs (contratos, orçamentos). Recomendado: assinatura escaneada ou desenhada em fundo transparente.
              </p>
              <div
                class="configuracoes-empresa__upload-surface relative aspect-[3/1] w-full max-w-56 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
                @click="fileInputAssinaturaResponsavel?.click()"
              >
                <img
                  v-if="assinaturaResponsavelPreview"
                  :src="assinaturaResponsavelPreview"
                  class="object-contain w-full h-full p-2"
                  alt="Assinatura do responsável"
                />
                <div v-else class="flex flex-col items-center text-slate-400">
                  <i class="pi pi-user-edit text-2xl mb-1"></i>
                  <span class="text-[9px] font-black uppercase">Clique para upload</span>
                </div>
                <input type="file" ref="fileInputAssinaturaResponsavel" class="hidden" accept="image/*" @change="handleAssinaturaResponsavelUpload" />
              </div>
              <div class="mt-2">
                <Button
                  v-if="assinaturaResponsavelPreview"
                  variant="ghost"
                  size="sm"
                  class="!h-8 !rounded-xl text-[9px] font-black uppercase border border-slate-200 text-slate-600 hover:text-rose-500"
                  type="button"
                  :loading="removendoAssinaturaResponsavel"
                  @click="confirmarRemoverAssinaturaResponsavel"
                >
                  <i class="pi pi-trash mr-1"></i> Remover
                </Button>
              </div>
            </div>
          </section>

          <section v-show="etapaAtiva('financeiro')" class="pt-2">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest text-emerald-600">
                Dados Bancários e Pix
              </h3>
            </div>

            <div
              v-if="avisoDadosBancariosVazios"
              class="mb-4 ds-alert ds-alert--warning p-4 flex items-start gap-3"
            >
              <i class="pi pi-exclamation-triangle text-xl mt-0.5"></i>
              <div>
                <p class="text-sm font-bold">Dados bancários incompletos</p>
                <p class="text-xs mt-1">
                  Ao salvar, alguns campos de Dados Bancários e Pix estão vazios. Recomendamos preencher Titular, Banco, Agência, Conta e Chave Pix para orçamentos e documentos.
                </p>
              </div>
            </div>

            <div class="configuracoes-empresa__inline-group grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <Input
                  v-model="form.pix"
                  label="Chave Pix (Aparece nos orçamentos)"
                  placeholder="E-mail, CNPJ ou Celular"
                >
                  <template #suffix>
                    <button
                      type="button"
                      @click="copiarPix"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-primary transition-colors"
                      aria-label="Copiar chave Pix"
                    >
                      <i class="pi pi-copy text-sm"></i>
                    </button>
                  </template>
                </Input>
              </div>

              <Input v-model="form.banco_nome" label="Banco" />
              <Input v-model="form.banco_titular" label="Titular da Conta" />
              <Input v-model="form.banco_agencia" label="Agência" />
              <Input v-model="form.banco_conta" label="Conta Corrente" />
            </div>
          </section>
        </div>
      </div>

        <div class="configuracoes-empresa__step-actions ds-editor-actions flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            :disabled="isPrimeiraEtapa"
            @click="voltarEtapa"
          >
            <i class="pi pi-arrow-left mr-2"></i>
            Etapa anterior
          </Button>

          <div class="flex flex-wrap items-center justify-end gap-3">
            <Button
              v-if="!isUltimaEtapa"
              type="button"
              variant="outline"
              @click="avancarEtapa"
            >
              Próxima etapa
              <i class="pi pi-arrow-right ml-2"></i>
            </Button>
            <Button
              v-else-if="can('configuracoes.empresa.editar')"
              type="button"
              variant="primary"
              :loading="salvando"
              @click="confirmarSalvarDadosEmpresa"
            >
              <i class="pi pi-check-circle mr-2"></i>
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ConfiguracaoService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCNPJ, maskCEP, maskTelefone, maskIE, onlyNumbers } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { can } from '@/services/permissions'

import { useRouter } from 'vue-router'
const router = useRouter()

definePage({ meta: { perm: 'configuracoes.empresa.ver' } })



const fileInput = ref(null)
const documentInput = ref(null)

const ETAPAS_CONFIG = [
  {
    key: 'cadastro',
    numero: '01',
    label: 'Identidade e cadastro',
    descricao: 'Marca, dados fiscais e endereço principal da empresa.',
  },
  {
    key: 'operacao',
    numero: '02',
    label: 'Contato e operação',
    descricao: 'Canais, WhatsApp, documentos e parâmetros operacionais.',
  },
  {
    key: 'financeiro',
    numero: '03',
    label: 'Financeiro e jurídico',
    descricao: 'Assinatura responsável e dados bancários.',
  },
]

const etapaAtual = ref('cadastro')

const salvando = ref(false)
const testandoWhatsApp = ref(false)
const loadingQrWhatsApp = ref(false)
const showQrWhatsAppModal = ref(false)
const qrWhatsAppData = ref(null)
const qrWhatsAppNumber = ref('')
const removendoLogo = ref(false)
const anexandoDoc = ref(false)

// ✅ dados “não persistem” no form: vêm da tabela global de arquivos
const logoPreview = ref('')
const logoFundoEscuroPreview = ref('')
const assinaturaPreview = ref('')
const documentos = ref([])
const removendoLogoFundoEscuro = ref(false)
const removendoAssinatura = ref(false)
const removendoLogoSecundario = ref(false)
const removendoAssinaturaResponsavel = ref(false)
const fileInputFundoEscuro = ref(null)
const fileInputAssinatura = ref(null)
const fileInputLogoSecundario = ref(null)
const fileInputAssinaturaResponsavel = ref(null)
const logoSecundarioPreview = ref('')
const assinaturaResponsavelPreview = ref('')
const ultimoSalvamento = ref('')

const etapaAtualIndex = computed(() => ETAPAS_CONFIG.findIndex((etapa) => etapa.key === etapaAtual.value))
const etapaAtualMeta = computed(() => ETAPAS_CONFIG[etapaAtualIndex.value] || ETAPAS_CONFIG[0])
const isPrimeiraEtapa = computed(() => etapaAtualIndex.value <= 0)
const isUltimaEtapa = computed(() => etapaAtualIndex.value >= ETAPAS_CONFIG.length - 1)

function etapaAtiva(key) {
  return etapaAtual.value === key
}

function irParaEtapa(key) {
  etapaAtual.value = key
}

function avancarEtapa() {
  if (isUltimaEtapa.value) return
  etapaAtual.value = ETAPAS_CONFIG[etapaAtualIndex.value + 1].key
}

function voltarEtapa() {
  if (isPrimeiraEtapa.value) return
  etapaAtual.value = ETAPAS_CONFIG[etapaAtualIndex.value - 1].key
}

function triggerDocumentUpload() {
  documentInput.value?.click()
}

const REGIME_TRIBUTARIO_OPCOES = [
  { value: 'MEI', label: 'MEI' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'SIMPLES_NACIONAL_EXCESSO', label: 'Simples Nacional - Excesso de Sublimite' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
  { value: 'OUTRO', label: 'Outro' },
]

const form = ref({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  inscricao_municipal: '',
  regime_tributario: '',
  instagram_url: '',
  whatsapp_url: '',
  whatsapp_api_token: '',
  evolution_api_url: '',
  evolution_api_key: '',
  evolution_instance_name: '',
  site: '',
  cor_marca: '#2563eb',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  email: '',
  telefone: '',
  banco_titular: '',
  banco_nome: '',
  banco_agencia: '',
  banco_conta: '',
  pix: '',
  perda_padrao_percentual: null,
  horas_uteis_mes_fabrica: null,
})

// --- MÁSCARAS ---
const cnpjMask = computed({
  get: () => maskCNPJ(form.value.cnpj),
  set: (v) => (form.value.cnpj = onlyNumbers(v).slice(0, 14)),
})
const cepMask = computed({
  get: () => maskCEP(form.value.cep),
  set: (v) => (form.value.cep = onlyNumbers(v).slice(0, 8)),
})
const ieMask = computed({
  get: () => maskIE(form.value.ie),
  set: (v) => (form.value.ie = onlyNumbers(v).slice(0, 12)),
})
const imMask = computed({
  get: () => maskIE(form.value.inscricao_municipal),
  set: (v) => (form.value.inscricao_municipal = onlyNumbers(v).slice(0, 12)),
})
const telefoneMask = computed({
  get: () => maskTelefone(form.value.telefone),
  set: (v) => (form.value.telefone = onlyNumbers(v).slice(0, 11)),
})

const avisoDadosBancariosVazios = computed(() => {
  const f = form.value
  const v = (x) => !String(x ?? '').trim()
  return v(f.banco_titular) || v(f.banco_nome) || v(f.banco_agencia) || v(f.banco_conta) || v(f.pix)
})

// --- BUSCAS ---
const onCnpjBlur = async () => {
  const cnpj = form.value.cnpj.replace(/\D/g, '')
  if (cnpj.length !== 14) return
  try {
    const d = await buscarCnpj(cnpj)
    if (d) {
      form.value.razao_social = d.razao_social || form.value.razao_social
      form.value.nome_fantasia = d.nome_fantasia || form.value.nome_fantasia
      form.value.logradouro = d.endereco || ''
      form.value.numero = d.numero || ''
      form.value.bairro = d.bairro || ''
      form.value.cidade = d.cidade || ''
      form.value.uf = (d.estado || '').toLowerCase()
      form.value.cep = (d.cep || '').replace(/\D/g, '')
      if (d.ie) form.value.ie = d.ie
      if (!form.value.pix) form.value.pix = maskCNPJ(cnpj)
      notify.success('Dados importados com sucesso!')
    }
  } catch {
    notify.error('Erro ao consultar CNPJ')
  }
}

const onCepBlur = async () => {
  const cep = form.value.cep.replace(/\D/g, '')
  if (cep.length !== 8) return
  const d = await buscarCep(cep)
  if (d && !d.erro) {
    form.value.logradouro = d.logradouro
    form.value.bairro = d.bairro
    form.value.cidade = d.localidade
    form.value.uf = d.uf
    notify.success('Endereço atualizado!')
  }
}

// --- LOGO E DOCUMENTOS (GLOBAL ARQUIVOS) ---
async function carregarLogo() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data?.data ?? res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_PRINCIPAL') || lista[0]
    logoPreview.value = logo?.url || ''
  } catch {
    logoPreview.value = ''
  }
}

async function carregarLogoFundoEscuro() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data?.data ?? res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_FUNDO_ESCURO')
    logoFundoEscuroPreview.value = logo?.url || ''
  } catch {
    logoFundoEscuroPreview.value = ''
  }
}

async function carregarAssinatura() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'ASSINATURA' })
    const arr = res?.data?.data ?? res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const assinatura = lista.find(a => String(a.slot_key || '') === 'ASSINATURA_DIGITAL') || lista[0]
    assinaturaPreview.value = assinatura?.url || ''
  } catch {
    assinaturaPreview.value = ''
  }
}

async function carregarLogoSecundario() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data?.data ?? res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_SECUNDARIO')
    logoSecundarioPreview.value = logo?.url || ''
  } catch {
    logoSecundarioPreview.value = ''
  }
}

async function carregarAssinaturaResponsavel() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'ASSINATURA' })
    const arr = res?.data?.data ?? res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const assinatura = lista.find(a => String(a.slot_key || '') === 'ASSINATURA_RESPONSAVEL')
    assinaturaResponsavelPreview.value = assinatura?.url || ''
  } catch {
    assinaturaResponsavelPreview.value = ''
  }
}

async function carregarDocumentos() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'ANEXO' })
    const arr = res?.data?.data ?? res?.data ?? res
    documentos.value = Array.isArray(arr) ? arr : []
  } catch {
    documentos.value = []
  }
}

const handleLogoUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // preview imediato
  if (logoPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(file)

  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'LOGO',
      slotKey: 'LOGO_PRINCIPAL',
      file,
    })
    notify.success('Logo enviada!')
    await carregarLogo()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar logo.')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function confirmarRemoverLogo() {
  const ok = await confirm.show('Remover Logo', 'Deseja realmente remover a logomarca?')
  if (!ok) return

  removendoLogo.value = true
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_PRINCIPAL') || lista[0]
    if (logo?.id) {
      await ArquivosService.remover(logo.id)
    }
    logoPreview.value = ''
    notify.success('Logo removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover logo.')
  } finally {
    removendoLogo.value = false
  }
}

const handleLogoFundoEscuroUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (logoFundoEscuroPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoFundoEscuroPreview.value)
  logoFundoEscuroPreview.value = URL.createObjectURL(file)
  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'LOGO',
      slotKey: 'LOGO_FUNDO_ESCURO',
      file,
    })
    notify.success('Logo para fundo escuro enviada!')
    await carregarLogoFundoEscuro()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar logo.')
  } finally {
    if (fileInputFundoEscuro.value) fileInputFundoEscuro.value.value = ''
  }
}

async function confirmarRemoverLogoFundoEscuro() {
  const ok = await confirm.show('Remover Logo', 'Deseja remover a logo para fundo escuro?')
  if (!ok) return
  removendoLogoFundoEscuro.value = true
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_FUNDO_ESCURO')
    if (logo?.id) await ArquivosService.remover(logo.id)
    logoFundoEscuroPreview.value = ''
    notify.success('Logo removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover.')
  } finally {
    removendoLogoFundoEscuro.value = false
  }
}

const handleAssinaturaUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (assinaturaPreview.value?.startsWith('blob:')) URL.revokeObjectURL(assinaturaPreview.value)
  assinaturaPreview.value = URL.createObjectURL(file)
  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'ASSINATURA',
      slotKey: 'ASSINATURA_DIGITAL',
      file,
    })
    notify.success('Imagem da assinatura digital enviada!')
    await carregarAssinatura()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar assinatura.')
  } finally {
    if (fileInputAssinatura.value) fileInputAssinatura.value.value = ''
  }
}

async function confirmarRemoverAssinatura() {
  const ok = await confirm.show('Remover Assinatura', 'Deseja remover a imagem da assinatura digital?')
  if (!ok) return
  removendoAssinatura.value = true
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'ASSINATURA' })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const assinatura = lista.find(a => String(a.slot_key || '') === 'ASSINATURA_DIGITAL') || lista[0]
    if (assinatura?.id) await ArquivosService.remover(assinatura.id)
    assinaturaPreview.value = ''
    notify.success('Assinatura removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover.')
  } finally {
    removendoAssinatura.value = false
  }
}

const handleLogoSecundarioUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (logoSecundarioPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoSecundarioPreview.value)
  logoSecundarioPreview.value = URL.createObjectURL(file)
  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'LOGO',
      slotKey: 'LOGO_SECUNDARIO',
      file,
    })
    notify.success('Logotipo secundário enviado!')
    await carregarLogoSecundario()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar.')
  } finally {
    if (fileInputLogoSecundario.value) fileInputLogoSecundario.value.value = ''
  }
}

async function confirmarRemoverLogoSecundario() {
  const ok = await confirm.show('Remover', 'Deseja remover o logotipo secundário/ícone?')
  if (!ok) return
  removendoLogoSecundario.value = true
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_SECUNDARIO')
    if (logo?.id) await ArquivosService.remover(logo.id)
    logoSecundarioPreview.value = ''
    notify.success('Removido!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover.')
  } finally {
    removendoLogoSecundario.value = false
  }
}

const handleAssinaturaResponsavelUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (assinaturaResponsavelPreview.value?.startsWith('blob:')) URL.revokeObjectURL(assinaturaResponsavelPreview.value)
  assinaturaResponsavelPreview.value = URL.createObjectURL(file)
  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'ASSINATURA',
      slotKey: 'ASSINATURA_RESPONSAVEL',
      file,
    })
    notify.success('Assinatura do responsável enviada! Disponível como variável em PDFs.')
    await carregarAssinaturaResponsavel()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar.')
  } finally {
    if (fileInputAssinaturaResponsavel.value) fileInputAssinaturaResponsavel.value.value = ''
  }
}

async function confirmarRemoverAssinaturaResponsavel() {
  const ok = await confirm.show('Remover', 'Deseja remover a assinatura do responsável?')
  if (!ok) return
  removendoAssinaturaResponsavel.value = true
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'ASSINATURA' })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const assinatura = lista.find(a => String(a.slot_key || '') === 'ASSINATURA_RESPONSAVEL')
    if (assinatura?.id) await ArquivosService.remover(assinatura.id)
    assinaturaResponsavelPreview.value = ''
    notify.success('Removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover.')
  } finally {
    removendoAssinaturaResponsavel.value = false
  }
}

const handleDocumentUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  anexandoDoc.value = true
  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'ANEXO',
      file,
    })
    notify.success('Documento anexado.')
    await carregarDocumentos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar documento.')
  } finally {
    anexandoDoc.value = false
    if (documentInput.value) documentInput.value.value = ''
  }
}

async function confirmarRemoverDocumento(doc) {
  const ok = await confirm.show(
    'Remover Documento',
    `Deseja remover o documento "${doc?.nome || doc?.filename || 'SEM NOME'}"?`,
  )
  if (!ok) return

  try {
    await ArquivosService.remover(doc.id)
    notify.success('Documento removido.')
    await carregarDocumentos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover documento.')
  }
}

function abrirArquivo(doc) {
  const name = encodeURIComponent(doc?.nome || doc?.filename || 'ARQUIVO')
  const type = encodeURIComponent(doc?.mime_type || '')
  const backTo = encodeURIComponent('/configuracoes/empresa') // ajusta se sua rota for outra
  router.push(`/arquivos/${doc.id}?name=${name}&type=${type}&backTo=${backTo}`)
}

// --- UTILITÁRIOS ---
const copiarPix = () => {
  if (!form.value.pix) return
  navigator.clipboard.writeText(form.value.pix).then(() => {
    notify.success('Chave Pix copiada!')
  })
}

function formatarUltimoSalvamento(updatedAt) {
  if (!updatedAt) return ''
  const d = new Date(updatedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- AÇÕES FINAIS ---
const salvar = async () => {
  if (!can('configuracoes.empresa.editar')) return notify.error('Acesso negado.')
  salvando.value = true

  try {
    if (form.value.evolution_instance_name) {
      form.value.evolution_instance_name = String(form.value.evolution_instance_name).trim().toLowerCase()
    }
    const data = await ConfiguracaoService.salvar(form.value)
    const saved = data?.updated_at ?? data
    ultimoSalvamento.value = formatarUltimoSalvamento(saved)
    notify.success('Configurações salvas!')
  } catch {
    notify.error('Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

function normalizarNomeInstanciaEvolution() {
  if (form.value.evolution_instance_name != null) {
    form.value.evolution_instance_name = String(form.value.evolution_instance_name).trim().toLowerCase()
  }
}

async function testarTokenWhatsApp() {
  testandoWhatsApp.value = true
  try {
    const data = await ConfiguracaoService.whatsappTest()
    if (data?.ok) {
      notify.success(data.message || 'Evolution API conectada.')
    } else {
      notify.error(data?.message || 'Evolution API não configurada ou instância desconectada.')
    }
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao testar Evolution API.')
  } finally {
    testandoWhatsApp.value = false
  }
}

async function mostrarQrWhatsApp(comNumero) {
  loadingQrWhatsApp.value = true
  if (!showQrWhatsAppModal.value) {
    qrWhatsAppData.value = null
    showQrWhatsAppModal.value = true
  }
  try {
    const instanceName = (form.value.evolution_instance_name?.trim() || 'acasa-erp').toLowerCase()
    const number = (comNumero && qrWhatsAppNumber.value?.trim()) ? qrWhatsAppNumber.value.trim() : null
    let data = null
    try {
      data = await ConfiguracaoService.createEvolutionInstance(instanceName)
      if (data?.qrCodeBase64 || data?.pairingCode) {
        qrWhatsAppData.value = { code: data.qrCodeBase64, pairingCode: data.pairingCode }
      } else {
        data = await ConfiguracaoService.getEvolutionQrCode(instanceName, number)
        qrWhatsAppData.value = data || {}
      }
    } catch (createErr) {
      if (createErr?.response?.status === 403) {
        data = await ConfiguracaoService.getEvolutionQrCode(instanceName, number)
        qrWhatsAppData.value = data || {}
      } else {
        throw createErr
      }
    }
    if (!qrWhatsAppData.value?.code && !qrWhatsAppData.value?.pairingCode) {
      notify.info('QR ainda não disponível. Informe seu número com DDI (ex: 5511999999999) e clique em "Buscar QR de novo".')
    }
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao obter QR Code. Verifique a Evolution API e o nome da instância.')
    if (!showQrWhatsAppModal.value) showQrWhatsAppModal.value = false
  } finally {
    loadingQrWhatsApp.value = false
  }
}

async function confirmarSalvarDadosEmpresa() {
  if (!can('configuracoes.empresa.editar')) return notify.error('Acesso negado.')
  let msg = 'Deseja salvar as configurações fiscais e de recebimento?'
  if (avisoDadosBancariosVazios.value) {
    msg = 'Alguns campos de Dados Bancários e Pix estão vazios. Recomendamos preenchê-los para orçamentos e documentos. Deseja mesmo salvar?'
  }
  const ok = await confirm.show('Salvar Dados da Empresa', msg)
  if (!ok) return
  await salvar()
}


async function confirmarExportarDadosEmpresa() {
  const ok = await confirm.show(
    'Exportar Dados da Empresa',
    'Deseja exportar os dados cadastrais para impressão/PDF?',
  )
  if (!ok) return
  gerarPdfDados()
}

const gerarPdfDados = () => {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    notify.error('Não foi possível gerar o relatório agora.')
    iframe.remove()
    return
  }

  doc.open()
  doc.write(`
    <html>
      <head>
        <title>Dados Cadastrais - ${form.value.nome_fantasia}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-width: 150px; max-height: 100px; margin-right: 20px; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
          .section-title { background: #f4f4f4; padding: 10px; font-size: 16px; font-weight: bold; margin-top: 25px; border-left: 5px solid #333; }
          .data-row { margin: 8px 0; font-size: 14px; }
          .label { font-weight: bold; min-width: 120px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoPreview.value ? `<img src="${logoPreview.value}" class="logo" />` : ''}
          <div class="title">DADOS CADASTRAIS - ${form.value.nome_fantasia}</div>
        </div>

        <div class="data-row"><span class="label">Razão Social:</span> ${form.value.razao_social}</div>
        <div class="data-row"><span class="label">CNPJ:</span> ${cnpjMask.value} ${form.value.ie ? `| <span class="label">IE:</span> ${form.value.ie}` : ''}</div>
        <div class="data-row"><span class="label">Endereço:</span> ${form.value.logradouro}, ${form.value.numero} - ${form.value.bairro}</div>
        <div class="data-row"><span class="label">Cidade:</span> ${form.value.cidade} - ${form.value.uf}</div>
        <div class="data-row"><span class="label">CEP:</span> ${cepMask.value}</div>
        <div class="data-row"><span class="label">Contato:</span> ${form.value.email} | ${telefoneMask.value}</div>

        <div class="section-title">DADOS BANCÁRIOS E PIX</div>
        <div class="data-row"><span class="label">Titular:</span> ${form.value.banco_titular}</div>
        <div class="data-row"><span class="label">Banco:</span> ${form.value.banco_nome || 'Não informado'}</div>
        <div class="data-row"><span class="label">Agência:</span> ${form.value.banco_agencia} | <span class="label" style="min-width:auto">Conta:</span> ${form.value.banco_conta}</div>
        <div class="data-row"><span class="label">Chave PIX:</span> <strong>${form.value.pix || 'Não informada'}</strong></div>

        <div style="margin-top: 50px;"></div>
      </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 1000)
  }, 300)
}

onMounted(async () => {
  try {
    const data = await ConfiguracaoService.carregar()
    if (data) Object.assign(form.value, data)
    if (form.value.evolution_instance_name) {
      form.value.evolution_instance_name = String(form.value.evolution_instance_name).trim().toLowerCase()
    }
    if (!form.value.cor_marca) form.value.cor_marca = '#2563eb'
    ultimoSalvamento.value = formatarUltimoSalvamento(data?.updated_at)
    await Promise.all([
      carregarLogo(),
      carregarLogoFundoEscuro(),
      carregarLogoSecundario(),
      carregarAssinatura(),
      carregarAssinaturaResponsavel(),
      carregarDocumentos(),
    ])
  } catch (err) {
    console.error('[CONFIGURACOES_EMPRESA_LOAD]', err)
    notify.error('Nao foi possivel carregar os dados da empresa.')
  }
})
</script>

<style scoped>
.login-font {
  font-family: var(--ds-font-sans);
}

.configuracoes-empresa__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.configuracoes-empresa__header-actions {
  align-items: center;
}

.configuracoes-empresa__tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.configuracoes-empresa__tab {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  text-align: left;
  min-width: 0;
  border-radius: 0;
  border: 0;
  border-bottom: 1px solid rgba(214, 224, 234, 0.9);
  background: transparent;
  padding: 0.85rem 0.15rem 0.95rem;
  color: rgb(100 116 139);
  transition: all 0.2s ease;
}

.configuracoes-empresa__tab-index {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: rgb(71 85 105);
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.configuracoes-empresa__tab-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.configuracoes-empresa__tab-label {
  color: rgb(30 41 59);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.configuracoes-empresa__tab-description {
  color: rgb(100 116 139);
  font-size: 0.7rem;
  line-height: 1.4;
}

.configuracoes-empresa__tab:hover {
  border-bottom-color: rgba(37, 99, 235, 0.35);
  color: rgb(30 41 59);
}

.configuracoes-empresa__tab--active {
  border-bottom-color: rgba(37, 99, 235, 0.9);
  color: rgb(15 23 42);
  box-shadow: none;
}

.configuracoes-empresa__tab--active .configuracoes-empresa__tab-index {
  background: rgba(37, 99, 235, 0.1);
  color: rgb(37 99 235);
}

.configuracoes-empresa__tab--active .configuracoes-empresa__tab-label,
.configuracoes-empresa__tab--active .configuracoes-empresa__tab-description {
  color: inherit;
}

.configuracoes-empresa__step-summary {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  padding: 0 0 0.15rem;
}

.configuracoes-empresa__step-eyebrow {
  color: rgb(37 99 235);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.configuracoes-empresa__step-title {
  color: rgb(15 23 42);
  font-size: 1.15rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.configuracoes-empresa__step-description {
  color: rgb(100 116 139);
  font-size: 0.82rem;
  line-height: 1.5;
  max-width: 42rem;
}

.configuracoes-empresa__layout {
  align-items: start;
  gap: 2rem;
}

.configuracoes-empresa__sidebar,
.configuracoes-empresa__main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0;
}

.configuracoes-empresa__sidebar > section,
.configuracoes-empresa__main > section {
  margin: 0 !important;
  padding: 0 0 1.5rem !important;
  border: 0 !important;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.configuracoes-empresa__sidebar > section :deep(h3),
.configuracoes-empresa__main > section :deep(h3) {
  letter-spacing: 0.08em;
}

.configuracoes-empresa__sidebar > section:not(:last-child),
.configuracoes-empresa__main > section:not(:last-child) {
  border-bottom: 1px solid rgba(214, 224, 234, 0.62) !important;
}

.configuracoes-empresa__sidebar > section:last-child,
.configuracoes-empresa__main > section:last-child {
  margin-bottom: 0;
}

.configuracoes-empresa__step-actions {
  padding-top: 1rem;
}

.configuracoes-empresa__inline-group {
  padding-top: 0.35rem;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
}

.configuracoes-empresa__upload-surface {
  background: transparent !important;
  border-width: 1px !important;
  border-color: rgba(214, 224, 234, 0.86) !important;
  border-radius: 1rem !important;
  box-shadow: none !important;
}

.configuracoes-empresa__upload-surface:hover {
  border-color: rgba(37, 99, 235, 0.45) !important;
  background: rgba(248, 250, 252, 0.4) !important;
}

.configuracoes-empresa__upload-surface--dark {
  background: rgba(15, 23, 42, 0.78) !important;
  border-color: rgba(71, 85, 105, 0.8) !important;
}

.configuracoes-empresa__document-row {
  padding-left: 0 !important;
  padding-right: 0 !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(214, 224, 234, 0.58) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.configuracoes-empresa__document-row:last-of-type {
  border-bottom-color: transparent !important;
}

.configuracoes-empresa__empty-dropzone {
  border-width: 1px !important;
  border-color: rgba(214, 224, 234, 0.72) !important;
  border-radius: 1rem !important;
  background: transparent !important;
}

.configuracoes-empresa__attach-trigger {
  border-width: 1px !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.configuracoes-empresa__qr-modal {
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 22px 60px -36px rgba(15, 23, 42, 0.32);
}

.configuracoes-empresa__qr-state {
  border: 1px solid rgba(214, 224, 234, 0.72);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.72);
  padding: 0.9rem;
}

.dark .configuracoes-empresa__tab {
  border-bottom-color: rgba(51, 71, 102, 0.86);
  background: transparent;
  color: rgb(148 163 184);
}

.dark .configuracoes-empresa__tab-index {
  background: rgba(51, 65, 85, 0.55);
  color: rgb(148 163 184);
}

.dark .configuracoes-empresa__tab-label {
  color: rgb(226 232 240);
}

.dark .configuracoes-empresa__tab-description,
.dark .configuracoes-empresa__step-description {
  color: rgb(148 163 184);
}

.dark .configuracoes-empresa__step-title {
  color: rgb(241 245 249);
}

.dark .configuracoes-empresa__tab:hover {
  border-bottom-color: rgba(59, 130, 246, 0.35);
  color: rgb(226 232 240);
}

.dark .configuracoes-empresa__tab--active {
  border-bottom-color: rgba(59, 130, 246, 0.92);
}

.dark .configuracoes-empresa__tab--active .configuracoes-empresa__tab-index {
  background: rgba(59, 130, 246, 0.16);
  color: rgb(147 197 253);
}

.dark .configuracoes-empresa__sidebar > section,
.dark .configuracoes-empresa__main > section {
  background: transparent;
  box-shadow: none;
}

.dark .configuracoes-empresa__sidebar > section:not(:last-child),
.dark .configuracoes-empresa__main > section:not(:last-child) {
  border-bottom-color: rgba(51, 71, 102, 0.72) !important;
}

.dark .configuracoes-empresa__inline-group {
  border-top-color: rgba(51, 71, 102, 0.58);
}

.dark .configuracoes-empresa__upload-surface {
  border-color: rgba(71, 85, 105, 0.78) !important;
}

.dark .configuracoes-empresa__upload-surface:hover {
  background: rgba(30, 41, 59, 0.28) !important;
}

.dark .configuracoes-empresa__document-row {
  border-bottom-color: rgba(51, 71, 102, 0.68) !important;
}

.dark .configuracoes-empresa__empty-dropzone,
.dark .configuracoes-empresa__attach-trigger {
  border-color: rgba(71, 85, 105, 0.74) !important;
}

.dark .configuracoes-empresa__qr-modal {
  border-color: rgba(71, 85, 105, 0.78);
  background: rgba(15, 23, 42, 0.94);
  box-shadow: none;
}

.dark .configuracoes-empresa__qr-state {
  border-color: rgba(71, 85, 105, 0.72);
  background: rgba(30, 41, 59, 0.5);
}

@media (max-width: 767px) {
  .configuracoes-empresa__tabs {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .configuracoes-empresa__tab {
    padding: 0.8rem 0 0.9rem;
  }

  .configuracoes-empresa__sidebar > section,
  .configuracoes-empresa__main > section {
    padding: 0 0 1.2rem !important;
  }
}

@media (min-width: 1024px) {
  .configuracoes-empresa__sidebar {
    padding-right: 1.25rem;
  }

  .configuracoes-empresa__main {
    padding-left: 1.25rem;
  }
}

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.clientes-line-form :deep(.search-container > label) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgb(100 116 139);
}

.clientes-line-form :deep(input.w-full),
.clientes-line-form :deep(select.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.clientes-line-form :deep(input.w-full:focus),
.clientes-line-form :deep(select.w-full:focus) {
  box-shadow: none;
}
</style>
