import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { ClausulasService } from '../clausulas/clausulas.service';
import { MailService } from '../mail/mail.service';
import PDFKitDoc from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { createHash, randomBytes } from 'crypto';
import { renderHeaderA4Png } from '../pdf/render-header-a4';

@Injectable()
export class ContratosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clausulasService: ClausulasService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async listar(vendaId?: number) {
    const where = vendaId
      ? { venda_id: vendaId }
      : undefined;
    return this.prisma.contratos.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { cliente: true, venda: true },
    });
  }

  async buscarPorId(id: number) {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id },
      include: { cliente: true, venda: { include: { orcamento: true } } },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    return contrato;
  }

  /** Gera o próximo número de contrato no formato CONT-YYYY-NNN (ex.: CONT-2025-001). */
  private async proximoNumeroContrato(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `CONT-${ano}-`;
    const ultimos = await this.prisma.contratos.findMany({
      where: { numero: { startsWith: prefixo } },
      select: { numero: true },
      orderBy: { id: 'desc' },
      take: 1,
    });
    let proximo = 1;
    if (ultimos.length > 0) {
      const numPart = ultimos[0].numero.slice(prefixo.length);
      const n = parseInt(numPart, 10);
      if (!Number.isNaN(n)) proximo = n + 1;
    }
    return `${prefixo}${String(proximo).padStart(3, '0')}`;
  }

  async criar(dto: CreateContratoDto) {
    const venda = await this.prisma.vendas.findUnique({
      where: { id: dto.venda_id },
    });
    if (!venda) throw new NotFoundException('Venda não encontrada.');

    const numero =
      dto.numero?.trim() ? dto.numero.trim() : await this.proximoNumeroContrato();

    return this.prisma.contratos.create({
      data: {
        cliente_id: venda.cliente_id,
        venda_id: dto.venda_id,
        numero,
        descricao: dto.descricao ?? null,
        status: dto.status,
        valor: dto.valor,
        data_inicio: dto.data_inicio ? new Date(dto.data_inicio) : null,
        data_fim: dto.data_fim ? new Date(dto.data_fim) : null,
      },
      include: { cliente: true, venda: true },
    });
  }

  async atualizar(id: number, dto: UpdateContratoDto) {
    await this.buscarPorId(id);

    if (dto.venda_id !== undefined && dto.venda_id != null) {
      const venda = await this.prisma.vendas.findUnique({
        where: { id: dto.venda_id },
      });
      if (!venda) throw new NotFoundException('Venda não encontrada.');
    }

    return this.prisma.contratos.update({
      where: { id },
      data: {
        venda_id: dto.venda_id ?? undefined,
        numero: dto.numero,
        descricao: dto.descricao,
        status: dto.status,
        valor: dto.valor,
        data_inicio: dto.data_inicio ? new Date(dto.data_inicio) : undefined,
        data_fim: dto.data_fim ? new Date(dto.data_fim) : undefined,
      },
      include: { cliente: true, venda: true },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.prisma.contratos.delete({ where: { id } });
  }

  /**
   * Registra a assinatura do contrato (online): salva a imagem da assinatura e marca o contrato como VIGENTE.
   * Permite depois "Enviar para produção" na venda.
   */
  async assinar(
    id: number,
    dto: { data_assinatura?: string; assinatura_base64?: string },
  ) {
    const contrato = await this.buscarPorId(id);
    const dataAssinatura = dto.data_assinatura
      ? new Date(dto.data_assinatura)
      : new Date();

    let urlAssinatura: string | null = null;
    if (dto.assinatura_base64 && dto.assinatura_base64.trim()) {
      const base64 = dto.assinatura_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const dir = path.join(process.cwd(), 'uploads', 'contratos', 'assinaturas');
      fs.mkdirSync(dir, { recursive: true });
      const filename = `contrato_${id}_assinatura.png`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, buffer);
      urlAssinatura = `/uploads/contratos/assinaturas/${filename}`;

      const slotKey = 'ASSINATURA_CLIENTE';
      const existing = await this.prisma.arquivos.findUnique({
        where: {
          owner_type_owner_id_slot_key: {
            owner_type: 'CONTRATO',
            owner_id: id,
            slot_key: slotKey,
          },
        },
      });
      if (existing) {
        await this.prisma.arquivos.update({
          where: { id: existing.id },
          data: {
            url: urlAssinatura,
            filename,
            nome: 'Assinatura do contratante',
            mime_type: 'image/png',
            tamanho: buffer.length,
          },
        });
      } else {
        await this.prisma.arquivos.create({
          data: {
            owner_type: 'CONTRATO',
            owner_id: id,
            categoria: 'ASSINATURA_CLIENTE',
            slot_key: slotKey,
            url: urlAssinatura,
            filename,
            nome: 'Assinatura do contratante',
            mime_type: 'image/png',
            tamanho: buffer.length,
          },
        });
      }
    }

    return this.prisma.contratos.update({
      where: { id },
      data: {
        data_assinatura: dataAssinatura,
        status: 'VIGENTE',
      } as any,
      include: { cliente: true, venda: true },
    });
  }

  // =======================================
  // PDF
  // =======================================

  private readonly DEFAULT_TEXTOS_CONTRATO: Record<string, string> = {
    CABECALHO:
      'Pelo presente instrumento e na melhor forma de direito, de um lado, [[contratada_razao_social]], inscrita no CNPJ sob o nº [[contratada_cnpj]][[contratada_ie_frase]], com sede em [[contratada_endereco_completo]], neste ato representada por [[contratada_representante_nome]], [[contratada_representante_estado_civil]], portador(a) do RG [[contratada_representante_rg]] e inscrito(a) no CPF sob o nº [[contratada_representante_cpf]], doravante denominada simplesmente como CONTRATADA, e do outro lado, [[cliente_razao_social_ou_nome_completo]] inscrito no [[cliente_documento_tipo]] sob o nº [[cliente_documento_numero]][[cliente_ie_frase]], residente e domiciliado em [[cliente_endereco_completo]], doravante denominado simplesmente como CONTRATANTE, têm entre si ajustado o presente negócio de compra e venda de mercadorias e prestação de serviços, mediante as cláusulas e condições a seguir.',
    OBJETO:
      '§ Primeiro – O objeto do presente contrato é a comercialização de móveis, descritos e caracterizados nos projetos anexos, previamente aprovados por rubrica pelo CONTRATANTE. Os móveis serão entregues em [[cliente_endereco_completo]].\n\nItem/ambiente: Descritivo:\n[[lista_itens_venda]]\n\nO CONTRATANTE declara-se ciente de que a partir deste momento iniciou-se o processo de produção dos produtos acima adquiridos, e que eles foram projetados e personalizados exclusivamente para seu ambiente, não possibilitando a comercialização para com terceiros.\n\n§ Segundo – Fazem parte integrante do presente instrumento as vistas dos projetos que foram definidos e assinados pelas partes, segundo descrito na cláusula acima, elaborados conforme as medidas e dimensões dos ambientes. A CONTRATADA não se responsabiliza por alterações de medidas e projetos posteriores à assinatura dos pedidos e projetos negociados.\n\n§ Terceiro – Os eletrodomésticos, iluminação, vidros, espelhos, cubas de pias, granitos e demais acessórios constantes nos projetos e não descritos no primeiro parágrafo não fazem parte do escopo de fornecimento da CONTRATADA.',
    PRECO_CONDICOES:
      '§ Único – O preço certo e ajustado entre as partes, quanto ao objeto do presente, no valor de [[valor_total_numerico]] ([[valor_total_por_extenso]]).\n\nForma de pagamento quanto ao objeto do presente: [[descricao_forma_pagamento_contrato]].\n\nPara pagamento: [[contratada_dados_pagamento]].\n\nData da venda: [[data_venda]]. Os valores e condições acima descritos decorrem da venda nº [[venda_id]], vinculada ao orçamento nº [[orcamento_id]], que integra este contrato para todos os fins.',
    PRAZO_ENTREGA:
      '§ Primeiro – Fica acertado entre as partes que o prazo de entrega dos bens, objeto deste contrato, será entregue e instalado até o dia [[data_prazo_entrega_por_extenso]].\n\nParágrafo único. Em caso de atraso da CONTRATADA, deverá incidir sobre o valor do presente instrumento multa pecuniária de 20%, juros de 1% ao mês do valor total do serviço contratado.\n\n§ Segundo – O CONTRATANTE está ciente que receberá apenas os produtos contratados. Não sendo passível a inclusão de brindes e/ou presentes, móveis extras que não estejam descritos e relacionados neste instrumento.\n\n§ Terceiro – O CONTRATANTE também está ciente de que o prazo de entrega dos objetos do contrato é computado após a tirada das medidas finais do(s) ambiente(s). Caso a obra não esteja concluída no momento da assinatura do contrato, não sendo possível medi-las, o prazo será postergado, podendo acarretar alteração do prazo de entrega e correção monetária do valor deste instrumento.\n\n§ Quarto – O CONTRATANTE está ciente que precisa fornecer o(s) ambiente(s) em condições propícias para a entrega e instalação dos ambientes/móveis, ou seja, obra finalizada e ambiente limpo.\n\n§ Quinto – O CONTRATANTE está ciente de que, caso ocorra qualquer impossibilidade de entrega de seus móveis, fica estabelecido o prazo de 5 dias (úteis) para a CONTRATADA manter os produtos armazenados em espaço próprio. Ultrapassado este prazo, incidirá uma multa de [[valor_armazenagem_dia]] por dia (a cada ambiente) em que o móvel permanecer ocupando o espaço, sendo esse pago à vista um dia antes da entrega. Além disso, em caso de abandono dos materiais para além de 6 meses do prazo estipulado para a entrega e/ou retirada, ocorrerá a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\n§ Sexto – Este instrumento estabelece que qualquer alteração de projeto, sendo referente à forma construtiva do móvel e/ou troca de materiais, acarretará ajuste de valores a serem pagos pelo CONTRATANTE.\n\n§ Sétimo – Em caso de desistência, após a assinatura do presente instrumento, fica estabelecido o valor correspondente a 20% (vinte por cento) do valor do contrato para ressarcimento das despesas tidas com elaboração e/ou adequação de projetos, sem prejuízo do ressarcimento das despesas com frete e outras de caráter administrativo, relativas ao contrato ora firmado, servindo o contrato de título executivo extrajudicial. Fica autorizado à CONTRATADA a reter o valor acima do valor já pago, restituindo-se apenas a diferença.',
    ARMAZENAGEM_DESISTENCIA:
      'O CONTRATANTE declara-se ciente de que, a partir da assinatura deste contrato, inicia-se o processo de produção dos produtos, que são personalizados e feitos sob medida, não sendo possível sua revenda a terceiros.\n\nCaso haja impossibilidade de entrega por motivo imputável ao CONTRATANTE, a CONTRATADA poderá manter os produtos armazenados pelo prazo de até 5 (cinco) dias úteis sem cobrança. Após este prazo, incidirá multa diária de [[valor_armazenagem_dia]] por ambiente ou módulo, a ser paga integralmente antes da nova data de entrega.\n\nEm caso de abandono dos materiais por período superior a 6 (seis) meses contados da data prevista para entrega e/ou retirada, poderá ocorrer a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\nEm caso de desistência injustificada após a assinatura, fica estabelecido que o CONTRATANTE pagará à CONTRATADA multa compensatória de 20% (vinte por cento) do valor total do contrato, a título de ressarcimento de despesas com elaboração de projeto, administração e custos de produção já iniciados, sem prejuízo do ressarcimento de fretes e demais despesas comprovadas.',
    GARANTIA:
      '§ Primeiro – A CONTRATADA concede garantia de [[prazo_garantia_anos]] (cinco) anos sobre os móveis planejados fornecidos, contados a partir da data de entrega e instalação, abrangendo defeitos de fabricação e montagem, desde que respeitadas as condições de uso e conservação indicadas no Certificado de Garantia e Manual do Proprietário, que integram o presente instrumento e deverão ser lidos e rubricados no ato da assinatura.\n\n§ Segundo – Para a validade e manutenção da garantia, é obrigatória a realização de revisão anual, destinada à verificação de regulagens, fixações, funcionamento de ferragens e do estado geral dos móveis.\n\n§ Terceiro – A primeira revisão anual será gratuita, devendo ser solicitada pelo CONTRATANTE no prazo de até 12 (doze) meses após a instalação.\n\n§ Quarto – As revisões subsequentes poderão ser realizadas mediante agendamento prévio e serão cobradas conforme valores vigentes à época, sendo o valor a partir de [[valor_revisao_base]] (duzentos e cinquenta reais) por visita. Eventuais peças, materiais ou componentes que necessitem de substituição não estão inclusos nesse valor, sendo orçados e cobrados à parte, mediante aprovação do CONTRATANTE.\n\n§ Quinto – Não estão cobertos pela garantia o desgaste natural decorrente do uso, bem como danos ocasionados por agentes externos, tais como infiltrações de água, infestação de cupins ou similares, calor excessivo, contato prolongado com água ou umidade, além de oxidação ou ferrugem de partes metálicas, mau uso, falta de manutenção, umidade, infiltrações, alterações no ambiente ou intervenções realizadas por terceiros.',
    SERVICOS:
      '§ Único – Pelo presente instrumento, [[cliente_razao_social_ou_nome_completo]] contrata a empresa [[contratada_razao_social]] para a execução dos serviços de montagem, acabamento e entrega dos produtos, conforme os projetos negociados pelas partes e anexados ao presente instrumento.',
    CONDICOES_GERAIS:
      '§ Primeiro – As partes não assumem nenhuma responsabilidade por ajustes verbais fora das condições aqui estabelecidas e especificadas. Qualquer condição excepcional deverá constar, expressamente, em adendo a este instrumento.\n\n§ Segundo – O CONTRATANTE desde já autoriza seus familiares e/ou empregados a assinarem os documentos comprobatórios da entrega das mercadorias.\n\n§ Terceiro – Obrigações importantes ao cliente:\n\n• O local de entrega deverá estar apto a receber os móveis, e o espaço para instalação dos armários deverá estar vago. Em caso de reformas, elas deverão estar devidamente concluídas e os ambientes completamente limpos. Uma vez programada a entrega, se por qualquer motivo esta for alterada pelo cliente, ela terá que respeitar uma nova programação na logística da empresa, cuja data deverá ser agendada pela CONTRATADA. Os produtos serão entregues no seu local de destino para serem posteriormente montados pela equipe da CONTRATADA.\n\n• A montagem só poderá ser realizada após a obra estar totalmente concluída com: pontos elétricos, hidráulicos e de gás executados conforme a planta e cronogramas fornecidos pelo CONTRATANTE.\n\n• Desta forma, os serviços de instalação do mobiliário não serão iniciados caso não sejam cumpridos alguns dos itens citados neste parágrafo. Caso contrário, a CONTRATADA não se responsabiliza por possíveis danos que possam ocorrer aos produtos do CONTRATANTE.',
    RESPONSABILIDADES:
      '§ Primeiro – A CONTRATADA não se responsabilizará pelas instalações de tampos de granitos, aço, inox, ou qualquer outro material que não seja o especificado pelo projeto técnico. Bem como pelas instalações de telefones, interfones, antenas de TV ou qualquer outro aparelho que porventura possa ser instalado sem a prévia orientação de um profissional especializado e/ou técnico de sua área.\n\n§ Segundo – O CONTRATANTE se responsabiliza a fornecer no momento da assinatura do projeto ou em até 7 (sete) dias úteis antes da data prevista para instalação: plantas elétricas, hidráulicas, de gás ou de quaisquer outros materiais não aparentes que eventualmente possam ser danificados com a instalação; caso essas plantas não sejam fornecidas, a CONTRATADA não se responsabiliza por eventuais danos causados.\n\n§ Terceiro – A CONTRATADA isenta-se de qualquer responsabilidade sobre instalações elétricas fora a dos materiais por ela fornecidos. As equipes de instalação estão aptas apenas a aplicar as iluminações ao móvel; as instalações além desta condição são de responsabilidade do cliente.\n\n§ Quarto – Fica aos cuidados do CONTRATANTE a retirada de molduras de gesso, rodapés ou qualquer outro acabamento que interfira na instalação dos produtos, antes da entrega dos móveis; os técnicos estão aptos a prestar toda orientação necessária.\n\n§ Quinto – Qualquer alteração na obra realizada após as medições, que não tenham sido determinadas no projeto e afetem o mesmo, poderá gerar alterações no prazo de entrega e conclusão da montagem, além de novos custos, e serão de inteira responsabilidade do cliente.\n\n§ Sexto – A perfeita execução de seu projeto requer, durante a montagem, alguns ajustes de acabamento que poderão provocar resíduos e pó; além disso, as embalagens dos produtos após abertas geram volumes que ocupam espaços consideráveis.\n\n§ Sétimo – Após a conclusão da montagem, os técnicos estarão aptos a deslocá-los para locais previamente indicados pelo cliente e farão a limpeza dos resíduos resultantes da montagem e manutenção dos ambientes.\n\n§ Oitavo – Os mecanismos utilizados para fixação das peças junto a paredes, quando o caso, são dimensionados para sustentação das peças, não sendo aconselhável a colocação de pesos extras (tampos de granito ou mármore, pias, cubas, eletrodomésticos com peso excessivo e outros).\n\n§ Nono – Quanto à montagem dos projetos em paredes que não sejam de alvenaria padrão (não convencionais, drywall e outras), o fato deverá constar no presente contrato e projeto. Para providências específicas de montagem, acertamos que a CONTRATADA não assume a responsabilidade pela resistência das referidas paredes na viabilidade, execução e utilização do presente projeto.',
    CESSAO_IMAGEM:
      'Este instrumento estabelece a autorização do CONTRATANTE à CONTRATADA, aqui previamente descrita, a dispor de seus dados pessoais, conforme os artigos 7.º e 11.º da Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), e autoriza a utilização de sua imagem e/ou voz, de acordo com os parágrafos dispostos abaixo:\n\n§ Primeiro – O CONTRATANTE autoriza a CONTRATADA a realizar o tratamento, ou seja, a utilizar os dados relacionados à divulgação, em fotos e vídeo do mobiliário contratado, para finalidade de promoção da campanha publicitária de interesse da CONTRATADA, ocorrendo a divulgação no seu site e demais mídias, online e off-line, já existentes ou que venham a existir.\n\n§ Segundo – O CONTRATANTE autoriza que a CONTRATADA utilize a imagem para divulgação de campanha publicitária de seu interesse, adotando todas as medidas de proteção de dados, visando a preservação de seu direito à intimidade, coibindo o uso com finalidade distinta da prevista neste termo.',
    IMAGEM:
      'O CONTRATANTE autoriza a CONTRATADA a utilizar imagens e vídeos dos ambientes mobiliados, exclusivamente para fins de divulgação de portfólio e campanhas publicitárias da CONTRATADA, em mídias online e off-line, observada a legislação de proteção de dados pessoais (Lei nº 13.709/2018 – LGPD), comprometendo-se a CONTRATADA a não expor dados sensíveis ou informações que possam comprometer a intimidade do CONTRATANTE.',
    FORO:
      '§ Primeiro – As partes elegem o Foro desta cidade, [[cidade_foro]], [[estado_foro]], para dirimir quaisquer dúvidas decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.\n\n§ Segundo – Após a leitura do inteiro teor do presente contrato, as partes, estando de pleno acordo, subscrevem o presente instrumento em duas vias de igual teor e forma.\n\n[[cidade_data_assinatura]]',
  };

  /** Formata CNPJ para exibição: 12345678000199 -> 12.345.678/0001-99 */
  private maskCnpj(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (s.length !== 14) return String(val || '');
    return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`;
  }

  /** Formata CPF para exibição: 12345678901 -> 123.456.789-01 */
  private maskCpf(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (s.length !== 11) return String(val || '');
    return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
  }

  /** Formata RG para exibição: 439216916 -> 43.921.691-6 (até 9 dígitos) */
  private maskRg(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (!s.length) return String(val || '');
    if (s.length <= 8) {
      return s.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2');
    }
    const t = s.slice(0, 9);
    return `${t.slice(0, 2)}.${t.slice(2, 5)}.${t.slice(5, 8)}-${t.slice(8)}`;
  }

  /** Converte valor em reais para extenso (ex.: 48950.00 -> "quarenta e oito mil e novecentos e cinquenta reais") */
  private valorPorExtensoReais(valor: number): string {
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) return 'zero reais';
    const inteiro = Math.floor(n);
    const centavos = Math.round((n - inteiro) * 100);
    const U = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const U0 = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const D10 = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const esc = (x: number, useZero: boolean): string => {
      if (x === 0) return useZero ? 'zero' : '';
      const c = Math.floor(x / 100);
      const r = x % 100;
      const dezena = Math.floor(r / 10);
      const un = r % 10;
      const partC = c > 0 ? (c === 1 && r === 0 ? 'cem' : C[c]) : '';
      const partD = r < 10 ? (un > 0 ? U[un] : '') : r < 20 ? D10[r - 10] : (D[dezena] + (un > 0 ? ' e ' + U[un] : ''));
      const partes = [partC, partD].filter(Boolean);
      return partes.join(partC && partD ? ' e ' : '');
    };
    const mil = Math.floor(inteiro / 1000);
    const rest = inteiro % 1000;
    let reaisStr = '';
    if (mil > 0) {
      reaisStr = mil === 1 ? 'mil' : esc(mil, false) + ' mil';
      if (rest > 0) reaisStr += ' e ' + esc(rest, false);
    } else {
      reaisStr = esc(rest, true);
    }
    reaisStr = reaisStr.trim() || 'zero';
    reaisStr += inteiro === 1 ? ' real' : ' reais';
    if (centavos > 0) reaisStr += ' e ' + (centavos === 1 ? 'um centavo' : esc(centavos, false) + ' centavos');
    return reaisStr;
  }

  private substituirPlaceholders(texto: string, mapa: Record<string, string>): string {
    let out = String(texto || '');
    for (const [key, value] of Object.entries(mapa)) {
      const token = `[[${key}]]`;
      out = out.split(token).join(value ?? '');
    }
    return out;
  }

  private montarListaItensVenda(venda: any): string {
    const itens = venda?.itens && Array.isArray(venda.itens) ? venda.itens : [];
    if (!itens.length) return '-';
    return itens
      .map((it: any, idx: number) => {
        const nome = String(it.nome_ambiente || `Ambiente ${idx + 1}`).toUpperCase();
        const desc = String(it.descricao || '').trim();
        return `${idx + 1}. ${nome}\n${desc ? desc : ''}`.trim();
      })
      .join('\n\n');
  }

  private renderTabelaItensVenda(
    doc: any,
    venda: any,
    left: number,
    right: number,
  ) {
    const itens = venda?.itens && Array.isArray(venda.itens) ? venda.itens : [];
    if (!itens.length) return;

    const tableWidth = right - left;
    const colAmbW = 130;
    const colDescW = tableWidth - colAmbW;

    const margemInferior = 60;

    // Cabeçalho da tabela
    if (doc.y + 40 > doc.page.height - margemInferior) {
      doc.addPage();
      doc.y = renderHeaderA4Png(doc as any) + 20;
    }

    const headerY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#000')
      .text('Item/ ambiente:', left, headerY, { width: colAmbW })
      .text('Descritivo:', left + colAmbW, headerY, {
        width: colDescW,
        align: 'left',
      });

    doc.y = headerY + 16;
    doc
      .lineWidth(0.8)
      .strokeColor('#000')
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.y += 6;

    // Linhas da tabela
    for (const it of itens) {
      const ambiente = String(it.nome_ambiente || '-').toUpperCase();
      const descBase = String(it.descricao || '');
      const linhas = descBase
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter(Boolean)
        .map((l: string) => `• ${l}`);
      let descTexto = linhas.length ? linhas.join('\n') : '-';
      const obs = String(it.observacao || '').trim();
      if (obs) {
        descTexto = descTexto + (descTexto !== '-' ? '\n' : '') + 'Obs.: ' + obs;
      }

      doc.font('Helvetica-Bold').fontSize(10);
      const hAmb = doc.heightOfString(ambiente, { width: colAmbW });

      doc.font('Helvetica').fontSize(10);
      const hDesc = doc.heightOfString(descTexto, { width: colDescW });

      const rowH = Math.max(hAmb, hDesc);

      if (doc.y + rowH + margemInferior > doc.page.height) {
        // Nova página com header do relatório
        doc.addPage();
        doc.y = renderHeaderA4Png(doc as any) + 20;

        // Reimprime cabeçalho da tabela na nova página
        const hY = doc.y;
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#000')
          .text('Item/ ambiente:', left, hY, { width: colAmbW })
          .text('Descritivo:', left + colAmbW, hY, {
            width: colDescW,
            align: 'left',
          });

        doc.y = hY + 16;
        doc
          .lineWidth(0.8)
          .strokeColor('#000')
          .moveTo(left, doc.y)
          .lineTo(right, doc.y)
          .stroke();
        doc.y += 6;
      }

      const baseY = doc.y;

      // Coluna ambiente (centralizado verticalmente)
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(ambiente, left, baseY, {
          width: colAmbW,
          align: 'center',
        });

      // Coluna descritivo (bullets)
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(descTexto, left + colAmbW + 6, baseY, {
          width: colDescW - 6,
          align: 'left',
        });

      doc.y = baseY + rowH + 6;

      // Linha separadora
      doc
        .lineWidth(0.4)
        .strokeColor('#CCCCCC')
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .stroke();
      doc.y += 6;
    }

    doc.y += 8;
  }

  private renderCamposAssinatura(
    doc: any,
    left: number,
    right: number,
    larguraTexto: number,
    mapa: Record<string, string>,
  ): void {
    const lineW = Math.min(260, larguraTexto * 0.6);
    const lineYOffset = 6;
    const spacing = 18;
    const razao = mapa.contratada_razao_social || 'CONTRATADA';
    const cnpj = mapa.contratada_cnpj || '';
    const representante = mapa.contratada_representante_nome || '';
    const cpfContratada = mapa.contratada_representante_cpf || '';
    const clienteNome = mapa.cliente_razao_social_ou_nome_completo || 'CONTRATANTE';
    const docTipo = mapa.cliente_documento_tipo || 'CPF';
    const docNum = mapa.cliente_documento_numero || '';

    doc.y += spacing;

    const drawCienteBlock = (titulo: string, linhas: string[]) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text(titulo, left, doc.y, { width: larguraTexto });
      doc.y += doc.currentLineHeight() + 2;
      doc
        .lineWidth(0.5)
        .strokeColor('#000')
        .moveTo(left, doc.y + lineYOffset)
        .lineTo(left + lineW, doc.y + lineYOffset)
        .stroke();
      doc.y += lineYOffset + 8;
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      for (const ln of linhas) {
        doc.text(ln, left, doc.y, { width: larguraTexto });
        doc.y += doc.currentLineHeight() + 2;
      }
      doc.y += spacing;
    };

    drawCienteBlock('Ciente:', [
      `CONTRATADA: ${razao}`,
      `CNPJ: ${cnpj}`,
      representante ? `REPRESENTANTE LEGAL: ${representante}` : '',
      cpfContratada ? `CPF: ${cpfContratada}` : '',
    ].filter(Boolean));

    drawCienteBlock('Ciente:', [
      `CONTRATANTE: ${clienteNome}`,
      `${docTipo}: ${docNum}`,
    ].filter(Boolean));

    const drawLinhaTestemunha = (label: string) => {
      doc.font('Helvetica').fontSize(9).fillColor('#333').text(label, left, doc.y, { width: larguraTexto });
      doc.y += doc.currentLineHeight() + 2;
      doc
        .lineWidth(0.5)
        .strokeColor('#000')
        .moveTo(left, doc.y + lineYOffset)
        .lineTo(left + lineW, doc.y + lineYOffset)
        .stroke();
      doc.y += lineYOffset + 14;
    };

    drawLinhaTestemunha('Testemunha 1');
    drawLinhaTestemunha('Testemunha 2');
  }

  private async gerarContratoPdfBuffer(contratoId: number): Promise<Buffer> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      include: {
        cliente: true,
        venda: {
          include: {
            itens: true,
            pagamentos: true,
            orcamento: { include: { itens: true } },
          },
        },
      },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');

    const modulos = await this.clausulasService.buscarOuCriarPorTipo('CONTRATO');

    const cliente: any = contrato.cliente || {};
    const venda: any = contrato.venda || {};
    const orc: any = venda.orcamento || {};

    const nomeCliente =
      cliente.nome_completo || cliente.razao_social || cliente.nome || `CLIENTE #${cliente.id}`;
    const docTipo = cliente.cnpj ? 'CNPJ' : 'CPF';
    const docNum = cliente.cnpj || cliente.cpf || '';

    const endPartes = [
      cliente.endereco,
      cliente.numero ? `Nº ${cliente.numero}` : null,
      cliente.complemento ? `(${cliente.complemento})` : null,
      cliente.bairro ? `Bairro: ${cliente.bairro}` : null,
      cliente.cidade ? `${cliente.cidade}${cliente.estado ? ' - ' + cliente.estado : ''}` : null,
      cliente.cep ? `CEP: ${cliente.cep}` : null,
    ].filter(Boolean);

    const enderecoCompleto = endPartes.join(' - ') || '-';

    const valorTotal = Number(contrato.valor || venda.valor_vendido || venda.valor_total || 0);
    const valorTotalNumerico = valorTotal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });


    const TZ_BR = 'America/Sao_Paulo';
    /** Evita dia errado: datas "só dia" (meia-noite UTC) viram dia anterior no Brasil; normaliza para meio-dia UTC. */
    const normalizarDataParaExibicao = (dt: Date): Date => {
      if (dt.getUTCHours() === 0 && dt.getUTCMinutes() === 0 && dt.getUTCSeconds() === 0) {
        const d = new Date(dt);
        d.setUTCHours(12, 0, 0, 0);
        return d;
      }
      return dt;
    };
    const formatarDataLocal = (d: Date | string | null | undefined): string => {
      if (!d) return '';
      try {
        let dt: Date;
        if (typeof d === 'string') {
          const s = String(d).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [y, m, day] = s.split('T')[0].split('-').map(Number);
            dt = new Date(Date.UTC(y, m - 1, day, 12, 0, 0, 0));
          } else {
            dt = new Date(d);
          }
        } else {
          dt = d;
        }
        if (Number.isNaN(dt.getTime())) return '';
        dt = normalizarDataParaExibicao(dt);
        return dt.toLocaleDateString('pt-BR', { timeZone: TZ_BR });
      } catch {
        return '';
      }
    };

    const LABEL_FORMA_PAGAMENTO: Record<string, string> = {
      CREDITO: 'Cartão de crédito',
      DEBITO: 'Cartão de débito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
      DINHEIRO: 'Dinheiro',
      CHEQUE: 'Cheque',
      TRANSFERENCIA: 'Transferência bancária',
    };
    const pagamentos = Array.isArray(venda.pagamentos) ? venda.pagamentos : [];
    const primeiroPg = pagamentos[0];
    const labelForma = (chave: string) =>
      LABEL_FORMA_PAGAMENTO[String(chave || '').toUpperCase()] || String(chave || '').toUpperCase();
    // No contrato: só "18x de R$ 3.000,00" (forma + total); o detalhe por parcela/data fica no contas a receber
    const valorTotalPagamentos = (pagamentos as any[]).reduce((acc, p) => acc + Number(p?.valor ?? 0), 0);
    const valorTotalStr = valorTotalPagamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let descFormaPagamento =
      contrato.descricao ||
      (primeiroPg
        ? `${labelForma(primeiroPg.forma_pagamento_chave)} em ${pagamentos.length} parcela(s). Valor total: ${valorTotalStr}`
        : '');

    const hoje = new Date();
    const dataAss = hoje.toLocaleDateString('pt-BR', { timeZone: TZ_BR });
    const dia = hoje.toLocaleString('pt-BR', { timeZone: TZ_BR, day: 'numeric' });
    const mes = hoje.toLocaleString('pt-BR', { timeZone: TZ_BR, month: 'long' });
    const ano = hoje.toLocaleString('pt-BR', { timeZone: TZ_BR, year: 'numeric' });
    const dataPorExtenso = `${dia} de ${mes} de ${ano}.`;

    const empresa = await this.prisma.empresa.findUnique({ where: { id: 1 } });

    const razaoSocial = empresa?.razao_social || 'A Casa Móveis Planejados';
    const cnpj =
      empresa?.cnpj || '28.638.791/0001-07';
    const enderecoEmpresaPartes = [
      empresa?.logradouro,
      empresa?.numero ? `Nº ${empresa.numero}` : null,
      empresa?.bairro ? `Bairro: ${empresa.bairro}` : null,
      empresa?.cidade ? `${empresa.cidade}${empresa.uf ? ' - ' + empresa.uf : ''}` : null,
    ].filter(Boolean);
    const enderecoEmpresa =
      enderecoEmpresaPartes.length > 0
        ? enderecoEmpresaPartes.join(' - ')
        : 'Rua Javari, 3358 - Ribeirão Preto - SP';

    const clienteIe = cliente?.ie ?? '';
    const clienteIeFrase =
      docTipo === 'CNPJ' && clienteIe
        ? `, inscrito na Inscrição Estadual sob o nº ${String(clienteIe).trim()}`
        : '';

    const mapa: Record<string, string> = {
      cliente_razao_social_ou_nome_completo: String(nomeCliente),
      cliente_documento_tipo: docTipo,
      cliente_documento_numero: String(docNum),
      cliente_ie: clienteIe,
      cliente_ie_frase: clienteIeFrase,
      cliente_endereco_completo: enderecoCompleto,
      orcamento_id: orc?.id ? String(orc.id) : '',
      venda_id: venda?.id ? String(venda.id) : '',
      valor_total_numerico: valorTotalNumerico,
      valor_total_extenso: valorTotalNumerico,
      valor_total_por_extenso: this.valorPorExtensoReais(valorTotal),
      lista_itens_venda: '', // itens só na tabela abaixo (evita duplicar com a tabela Item/ambiente e Descritivo)
      descricao_forma_pagamento_contrato: descFormaPagamento,
      data_venda: venda?.data_venda ? formatarDataLocal(venda.data_venda) : '',
      data_prazo_entrega: contrato.data_fim ? formatarDataLocal(contrato.data_fim) : '',
      data_prazo_entrega_por_extenso: contrato.data_fim
        ? (() => {
            try {
              let d = new Date(contrato.data_fim);
              if (Number.isNaN(d.getTime())) return '';
              d = normalizarDataParaExibicao(d);
              return d.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: TZ_BR,
              });
            } catch {
              return '';
            }
          })()
        : '',
      cidade_foro: cliente.cidade || empresa?.cidade || 'Ribeirão Preto',
      estado_foro: cliente.estado || empresa?.uf || 'SP',
      cidade_data_assinatura: `${
        cliente.cidade || empresa?.cidade || 'Ribeirão Preto'
      }, ${dataPorExtenso}`,
      // Representante: venda (se preenchido) ou cadastro da empresa
      contratada_razao_social: razaoSocial,
      contratada_cnpj: this.maskCnpj(empresa?.cnpj ?? cnpj),
      contratada_ie: empresa?.ie ?? '',
      contratada_ie_frase: empresa?.ie
        ? `, inscrita na Inscrição Estadual sob o nº ${String(empresa.ie).trim()}`
        : '',
      contratada_endereco_completo: enderecoEmpresa,
      contratada_representante_nome:
        (venda?.representante_venda_nome?.trim() && venda?.representante_venda_cpf?.trim())
          ? venda.representante_venda_nome.trim()
          : (empresa?.representante_legal_nome ?? ''),
      contratada_representante_estado_civil:
        (venda?.representante_venda_nome?.trim() && venda?.representante_venda_cpf?.trim())
          ? 'Brasileira'
          : (empresa?.representante_estado_civil ?? 'Brasileira'),
      contratada_representante_rg:
        (venda?.representante_venda_nome?.trim() && venda?.representante_venda_cpf?.trim())
          ? this.maskRg(venda.representante_venda_rg) || ''
          : this.maskRg(empresa?.representante_legal_rg) || '',
      contratada_representante_cpf:
        (venda?.representante_venda_nome?.trim() && venda?.representante_venda_cpf?.trim())
          ? this.maskCpf(venda.representante_venda_cpf) || ''
          : this.maskCpf(empresa?.representante_legal_cpf ?? '') || '',
      // Dados para pagamento (cadastro da empresa)
      contratada_pix: empresa?.pix ?? '',
      contratada_banco_titular: empresa?.banco_titular ?? '',
      contratada_banco_nome: empresa?.banco_nome ?? '',
      contratada_banco_agencia: empresa?.banco_agencia ?? '',
      contratada_banco_conta: empresa?.banco_conta ?? '',
      contratada_dados_pagamento: [
        empresa?.pix ? `PIX CNPJ ${this.maskCnpj(empresa?.cnpj ?? '')} ${empresa?.banco_titular || empresa?.representante_legal_nome || ''}` : null,
        empresa?.banco_nome && empresa?.banco_agencia && empresa?.banco_conta
          ? `transferência bancária ${empresa.banco_nome} Agência ${empresa.banco_agencia} Conta ${empresa.banco_conta}${empresa.banco_titular ? ' – ' + empresa.banco_titular : ''}`
          : null,
      ].filter(Boolean).join(' ou '),
      prazo_garantia_anos: '5',
      valor_revisao_base: 'R$ 250,00',
      valor_armazenagem_dia: 'R$ 100,00',
      acabamento_interno_padrao: 'Branco TX (MDF BP 15mm)',
    };

    const doc = new PDFKitDoc({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const left = 40;
        const right = doc.page.width - 40;
        const larguraTexto = right - left;

        const startY = renderHeaderA4Png(doc as any);
        doc.y = startY + 20;

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .text('CONTRATO DE COMPRA E VENDA DE MERCADORIAS E PRESTAÇÃO DE SERVIÇOS', left, doc.y, {
            width: larguraTexto,
            align: 'center',
          });
        doc.y += 24;

        for (const mod of modulos) {
          const titulo = String(mod.titulo || '').trim();
          const key = String((mod as any).modulo_key || '').toUpperCase();
          let textoBruto = this.substituirPlaceholders(String(mod.texto || ''), mapa);
          if (!textoBruto && this.DEFAULT_TEXTOS_CONTRATO[key]) {
            textoBruto = this.substituirPlaceholders(
              this.DEFAULT_TEXTOS_CONTRATO[key],
              mapa,
            );
          }
          const texto = String(textoBruto || '').trim();
          if (!titulo && !texto) continue;

          if (doc.y + 80 > doc.page.height - 60) {
            doc.addPage();
            doc.y = renderHeaderA4Png(doc as any) + 20;
          }

          if (key === 'FORO') {
            doc.addPage();
            doc.y = renderHeaderA4Png(doc as any) + 20;
          }

          if (titulo) {
            doc
              .font('Helvetica-Bold')
              .fontSize(11)
              .text(titulo, left, doc.y, { width: larguraTexto, align: 'center' });
            doc.y += doc.currentLineHeight() + 4;
          }

          if (texto) {
            doc
              .font('Helvetica')
              .fontSize(10)
              .text(texto, left, doc.y, {
                width: larguraTexto,
                align: 'justify',
              });
            doc.y += 10;
          }

          if (key === 'OBJETO') {
            this.renderTabelaItensVenda(doc, venda, left, right);
            doc.addPage();
            doc.y = renderHeaderA4Png(doc as any) + 20;
          }

          if (key === 'FORO' && texto) {
            this.renderCamposAssinatura(doc, left, right, larguraTexto, mapa);
          }

          doc.y += 8;
        }

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  async gerarPdfESalvar(contratoId: number) {
    const pdfBuffer = await this.gerarContratoPdfBuffer(contratoId);

    const dir = path.join(process.cwd(), 'uploads', 'relatorios');
    fs.mkdirSync(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = randomBytes(6).toString('hex');
    const filename = `contrato_${contratoId}_${stamp}_${rand}.pdf`;

    fs.writeFileSync(path.join(dir, filename), pdfBuffer);

    const url = `/uploads/relatorios/${filename}`;

    const arquivo = await this.prisma.arquivos.create({
      data: {
        owner_type: 'CONTRATO',
        owner_id: contratoId,
        categoria: 'RELATORIO',
        slot_key: null,
        url,
        filename,
        nome: `CONTRATO #${contratoId}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      },
      select: { id: true },
    });

    return { arquivoId: arquivo.id };
  }

  /**
   * Retorna o buffer do PDF do contrato (para uso em link público).
   */
  async obterPdfBuffer(contratoId: number): Promise<Buffer> {
    return this.gerarContratoPdfBuffer(contratoId);
  }

  /**
   * Gera um link público temporário (24h) para download do PDF do contrato.
   * Útil para enviar por WhatsApp/e-mail manualmente.
   */
  /** Gera token curto (8 caracteres) para URL. */
  private gerarShortToken(): string {
    return randomBytes(4).toString('hex');
  }

  /**
   * Resolve token da URL: se for token curto (até 12 chars, sem ponto), busca no banco;
   * senão trata como JWT. Retorna contratoId e o token a usar na URL (para montar linkPdf).
   */
  private async resolveTokenPublico(token: string): Promise<{ contratoId: number; tokenParaUrl: string }> {
    const isShort = token.length <= 12 && !token.includes('.');
    if (isShort) {
      const now = new Date();
      const row = await this.prisma.contratos_link_publico.findFirst({
        where: { short_token: token, expira_em: { gt: now } },
        select: { contrato_id: true },
      });
      if (!row) throw new BadRequestException('Link inválido ou expirado.');
      return { contratoId: row.contrato_id, tokenParaUrl: token };
    }
    const payload = await this.jwt.verifyAsync(token).catch(() => null);
    if (!payload || payload?.purpose !== 'pdf-link' || !payload?.contratoId) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    return { contratoId: payload.contratoId, tokenParaUrl: token };
  }

  async obterLinkPublicoPdf(contratoId: number, baseUrl: string): Promise<{ link: string; linkAceitar?: string; linkPdf?: string; token: string; expiraEm: string }> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: { id: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let shortToken = this.gerarShortToken();
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        await this.prisma.contratos_link_publico.create({
          data: {
            short_token: shortToken,
            contrato_id: contratoId,
            expira_em: expiraEm,
          },
        });
        break;
      } catch (e: any) {
        if (e?.code === 'P2002' && tentativa < 4) {
          shortToken = this.gerarShortToken();
          continue;
        }
        throw e;
      }
    }
    const urlBase = (baseUrl || '').replace(/\/+$/, '');
    const linkPdf = `${urlBase}/api/contratos-publico/${shortToken}/pdf`;
    const baseAceite = (this.config.get<string>('CONTRATO_ACEITE_BASE_URL') || process.env.CONTRATO_ACEITE_BASE_URL || '').trim();
    const linkAceitar = baseAceite ? `${baseAceite.replace(/\/+$/, '')}/aceitar/${shortToken}` : undefined;
    const link = linkAceitar || linkPdf;
    return {
      link,
      linkAceitar,
      linkPdf: linkAceitar ? linkPdf : undefined,
      token: shortToken,
      expiraEm: expiraEm.toISOString(),
    };
  }

  /**
   * Envia o link do contrato por e-mail usando o SMTP configurado no .env.
   * O e-mail é enviado automaticamente pelo sistema (não abre o cliente de e-mail).
   */
  async enviarContratoPorEmail(contratoId: number, baseUrl: string): Promise<{ ok: true }> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      include: { cliente: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const cliente = contrato.cliente as any;
    const email = (cliente?.email ?? cliente?.email_secundario ?? '').trim();
    if (!email) throw new BadRequestException('Cliente não possui e-mail cadastrado.');
    const { link } = await this.obterLinkPublicoPdf(contratoId, baseUrl);
    const nomeCliente = cliente?.nome_completo || cliente?.razao_social || cliente?.nome || 'Cliente';
    await this.mail.enviarContratoLink(email, nomeCliente, link);
    return { ok: true };
  }

  /**
   * Valida o token do link público e retorna o buffer do PDF (rota pública, sem auth).
   */
  async getPdfBufferPorTokenPublico(token: string): Promise<{ buffer: Buffer; numero: string }> {
    const { contratoId } = await this.resolveTokenPublico(token);
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: { id: true, numero: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const buffer = await this.gerarContratoPdfBuffer(contrato.id);
    return { buffer, numero: String(contrato.numero || contrato.id) };
  }

  /**
   * Retorna informações do contrato para a página de aceite (rota pública).
   */
  async getInfoPorTokenPublico(token: string, baseUrl: string): Promise<{ numero: string; nomeCliente: string; linkPdf: string }> {
    const { contratoId, tokenParaUrl } = await this.resolveTokenPublico(token);
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      include: { cliente: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const nomeCliente = (contrato.cliente as any)?.nome_completo || (contrato.cliente as any)?.razao_social || 'Contratante';
    const urlBase = (baseUrl || '').replace(/\/+$/, '');
    const linkPdf = `${urlBase}/api/contratos-publico/${tokenParaUrl}/pdf`;
    return {
      numero: String(contrato.numero || contrato.id),
      nomeCliente,
      linkPdf,
    };
  }

  /**
   * Registra o aceite do contrato (rota pública). Grava em assinaturas_log e atualiza status para VIGENTE.
   */
  async registrarAceite(
    token: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ success: true; numero: string }> {
    const { contratoId } = await this.resolveTokenPublico(token);
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: { id: true, numero: true, status: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const { buffer } = await this.getPdfBufferPorTokenPublico(token);
    const hashDocumento = createHash('sha256').update(buffer).digest('hex');
    await this.prisma.assinaturas_log.create({
      data: {
        contrato_id: contrato.id,
        ip_address: ipAddress ?? null,
        dispositivo: userAgent ?? null,
        hash_documento: hashDocumento,
        metodo_verificacao: 'Aceite via Link WhatsApp/SMS',
      },
    });
    await this.prisma.contratos.update({
      where: { id: contrato.id },
      data: { status: 'VIGENTE', data_assinatura: new Date() } as any,
    });
    return { success: true, numero: String(contrato.numero || contrato.id) };
  }
}
