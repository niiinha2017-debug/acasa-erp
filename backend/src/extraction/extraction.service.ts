import { Injectable, Logger } from '@nestjs/common';
// pdf-parse exporta { PDFParse } — uso: new PDFParse({ data: buffer }) → load() → getText() → { text, total }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');
const pdfParse = async (buf: Buffer): Promise<{ text: string; numpages: number }> => {
  const instance = new PDFParse({ data: buf });
  await instance.load();
  const result: { text: string; total: number } = await instance.getText();
  return { text: result.text ?? '', numpages: result.total ?? 0 };
};
import * as mammoth from 'mammoth';

// ─── Resultado da extração ────────────────────────────────────────────────────

export interface EnderecoPartes {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

export interface AmbienteItem {
  nome: string;    // ex: "Cozinha"
  valor: number;   // ex: 8500.00 — 0 se não encontrado
}

export interface ParcelaPagamento {
  valor: number;
  forma: string;           // PIX | CHEQUE | CARTAO | BOLETO | TRANSFERENCIA | DINHEIRO
  vencimento: string | null; // ISO "2026-02-06"
  descricao: string;       // texto original da parcela
}

export interface DadosExtraidos {
  nomeCliente: string | null;
  cpfCnpj: string | null;
  valorTotal: number | null;
  dataFechamento: string | null;    // ISO: "2026-01-30"
  dataEntrega: string | null;       // ISO se encontrado
  endereco_cliente: string | null;  // endereço residencial/cadastro (string completa)
  endereco_cliente_partes: EnderecoPartes | null; // campos separados
  endereco_entrega: string | null;  // endereço do imóvel/obra (entrega)
  telefone: string | null;
  contato_nome: string | null;      // nome do contato (ex: "Catharina") separado do telefone
  parcelas: ParcelaPagamento[];         // parcelas extraídas do contrato
  ambientes: string[];                  // ex: ["Cozinha", "Sala", "Dormitório"]
  ambientes_com_valor: AmbienteItem[];  // ambientes com valor individual (do orçamento)
  texto_bruto: string;
  alertas: string[];
}

export interface ResultadoArquivo {
  nome_original: string;
  mime_type: string;
  tipo: 'PDF' | 'DOCX' | 'IMAGEM' | 'OUTRO';
  dados: DadosExtraidos | null;     // null para imagens
  erro: string | null;
}

export interface ResultadoExtracao {
  arquivos: ResultadoArquivo[];
  consolidado: DadosExtraidos;
  divergencias: string[];
}

// ─── Meses em português ───────────────────────────────────────────────────────

const MESES: Record<string, string> = {
  janeiro: '01', fevereiro: '02', março: '03', marco: '03',
  abril: '04', maio: '05', junho: '06', julho: '07',
  agosto: '08', setembro: '09', outubro: '10',
  novembro: '11', dezembro: '12',
};

// ─── Nomes/fragmentos que identificam o CONTRATADO (empresa) — nunca são cliente ─
const NOMES_EMPRESA = [
  'A CASA PLANEJADOS',
  'ACASA PLANEJADOS',
  'A CASA MÓVEIS',
  'A CASA MOVEIS',
  'LTDA',
  'EIRELI',
  'ME ',
  'S/A',
  'SA ',
];

const MARCADORES_EMPRESA_ENDERECO = [
  'CONTRATADA',
  'FÁBRICA',
  'FABRICA',
  'INDÚSTRIA',
  'INDUSTRIA',
  'SHOWROOM',
  'MARCENARIA',
];

// ─── Ambientes conhecidos em móveis planejados ────────────────────────────────

const AMBIENTES_CONHECIDOS = [
  'Cozinha', 'Copa', 'Sala', 'Quarto', 'Dormitório', 'Dormitorio',
  'Home', 'Escritório', 'Escritorio', 'Banheiro', 'Lavabo',
  'Área de Serviço', 'Area de Servico', 'Area de Serviço', 'Despensa', 'Garagem',
  'Closet', 'Hall', 'Varanda', 'Sacada',
  'Suite', 'Suíte', 'Master', 'Gourmet', 'Area Gourmet', 'Área Gourmet',
  'WC', 'Lavanderia', 'Corredor', 'Entrada', 'Rack', 'Painel',
];

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  // ─── Entry point principal ───────────────────────────────────────────────

  async extrairDosArquivos(
    files: Express.Multer.File[],
  ): Promise<ResultadoExtracao> {
    const resultados: ResultadoArquivo[] = [];

    for (const file of files) {
      const resultado = await this.processarArquivo(file);
      resultados.push(resultado);
    }

    const consolidado = this.consolidar(resultados);
    const divergencias = this.detectarDivergencias(resultados, consolidado);

    return { arquivos: resultados, consolidado, divergencias };
  }

