<template>
  <div class="login-font w-full h-full mt-4 mb-8 mx-2 lg:mx-4 rounded-2xl border border-border-ui bg-bg-card overflow-hidden shadow-sm animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
    <PageHeader
      title="Cadastro da Empresa"
      subtitle="Registro da empresa, dados fiscais e de recebimento"
      icon="pi pi-building"
      :show-back="false"
      class="border-b border-border-ui"
    >
      <template #actions>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
      <div class="clientes-line-form border-t border-border-ui bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900">
        <!-- Abas: Dados da Empresa | Operação e Documentos -->
        <div class="flex border-b border-border-ui bg-white/80">
          <button
            type="button"
            :class="[
              'flex-1 py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors',
              abaConfig === 'empresa'
                ? 'text-brand-primary border-b-2 border-brand-primary bg-slate-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            ]"
            @click="abaConfig = 'empresa'"
          >
            <i class="pi pi-building mr-2"></i> Dados da Empresa
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors',
              abaConfig === 'operacao'
                ? 'text-brand-primary border-b-2 border-brand-primary bg-slate-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            ]"
            @click="abaConfig = 'operacao'"
          >
            <i class="pi pi-cog mr-2"></i> Operação e Documentos
          </button>
        </div>

      <div class="grid grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-ui">
        
        <div class="col-span-12 lg:col-span-4 p-6 lg:p-8 bg-slate-50/70 dark:bg-slate-900/40 space-y-8">
          
          <section v-show="abaConfig === 'empresa'" class="pb-6 border-b border-border-ui/70">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center lg:text-left">
              Identidade
            </h3>

            <div class="space-y-6">
              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logo da Marca</p>
                <div
                  class="relative aspect-square w-48 mx-auto lg:ml-0 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
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
                  class="relative aspect-square w-40 mx-auto lg:ml-0 rounded-xl border-2 border-dashed border-slate-200 bg-slate-800 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
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
                  class="relative aspect-square w-32 mx-auto lg:ml-0 rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
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
                  class="relative aspect-[3/1] w-full max-w-48 mx-auto lg:ml-0 rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
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

          <section v-show="abaConfig === 'operacao'">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Arquivos e Documentos
            </h3>

            <div class="space-y-2 mb-4">
              <div
                v-for="doc in documentos"
                :key="doc.id"
                class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
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

              <div v-if="!documentos.length" class="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nenhum documento anexado</p>
              </div>
            </div>

            <Button
              variant="ghost"
              class="w-full !h-11 !rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-500 hover:bg-slate-50"
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

        <div class="col-span-12 lg:col-span-8 p-6 lg:p-10 space-y-8">
          
          <section v-show="abaConfig === 'empresa'" class="pb-6 border-b border-border-ui/70">
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

          <section v-show="abaConfig === 'empresa'" class="pb-6 border-b border-border-ui/70">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Contato</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input v-model="form.email" label="E-mail de Contato" type="email" icon="pi pi-envelope" class="md:col-span-2" />
              <Input v-model="telefoneMask" label="WhatsApp (número)" icon="pi pi-whatsapp" placeholder="(00) 00000-0000" />
              <Input v-model="form.whatsapp_url" label="Link do WhatsApp" placeholder="https://wa.me/5511999999999" />

              <div class="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-4">
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
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                @click.self="showQrWhatsAppModal = false"
              >
                <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
                  <div class="flex justify-between items-center mb-3">
                    <h4 class="text-sm font-bold text-slate-800">Conectar WhatsApp</h4>
                    <button type="button" class="text-slate-400 hover:text-slate-600" @click="showQrWhatsAppModal = false" aria-label="Fechar">
                      <i class="pi pi-times text-lg"></i>
                    </button>
                  </div>
                  <p class="text-xs text-slate-600 mb-3">Escaneie o QR Code no WhatsApp (Aparelhos conectados) ou use o código de vinculação. Se não aparecer, informe seu número abaixo e clique de novo em &quot;Conectar meu WhatsApp&quot;.</p>
                  <div class="mb-3">
                    <label class="block text-xs text-slate-600 mb-1">Número com DDI (opcional)</label>
                    <input
                      v-model="qrWhatsAppNumber"
                      type="text"
                      placeholder="5511999999999"
                      class="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                    />
                  </div>
                  <div v-if="qrWhatsAppData?.code" class="flex justify-center mb-3">
                    <img :src="'data:image/png;base64,' + qrWhatsAppData.code" alt="QR Code WhatsApp" class="w-48 h-48 object-contain border border-slate-200 rounded" />
                  </div>
                  <div v-else-if="qrWhatsAppData?.pairingCode" class="mb-3 p-3 bg-slate-100 rounded text-center">
                    <p class="text-xs text-slate-600 mb-1">Código de vinculação:</p>
                    <p class="text-lg font-mono font-bold">{{ qrWhatsAppData.pairingCode }}</p>
                    <p class="text-[11px] text-slate-500 mt-1">WhatsApp → Ajustes → Aparelhos conectados → Conectar um aparelho → Código de vinculação</p>
                  </div>
                  <div v-else-if="qrWhatsAppData && !qrWhatsAppData.code && !qrWhatsAppData.pairingCode" class="text-sm text-amber-600 py-2">
                    Aguardando QR na Evolution API. Preencha seu número com DDI acima e clique em &quot;Buscar QR de novo&quot;.
                  </div>
                  <div class="flex gap-2 mt-3">
                    <Button type="button" variant="outline" size="sm" :loading="loadingQrWhatsApp" @click="mostrarQrWhatsApp(true)">Buscar QR de novo</Button>
                    <Button type="button" variant="outline" size="sm" @click="showQrWhatsAppModal = false">Fechar</Button>
                  </div>
                </div>
              </div>
              <Input v-model="form.instagram_url" label="Link do Instagram" placeholder="https://instagram.com/..." />
              <Input v-model="form.site" label="Site da Empresa" placeholder="https://..." class="md:col-span-2" />
            </div>
          </section>

          <section v-show="abaConfig === 'empresa'" class="py-2">
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

          <section v-show="abaConfig === 'operacao'" class="pb-6 border-b border-border-ui/70">
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

          <section v-show="abaConfig === 'operacao'" class="pb-6 border-b border-border-ui/70">
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

          <section v-show="abaConfig === 'empresa'" class="pt-2">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">
                Representante Legal e Sócio
              </h3>
            </div>
            <p class="text-[11px] text-slate-500 mb-4">
              Usados nos contratos quando o vendedor não preencher o &quot;Representante da venda&quot;. Representante legal (CNPJ) e Sócio/Proprietário podem ser a mesma pessoa ou diferentes.
            </p>
            <div class="mb-4 p-4 rounded-xl bg-white border border-slate-200">
              <p class="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">Quando o vendedor não preencher o Representante da venda, usar no contrato:</p>
              <label class="flex items-center gap-3 cursor-pointer group">
                <input
                  v-model="form.contrato_usar_socio_quando_vazio"
                  type="checkbox"
                  class="w-4 h-4 rounded border-border-ui text-brand-primary focus:ring-brand-primary/20"
                />
                <span class="text-sm text-text-main">
                  <strong>Sócio / Proprietário</strong> (desmarque para usar Representante Legal)
                </span>
              </label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-6">
              <div class="md:col-span-2">
                <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Representante Legal (CNPJ)</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input v-model="form.representante_legal_nome" label="Nome completo" placeholder="Nome do representante legal" />
                  <Input
                    :model-value="representanteLegalCpfMask"
                    label="CPF"
                    placeholder="000.000.000-00"
                    @update:model-value="(v) => (form.representante_legal_cpf = onlyNumbers(v).slice(0, 11))"
                  />
                  <Input
                    :model-value="representanteLegalRgMask"
                    label="RG"
                    placeholder="00.000.000-0"
                    @update:model-value="(v) => (form.representante_legal_rg = (v || '').replace(/\D/g, '').slice(0, 14))"
                  />
                </div>
              </div>
              <div class="md:col-span-2">
                <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Sócio / Proprietário</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input v-model="form.representante_legal_socio_nome" label="Nome completo" placeholder="Nome do sócio ou proprietário" />
                  <Input
                    :model-value="socioCpfMask"
                    label="CPF"
                    placeholder="000.000.000-00"
                    @update:model-value="(v) => (form.representante_legal_socio_cpf = onlyNumbers(v).slice(0, 11))"
                  />
                  <Input
                    :model-value="socioRgMask"
                    label="RG"
                    placeholder="00.000.000-0"
                    @update:model-value="(v) => (form.representante_legal_socio_rg = (v || '').replace(/\D/g, '').slice(0, 14))"
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 p-4 rounded-xl bg-white border border-slate-200">
              <p class="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">Assinatura do Responsável</p>
              <p class="text-[11px] text-slate-500 mb-3">
                Imagem usada como variável em PDFs (contratos, orçamentos). Recomendado: assinatura escaneada ou desenhada em fundo transparente.
              </p>
              <div
                class="relative aspect-[3/1] w-full max-w-56 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
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

          <section v-show="abaConfig === 'empresa'" class="pt-2">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest text-emerald-600">
                Dados Bancários e Pix
              </h3>
            </div>

            <div
              v-if="avisoDadosBancariosVazios"
              class="mb-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 flex items-start gap-3"
            >
              <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-xl mt-0.5"></i>
              <div>
                <p class="text-sm font-bold text-amber-800 dark:text-amber-200">Dados bancários incompletos</p>
                <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Ao salvar, alguns campos de Dados Bancários e Pix estão vazios. Recomendamos preencher Titular, Banco, Agência, Conta e Chave Pix para orçamentos e documentos.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="md:col-span-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">
                  Chave Pix (Aparece nos orçamentos)
                </label>
                <div class="relative">
                  <input
                    v-model="form.pix"
                    class="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    placeholder="E-mail, CNPJ ou Celular"
                  />
                  <button
                    type="button"
                    @click="copiarPix"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    <i class="pi pi-copy text-sm"></i>
                  </button>
                </div>
              </div>

              <Input v-model="form.banco_nome" label="Banco" />
              <Input v-model="form.banco_titular" label="Titular da Conta" />
              <Input v-model="form.banco_agencia" label="Agência" />
              <Input v-model="form.banco_conta" label="Conta Corrente" />
            </div>
          </section>
        </div>
      </div>
          </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ConfiguracaoService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCNPJ, maskCEP, maskTelefone, maskIE, maskCPF, maskRG, onlyNumbers } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { can } from '@/services/permissions'

import { useRouter } from 'vue-router'
const router = useRouter()

definePage({ meta: { perm: 'configuracoes.empresa.ver' } })



const fileInput = ref(null)
const documentInput = ref(null)

const abaConfig = ref('empresa')

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
  representante_legal_nome: '',
  representante_legal_cpf: '',
  representante_legal_rg: '',
  representante_legal_socio_nome: '',
  representante_legal_socio_cpf: '',
  representante_legal_socio_rg: '',
  contrato_usar_socio_quando_vazio: true,
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
const representanteLegalCpfMask = computed(() => maskCPF(form.value.representante_legal_cpf || ''))
const representanteLegalRgMask = computed(() => maskRG(form.value.representante_legal_rg || ''))
const socioCpfMask = computed(() => maskCPF(form.value.representante_legal_socio_cpf || ''))
const socioRgMask = computed(() => maskRG(form.value.representante_legal_socio_rg || ''))

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
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
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
