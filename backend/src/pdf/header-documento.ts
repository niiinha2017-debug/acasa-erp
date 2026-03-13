/**
 * Cabeçalho reutilizável para documentos PDF: logo (opcional) + dados da empresa + título.
 * Usado em Plano de Corte e outros relatórios que precisam da identidade da empresa.
 */
import { renderHeaderA4Png } from './render-header-a4';

function safe(v: unknown): string {
  return v != null ? String(v).trim() : '';
}

function maskCnpj(val: string | null | undefined): string {
  const d = String(val ?? '').replace(/\D/g, '');
  if (d.length !== 14) return val ? String(val).trim() : '';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export type EmpresaParaHeader = {
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
} | null;

/**
 * Desenha o cabeçalho do documento: logo (se existir em assets/pdf/header-a4.png),
 * dados da empresa (nome, CNPJ, endereço) e o título do documento.
 * Retorna o Y a partir do qual o conteúdo do corpo deve começar.
 */
export function renderHeaderDocumento(
  doc: any,
  empresa: EmpresaParaHeader,
  title: string,
  opts?: { margin?: number },
): number {
  const margin = opts?.margin ?? 40;
  const pageWidth = doc.page.width;

  // 1) Logo (opcional) – se existir assets/pdf/header-a4.png
  const logoBottomY = renderHeaderA4Png(doc);

  let y = logoBottomY + 10;

  const nomeEmpresa = safe(empresa?.razao_social || empresa?.nome_fantasia) || 'Empresa';
  const cnpj = empresa?.cnpj ? maskCnpj(empresa.cnpj) : '';

  // 2) Dados da empresa (sempre, abaixo da logo ou no topo se não houver logo)
  doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold');
  doc.text(nomeEmpresa, margin, y, { width: pageWidth - 2 * margin });
  y += 14;

  if (cnpj) {
    doc.font('Helvetica').fontSize(9).fillColor('#64748b');
    doc.text(`CNPJ: ${cnpj}`, margin, y);
    y += 12;
  }

  const parts = [
    [empresa?.logradouro, empresa?.numero && `Nº ${empresa.numero}`, empresa?.bairro].filter(Boolean).join(' – '),
    [empresa?.cep && `CEP: ${empresa.cep}`, empresa?.cidade, empresa?.uf].filter(Boolean).join(' – '),
    empresa?.telefone && `Fone: ${empresa.telefone}`,
    empresa?.email && `E-mail: ${empresa.email}`,
  ].filter(Boolean) as string[];

  if (parts.length > 0) {
    doc.fontSize(8).fillColor('#64748b');
    for (const line of parts.slice(0, 2)) {
      doc.text(line, margin, y, { width: pageWidth - 2 * margin });
      y += 10;
    }
  }

  y += 6;

  // 3) Título do documento (ex.: "PLANO DE CORTE #85")
  doc.fillColor('#111').fontSize(16).font('Helvetica-Bold');
  doc.text(title, margin, y, {
    width: pageWidth - 2 * margin,
    align: 'center',
  });
  y += 24;

  // 4) Linha separadora
  doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
  y += 14;

  return y;
}
