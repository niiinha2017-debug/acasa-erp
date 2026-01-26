//header-empresa.ts

import PDFKitDoc from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'

function safe(v: any) {
  return v ? String(v).trim() : ''
}

// resolve SEMPRE dentro de assets (dev) e dist/assets (prod)
function resolveAsset(relFromAssets: string) {
  // relFromAssets exemplo: "pdf/header-a4.png"
  const candidates = [
    path.resolve(process.cwd(), 'assets', relFromAssets),
    path.resolve(process.cwd(), 'dist', 'assets', relFromAssets),
  ]

  const found = candidates.find((p) => fs.existsSync(p))
  if (!found) {
    throw new Error(
      `Asset não encontrado: ${relFromAssets}\nTentativas:\n- ${candidates.join('\n- ')}`
    )
  }

  return found
}

export function renderHeaderA4(doc: InstanceType<typeof PDFKitDoc>, empresa: any, title: string) 
 {
  // 1) Imagem do cabeçalho (papel timbrado)
  const headerPath = resolveAsset(path.join('pdf', 'header-a4.png'))
  doc.image(headerPath, 0, 0, { width: doc.page.width })

  // 2) Texto dinâmico (usando seu model Empresa)
  const tx = 360
  let ty = 36

  doc.fillColor('#000')
  doc.font('Helvetica').fontSize(9)

  const cnpj = safe(empresa?.cnpj)
  const email = safe(empresa?.email)
  const telefone = safe(empresa?.telefone)

  const logradouro = safe(empresa?.logradouro)
  const numero = safe(empresa?.numero)
  const bairro = safe(empresa?.bairro)
  const cidade = safe(empresa?.cidade)
  const uf = safe(empresa?.uf)
  const cep = safe(empresa?.cep)

  // monta endereço do jeito certo pro seu schema
  const endLinha = [logradouro, numero && `Nº ${numero}`, bairro].filter(Boolean).join(' - ')
  const cidadeLinha = [cep && `CEP: ${cep}`, cidade, uf].filter(Boolean).join(' - ')

  if (cnpj)      { doc.text(`CNPJ: ${cnpj}`, tx, ty); ty += 12 }
  if (endLinha)  { doc.text(`End: ${endLinha}`, tx, ty, { width: 200 }); ty += 12 }
  if (cidadeLinha) { doc.text(cidadeLinha, tx, ty, { width: 200 }); ty += 12 }
  if (telefone)  { doc.text(`Fone: ${telefone}`, tx, ty); ty += 12 }
  if (email)     { doc.text(`Email: ${email}`, tx, ty, { width: 200 }); ty += 12 }

  // 3) Título + gerado em
  doc.font('Helvetica-Bold').fontSize(16).text(title, 0, 120, { align: 'center' })
  doc.font('Helvetica').fontSize(8).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 0, 140, { align: 'center' })

  // 4) Onde começa o conteúdo
  return 170
}
