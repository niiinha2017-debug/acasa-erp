<template>
  <div class="w-full max-w-[1000px] mx-auto space-y-6 animate-page-in">
    <div class="rounded-2xl border border-border-ui bg-bg-card overflow-hidden">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

      <PageHeader
        title="Modelos de Cláusulas"
        subtitle="Textos padrão para Contratos e Orçamentos"
        icon="pi pi-file"
        class="border-b border-border-ui"
      >
        <template #actions>
          <!-- Espaço reservado para logo; evitar erro enquanto PNG não existe -->
          <div
            class="h-10 px-3 flex items-center justify-center rounded bg-white/50 border border-border-ui text-[11px] font-semibold text-slate-600"
          >
            Cláusulas
          </div>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 space-y-6">
        <form class="space-y-4" @submit.prevent="salvarAtual">
          <!-- Abas: Contrato / Orçamento -->
          <div class="flex items-center gap-2 mb-4">
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors"
              :class="abaAtiva === 'CONTRATO'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-bg-card text-text-soft border-border-ui hover:bg-slate-100 dark:hover:bg-slate-800'"
              @click="abaAtiva = 'CONTRATO'"
            >
              Contrato
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors"
              :class="abaAtiva === 'ORCAMENTO'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-bg-card text-text-soft border-border-ui hover:bg-slate-100 dark:hover:bg-slate-800'"
              @click="abaAtiva = 'ORCAMENTO'"
            >
              Orçamento
            </button>
          </div>

          <!-- CONTRATO -->
          <div v-if="abaAtiva === 'CONTRATO'" class="space-y-6">
            <div
              v-for="mod in modulosContrato"
              :key="mod.modulo_key"
              class="rounded-xl border border-border-ui bg-white/70 dark:bg-slate-900/40 p-4 space-y-2"
            >
              <Input
                v-model="mod.titulo"
                :label="`Título - ${mod.modulo_key}`"
              />

              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5">
                Texto da cláusula ({{ mod.modulo_key }})
              </label>
              <textarea
                v-model="mod.texto"
                class="w-full min-h-[160px] rounded-xl border border-border-ui bg-bg-card text-sm text-text-main p-3 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              ></textarea>
            </div>

            <p class="text-[11px] text-slate-500">
              Este texto será usado como base para os contratos gerados. Use variáveis (por exemplo
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[cliente_nome]]</code>,
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[valor_final]]</code>)
              para montar o PDF de forma dinâmica.
            </p>
            <p class="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              Os textos exibidos são os que estão salvos no sistema. Se não aparecerem as cláusulas atualizadas, use <strong>Restaurar textos padrão</strong> para carregar os modelos atuais e depois clique em <strong>Salvar Contrato</strong>.
            </p>
          </div>

          <!-- ORÇAMENTO -->
          <div v-if="abaAtiva === 'ORCAMENTO'" class="space-y-6">
            <div
              v-for="mod in modulosOrcamento"
              :key="mod.modulo_key"
              class="rounded-xl border border-border-ui bg-white/70 dark:bg-slate-900/40 p-4 space-y-2"
            >
              <Input
                v-model="mod.titulo"
                :label="`Título - ${mod.modulo_key}`"
              />

              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5">
                Texto da cláusula ({{ mod.modulo_key }})
              </label>
              <textarea
                v-model="mod.texto"
                class="w-full min-h-[160px] rounded-xl border border-border-ui bg-bg-card text-sm text-text-main p-3 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              ></textarea>
            </div>

            <p class="text-[11px] text-slate-500">
              Estes textos serão usados como base das <strong>cláusulas do orçamento</strong> (pré-contrato). Os dados do cliente, valores e demais informações serão preenchidos automaticamente pelo sistema usando variáveis como
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[cliente_razao_social_ou_nome_completo]]</code>
              e
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[valor_total_numerico]]</code>.
            </p>
          </div>

          <div class="flex flex-wrap justify-end gap-3 pt-4 border-t border-border-ui">
            <Button
              type="button"
              variant="secondary"
              :disabled="salvando"
              @click="restaurarTextosPadrao"
            >
              <i class="pi pi-refresh mr-2"></i>
              Restaurar textos padrão
            </Button>
            <Button
              type="submit"
              variant="primary"
              :disabled="salvando"
            >
              <i v-if="salvando" class="pi pi-spin pi-spinner mr-2"></i>
              Salvar Contrato
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { notify } from '@/services/notify'
import api from '@/services/api'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'orcamentos.editar' } })

