import PDFDocument = require('pdfkit')
import * as path from 'path'

function safe(v: any) {
  return v ? String(v).trim() : ''
}

export function renderHeaderA4(doc: PDFKit.PDFDocument, empresa: any, title: string){
  // 1) Imagem do cabeçalho (papel timbrado)
  const headerPath = path.join(process.cwd(), 'assets', 'pdf', 'header-a4.png')
  doc.image(headerPath, 0, 0, { width: doc.page.width })

  // 2) Texto dinâmico por cima (ajuste XY conforme seu PNG)
  const tx = 360  // <-- onde começa o bloco de dados no canto direito
  let ty = 36

  doc.fillColor('#000')
  doc.font('Helvetica').fontSize(9)

  const cnpj = safe(empresa?.cnpj)
  const end  = safe(empresa?.endereco)
  const cep  = safe(empresa?.cep)
  const cidade = safe(empresa?.cidade)
  const uf = safe(empresa?.uf)
  const fone = safe(empresa?.telefone) || safe(empresa?.fone)
  const email = safe(empresa?.email)
  const insta = safe(empresa?.instagram)

  if (cnpj) { doc.text(`CNPJ: ${cnpj}`, tx, ty); ty += 12 }
  if (end)  { doc.text(`End: ${end}`, tx, ty, { width: 200 }); ty += 12 }
  const cidadeLinha = [cep && `CEP: ${cep}`, cidade, uf].filter(Boolean).join(' - ')
  if (cidadeLinha) { doc.text(cidadeLinha, tx, ty, { width: 200 }); ty += 12 }
  if (fone)  { doc.text(`Fone: ${fone}`, tx, ty); ty += 12 }
  if (email) { doc.text(`Email: ${email}`, tx, ty, { width: 200 }); ty += 12 }
  if (insta) { doc.text(`Instagram: ${insta}`, tx, ty); ty += 12 }

  // 3) Título + gerado em (central)
  doc.font('Helvetica-Bold').fontSize(16).text(title, 0, 120, { align: 'center' })
  doc.font('Helvetica').fontSize(8).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 0, 140, { align: 'center' })

  // 4) Retorna onde começa o conteúdo do PDF
  return 170
}
