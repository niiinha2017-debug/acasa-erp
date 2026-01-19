export function getBaseOriginFromApi(apiInstance) {
  const base = apiInstance?.defaults?.baseURL || ''
  return base.replace(/\/$/, '')
}