const salvando = ref(false)

const abaAtiva = ref('CONTRATO')

const modulosContrato = ref([])
const modulosOrcamento = ref([])

function contratosDefaults() {
  return [
    {
      id: undefined,
      modulo_key: 'CABECALHO',
      titulo: 'CONTRATO DE COMPRA E VENDA DE MERCADORIAS E PRESTAÇÃO DE SERVIÇOS',
      texto:
        'Pelo presente instrumento e na melhor forma de direito, de um lado, [[contratada_razao_social]], inscrita no CNPJ sob o nº [[contratada_cnpj]][[contratada_ie_frase]], com sede em [[contratada_endereco_completo]], neste ato representada por [[contratada_representante_nome]], [[contratada_representante_estado_civil]], portador(a) do RG [[contratada_representante_rg]] e inscrito(a) no CPF sob o nº [[contratada_representante_cpf]], doravante denominada simplesmente como CONTRATADA, e do outro lado, [[cliente_razao_social_ou_nome_completo]] inscrito no [[cliente_documento_tipo]] sob o nº [[cliente_documento_numero]][[cliente_ie_frase]], residente e domiciliado em [[cliente_endereco_completo]], doravante denominado simplesmente como CONTRATANTE, têm entre si ajustado o presente negócio de compra e venda de mercadorias e prestação de serviços, mediante as cláusulas e condições a seguir.',
      ordem: 1,
    },
    {
      id: undefined,
      modulo_key: 'OBJETO',
      titulo: 'Cláusula Primeira: Do Objeto',
      texto:
        '§ Primeiro – O objeto do presente contrato é a comercialização de móveis, descritos e caracterizados nos projetos anexos, previamente aprovados por rubrica pelo CONTRATANTE. Os móveis serão entregues em [[cliente_endereco_completo]].\n\nItem/ambiente: Descritivo:\n[[lista_itens_venda]]\n\nO CONTRATANTE declara-se ciente de que a partir deste momento iniciou-se o processo de produção dos produtos acima adquiridos, e que eles foram projetados e personalizados exclusivamente para seu ambiente, não possibilitando a comercialização para com terceiros.\n\n§ Segundo – Fazem parte integrante do presente instrumento as vistas dos projetos que foram definidos e assinados pelas partes, segundo descrito na cláusula acima, elaborados conforme as medidas e dimensões dos ambientes. A CONTRATADA não se responsabiliza por alterações de medidas e projetos posteriores à assinatura dos pedidos e projetos negociados.\n\n§ Terceiro – Os eletrodomésticos, iluminação, vidros, espelhos, cubas de pias, granitos e demais acessórios constantes nos projetos e não descritos no primeiro parágrafo não fazem parte do escopo de fornecimento da CONTRATADA.',
      ordem: 2,
    },
    {
      id: undefined,
      modulo_key: 'PRECO_CONDICOES',
      titulo: 'Cláusula Segunda: Do Preço e da Condição de Pagamento',
      texto:
        '§ Único – O preço certo e ajustado entre as partes, quanto ao objeto do presente, no valor de [[valor_total_numerico]] ([[valor_total_por_extenso]]).\n\nForma de pagamento quanto ao objeto do presente: [[descricao_forma_pagamento_contrato]].\n\nPara pagamento: [[contratada_dados_pagamento]].\n\nData da venda: [[data_venda]]. Os valores e condições acima descritos decorrem da venda nº [[venda_id]], vinculada ao orçamento nº [[orcamento_id]], que integra este contrato para todos os fins.',
      ordem: 3,
    },
    {
      id: undefined,
      modulo_key: 'PRAZO_ENTREGA',
      titulo: 'Cláusula Terceira: Do Prazo de Entrega dos Bens',
      texto:
        '§ Primeiro – Fica acertado entre as partes que o prazo de entrega dos bens, objeto deste contrato, será entregue e instalado até o dia [[data_prazo_entrega_por_extenso]].\n\nParágrafo único. Em caso de atraso da CONTRATADA, deverá incidir sobre o valor do presente instrumento multa pecuniária de 20%, juros de 1% ao mês do valor total do serviço contratado.\n\n§ Segundo – O CONTRATANTE está ciente que receberá apenas os produtos contratados. Não sendo passível a inclusão de brindes e/ou presentes, móveis extras que não estejam descritos e relacionados neste instrumento.\n\n§ Terceiro – O CONTRATANTE também está ciente de que o prazo de entrega dos objetos do contrato é computado após a tirada das medidas finais do(s) ambiente(s). Caso a obra não esteja concluída no momento da assinatura do contrato, não sendo possível medi-las, o prazo será postergado, podendo acarretar alteração do prazo de entrega e correção monetária do valor deste instrumento.\n\n§ Quarto – O CONTRATANTE está ciente que precisa fornecer o(s) ambiente(s) em condições propícias para a entrega e instalação dos ambientes/móveis, ou seja, obra finalizada e ambiente limpo.\n\n§ Quinto – O CONTRATANTE está ciente de que, caso ocorra qualquer impossibilidade de entrega de seus móveis, fica estabelecido o prazo de 5 dias (úteis) para a CONTRATADA manter os produtos armazenados em espaço próprio. Ultrapassado este prazo, incidirá uma multa de [[valor_armazenagem_dia]] por dia (a cada ambiente) em que o móvel permanecer ocupando o espaço, sendo esse pago à vista um dia antes da entrega. Além disso, em caso de abandono dos materiais para além de 6 meses do prazo estipulado para a entrega e/ou retirada, ocorrerá a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\n§ Sexto – Este instrumento estabelece que qualquer alteração de projeto, sendo referente à forma construtiva do móvel e/ou troca de materiais, acarretará ajuste de valores a serem pagos pelo CONTRATANTE.\n\n§ Sétimo – Em caso de desistência, após a assinatura do presente instrumento, fica estabelecido o valor correspondente a 20% (vinte por cento) do valor do contrato para ressarcimento das despesas tidas com elaboração e/ou adequação de projetos, sem prejuízo do ressarcimento das despesas com frete e outras de caráter administrativo, relativas ao contrato ora firmado, servindo o contrato de título executivo extrajudicial. Fica autorizado à CONTRATADA a reter o valor acima do valor já pago, restituindo-se apenas a diferença.',
      ordem: 4,
    },
    {
      id: undefined,
      modulo_key: 'ARMAZENAGEM_DESISTENCIA',
      titulo: 'Cláusula Quarta: Da Armazenagem e da Desistência',
      texto:
        'O CONTRATANTE declara-se ciente de que, a partir da assinatura deste contrato, inicia-se o processo de produção dos produtos, que são personalizados e feitos sob medida, não sendo possível sua revenda a terceiros.\n\nCaso haja impossibilidade de entrega por motivo imputável ao CONTRATANTE, a CONTRATADA poderá manter os produtos armazenados pelo prazo de até 5 (cinco) dias úteis sem cobrança. Após este prazo, incidirá multa diária de [[valor_armazenagem_dia]] por ambiente ou módulo, a ser paga integralmente antes da nova data de entrega.\n\nEm caso de abandono dos materiais por período superior a 6 (seis) meses contados da data prevista para entrega e/ou retirada, poderá ocorrer a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\nEm caso de desistência injustificada após a assinatura, fica estabelecido que o CONTRATANTE pagará à CONTRATADA multa compensatória de 20% (vinte por cento) do valor total do contrato, a título de ressarcimento de despesas com elaboração de projeto, administração e custos de produção já iniciados, sem prejuízo do ressarcimento de fretes e demais despesas comprovadas.',
      ordem: 5,
    },
    {
      id: undefined,
      modulo_key: 'GARANTIA',
      titulo: 'Cláusula Quinta: Da Garantia',
      texto:
        '§ Primeiro – A CONTRATADA concede garantia de [[prazo_garantia_anos]] (cinco) anos sobre os móveis planejados fornecidos, contados a partir da data de entrega e instalação, abrangendo defeitos de fabricação e montagem, desde que respeitadas as condições de uso e conservação indicadas no Certificado de Garantia e Manual do Proprietário, que integram o presente instrumento e deverão ser lidos e rubricados no ato da assinatura.\n\n§ Segundo – Para a validade e manutenção da garantia, é obrigatória a realização de revisão anual, destinada à verificação de regulagens, fixações, funcionamento de ferragens e do estado geral dos móveis.\n\n§ Terceiro – A primeira revisão anual será gratuita, devendo ser solicitada pelo CONTRATANTE no prazo de até 12 (doze) meses após a instalação.\n\n§ Quarto – As revisões subsequentes poderão ser realizadas mediante agendamento prévio e serão cobradas conforme valores vigentes à época, sendo o valor a partir de [[valor_revisao_base]] (duzentos e cinquenta reais) por visita. Eventuais peças, materiais ou componentes que necessitem de substituição não estão inclusos nesse valor, sendo orçados e cobrados à parte, mediante aprovação do CONTRATANTE.\n\n§ Quinto – Não estão cobertos pela garantia o desgaste natural decorrente do uso, bem como danos ocasionados por agentes externos, tais como infiltrações de água, infestação de cupins ou similares, calor excessivo, contato prolongado com água ou umidade, além de oxidação ou ferrugem de partes metálicas, mau uso, falta de manutenção, umidade, infiltrações, alterações no ambiente ou intervenções realizadas por terceiros.',
      ordem: 6,
    },
    {
      id: undefined,
      modulo_key: 'SERVICOS',
      titulo: 'Cláusula Quinta: Dos Serviços',
      texto:
        '§ Único – Pelo presente instrumento, [[cliente_razao_social_ou_nome_completo]] contrata a empresa [[contratada_razao_social]] para a execução dos serviços de montagem, acabamento e entrega dos produtos, conforme os projetos negociados pelas partes e anexados ao presente instrumento.',
      ordem: 7,
    },
    {
      id: undefined,
      modulo_key: 'CONDICOES_GERAIS',
      titulo: 'Cláusula Sexta: Das Condições Gerais',
      texto:
        '§ Primeiro – As partes não assumem nenhuma responsabilidade por ajustes verbais fora das condições aqui estabelecidas e especificadas. Qualquer condição excepcional deverá constar, expressamente, em adendo a este instrumento.\n\n§ Segundo – O CONTRATANTE desde já autoriza seus familiares e/ou empregados a assinarem os documentos comprobatórios da entrega das mercadorias.\n\n§ Terceiro – Obrigações importantes ao cliente:\n\n• O local de entrega deverá estar apto a receber os móveis, e o espaço para instalação dos armários deverá estar vago. Em caso de reformas, elas deverão estar devidamente concluídas e os ambientes completamente limpos. Uma vez programada a entrega, se por qualquer motivo esta for alterada pelo cliente, ela terá que respeitar uma nova programação na logística da empresa, cuja data deverá ser agendada pela CONTRATADA. Os produtos serão entregues no seu local de destino para serem posteriormente montados pela equipe da CONTRATADA.\n\n• A montagem só poderá ser realizada após a obra estar totalmente concluída com: pontos elétricos, hidráulicos e de gás executados conforme a planta e cronogramas fornecidos pelo CONTRATANTE.\n\n• Desta forma, os serviços de instalação do mobiliário não serão iniciados caso não sejam cumpridos alguns dos itens citados neste parágrafo. Caso contrário, a CONTRATADA não se responsabiliza por possíveis danos que possam ocorrer aos produtos do CONTRATANTE.',
      ordem: 8,
    },
    {
      id: undefined,
      modulo_key: 'RESPONSABILIDADES',
      titulo: 'Cláusula Sétima: Das Responsabilidades e Obrigações',
      texto:
        '§ Primeiro – A CONTRATADA não se responsabilizará pelas instalações de tampos de granitos, aço, inox, ou qualquer outro material que não seja o especificado pelo projeto técnico. Bem como pelas instalações de telefones, interfones, antenas de TV ou qualquer outro aparelho que porventura possa ser instalado sem a prévia orientação de um profissional especializado e/ou técnico de sua área.\n\n§ Segundo – O CONTRATANTE se responsabiliza a fornecer no momento da assinatura do projeto ou em até 7 (sete) dias úteis antes da data prevista para instalação: plantas elétricas, hidráulicas, de gás ou de quaisquer outros materiais não aparentes que eventualmente possam ser danificados com a instalação; caso essas plantas não sejam fornecidas, a CONTRATADA não se responsabiliza por eventuais danos causados.\n\n§ Terceiro – A CONTRATADA isenta-se de qualquer responsabilidade sobre instalações elétricas fora a dos materiais por ela fornecidos. As equipes de instalação estão aptas apenas a aplicar as iluminações ao móvel; as instalações além desta condição são de responsabilidade do cliente.\n\n§ Quarto – Fica aos cuidados do CONTRATANTE a retirada de molduras de gesso, rodapés ou qualquer outro acabamento que interfira na instalação dos produtos, antes da entrega dos móveis; os técnicos estão aptos a prestar toda orientação necessária.\n\n§ Quinto – Qualquer alteração na obra realizada após as medições, que não tenham sido determinadas no projeto e afetem o mesmo, poderá gerar alterações no prazo de entrega e conclusão da montagem, além de novos custos, e serão de inteira responsabilidade do cliente.\n\n§ Sexto – A perfeita execução de seu projeto requer, durante a montagem, alguns ajustes de acabamento que poderão provocar resíduos e pó; além disso, as embalagens dos produtos após abertas geram volumes que ocupam espaços consideráveis.\n\n§ Sétimo – Após a conclusão da montagem, os técnicos estarão aptos a deslocá-los para locais previamente indicados pelo cliente e farão a limpeza dos resíduos resultantes da montagem e manutenção dos ambientes.\n\n§ Oitavo – Os mecanismos utilizados para fixação das peças junto a paredes, quando o caso, são dimensionados para sustentação das peças, não sendo aconselhável a colocação de pesos extras (tampos de granito ou mármore, pias, cubas, eletrodomésticos com peso excessivo e outros).\n\n§ Nono – Quanto à montagem dos projetos em paredes que não sejam de alvenaria padrão (não convencionais, drywall e outras), o fato deverá constar no presente contrato e projeto. Para providências específicas de montagem, acertamos que a CONTRATADA não assume a responsabilidade pela resistência das referidas paredes na viabilidade, execução e utilização do presente projeto.',
      ordem: 9,
    },
    {
      id: undefined,
      modulo_key: 'CESSAO_IMAGEM',
      titulo: 'Cláusula Oitava: Da Cessão de Imagem e Voz',
      texto:
        'Este instrumento estabelece a autorização do CONTRATANTE à CONTRATADA, aqui previamente descrita, a dispor de seus dados pessoais, conforme os artigos 7.º e 11.º da Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), e autoriza a utilização de sua imagem e/ou voz, de acordo com os parágrafos dispostos abaixo:\n\n§ Primeiro – O CONTRATANTE autoriza a CONTRATADA a realizar o tratamento, ou seja, a utilizar os dados relacionados à divulgação, em fotos e vídeo do mobiliário contratado, para finalidade de promoção da campanha publicitária de interesse da CONTRATADA, ocorrendo a divulgação no seu site e demais mídias, online e off-line, já existentes ou que venham a existir.\n\n§ Segundo – O CONTRATANTE autoriza que a CONTRATADA utilize a imagem para divulgação de campanha publicitária de seu interesse, adotando todas as medidas de proteção de dados, visando a preservação de seu direito à intimidade, coibindo o uso com finalidade distinta da prevista neste termo.',
      ordem: 10,
    },
    {
      id: undefined,
      modulo_key: 'FORO',
      titulo: 'Cláusula Nona: Do Foro',
      texto:
        '§ Primeiro – As partes elegem o Foro desta cidade, [[cidade_foro]], [[estado_foro]], para dirimir quaisquer dúvidas decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.\n\n§ Segundo – Após a leitura do inteiro teor do presente contrato, as partes, estando de pleno acordo, subscrevem o presente instrumento em duas vias de igual teor e forma.\n\n[[cidade_data_assinatura]]\n\nCiente: ___________________________________________________________\n\nCONTRATADA: [[contratada_razao_social]]\nCNPJ: [[contratada_cnpj]]\nREPRESENTANTE LEGAL: [[contratada_representante_nome]]\nCPF: [[contratada_representante_cpf]]\n\nCiente: ___________________________________________________________\n\nCONTRATANTE: [[cliente_razao_social_ou_nome_completo]]\n[[cliente_documento_tipo]]: [[cliente_documento_numero]]',
      ordem: 11,
    },
  ]
}

