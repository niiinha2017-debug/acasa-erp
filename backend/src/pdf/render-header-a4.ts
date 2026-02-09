//render-header-a4.ts

import * as path from 'path';
import * as fs from 'fs';

export function resolveAsset(relFromAssets: string) {
  // aceita "pdf\capa-a4.png" ou "pdf/capa-a4.png"
  const rel = String(relFromAssets || '').replace(/\\/g, '/');

  const candidates = [
    // quando cwd = backend
    path.resolve(process.cwd(), 'assets', rel),
    path.resolve(process.cwd(), 'dist', 'assets', rel),

    // quando cwd = raiz do repo
    path.resolve(process.cwd(), 'backend', 'assets', rel),
    path.resolve(process.cwd(), 'backend', 'dist', 'assets', rel),
  ];

  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      `Asset não encontrado: ${rel}\nTentativas:\n- ${candidates.join('\n- ')}`,
    );
  }
  return found;
}

export function renderHeaderA4Png(doc: any) {
  const headerPath = resolveAsset('pdf/header-a4.png');
  // Renderiza a imagem no topo
  doc.image(headerPath, 0, 0, { width: doc.page.width });

  // Aumente para 120 ou 130 se o header for pequeno,
  // ou mantenha 170 se ele for grande, mas garanta que o doc.y seja atualizado
  return 120;
}