  // ─── Processamento individual ────────────────────────────────────────────

  private async processarArquivo(
    file: Express.Multer.File,
  ): Promise<ResultadoArquivo> {
    const mime = file.mimetype.toLowerCase();
    const nome = file.originalname;

    if (mime === 'application/pdf') {
      return this.processarPdf(file);
    }

    if (
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword' ||
      nome.toLowerCase().endsWith('.docx') ||
      nome.toLowerCase().endsWith('.doc')
    ) {
      return this.processarDocx(file);
    }

    if (mime.startsWith('image/')) {
      return {
        nome_original: nome,
        mime_type: mime,
        tipo: 'IMAGEM',
        dados: null,
        erro: null,
      };
    }

    return {
      nome_original: nome,
      mime_type: mime,
      tipo: 'OUTRO',
      dados: null,
      erro: 'Tipo de arquivo não suportado para extração de texto.',
    };
  }

  // ─── PDF ─────────────────────────────────────────────────────────────────

  private async processarPdf(
    file: Express.Multer.File,
  ): Promise<ResultadoArquivo> {
    try {
      const result = await pdfParse(file.buffer);
      const texto = result.text ?? '';
      return {
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tipo: 'PDF',
        dados: this.extrairDados(texto),
        erro: null,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao parsear PDF "${file.originalname}": ${err.message}`);
      return {
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tipo: 'PDF',
        dados: null,
        erro: `Falha ao ler o PDF: ${err.message}`,
      };
    }
  }

  // ─── DOCX ────────────────────────────────────────────────────────────────

  private async processarDocx(
    file: Express.Multer.File,
  ): Promise<ResultadoArquivo> {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      const texto = result.value ?? '';
      return {
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tipo: 'DOCX',
        dados: this.extrairDados(texto),
        erro: null,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao parsear DOCX "${file.originalname}": ${err.message}`);
      return {
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tipo: 'DOCX',
        dados: null,
        erro: `Falha ao ler o DOCX: ${err.message}`,
      };
    }
  }

  // ─── Extração de dados via regex ─────────────────────────────────────────

  extrairDados(texto: string): DadosExtraidos {
    const alertas: string[] = [];
    const endCliente = this.extrairEnderecoCliente(texto);
    const endEntrega = this.extrairEnderecoEntrega(texto);
    const { telefone, contatoNome } = this.extrairTelefoneEContato(texto);

    return {
      nomeCliente: this.extrairCliente(texto),
      cpfCnpj: this.extrairCpfCnpj(texto),
      valorTotal: this.extrairValor(texto),
      dataFechamento: this.extrairDataFechamento(texto),
      dataEntrega: this.extrairDataEntrega(texto),
      endereco_cliente: endCliente,
      endereco_cliente_partes: endCliente ? this.desmembrarEndereco(endCliente) : null,
      // Se entrega === cliente (ou só um foi encontrado), deixa entrega nulo
      endereco_entrega:
        endEntrega && endEntrega !== endCliente ? endEntrega : null,
      telefone,
      contato_nome: contatoNome,
      parcelas: this.extrairParcelas(texto),
      ambientes: this.extrairAmbientes(texto),
      ambientes_com_valor: this.extrairAmbientesComValor(texto),
      texto_bruto: texto,
      alertas,
    };
  }

  // Detecta se o documento é um orçamento (não um contrato)
  private isOrcamento(texto: string): boolean {
    return /^Cliente[:\s]/im.test(texto) || /Orçamento válido/i.test(texto) || /Proposta\s+\d+/i.test(texto);
  }

