<template>
  <div class="w-full max-w-[1000px] mx-auto space-y-6 animate-page-in">
    <div class="rounded-2xl border border-border-ui bg-bg-card overflow-hidden">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

      <PageHeader
        title="Modelos de Cláusulas"
        subtitle="Textos padrão para Contratos"
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
          <!-- CONTRATO -->
          <div class="space-y-6">
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
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
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

const modulosContrato = ref([])

function contratosDefaults() {
  return [
    {
      id: undefined,
      modulo_key: 'CABECALHO',
      titulo: 'CONTRATO DE COMPRA E VENDA DE MERCADORIAS E PRESTAÇÃO DE SERVIÇOS',
      texto:
        'Pelo presente instrumento e na melhor forma de direito, de um lado, [[contratada_razao_social]], inscrita no CNPJ sob o nº [[contratada_cnpj]], com sede em [[contratada_endereco_completo]], neste ato representada por [[contratada_representante_nome]], [[contratada_representante_estado_civil]], portador(a) do RG [[contratada_representante_rg]] e inscrito(a) no CPF sob o nº [[contratada_representante_cpf]], doravante denominada simplesmente como CONTRATADA, e do outro lado, [[cliente_razao_social_ou_nome_completo]] inscrito no [[cliente_documento_tipo]] sob o nº [[cliente_documento_numero]], residente e domiciliado em [[cliente_endereco_completo]], doravante denominado simplesmente como CONTRATANTE, têm entre si ajustado o presente negócio de compra e venda de mercadorias e prestação de serviços, mediante as cláusulas e condições a seguir.',
      ordem: 1,
    },
    {
      id: undefined,
      modulo_key: 'OBJETO',
      titulo: 'CLÁUSULA PRIMEIRA: DO OBJETO',
      texto:
        'O objeto do presente contrato é a comercialização de móveis planejados e itens correlatos, descritos e caracterizados nos projetos anexos, previamente aprovados pelo CONTRATANTE. Os móveis serão fabricados e instalados nos ambientes descritos no orçamento e na venda vinculada a este contrato, considerando as medidas finais conferidas em obra.\n\nItem/Ambiente e Descritivo técnico:\n[[lista_itens_venda]]\n\nObs.: Todos os móveis terão estrutura em MDF Melamínico BP, acabamento interno [[acabamento_interno_padrao]], ferragens e puxadores conforme especificações dos projetos anexos, que integram o presente instrumento.',
      ordem: 2,
    },
    {
      id: undefined,
      modulo_key: 'PRECO_CONDICOES',
      titulo: 'CLÁUSULA SEGUNDA: DO PREÇO E DA CONDIÇÃO DE PAGAMENTO',
      texto:
        'O preço certo e ajustado entre as partes, quanto ao objeto do presente, é de [[valor_total_extenso]] ([[valor_total_numerico]]).\n\nForma de pagamento: [[descricao_forma_pagamento_contrato]].\n\nOs valores e condições acima descritos decorrem da venda nº [[venda_id]], vinculada ao orçamento nº [[orcamento_id]], que integra este contrato para todos os fins.',
      ordem: 3,
    },
    {
      id: undefined,
      modulo_key: 'PRAZO_ENTREGA',
      titulo: 'CLÁUSULA TERCEIRA: DO PRAZO DE ENTREGA DOS BENS',
      texto:
        'Fica acertado entre as partes que o prazo estimado para entrega e instalação dos bens, objeto deste contrato, será até [[data_prazo_entrega]].\n\nEm caso de atraso imotivado da CONTRATADA, incidirá sobre o valor do presente instrumento multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês sobre o valor total do serviço contratado, salvo casos fortuitos ou de força maior.\n\nO CONTRATANTE está ciente de que receberá apenas os produtos contratados, não sendo devida a inclusão de brindes ou móveis extras que não estejam descritos neste instrumento. O prazo de entrega passa a contar após a conferência das medidas finais do(s) ambiente(s) e confirmação das condições de pagamento.\n\nCaso a obra não esteja concluída no momento da assinatura, impossibilitando as medições finais, o prazo será automaticamente postergado, podendo haver atualização monetária dos valores.',
      ordem: 4,
    },
    {
      id: undefined,
      modulo_key: 'ARMAZENAGEM_DESISTENCIA',
      titulo: 'CLÁUSULA QUARTA: DA ARMAZENAGEM E DA DESISTÊNCIA',
      texto:
        'O CONTRATANTE declara-se ciente de que, a partir da assinatura deste contrato, inicia-se o processo de produção dos produtos, que são personalizados e feitos sob medida, não sendo possível sua revenda a terceiros.\n\nCaso haja impossibilidade de entrega por motivo imputável ao CONTRATANTE, a CONTRATADA poderá manter os produtos armazenados pelo prazo de até 5 (cinco) dias úteis sem cobrança. Após este prazo, incidirá multa diária de [[valor_armazenagem_dia]] por ambiente ou módulo, a ser paga integralmente antes da nova data de entrega.\n\nEm caso de abandono dos materiais por período superior a 6 (seis) meses contados da data prevista para entrega e/ou retirada, poderá ocorrer a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\nEm caso de desistência injustificada após a assinatura, fica estabelecido que o CONTRATANTE pagará à CONTRATADA multa compensatória de 20% (vinte por cento) do valor total do contrato, a título de ressarcimento de despesas com elaboração de projeto, administração e custos de produção já iniciados, sem prejuízo do ressarcimento de fretes e demais despesas comprovadas.',
      ordem: 5,
    },
    {
      id: undefined,
      modulo_key: 'GARANTIA',
      titulo: 'CLÁUSULA QUINTA: DA GARANTIA',
      texto:
        'A CONTRATADA concede garantia de [[prazo_garantia_anos]] anos sobre os móveis planejados fornecidos, contados a partir da data de entrega e instalação, abrangendo defeitos de fabricação e montagem, desde que respeitadas as condições de uso e conservação indicadas no Certificado de Garantia e Manual do Proprietário, que integram o presente instrumento.\n\nPara validade da garantia, é obrigatória a realização de revisão anual, destinada à verificação de regulagens, fixações, funcionamento de ferragens e do estado geral dos móveis.\n\nA primeira revisão anual será gratuita, devendo ser solicitada pelo CONTRATANTE em até 12 (doze) meses após a instalação. Revisões posteriores poderão ser cobradas conforme tabela vigente à época, a partir de [[valor_revisao_base]]. Peças e componentes eventualmente necessários não estão incluídos nesse valor e serão orçados à parte.\n\nNão estão cobertos pela garantia: desgaste natural de uso; danos ocasionados por infiltrações, umidade, calor excessivo, pragas (como cupins), mau uso, falta de manutenção, alterações no ambiente ou intervenções realizadas por terceiros não autorizados.',
      ordem: 6,
    },
    {
      id: undefined,
      modulo_key: 'SERVICOS',
      titulo: 'CLÁUSULA SEXTA: DOS SERVIÇOS',
      texto:
        'Pelo presente instrumento, o CONTRATANTE contrata a CONTRATADA para execução dos serviços de montagem, acabamento e entrega dos produtos descritos nos projetos negociados entre as partes, que ficam anexos a este contrato e dele fazem parte integrante.',
      ordem: 7,
    },
    {
      id: undefined,
      modulo_key: 'CONDICOES_GERAIS',
      titulo: 'CLÁUSULA SÉTIMA: DAS CONDIÇÕES GERAIS',
      texto:
        'As partes não assumem nenhuma responsabilidade por ajustes verbais fora das condições aqui estabelecidas. Qualquer condição excepcional deverá constar em adendo escrito e assinado por ambas as partes.\n\nO CONTRATANTE desde já autoriza seus familiares e/ou empregados a assinarem documentos comprobatórios da entrega das mercadorias.\n\nO local de entrega deverá estar apto a receber os móveis, com espaço livre para instalação. Reformas, pinturas e demais obras devem estar concluídas e o ambiente limpo. Caso a entrega seja remarcada por iniciativa do CONTRATANTE, ficará sujeita à nova programação de logística da CONTRATADA.\n\nA montagem somente será realizada após a conclusão de pontos elétricos, hidráulicos e de gás, conforme planta e cronogramas fornecidos. A CONTRATADA não se responsabiliza por danos decorrentes do descumprimento dessas condições.',
      ordem: 8,
    },
    {
      id: undefined,
      modulo_key: 'RESPONSABILIDADES',
      titulo: 'CLÁUSULA OITAVA: DAS RESPONSABILIDADES E OBRIGAÇÕES',
      texto:
        'A CONTRATADA não se responsabilizará pela instalação de tampos de granito, aço, inox, vidros, espelhos, cubas, pias, eletrodomésticos ou quaisquer outros materiais não fornecidos por ela, bem como por instalações elétricas, telefônicas, de TV, dados ou similares que não façam parte do escopo contratado.\n\nO CONTRATANTE se compromete a fornecer, até 7 (sete) dias úteis antes da data prevista de instalação, plantas elétricas, hidráulicas, de gás ou de quaisquer outros elementos não aparentes que possam ser danificados pela fixação dos móveis. Na ausência dessas informações, a CONTRATADA não se responsabiliza por danos decorrentes.\n\nÉ de responsabilidade do CONTRATANTE providenciar a retirada de molduras, rodapés ou qualquer outro acabamento que impeça a instalação dos móveis, salvo se diversamente ajustado em projeto.\n\nQuanto à montagem em paredes não convencionais (drywall ou similares), o CONTRATANTE declara-se ciente de que a responsabilidade pela resistência da estrutura é sua, não assumindo a CONTRATADA qualquer garantia quanto à capacidade de carga além do previsto nos projetos.',
      ordem: 9,
    },
    {
      id: undefined,
      modulo_key: 'IMAGEM',
      titulo: 'CLÁUSULA NONA: DA CESSÃO DE IMAGEM',
      texto:
        'O CONTRATANTE autoriza a CONTRATADA a utilizar imagens e vídeos dos ambientes mobiliados, exclusivamente para fins de divulgação de portfólio e campanhas publicitárias da CONTRATADA, em mídias online e off-line, observada a legislação de proteção de dados pessoais (Lei nº 13.709/2018 – LGPD), comprometendo-se a CONTRATADA a não expor dados sensíveis ou informações que possam comprometer a intimidade do CONTRATANTE.',
      ordem: 10,
    },
    {
      id: undefined,
      modulo_key: 'FORO',
      titulo: 'CLÁUSULA DÉCIMA: DO FORO',
      texto:
        'As partes elegem o Foro da Comarca de [[cidade_foro]]/[[estado_foro]], para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.\n\nE, por estarem justas e contratadas, assinam o presente instrumento em 2 (duas) vias de igual teor e forma, juntamente com duas testemunhas.\n\n[[cidade_data_assinatura]]\n\nCONTRATADA: [[contratada_razao_social]] – CNPJ [[contratada_cnpj]]\nCONTRATANTE: [[cliente_razao_social_ou_nome_completo]] – [[cliente_documento_tipo]] [[cliente_documento_numero]]',
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
    notify.error('Erro ao salvar cláusulas.')
  } finally {
    salvando.value = false
  }
}

function salvarAtual() {
  salvarContrato()
}

onMounted(async () => {
  await carregarContrato()
})
</script>

