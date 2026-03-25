import { reactive } from 'vue'

export const debugLog = reactive([])

export function addDebugEntry(source, message, extra) {
  const ts = new Date().toISOString()
  let details = ''
  if (extra) {
    try {
      details = JSON.stringify(extra, null, 2)
    } catch {
      details = String(extra)
    }
  }
  debugLog.unshift({
    id: Date.now() + Math.random(),
    ts,
    source,
    message,
    details,
  })
}