async function carregarContrato() {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }
  try {
    const { data } = await api.get('/clausulas/CONTRATO')
    const lista = Array.isArray(data) ? data : []
    let normalizados = lista.map((m, idx) => ({
      id: m.id,
      modulo_key: m.modulo_key,
      titulo: m.titulo || m.modulo_key,
      texto: m.texto || '',
      ordem: typeof m.ordem === 'number' ? m.ordem : idx + 1,
    }))

    const todosSemTexto = normalizados.length > 0 && normalizados.every(m => !m.texto)

    if (!normalizados.length || todosSemTexto) {
      normalizados = contratosDefaults()
    }

    modulosContrato.value = normalizados
  } catch (e) {
    notify.error('Erro ao carregar cláusulas.')
  }
}

async function carregarOrcamento() {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }
  try {
    const { data } = await api.get('/clausulas/ORCAMENTO')
    const lista = Array.isArray(data) ? data : []
    const normalizados = lista.map((m, idx) => ({
      id: m.id,
      modulo_key: m.modulo_key,
      titulo: m.titulo || m.modulo_key,
      texto: m.texto || '',
      ordem: typeof m.ordem === 'number' ? m.ordem : idx + 1,
    }))

    modulosOrcamento.value = normalizados
  } catch (e) {
    notify.error('Erro ao carregar cláusulas de orçamento.')
  }
}