  // ─── Desmembra endereço completo em partes ─────────────────────────────────
  // Entrada: "Rua Conde Afonso Celso nº 619 Jardim Sumare São Paulo"
  //          "Rua Francisco Riccioni, 231 - Ribeirânia, Ribeirão Preto - SP, 14096-400"
  desmembrarEndereco(endereco: string): EnderecoPartes {
    let resto = endereco.trim();

    // CEP: 00000-000 ou 00000000
    const cepM = resto.match(/\b(\d{5}-?\d{3})\b/);
    const cep = cepM ? cepM[1].replace(/(\d{5})(\d{3})/, '$1-$2') : null;
    if (cep) resto = resto.replace(cepM![0], '').trim();

    // Estado: " - SP" ou ", SP" no final, ou "São Paulo" (estado por extenso)
    let estado: string | null = null;
    const estadoAbrevM = resto.match(/[,\s\-]+([A-Z]{2})\s*$/);
    if (estadoAbrevM) {
      estado = estadoAbrevM[1];
      resto = resto.slice(0, estadoAbrevM.index).trim();
    }

    // Cidade: geralmente aparece após vírgula ou traço, antes do estado
    // Padrões: "Ribeirão Preto - SP" / "Jardim Sumare São Paulo"
    // Tenta pegar a última segmentação depois de vírgula ou " - "
    let cidade: string | null = null;
    const separadores = resto.split(/\s*[-–,]\s*/);
    if (separadores.length >= 2) {
      const ultimoSeg = separadores[separadores.length - 1].trim();
      // Se o último segmento parece uma cidade (só letras/espaços, sem número)
      if (/^[A-Za-zÀ-ÿ\s]{3,}$/.test(ultimoSeg)) {
        cidade = ultimoSeg;
        resto = separadores.slice(0, -1).join(', ').trim();
      }
    }

    // Bairro: palavra(s) após o número e antes da cidade
    // "Rua X, 231 - Ribeirânia, Ribeirão Preto"
    let bairro: string | null = null;
    const bairroM = resto.match(/\d+\s*[-,]\s*([A-Za-zÀ-ÿ\s]{3,40}?)(?:\s*[-,]|$)/);
    if (bairroM?.[1]) {
      const candidatoBairro = bairroM[1].trim();
      if (!/^(de|do|da|dos|das)$/i.test(candidatoBairro)) {
        bairro = candidatoBairro;
        resto = resto.slice(0, bairroM.index! + bairroM[0].indexOf(bairroM[1])).trim();
      }
    }

    // Número: "nº 619" / "N° 231" / ", 231"
    let numero: string | null = null;
    let logradouro: string | null = null;

    const numExplicitoM = resto.match(/\bn[º°o]?\s*(\d+)(.*)/i);
    if (numExplicitoM) {
      numero = numExplicitoM[1];
      const aposNumero = numExplicitoM[2].trim();
      // Tudo antes do número é logradouro
      logradouro = resto.slice(0, numExplicitoM.index).replace(/[,\-\s]+$/, '').trim() || null;
      // Tudo depois do número (sem separadores) pode ser bairro+cidade sem vírgula
      // Ex: "Jardim Sumare São Paulo" — pega primeiro bloco como bairro, resto como cidade
      if (!bairro && !cidade && aposNumero.length > 2) {
        const palavras = aposNumero.trim().split(/\s+/);
        if (palavras.length >= 2) {
          // Heurística: últimas 2+ palavras = cidade, primeiras = bairro
          const metade = Math.ceil(palavras.length / 2);
          bairro = palavras.slice(0, metade).join(' ') || null;
          cidade = palavras.slice(metade).join(' ') || null;
          if (!cidade) { cidade = bairro; bairro = null; }
        } else {
          cidade = aposNumero.trim();
        }
      }
    } else {
      const numM = resto.match(/,?\s*(\d+)\s*(?:[-,]|$)/);
      if (numM) {
        numero = numM[1];
        logradouro = resto.slice(0, numM.index).replace(/[,\-\s]+$/, '').trim() || null;
      } else {
        logradouro = resto.replace(/[,\-\s]+$/, '').trim() || null;
      }
    }

    return { logradouro, numero, bairro, cidade, estado, cep };
  }

  // ─── Isola o bloco do CONTRATANTE (cliente) no texto ───────────────────
  //
  // O contrato da A Casa Planejados é em prosa corrida:
  // "...empresa A Casa... CPF 400.xxx CONTRATADA, e do outro lado,
  //  SPE Egydio... CNPJ 47.xxx residente na Rua Conde Afonso...
  //  doravante denominado CONTRATANTE..."
  //
  // Estratégia: pega o trecho entre "e do outro lado" (ou "outro lado,")
  // e "CLÁUSULA" — que é onde fica o cliente.

  private blocoContratante(texto: string, permitirFallbackTextoCompleto = true): string {
    // Formato orçamento: bloco iniciado por "Cliente:"
    // Limita o recorte para evitar capturar cabeçalho/rodapé da empresa.
    const clienteRe =
      /Cliente[:\s]+(.+?)(?:Orçamento válido|Valor Total|Condições|Forma de Pagamento|Observa(?:ç|c)[õo]es|$)/is;
    const clienteM = texto.match(clienteRe);
    if (clienteM?.[1] && clienteM[1].length > 20) return clienteM[1].trim();

    // Formato prosa: "e do outro lado, [CLIENTE] ... CONTRATANTE"
    const prosaRe = /e do outro lado[,\s]+(.+?)(?:CL[AÁ]USULA|§|PRIMEIRO|$)/is;
    const prosaM = texto.match(prosaRe);
    if (prosaM?.[1] && prosaM[1].length > 20) return prosaM[1].trim();

    // Formato bloco: "CONTRATANTE:\n[dados]"
    const blocoRe = /CONTRATANTE[:\s]*\n(.+?)(?:CL[AÁ]USULA|OBJETO|§|$)/is;
    const blocoM = texto.match(blocoRe);
    if (blocoM?.[1] && blocoM[1].length > 20) return blocoM[1].trim();

    // Formato "CONTRATANTE:" inline
    const inlineRe = /CONTRATANTE[:\s]+(.{20,600}?)(?:CL[AÁ]USULA|§|$)/is;
    const inlineM = texto.match(inlineRe);
    if (inlineM?.[1]) return inlineM[1].trim();

    return permitirFallbackTextoCompleto ? texto : '';
  }

