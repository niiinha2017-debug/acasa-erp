import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { ClausulasService } from '../clausulas/clausulas.service';
import PDFKitDoc from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { renderHeaderA4Png } from '../pdf/render-header-a4';

@Injectable()
export class ContratosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clausulasService: ClausulasService,
  ) {}

  async listar() {
    return this.prisma.contratos.findMany({
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

  async criar(dto: CreateContratoDto) {
    let clienteId: number | null = null;

    if (dto.venda_id != null) {
      const venda = await this.prisma.vendas.findUnique({
        where: { id: dto.venda_id },
      });
      if (!venda) throw new NotFoundException('Venda não encontrada.');
      clienteId = venda.cliente_id;
    }

    if (!clienteId && dto.cliente_id != null) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: dto.cliente_id },
      });
      if (!cliente) throw new NotFoundException('Cliente não encontrado.');
      clienteId = cliente.id;
    }

    if (!clienteId) {
      throw new NotFoundException(
        'Cliente não informado. Vincule uma venda ou selecione o cliente.',
      );
    }

    return this.prisma.contratos.create({
      data: {
        cliente_id: clienteId,
        venda_id: dto.venda_id ?? null,
        numero: dto.numero,
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

  // =======================================
  // PDF
  // =======================================

  private readonly DEFAULT_TEXTOS_CONTRATO: Record<string, string> = {
    CABECALHO:
      'Pelo presente instrumento e na melhor forma de direito, de um lado, [[contratada_razao_social]], inscrita no CNPJ sob o nº [[contratada_cnpj]], com sede em [[contratada_endereco_completo]], neste ato representada por [[contratada_representante_nome]], [[contratada_representante_estado_civil]], portador(a) do RG [[contratada_representante_rg]] e inscrito(a) no CPF sob o nº [[contratada_representante_cpf]], doravante denominada simplesmente como CONTRATADA, e do outro lado, [[cliente_razao_social_ou_nome_completo]] inscrito no [[cliente_documento_tipo]] sob o nº [[cliente_documento_numero]], residente e domiciliado em [[cliente_endereco_completo]], doravante denominado simplesmente como CONTRATANTE, têm entre si ajustado o presente negócio de compra e venda de mercadorias e prestação de serviços, mediante as cláusulas e condições a seguir.',
    OBJETO:
      'O objeto do presente contrato é a comercialização de móveis planejados e itens correlatos, descritos e caracterizados nos projetos anexos, previamente aprovados pelo CONTRATANTE. Os móveis serão fabricados e instalados nos ambientes descritos no orçamento e na venda vinculada a este contrato, considerando as medidas finais conferidas em obra.\n\nItem/Ambiente e Descritivo técnico:\n[[lista_itens_venda]]\n\nObs.: Todos os móveis terão estrutura em MDF Melamínico BP, acabamento interno [[acabamento_interno_padrao]], ferragens e puxadores conforme especificações dos projetos anexos, que integram o presente instrumento.',
    PRECO_CONDICOES:
      'O preço certo e ajustado entre as partes, quanto ao objeto do presente, é de [[valor_total_extenso]] ([[valor_total_numerico]]).\n\nForma de pagamento: [[descricao_forma_pagamento_contrato]].\n\nOs valores e condições acima descritos decorrem da venda nº [[venda_id]], vinculada ao orçamento nº [[orcamento_id]], que integra este contrato para todos os fins.',
    PRAZO_ENTREGA:
      'Fica acertado entre as partes que o prazo estimado para entrega e instalação dos bens, objeto deste contrato, será até [[data_prazo_entrega]].\n\nEm caso de atraso imotivado da CONTRATADA, incidirá sobre o valor do presente instrumento multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês sobre o valor total do serviço contratado, salvo casos fortuitos ou de força maior.\n\nO CONTRATANTE está ciente de que receberá apenas os produtos contratados, não sendo devida a inclusão de brindes ou móveis extras que não estejam descritos neste instrumento. O prazo de entrega passa a contar após a conferência das medidas finais do(s) ambiente(s) e confirmação das condições de pagamento.\n\nCaso a obra não esteja concluída no momento da assinatura, impossibilitando as medições finais, o prazo será automaticamente postergado, podendo haver atualização monetária dos valores.',
    GARANTIA:
      'A CONTRATADA concede garantia de [[prazo_garantia_anos]] anos sobre os móveis planejados fornecidos, contados a partir da data de entrega e instalação, abrangendo defeitos de fabricação e montagem, desde que respeitadas as condições de uso e conservação indicadas no Certificado de Garantia e Manual do Proprietário, que integram o presente instrumento.\n\nPara validade da garantia, é obrigatória a realização de revisão anual, destinada à verificação de regulagens, fixações, funcionamento de ferragens e do estado geral dos móveis.\n\nA primeira revisão anual será gratuita, devendo ser solicitada pelo CONTRATANTE em até 12 (doze) meses após a instalação. Revisões posteriores poderão ser cobradas conforme tabela vigente à época, a partir de [[valor_revisao_base]]. Peças e componentes eventualmente necessários não estão incluídos nesse valor e serão orçados à parte.\n\nNão estão cobertos pela garantia: desgaste natural de uso; danos ocasionados por infiltrações, umidade, calor excessivo, pragas (como cupins), mau uso, falta de manutenção, alterações no ambiente ou intervenções realizadas por terceiros não autorizados.',
    SERVICOS:
      'Pelo presente instrumento, o CONTRATANTE contrata a CONTRATADA para execução dos serviços de montagem, acabamento e entrega dos produtos descritos nos projetos negociados entre as partes, que ficam anexos a este contrato e dele fazem parte integrante.',
    CONDICOES_GERAIS:
      'As partes não assumem nenhuma responsabilidade por ajustes verbais fora das condições aqui estabelecidas. Qualquer condição excepcional deverá constar em adendo escrito e assinado por ambas as partes.\n\nO CONTRATANTE desde já autoriza seus familiares e/ou empregados a assinarem documentos comprobatórios da entrega das mercadorias.\n\nO local de entrega deverá estar apto a receber os móveis, com espaço livre para instalação. Reformas, pinturas e demais obras devem estar concluídas e o ambiente limpo. Caso a entrega seja remarcada por iniciativa do CONTRATANTE, ficará sujeita à nova programação de logística da CONTRATADA.\n\nA montagem somente será realizada após a conclusão de pontos elétricos, hidráulicos e de gás, conforme planta e cronogramas fornecidos. A CONTRATADA não se responsabiliza por danos decorrentes do descumprimento dessas condições.',
    RESPONSABILIDADES:
      'A CONTRATADA não se responsabilizará pela instalação de tampos de granito, aço, inox, vidros, espelhos, cubas, pias, eletrodomésticos ou quaisquer outros materiais não fornecidos por ela, bem como por instalações elétricas, telefônicas, de TV, dados ou similares que não façam parte do escopo contratado.\n\nO CONTRATANTE se compromete a fornecer, até 7 (sete) dias úteis antes da data prevista de instalação, plantas elétricas, hidráulicas, de gás ou de quaisquer outros elementos não aparentes que possam ser danificados pela fixação dos móveis. Na ausência dessas informações, a CONTRATADA não se responsabiliza por danos decorrentes.\n\nÉ de responsabilidade do CONTRATANTE providenciar a retirada de molduras, rodapés ou qualquer outro acabamento que impeça a instalação dos móveis, salvo se diversamente ajustado em projeto.\n\nQuanto à montagem em paredes não convencionais (drywall ou similares), o CONTRATANTE declara-se ciente de que a responsabilidade pela resistência da estrutura é sua, não assumindo a CONTRATADA qualquer garantia quanto à capacidade de carga além do previsto nos projetos.',
    CESSAO_IMAGEM:
      'O CONTRATANTE autoriza a CONTRATADA a utilizar imagens e vídeos dos ambientes mobiliados, exclusivamente para fins de divulgação de portfólio e campanhas publicitárias da CONTRATADA, em mídias online e off-line, observada a legislação de proteção de dados pessoais (Lei nº 13.709/2018 – LGPD), comprometendo-se a CONTRATADA a não expor dados sensíveis ou informações que possam comprometer a intimidade do CONTRATANTE.',
    IMAGEM:
      'O CONTRATANTE autoriza a CONTRATADA a utilizar imagens e vídeos dos ambientes mobiliados, exclusivamente para fins de divulgação de portfólio e campanhas publicitárias da CONTRATADA, em mídias online e off-line, observada a legislação de proteção de dados pessoais (Lei nº 13.709/2018 – LGPD), comprometendo-se a CONTRATADA a não expor dados sensíveis ou informações que possam comprometer a intimidade do CONTRATANTE.',
    FORO:
      'As partes elegem o Foro da Comarca de [[cidade_foro]]/[[estado_foro]], para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.\n\nE, por estarem justas e contratadas, assinam o presente instrumento em 2 (duas) vias de igual teor e forma, juntamente com duas testemunhas.\n\n[[cidade_data_assinatura]]\n\nCONTRATADA: [[contratada_razao_social]] – CNPJ [[contratada_cnpj]]\nCONTRATANTE: [[cliente_razao_social_ou_nome_completo]] – [[cliente_documento_tipo]] [[cliente_documento_numero]]',
  };

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
    doc: PDFKitDoc,
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
      const descTexto = linhas.length ? linhas.join('\n') : '-';

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


    const primeiroPg = venda.pagamentos?.[0];
    const descFormaPagamento =
      contrato.descricao ||
      (primeiroPg
        ? `${String(primeiroPg.forma_pagamento_chave || '').toUpperCase()} em ${
            venda.pagamentos.length
          } parcela(s)`
        : '');

    const hoje = new Date();
    const dataAss = hoje.toLocaleDateString('pt-BR');

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

    const mapa: Record<string, string> = {
      cliente_razao_social_ou_nome_completo: String(nomeCliente),
      cliente_documento_tipo: docTipo,
      cliente_documento_numero: String(docNum),
      cliente_endereco_completo: enderecoCompleto,
      orcamento_id: orc?.id ? String(orc.id) : '',
      venda_id: venda?.id ? String(venda.id) : '',
      valor_total_numerico: valorTotalNumerico,
      valor_total_extenso: valorTotalNumerico, // simplificado
      // a lista de itens será renderizada como tabela, então não injetamos texto cru
      lista_itens_venda: '',
      descricao_forma_pagamento_contrato: descFormaPagamento,
      data_prazo_entrega: contrato.data_fim
        ? new Date(contrato.data_fim).toLocaleDateString('pt-BR')
        : '',
      cidade_foro: cliente.cidade || empresa?.cidade || 'Ribeirão Preto',
      estado_foro: cliente.estado || empresa?.uf || 'SP',
      cidade_data_assinatura: `${
        cliente.cidade || empresa?.cidade || 'Ribeirão Preto'
      }, ${dataAss}`,
      // Dados da empresa (configurações)
      contratada_razao_social: razaoSocial,
      contratada_cnpj: cnpj,
      contratada_endereco_completo: enderecoEmpresa,
      contratada_representante_nome: 'Julyana Oliveira Duarte',
      contratada_representante_estado_civil: 'Brasileira',
      contratada_representante_rg: '',
      contratada_representante_cpf: '417.541.888-18',
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

          if (titulo) {
            doc
              .font('Helvetica-Bold')
              .fontSize(11)
              .text(titulo, left, doc.y, { width: larguraTexto, align: 'left' });
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
            // após a descrição do objeto, renderiza a tabela de itens da venda
            this.renderTabelaItensVenda(doc, venda, left, right);
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
}