async function salvarContrato() {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }

  salvando.value = true
  try {
    const origem = modulosContrato.value
    const payload = {
      modulos: origem.map((m, index) => ({
        id: m.id,
        modulo_key: m.modulo_key,
        titulo: m.titulo,
        texto: m.texto,
        ordem: typeof m.ordem === 'number' ? m.ordem : index + 1,
      })),
    }

    await api.put('/clausulas/CONTRATO', payload)
    notify.success('Cláusulas salvas com sucesso.')
  } catch (e) {
    const status = e?.response?.status
    const msg = e?.response?.data?.message
    if (status === 401) {
      notify.error('Sessão expirada ou não autorizada. Faça login novamente.')
    } else {
      notify.error(msg || 'Erro ao salvar cláusulas.')
    }
  } finally {
    salvando.value = false
  }
}

async function salvarOrcamento() {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }

  salvando.value = true
  try {
    const origem = modulosOrcamento.value
    const payload = {
      modulos: origem.map((m, index) => ({
        id: m.id,
        modulo_key: m.modulo_key,
        titulo: m.titulo,
        texto: m.texto,
        ordem: typeof m.ordem === 'number' ? m.ordem : index + 1,
      })),
    }

    await api.put('/clausulas/ORCAMENTO', payload)
    notify.success('Cláusulas de orçamento salvas com sucesso.')
  } catch (e) {
    const status = e?.response?.status
    const msg = e?.response?.data?.message
    if (status === 401) {
      notify.error('Sessão expirada ou não autorizada. Faça login novamente.')
    } else {
      notify.error(msg || 'Erro ao salvar cláusulas de orçamento.')
    }
  } finally {
    salvando.value = false
  }
}

function salvarAtual() {
  if (abaAtiva.value === 'ORCAMENTO') {
    salvarOrcamento()
  } else {
    salvarContrato()
  }
}

function restaurarTextosPadrao() {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }
  modulosContrato.value = contratosDefaults()
  notify.success('Textos padrão carregados. Clique em "Salvar Contrato" para gravar no sistema.')
}

onMounted(async () => {
  await carregarContrato()
})
</script>