  // ─── Regex helpers ───────────────────────────────────────────────────────

  private extrairCliente(texto: string): string | null {
    const bloco = this.blocoContratante(texto);

    const padroes = [
      // Orçamento: "Cliente: Nome – Descrição" ou "Cliente: Nome"
      /^Cliente[:\s]+([A-ZÀ-Ú][a-zA-ZÀ-ÿ0-9\s\-–]{3,80}?)(?:\n|Endere[çc]o|Contato|CPF|RG|$)/im,
      // Prosa contrato: "do outro lado, NOME inscrito/residente/doravante"
      /^([A-ZÀ-Ú][A-ZÀ-ÿa-z\s\-]{3,80}?)\s+(?:inscrito|residente|portador|doravante|CPF|CNPJ)/im,
      // Bloco contrato: "CONTRATANTE: Nome" na mesma linha
      /CONTRATANTE[:\s]+([A-ZÀ-Ú][a-zA-ZÀ-ÿ\s\-]{3,60}?)(?:\n|,|CPF|RG|inscrito)/i,
    ];

    for (const re of padroes) {
      const m = bloco.match(re);
      const candidato = m?.[1]?.trim().replace(/\s+/g, ' ');
      if (!candidato || candidato.length < 4) continue;
      const upper = candidato.toUpperCase();
      if (NOMES_EMPRESA.some((n) => upper.includes(n))) continue;
      return candidato;
    }
    return null;
  }

