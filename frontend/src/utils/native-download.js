export function sanitizeDownloadName(name, fallback = 'arquivo') {
  const normalized = String(name || '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || fallback;
}

export async function saveBlobNativeOrBrowser(blob, filename) {
  const safeName = sanitizeDownloadName(filename);
  const isTauri =
    typeof window !== 'undefined' &&
    (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__);

  if (isTauri) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const targetPath = await save({
        defaultPath: safeName,
        title: 'Salvar arquivo',
      });
      if (targetPath) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        await writeFile(targetPath, bytes);
        return { ok: true, native: true };
      }
      return { ok: false, cancelled: true };
    } catch {
      // fallback web
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { ok: true, native: false };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

