import * as path from 'path'
import * as fs from 'fs'

function resolveAsset(rel: string) {
  const candidates = [
    path.join(process.cwd(), rel),          // dev
    path.join(process.cwd(), 'dist', rel),  // prod
    path.join(__dirname, '..', '..', rel),  // fallback
  ]

  const found = candidates.find((p) => fs.existsSync(p))
  if (!found) throw new Error(`Asset não encontrado: ${rel}`)
  return found
}

export function renderHeaderA4(doc: any, title: string) {
  const headerPath = resolveAsset(path.join('assets', 'pdf', 'header-a4.png'))

  // 1) header (imagem)
  doc.image(headerPath, 0, 0, { width: doc.page.width })

  // 2) título
  doc.font('Helvetica-Bold').fontSize(16).text(title, 0, 120, { align: 'center' })
  doc.font('Helvetica').fontSize(8).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 0, 140, { align: 'center' })

  // 3) onde começa o conteúdo
  return 170
}