  private extrairCpfCnpj(texto: string): string | null {
    const bloco = this.blocoContratante(texto);

    // Prioridade 1: CNPJ explicitamente no bloco do contratante
    const cnpjRe = /CNPJ\s+(?:sob o\s+)?n[oº°]?\s*([\d.\/\-]{14,20})/i;
    const cnpjM = bloco.match(cnpjRe);
    if (cnpjM?.[1]) return cnpjM[1].replace(/[^\d.\/\-]/g, '');

    // Prioridade 2: CPF explicitamente no bloco do contratante
    const cpfRe = /CPF\s+(?:sob o\s+)?n[oº°]?\s*([\d.\-]{11,14})/i;
    const cpfM = bloco.match(cpfRe);
    if (cpfM?.[1]) return cpfM[1];

    // Prioridade 3: qualquer CNPJ formatado no bloco
    const cnpjFmt = bloco.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    if (cnpjFmt?.[1]) return cnpjFmt[1];

    // Prioridade 4: qualquer CPF formatado no bloco
    const cpfFmt = bloco.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})/);
    if (cpfFmt?.[1]) return cpfFmt[1];

    return null;
  }

  private extrairValor(texto: string): number | null {
    // Captura padrões: "Total: R$ 34.600,00" / "valor de R$ 33.500,00"
    const padroes = [
      /(?:Total|TOTAL|Valor Total|Valor do Contrato|valor de|Preço Total)[:\s]*R\$\s*([\d.,]+)/i,
      /R\$\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/,
    ];
    const valores: number[] = [];
    for (const re of padroes) {
      const matches = [...texto.matchAll(new RegExp(re.source, 'gi'))];
      for (const m of matches) {
        const raw = m[1];
        const num = this.parseBRL(raw);
        if (num > 0) valores.push(num);
      }
    }
    if (!valores.length) return null;
    // Retorna o maior valor encontrado (geralmente é o total geral)
    return Math.max(...valores);
  }

  private extrairDataFechamento(texto: string): string | null {
    // Formato orçamento: "Data: 15/01/2026" ou "Data: 15-01-2026"
    const dataSimples = /[Dd]ata[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const dsM = texto.match(dataSimples);
    if (dsM) {
      const dia = dsM[1].padStart(2, '0');
      const mes = dsM[2].padStart(2, '0');
      return `${dsM[3]}-${mes}-${dia}`;
    }

    // Formato contrato: "Ribeirão Preto, 30 de janeiro de 2026"
    const re =
      /(?:Ribeir[aã]o Preto|S[aã]o Paulo|[A-Za-zÀ-ÿ\s]+),\s*(\d{1,2})\s+de\s+([a-záéíóúãõç]+)\s+de\s+(\d{4})/i;
    const m = texto.match(re);
    if (m) {
      const dia = m[1].padStart(2, '0');
      const mesNome = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const mes = MESES[mesNome] ?? null;
      const ano = m[3];
      if (mes) return `${ano}-${mes}-${dia}`;
    }
    return null;
  }

  private extrairDataEntrega(texto: string): string | null {
    const re =
      /(?:entrega|prazo de entrega|data de entrega)[:\s]*(\d{1,2})[\/\-\s](?:de\s+)?([a-záéíóúãõç]+|\d{1,2})[\/\-\s](?:de\s+)?(\d{2,4})/i;
    const m = texto.match(re);
    if (m) {
      const dia = m[1].padStart(2, '0');
      const mesParte = m[2];
      const ano =
        m[3].length === 2 ? `20${m[3]}` : m[3];

      // Mês pode ser numérico ou por extenso
      if (/^\d+$/.test(mesParte)) {
        return `${ano}-${mesParte.padStart(2, '0')}-${dia}`;
      }
      const mesNome = mesParte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const mes = MESES[mesNome];
      if (mes) return `${ano}-${mes}-${dia}`;
    }
    return null;
  }

  // Endereço residencial/cadastro do CONTRATANTE (cliente)
  private extrairEnderecoCliente(texto: string): string | null {
    // Opera sobre o bloco do CONTRATANTE para não pegar endereço da empresa
    const bloco = this.blocoContratante(texto, false);
    if (!bloco) return null;
    const END = '[A-Za-zÀ-ÿ0-9,\\s.°ºnNºª/\\-]{8,200}';
    const padroes = [
      // Orçamento/contrato com campo explícito
      new RegExp(`(?:^|\\n)\\s*[Ee]ndere[çc]o[:\\s]+(${END}?)(?:\\n|$)`, 'm'),
      // "residente e domiciliados na cidade de X na Rua Y nº Z" (padrão A Casa)
      new RegExp(`residente[s]?\\s+e\\s+domiciliad[oa][s]?\\s+(?:na cidade de\\s+[A-Za-zÀ-ÿ\\s]+?\\s+)?na\\s+(${END}?)(?:,\\s*doravante|\\s+doravante|\\n|$)`, 'im'),
      // "Residente à/na/ao Rua X, 123" ou "domiciliado à Rua X"
      new RegExp(`(?:[Rr]esidente|[Dd]omiciliad[oa])\\s+[àaA][o]?\\s+(${END}?)(?:\\n|doravante|$)`, 'm'),
      // depois de CPF/RG na mesma linha ou próxima linha
      new RegExp(`(?:CPF|RG)[^,\\n]*[,\\n]\\s*((?:Rua|Avenida|Av\\.|Alameda|Al\\.|Travessa)\\s+${END}?)(?:\\n|doravante|$)`, 'm'),
      // linha que começa com Rua/Av/Al dentro do bloco
      new RegExp(`^((?:Rua|Avenida|Av\\.|Alameda|Al\\.|Travessa|Rodovia)\\s+[A-Za-zÀ-ÿ0-9,\\s.°ºª/\\-]{6,150}?)(?:\\n|$)`, 'm'),
    ];
    const candidato = this.primeiroMatch(bloco, padroes);
    if (!candidato) return null;
    return this.enderecoPareceEmpresa(candidato) ? null : candidato;
  }

  // Endereço do imóvel/obra (entrega) — onde os móveis serão instalados
  private extrairEnderecoEntrega(texto: string): string | null {
    const END = '[A-Za-zÀ-ÿ0-9,\\s.°ºª/\\-]{8,200}';
    const padroes = [
      // "entregues na Rua X" (padrão A Casa Planejados — captura até fim de linha)
      /entregues?\s+na\s+([^\n]{8,200})/im,
      // "serão entregues no endereço: Rua X"
      new RegExp(`entregues?\\s+(?:no\\s+endere[çc]o[:\\s]+)?(${END}?)(?:\\n|$)`, 'im'),
      // "Endereço do imóvel: Rua X" / "Endereço da obra: Rua X"
      new RegExp(`[Ee]ndere[çc]o\\s+d[ao]\\s+(?:im[oó]vel|obra|instala[çc][aã]o)[:\\s]+(${END}?)(?:\\n|$)`, 'm'),
      // "situado(a) à/na/ao Rua X"
      new RegExp(`[Ss]ituad[oa]\\s+[àaA][o]?\\s+(${END}?)(?:\\n|$)`, 'm'),
      // "localizado(a) à/na/ao Rua X"
      new RegExp(`[Ll]ocalizado[a]?\\s+[àaA][o]?\\s+(${END}?)(?:\\n|$)`, 'm'),
      // "endereço de entrega: Rua X"
      new RegExp(`[Ee]ndere[çc]o\\s+de\\s+entrega[:\\s]+(${END}?)(?:\\n|$)`, 'm'),
      // Orçamento: "Endereço: Rua X" (quando não há contrato, endereço é do imóvel)
      new RegExp(`^[Ee]ndere[çc]o[:\\s]+(${END}?)(?:\\n|$)`, 'm'),
    ];
    return this.primeiroMatch(texto, padroes);
  }

  private primeiroMatch(texto: string, padroes: RegExp[]): string | null {
    for (const re of padroes) {
      const m = texto.match(re);
      const candidato = m?.[1]?.trim();
      if (candidato && candidato.length >= 8) return candidato;
    }
    return null;
  }

  private enderecoPareceEmpresa(endereco: string): boolean {
    const upper = endereco.toUpperCase();
    if (NOMES_EMPRESA.some((n) => upper.includes(n))) return true;
    if (MARCADORES_EMPRESA_ENDERECO.some((m) => upper.includes(m))) return true;
    return false;
  }

  private extrairTelefoneEContato(texto: string): { telefone: string | null; contatoNome: string | null } {
    // Padrão de telefone brasileiro válido:
    //   (16) 99126-9498  |  16 99126-9498  |  (16)99126-9498  |  16 3333-4444
    // Exige DDD (2 dígitos) + separador opcional + corpo com hífen obrigatório
    const FONE_RE = /(?:\(\d{2}\)|\b\d{2})[\s]?\d{4,5}-\d{4}/;

    const bloco = this.blocoContratante(texto, false);
    const candidatos = bloco ? [bloco] : [];

    for (const fonte of candidatos) {
      if (!fonte) continue;

      // Orçamento: "Contato: Catharina 16 99126-9498" → nome + telefone
      const contatoComNomeRe = new RegExp(
        `[Cc]ontato[:\\s]+([A-Za-zÀ-ÿ]+(?:\\s+[A-Za-zÀ-ÿ]+)?)\\s+(${FONE_RE.source})`,
      );
      const cnM = fonte.match(contatoComNomeRe);
      if (cnM) {
        return { contatoNome: cnM[1].trim(), telefone: cnM[2].trim() };
      }

      // "Contato: (16) 99126-9498" ou "Tel: 16 3333-4444" sem nome
      const explicitoRe = new RegExp(
        `(?:[Tt]el(?:efone)?|[Cc]ontato|[Ff]one|[Cc]elular|[Ww]hats)[:\\s]+(${FONE_RE.source})`,
      );
      const explM = fonte.match(explicitoRe);
      if (explM?.[1]) return { telefone: explM[1].trim(), contatoNome: null };

      // Qualquer telefone com DDD + hífen obrigatório (evita capturar sequências aleatórias)
      const matches = [...fonte.matchAll(new RegExp(FONE_RE.source, 'g'))];
      if (matches.length) return { telefone: matches[0][0].trim(), contatoNome: null };
    }
    return { telefone: null, contatoNome: null };
  }

  // ─── Extrai parcelas de pagamento do contrato ────────────────────────────
  // Ex: "R$ 11.500,00 por transferência bancária PIX CNPJ ... na data do dia 06/02/26"
  //     "cheque no valor R$ 11.000,00 para o dia 27/02/26"
  private extrairParcelas(texto: string): ParcelaPagamento[] {
    const parcelas: ParcelaPagamento[] = [];

    // Normaliza o texto para facilitar busca
    const linhas = texto.replace(/\r\n/g, '\n');

    // Padrão genérico: R$ valor ... (forma) ... (data)
    // Captura blocos com valor monetário + forma de pagamento + data
    const blocoRe = /R\$\s*([\d.,]+)\s*[^.]{0,200}?(?:para o dia|na data do dia|em|até o dia|data[:\s]+)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/gi;

    for (const m of linhas.matchAll(blocoRe)) {
      const valor = this.parseBRL(m[1]);
      if (valor <= 0) continue;

      const dia = m[2].padStart(2, '0');
      const mes = m[3].padStart(2, '0');
      const ano = m[4].length === 2 ? `20${m[4]}` : m[4];
      const vencimento = `${ano}-${mes}-${dia}`;

      // Extrai a forma de pagamento do trecho
      const trecho = m[0].toLowerCase();
      let forma = 'OUTROS';
      if (/pix/i.test(trecho)) forma = 'PIX';
      else if (/cheque/i.test(trecho)) forma = 'CHEQUE';
      else if (/cart[ãa]o|credit|d[ée]bito/i.test(trecho)) forma = 'CARTAO';
      else if (/boleto/i.test(trecho)) forma = 'BOLETO';
      else if (/transfer[eê]ncia|ted|doc/i.test(trecho)) forma = 'TRANSFERENCIA';
      else if (/dinheiro|espécie|especie/i.test(trecho)) forma = 'DINHEIRO';

      parcelas.push({
        valor,
        forma,
        vencimento,
        descricao: m[0].trim().substring(0, 200),
      });
    }

    // Se não encontrou parcelas datadas, tenta capturar apenas valores + formas sem data
    if (!parcelas.length) {
      const semDataRe = /(?:pix|cheque|transfer[eê]ncia|boleto|dinheiro)[^.]{0,100}R\$\s*([\d.,]+)|R\$\s*([\d.,]+)[^.]{0,100}(?:pix|cheque|transfer[eê]ncia|boleto|dinheiro)/gi;
      for (const m of linhas.matchAll(semDataRe)) {
        const raw = m[1] || m[2];
        const valor = this.parseBRL(raw);
        if (valor <= 0) continue;
        const trecho = m[0].toLowerCase();
        let forma = 'OUTROS';
        if (/pix/i.test(trecho)) forma = 'PIX';
        else if (/cheque/i.test(trecho)) forma = 'CHEQUE';
        else if (/transfer[eê]ncia/i.test(trecho)) forma = 'TRANSFERENCIA';
        else if (/boleto/i.test(trecho)) forma = 'BOLETO';
        else if (/dinheiro/i.test(trecho)) forma = 'DINHEIRO';
        parcelas.push({ valor, forma, vencimento: null, descricao: m[0].trim().substring(0, 200) });
      }
    }

    return parcelas;
  }

  // ─── Extrai ambientes com valores individuais (formato orçamento) ────────
  //
  // Formatos suportados:
  //   "Cozinha | Área de Serviço  R$ 8.500,00"
  //   "Sala\nR$ 4.200,00"
  //   "Suite   R$ 12.000,00"
  //   "Item/ ambiente: Cozinha  R$ 8.500,00"
  //
  // Retorna lista vazia se nenhum ambiente tiver valor (ex: contrato sem detalhamento)

  private extrairAmbientesComValor(texto: string): AmbienteItem[] {
    const resultado: AmbienteItem[] = [];
    const encontrados = new Set<string>();

    // Normaliza quebras de linha
    const linhas = texto.replace(/\r\n/g, '\n').split('\n');

    // Padrão: linha com nome de ambiente seguido de valor na mesma linha ou na próxima
    // Ex: "Cozinha | Área de Serviço   R$ 8.500,00"
    // Ex: "Suite"  seguido de "R$ 12.000,00" na próxima linha
    const nomeAmbRe = new RegExp(
      `(${AMBIENTES_CONHECIDOS.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'i',
    );
    const valorRe = /R\$\s*([\d.,]+)/;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const ambM = linha.match(nomeAmbRe);
      if (!ambM) continue;

      const nomeAmb = ambM[1].charAt(0).toUpperCase() + ambM[1].slice(1);

      // Tenta pegar valor na mesma linha
      let valorStr = linha.match(valorRe)?.[1] ?? null;

      // Se não achou na mesma linha, verifica próximas 2 linhas
      if (!valorStr) {
        for (let j = i + 1; j <= i + 2 && j < linhas.length; j++) {
          const proxima = linhas[j].trim();
          // Para se encontrar outro ambiente
          if (nomeAmbRe.test(proxima) && !valorRe.test(proxima)) break;
          const m = proxima.match(valorRe);
          if (m) { valorStr = m[1]; break; }
        }
      }

      if (!valorStr) continue; // ambiente sem valor — ignora
      const valor = this.parseBRL(valorStr);
      if (valor <= 0) continue;

      // Evita duplicatas (ex: "Cozinha" aparecendo em várias linhas)
      const chave = nomeAmb.toLowerCase();
      if (encontrados.has(chave)) continue;
      encontrados.add(chave);

      resultado.push({ nome: nomeAmb, valor });
    }

    return resultado;
  }

  private extrairAmbientes(texto: string): string[] {
    const encontrados = new Set<string>();
    for (const amb of AMBIENTES_CONHECIDOS) {
      const re = new RegExp(`\\b${amb}\\b`, 'i');
      if (re.test(texto)) {
        // Normaliza para capitalizado
        encontrados.add(amb.charAt(0).toUpperCase() + amb.slice(1));
      }
    }
    return Array.from(encontrados);
  }

  // ─── Conversão BRL → número ──────────────────────────────────────────────

  private parseBRL(raw: string): number {
    // "34.600,00" → 34600.00 | "34600.00" → 34600.00
    const clean = raw.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  }

  // ─── Consolidação ────────────────────────────────────────────────────────

  private consolidar(resultados: ResultadoArquivo[]): DadosExtraidos {
    const dadosLista = resultados
      .filter((r) => r.dados !== null)
      .map((r) => r.dados as DadosExtraidos);

    const primeiroNaoNulo = <T>(arr: Array<T | null>): T | null =>
      arr.find((v) => v !== null) ?? null;

    const todosAmbientes = new Set<string>();
    for (const d of dadosLista) {
      d.ambientes.forEach((a) => todosAmbientes.add(a));
    }

    // Valores encontrados em todos os arquivos (para alertas)
    const valoresEncontrados = dadosLista
      .map((d) => d.valorTotal)
      .filter((v): v is number => v !== null);

    return {
      nomeCliente: primeiroNaoNulo(dadosLista.map((d) => d.nomeCliente)),
      cpfCnpj: primeiroNaoNulo(dadosLista.map((d) => d.cpfCnpj)),
      // Usa o maior valor (orçamento pode ser maior que contrato)
      valorTotal: valoresEncontrados.length
        ? Math.max(...valoresEncontrados)
        : null,
      dataFechamento: primeiroNaoNulo(dadosLista.map((d) => d.dataFechamento)),
      dataEntrega: primeiroNaoNulo(dadosLista.map((d) => d.dataEntrega)),
      endereco_cliente: primeiroNaoNulo(dadosLista.map((d) => d.endereco_cliente)),
      endereco_cliente_partes: primeiroNaoNulo(dadosLista.map((d) => d.endereco_cliente_partes)),
      endereco_entrega: primeiroNaoNulo(dadosLista.map((d) => d.endereco_entrega)),
      telefone: primeiroNaoNulo(dadosLista.map((d) => d.telefone)),
      contato_nome: primeiroNaoNulo(dadosLista.map((d) => d.contato_nome)),
      // Usa parcelas do arquivo com mais parcelas (geralmente o contrato)
      parcelas: dadosLista.reduce(
        (melhor, d) => (d.parcelas.length > melhor.length ? d.parcelas : melhor),
        [] as ParcelaPagamento[],
      ),
      // Usa ambientes_com_valor do arquivo com mais itens valorados (geralmente o orçamento)
      ambientes_com_valor: dadosLista.reduce(
        (melhor, d) => (d.ambientes_com_valor.length > melhor.length ? d.ambientes_com_valor : melhor),
        [] as AmbienteItem[],
      ),
      ambientes: Array.from(todosAmbientes),
      texto_bruto: '',
      alertas: [],
    };
  }

  // ─── Detecção de divergências entre documentos ───────────────────────────

  private detectarDivergencias(
    resultados: ResultadoArquivo[],
    _consolidado: DadosExtraidos,
  ): string[] {
    const alertas: string[] = [];
    const dadosLista = resultados
      .filter((r) => r.dados !== null)
      .map((r) => ({ nome: r.nome_original, dados: r.dados as DadosExtraidos }));

    // Verifica divergência de valor entre arquivos
    const valores = dadosLista
      .map((d) => ({ nome: d.nome, valor: d.dados.valorTotal }))
      .filter((v) => v.valor !== null);

    if (valores.length >= 2) {
      const unicos = new Set(valores.map((v) => v.valor));
      if (unicos.size > 1) {
        const lista = valores
          .map((v) => `${v.nome}: R$ ${v.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          .join(' | ');
        alertas.push(`⚠️ Divergência de valor entre documentos: ${lista}`);
      }
    }

    // Verifica divergência de ambientes entre arquivos
    if (dadosLista.length >= 2) {
      const [primeiro, ...resto] = dadosLista;
      for (const outro of resto) {
        const setA = new Set(primeiro.dados.ambientes);
        const setB = new Set(outro.dados.ambientes);
        const somenteEmA = [...setA].filter((a) => !setB.has(a));
        const somenteEmB = [...setB].filter((b) => !setA.has(b));

        if (somenteEmA.length || somenteEmB.length) {
          if (somenteEmA.length) {
            alertas.push(
              `⚠️ Ambiente(s) em "${primeiro.nome}" mas não em "${outro.nome}": ${somenteEmA.join(', ')}`,
            );
          }
          if (somenteEmB.length) {
            alertas.push(
              `⚠️ Ambiente(s) em "${outro.nome}" mas não em "${primeiro.nome}": ${somenteEmB.join(', ')}`,
            );
          }
        }
      }
    }

    return alertas;
  }
}
